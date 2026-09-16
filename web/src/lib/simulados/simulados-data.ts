// Leituras do módulo de Simulados (Server Components e Server Actions passam o
// SupabaseClient). `questions` é leitura pública pra autenticado; `simulados_aluno`
// é dono-only (RLS) — então tudo aqui já roda no cliente SSR normal do usuário.
import type { SupabaseClient } from "@supabase/supabase-js";
import { contagemInstituicaoCompleta, listarInstituicoes } from "@/lib/questly/contagem-questoes";
import type { Pergunta } from "@/lib/questao/types";
import { instituicoesQueCasam, nomeExibicaoInstituicao } from "@/lib/cursos/instituicao";
import { ehPro } from "@/lib/plano/plano";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import {
  SIMULADO_FREE_LIMITE_SEMANA,
  gradeVazia,
  normalizarChaveDificuldade,
  type GradeTopico,
} from "./constantes";
import {
  FONTE_AUTORAL,
  ROTULO_AUTORAL,
  idDaFonte,
  melhorRotulo,
  type FonteSimulado,
} from "./fontes";

import {
  analisarHistorico,
  montarQuestoesAnalisadas,
  type ContextoTopico,
  type QuestaoAnalisada,
  type QuestaoCrua,
  type DesempenhoGeral,
  type SimuladoAnalisado,
} from "./analise";

export type { ChaveDificuldade, GradeTopico } from "./constantes";
export type { FonteSimulado } from "./fontes";

export type TopicoSimulado = {
  id: string;
  nome: string;
  /** questões do tópico somando TODAS as fontes */
  questoes: number;
  /** índice de disponibilidade por fonte: fonteId -> dificuldade -> ano -> nº.
   *  Esparso de propósito: a maioria dos tópicos só tem uma ou duas fontes. */
  porFonte: Record<string, GradeTopico>;
  /** aproveitamento do aluno neste tópico (0..100), null sem amostra */
  aproveitamento: number | null;
  /** quantas questões deste tópico o aluno já respondeu (fora do simulado) */
  respondidas: number;
};

export type MateriaSimulado = {
  id: string;
  nome: string;
  questoes: number;
  /** o aluno cursa esta disciplina (tem `subjects`) — ordena e agrupa o passo 1 */
  minha: boolean;
  /** ids das fontes que têm questão nesta disciplina, da maior pra menor */
  fontes: string[];
  topicos: TopicoSimulado[];
  /** aproveitamento médio do aluno na matéria (ponderado por volume), null sem amostra */
  aproveitamento: number | null;
};

// Tudo que o montador precisa: as FONTES disponíveis (as provas de cada
// universidade catalogada + as questões autorais), qual delas é a da
// universidade do aluno, e o escopo montável (matérias -> tópicos com o índice
// de disponibilidade quebrado por fonte).
//
// Até 2026-09-16 isto era recortado à universidade do aluno, e quem não tinha
// provas catalogadas via uma tela vazia. Agora o recorte é do ALUNO: ele
// escolhe as fontes, e a única coisa derivada do perfil é qual fonte vem
// marcada por padrão. `montarSimuladoAction` revalida as fontes pedidas contra
// o banco — o cliente escolhe de onde sortear, mas não inventa de onde.
export type OpcoesSimulado = {
  universidade: string | null;
  /** a universidade do aluno tem provas no banco (só muda texto e padrão) */
  reconhecida: boolean;
  nomeInstituicao: string | null;
  /** id da fonte que corresponde à universidade do aluno, quando existe */
  fontePropriaId: string | null;
  fontes: FonteSimulado[];
  totalQuestoes: number;
  /** anos catalogados, do mais recente pro mais antigo */
  anos: number[];
  materias: MateriaSimulado[];
};

// Resolve os valores crus de questions.instituicao que casam com o texto de
// profiles.universidade do aluno. Não é mais filtro de nada (a fonte é escolha
// do aluno desde 2026-09-16): serve pra saber QUAL das fontes é a da faculdade
// dele — a que vem marcada por padrão e ganha o selo "sua".
async function instituicoesDoAluno(
  supabase: SupabaseClient,
  universidade: string | null,
): Promise<string[]> {
  const termo = (universidade || "").trim();
  if (termo.length < 2) return [];
  // vw_instituicoes (supabase_escala_lancamento.sql): ~8 linhas com os valores
  // distintos. A varredura anterior baixava a coluna `instituicao` de todas as
  // questões e ainda era cortada nas 1000 primeiras pelo teto do PostgREST —
  // uma universidade cujas provas caíssem fora dessa janela simplesmente não
  // era reconhecida, e o aluno via o estado vazio sem motivo.
  const instituicoes = await listarInstituicoes(supabase);
  return instituicoesQueCasam(
    termo,
    instituicoes.map((i) => i.instituicao),
  );
}

export type ContextoInstituicao = {
  universidade: string | null;
  reconhecida: boolean;
  nomeInstituicao: string | null;
};

/**
 * Versão leve pro hub: só "qual é a universidade do aluno e temos provas
 * dela?", que é tudo que a lista usa — pra escolher o TEXTO, não pra liberar
 * ou bloquear coisa alguma. Lê 8 linhas de `vw_instituicoes` em vez de montar
 * a árvore inteira de matérias, que era o que a página fazia antes por reusar
 * `carregarOpcoesSimulado`.
 */
export async function carregarContextoInstituicao(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<ContextoInstituicao> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("universidade")
    .eq("id", user.id)
    .maybeSingle();
  const universidade = perfil?.universidade ?? null;
  const casadas = await instituicoesDoAluno(supabase, universidade);
  return {
    universidade,
    reconhecida: casadas.length > 0,
    nomeInstituicao: nomeExibicaoInstituicao(casadas),
  };
}

const VAZIO: OpcoesSimulado = {
  universidade: null,
  reconhecida: false,
  nomeInstituicao: null,
  fontePropriaId: null,
  fontes: [],
  totalQuestoes: 0,
  anos: [],
  materias: [],
};

export async function carregarOpcoesSimulado(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<OpcoesSimulado> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("universidade")
    .eq("id", user.id)
    .maybeSingle();

  const universidade = perfil?.universidade ?? null;
  const casadas = await instituicoesDoAluno(supabase, universidade);
  const idsProprios = new Set(casadas.map((c) => idDaFonte(c)));

  // As disciplinas que o aluno CURSA — só pra ordenar o passo 1. Com o escopo
  // aberto pro banco inteiro, a lista passou de "as poucas com prova da minha
  // faculdade" pra todas, e sem isto o caminho curto (tocar na disciplina e
  // apertar Começar) viraria uma caçada. Cinco linhas, não é filtro.
  const { data: minhas } = await supabase
    .from("subjects")
    .select("materia_id")
    .eq("user_id", user.id);
  const materiasDoAluno = new Set(
    ((minhas || []) as { materia_id: string | null }[]).map((m) => m.materia_id).filter(Boolean) as string[],
  );

  // A grade INTEIRA (view agregada), não só a da universidade do aluno: o
  // montador agora oferece todas as fontes. Continua sendo contagem agregada —
  // algumas centenas de linhas — e não as linhas cruas das questões, que eram
  // ~310 KB por abertura e ainda vinham truncadas no teto do PostgREST.
  // `totalRegular` mantém o mesmo recorte de montarSimuladoAction:
  // aprofundamento (questions.desafio) não é sorteado, logo não é contado.
  const grade = await contagemInstituicaoCompleta(supabase);

  type AccTopico = { nome: string; questoes: number; porFonte: Record<string, GradeTopico> };
  type AccMateria = { nome: string; questoes: number; topicos: Map<string, AccTopico> };
  const porMateria = new Map<string, AccMateria>();
  const anos = new Set<number>();
  const totalPorFonte = new Map<string, number>();
  const rotuloPorFonte = new Map<string, string>();

  for (const linha of grade) {
    if (linha.totalRegular === 0) continue;
    const { materiaId, materiaNome, topicId } = linha;
    if (!materiaId || !materiaNome || !topicId) continue;
    if (typeof linha.ano === "number") anos.add(linha.ano);

    const fonteId = idDaFonte(linha.instituicao);
    totalPorFonte.set(fonteId, (totalPorFonte.get(fonteId) || 0) + linha.totalRegular);
    if (fonteId !== FONTE_AUTORAL && linha.instituicao) {
      rotuloPorFonte.set(fonteId, melhorRotulo(rotuloPorFonte.get(fonteId) ?? null, linha.instituicao));
    }

    let m = porMateria.get(materiaId);
    if (!m) {
      m = { nome: materiaNome, questoes: 0, topicos: new Map() };
      porMateria.set(materiaId, m);
    }
    m.questoes += linha.totalRegular;

    let tp = m.topicos.get(topicId);
    if (!tp) {
      tp = { nome: linha.topicoNome || "Tópico", questoes: 0, porFonte: {} };
      m.topicos.set(topicId, tp);
    }
    tp.questoes += linha.totalRegular;

    const gradeFonte = (tp.porFonte[fonteId] ??= gradeVazia());
    const dif = normalizarChaveDificuldade(linha.dificuldade);
    const anoChave = typeof linha.ano === "number" ? String(linha.ano) : "0";
    gradeFonte[dif][anoChave] = (gradeFonte[dif][anoChave] || 0) + linha.totalRegular;
  }

  if (porMateria.size === 0) return { ...VAZIO, universidade };

  const fontes: FonteSimulado[] = [...totalPorFonte.entries()]
    .map(([id, questoes]) => ({
      id,
      nome: id === FONTE_AUTORAL ? ROTULO_AUTORAL : rotuloPorFonte.get(id) || id.toUpperCase(),
      questoes,
      propria: idsProprios.has(id),
      autoral: id === FONTE_AUTORAL,
    }))
    // A do aluno primeiro (é o padrão), depois a autoral, depois por tamanho:
    // a ordem da lista é a ordem em que ele lê os chips.
    .sort(
      (a, b) =>
        Number(b.propria) - Number(a.propria) ||
        Number(b.autoral) - Number(a.autoral) ||
        b.questoes - a.questoes ||
        a.nome.localeCompare(b.nome),
    );

  // Aproveitamento do aluno por tópico — é o que deixa o montador dizer "você
  // vai a 42% aqui" e o switch "focar no que erro mais" existir sem chutar.
  // Owner-only por RLS: o SELECT só devolve as linhas do próprio aluno.
  const todosTopicos = [...porMateria.values()].flatMap((m) => [...m.topicos.keys()]);
  const progresso = await carregarProgressoTopicos(supabase, user, todosTopicos);

  const materias: MateriaSimulado[] = [...porMateria.entries()]
    .map(([id, m]) => {
      const topicos: TopicoSimulado[] = [...m.topicos.entries()]
        .map(([tid, t]) => {
          const p = progresso.get(tid);
          return {
            id: tid,
            nome: t.nome,
            questoes: t.questoes,
            porFonte: t.porFonte,
            aproveitamento: p?.pct ?? null,
            respondidas: p?.respondidas ?? 0,
          };
        })
        .sort((a, b) => b.questoes - a.questoes || a.nome.localeCompare(b.nome));

      const comDado = topicos.filter((t) => t.aproveitamento != null);
      const peso = comDado.reduce((s, t) => s + t.respondidas, 0);
      const aproveitamento =
        peso > 0
          ? Math.round(comDado.reduce((s, t) => s + (t.aproveitamento || 0) * t.respondidas, 0) / peso)
          : null;

      const porFonteNaMateria = new Map<string, number>();
      for (const t of topicos) {
        for (const [fonteId, g] of Object.entries(t.porFonte)) {
          let n = 0;
          for (const porAno of Object.values(g)) for (const v of Object.values(porAno)) n += v;
          porFonteNaMateria.set(fonteId, (porFonteNaMateria.get(fonteId) || 0) + n);
        }
      }

      return {
        id,
        nome: m.nome,
        questoes: m.questoes,
        minha: materiasDoAluno.has(id),
        fontes: [...porFonteNaMateria.entries()].sort((a, b) => b[1] - a[1]).map(([fonteId]) => fonteId),
        topicos,
        aproveitamento,
      };
    })
    // Ordem do passo 1: o que ele cursa primeiro, depois o que tem prova da
    // universidade dele, depois pelo tamanho do acervo.
    .sort(
      (a, b) =>
        Number(b.minha) - Number(a.minha) ||
        Number(b.fontes.some((f) => idsProprios.has(f))) - Number(a.fontes.some((f) => idsProprios.has(f))) ||
        b.questoes - a.questoes ||
        a.nome.localeCompare(b.nome),
    );

  const totalQuestoes = materias.reduce((s, m) => s + m.questoes, 0);

  return {
    universidade,
    reconhecida: fontes.some((f) => f.propria),
    nomeInstituicao: nomeExibicaoInstituicao(casadas),
    fontePropriaId: fontes.find((f) => f.propria)?.id ?? null,
    fontes,
    totalQuestoes,
    anos: [...anos].sort((a, b) => b - a),
    materias,
  };
}

/** Amostra mínima pra um tópico ter aproveitamento exibível no montador. */
const MIN_AMOSTRA_APROVEITAMENTO = 3;

async function carregarProgressoTopicos(
  supabase: SupabaseClient,
  user: { id: string },
  topicIds: string[],
): Promise<Map<string, { pct: number | null; respondidas: number }>> {
  const progresso = new Map<string, { pct: number | null; respondidas: number }>();
  if (topicIds.length === 0) return progresso;

  // Sem `.in(topicIds)`: o escopo agora é o banco inteiro e uma lista de
  // centenas de uuids vira uma URL de dezenas de KB, que o PostgREST recusa
  // (ver lib/supabase/paginado.ts). Só voltam os tópicos que o aluno JÁ tocou,
  // que é um conjunto pequeno, e o recorte é feito aqui.
  const { data: prog } = await supabase
    .from("aluno_topico_progresso")
    .select("topico_id, taxa_acerto, num_questoes_respondidas")
    .eq("user_id", user.id);

  const doEscopo = new Set(topicIds);
  for (const linha of (prog || []) as unknown as {
    topico_id: string;
    taxa_acerto: number | null;
    num_questoes_respondidas: number | null;
  }[]) {
    if (!doEscopo.has(linha.topico_id)) continue;
    const respondidas = linha.num_questoes_respondidas || 0;
    progresso.set(linha.topico_id, {
      // Sem amostra não existe aproveitamento — null, nunca 0% (a mesma
      // regra de honestidade de chance-aprovacao.ts).
      pct: respondidas >= MIN_AMOSTRA_APROVEITAMENTO ? Math.round((linha.taxa_acerto || 0) * 100) : null,
      respondidas,
    });
  }
  return progresso;
}

export type StatusPlanoSimulado = {
  ehPro: boolean;
  usadosNaSemana: number;
  limite: number;
  restantes: number; // Infinity vira -1 no wire; a UI trata ehPro à parte
  podeMontar: boolean;
};

// Espelha (não substitui) o gate autoritativo de montarSimuladoAction: quantos
// simulados o aluno free já montou nesta semana e se ainda pode montar.
export async function carregarStatusPlano(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<StatusPlanoSimulado> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  if (ehPro(perfil)) {
    return { ehPro: true, usadosNaSemana: 0, limite: SIMULADO_FREE_LIMITE_SEMANA, restantes: -1, podeMontar: true };
  }

  const segunda = questlySegundaDaSemana(new Date());
  const { count } = await supabase
    .from("simulados_aluno")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("criado_em", segunda);
  const usados = count ?? 0;
  const restantes = Math.max(0, SIMULADO_FREE_LIMITE_SEMANA - usados);
  return {
    ehPro: false,
    usadosNaSemana: usados,
    limite: SIMULADO_FREE_LIMITE_SEMANA,
    restantes,
    podeMontar: restantes > 0,
  };
}

export type SimuladoResumo = {
  id: string;
  titulo: string;
  instituicao: string | null;
  status: "em_andamento" | "concluido" | "abandonado";
  qtd_questoes: number;
  duracao_min: number;
  acertos: number | null;
  total: number | null;
  nota: number | null;
  tempo_gasto_seg: number | null;
  iniciado_em: string;
  concluido_em: string | null;
  criado_em: string;
};

export async function carregarHistorico(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<SimuladoResumo[]> {
  const { data } = await supabase
    .from("simulados_aluno")
    .select(
      "id, titulo, instituicao, status, qtd_questoes, duracao_min, acertos, total, nota, tempo_gasto_seg, iniciado_em, concluido_em, criado_em",
    )
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false })
    .limit(100);
  return (data || []) as SimuladoResumo[];
}

export type SimuladoCompleto = {
  id: string;
  titulo: string;
  instituicao: string | null;
  status: "em_andamento" | "concluido" | "abandonado";
  duracao_min: number;
  qtd_questoes: number;
  question_ids: string[];
  respostas: Record<string, string>;
  iniciado_em: string;
  concluido_em: string | null;
  criado_em: string;
  tempo_gasto_seg: number | null;
  acertos: number | null;
  total: number | null;
  nota: number | null;
  /** perguntas na ordem de aplicação (question_ids) */
  perguntas: Pergunta[];
  /** topic_id -> rótulos, pro detalhamento por matéria/tópico no resultado */
  contexto: Record<string, ContextoTopico>;
  /** question_id -> segundos gastos (best-effort; pode vir vazio) */
  tempos: Record<string, number>;
  /** uma linha por questão, já cruzada com respostas/contexto/tempo */
  analise: QuestaoAnalisada[];
};

export async function carregarSimulado(
  supabase: SupabaseClient,
  user: { id: string },
  id: string,
): Promise<SimuladoCompleto | null> {
  const { data: s } = await supabase
    .from("simulados_aluno")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!s) return null;

  const ids: string[] = s.question_ids || [];
  let perguntas: Pergunta[] = [];
  const contexto: Record<string, ContextoTopico> = {};
  if (ids.length > 0) {
    const { data } = await supabase.from("questions").select("*").in("id", ids);
    const porId = new Map((data || []).map((q) => [q.id, q as Pergunta]));
    // preserva a ordem fixada na criação
    perguntas = ids.map((qid) => porId.get(qid)).filter(Boolean) as Pergunta[];

    const topicIds = [...new Set(perguntas.map((p) => p.topic_id).filter(Boolean))] as string[];
    if (topicIds.length > 0) {
      Object.assign(contexto, await carregarContextoTopicos(supabase, topicIds));
    }
  }

  const respostas = (s.respostas || {}) as Record<string, string>;
  const tempos = normalizarTempos(s.tempos);

  return {
    id: s.id,
    titulo: s.titulo,
    instituicao: s.instituicao,
    status: s.status,
    duracao_min: s.duracao_min,
    qtd_questoes: s.qtd_questoes,
    question_ids: ids,
    respostas,
    iniciado_em: s.iniciado_em,
    concluido_em: s.concluido_em,
    criado_em: s.criado_em,
    tempo_gasto_seg: s.tempo_gasto_seg,
    acertos: s.acertos,
    total: s.total,
    nota: s.nota,
    perguntas,
    contexto,
    tempos,
    analise: montarQuestoesAnalisadas(perguntas, respostas, contexto, tempos),
  };
}

// ---------------------------------------------------------------------------
// Contexto dos tópicos e tempos — compartilhado por um simulado e pelo agregado
// ---------------------------------------------------------------------------

/** `tempos` é jsonb livre: filtra pra number positivo e ignora o resto. */
function normalizarTempos(bruto: unknown): Record<string, number> {
  const saida: Record<string, number> = {};
  if (!bruto || typeof bruto !== "object") return saida;
  for (const [k, v] of Object.entries(bruto as Record<string, unknown>)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) saida[k] = Math.round(n);
  }
  return saida;
}

async function carregarContextoTopicos(
  supabase: SupabaseClient,
  topicIds: string[],
): Promise<Record<string, ContextoTopico>> {
  const contexto: Record<string, ContextoTopico> = {};
  if (topicIds.length === 0) return contexto;
  const { data } = await supabase
    .from("topicos")
    .select("id, nome, materia_id, materias ( nome )")
    .in("id", topicIds);
  for (const t of (data || []) as unknown as {
    id: string;
    nome: string | null;
    materia_id: string | null;
    materias: { nome: string | null } | null;
  }[]) {
    contexto[t.id] = {
      topico: t.nome || "Tópico",
      materia: t.materias?.nome || "Geral",
      materiaId: t.materia_id,
    };
  }
  return contexto;
}

/** Quantos simulados concluídos entram no agregado (do mais recente pra trás). */
const MAX_SIMULADOS_AGREGADO = 40;

/**
 * Desempenho consolidado de TODOS os simulados concluídos do aluno. Faz 3
 * consultas no total (simulados → questões → tópicos), não uma por simulado:
 * junta os `question_ids` de todos eles num `in` só.
 */
export async function carregarDesempenhoGeral(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<DesempenhoGeral> {
  const COLUNAS_BASE =
    "id, titulo, criado_em, nota, acertos, total, tempo_gasto_seg, duracao_min, question_ids, respostas";

  const buscar = (colunas: string) =>
    supabase
      .from("simulados_aluno")
      .select(colunas)
      .eq("user_id", user.id)
      .eq("status", "concluido")
      .order("criado_em", { ascending: false })
      .limit(MAX_SIMULADOS_AGREGADO);

  // `tempos` só existe depois de supabase_simulados_analytics.sql. Sem ele a
  // página inteira ficaria vazia por causa de uma coluna de telemetria — então
  // repete sem ela e a análise sai completa, menos as visões de tempo.
  const comTempos = await buscar(`${COLUNAS_BASE}, tempos`);
  const { data: linhas } = comTempos.error ? await buscar(COLUNAS_BASE) : comTempos;

  const simulados = (linhas || []) as unknown as {
    id: string;
    titulo: string;
    criado_em: string;
    nota: number | null;
    acertos: number | null;
    total: number | null;
    tempo_gasto_seg: number | null;
    duracao_min: number;
    question_ids: string[] | null;
    respostas: Record<string, string> | null;
    tempos: unknown;
  }[];

  if (simulados.length === 0) return analisarHistorico([]);

  const idsQuestoes = [...new Set(simulados.flatMap((s) => s.question_ids || []))];
  const porId = new Map<string, QuestaoCrua>();
  // `in` com lista gigante estoura o tamanho da URL — busca em blocos.
  const BLOCO = 300;
  for (let i = 0; i < idsQuestoes.length; i += BLOCO) {
    const { data } = await supabase
      .from("questions")
      .select("id, topic_id, gabarito, dificuldade, ano, subtopico, tempo_medio_seg")
      .in("id", idsQuestoes.slice(i, i + BLOCO));
    for (const q of (data || []) as unknown as QuestaoCrua[]) porId.set(q.id, q);
  }

  const topicIds = [...new Set([...porId.values()].map((q) => q.topic_id).filter(Boolean))] as string[];
  const contexto = await carregarContextoTopicos(supabase, topicIds);

  const analisados: SimuladoAnalisado[] = simulados.map((s) => {
    const questoes = (s.question_ids || []).map((qid) => porId.get(qid)).filter(Boolean) as QuestaoCrua[];
    return {
      id: s.id,
      titulo: s.titulo,
      criadoEm: s.criado_em,
      nota: Number(s.nota ?? 0),
      acertos: s.acertos ?? 0,
      total: s.total ?? questoes.length,
      tempoGastoSeg: s.tempo_gasto_seg,
      duracaoMin: s.duracao_min,
      questoes: montarQuestoesAnalisadas(questoes, s.respostas || {}, contexto, normalizarTempos(s.tempos)),
    };
  });

  return analisarHistorico(analisados);
}

// ---------------------------------------------------------------------------
// Atalho da home
// ---------------------------------------------------------------------------

export type AtalhoSimulados = {
  /** prova com o relógio correndo — se existe, é a única coisa que importa */
  emAndamento: { id: string; titulo: string; qtdQuestoes: number; duracaoMin: number } | null;
  /** últimas notas em ordem cronológica, pro sparkline */
  notas: { id: string; nota: number; criadoEm: string }[];
  totalConcluidos: number;
  media: number | null;
  ultima: number | null;
  melhor: number | null;
  /** aproveitamento somando acertos/total das provas concluídas (null sem dado) */
  aproveitamento: number | null;
};

/**
 * Uma consulta só, pro card de atalho no dashboard. Deliberadamente NÃO checa
 * se a universidade do aluno tem provas no banco (isso custa uma varredura em
 * `questions`): o card leva pra /simulados, que já dá o estado honesto quando
 * não há conteúdo — a home não pode pagar essa conta a cada carregamento.
 */
export async function carregarAtalhoSimulados(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<AtalhoSimulados> {
  const { data } = await supabase
    .from("simulados_aluno")
    .select("id, titulo, status, nota, acertos, total, criado_em, qtd_questoes, duracao_min")
    .eq("user_id", user.id)
    .in("status", ["em_andamento", "concluido"])
    .order("criado_em", { ascending: false })
    .limit(12);

  const linhas = (data || []) as unknown as {
    id: string;
    titulo: string;
    status: string;
    nota: number | null;
    acertos: number | null;
    total: number | null;
    criado_em: string;
    qtd_questoes: number;
    duracao_min: number;
  }[];

  const emAndamentoLinha = linhas.find((l) => l.status === "em_andamento") || null;
  const concluidos = linhas.filter((l) => l.status === "concluido");
  const notas = concluidos
    .slice(0, 8)
    .reverse()
    .map((l) => ({ id: l.id, nota: Number(l.nota ?? 0), criadoEm: l.criado_em }));

  return {
    emAndamento: emAndamentoLinha
      ? {
          id: emAndamentoLinha.id,
          titulo: emAndamentoLinha.titulo,
          qtdQuestoes: emAndamentoLinha.qtd_questoes,
          duracaoMin: emAndamentoLinha.duracao_min,
        }
      : null,
    notas,
    totalConcluidos: concluidos.length,
    media:
      notas.length > 0 ? Math.round((notas.reduce((a, b) => a + b.nota, 0) / notas.length) * 10) / 10 : null,
    ultima: notas.length > 0 ? notas[notas.length - 1].nota : null,
    melhor: notas.length > 0 ? Math.max(...notas.map((n) => n.nota)) : null,
    aproveitamento: calcularAproveitamento(concluidos),
  };
}

/** Acertos ÷ questões somando as provas concluídas; null se nada foi corrigido. */
function calcularAproveitamento(
  concluidos: { acertos: number | null; total: number | null }[],
): number | null {
  let acertos = 0;
  let total = 0;
  for (const c of concluidos) {
    if (c.total == null || c.total <= 0) continue;
    acertos += c.acertos ?? 0;
    total += c.total;
  }
  return total > 0 ? Math.round((acertos / total) * 100) : null;
}
