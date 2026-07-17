"use server";

// GPS da Aprovação — "Seguir rota": materializa a rota Δnota/min do
// dashboard numa missão AVULSA (mesmo mecanismo da prática livre em
// lib/disciplinas/actions.ts — não ocupa nem substitui a missão diária)
// com exatamente as quantidades por tópico que a rota recomendou, na
// ordem de prioridade que o guloso escolheu (tópico de maior impacto
// primeiro).

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar, questlyXpDaQuestao } from "@/lib/questly/shared";

const MAX_PASSOS = 10;
const MAX_QUESTOES_POR_PASSO = 15;

export async function seguirRotaAction(input: {
  subjectId: string;
  passos: Array<{ topicoId: string; questoes: number }>;
}): Promise<{ missaoId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  // O input vem do cliente — revalida limites em vez de confiar nele.
  const passos = input.passos
    .filter((p) => p.topicoId && p.questoes > 0)
    .slice(0, MAX_PASSOS)
    .map((p) => ({ topicoId: p.topicoId, questoes: Math.min(p.questoes, MAX_QUESTOES_POR_PASSO) }));
  if (passos.length === 0) return { missaoId: null };

  const topicIds = passos.map((p) => p.topicoId);
  const { data: candidatas } = await supabase
    .from("questions")
    .select("id, topic_id, tempo_medio_seg, dificuldade")
    .in("topic_id", topicIds);
  if (!candidatas || candidatas.length === 0) return { missaoId: null };

  const porTopico: Record<string, typeof candidatas> = {};
  candidatas.forEach((q) => {
    (porTopico[q.topic_id] ||= []).push(q);
  });

  // Ordem das questões = ordem da rota (impacto primeiro), sorteio
  // aleatório dentro de cada tópico.
  const escolhidas = passos.flatMap((p) =>
    questlyEmbaralhar(porTopico[p.topicoId] || []).slice(0, p.questoes),
  );
  if (escolhidas.length === 0) return { missaoId: null };

  const comDadoReal = escolhidas.filter((q) => q.tempo_medio_seg);
  let tempoPrevistoMin: number | null = null;
  if (comDadoReal.length > 0) {
    const somaRealSeg = comDadoReal.reduce((acc, q) => acc + (q.tempo_medio_seg || 0), 0);
    const mediaRealSeg = somaRealSeg / comDadoReal.length;
    const somaTotalSeg = somaRealSeg + (escolhidas.length - comDadoReal.length) * mediaRealSeg;
    tempoPrevistoMin = Math.round(somaTotalSeg / 60);
  }

  const { data: missaoCriada, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      data: new Date().toISOString().slice(0, 10),
      topic_ids: Array.from(new Set(escolhidas.map((q) => q.topic_id))),
      question_ids: escolhidas.map((q) => q.id),
      qtd_questoes: escolhidas.length,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
    })
    .select("id")
    .single();

  if (error || !missaoCriada) {
    console.error("Erro ao criar missão da rota:", error);
    return { missaoId: null };
  }
  return { missaoId: missaoCriada.id as string };
}
