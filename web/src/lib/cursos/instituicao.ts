// Casamento de texto-livre de instituição ("UFF", "Universidade Federal
// Fluminense"…) com os valores de `questions.instituicao` — helpers PUROS
// (sem Supabase), extraídos de lib/cursos/actions.ts pra serem reusados pelo
// módulo de simulados (que precisa filtrar o banco pela universidade do aluno
// exatamente com a mesma regra do selo de verificação do onboarding).

const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "the", "of"]);

export function normalizarInstituicao(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function acronimoInstituicao(nomeNormalizado: string): string {
  return nomeNormalizado
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => w[0])
    .join("");
}

// Casa o texto do aluno com um valor de instituição do banco. Cobre acrônimo
// ("uff" ⇄ "universidade federal fluminense"), igualdade e substring.
export function combinaInstituicao(entradaNorm: string, entradaAcr: string, instNorm: string): boolean {
  if (!entradaNorm || !instNorm) return false;
  if (entradaNorm === instNorm) return true;
  const instAcr = acronimoInstituicao(instNorm);
  if (entradaNorm.length >= 2 && entradaNorm === instAcr) return true;
  if (entradaAcr.length >= 2 && entradaAcr === instAcr) return true;
  if (entradaNorm.length >= 3 && instNorm.includes(entradaNorm)) return true;
  if (instNorm.length >= 3 && entradaNorm.includes(instNorm)) return true;
  return false;
}

// Dado o texto do aluno e a lista de valores distintos de instituição do banco,
// devolve os valores crus (como estão em questions.instituicao) que casam.
export function instituicoesQueCasam(texto: string, valoresBanco: (string | null)[]): string[] {
  const entradaNorm = normalizarInstituicao(texto || "");
  if (entradaNorm.length < 2) return [];
  const entradaAcr = acronimoInstituicao(entradaNorm);
  const casadas = new Set<string>();
  for (const raw of valoresBanco) {
    const limpo = (raw || "").trim();
    if (!limpo) continue;
    if (combinaInstituicao(entradaNorm, entradaAcr, normalizarInstituicao(limpo))) casadas.add(limpo);
  }
  return [...casadas];
}
