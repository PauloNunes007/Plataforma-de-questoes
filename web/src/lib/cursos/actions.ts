"use server";

// Valida a instituição digitada no onboarding contra o banco de questões: casa o
// texto livre ("UFF", "Universidade Federal Fluminense"…) com os valores de
// `questions.instituicao` e agrega quantas provas/questões temos por disciplina
// e tópico daquela universidade — pra mostrar um selo de verificação (padrão
// "Trust & Authority") e deixar o aluno já escolher as disciplinas dali.
// `questions` é leitura pública pra autenticado (ver CLAUDE.md), então roda no
// cliente SSR normal.
import { createClient } from "@/lib/supabase/server";

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

const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "the", "of"]);

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function acronimo(nomeNormalizado: string): string {
  return nomeNormalizado
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => w[0])
    .join("");
}

// Casa o texto do aluno com um valor de instituição do banco. Cobre acrônimo
// ("uff" ⇄ "universidade federal fluminense"), igualdade e substring.
function combina(entradaNorm: string, entradaAcr: string, instNorm: string): boolean {
  if (!entradaNorm || !instNorm) return false;
  if (entradaNorm === instNorm) return true;
  const instAcr = acronimo(instNorm);
  if (entradaNorm.length >= 2 && entradaNorm === instAcr) return true;
  if (entradaAcr.length >= 2 && entradaAcr === instAcr) return true;
  if (entradaNorm.length >= 3 && instNorm.includes(entradaNorm)) return true;
  if (instNorm.length >= 3 && entradaNorm.includes(instNorm)) return true;
  return false;
}

export async function validarInstituicaoAction(texto: string): Promise<ResultadoInstituicao> {
  const entradaNorm = normalizar(texto || "");
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

  const entradaAcr = acronimo(entradaNorm);
  const instituicoesCasadas = new Set<string>();
  for (const l of linhas as { instituicao: string | null }[]) {
    const raw = (l.instituicao || "").trim();
    if (!raw) continue;
    if (combina(entradaNorm, entradaAcr, normalizar(raw))) instituicoesCasadas.add(raw);
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

  // Nome de exibição: o valor casado mais descritivo (mais longo).
  const nomeExibicao = casadas.sort((a, b) => b.length - a.length)[0];

  return { reconhecida: true, nomeExibicao, totalQuestoes, disciplinas };
}
