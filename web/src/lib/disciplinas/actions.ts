"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar, questlyXpDaQuestao } from "@/lib/questly/shared";
import { carregarTopicosPratica, type TopicoPratica } from "./disciplinas-data";

export async function buscarTopicosPraticaAction(materiaId: string): Promise<TopicoPratica[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return carregarTopicosPratica(supabase, user, materiaId);
}

export type PreviaPratica = { total: number; xpEstimado: number; tempoEstimadoMin: number | null };

// prévia ao vivo enquanto o aluno mexe nos filtros — não cria nada ainda,
// só conta o que existe e estima XP/tempo pra decisão informada
export async function calcularPreviaPraticaAction(
  topicIds: string[],
  dificuldades: string[],
  quantidade: number | "todas",
): Promise<PreviaPratica> {
  if (topicIds.length === 0) return { total: 0, xpEstimado: 0, tempoEstimadoMin: null };

  const supabase = await createClient();
  let query = supabase.from("questions").select("id, dificuldade, tempo_medio_seg").in("topic_id", topicIds);
  if (dificuldades.length > 0) query = query.in("dificuldade", dificuldades);
  const { data } = await query;
  const pool = data || [];
  const total = pool.length;
  if (total === 0) return { total: 0, xpEstimado: 0, tempoEstimadoMin: null };

  const vaiUsar = quantidade === "todas" ? total : Math.min(quantidade, total);

  // estimativa não-enviesada: XP médio do pool inteiro (não só uma amostra)
  // vezes quantas questões de fato vão ser sorteadas
  const xpTotalPool = pool.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0);
  const xpEstimado = Math.round((xpTotalPool / total) * vaiUsar);

  const comDadoReal = pool.filter((q) => q.tempo_medio_seg);
  let tempoEstimadoMin: number | null = null;
  if (comDadoReal.length > 0) {
    const mediaSeg = comDadoReal.reduce((acc, q) => acc + (q.tempo_medio_seg || 0), 0) / comDadoReal.length;
    tempoEstimadoMin = Math.round((mediaSeg * vaiUsar) / 60);
  }

  return { total, xpEstimado, tempoEstimadoMin };
}

export async function iniciarPraticaLivreAction(input: {
  subjectId: string;
  topicIds: string[];
  dificuldades: string[];
  quantidade: number | "todas";
}): Promise<{ missaoId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || input.topicIds.length === 0) return { missaoId: null };

  let query = supabase
    .from("questions")
    .select("id, tempo_medio_seg, dificuldade")
    .in("topic_id", input.topicIds);
  if (input.dificuldades.length > 0) query = query.in("dificuldade", input.dificuldades);
  const { data: candidatas } = await query;
  if (!candidatas || candidatas.length === 0) return { missaoId: null };

  const embaralhadas = questlyEmbaralhar(candidatas);
  const qtdQuestoes = input.quantidade === "todas" ? embaralhadas.length : Math.min(input.quantidade, embaralhadas.length);
  const escolhidas = embaralhadas.slice(0, qtdQuestoes);
  const questionIds = escolhidas.map((q) => q.id);

  const comDadoReal = escolhidas.filter((q) => q.tempo_medio_seg);
  let tempoPrevistoMin: number | null = null;
  if (comDadoReal.length > 0) {
    const somaRealSeg = comDadoReal.reduce((acc, q) => acc + (q.tempo_medio_seg || 0), 0);
    const mediaRealSeg = somaRealSeg / comDadoReal.length;
    const somaTotalEstimadaSeg = somaRealSeg + (qtdQuestoes - comDadoReal.length) * mediaRealSeg;
    tempoPrevistoMin = Math.round(somaTotalEstimadaSeg / 60);
  }

  const { data: missaoCriada, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      data: new Date().toISOString().slice(0, 10),
      topic_ids: input.topicIds,
      question_ids: questionIds,
      qtd_questoes: qtdQuestoes,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
    })
    .select("id")
    .single();

  if (error || !missaoCriada) {
    console.error("Erro ao criar missão avulsa:", error);
    return { missaoId: null };
  }
  return { missaoId: missaoCriada.id as string };
}
