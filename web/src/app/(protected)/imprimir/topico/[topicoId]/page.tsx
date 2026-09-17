import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ehPro } from "@/lib/plano/plano";
import { lerPaginado } from "@/lib/supabase/paginado";
import type { Pergunta } from "@/lib/questao/types";
import { FolhaImpressao } from "@/components/imprimir/folha-impressao";
import { PortaCota, PortaPro } from "@/components/imprimir/porta-pro";
import { cortarParaPdf, registrarExportacao } from "@/lib/imprimir/cota";
import { avisoDaCota } from "@/lib/imprimir/aviso-cota";
import { PDF_MES_PRO, PDF_SEMANA_PRO } from "@/lib/plano/limites";

export const metadata: Metadata = {
  title: "Imprimir lista do tópico",
};

export const dynamic = "force-dynamic";

// Imprimir a lista de um TÓPICO sem precisar começá-la no app.
//
// A rota da missão (`/imprimir/[missaoId]`) só existe depois que o aluno
// apertou "Começar" — mas quem está navegando o Banco de Questões pra montar o
// material de estudo do fim de semana quer o PDF ANTES de responder qualquer
// coisa. Sem isto, imprimir custava criar uma missão que ele não ia usar.
//
// O recorte é o mesmo da prática livre (lib/disciplinas/actions.ts): questões
// do tópico, `desafio = false`. A ordem é por `id` (estável), então reimprimir
// dá a mesma folha — o número da questão no papel precisa significar a mesma
// coisa em duas cópias da mesma lista.
export default async function ImprimirTopicoPage({
  params,
}: {
  params: Promise<{ topicoId: string }>;
}) {
  const { topicoId } = await params;
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em, nome")
    .eq("id", user.id)
    .maybeSingle();

  if (!ehPro(perfil)) return <PortaPro contexto="lista" />;

  const { data: topico } = await supabase
    .from("topicos")
    .select("id, nome, materias ( nome )")
    .eq("id", topicoId)
    .maybeSingle();

  if (!topico) {
    return (
      <div className="casca-leitura flex min-h-[70vh] items-center justify-center">
        <p className="text-[13.5px] text-muted-foreground">Esse tópico não foi encontrado.</p>
      </div>
    );
  }

  const questoes = await lerPaginado<Pergunta>(() =>
    supabase.from("questions").select("*").eq("topic_id", topicoId).eq("desafio", false),
  );

  if (questoes.length === 0) {
    return (
      <div className="casca-leitura flex min-h-[70vh] items-center justify-center">
        <p className="text-[13.5px] text-muted-foreground">Esse tópico não tem questões pra imprimir.</p>
      </div>
    );
  }

  const mat = topico.materias as { nome: string } | { nome: string }[] | null;
  const materiaNome = (Array.isArray(mat) ? mat[0]?.nome : mat?.nome) ?? null;

  // Esta é a rota onde o corte pesa: a lista de um tópico passa fácil de 100
  // questões, e sem ele uma única exportação levaria metade de uma disciplina.
  const { folha, cortadas } = cortarParaPdf(questoes);

  const cota = await registrarExportacao({
    userId: user.id,
    tipo: "topico",
    id: topicoId,
    questoes: folha.length,
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

  return (
    <FolhaImpressao
      titulo={topico.nome ?? "Lista de exercícios"}
      disciplina={materiaNome}
      questoes={folha}
      avisoCota={avisoDaCota(cota, cortadas)}
      emailAluno={user.email ?? "conta sem e-mail"}
      nomeAluno={perfil?.nome ?? null}
      voltarHref="/questoes"
      voltarRotulo="Voltar pro banco de questões"
    />
  );
}
