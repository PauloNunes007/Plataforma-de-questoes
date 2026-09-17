import { cn } from "@/lib/utils";

// Marca da Expectrum. O símbolo é um SVG desenhado: um anel de progresso
// aberto com um núcleo no centro — um mostrador, a leitura de onde o aluno
// está. Funciona em 16px (favicon) e em 512px, em claro e escuro.
//
// A cauda diagonal que existia aqui foi REMOVIDA no rebranding de 2026-09-16:
// ela era o traço do "Q" de Questly e, ao lado da palavra "Expectrum", o
// símbolo lia literalmente como a letra errada. Sem ela o aro fecha como
// mostrador e não sugere letra nenhuma. O resto do símbolo (squircle,
// gradiente da marca, espessura do traço, núcleo) ficou intocado de propósito
// — o pedido foi ajustar o que destoava do nome, não redesenhar a marca.

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
      aria-label="Expectrum"
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
      {!compacto && <span>Expectrum</span>}
    </div>
  );
}
