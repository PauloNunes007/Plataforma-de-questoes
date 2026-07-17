// Portado de js/mission-engine.js — gera as missões do dia por algoritmo
// (sem IA), uma por disciplina agendada na grade semanal de hoje. Ver o
// cabeçalho do arquivo legado pra fundamentação completa (fronteira
// curricular, revisão espaçada Ebbinghaus, etc.) — a lógica aqui é uma
// tradução 1:1 pra TypeScript, mesmos nomes e constantes.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  QUESTLY_DIAS_SEMANA,
  QUESTLY_RETENCAO_LIMIAR,
  questlyEmbaralhar,
  questlyHojeISO,
  questlyNormalizarDia,
  questlyXpDaQuestao,
} from "./shared";
import {
  questlyEstadoEfetivo,
  questlyRetencaoEfetiva,
  questlyForcaNaProva,
  QUESTLY_FORCA_RISCO,
} from "./motor-aprovacao";
import { questlyApportionarMinutos, questlyBuscarRotinaCompleta, type SubjectComPeso } from "./rotina-engine";

export type { Boss } from "./shared";

const TEMPO_MEDIO_POR_QUESTAO_MIN = 3;
const MAX_TOPICOS_POR_MISSAO = 5;
const MIN_QUESTOES = 4;
const MAX_QUESTOES = 40;
const COBERTURA_TOPICO_QUESTOES = 5;
const BONUS_FRONTEIRA = 35;
const BONUS_REVISAO_URGENTE = 45;
const BONUS_RISCO_PROVA = 40;
const DOSE_REVISAO_URGENTE = 3;
const DOSE_RISCO_PROVA = 3;

export type Subject = SubjectComPeso & {
  nome: string;
  materia_id: string | null;
};

export type Profile = {
  dias_disponiveis?: string[] | null;
  tempo_diario_min?: number | null;
};

export type Mission = {
  id: string;
  user_id: string;
  subject_id: string;
  data: string;
  topic_ids: string[];
  question_ids: string[];
  qtd_questoes: number;
  tempo_previsto_min: number | null;
  xp_recompensa: number;
  concluida: boolean;
  avulsa: boolean;
  subjects?: { nome: string } | null;
};

export type MissoesDoDiaResultado = {
  missoes: Mission[];
  semMissaoHoje: boolean;
  motivo?: string;
};

type TopicoComProgresso = {
  id: string;
  cai_na_prova: boolean;
  ordem: number;
  status: string;
  taxa_acerto: number;
  num_questoes_respondidas: number;
  ultima_revisao: string | null;
  maestria: number | null;
  estabilidade: number | null;
  revisaoUrgente?: boolean;
  riscoProva?: boolean;
};

export function questlyDisciplinaComBossMaisProximo(subjects: Subject[]): Subject {
  const hoje = new Date(new Date().toDateString());
  const comBossInfo = subjects.map((s) => {
    const futuros = (s.bosses || [])
      .filter((b) => new Date(b.data_prova) >= hoje)
      .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
    const proximoBoss = futuros[0] || null;
    const diasAteProva = proximoBoss
      ? Math.round((new Date(proximoBoss.data_prova).getTime() - hoje.getTime()) / 86400000)
      : Infinity;
    return { subject: s, diasAteProva };
  });
  comBossInfo.sort((a, b) => a.diasAteProva - b.diasAteProva);
  return comBossInfo[0].subject;
}

export async function questlyGerarMissoesDoDia(
  supabase: SupabaseClient,
  user: { id: string },
  profile: Profile | null,
): Promise<MissoesDoDiaResultado> {
  const hojeAbrev = QUESTLY_DIAS_SEMANA[new Date().getDay()];
  if (profile?.dias_disponiveis && profile.dias_disponiveis.length > 0) {
    const diasNormalizados = profile.dias_disponiveis.map(questlyNormalizarDia);
    if (!diasNormalizados.includes(hojeAbrev)) {
      return { missoes: [], semMissaoHoje: true, motivo: "Hoje não está nos seus dias de estudo configurados." };
    }
  }

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*, bosses(id, nome, data_prova, preparo_percentual)")
    .eq("user_id", user.id);

  if (subjectsError || !subjects || subjects.length === 0) {
    return { missoes: [], semMissaoHoje: true, motivo: "Nenhuma disciplina configurada ainda." };
  }

  const rotinaCompleta = await questlyBuscarRotinaCompleta(supabase, user.id);
  let subjectsHoje: Subject[];
  if (rotinaCompleta.length === 0) {
    subjectsHoje = [questlyDisciplinaComBossMaisProximo(subjects)];
  } else {
    const idsHoje = new Set(
      rotinaCompleta.filter((r) => r.dia_semana === hojeAbrev).map((r) => r.subject_id),
    );
    subjectsHoje = subjects.filter((s) => idsHoje.has(s.id));
    if (subjectsHoje.length === 0) {
      return {
        missoes: [],
        semMissaoHoje: true,
        motivo:
          "Nenhuma disciplina programada pra hoje na sua grade semanal. Ajuste em Configurações → Grade semanal.",
      };
    }
  }

  const hojeStr = questlyHojeISO();
  const { data: missoesExistentes } = await supabase
    .from("missions")
    .select("*, subjects(nome)")
    .eq("user_id", user.id)
    .eq("data", hojeStr)
    .eq("avulsa", false);

  const subjectIdsComMissao = new Set((missoesExistentes || []).map((m) => m.subject_id));
  const subjectsFaltando = subjectsHoje.filter((s) => !subjectIdsComMissao.has(s.id));

  const tempoDiarioMin = profile?.tempo_diario_min || 30;
  const minutosPorSubject = questlyApportionarMinutos(subjectsHoje, tempoDiarioMin);

  const geradas: Mission[] = [];
  for (const subject of subjectsFaltando) {
    const resultado = await questlyGerarMissaoParaSubject(
      supabase,
      user,
      profile,
      subject,
      minutosPorSubject[subject.id] || tempoDiarioMin,
    );
    if (resultado && !("semMissaoHoje" in resultado)) geradas.push(resultado);
  }

  const missoes = [...(missoesExistentes || []), ...geradas];

  if (missoes.length === 0) {
    return {
      missoes: [],
      semMissaoHoje: true,
      motivo: "Ainda não há questões cadastradas pros tópicos das disciplinas de hoje.",
    };
  }

  return { missoes, semMissaoHoje: false };
}

export async function questlyGerarMissaoParaSubject(
  supabase: SupabaseClient,
  user: { id: string },
  profile: Profile | null,
  subject: Subject,
  tempoAlocadoMin: number,
): Promise<Mission | { semMissaoHoje: true; motivo: string }> {
  if (!subject.materia_id) {
    return { semMissaoHoje: true, motivo: "Essa disciplina ainda não está ligada a uma matéria." };
  }

  const { data: topicosMateria, error: topicsError } = await supabase
    .from("topicos")
    .select("*")
    .eq("materia_id", subject.materia_id);

  if (topicsError || !topicosMateria || topicosMateria.length === 0) {
    return { semMissaoHoje: true, motivo: "Essa disciplina ainda não tem tópicos cadastrados." };
  }

  const topicoIdsDaMateria = topicosMateria.map((t) => t.id);
  const { data: progressos } = await supabase
    .from("aluno_topico_progresso")
    .select("*")
    .eq("user_id", user.id)
    .in("topico_id", topicoIdsDaMateria);

  type ProgressoRow = {
    topico_id: string;
    status?: string | null;
    taxa_acerto?: number | null;
    num_questoes_respondidas?: number | null;
    ultima_revisao?: string | null;
    maestria?: number | null;
    estabilidade?: number | null;
  };

  const progressoPorTopico: Record<string, ProgressoRow> = {};
  ((progressos || []) as ProgressoRow[]).forEach((p) => (progressoPorTopico[p.topico_id] = p));

  const { data: questoesDaMateria } = await supabase
    .from("questions")
    .select("topic_id")
    .in("topic_id", topicoIdsDaMateria);

  const temQuestao: Record<string, boolean> = {};
  (questoesDaMateria || []).forEach((q) => (temQuestao[q.topic_id] = true));

  const topics: TopicoComProgresso[] = topicosMateria.map((t) => {
    const p = progressoPorTopico[t.id];
    return {
      id: t.id,
      cai_na_prova: t.cai_na_prova,
      ordem: t.ordem != null ? t.ordem : Infinity,
      status: p?.status || "pendente",
      taxa_acerto: p?.taxa_acerto ?? 0,
      num_questoes_respondidas: p?.num_questoes_respondidas ?? 0,
      ultima_revisao: p?.ultima_revisao ?? null,
      maestria: p?.maestria ?? null,
      estabilidade: p?.estabilidade ?? null,
    };
  });

  const elegiveis = topics.filter(
    (t) => temQuestao[t.id] && t.status !== "pulado" && t.status !== "dominado",
  );

  if (elegiveis.length === 0) {
    const algumComQuestao = topics.some((t) => temQuestao[t.id]);
    return {
      semMissaoHoje: true,
      motivo: algumComQuestao
        ? "Você já dominou (ou pulou) todos os tópicos com questões dessa disciplina. Use a prática livre pra revisar!"
        : "Ainda não há questões cadastradas pros tópicos dessa disciplina.",
    };
  }

  const porOrdem = elegiveis.slice().sort((a, b) => a.ordem - b.ordem);
  const fronteira = porOrdem.find((t) => (t.num_questoes_respondidas || 0) < COBERTURA_TOPICO_QUESTOES) || null;

  const candidatos = fronteira ? elegiveis.filter((t) => t.ordem <= fronteira.ordem) : elegiveis;

  // Prova mais próxima da disciplina — habilita o sinal preditivo do
  // motor: um tópico já coberto pode projetar fraco no dia D e virar
  // prioridade mesmo com retenção de hoje ainda ok.
  const hojeMs0 = new Date(new Date().toDateString()).getTime();
  const bossFuturo =
    (subject.bosses || [])
      .filter((b) => new Date(b.data_prova).getTime() >= hojeMs0)
      .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime())[0] || null;
  const dataProvaMs = bossFuturo ? new Date(bossFuturo.data_prova).getTime() : null;

  const agoraMs = Date.now();
  const pontuados = candidatos.map((t) => {
    let score = 0;

    if (fronteira && t.id === fronteira.id) score += BONUS_FRONTEIRA;
    if (t.cai_na_prova) score += 40;

    // Fraqueza = 1 - maestria (BKT), não 1 - taxa_acerto: um slip isolado
    // não faz o tópico parecer fraco, e um chute certo não o infla.
    const { maestria } = questlyEstadoEfetivo(t);
    score += (1 - maestria) * 30;

    const retencao = questlyRetencaoEfetiva(t, agoraMs);
    score += retencao == null ? 30 : (1 - retencao) * 30;

    const coberto = (t.num_questoes_respondidas || 0) >= COBERTURA_TOPICO_QUESTOES;
    t.revisaoUrgente = coberto && retencao != null && retencao < QUESTLY_RETENCAO_LIMIAR;
    if (t.revisaoUrgente) score += BONUS_REVISAO_URGENTE;

    // Risco de prova: tópico já tocado que, PROJETADO pra data da prova,
    // chega abaixo do limiar de força. Distinto de revisaoUrgente (que
    // olha só a retenção de hoje): aqui o esquecimento é extrapolado até
    // o dia D — é o que consertar a falha ANTES que ela aconteça.
    if (dataProvaMs != null && (t.num_questoes_respondidas || 0) > 0) {
      t.riscoProva = questlyForcaNaProva(t, dataProvaMs, agoraMs) < QUESTLY_FORCA_RISCO;
      if (t.riscoProva) score += BONUS_RISCO_PROVA;
    }

    const notaDesejada = subject.nota_desejada || 6;
    if (notaDesejada >= 9) score += (1 - maestria) * 10;

    return { topic: t, score };
  });

  pontuados.sort((a, b) => b.score - a.score);
  const topicosEscolhidos = pontuados.slice(0, MAX_TOPICOS_POR_MISSAO).map((p) => p.topic);
  const topicIds = topicosEscolhidos.map((t) => t.id);

  const { data: candidatas } = await supabase
    .from("questions")
    .select("id, topic_id, tempo_medio_seg, dificuldade")
    .in("topic_id", topicIds);

  if (!candidatas || candidatas.length === 0) {
    return { semMissaoHoje: true, motivo: "Ainda não há questões cadastradas pros tópicos dessa disciplina." };
  }

  let embaralhadas = questlyEmbaralhar(candidatas);
  const prioritarias: (typeof candidatas)[number][] = [];
  // Memória vencida hoje E projeção fraca no dia D vêm primeiro (a dose
  // de risco de prova só entra se ainda não foi puxada como urgente).
  topicosEscolhidos
    .filter((t) => t.revisaoUrgente)
    .forEach((t) => {
      embaralhadas
        .filter((q) => q.topic_id === t.id)
        .slice(0, DOSE_REVISAO_URGENTE)
        .forEach((q) => prioritarias.push(q));
    });
  topicosEscolhidos
    .filter((t) => t.riscoProva && !t.revisaoUrgente)
    .forEach((t) => {
      embaralhadas
        .filter((q) => q.topic_id === t.id && !prioritarias.includes(q))
        .slice(0, DOSE_RISCO_PROVA)
        .forEach((q) => prioritarias.push(q));
    });
  if (fronteira) {
    const faltamPraCobrir = Math.max(1, COBERTURA_TOPICO_QUESTOES - (fronteira.num_questoes_respondidas || 0));
    embaralhadas
      .filter((q) => q.topic_id === fronteira.id && !prioritarias.includes(q))
      .slice(0, faltamPraCobrir)
      .forEach((q) => prioritarias.push(q));
  }
  if (prioritarias.length > 0) {
    const resto = embaralhadas.filter((q) => !prioritarias.includes(q));
    embaralhadas = [...prioritarias, ...resto];
  }
  const orcamentoSeg = (tempoAlocadoMin || 30) * 60;

  const escolhidas: typeof candidatas = [];
  let somaSegParaTamanho = 0;
  for (let i = 0; i < embaralhadas.length && escolhidas.length < MAX_QUESTOES; i++) {
    const q = embaralhadas[i];
    const tempoEstimadoSeg = q.tempo_medio_seg || TEMPO_MEDIO_POR_QUESTAO_MIN * 60;
    if (escolhidas.length >= MIN_QUESTOES && somaSegParaTamanho + tempoEstimadoSeg > orcamentoSeg) break;
    escolhidas.push(q);
    somaSegParaTamanho += tempoEstimadoSeg;
  }
  if (escolhidas.length === 0) escolhidas.push(embaralhadas[0]);

  const qtdQuestoes = escolhidas.length;
  const questionIds = escolhidas.map((q) => q.id);

  const comDadoReal = escolhidas.filter((q) => q.tempo_medio_seg);
  let tempoPrevistoMin: number | null = null;
  if (comDadoReal.length > 0) {
    const somaRealSeg = comDadoReal.reduce((acc, q) => acc + (q.tempo_medio_seg || 0), 0);
    const mediaRealSeg = somaRealSeg / comDadoReal.length;
    const somaTotalEstimadaSeg = somaRealSeg + (qtdQuestoes - comDadoReal.length) * mediaRealSeg;
    tempoPrevistoMin = Math.round(somaTotalEstimadaSeg / 60);
  }

  const xpRecompensa = escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0);

  const { data: missaoCriada, error: insertError } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: subject.id,
      data: questlyHojeISO(),
      topic_ids: topicIds,
      question_ids: questionIds,
      qtd_questoes: qtdQuestoes,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: xpRecompensa,
      concluida: false,
    })
    .select("*, subjects(nome)")
    .single();

  if (insertError) {
    console.error("Erro ao gerar missão do dia:", insertError);
    return { semMissaoHoje: true, motivo: "Não foi possível gerar a missão agora." };
  }

  return missaoCriada;
}
