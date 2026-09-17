// Paleta semântica compartilhada pelos cartões e pelo painel de /materias.
//
// Antes cada arquivo redeclarava o seu mapa de cores (um com `bg-questly-*/12`,
// outro com `/15`, um com `borda` e outro sem), e o mesmo estado "atenção"
// saía de dois tons diferentes na mesma tela. As classes precisam ser strings
// literais completas pro Tailwind enxergá-las — nada de montar `bg-${cor}`.

export type Tom = "verde" | "amarelo" | "vermelho" | "neutro";

export const TONS: Record<
  Tom,
  {
    /** Texto colorido legível sobre o cartão (AA em claro e escuro). */
    texto: string;
    /** Fundo chapado — barras, pips, pontos. */
    solido: string;
    /** Fundo suave de chip/ícone. */
    suave: string;
    borda: string;
    /** Fio de destaque no topo do cartão. */
    fio: string;
  }
> = {
  verde: {
    texto: "text-questly-green-dark",
    solido: "bg-questly-green",
    suave: "bg-questly-green/12",
    borda: "border-questly-green/25",
    fio: "from-questly-green/70 via-questly-green/25 to-transparent",
  },
  amarelo: {
    texto: "text-questly-orange-dark",
    solido: "bg-questly-orange",
    suave: "bg-questly-orange/12",
    borda: "border-questly-orange/30",
    fio: "from-questly-orange/70 via-questly-orange/25 to-transparent",
  },
  vermelho: {
    texto: "text-questly-red-dark",
    solido: "bg-questly-red",
    suave: "bg-questly-red/12",
    borda: "border-questly-red/30",
    fio: "from-questly-red/70 via-questly-red/25 to-transparent",
  },
  neutro: {
    texto: "text-muted-foreground",
    solido: "bg-muted-foreground/40",
    suave: "bg-muted",
    borda: "border-border",
    fio: "from-border via-border/50 to-transparent",
  },
};

/** Números em pt-BR com casas fixas — "—" quando não há número honesto. */
export function fmt(n: number | null | undefined, casas = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
