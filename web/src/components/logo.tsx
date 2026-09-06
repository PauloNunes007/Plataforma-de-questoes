import { cn } from "@/lib/utils";

// Marca da Questly. O símbolo é um SVG desenhado (não mais a letra "Q" numa
// caixa com gradiente): um anel de progresso aberto — a "quest" em andamento —
// com a cauda do Q formada por um traço ascendente. Funciona em 16px (favicon)
// e em 512px, em claro e escuro, porque usa currentColor no traço e o
// gradiente só no aro.

export function LogoMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label="Questly"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="questly-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--questly-green)" />
          <stop offset="100%" stopColor="var(--questly-green-deep)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#questly-mark-g)" />
      {/* anel de progresso aberto: ~75% completo, abertura embaixo à direita */}
      <path
        d="M23.4 21.6a9 9 0 1 0-3.1 2.7"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* cauda ascendente — o traço do Q virando seta de progresso */}
      <path
        d="M19.2 19.4 24.6 24.8"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* núcleo: o ponto onde o aluno está na trilha */}
      <circle cx="16" cy="16" r="3.1" fill="white" opacity="0.95" />
    </svg>
  );
}

export function Logo({
  className,
  size = 28,
  compacto = false,
}: {
  className?: string;
  size?: number;
  /** só o símbolo, sem o wordmark (headers apertados, mobile) */
  compacto?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-heading text-[17px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <LogoMark size={size} />
      {!compacto && <span>Questly</span>}
    </div>
  );
}
