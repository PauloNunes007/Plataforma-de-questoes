"use server";

// Valida a instituição digitada no onboarding contra o banco de questões: casa o
// texto livre ("UFF", "Universidade Federal Fluminense"…) com os valores de
// `questions.instituicao` e agrega quantas provas/questões temos por disciplina
// e tópico daquela universidade — pra mostrar um selo de verificação (padrão
// "Trust & Authority") e deixar o aluno já escolher as disciplinas dali.
// `questions` é leitura pública pra autenticado (ver CLAUDE.md), então roda no
// cliente SSR normal. A regra de casamento de texto→instituição mora em
// lib/cursos/instituicao.ts (helpers puros, reusados pelo módulo de simulados).
import { createClient } from "@/lib/supabase/server";
import {
  acronimoInstituicao,
  agruparInstituicoes,
  combinaInstituicao,
  nomeExibicaoInstituicao,
  normalizarInstituicao,
  type InstituicaoAgregada,
} from "@/lib/cursos/instituicao";

export type TopicoInstituicao = { nome: string; questoes: number };
export type DisciplinaInstituicao = {
  materia: string;
  questoes: number;
  topicos: TopicoInstituicao[];
};
export type ResultadoInstituicao = {
  reconhecida: boolean;
  nomeExibicao: string | null;
  totalQuestoes: number;
  disciplinas: DisciplinaInstituicao[];
};

const VAZIO: ResultadoInstituicao = {
  reconhecida: false,
  nomeExibicao: null,
  totalQuestoes: 0,
  disciplinas: [],
};

export async function validarInstituicaoAction(texto: string): Promise<ResultadoInstituicao> {
  const entradaNorm = normalizarInstituicao(texto || "");
  if (entradaNorm.length < 2) return VAZIO;

  const supabase = await createClient();

  // 1) Descobre os valores distintos de instituição no banco e casa com o texto.
  //    (PostgREST não tem DISTINCT simples; o banco ainda é pequeno — dedup no JS.)
  const { data: linhas, error } = await supabase
    .from("questions")
    .select("instituicao")
    .not("instituicao", "is", null)
    .limit(5000);

  if (error || !linhas) return VAZIO;

  const entradaAcr = acronimoInstituicao(entradaNorm);
  const instituicoesCasadas = new Set<string>();
  for (const l of linhas as { instituicao: string | null }[]) {
    const raw = (l.instituicao || "").trim();
    if (!raw) continue;
    if (combinaInstituicao(entradaNorm, entradaAcr, normalizarInstituicao(raw))) instituicoesCasadas.add(raw);
  }

  if (instituicoesCasadas.size === 0) return VAZIO;

  const casadas = [...instituicoesCasadas];

  // 2) Agrega questões por matéria/tópico só das instituições casadas.
  const { data: qs } = await supabase
    .from("questions")
    .select("instituicao, topicos!inner ( nome, materias!inner ( nome ) )")
    .in("instituicao", casadas)
    .limit(5000);

  type LinhaQ = {
    topicos: { nome: string | null; materias: { nome: string | null } | null } | null;
  };

  const porMateria = new Map<string, { questoes: number; topicos: Map<string, number> }>();
  for (const q of (qs || []) as unknown as LinhaQ[]) {
    const materia = q.topicos?.materias?.nome;
    const topico = q.topicos?.nome;
    if (!materia) continue;
    let m = porMateria.get(materia);
    if (!m) {
      m = { questoes: 0, topicos: new Map() };
      porMateria.set(materia, m);
    }
    m.questoes += 1;
    if (topico) m.topicos.set(topico, (m.topicos.get(topico) || 0) + 1);
  }

  const disciplinas: DisciplinaInstituicao[] = [...porMateria.entries()]
    .map(([materia, m]) => ({
      materia,
      questoes: m.questoes,
      topicos: [...m.topicos.entries()]
        .map(([nome, questoes]) => ({ nome, questoes }))
        .sort((a, b) => b.questoes - a.questoes),
    }))
    .sort((a, b) => b.questoes - a.questoes);

  const totalQuestoes = disciplinas.reduce((s, d) => s + d.questoes, 0);
  if (totalQuestoes === 0) return VAZIO;

  // Nome de exibição: a instituição em si, sem o rótulo de edição do banco
  // ("UFF (1º sem.)" → "UFF").
  const nomeExibicao = nomeExibicaoInstituicao(casadas);

  return { reconhecida: true, nomeExibicao, totalQuestoes, disciplinas };
}

// Instituições que já têm questões no banco, pro onboarding sugerir em vez de
// exigir que o aluno acerte a grafia no escuro (e pra ele descobrir na hora
// que a universidade dele está coberta). Sem `"use client"` em volta: é uma
// Server Action chamada pelo page.tsx do onboarding.
export async function listarInstituicoesComQuestoes(): Promise<InstituicaoAgregada[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("instituicao")
    .not("instituicao", "is", null)
    .limit(20000);
  return agruparInstituicoes(
    (data || []).map((l: { instituicao: string | null }) => l.instituicao),
  ).filter((i) => ehInstituicaoSugerivel(i.nome));
}

// Nem todo valor de `questions.instituicao` é uma universidade: o campo também
// recebeu código de disciplina ("MAT-111") e o rótulo de autoria própria
// ("Questly"). Sugerir esses como universidade confundiria o aluno.
function ehInstituicaoSugerivel(nome: string): boolean {
  const n = nome.trim().toLowerCase();
  if (n.includes("questly")) return false;
  if (/^[a-z]{2,5}[\s-]?\d{2,4}$/.test(n)) return false; // código de disciplina
  return true;
}
