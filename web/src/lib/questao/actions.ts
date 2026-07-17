"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QUESTLY_MAESTRIA_MULT_XP, questlyEhMestre, questlyHojeISO, questlyXpDaQuestao, toISODate } from "@/lib/questly/shared";
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

  // Corretude é decidida NO SERVIDOR comparando a resposta marcada com o
  // gabarito no banco — nunca confiar no `input.correta` do cliente (o
  // questao-runner calcula localmente só pra feedback imediato). Sem isso,
  // qualquer um marcava tudo como certo, inflando maestria/BKT e os
  // contadores globais tentativas_total/acertos_total (dados da rede neural).
  const { data: questaoGabarito } = await supabase
    .from("questions")
    .select("gabarito")
    .eq("id", input.questionId)
    .maybeSingle();
  const correta = questaoGabarito?.gabarito != null && input.respostaMarcada === questaoGabarito.gabarito;

  const { data: attempt, error: attemptError } = await supabase
    .from("question_attempts")
    .insert({
      user_id: user.id,
      question_id: input.questionId,
      mission_id: input.missaoId,
      resposta_marcada: input.respostaMarcada,
      correta,
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
    const novaTaxa = (taxaAnterior * numAnterior + (correta ? 1 : 0)) / novoNum;

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
      acertou: correta,
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
  // no servidor (o user já foi validado acima). Na mesma escrita, os contadores
  // globais tentativas_total/acertos_total (feature "taxa da questão" da rede
  // neural — supabase_rede_neural.sql).
  const admin = createAdminClient();
  const { data: statsQuestao } = await admin
    .from("questions")
    .select("tentativas_total, acertos_total")
    .eq("id", input.questionId)
    .maybeSingle();
  const { error: tempoError } = await admin
    .from("questions")
    .update({
      tempo_medio_seg: novoTempoMedio,
      tentativas_total: (statsQuestao?.tentativas_total ?? 0) + 1,
      acertos_total: (statsQuestao?.acertos_total ?? 0) + (correta ? 1 : 0),
    })
    .eq("id", input.questionId);
  if (tempoError) {
    // Banco ainda sem supabase_rede_neural.sql (colunas novas ausentes):
    // não pode custar a recalibração do tempo médio, que já existia.
    console.error("Erro ao atualizar estatísticas da questão:", tempoError);
    await admin.from("questions").update({ tempo_medio_seg: novoTempoMedio }).eq("id", input.questionId);
  }

  return { attemptId: attempt?.id ?? null, novoTempoMedio, correta };
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
  /** null quando o aluno não tem essa matéria como subject — missions.subject_id
   *  é nullable; nunca usar "" aqui (uuid inválido quebra o insert). */
  subjectId: string | null;
  questaoId: string;
  diasSemTocar: number;
  tempoMedioSeg: number | null;
  dificuldade: string | null;
};

export type FinalizarMissaoResultado = {
  recapResultado: { dominou: boolean; taxa: number } | null;
  novosMestresNomes: string[];
  desafio: DesafioRecuperacao | null;
  placar: { acertos: number; erros: number; xpGanho: number };
};

// Recomputa acertos/erros/XP da missão SÓ a partir de dados autoritativos do
// servidor: as tentativas gravadas pra esta missão, regradas pelo gabarito no
// banco, com XP calculado pelas mesmas regras do cliente (peso por
// dificuldade, metade em questão já acertada antes, ×1.5 em tópico Mestre).
// O cliente não tem voz aqui — é isso que impede forjar xp_total/ranking.
async function recomputarPlacarMissao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  missao: { id: string; question_ids: string[] | null },
): Promise<{ acertos: number; erros: number; xpGanho: number }> {
  const { data: tentativas } = await supabase
    .from("question_attempts")
    .select("question_id, resposta_marcada, id")
    .eq("user_id", userId)
    .eq("mission_id", missao.id)
    .order("id", { ascending: true });

  // Última resposta marcada por questão (uma tentativa por questão no fluxo
  // normal; se houver mais de uma, a mais recente vale).
  const respostaPorQuestao = new Map<string, string>();
  (tentativas || []).forEach((t) => respostaPorQuestao.set(t.question_id, t.resposta_marcada));

  // Só pontua as questões que a missão realmente contém (missions.question_ids
  // é fixado na criação). Missões antigas sem question_ids caem pras questões
  // efetivamente respondidas nesta missão.
  const idsMissao = Array.isArray(missao.question_ids) ? missao.question_ids : [];
  const idsParaAvaliar = idsMissao.length > 0 ? idsMissao : Array.from(respostaPorQuestao.keys());
  if (idsParaAvaliar.length === 0) return { acertos: 0, erros: 0, xpGanho: 0 };

  const { data: questoes } = await supabase
    .from("questions")
    .select("id, gabarito, dificuldade, topic_id")
    .in("id", idsParaAvaliar);

  // Questões já acertadas em OUTRA missão pagam metade (anti-farming).
  const { data: acertosPrevios } = await supabase
    .from("question_attempts")
    .select("question_id")
    .eq("user_id", userId)
    .eq("correta", true)
    .neq("mission_id", missao.id)
    .in("question_id", idsParaAvaliar);
  const jaAcertadasAntes = new Set((acertosPrevios || []).map((a) => a.question_id));

  // Tópicos atualmente Mestres (bônus ×1.5). Reconstruir o estado exato "no
  // início da missão" não é necessário: o multiplicador é limitado (1.5×) e a
  // diferença não é explorável — o que importa é o teto vir de dado real.
  const topicIds = Array.from(new Set((questoes || []).map((q) => q.topic_id).filter(Boolean))) as string[];
  const mestres = new Set<string>();
  if (topicIds.length > 0) {
    const { data: progs } = await supabase
      .from("aluno_topico_progresso")
      .select("topico_id, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", userId)
      .in("topico_id", topicIds);
    (progs || []).forEach((p) => {
      if (questlyEhMestre(p)) mestres.add(p.topico_id);
    });
  }

  let acertos = 0;
  let erros = 0;
  let xpGanho = 0;
  for (const q of questoes || []) {
    const marcada = respostaPorQuestao.get(q.id);
    if (marcada == null) continue; // questão da missão que o aluno não respondeu
    if (marcada !== q.gabarito) {
      erros += 1;
      continue;
    }
    acertos += 1;
    let xp = questlyXpDaQuestao(q);
    if (jaAcertadasAntes.has(q.id)) xp = Math.max(1, Math.round(xp / 2));
    if (q.topic_id && mestres.has(q.topic_id)) xp = Math.round(xp * QUESTLY_MAESTRIA_MULT_XP);
    xpGanho += xp;
  }

  return { acertos, erros, xpGanho };
}

export async function finalizarMissaoAction(input: {
  missaoId: string;
  tempoGastoMinMissao: number;
  topicosMestreInicioIds: string[];
}): Promise<FinalizarMissaoResultado> {
  const vazio = { recapResultado: null, novosMestresNomes: [], desafio: null, placar: { acertos: 0, erros: 0, xpGanho: 0 } };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return vazio;

  // Carrega a missão do banco (RLS garante que é do próprio aluno) — subject,
  // recap, avulsa e question_ids vêm daqui, NÃO do cliente, pra ninguém apontar
  // um recap pra tópico arbitrário nem inflar o conjunto de questões pontuadas.
  const { data: missao } = await supabase
    .from("missions")
    .select("id, subject_id, recap_topico_id, avulsa, concluida, question_ids, topic_ids")
    .eq("id", input.missaoId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!missao) return vazio;

  // Anti-replay: uma missão já concluída não concede XP de novo (fechava o
  // farm de chamar finalizarMissaoAction repetidas vezes na mesma missão).
  if (missao.concluida) return vazio;

  const placar = await recomputarPlacarMissao(supabase, user.id, missao);

  await supabase
    .from("missions")
    .update({ concluida: true, tempo_gasto_min: input.tempoGastoMinMissao })
    .eq("id", missao.id)
    .eq("user_id", user.id);

  // XP/liga/streak vivem em colunas protegidas de `profiles` (só service_role
  // escreve — supabase_seguranca_hardening.sql). Essas duas rodam via cliente
  // admin; o resto (recap/métricas/missão) fica no cliente do usuário porque
  // são writes owner-scoped em tabelas não protegidas.
  const admin = createAdminClient();
  await atualizarXpELiga(admin, user.id, placar.acertos, placar.erros, placar.xpGanho);
  await atualizarStreakEDailyLog(admin, user.id);
  const recapResultado = await avaliarRecap(supabase, user.id, missao.recap_topico_id, placar.acertos, placar.erros);
  if (missao.subject_id) {
    await atualizarMetricasSubject(supabase, user.id, missao.subject_id);
  }
  const topicIdsDasPerguntas = (Array.isArray(missao.topic_ids) ? missao.topic_ids : []) as string[];
  const novosMestresNomes = await celebrarNovasMaestrias(
    supabase,
    user.id,
    topicIdsDasPerguntas,
    input.topicosMestreInicioIds,
  );
  const desafio = missao.avulsa ? null : await prepararDesafioRecuperacao(supabase, user.id);

  return { recapResultado, novosMestresNomes, desafio, placar };
}

// atualizarXpELiga/atualizarStreakEDailyLog vivem em lib/questly/economia.ts
// (sem "use server", pra não virarem endpoints invocáveis do browser).

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
    .gte("data", toISODate(janelaInicio));
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
    subjectId: meuSubject?.id ?? null,
    questaoId: questaoDesafio.id,
    diasSemTocar,
    tempoMedioSeg: questaoDesafio.tempo_medio_seg,
    dificuldade: questaoDesafio.dificuldade,
  };
}

export async function aceitarDesafioAction(input: {
  subjectId: string | null;
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
      data: questlyHojeISO(),
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
