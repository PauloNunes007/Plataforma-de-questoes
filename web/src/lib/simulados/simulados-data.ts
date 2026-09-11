// Leituras do módulo de Simulados (Server Components e Server Actions passam o
// SupabaseClient). `questions` é leitura pública pra autenticado; `simulados_aluno`
// é dono-only (RLS) — então tudo aqui já roda no cliente SSR normal do usuário.
import type { SupabaseClient } from "@supabase/supabase-js";
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
  analisarHistorico,
  montarQuestoesAnalisadas,
  type ContextoTopico,
  type QuestaoAnalisada,
  type QuestaoCrua,
  type DesempenhoGeral,
  type SimuladoAnalisado,
} from "./analise";

export type { ChaveDificuldade, GradeTopico } from "./constantes";

export type TopicoSimulado = {
  id: string;
  nome: string;
  questoes: number;
  grade: GradeTopico;
  /** aproveitamento do aluno neste tópico (0..100), null sem amostra */
  aproveitamento: number | null;
  /** quantas questões deste tópico o aluno já respondeu (fora do simulado) */
  respondidas: number;
};

export type MateriaSimulado = {
  id: string;
  nome: string;
  questoes: number;
  topicos: TopicoSimulado[];
  /** aproveitamento médio do aluno na matéria (ponderado por volume), null sem amostra */
  aproveitamento: number | null;
};

// Tudo que o montador precisa: a universidade do aluno, se temos provas dela no
// banco, e o escopo montável (matérias→tópicos com contagem e índice de
// disponibilidade, só do que tem questão daquela instituição). `instituicoes`
// fica só no servidor — a action re-deriva pelo profile, então o cliente nunca
// decide de que universidade sortear.
export type OpcoesSimulado = {
  universidade: string | null;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  totalQuestoes: number;
  /** anos catalogados no recorte da instituição, do mais recente pro mais antigo */
  anos: number[];
  materias: MateriaSimulado[];
};

type LinhaQuestao = {
  id: string;
  ano: number | null;
  dificuldade: string | null;
  topic_id: string | null;
  topicos: { id: string; nome: string | null; materia_id: string | null; materias: { nome: string | null } | null } | null;
};

// Resolve os valores crus de questions.instituicao que casam com o texto de
// profiles.universidade do aluno. Reusado pela action de montar (autoritativo).
export async function instituicoesDoAluno(
  supabase: SupabaseClient,
  universidade: string | null,
): Promise<string[]> {
  const termo = (universidade || "").trim();
  if (termo.length < 2) return [];
  const { data } = await supabase
    .from("questions")
    .select("instituicao")
    .not("instituicao", "is", null)
    .limit(5000);
  return instituicoesQueCasam(
    termo,
    (data || []).map((l: { instituicao: string | null }) => l.instituicao),
  );
}

const VAZIO: OpcoesSimulado = {
  universidade: null,
  reconhecida: false,
  nomeInstituicao: null,
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
  if (casadas.length === 0) return { ...VAZIO, universidade };

  const { data: qs } = await supabase
    .from("questions")
    .select("id, ano, dificuldade, topic_id, topicos!inner ( id, nome, materia_id, materias!inner ( nome ) )")
    .in("instituicao", casadas)
    // Mesmo recorte de montarSimuladoAction: aprofundamento não é sorteado,
    // então também não pode entrar na contagem que o montador exibe.
    .eq("desafio", false)
    .limit(8000);

  type Acc = {
    nome: string;
    questoes: number;
    topicos: Map<string, { nome: string; questoes: number; grade: GradeTopico }>;
  };
  const porMateria = new Map<string, Acc>();
  const anos = new Set<number>();

  for (const q of (qs || []) as unknown as LinhaQuestao[]) {
    const t = q.topicos;
    const materiaId = t?.materia_id;
    const materiaNome = t?.materias?.nome;
    if (!t || !materiaId || !materiaNome || !t.id) continue;
    if (typeof q.ano === "number") anos.add(q.ano);

    let m = porMateria.get(materiaId);
    if (!m) {
      m = { nome: materiaNome, questoes: 0, topicos: new Map() };
      porMateria.set(materiaId, m);
    }
    m.questoes += 1;

    let tp = m.topicos.get(t.id);
    if (!tp) {
      tp = { nome: t.nome || "Tópico", questoes: 0, grade: gradeVazia() };
      m.topicos.set(t.id, tp);
    }
    tp.questoes += 1;
    const dif = normalizarChaveDificuldade(q.dificuldade);
    const anoChave = typeof q.ano === "number" ? String(q.ano) : "0";
    tp.grade[dif][anoChave] = (tp.grade[dif][anoChave] || 0) + 1;
  }

  // Aproveitamento do aluno por tópico — é o que deixa o montador dizer "você
  // vai a 42% aqui" e o preset "focar no que erro mais" existir sem chutar.
  // Owner-only por RLS: o SELECT só devolve as linhas do próprio aluno.
  const todosTopicos = [...porMateria.values()].flatMap((m) => [...m.topicos.keys()]);
  const progresso = new Map<string, { pct: number | null; respondidas: number }>();
  if (todosTopicos.length > 0) {
    const { data: prog } = await supabase
      .from("aluno_topico_progresso")
      .select("topico_id, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", user.id)
      .in("topico_id", todosTopicos.slice(0, 1000));
    for (const linha of (prog || []) as unknown as {
      topico_id: string;
      taxa_acerto: number | null;
      num_questoes_respondidas: number | null;
    }[]) {
      const respondidas = linha.num_questoes_respondidas || 0;
      progresso.set(linha.topico_id, {
        // Sem amostra não existe aproveitamento — null, nunca 0% (a mesma
        // regra de honestidade de chance-aprovacao.ts).
        pct: respondidas >= MIN_AMOSTRA_APROVEITAMENTO ? Math.round((linha.taxa_acerto || 0) * 100) : null,
        respondidas,
      });
    }
  }

  const materias: MateriaSimulado[] = [...porMateria.entries()]
    .map(([id, m]) => {
      const topicos: TopicoSimulado[] = [...m.topicos.entries()]
        .map(([tid, t]) => {
          const p = progresso.get(tid);
          return {
            id: tid,
            nome: t.nome,
            questoes: t.questoes,
            grade: t.grade,
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

      return { id, nome: m.nome, questoes: m.questoes, topicos, aproveitamento };
    })
    .sort((a, b) => b.questoes - a.questoes || a.nome.localeCompare(b.nome));

  const totalQuestoes = materias.reduce((s, m) => s + m.questoes, 0);
  const nomeInstituicao = nomeExibicaoInstituicao(casadas);

  return {
    universidade,
    reconhecida: totalQuestoes > 0,
    nomeInstituicao,
    totalQuestoes,
    anos: [...anos].sort((a, b) => b - a),
    materias,
  };
}

/** Amostra mínima pra um tópico ter aproveitamento exibível no montador. */
const MIN_AMOSTRA_APROVEITAMENTO = 3;

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
