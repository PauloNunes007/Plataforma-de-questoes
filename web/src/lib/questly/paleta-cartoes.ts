// Rampa de cor dos cartões de /questoes — a fonte única do que antes era
// um array de hex cru duplicado em disciplina-navegar-grid.tsx e
// lista-topico-card.tsx (e que, por ser hex, era igual nos dois temas).
//
// Os valores moram em globals.css (`--cartao-N-a/b`, ver o comentário
// lá com a derivação em OKLCH e as medidas de contraste); aqui só fica a
// ORDEM. Ela não é alfabética nem por gosto: os matizes ficam a ~150° de
// distância entre vizinhos, porque o índice vem da posição na lista e
// dois cartões adjacentes na grade não podem ler como a mesma cor.
//
// Como o token troca sozinho no tema escuro, quem consome só interpola a
// var no gradiente — não existe mais "a cor do card" em JS.
export const PALETA_CARTOES: readonly [string, string][] = [
  ["var(--cartao-1-a)", "var(--cartao-1-b)"], // índigo
  ["var(--cartao-2-a)", "var(--cartao-2-b)"], // terracota
  ["var(--cartao-3-a)", "var(--cartao-3-b)"], // teal
  ["var(--cartao-4-a)", "var(--cartao-4-b)"], // vinho
  ["var(--cartao-5-a)", "var(--cartao-5-b)"], // verde
  ["var(--cartao-6-a)", "var(--cartao-6-b)"], // violeta
  ["var(--cartao-7-a)", "var(--cartao-7-b)"], // âmbar
  ["var(--cartao-8-a)", "var(--cartao-8-b)"], // aço
];

/** Par (claro, fundo) da rampa para a posição `i` de uma lista. */
export function corDoCartao(i: number): readonly [string, string] {
  return PALETA_CARTOES[((i % PALETA_CARTOES.length) + PALETA_CARTOES.length) % PALETA_CARTOES.length];
}

// Brilho de canto que dá o acabamento "cartão impresso" em cima do
// gradiente chapado — mesma receita nos tiles e na faixa do cartão de
// tópico, pra grade e lista parecerem o mesmo material.
export const VERNIZ_CARTAO =
  "radial-gradient(120% 140% at 14% -25%, rgb(255 255 255 / 0.22), transparent 62%)";
