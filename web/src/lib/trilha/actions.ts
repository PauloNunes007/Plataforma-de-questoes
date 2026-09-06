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
// escolhidas; questões sem dado herdam a média das que têm (mesma conta do
// mission-engine). null quando nenhuma questão tem estimativa ainda.
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
    .eq("topic_id", topicoId);
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

// ── Revisão relâmpago: uma missão só cobrindo VÁRIOS tópicos ──────────
// Nasce do "plano de ataque" da trilha, quando mais de um tópico está com a
// memória caindo (ou chegando fraco na prova): em vez de o aluno abrir tópico
// por tópico, sai uma missão avulsa única com as questões distribuídas em
// rodízio entre os tópicos (round-robin), pra nenhum tópico monopolizar.
// NÃO leva recap_topico_id — é revisão, não prova de domínio de um tópico só
// (recap_topico_id marca 'dominado' com ≥70%, o que seria errado aqui).
const REVISAO_QTD_PADRAO = 10;
const REVISAO_QTD_MAX = 30;

export async function iniciarRevisaoRelampagoAction(
  subjectId: string,
  topicoIds: string[],
  qtd: number = REVISAO_QTD_PADRAO,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  const ids = Array.from(new Set((topicoIds || []).filter(Boolean)));
  if (ids.length === 0) return { missaoId: null };
  const alvo = Math.max(1, Math.min(REVISAO_QTD_MAX, Math.round(Number(qtd) || REVISAO_QTD_PADRAO)));

  const { data: candidatas } = await supabase
    .from("questions")
    .select("id, topic_id, tempo_medio_seg, dificuldade")
    .in("topic_id", ids);
  if (!candidatas || candidatas.length === 0) return { missaoId: null };

  // embaralha dentro de cada tópico e depois intercala (rodízio)
  const porTopico = new Map<string, QuestaoCandidata[]>();
  candidatas.forEach((q) => {
    const lista = porTopico.get(q.topic_id) || [];
    lista.push(q);
    porTopico.set(q.topic_id, lista);
  });
  const filas = ids
    .map((id) => questlyEmbaralhar(porTopico.get(id) || []))
    .filter((f) => f.length > 0);

  const escolhidas: QuestaoCandidata[] = [];
  for (let rodada = 0; escolhidas.length < alvo; rodada++) {
    let adicionouNaRodada = false;
    for (const fila of filas) {
      if (escolhidas.length >= alvo) break;
      const q = fila[rodada];
      if (!q) continue;
      escolhidas.push(q);
      adicionouNaRodada = true;
    }
    if (!adicionouNaRodada) break; // acabaram as questões de todos os tópicos
  }
  if (escolhidas.length === 0) return { missaoId: null };

  const topicosUsados = Array.from(
    new Set(escolhidas.map((q) => (q as { topic_id?: string }).topic_id).filter(Boolean)),
  ) as string[];

  const { data: missaoCriada, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      data: questlyHojeISO(),
      topic_ids: topicosUsados,
      question_ids: escolhidas.map((q) => q.id),
      qtd_questoes: escolhidas.length,
      tempo_previsto_min: preverTempoMin(escolhidas),
      xp_recompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
    })
    .select("id")
    .single();

  if (error || !missaoCriada) {
    console.error("Erro ao criar revisão relâmpago:", error);
    return { missaoId: null };
  }
  return { missaoId: missaoCriada.id as string };
}

// cria ou atualiza o Boss da disciplina direto da página de trilha, sem
// mandar o aluno pra Configurações — insert quando ainda não há prova
// futura cadastrada (bossId null), update quando já existe.
// topicoIds = escopo da prova ("o que cai?"); lista vazia vira null
// (escopo não definido → projeção cai no fallback cai_na_prova).
export async function salvarProvaTrilhaAction(input: {
  subjectId: string;
  bossId: string | null;
  nome: string;
  dataProva: string;
  topicoIds?: string[] | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const payload: Record<string, unknown> = { nome: input.nome, data_prova: input.dataProva };
  if (input.topicoIds !== undefined) {
    payload.topico_ids = input.topicoIds && input.topicoIds.length > 0 ? input.topicoIds : null;
  }

  const { error } = input.bossId
    ? await supabase.from("bosses").update(payload).eq("id", input.bossId)
    : await supabase.from("bosses").insert({ subject_id: input.subjectId, ...payload });

  if (error) {
    console.error("Erro ao salvar prova:", error);
    return { error: "Não foi possível salvar a prova." };
  }
  return { error: null };
}
