"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { questlyEhMestre, questlyXpDaQuestao } from "@/lib/questly/shared";
import { questlyEvoluirEstadoTopico } from "@/lib/questly/motor-aprovacao";
import { atualizarStreakEDailyLog, atualizarXpELiga } from "@/lib/questly/economia";
import { FREQUENCIA_JANELA_DIAS, questlyCalcularMetricas } from "@/lib/questly/chance-aprovacao";

// Portado de js/questao.js — mesmo fluxo (registrar tentativa, atualizar
// progresso do tópico, recalibrar tempo médio, finalizar missão: XP/liga,
// streak, recap, métricas da disciplina, maestria, desafio de
// recuperação), só que como Server Actions em vez de chamadas diretas do
// browser ao Supabase.

export async function registrarRespostaAction(input: {
  questionId: string;
  topicId: string | null;
  missaoId: string;
  correta: boolean;
  tempoSeg: number;
  respostaMarcada: string;
  tempoMedioAnterior: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { attemptId: null };

  const { data: attempt, error: attemptError } = await supabase
    .from("question_attempts")
    .insert({
      user_id: user.id,
      question_id: input.questionId,
      mission_id: input.missaoId,
      resposta_marcada: input.respostaMarcada,
      correta: input.correta,
      tempo_gasto_seg: input.tempoSeg,
      tentativa_num: 1,
    })
    .select("id")
    .single();
  if (attemptError) console.error("Erro ao registrar tentativa:", attemptError);

  if (input.topicId) {
    const { data: progresso } = await supabase
      .from("aluno_topico_progresso")
      .select("taxa_acerto, num_questoes_respondidas, maestria, estabilidade, ultima_revisao")
      .eq("user_id", user.id)
      .eq("topico_id", input.topicId)
      .maybeSingle();

    const numAnterior = progresso?.num_questoes_respondidas || 0;
    const taxaAnterior = progresso?.taxa_acerto ?? 0;
    const novoNum = numAnterior + 1;
    const novaTaxa = (taxaAnterior * numAnterior + (input.correta ? 1 : 0)) / novoNum;

    // Motor de aprovação: evolui maestria (BKT) e estabilidade (revisão
    // espaçada) a partir do estado persistido. Semeia no cold-start com
    // os mesmos números do backfill SQL. ultima_revisao é lida ANTES de
    // ser sobrescrita, pra retenção do momento sair correta.
    const { maestria, estabilidade } = questlyEvoluirEstadoTopico({
      maestria: progresso?.maestria ?? null,
      estabilidade: progresso?.estabilidade ?? null,
      ultimaRevisao: progresso?.ultima_revisao ?? null,
      taxaAnterior,
      numAnterior,
      acertou: input.correta,
      agoraMs: Date.now(),
    });

    const { error: upsertError } = await supabase.from("aluno_topico_progresso").upsert(
      {
        user_id: user.id,
        topico_id: input.topicId,
        taxa_acerto: novaTaxa,
        num_questoes_respondidas: novoNum,
        maestria,
        estabilidade,
        ultima_revisao: new Date().toISOString(),
      },
      { onConflict: "user_id,topico_id" },
    );
    if (upsertError) console.error("Erro ao atualizar progresso do tópico:", upsertError);
  }

  const novoTempoMedio = input.tempoMedioAnterior
    ? Math.round(input.tempoMedioAnterior * 0.7 + input.tempoSeg * 0.3)
    : input.tempoSeg;
  // `questions` só é escrita pelo admin (RLS de segurança) — a recalibração do
  // tempo médio, que qualquer aluno dispara ao responder, roda via service_role
  // no servidor (o user já foi validado acima).
  const { error: tempoError } = await createAdminClient()
    .from("questions")
    .update({ tempo_medio_seg: novoTempoMedio })
    .eq("id", input.questionId);
  if (tempoError) console.error("Erro ao recalibrar tempo médio da questão:", tempoError);

  return { attemptId: attempt?.id ?? null, novoTempoMedio };
}

export async function classificarMotivoErroAction(attemptId: string, motivo: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("question_attempts").update({ motivo_erro: motivo }).eq("id", attemptId);
  if (error) console.error("Erro ao salvar motivo do erro:", error);
}

const RECAP_APROVACAO = 0.7;
const DESAFIO_DIAS_SEM_TOCAR = 7;

export type DesafioRecuperacao = {
  topicoId: string;
  topicoNome: string;
  subjectId: string;
  questaoId: string;
  diasSemTocar: number;
  tempoMedioSeg: number | null;
  dificuldade: string | null;
};

export type FinalizarMissaoResultado = {
  recapResultado: { dominou: boolean; taxa: number } | null;
  novosMestresNomes: string[];
  desafio: DesafioRecuperacao | null;
};

export async function finalizarMissaoAction(input: {
  missaoId: string;
  subjectId: string | null;
  recapTopicoId: string | null;
  avulsa: boolean;
  acertos: number;
  erros: number;
  xpGanho: number;
  tempoGastoMinMissao: number;
  topicIdsDasPerguntas: string[];
  topicosMestreInicioIds: string[];
}): Promise<FinalizarMissaoResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { recapResultado: null, novosMestresNomes: [], desafio: null };

  await supabase
    .from("missions")
    .update({ concluida: true, tempo_gasto_min: input.tempoGastoMinMissao })
    .eq("id", input.missaoId);

  // XP/liga/streak vivem em colunas protegidas de `profiles` (só service_role
  // escreve — supabase_seguranca_hardening.sql). Essas duas rodam via cliente
  // admin; o resto (recap/métricas/missão) fica no cliente do usuário porque
  // são writes owner-scoped em tabelas não protegidas.
  const admin = createAdminClient();
  await atualizarXpELiga(admin, user.id, input.acertos, input.erros, input.xpGanho);
  await atualizarStreakEDailyLog(admin, user.id);
  const recapResultado = await avaliarRecap(supabase, user.id, input.recapTopicoId, input.acertos, input.erros);
  if (input.subjectId) {
    await atualizarMetricasSubject(supabase, user.id, input.subjectId);
  }
  const novosMestresNomes = await celebrarNovasMaestrias(
    supabase,
    user.id,
    input.topicIdsDasPerguntas,
    input.topicosMestreInicioIds,
  );
  const desafio = input.avulsa ? null : await prepararDesafioRecuperacao(supabase, user.id);

  return { recapResultado, novosMestresNomes, desafio };
}

// atualizarXpELiga/atualizarStreakEDailyLog moraram aqui até a Arena de
// Xadrez precisar delas também — agora vivem em lib/questly/economia.ts
// (sem "use server", pra não virarem endpoints).

async function avaliarRecap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  recapTopicoId: string | null,
  acertos: number,
  erros: number,
) {
  if (!recapTopicoId) return null;

  const total = acertos + erros;
  const taxa = total > 0 ? acertos / total : 0;
  const dominou = taxa >= RECAP_APROVACAO;

  if (dominou) {
    const { error } = await supabase.from("aluno_topico_progresso").upsert(
      {
        user_id: userId,
        topico_id: recapTopicoId,
        status: "dominado",
        ultima_revisao: new Date().toISOString(),
      },
      { onConflict: "user_id,topico_id" },
    );
    if (error) console.error("Erro ao marcar tópico como dominado:", error);
  }

  return { dominou, taxa };
}

async function atualizarMetricasSubject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  subjectId: string,
) {
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, nota_desejada, materia_id")
    .eq("id", subjectId)
    .single();
  if (!subject || !subject.materia_id) return;

  const { data: topicosMateria } = await supabase
    .from("topicos")
    .select("id")
    .eq("materia_id", subject.materia_id)
    .eq("cai_na_prova", true);

  const topicoIds = (topicosMateria || []).map((t) => t.id);
  const { data: progressos } =
    topicoIds.length > 0
      ? await supabase
          .from("aluno_topico_progresso")
          .select("topico_id, taxa_acerto, num_questoes_respondidas, status")
          .eq("user_id", userId)
          .in("topico_id", topicoIds)
      : { data: [] as { topico_id: string; taxa_acerto: number; num_questoes_respondidas: number; status: string }[] };

  const progressoPorTopico: Record<string, { taxa_acerto: number; num_questoes_respondidas: number; status: string }> = {};
  (progressos || []).forEach((p) => (progressoPorTopico[p.topico_id] = p));
  const topicos = topicoIds
    .map((id) => progressoPorTopico[id] || { taxa_acerto: 0, num_questoes_respondidas: 0, status: "pendente" })
    .filter((t) => t.status !== "pulado");

  const { data: bosses } = await supabase
    .from("bosses")
    .select("id, data_prova, preparo_percentual")
    .eq("subject_id", subjectId);

  const hoje = new Date(new Date().toDateString());
  const futuros = (bosses || [])
    .filter((b) => new Date(b.data_prova) >= hoje)
    .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
  const bossAlvo = futuros[0] || null;
  const diasRestantes = bossAlvo
    ? Math.round((new Date(bossAlvo.data_prova).getTime() - hoje.getTime()) / 86400000)
    : null;

  const janelaInicio = new Date();
  janelaInicio.setDate(janelaInicio.getDate() - (FREQUENCIA_JANELA_DIAS - 1));
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("estudou")
    .eq("user_id", userId)
    .gte("data", janelaInicio.toISOString().slice(0, 10));
  const diasEstudados = (logs || []).filter((l) => l.estudou).length;

  const errosPorMotivo: Record<string, number> = {};
  if (topicoIds.length > 0) {
    const { data: questoesMateria } = await supabase.from("questions").select("id").in("topic_id", topicoIds);
    const questaoIds = (questoesMateria || []).map((q) => q.id);
    if (questaoIds.length > 0) {
      const { data: errosClassificados } = await supabase
        .from("question_attempts")
        .select("motivo_erro")
        .eq("user_id", userId)
        .eq("correta", false)
        .not("motivo_erro", "is", null)
        .in("question_id", questaoIds);
      (errosClassificados || []).forEach((a) => {
        if (a.motivo_erro) errosPorMotivo[a.motivo_erro] = (errosPorMotivo[a.motivo_erro] || 0) + 1;
      });
    }
  }

  const metricas = questlyCalcularMetricas(subject, topicos, diasRestantes, diasEstudados, errosPorMotivo);

  if (bossAlvo) {
    await supabase
      .from("bosses")
      .update({ preparo_percentual: Math.round(metricas.coberturaMedia * 100) })
      .eq("id", bossAlvo.id);
  }

  await supabase.from("subjects").update({ chance_aprovacao: metricas.chanceAprovacao }).eq("id", subject.id);
}

async function celebrarNovasMaestrias(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  topicIds: string[],
  topicosMestreInicioIds: string[],
): Promise<string[]> {
  const idsUnicos = Array.from(new Set(topicIds));
  if (idsUnicos.length === 0) return [];

  const { data: progs } = await supabase
    .from("aluno_topico_progresso")
    .select("topico_id, taxa_acerto, num_questoes_respondidas")
    .eq("user_id", userId)
    .in("topico_id", idsUnicos);

  const jaEraMestre = new Set(topicosMestreInicioIds);
  const novosMestres = (progs || []).filter((p) => questlyEhMestre(p) && !jaEraMestre.has(p.topico_id));
  if (novosMestres.length === 0) return [];

  const { data: topicos } = await supabase
    .from("topicos")
    .select("id, nome")
    .in(
      "id",
      novosMestres.map((p) => p.topico_id),
    );

  return (topicos || []).map((t) => t.nome);
}

async function prepararDesafioRecuperacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<DesafioRecuperacao | null> {
  const { data: meusSubjects } = await supabase.from("subjects").select("id, materia_id").eq("user_id", userId);
  const materiaIds = (meusSubjects || []).map((s) => s.materia_id).filter(Boolean) as string[];
  if (materiaIds.length === 0) return null;

  const { data: topicos } = await supabase.from("topicos").select("id, nome, materia_id").in("materia_id", materiaIds);
  const topicoPorId: Record<string, { id: string; nome: string; materia_id: string }> = {};
  (topicos || []).forEach((t) => (topicoPorId[t.id] = t));

  const corte = new Date(Date.now() - DESAFIO_DIAS_SEM_TOCAR * 86400000).toISOString();
  const { data: empoeirados } = await supabase
    .from("aluno_topico_progresso")
    .select("topico_id, status, num_questoes_respondidas, ultima_revisao")
    .eq("user_id", userId)
    .gt("num_questoes_respondidas", 0)
    .lt("ultima_revisao", corte);

  const candidatos = (empoeirados || []).filter((p) => p.status !== "pulado" && topicoPorId[p.topico_id]);
  if (candidatos.length === 0) return null;

  const sorteado = candidatos[Math.floor(Math.random() * candidatos.length)];
  const topico = topicoPorId[sorteado.topico_id];

  const { data: questoesTopico } = await supabase
    .from("questions")
    .select("id, dificuldade, tempo_medio_seg")
    .eq("topic_id", topico.id);
  if (!questoesTopico || questoesTopico.length === 0) return null;
  const questaoDesafio = questoesTopico[Math.floor(Math.random() * questoesTopico.length)];

  const diasSemTocar = Math.round(
    (Date.now() - new Date(sorteado.ultima_revisao as string).getTime()) / 86400000,
  );

  const meuSubject = (meusSubjects || []).find((s) => s.materia_id === topico.materia_id);

  return {
    topicoId: topico.id,
    topicoNome: topico.nome,
    subjectId: meuSubject?.id || "",
    questaoId: questaoDesafio.id,
    diasSemTocar,
    tempoMedioSeg: questaoDesafio.tempo_medio_seg,
    dificuldade: questaoDesafio.dificuldade,
  };
}

export async function aceitarDesafioAction(input: {
  subjectId: string;
  topicoId: string;
  questaoId: string;
  tempoMedioSeg: number | null;
  dificuldade: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  const { data: missaoDesafio, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      data: new Date().toISOString().slice(0, 10),
      topic_ids: [input.topicoId],
      question_ids: [input.questaoId],
      qtd_questoes: 1,
      tempo_previsto_min: input.tempoMedioSeg ? Math.max(1, Math.round(input.tempoMedioSeg / 60)) : null,
      xp_recompensa: questlyXpDaQuestao({ dificuldade: input.dificuldade }),
      concluida: false,
      avulsa: true,
    })
    .select("id")
    .single();

  if (error || !missaoDesafio) {
    console.error("Erro ao criar desafio de recuperação:", error);
    return { missaoId: null };
  }
  return { missaoId: missaoDesafio.id };
}
