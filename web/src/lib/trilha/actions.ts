"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar, questlyHojeISO, questlyXpDaQuestao } from "@/lib/questly/shared";
import { carregarCaminhoDisciplina } from "./trilha-data";

export async function buscarCaminhoDisciplinaAction(subjectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return carregarCaminhoDisciplina(supabase, user, subjectId);
}

export async function mudarStatusTopicoAction(topicoId: string, novoStatus: "pendente" | "pulado") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("aluno_topico_progresso")
    .upsert({ user_id: user.id, topico_id: topicoId, status: novoStatus }, { onConflict: "user_id,topico_id" });

  if (error) console.error("Erro ao atualizar status do tópico:", error);
  return { ok: !error };
}

// mesma régua de RECAP_QTD do legado js/trilha.js — reaproveitada tanto
// pro recap (provar que já sabe, mid-semestre) quanto pro treino livre de
// um tópico já coberto/dominado rumo à maestria (mesma mecânica: missão
// curta e avulsa de um tópico só, question_attempts conta pra maestria
// independente do tipo de missão)
const PRATICA_QTD = 5;
const PRATICA_QTD_MAX = 30;

type QuestaoCandidata = { id: string; tempo_medio_seg?: number | null; dificuldade?: string | null };

// tempo previsto da missão a partir do tempo_medio_seg real das questões
// escolhidas; questões sem dado herdam a média das que têm. null quando
// nenhuma questão tem estimativa ainda.
function preverTempoMin(escolhidas: QuestaoCandidata[]): number | null {
  const comDadoReal = escolhidas.filter((q) => q.tempo_medio_seg);
  if (comDadoReal.length === 0) return null;
  const somaRealSeg = comDadoReal.reduce((acc, q) => acc + (q.tempo_medio_seg || 0), 0);
  const mediaRealSeg = somaRealSeg / comDadoReal.length;
  const somaTotalSeg = somaRealSeg + (escolhidas.length - comDadoReal.length) * mediaRealSeg;
  return Math.round(somaTotalSeg / 60);
}

export async function iniciarPraticaTopicoAction(
  subjectId: string,
  topicoId: string,
  qtd: number = PRATICA_QTD,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  // o aluno escolhe o tamanho da prática no painel do tópico; o clamp aqui
  // é o backstop (nunca confiar no número que vem do cliente)
  const alvo = Math.max(1, Math.min(PRATICA_QTD_MAX, Math.round(Number(qtd) || PRATICA_QTD)));

  const { data: candidatas } = await supabase
    .from("questions")
    .select("id, tempo_medio_seg, dificuldade")
    .eq("topic_id", topicoId)
    // Aprofundamento não entra em missão gerada pelo app (ver
    // supabase_questao_desafio.sql) — o aluno pede por ele no Banco de Questões.
    .eq("desafio", false);
  if (!candidatas || candidatas.length === 0) return { missaoId: null };

  const escolhidas = questlyEmbaralhar(candidatas).slice(0, Math.min(alvo, candidatas.length));
  const questionIds = escolhidas.map((q) => q.id);

  const { data: missaoCriada, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      data: questlyHojeISO(),
      topic_ids: [topicoId],
      question_ids: questionIds,
      qtd_questoes: escolhidas.length,
      tempo_previsto_min: preverTempoMin(escolhidas),
      xp_recompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
      recap_topico_id: topicoId,
    })
    .select("id")
    .single();

  if (error || !missaoCriada) {
    console.error("Erro ao criar recap:", error);
    return { missaoId: null };
  }
  return { missaoId: missaoCriada.id as string };
}
