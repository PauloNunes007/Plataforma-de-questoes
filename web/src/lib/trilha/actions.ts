"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar, questlyXpDaQuestao } from "@/lib/questly/shared";
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

export async function iniciarPraticaTopicoAction(subjectId: string, topicoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  const { data: candidatas } = await supabase
    .from("questions")
    .select("id, tempo_medio_seg, dificuldade")
    .eq("topic_id", topicoId);
  if (!candidatas || candidatas.length === 0) return { missaoId: null };

  const escolhidas = questlyEmbaralhar(candidatas).slice(0, Math.min(PRATICA_QTD, candidatas.length));
  const questionIds = escolhidas.map((q) => q.id);

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
      subject_id: subjectId,
      data: new Date().toISOString().slice(0, 10),
      topic_ids: [topicoId],
      question_ids: questionIds,
      qtd_questoes: escolhidas.length,
      tempo_previsto_min: tempoPrevistoMin,
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

// cria ou atualiza o Boss da disciplina direto da página de trilha, sem
// mandar o aluno pra Configurações — insert quando ainda não há prova
// futura cadastrada (bossId null), update quando já existe
export async function salvarProvaTrilhaAction(input: {
  subjectId: string;
  bossId: string | null;
  nome: string;
  dataProva: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = input.bossId
    ? await supabase.from("bosses").update({ nome: input.nome, data_prova: input.dataProva }).eq("id", input.bossId)
    : await supabase.from("bosses").insert({ subject_id: input.subjectId, nome: input.nome, data_prova: input.dataProva });

  if (error) {
    console.error("Erro ao salvar prova:", error);
    return { error: "Não foi possível salvar a prova." };
  }
  return { error: null };
}
