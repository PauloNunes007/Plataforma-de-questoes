import { createAdminClient } from "@/lib/supabase/admin";
import {
  baseLiquidaCentavos,
  competenciaDe,
  DIAS_LIBERACAO,
} from "@/lib/afiliados/afiliados";

// O lado ESCRITA do programa de parceiros: transformar uma cobrança aprovada
// em comissão, e um estorno em comissão cancelada.
//
// Mora num arquivo separado pela MESMA razão de lib/plano/boas-vindas.ts:
// `creditarCobranca` é o caminho do dinheiro do aluno, e nada pendurado nele
// pode lançar. Tudo aqui é engolido e logado — sem SUPABASE_SERVICE_ROLE_KEY,
// com o parceiro apagado no meio, com a rede caindo: nada disso pode
// transformar um pagamento aprovado numa tela de erro pro aluno que acabou de
// pagar. Uma comissão que falhou é um acerto de contas (o admin vê a venda em
// /admin/afiliados); um pagamento que falhou é um cliente perdido.
//
// A idempotência é do BANCO, não daqui: `afiliado_comissoes.referencia` tem
// índice único, e o webhook do Mercado Pago + o polling da tela /pro chegam
// pelos dois lados na mesma venda. Em JS isso seria uma corrida perdida.

/** `referencia` de uma cobrança real do gateway. */
export function refPagamento(assinaturaPagamentoId: string): string {
  return `pagamento:${assinaturaPagamentoId}`;
}

/** `referencia` de uma ativação manual do admin (não há cobrança no gateway). */
export function refManual(assinaturaId: string): string {
  return `manual:${assinaturaId}`;
}

/**
 * Registra a comissão de UMA cobrança, se o aluno tiver vindo de um parceiro
 * e ainda estiver dentro da janela.
 *
 * Nunca lança. Devolve o que aconteceu só pra quem quiser logar.
 */
export async function registrarComissaoIndicacao(params: {
  userId: string;
  referencia: string;
  valorBrutoCentavos: number;
}): Promise<{ registrada: boolean; motivo?: string }> {
  try {
    if (!params.valorBrutoCentavos || params.valorBrutoCentavos <= 0) {
      return { registrada: false, motivo: "valor zerado" };
    }

    const admin = createAdminClient();

    const { data: indicacao } = await admin
      .from("afiliado_indicacoes")
      .select("afiliado_id, janela_ate")
      .eq("user_id", params.userId)
      .maybeSingle();

    // O caso de 99% das vendas: aluno que chegou sozinho. Sai calado.
    if (!indicacao) return { registrada: false, motivo: "sem indicação" };

    // Janela vencida: o parceiro trouxe o aluno, a plataforma o manteve por
    // mais de um ano. A renovação de hoje é retenção, não aquisição.
    if (new Date(indicacao.janela_ate).getTime() < Date.now()) {
      return { registrada: false, motivo: "janela encerrada" };
    }

    // Parceiro desativado (saiu do programa, quebrou as regras): a indicação
    // continua no lugar — apagá-la reatribuiria o aluno no clique seguinte —
    // mas não gera mais comissão.
    const { data: afiliado } = await admin
      .from("afiliados")
      .select("id, ativo")
      .eq("id", indicacao.afiliado_id)
      .maybeSingle();
    if (!afiliado?.ativo) return { registrada: false, motivo: "parceiro inativo" };

    const agora = new Date();
    const liberadaEm = new Date(agora.getTime() + DIAS_LIBERACAO * 24 * 60 * 60 * 1000);

    const { error } = await admin.from("afiliado_comissoes").insert({
      afiliado_id: afiliado.id,
      user_id: params.userId,
      referencia: params.referencia,
      competencia: competenciaDe(agora),
      valor_bruto_centavos: params.valorBrutoCentavos,
      valor_base_centavos: baseLiquidaCentavos(params.valorBrutoCentavos),
      liberada_em: liberadaEm.toISOString(),
      status: "pendente",
    });

    if (error) {
      // 23505 = esta cobrança já virou comissão. Não é erro: é o índice único
      // fazendo o trabalho pelo qual existe (webhook + polling na mesma venda).
      if (error.code === "23505") return { registrada: false, motivo: "já registrada" };
      console.error("Comissão de parceiro não registrada:", error.message, params.referencia);
      return { registrada: false, motivo: error.message };
    }

    return { registrada: true };
  } catch (e) {
    console.error("Erro inesperado ao registrar comissão de parceiro:", e);
    return { registrada: false, motivo: "erro inesperado" };
  }
}

/**
 * Cancela a comissão de uma cobrança estornada. Chamada do arrependimento
 * (lib/plano/actions.ts): o dinheiro voltou pro aluno, então não há venda a
 * dividir.
 *
 * Uma comissão JÁ PAGA não é mexida — só logada. Na prática isso não deve
 * acontecer (a liberação usa o mesmo prazo do arrependimento, então o estorno
 * chega antes do repasse), e se acontecer, cobrar de volta um Pix já enviado é
 * decisão comercial, não algo que o código deva fazer sozinho.
 */
export async function cancelarComissaoPorReferencia(
  referencia: string,
  motivo: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: comissao } = await admin
      .from("afiliado_comissoes")
      .select("id, status")
      .eq("referencia", referencia)
      .maybeSingle();
    if (!comissao) return;

    if (comissao.status === "paga") {
      console.warn(
        "Estorno de venda cuja comissão JÁ foi repassada ao parceiro:",
        referencia,
        "— acertar manualmente no próximo fechamento.",
      );
      return;
    }

    await admin
      .from("afiliado_comissoes")
      .update({ status: "cancelada", motivo_cancelamento: motivo.slice(0, 500) })
      .eq("id", comissao.id)
      .in("status", ["pendente", "aprovada"]);
  } catch (e) {
    console.error("Erro ao cancelar comissão de parceiro:", e);
  }
}

/**
 * Promove a 'aprovada' toda comissão pendente cujo prazo de arrependimento já
 * passou. Roda de forma preguiçosa — na abertura do painel do parceiro e no
 * fechamento do mês —, no mesmo espírito do rollover da liga (`questlyGarantirSemanaLiga`):
 * não há cron pra isso, e não precisa haver, porque quem se importa com o
 * estado é justamente quem está olhando pra ele.
 *
 * Só toca em comissão sem repasse associado.
 */
export async function aprovarComissoesVencidas(afiliadoId?: string): Promise<number> {
  try {
    const admin = createAdminClient();
    let q = admin
      .from("afiliado_comissoes")
      .update({ status: "aprovada" })
      .eq("status", "pendente")
      .lte("liberada_em", new Date().toISOString())
      .is("pagamento_id", null);
    if (afiliadoId) q = q.eq("afiliado_id", afiliadoId);

    const { data, error } = await q.select("id");
    if (error) {
      console.error("Erro ao aprovar comissões vencidas:", error.message);
      return 0;
    }
    return data?.length ?? 0;
  } catch (e) {
    console.error("Erro inesperado ao aprovar comissões vencidas:", e);
    return 0;
  }
}
