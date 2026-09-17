// Cor determinística por disciplina — o header do card de questão, a faixa de
// ação da home, o ponto no calendário e o cartão de "continuar".
//
// **Repasse de 2026-09-16.** Este arquivo carregava a SEXTA cópia da paleta de
// giz de cera (`#5b7cf0`, `#f0555a`, `#f0a23f`…): hex cru, igual nos dois
// temas, e no croma cheio que o dono resumiu como "ardendo meus olhos". Agora
// ele consome a MESMA rampa dos cartões de /questoes (PALETA_CARTOES →
// `--cartao-N-*` em globals.css), que é derivada em OKLCH, tem luminosidade
// fixa, troca sozinha no tema escuro e já passou pelo corte de croma.
//
// O que muda de forma prática: as variantes "profundas" não podem mais ser
// calculadas com aritmética de hex, porque a cor só existe na hora de pintar.
// Elas viram `color-mix(in oklab, <token> N%, black)` — mesma intenção
// (escurecer até o branco por cima passar em AA), resolvida pelo browser.

import { PALETA_CARTOES } from "@/lib/questly/paleta-cartoes";

function hashNome(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) {
    h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  }
  return h;
}

export type CorDisciplina = {
  de: string;
  para: string;
  gradiente: string;
  /** Mesma cor puxada pro escuro: passa AA com texto branco por cima. */
  gradienteProfundo: string;
  /** Tom sólido escuro da disciplina — legível como TEXTO sobre branco. */
  profundo: string;
};

/** Mistura o token em direção ao preto, na mesma proporção que o antigo
 *  `escurecer(hex, fator)` fazia à mão. `in oklab` é o que mantém o matiz no
 *  caminho — em sRGB a mistura acinzenta o tom no meio. */
function afundar(cor: string, pctDaCor: number): string {
  return `color-mix(in oklab, ${cor} ${pctDaCor}%, black)`;
}

export function corDaDisciplina(nome: string | null | undefined): CorDisciplina {
  const chave = (nome || "").trim().toLowerCase();
  const [de, para] = PALETA_CARTOES[hashNome(chave) % PALETA_CARTOES.length];
  const deProfundo = afundar(de, 62);
  const paraProfundo = afundar(para, 74);
  return {
    de,
    para,
    gradiente: `linear-gradient(135deg, ${de}, ${para})`,
    gradienteProfundo: `linear-gradient(135deg, ${deProfundo}, ${paraProfundo})`,
    profundo: afundar(para, 64),
  };
}
