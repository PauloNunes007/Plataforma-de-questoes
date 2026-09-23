import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ehPro } from "@/lib/plano/plano";
import { carregarSimulado } from "@/lib/simulados/simulados-data";
import { lerCodigoProva, rotuloProva } from "@/lib/simulados/provas-oficiais";
import { rotuloDuracao } from "@/lib/simulados/constantes";
import { formularioDaProva, linhaDaProva, semestreDe } from "@/lib/imprimir/formulario";
import { FolhaImpressao } from "@/components/imprimir/folha-impressao";
import { PortaCota, PortaPro } from "@/components/imprimir/porta-pro";
import { registrarExportacao } from "@/lib/imprimir/cota";
import { avisoDaCota } from "@/lib/imprimir/aviso-cota";
import { PDF_MES_PRO, PDF_SEMANA_PRO } from "@/lib/plano/limites";

export const metadata: Metadata = {
  title: "Imprimir simulado",
};

export const dynamic = "force-dynamic";

// A PROVA IMPRESSA do simulado híbrido.
//
// Aqui o recorte de quantidade não existe (`permitirRecorte={false}`): uma
// prova é o conjunto inteiro das suas questões, e imprimir "as 20 primeiras de
// 30" transformaria a simulação numa lista qualquer — a nota do papel não
// bateria com a do cartão-resposta digital. Pelo mesmo motivo o gabarito nasce
// DESLIGADO e o cartão-resposta em branco nasce LIGADO: quem imprime um
// simulado vai cronometrar, não conferir.
//
// A correção continua acontecendo no app: o aluno resolve no papel e transcreve
// as marcações no cartão-resposta digital (`/simulados/[id]?modo=cartao`), o
// que devolve exatamente o mesmo relatório e a mesma autópsia de erros do
// simulado feito na tela.
export default async function ImprimirSimuladoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em, nome")
    .eq("id", user.id)
    .maybeSingle();

  if (!ehPro(perfil)) return <PortaPro contexto="simulado" />;

  const simulado = await carregarSimulado(supabase, user, id);
  if (!simulado || simulado.perguntas.length === 0) {
    return (
      <div className="casca-leitura flex min-h-[70vh] items-center justify-center">
        <p className="text-[13.5px] text-muted-foreground">Esse simulado não foi encontrado.</p>
      </div>
    );
  }

  // Simulado NÃO é cortado: a prova é o conjunto das suas questões, e entregar
  // "as 60 primeiras de 80" quebraria a correspondência com o cartão-resposta
  // digital. Na prática o corte nunca encostaria aqui — SIMULADO_QTD_MAX é 60,
  // o mesmo número —, e é por isso que dá pra respeitar a prova sem abrir
  // exceção no teto.
  const cota = await registrarExportacao({
    userId: user.id,
    email: user.email,
    tipo: "simulado",
    id: simulado.id,
    questoes: simulado.perguntas.length,
  });

  if (!cota.liberado) {
    return (
      <PortaCota
        motivo={cota.motivo ?? "semana"}
        renovaEm={cota.renovaEm}
        tetoSemana={PDF_SEMANA_PRO}
        tetoMes={PDF_MES_PRO}
      />
    );
  }

  const partes = simulado.prova_codigo ? lerCodigoProva(simulado.prova_codigo) : null;

  // MOLDE DA FOLHA. Quando a linha sabe QUAL prova do semestre ela é — porque
  // reaplica uma prova real (`prova_codigo`) ou porque é a prova prevista do
  // Gêmeo da Banca (`prova_prevista`) — a folha sai no molde da prova de
  // faculdade: capa com cartão óptico, formulário e miolo em duas colunas.
  // Sem isso, segue o molde `prova` de sempre.
  const slotDaProva = simulado.prova_prevista ?? partes?.prova ?? null;
  const materiaNome =
    Object.values(simulado.contexto).find((c) => c.materia)?.materia ?? simulado.instituicao ?? null;
  const hoje = new Date();
  const moldeUff =
    slotDaProva && materiaNome
      ? {
          materiaNome,
          linhaProva: linhaDaProva({
            slot: slotDaProva,
            ano: partes?.ano ?? hoje.getFullYear(),
            semestre: partes?.semestre ?? semestreDe(hoje),
            data: hoje,
          }),
          duracaoRotulo: rotuloDuracao(simulado.duracao_min),
          formulario: formularioDaProva(materiaNome, slotDaProva),
        }
      : null;
  const contexto = [
    simulado.instituicao,
    partes ? rotuloProva(partes) : null,
    `Duração: ${rotuloDuracao(simulado.duracao_min)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <FolhaImpressao
      titulo={simulado.titulo}
      disciplina={simulado.instituicao}
      linhaContexto={contexto}
      instrucoes={[
        `A prova tem ${simulado.perguntas.length} questões e duração de ${rotuloDuracao(simulado.duracao_min)}.`,
        "Marque uma única alternativa por questão e use o cartão-resposta da última folha.",
        "Ao terminar, transcreva as marcações no Expectrum pra receber a correção, o tempo por questão e a análise de erros.",
      ]}
      questoes={simulado.perguntas}
      avisoCota={avisoDaCota(cota, 0)}
      emailAluno={user.email ?? "conta sem e-mail"}
      nomeAluno={perfil?.nome ?? null}
      voltarHref={`/simulados/${simulado.id}`}
      voltarRotulo="Voltar pro simulado"
      permitirRecorte={false}
      // `uff` quando dá pra saber qual prova do semestre é (réplica fiel da
      // folha da faculdade); `prova` no resto — ver `VarianteFolha` em
      // components/imprimir/folha-prova.tsx.
      variante={moldeUff ? "uff" : "prova"}
      moldeUff={moldeUff}
    />
  );
}
