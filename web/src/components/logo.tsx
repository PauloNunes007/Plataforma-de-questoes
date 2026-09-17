import { cn } from "@/lib/utils";

// Marca da Expectrum. O símbolo é o ESPECTRO: quatro barras que crescem em
// altura e em opacidade, da mais apagada à cheia. Lê como escala, como
// gráfico e como nível de domínio — e é literalmente o nome, sem precisar de
// legenda. As alturas não crescem em linha reta (4.8 / 7.8 / 12 / 16.8): a
// curva acelera, que é o que separa "gráfico de barras genérico" de uma
// marca com intenção.
//
// Por que essa e não o mostrador anterior (2026-09-16): o aro aberto vinha do
// "Q" de Questly — tirar a cauda diagonal no rebranding resolveu a letra
// errada mas deixou um anel que não dizia nada. As barras sobrevivem a 16px
// (favicon), não sugerem letra nenhuma, e o mesmo desenho volta na interface
// como medidor de domínio.
//
// Duas variantes, de propósito:
// - "solida": squircle com gradiente e barras brancas. É a marca em caixa —
//   favicon, avatar, cartão de link, qualquer lugar onde ela precisa se
//   segurar sozinha sobre fundo que não controlamos.
// - "aberta": só as barras, no gradiente da marca, sem caixa. Mais leve ao
//   lado do wordmark — cabeçalho e landing.
//
// O gradiente usa as variáveis do tema (--questly-green / --questly-green-deep),
// então ele troca sozinho no escuro, como já era antes.

type Variante = "solida" | "aberta";

/** As quatro barras do espectro, em coordenadas do viewBox 0 0 32 32. */
const BARRAS = [
  { x: 6.35, y: 19.6, altura: 4.8, opacidade: 0.5 },
  { x: 11.65, y: 16.6, altura: 7.8, opacidade: 0.68 },
  { x: 16.95, y: 12.4, altura: 12, opacidade: 0.84 },
  { x: 22.25, y: 7.6, altura: 16.8, opacidade: 1 },
] as const;

// Na variante aberta as barras são coloridas (não brancas sobre verde), então
// as mais apagadas precisam de um piso mais alto pra não sumirem no fundo.
const OPACIDADE_ABERTA = [0.45, 0.62, 0.8, 1] as const;

export function LogoMark({
  className,
  size = 28,
  variante = "solida",
}: {
  className?: string;
  size?: number;
  variante?: Variante;
}) {
  const aberta = variante === "aberta";
  const gradienteId = aberta ? "expectrum-mark-aberta" : "expectrum-mark-solida";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label="Expectrum"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradienteId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--questly-green)" />
          <stop offset="100%" stopColor="var(--questly-green-deep)" />
        </linearGradient>
      </defs>
      {!aberta && (
        <rect x="0" y="0" width="32" height="32" rx="9" fill={`url(#${gradienteId})`} />
      )}
      {BARRAS.map((barra, i) => (
        <rect
          key={barra.x}
          x={barra.x}
          y={barra.y}
          width="3.4"
          height={barra.altura}
          rx="1.7"
          fill={aberta ? `url(#${gradienteId})` : "white"}
          opacity={aberta ? OPACIDADE_ABERTA[i] : barra.opacidade}
        />
      ))}
    </svg>
  );
}

export function Logo({
  className,
  size = 28,
  compacto = false,
  variante = "solida",
}: {
  className?: string;
  size?: number;
  /** só o símbolo, sem o wordmark (headers apertados, mobile) */
  compacto?: boolean;
  variante?: Variante;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-heading text-[17px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <LogoMark size={size} variante={variante} />
      {!compacto && <span>Expectrum</span>}
    </div>
  );
}
