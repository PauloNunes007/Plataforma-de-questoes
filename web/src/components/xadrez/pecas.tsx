// Peças do set "cburnett" (Colin M.L. Burnett), o mesmo do lichess —
// SVGs em public/pecas/{w,b}{K,Q,R,B,N,P}.svg, licença CC-BY-SA 3.0 / GFDL
// (fonte: Wikimedia Commons, "Category:SVG chess pieces"). Atribuição
// também em public/pecas/LICENCA.txt. Servidas como <img> estático (cache
// do browser) em vez de inline — o tabuleiro é display-only, nunca precisa
// recolorir path.

export type TipoPeca = "p" | "n" | "b" | "r" | "q" | "k";
export type CorPeca = "w" | "b";

export function urlPeca(cor: CorPeca, tipo: TipoPeca): string {
  return `/pecas/${cor}${tipo.toUpperCase()}.svg`;
}

const NOME_PECA: Record<TipoPeca, string> = {
  p: "peão",
  n: "cavalo",
  b: "bispo",
  r: "torre",
  q: "dama",
  k: "rei",
};

export function Peca({ cor, tipo }: { cor: CorPeca; tipo: TipoPeca }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urlPeca(cor, tipo)}
      alt={`${NOME_PECA[tipo]} ${cor === "w" ? "branco" : "preto"}`}
      draggable={false}
      className="h-full w-full select-none [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.25))]"
    />
  );
}
