// Mapeamento puramente visual liga -> gradiente/cor, separado da
// mecânica (lib/questly/liga.ts) pra não misturar regra de negócio com
// estilo. Redesign 2026-07: tons de "material" desaturados, coerentes
// com a paleta madura do design system.
import type { Liga } from "@/lib/questly/liga";

export const LIGA_GRADIENTE: Record<Liga, string> = {
  bronze: "from-[#c98d5b] to-[#7d4a22]",
  prata: "from-[#b8c2cd] to-[#76828f]",
  ouro: "from-[#e3b341] to-[#a97e10]",
  platina: "from-[#54c0d4] to-[#2286a3]",
  diamante: "from-[#a78bfa] to-[#7c3aed]",
};

// Cor sólida de acento por liga (texto/ícones)
export const LIGA_COR: Record<Liga, string> = {
  bronze: "#b0703c",
  prata: "#8d99ab",
  ouro: "#c9930a",
  platina: "#2e9ab3",
  diamante: "#8b5cf6",
};

// Tema do card estilo TCG ("vibe Pokémon", pedido do usuário 2026-07-11)
// no modal de perfil público: a MOLDURA externa é um gradiente metálico
// do material da liga (como a borda amarela de uma carta clássica), o
// corpo usa uma versão profunda do material pra texto branco sempre
// legível, e o "holo" (brilho diagonal animado) só aparece nas ligas
// raras (ouro pra cima), como carta comum vs. holográfica.
export const LIGA_FRAME: Record<Liga, string> = {
  bronze: "from-[#d29a6a] via-[#8a5628] to-[#5e3a1a]",
  prata: "from-[#e6ebf1] via-[#9aa7b5] to-[#6e7a88]",
  ouro: "from-[#f4d47c] via-[#caa02c] to-[#8a6a10]",
  platina: "from-[#9fe6f2] via-[#3fb0c9] to-[#1a7a95]",
  diamante: "from-[#d6c5ff] via-[#a78bfa] to-[#6d28d9]",
};

export const LIGA_CARD_BG: Record<Liga, string> = {
  bronze: "from-[#6e3f22] via-[#54301a] to-[#3a2010]",
  prata: "from-[#6e7b8c] via-[#535e6b] to-[#3a424c]",
  ouro: "from-[#a97e10] via-[#84630c] to-[#544006]",
  platina: "from-[#22808f] via-[#186273] to-[#0d4351]",
  diamante: "from-[#8b5cf6] via-[#6d28d9] to-[#4c1d95]",
};

export const LIGA_HOLO: Record<Liga, boolean> = {
  bronze: false,
  prata: false,
  ouro: true,
  platina: true,
  diamante: true,
};

// Raridade impressa no rodapé do card, como numa carta de TCG.
export const LIGA_RARIDADE: Record<Liga, { simbolo: string; nome: string }> = {
  bronze: { simbolo: "●", nome: "Comum" },
  prata: { simbolo: "◆", nome: "Incomum" },
  ouro: { simbolo: "★", nome: "Rara" },
  platina: { simbolo: "★", nome: "Holo rara" },
  diamante: { simbolo: "✦", nome: "Ultra rara" },
};
