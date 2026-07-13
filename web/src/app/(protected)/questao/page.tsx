import type { Metadata } from "next";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { questlyEhMestre, questlyEmbaralhar } from "@/lib/questly/shared";
import { QuestaoRunner } from "@/components/questao/questao-runner";
import { ehPro } from "@/lib/plano/plano";
import type { Pergunta } from "@/lib/questao/types";

export const metadata: Metadata = {
  title: "Questly — Missão",
};

function EmptyState({ mensagem }: { mensagem: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MapIcon size={20} strokeWidth={1.75} className="text-muted-foreground" />
      </span>
      <p className="text-sm leading-relaxed text-muted-foreground">{mensagem}</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}

export default async function QuestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ missao?: string }>;
}) {
  const { missao: missaoId } = await searchParams;

  if (!missaoId) {
    return <EmptyState mensagem='Nenhuma missão selecionada. Volte ao dashboard e clique em "Cumprir missão".' />;
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
    return <EmptyState mensagem="Não foi possível encontrar essa missão." />;
  }
  if (missao.concluida) {
    return <EmptyState mensagem="Essa missão já foi concluída. Volte amanhã pra uma nova!" />;
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
    return <EmptyState mensagem="Essa missão não tem tópicos definidos." />;
  }

  if (!questoes || questoes.length === 0) {
    return <EmptyState mensagem="Ainda não há questões cadastradas pros tópicos dessa missão." />;
  }

  const perguntas = questlyEmbaralhar(questoes).slice(0, missao.qtd_questoes || questoes.length);

  const { data: acertosAnteriores } = await supabase
    .from("question_attempts")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("correta", true)
    .in(
      "question_id",
      perguntas.map((p) => p.id),
    );
  const jaAcertadasAntesIds = (acertosAnteriores || []).map((a) => a.question_id);

  const topicIdsDasPerguntas = Array.from(new Set(perguntas.map((p) => p.topic_id).filter(Boolean))) as string[];
  let topicosMestreInicioIds: string[] = [];
  if (topicIdsDasPerguntas.length > 0) {
    const { data: progsIniciais } = await supabase
      .from("aluno_topico_progresso")
      .select("topico_id, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", user.id)
      .in("topico_id", topicIdsDasPerguntas);
    topicosMestreInicioIds = (progsIniciais || []).filter(questlyEhMestre).map((p) => p.topico_id);
  }

  const perguntaIds = perguntas.map((p) => p.id);
  const [{ data: favoritosData }, { data: notasData }] = await Promise.all([
    supabase.from("question_favoritos").select("question_id").eq("user_id", user.id).in("question_id", perguntaIds),
    supabase.from("question_notes").select("question_id, nota").eq("user_id", user.id).in("question_id", perguntaIds),
  ]);
  const favoritosIniciaisIds = (favoritosData || []).map((f) => f.question_id);
  const notasIniciais: Record<string, string> = {};
  (notasData || []).forEach((n) => (notasIniciais[n.question_id] = n.nota));

  const { data: perfilPlano } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

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
      topicosMestreInicioIds={topicosMestreInicioIds}
      favoritosIniciaisIds={favoritosIniciaisIds}
      notasIniciais={notasIniciais}
      ehPro={ehPro(perfilPlano)}
    />
  );
}
