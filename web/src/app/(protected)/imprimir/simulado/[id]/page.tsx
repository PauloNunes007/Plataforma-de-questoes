import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ehPro } from "@/lib/plano/plano";
import { carregarSimulado } from "@/lib/simulados/simulados-data";
import { lerCodigoProva, rotuloProva } from "@/lib/simulados/provas-oficiais";
import { rotuloDuracao } from "@/lib/simulados/constantes";
import { FolhaImpressao } from "@/components/imprimir/folha-impressao";
import { PortaPro } from "@/components/imprimir/porta-pro";

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

  const partes = simulado.prova_codigo ? lerCodigoProva(simulado.prova_codigo) : null;
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
      emailAluno={user.email ?? "conta sem e-mail"}
      nomeAluno={perfil?.nome ?? null}
      voltarHref={`/simulados/${simulado.id}`}
      voltarRotulo="Voltar pro simulado"
      permitirRecorte={false}
      // Molde de prova: cabeçalho centrado, filete duplo, "QUESTÃO 01".
      // A folha de um simulado precisa parecer a prova que ela simula — ver
      // `VarianteFolha` em components/imprimir/folha-prova.tsx.
      variante="prova"
    />
  );
}
