// De onde o aluno veio — e pra onde o "X" tem que devolver.
//
// A tela de questões é alcançada por SEIS caminhos diferentes (home, trilha,
// listas de questões, prática livre, revisão de simulado e o próprio desafio
// de recuperação), mas o botão de sair mandava todo mundo pro /dashboard.
// Quem estava percorrendo uma lista de Cálculo perdia o lugar a cada questão
// fechada e tinha que refazer 3 cliques — o clássico "back stack resetada"
// que a diretriz de navegação chama de imprevisível.
//
// A solução é carregar o destino de volta na própria URL (`?de=`), o que
// mantém tudo deep-linkable e sobrevive a refresh — diferente de guardar a
// origem em estado de cliente, que some quando o aluno atualiza a página.

/** Nome do parâmetro que carrega a origem. Curto porque aparece na URL. */
export const PARAM_ORIGEM = "de";

/**
 * Valida a origem antes de usá-la como destino de navegação. Só caminho
 * interno: `//host` e `https://…` são URLs de outro site e viram open
 * redirect se aceitos de um parâmetro que qualquer um edita.
 */
export function origemSegura(de: string | null | undefined, fallback = "/dashboard"): string {
  if (!de || typeof de !== "string") return fallback;
  if (!de.startsWith("/") || de.startsWith("//")) return fallback;
  return de;
}

/** Monta o link da missão preservando de onde o aluno saiu. */
export function hrefQuestao(missaoId: string, origem?: string | null): string {
  const base = `/questao?missao=${encodeURIComponent(missaoId)}`;
  // Voltar pra própria tela de questão seria um laço; nesse caso não marca
  // origem e o fallback (/dashboard) assume.
  if (!origem || origem.startsWith("/questao")) return base;
  return `${base}&${PARAM_ORIGEM}=${encodeURIComponent(origem)}`;
}

/**
 * Rótulo do botão de voltar. Dizer "Voltar pras listas" em vez de um "Voltar"
 * genérico confirma o destino ANTES do clique — o aluno não precisa arriscar
 * pra descobrir se vai perder o lugar.
 */
export function rotuloOrigem(href: string): string {
  if (href.startsWith("/questoes/listas")) return "Voltar pras listas";
  if (href.startsWith("/questoes/favoritos")) return "Voltar pros favoritos";
  if (href.startsWith("/questoes/anotacoes")) return "Voltar pras anotações";
  if (href.startsWith("/questoes")) return "Voltar pro banco";
  if (href.startsWith("/trilha")) return "Voltar pra trilha";
  if (href.startsWith("/simulados")) return "Voltar pros simulados";
  if (href.startsWith("/disciplinas")) return "Voltar pra prática";
  if (href.startsWith("/aprovacao")) return "Voltar pro Modo Aprovação";
  return "Voltar pro início";
}
