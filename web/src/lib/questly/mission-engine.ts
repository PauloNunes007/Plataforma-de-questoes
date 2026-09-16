// Portado de js/mission-engine.js — gera as missões do dia por algoritmo
// (sem IA), uma por disciplina agendada na grade semanal de hoje. Ver o
// cabeçalho do arquivo legado pra fundamentação completa (fronteira
// curricular, revisão espaçada Ebbinghaus, etc.) — a lógica aqui é uma
// tradução 1:1 pra TypeScript, mesmos nomes e constantes.
import type { SupabaseClient } from "@supabase/supabase-js";
import { contagemDosTopicos } from "@/lib/questly/contagem-questoes";
import { lerPaginado } from "@/lib/supabase/paginado";
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
import {
  questlyApportionarMinutos,
  questlyBuscarRotinaCompleta,
  questlyDisciplinasPorDia,
  questlyPesoDisciplina,
  type SubjectComPeso,
} from "./rotina-engine";

export type { Boss } from "./shared";

const TEMPO_MEDIO_POR_QUESTAO_MIN = 3;
// **Repasse de 2026-09-16 — simplificação didática.** Uma missão cobria até 5
// tópicos ao mesmo tempo; na tela isso virava uma lista sem foco, e o aluno não
// conseguia dizer o que estava estudando hoje. Agora a missão tem UM assunto —
// e, no máximo, um segundo quando há revisão vencida ou um tópico que chega
// fraco no dia da prova. Dois papéis, dois tópicos, nunca uma lista.
const MAX_TOPICOS_POR_MISSAO = 2;
export const QUESTLY_MIN_QUESTOES_MISSAO = 4;
export const QUESTLY_MAX_QUESTOES_MISSAO = 40;
const MIN_QUESTOES = QUESTLY_MIN_QUESTOES_MISSAO;
const MAX_QUESTOES = QUESTLY_MAX_QUESTOES_MISSAO;
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
  /** Data pra onde o aluno empurrou esta missão (null = missão normal de hoje).
   *  Ver supabase_modo_estudo.sql: a linha fica no dia ORIGINAL pra segurar o
   *  índice único e impedir que o motor regere a mesma missão na hora. */
  adiada_para?: string | null;
  subjects?: { nome: string } | null;
};

export type MissoesDoDiaResultado = {
  missoes: Mission[];
  semMissaoHoje: boolean;
  motivo?: string;
  /** Missões de hoje que o aluno adiou — não são pendências, mas a home
   *  precisa poder dizer "você empurrou Cálculo II pra quinta". */
  adiadas: Mission[];
  /** Disciplinas do aluno que NÃO ganharam missão hoje. É o que alimenta o
   *  "estudar outra matéria hoje": inclui as que a grade marcou e o teto
   *  diário cortou, e as que nem estavam marcadas. */
  alternativas: { id: string; nome: string; naGradeDeHoje: boolean }[];
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
  /** Disciplinas já carregadas pelo chamador (o dashboard lê `subjects` de
   *  qualquer jeito pro card do Boss). Evita repetir a MESMA query — ver a
   *  nota de latência no topo de dashboard-data.ts. */
  subjectsPrefetch?: Subject[] | null,
): Promise<MissoesDoDiaResultado> {
  const hojeAbrev = QUESTLY_DIAS_SEMANA[new Date().getDay()];
  const vazio = (motivo: string): MissoesDoDiaResultado => ({
    missoes: [],
    semMissaoHoje: true,
    motivo,
    adiadas: [],
    alternativas: [],
  });

  if (profile?.dias_disponiveis && profile.dias_disponiveis.length > 0) {
    const diasNormalizados = profile.dias_disponiveis.map(questlyNormalizarDia);
    if (!diasNormalizados.includes(hojeAbrev)) {
      return vazio("Hoje não está nos seus dias de estudo configurados.");
    }
  }

  const hojeStr = questlyHojeISO();

  // As quatro leituras são independentes entre si (todas dependem só do
  // user_id) — em série custavam um round-trip cada antes de qualquer decisão
  // ser tomada. A grade, as missões de hoje e o que foi EMPURRADO pra hoje
  // sobem junto com as disciplinas.
  const [subjectsResultado, rotinaCompleta, missoesHojeResultado, empurradasResultado] = await Promise.all([
    subjectsPrefetch
      ? Promise.resolve({ data: subjectsPrefetch, error: null })
      : supabase
          .from("subjects")
          .select("*, bosses(id, nome, data_prova, preparo_percentual)")
          .eq("user_id", user.id),
    questlyBuscarRotinaCompleta(supabase, user.id),
    supabase
      .from("missions")
      .select("*, subjects(nome)")
      .eq("user_id", user.id)
      .eq("data", hojeStr)
      .eq("avulsa", false),
    // Missões de dias anteriores que o aluno adiou PRA HOJE: a disciplina
    // volta hoje mesmo que a grade semanal não a tenha marcado. Um
    // compromisso que o próprio aluno remarcou vale mais que a recomendação.
    supabase
      .from("missions")
      .select("subject_id")
      .eq("user_id", user.id)
      .eq("adiada_para", hojeStr),
  ]);

  const { data: subjects, error: subjectsError } = subjectsResultado;

  if (subjectsError || !subjects || subjects.length === 0) {
    return vazio("Nenhuma disciplina configurada ainda.");
  }

  const hoje = new Date(new Date().toDateString());
  const pesoDe = (s: Subject) => questlyPesoDisciplina(s, hoje);

  // Missões de hoje que o aluno EMPURROU pra frente não são pendência: elas
  // seguem ocupando o índice único do dia (por isso o motor não as regera),
  // mas saem da lista do que há pra fazer agora.
  const missoesTodasDeHoje = (missoesHojeResultado.data || []) as Mission[];
  const adiadas = missoesTodasDeHoje.filter((m) => m.adiada_para);
  const missoesExistentes = missoesTodasDeHoje.filter((m) => !m.adiada_para);
  const idsComLinhaHoje = new Set(missoesTodasDeHoje.map((m) => m.subject_id));

  const idsEmpurradasPraHoje = new Set(
    ((empurradasResultado.data || []) as { subject_id: string }[]).map((m) => m.subject_id),
  );

  const idsNaGradeDeHoje = new Set(
    rotinaCompleta.filter((r) => r.dia_semana === hojeAbrev).map((r) => r.subject_id),
  );

  // Candidatas do dia, em ordem de prioridade: primeiro o que o aluno
  // remarcou pra hoje, depois o que a grade marcou, cada grupo por peso.
  const naGrade = rotinaCompleta.length === 0
    ? [questlyDisciplinaComBossMaisProximo(subjects)]
    : subjects.filter((s) => idsNaGradeDeHoje.has(s.id));

  const empurradas = subjects.filter((s) => idsEmpurradasPraHoje.has(s.id));
  const ordenar = (lista: Subject[]) => lista.slice().sort((a, b) => pesoDe(b) - pesoDe(a));
  const candidatasDoDia = [
    ...ordenar(empurradas),
    ...ordenar(naGrade.filter((s) => !idsEmpurradasPraHoje.has(s.id))),
  ];

  // **O teto diário** (repasse 2026-09-16). Uma grade antiga pode ter 4
  // disciplinas marcadas na mesma segunda-feira; isso NÃO vira 4 missões. O
  // motor fica com as de maior peso até o teto (1 disciplina, ou 2 com 2h+ de
  // rotina) e as demais viram opção de troca, visível na home. Quem já tem
  // missão hoje ocupa vaga — inclusive uma criada pela troca manual.
  const tempoDiarioMin = profile?.tempo_diario_min || 30;
  const teto = questlyDisciplinasPorDia(Math.max(1, candidatasDoDia.length), tempoDiarioMin);
  const vagas = Math.max(0, teto - missoesExistentes.length);
  const subjectsFaltando = candidatasDoDia.filter((s) => !idsComLinhaHoje.has(s.id)).slice(0, vagas);

  const alternativas = subjects
    .filter((s) => !idsComLinhaHoje.has(s.id) && !subjectsFaltando.some((f) => f.id === s.id))
    .sort((a, b) => {
      const gradeA = idsNaGradeDeHoje.has(a.id) ? 1 : 0;
      const gradeB = idsNaGradeDeHoje.has(b.id) ? 1 : 0;
      if (gradeA !== gradeB) return gradeB - gradeA;
      return pesoDe(b) - pesoDe(a);
    })
    .map((s) => ({ id: s.id, nome: s.nome, naGradeDeHoje: idsNaGradeDeHoje.has(s.id) }));

  if (candidatasDoDia.length === 0 && missoesExistentes.length === 0) {
    return {
      ...vazio(
        "Nenhuma disciplina programada pra hoje na sua grade semanal. Você pode escolher uma abaixo ou ajustar em Configurações → Grade semanal.",
      ),
      adiadas,
      alternativas,
    };
  }

  // O tempo do dia se divide entre as disciplinas que de fato terão missão.
  const ativasHoje = [
    ...subjects.filter((s) => missoesExistentes.some((m) => m.subject_id === s.id)),
    ...subjectsFaltando,
  ];
  const minutosPorSubject = questlyApportionarMinutos(ativasHoje, tempoDiarioMin);

  // Uma disciplina não depende da outra pra gerar missão — em série, um dia
  // com 2 disciplinas agendadas pagava 2× a cadeia inteira de queries.
  const resultados = await Promise.all(
    subjectsFaltando.map((subject) =>
      questlyGerarMissaoParaSubject(
        supabase,
        user,
        profile,
        subject,
        minutosPorSubject[subject.id] || tempoDiarioMin,
      ),
    ),
  );
  const geradas: Mission[] = resultados.filter(
    (r): r is Mission => Boolean(r) && !("semMissaoHoje" in r),
  );

  const missoes = [...missoesExistentes, ...geradas];

  if (missoes.length === 0) {
    const motivoDeAlguma = resultados.find((r) => r && "semMissaoHoje" in r) as
      | { semMissaoHoje: true; motivo: string }
      | undefined;
    return {
      ...vazio(
        adiadas.length > 0
          ? "Você adiou a missão de hoje. Dá pra estudar outra disciplina mesmo assim."
          : motivoDeAlguma?.motivo ||
              "Ainda não há questões cadastradas pros tópicos das disciplinas de hoje.",
      ),
      adiadas,
      alternativas,
    };
  }

  return { missoes, semMissaoHoje: false, adiadas, alternativas };
}

/** Linha mínima de `questions` que o sorteio da missão consome. */
export type CandidataQuestao = {
  id: string;
  topic_id: string;
  tempo_medio_seg: number | null;
  dificuldade: string | null;
};

/** Questões sorteáveis de um conjunto de tópicos. Paginada de propósito: as
 *  LINHAS são necessárias (é delas que saem os ids), e o teto de 1000 do
 *  PostgREST cortava o fim do conjunto em matéria grande — ver
 *  lib/supabase/paginado.ts. Aprofundamento (`desafio`) nunca entra em sorteio
 *  automático (supabase_questao_desafio.sql). */
export async function questlyBuscarCandidatas(
  supabase: SupabaseClient,
  topicIds: string[],
): Promise<CandidataQuestao[]> {
  if (topicIds.length === 0) return [];
  return lerPaginado<CandidataQuestao>(() =>
    supabase
      .from("questions")
      .select("id, topic_id, tempo_medio_seg, dificuldade")
      .in("topic_id", topicIds)
      .eq("desafio", false),
  );
}

/** Percorre `lista` (já na ordem de prioridade) montando a missão.
 *
 *  Com `qtdAlvo` — o caso do controle manual, quando o aluno diz "hoje quero
 *  10 questões" — o número dele manda e o orçamento de minutos é ignorado;
 *  é a diferença entre uma recomendação e uma decisão. Sem ele, enche até o
 *  tempo alocado pro dia, respeitando o piso e o teto de tamanho. */
export function questlyEscolherQuestoes(
  lista: CandidataQuestao[],
  { orcamentoMin, qtdAlvo }: { orcamentoMin?: number; qtdAlvo?: number },
): CandidataQuestao[] {
  if (lista.length === 0) return [];

  if (qtdAlvo != null) {
    const alvo = Math.max(1, Math.min(Math.round(qtdAlvo), MAX_QUESTOES, lista.length));
    return lista.slice(0, alvo);
  }

  const orcamentoSeg = (orcamentoMin || 30) * 60;
  const escolhidas: CandidataQuestao[] = [];
  let somaSeg = 0;
  for (let i = 0; i < lista.length && escolhidas.length < MAX_QUESTOES; i++) {
    const q = lista[i];
    const tempoEstimadoSeg = q.tempo_medio_seg || TEMPO_MEDIO_POR_QUESTAO_MIN * 60;
    if (escolhidas.length >= MIN_QUESTOES && somaSeg + tempoEstimadoSeg > orcamentoSeg) break;
    escolhidas.push(q);
    somaSeg += tempoEstimadoSeg;
  }
  if (escolhidas.length === 0) escolhidas.push(lista[0]);
  return escolhidas;
}

/** Os números que vão pra linha de `missions`: tamanho, tempo previsto (soma
 *  real quando há dado, nunca média genérica) e XP (soma exata por questão). */
export function questlyResumoMissao(escolhidas: CandidataQuestao[]) {
  const qtdQuestoes = escolhidas.length;
  const comDadoReal = escolhidas.filter((q) => q.tempo_medio_seg);
  let tempoPrevistoMin: number | null = null;
  if (comDadoReal.length > 0) {
    const somaRealSeg = comDadoReal.reduce((acc, q) => acc + (q.tempo_medio_seg || 0), 0);
    const mediaRealSeg = somaRealSeg / comDadoReal.length;
    const somaTotalEstimadaSeg = somaRealSeg + (qtdQuestoes - comDadoReal.length) * mediaRealSeg;
    tempoPrevistoMin = Math.round(somaTotalEstimadaSeg / 60);
  }
  return {
    questionIds: escolhidas.map((q) => q.id),
    qtdQuestoes,
    tempoPrevistoMin,
    xpRecompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
  };
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
  // Progresso do aluno e "quais tópicos têm questão" saem dos mesmos ids —
  // nenhuma das duas depende do resultado da outra.
  const [{ data: progressos }, contagensDaMateria] = await Promise.all([
    supabase
      .from("aluno_topico_progresso")
      .select("*")
      .eq("user_id", user.id)
      .in("topico_id", topicoIdsDaMateria),
    // Só conta como "tópico que tem questão" o que a missão pode de fato
    // sortear — senão um tópico só de aprofundamento viraria fronteira
    // curricular e a missão sairia vazia. Ver supabase_questao_desafio.sql.
    //
    // Contagem agregada (view), não varredura de `questions`: matéria grande
    // passa das 1000 linhas do teto do PostgREST, e aí tópicos COM questão
    // voltavam como "sem questão" — a fronteira curricular pulava conteúdo em
    // silêncio. Ver lib/supabase/paginado.ts.
    contagemDosTopicos(supabase, topicoIdsDaMateria),
  ]);

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

  const temQuestao: Record<string, boolean> = {};
  contagensDaMateria.forEach((c, topicId) => {
    if (c.totalRegular > 0) temQuestao[topicId] = true;
  });

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

  const candidatas = await questlyBuscarCandidatas(supabase, topicIds);

  if (candidatas.length === 0) {
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
  const escolhidas = questlyEscolherQuestoes(embaralhadas, { orcamentoMin: tempoAlocadoMin });
  const { questionIds, qtdQuestoes, tempoPrevistoMin, xpRecompensa } = questlyResumoMissao(escolhidas);

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
    // 23505 = violação do índice único ux_missions_dia
    // (supabase_escala_lancamento.sql). Não é erro: significa que outra
    // requisição do MESMO aluno — outra aba, um duplo clique, o prefetch do
    // Next em cima da navegação — criou a missão de hoje entre a nossa leitura
    // e a nossa escrita. A corrida existia de verdade: havia conta com 9
    // missões pro mesmo dia/disciplina em produção. A resposta certa é usar a
    // missão que ganhou, não inventar outra nem mostrar erro.
    if (insertError.code === "23505") {
      const { data: jaExistente } = await supabase
        .from("missions")
        .select("*, subjects(nome)")
        .eq("user_id", user.id)
        .eq("subject_id", subject.id)
        .eq("data", questlyHojeISO())
        .eq("avulsa", false)
        .maybeSingle();
      if (jaExistente) return jaExistente;
    }
    console.error("Erro ao gerar missão do dia:", insertError);
    return { semMissaoHoje: true, motivo: "Não foi possível gerar a missão agora." };
  }

  return missaoCriada;
}
