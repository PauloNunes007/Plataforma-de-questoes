import { createAdminClient } from "@/lib/supabase/admin";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { PDF_MES_PRO, PDF_QUESTOES_MAX, PDF_SEMANA_PRO } from "@/lib/plano/limites";
import { ehAdmin } from "@/lib/admin/auth";

// A COTA DE EXPORTAÇÃO EM PDF — o único teto que vale também pro Pro.
//
// O porquê está em lib/plano/limites.ts (o resumo: a folha impressa sobrevive
// ao fim da assinatura, então exportar é a única porta por onde o conteúdo sai
// de vez) e a forma da tabela em supabase_cota_pdf.sql.
//
// Três decisões que valem entender antes de mexer:
//
// 1. **O registro acontece no RENDER da página, não no clique de baixar.**
//    Parece tarde demais — o aluno pode fechar a aba sem gerar arquivo nenhum
//    — mas é o único ponto que o servidor controla: o PDF é montado NO
//    APARELHO dele (lib/imprimir/gerar-pdf.ts), a partir das questões que esta
//    página já mandou. No instante do render o conteúdo já saiu; cobrar depois
//    seria cobrar por um clique que o cliente pode simplesmente não dar.
//
// 2. **A chave é o DOCUMENTO, deduplicado por semana.** Reimprimir a mesma
//    lista cai na mesma linha e não consome nada. É o que separa o uso honesto
//    (mexer nas opções e gerar de novo) da extração (um documento novo por
//    tópico) sem precisar adivinhar a intenção de ninguém.
//
// 3. **Erro de infra libera.** Se o service_role não estiver configurado ou o
//    insert falhar, a exportação segue. Um bug de contabilidade não pode
//    derrubar um recurso que o aluno PAGOU; o custo de errar pra esse lado é
//    uma exportação a mais, e pro outro lado é um Pro sem o produto.

export type TipoDocumento = "missao" | "simulado" | "topico";

/** Chave estável do que foi exportado — ver `documento` em supabase_cota_pdf.sql. */
export function chaveDocumento(tipo: TipoDocumento, id: string): string {
  return `${tipo}:${id}`;
}

export type CotaPdf = {
  /** false = teto batido; a página mostra a parede em vez das questões. */
  liberado: boolean;
  /** Qual teto barrou (só quando `liberado` é false). */
  motivo?: "semana" | "mes";
  /** Já tinha sido exportado nesta semana — não consumiu nada. */
  reimpressao: boolean;
  usadasSemana: number;
  usadasMes: number;
  restanteSemana: number;
  restanteMes: number;
  /** Quando a cota da semana volta a encher (segunda-feira seguinte). */
  renovaEm: string;
};

const MES_DIAS = 30;

function proximaSegunda(hoje: Date): string {
  const d = new Date(hoje);
  d.setDate(d.getDate() + 7);
  return questlySegundaDaSemana(d);
}

/**
 * Registra uma exportação e diz se ela pode acontecer.
 *
 * Chamada DEPOIS do gate de Pro e DEPOIS de saber quantas questões a folha
 * tem. Idempotente por semana: o índice único (user_id, documento, semana) é o
 * que garante isso mesmo com duas abas abertas — não um filtro em JS.
 */
export async function registrarExportacao(params: {
  userId: string;
  /** E-mail da sessão — só pra liberar a cota da conta admin, nunca outro uso. */
  email?: string | null;
  tipo: TipoDocumento;
  id: string;
  questoes: number;
}): Promise<CotaPdf> {
  const hoje = new Date();

  // Conta do dono: exportação sem teto. Ainda registra a linha (telemetria),
  // só nunca deixa `usadasSemana`/`usadasMes` barrar o insert abaixo.
  const semTeto = ehAdmin(params.email);
  const semana = questlySegundaDaSemana(hoje);
  const documento = chaveDocumento(params.tipo, params.id);

  // Fail-open: sem service_role (dev sem .env completo) não há contabilidade,
  // e o recurso pago continua funcionando.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("Cota de PDF sem service_role — exportação liberada sem contagem:", e);
    return liberadoSemContagem(hoje);
  }

  const desdeMes = new Date(hoje.getTime() - MES_DIAS * 24 * 60 * 60 * 1000);

  const [{ data: jaFeita }, { count: naSemana }, { count: noMes }] = await Promise.all([
    admin
      .from("pdf_exportacoes")
      .select("id")
      .eq("user_id", params.userId)
      .eq("documento", documento)
      .eq("semana", semana)
      .maybeSingle(),
    admin
      .from("pdf_exportacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .eq("semana", semana),
    admin
      .from("pdf_exportacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .gte("criada_em", desdeMes.toISOString()),
  ]);

  const usadasSemana = naSemana ?? 0;
  const usadasMes = noMes ?? 0;

  const resumo = (extra: Partial<CotaPdf>): CotaPdf => ({
    liberado: true,
    reimpressao: false,
    usadasSemana,
    usadasMes,
    restanteSemana: Math.max(0, PDF_SEMANA_PRO - usadasSemana),
    restanteMes: Math.max(0, PDF_MES_PRO - usadasMes),
    renovaEm: proximaSegunda(hoje),
    ...extra,
  });

  // Reimpressão: a linha desta semana já existe. Não consome, não checa teto —
  // o aluno já pagou por este documento, e travá-lo aqui seria tirar dele algo
  // que ele já tem aberto na outra aba.
  if (jaFeita) return resumo({ reimpressao: true });

  if (!semTeto) {
    if (usadasSemana >= PDF_SEMANA_PRO) return resumo({ liberado: false, motivo: "semana" });
    if (usadasMes >= PDF_MES_PRO) return resumo({ liberado: false, motivo: "mes" });
  }

  const { error } = await admin.from("pdf_exportacoes").insert({
    user_id: params.userId,
    documento,
    semana,
    questoes: Math.max(0, Math.min(params.questoes, PDF_QUESTOES_MAX)),
  });

  if (error) {
    // 23505 = o índice único falou: outra aba registrou o mesmo documento no
    // meio do caminho. Não é erro — é a dedupe funcionando.
    if (error.code === "23505") return resumo({ reimpressao: true });
    console.error("Cota de PDF: insert falhou — exportação liberada sem contagem:", error);
    return resumo({});
  }

  return resumo({
    usadasSemana: usadasSemana + 1,
    usadasMes: usadasMes + 1,
    restanteSemana: Math.max(0, PDF_SEMANA_PRO - usadasSemana - 1),
    restanteMes: Math.max(0, PDF_MES_PRO - usadasMes - 1),
  });
}

function liberadoSemContagem(hoje: Date): CotaPdf {
  return {
    liberado: true,
    reimpressao: true,
    usadasSemana: 0,
    usadasMes: 0,
    restanteSemana: PDF_SEMANA_PRO,
    restanteMes: PDF_MES_PRO,
    renovaEm: proximaSegunda(hoje),
  };
}

/**
 * O corte de quantas questões saem do servidor.
 *
 * O único dos três tetos que não depende de contagem: o que não foi enviado
 * não pode ser exportado, e ponto. Devolve também quanto ficou de fora, pra
 * folha poder DIZER isso em vez de silenciosamente entregar menos.
 */
export function cortarParaPdf<T>(questoes: T[]): { folha: T[]; cortadas: number } {
  if (questoes.length <= PDF_QUESTOES_MAX) return { folha: questoes, cortadas: 0 };
  return {
    folha: questoes.slice(0, PDF_QUESTOES_MAX),
    cortadas: questoes.length - PDF_QUESTOES_MAX,
  };
}
