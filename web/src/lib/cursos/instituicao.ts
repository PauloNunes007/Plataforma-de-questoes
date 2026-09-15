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

// Tira o que é rótulo de edição/campus e não instituição — "UFF (1º sem.)",
// "UFF - Volta Redonda", "UFF, 2019" → "uff". Sem isso, um valor de banco
// anotado com sufixo não casa pelas regras de sigla abaixo.
export function nucleoInstituicao(nomeNormalizado: string): string {
  return nomeNormalizado
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function acronimoInstituicao(nomeNormalizado: string): string {
  return nucleoInstituicao(nomeNormalizado)
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => w[0])
    .join("");
}

// Um valor que já É uma sigla ("uff", "ufrj") tem acrônimo inútil ("u"). Nesses
// casos a própria palavra é a sigla — é o que permite casar o aluno que digita
// o nome por extenso com o banco, que guarda a sigla.
function siglaDe(nomeNormalizado: string): string {
  const nucleo = nucleoInstituicao(nomeNormalizado);
  if (/^[\p{L}]{2,8}$/u.test(nucleo)) return nucleo;
  return acronimoInstituicao(nucleo);
}

// Casa o texto do aluno com um valor de instituição do banco. Cobre acrônimo
// nos DOIS sentidos ("uff" ⇄ "universidade federal fluminense"), igualdade e
// substring por palavra inteira.
export function combinaInstituicao(
  entradaNorm: string,
  entradaAcr: string,
  instNorm: string,
): boolean {
  if (!entradaNorm || !instNorm) return false;
  if (entradaNorm === instNorm) return true;

  const entradaNucleo = nucleoInstituicao(entradaNorm);
  const instNucleo = nucleoInstituicao(instNorm);
  if (!entradaNucleo || !instNucleo) return false;
  if (entradaNucleo === instNucleo) return true;

  // Sigla ⇄ sigla: cobre "uff" vs "UFF (1º sem.)" e "universidade federal
  // fluminense" vs "UFF" — o segundo caso o acrônimo sozinho não pegava.
  const entradaSigla = entradaAcr && entradaAcr.length >= 2 ? entradaAcr : siglaDe(entradaNucleo);
  const instSigla = siglaDe(instNucleo);
  if (entradaSigla.length >= 2 && entradaSigla === instSigla) return true;

  // Substring, mas só em fronteira de palavra: "uff" casa "uff volta redonda"
  // e não casaria um "uff" no meio de outra palavra.
  const contemPalavra = (texto: string, alvo: string) =>
    alvo.length >= 3 && new RegExp(`(^| )${escaparRegex(alvo)}( |$)`).test(texto);
  if (contemPalavra(instNucleo, entradaNucleo)) return true;
  if (contemPalavra(entradaNucleo, instNucleo)) return true;

  return false;
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

// Nome pra MOSTRAR ao aluno a partir dos valores casados. Antes pegávamos o
// mais longo, o que exibia o rótulo de edição ("UFF (1º sem.)") em vez da
// instituição. Agora agrupamos pelo núcleo e devolvemos o rótulo mais curto —
// preservando a capitalização original do banco.
export function nomeExibicaoInstituicao(casadas: string[]): string | null {
  if (casadas.length === 0) return null;
  const porNucleo = new Map<string, string>();
  for (const c of casadas) {
    const nucleo = nucleoInstituicao(normalizarInstituicao(c));
    const atual = porNucleo.get(nucleo);
    if (!atual || c.length < atual.length) porNucleo.set(nucleo, c);
  }
  // Se um núcleo é sigla de outro ("uff" e "uff volta redonda"), o mais curto
  // é o nome canônico da instituição — é o que o aluno reconhece.
  return [...porNucleo.values()].sort((a, b) => a.length - b.length)[0];
}

// Agrupa os valores crus de `questions.instituicao` em instituições distintas,
// com a contagem somada — a base das sugestões clicáveis do onboarding.
// "UFF", "UFF (1º sem.)" e "UFF (2º sem.)" viram uma linha só: "UFF", 218.
export type InstituicaoAgregada = { nome: string; questoes: number };

export function agruparInstituicoes(valores: (string | null)[]): InstituicaoAgregada[] {
  return agruparInstituicoesContadas(valores.map((v) => ({ instituicao: v, total: 1 })));
}

/** Mesma fusão de edições ("UFF (1º sem.)" + "UFF (2º sem.)" → "UFF"), mas
 *  partindo de valores JÁ contados — que é como a view vw_instituicoes entrega.
 *  Sem isto, o chamador precisava reexpandir a contagem em N repetições da
 *  string só pra ser recontada aqui, o que cresce com o banco inteiro. */
export function agruparInstituicoesContadas(
  valores: { instituicao: string | null; total: number }[],
): InstituicaoAgregada[] {
  const grupos = new Map<string, { nome: string; questoes: number }>();
  for (const { instituicao, total } of valores) {
    const limpo = (instituicao || "").trim();
    if (!limpo) continue;
    const nucleo = nucleoInstituicao(normalizarInstituicao(limpo));
    if (!nucleo) continue;
    const quantas = Math.max(0, total);
    const atual = grupos.get(nucleo);
    if (!atual) grupos.set(nucleo, { nome: limpo, questoes: quantas });
    else {
      atual.questoes += quantas;
      // rótulo canônico = o mais curto (sem "(1º sem.)" e afins)
      if (limpo.length < atual.nome.length) atual.nome = limpo;
    }
  }
  return [...grupos.values()].sort((a, b) => b.questoes - a.questoes);
}
