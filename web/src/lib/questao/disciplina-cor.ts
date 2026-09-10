// Cor determinística por disciplina pro header do card de questão.
// Mesma família de gradientes vibrantes do disciplina-navegar-grid, mas
// escolhida por hash do nome da matéria (não pela posição numa lista), pra
// que a mesma disciplina tenha sempre a mesma cor em qualquer missão.

const PALETA: { de: string; para: string }[] = [
  { de: "#5b7cf0", para: "#3a52c4" }, // azul
  { de: "#f0555a", para: "#c93338" }, // vermelho
  { de: "#3fbf78", para: "#279357" }, // verde
  { de: "#9b6ff0", para: "#7443d6" }, // roxo
  { de: "#c07a3a", para: "#96591f" }, // marrom
  { de: "#f0a23f", para: "#d67c1a" }, // laranja
  { de: "#2fb6c9", para: "#1a8c9c" }, // teal
  { de: "#e5578f", para: "#c13570" }, // rosa
];

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

/**
 * Multiplica o hex em direção ao preto. Os tons claros da paleta (o laranja
 * #f0a23f, por exemplo) davam ~2,1:1 com texto branco — reprovando em WCAG AA
 * no painel de ação da home. Escurecendo por fator fixo a identidade da
 * disciplina continua reconhecível e o contraste passa em todos os oito tons.
 */
function escurecer(hex: string, fator: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * fator);
  const g = Math.round(((n >> 8) & 255) * fator);
  const b = Math.round((n & 255) * fator);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function corDaDisciplina(nome: string | null | undefined): CorDisciplina {
  const chave = (nome || "").trim().toLowerCase();
  const { de, para } = PALETA[hashNome(chave) % PALETA.length];
  const deProfundo = escurecer(de, 0.6);
  const paraProfundo = escurecer(para, 0.72);
  return {
    de,
    para,
    gradiente: `linear-gradient(135deg, ${de}, ${para})`,
    gradienteProfundo: `linear-gradient(135deg, ${deProfundo}, ${paraProfundo})`,
    profundo: escurecer(para, 0.62),
  };
}
