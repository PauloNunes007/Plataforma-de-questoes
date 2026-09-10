import type { Metadata } from "next";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { questlyEhMestre, questlyEmbaralhar } from "@/lib/questly/shared";
import { QuestaoRunner } from "@/components/questao/questao-runner";
import { ehPro } from "@/lib/plano/plano";
import { ehAdmin } from "@/lib/admin/auth";
import type { Pergunta } from "@/lib/questao/types";
import { PARAM_ORIGEM, origemSegura, rotuloOrigem } from "@/lib/questao/navegacao";

export const metadata: Metadata = {
  title: "Missão",
};

function EmptyState({
  mensagem,
  voltarHref = "/dashboard",
}: {
  mensagem: string;
  voltarHref?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MapIcon size={20} strokeWidth={1.75} className="text-muted-foreground" />
      </span>
      <p className="text-sm leading-relaxed text-muted-foreground">{mensagem}</p>
      <Link
        href={voltarHref}
        className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
      >
        {rotuloOrigem(voltarHref)}
      </Link>
    </div>
  );
}

export default async function QuestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ missao?: string; de?: string }>;
}) {
  const params = await searchParams;
  const missaoId = params.missao;
  // De onde o aluno veio (ver lib/questao/navegacao.ts). Sem isso, todo "X"
  // caía no /dashboard — inclusive quando ele estava no meio de uma lista.
  const voltarHref = origemSegura(params[PARAM_ORIGEM]);

  if (!missaoId) {
    return (
      <EmptyState
        mensagem='Nenhuma missão selecionada. Volte e clique em "Cumprir missão".'
        voltarHref={voltarHref}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: missao, error: missaoError } = await supabase
    .from("missions")
    .select("*, subjects(nome)")
    .eq("id", missaoId)
    .eq("user_id", user.id)
    .single();

  if (missaoError || !missao) {
    return <EmptyState mensagem="Não foi possível encontrar essa missão." voltarHref={voltarHref} />;
  }
  if (missao.concluida) {
    return <EmptyState mensagem="Essa missão já foi concluída. Volte amanhã pra uma nova!" voltarHref={voltarHref} />;
  }

  const questionIds: string[] = missao.question_ids || [];
  const topicIds: string[] = missao.topic_ids || [];

  let questoes: Pergunta[] | null = null;
  if (questionIds.length > 0) {
    const { data } = await supabase.from("questions").select("*").in("id", questionIds);
    questoes = data;
  } else if (topicIds.length > 0) {
    const { data } = await supabase.from("questions").select("*").in("topic_id", topicIds);
    questoes = data;
  } else {
    return <EmptyState mensagem="Essa missão não tem tópicos definidos." voltarHref={voltarHref} />;
  }

  if (!questoes || questoes.length === 0) {
    return <EmptyState mensagem="Ainda não há questões cadastradas pros tópicos dessa missão." voltarHref={voltarHref} />;
  }

  const perguntas = questlyEmbaralhar(questoes).slice(0, missao.qtd_questoes || questoes.length);

  const perguntaIds = perguntas.map((p) => p.id);
  const topicIdsDasPerguntas = Array.from(new Set(perguntas.map((p) => p.topic_id).filter(Boolean))) as string[];

  // PERFORMANCE: estas cinco leituras dependem só das perguntas já sorteadas
  // (ou de nada) — em série eram quatro round-trips empilhados antes de a
  // primeira questão aparecer. Nenhuma usa o resultado da outra.
  const [
    { data: tentativasAnteriores },
    progsIniciais,
    { data: favoritosData },
    { data: notasData },
    { data: perfilPlano },
  ] = await Promise.all([
    // Histórico do aluno nessas questões: já acertou (paga metade) e já
    // tentou (erro repetido não paga mais a consolação) — as duas regras de
    // XP saem da MESMA leitura, ver questlyXpDaResposta.
    supabase
      .from("question_attempts")
      .select("question_id, correta")
      .eq("user_id", user.id)
      .in("question_id", perguntaIds),
    topicIdsDasPerguntas.length > 0
      ? supabase
          .from("aluno_topico_progresso")
          .select("topico_id, taxa_acerto, num_questoes_respondidas")
          .eq("user_id", user.id)
          .in("topico_id", topicIdsDasPerguntas)
          .then((r) => r.data)
      : Promise.resolve(null),
    supabase.from("question_favoritos").select("question_id").eq("user_id", user.id).in("question_id", perguntaIds),
    supabase.from("question_notes").select("question_id, nota").eq("user_id", user.id).in("question_id", perguntaIds),
    supabase.from("profiles").select("plano, plano_expira_em").eq("id", user.id).maybeSingle(),
  ]);

  const jaAcertadasAntesIds = (tentativasAnteriores || []).filter((a) => a.correta).map((a) => a.question_id);
  const jaTentadasAntesIds = (tentativasAnteriores || []).map((a) => a.question_id);
  const topicosMestreInicioIds = (progsIniciais || []).filter(questlyEhMestre).map((p) => p.topico_id);
  const favoritosIniciaisIds = (favoritosData || []).map((f) => f.question_id);
  const notasIniciais: Record<string, string> = {};
  (notasData || []).forEach((n) => (notasIniciais[n.question_id] = n.nota));

  // Nome da disciplina pro header colorido: prioriza a matéria da missão
  // (subject), com fallback pra matéria mais comum entre os tópicos das
  // questões (cobre missão avulsa de matéria não matriculada).
  let disciplinaNome: string | null = missao.subjects?.nome ?? null;
  if (!disciplinaNome && topicIdsDasPerguntas.length > 0) {
    const { data: tops } = await supabase
      .from("topicos")
      .select("materia_id, materias(nome)")
      .in("id", topicIdsDasPerguntas);
    const contagem = new Map<string, number>();
    (tops || []).forEach((t) => {
      const mat = t.materias as { nome: string } | { nome: string }[] | null;
      const nome = Array.isArray(mat) ? mat[0]?.nome : mat?.nome;
      if (nome) contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    });
    let melhor = 0;
    for (const [nome, n] of contagem) {
      if (n > melhor) {
        melhor = n;
        disciplinaNome = nome;
      }
    }
  }

  return (
    <QuestaoRunner
      missao={{
        id: missao.id,
        subject_id: missao.subject_id,
        subjectNome: missao.subjects?.nome ?? null,
        recap_topico_id: missao.recap_topico_id,
        avulsa: missao.avulsa,
        tempo_previsto_min: missao.tempo_previsto_min,
      }}
      perguntas={perguntas}
      jaAcertadasAntesIds={jaAcertadasAntesIds}
      jaTentadasAntesIds={jaTentadasAntesIds}
      topicosMestreInicioIds={topicosMestreInicioIds}
      favoritosIniciaisIds={favoritosIniciaisIds}
      notasIniciais={notasIniciais}
      ehPro={ehPro(perfilPlano)}
      voltarHref={voltarHref}
      disciplinaNome={disciplinaNome}
      ehAdmin={ehAdmin(user.email)}
    />
  );
}
