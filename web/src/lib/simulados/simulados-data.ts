// Leituras do módulo de Simulados (Server Components e Server Actions passam o
// SupabaseClient). `questions` é leitura pública pra autenticado; `simulados_aluno`
// é dono-only (RLS) — então tudo aqui já roda no cliente SSR normal do usuário.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pergunta } from "@/lib/questao/types";
import { instituicoesQueCasam } from "@/lib/cursos/instituicao";
import { ehPro } from "@/lib/plano/plano";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { SIMULADO_FREE_LIMITE_SEMANA } from "./constantes";

export type TopicoSimulado = { id: string; nome: string; questoes: number };
export type MateriaSimulado = { id: string; nome: string; questoes: number; topicos: TopicoSimulado[] };

// Tudo que o montador precisa: a universidade do aluno, se temos provas dela no
// banco, e o escopo montável (matérias→tópicos com contagem, só do que tem
// questão daquela instituição). `instituicoes` fica só no servidor — a action
// re-deriva pelo profile, então o cliente nunca decide de que universidade
// sortear.
export type OpcoesSimulado = {
  universidade: string | null;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  totalQuestoes: number;
  anos: number[];
  materias: MateriaSimulado[];
};

type LinhaQuestao = {
  id: string;
  ano: number | null;
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
    .select("id, ano, topic_id, topicos!inner ( id, nome, materia_id, materias!inner ( nome ) )")
    .in("instituicao", casadas)
    .limit(8000);

  const porMateria = new Map<
    string,
    { nome: string; questoes: number; topicos: Map<string, { nome: string; questoes: number }> }
  >();
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
    const tp = m.topicos.get(t.id);
    if (tp) tp.questoes += 1;
    else m.topicos.set(t.id, { nome: t.nome || "Tópico", questoes: 1 });
  }

  const materias: MateriaSimulado[] = [...porMateria.entries()]
    .map(([id, m]) => ({
      id,
      nome: m.nome,
      questoes: m.questoes,
      topicos: [...m.topicos.entries()]
        .map(([tid, t]) => ({ id: tid, nome: t.nome, questoes: t.questoes }))
        .sort((a, b) => b.questoes - a.questoes || a.nome.localeCompare(b.nome)),
    }))
    .sort((a, b) => b.questoes - a.questoes || a.nome.localeCompare(b.nome));

  const totalQuestoes = materias.reduce((s, m) => s + m.questoes, 0);
  const nomeInstituicao = casadas.sort((a, b) => b.length - a.length)[0];

  return {
    universidade,
    reconhecida: totalQuestoes > 0,
    nomeInstituicao,
    totalQuestoes,
    anos: [...anos].sort((a, b) => a - b),
    materias,
  };
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
  tempo_gasto_seg: number | null;
  acertos: number | null;
  total: number | null;
  nota: number | null;
  /** perguntas na ordem de aplicação (question_ids) */
  perguntas: Pergunta[];
  /** topic_id -> rótulos, pro detalhamento por matéria no resultado */
  contexto: Record<string, { topico: string; materia: string }>;
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
  const contexto: Record<string, { topico: string; materia: string }> = {};
  if (ids.length > 0) {
    const { data } = await supabase.from("questions").select("*").in("id", ids);
    const porId = new Map((data || []).map((q) => [q.id, q as Pergunta]));
    // preserva a ordem fixada na criação
    perguntas = ids.map((qid) => porId.get(qid)).filter(Boolean) as Pergunta[];

    const topicIds = [...new Set(perguntas.map((p) => p.topic_id).filter(Boolean))] as string[];
    if (topicIds.length > 0) {
      const { data: tops } = await supabase
        .from("topicos")
        .select("id, nome, materias!inner ( nome )")
        .in("id", topicIds);
      for (const t of (tops || []) as unknown as {
        id: string;
        nome: string | null;
        materias: { nome: string | null } | null;
      }[]) {
        contexto[t.id] = { topico: t.nome || "Tópico", materia: t.materias?.nome || "Geral" };
      }
    }
  }

  return {
    id: s.id,
    titulo: s.titulo,
    instituicao: s.instituicao,
    status: s.status,
    duracao_min: s.duracao_min,
    qtd_questoes: s.qtd_questoes,
    question_ids: ids,
    respostas: (s.respostas || {}) as Record<string, string>,
    iniciado_em: s.iniciado_em,
    concluido_em: s.concluido_em,
    tempo_gasto_seg: s.tempo_gasto_seg,
    acertos: s.acertos,
    total: s.total,
    nota: s.nota,
    perguntas,
    contexto,
  };
}
