import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

// Identidade visual do Expectrum Pro.
//
// Antes daqui existia uma COROA (lucide `Crown`) sobre gradiente dourado
// saturado, com anel branco — vocabulário de jogo free-to-play ("vire rei!"),
// que destoava do resto do produto e fazia o convite parecer microtransação.
// O Pro é um plano pago de um produto sério: o vocabulário certo é o de
// fintech — marca geométrica, ouro como ACENTO (hairline + texto), superfície
// neutra, tipografia em small-caps espaçada.
//
// A marca é um par de galões ascendentes (`ProMark`): lê como "subir de
// faixa", não como realeza. Desenhada em `currentColor` de propósito — assim
// herda a cor do contexto e funciona de 10px (selo do ranking) a 28px
// (emblema da tela de planos) sem virar borrão nem precisar de id de
// gradiente por instância.

export function ProMark({
  size = 12,
  className = "",
  strokeWidth = 2.1,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <path
        d="M3 8.6 8 3.9l5 4.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12.4 8 7.7l5 4.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
    </svg>
  );
}

// Emblema — a marca dentro de uma pastilha de metal. Pras superfícies grandes
// (cabeçalho da /pro, estado "assinatura ativa", bloqueio de recurso).
// O id do gradiente é fixo (`qpro-ouro`), não `useId`: ele só depende do tom,
// então instâncias compartilham a mesma definição e o componente roda igual em
// Server e Client Component — mesma regra das insígnias.
export function ProEmblema({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-[30%] text-[#2a1d02] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="qpro-ouro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbe6a4" />
            <stop offset="45%" stopColor="#d9a52a" />
            <stop offset="100%" stopColor="#a6760c" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="40" height="40" rx="12" fill="url(#qpro-ouro)" />
        <rect
          x="0.75"
          y="0.75"
          width="38.5"
          height="38.5"
          rx="11.4"
          fill="none"
          stroke="#fff6d9"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
      </svg>
      <ProMark size={size * 0.5} strokeWidth={2.2} className="relative" />
    </span>
  );
}

// Selo "PRO" — usado no card do ranking, no menu e onde precisar diferenciar
// quem assina. Ouro como acento sobre superfície tingida (funciona nos dois
// temas, já que `--questly-gold` é calibrado pra texto em cada um) em vez de
// chapa dourada com texto escuro.
export function ProBadge({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const sm = size === "sm";
  return (
    <span
      title="Assinante Expectrum Pro"
      className={`inline-flex items-center rounded-md border border-questly-gold/35 bg-questly-gold/10 font-semibold uppercase text-questly-gold ${
        sm ? "gap-0.5 px-1.5 py-[1.5px] text-[8.5px] tracking-[0.12em]" : "gap-1 px-2 py-[3px] text-[9.5px] tracking-[0.14em]"
      } ${className}`}
    >
      <ProMark size={sm ? 8 : 10} strokeWidth={2.4} />
      Pro
    </span>
  );
}

// Convite pra assinar no HEADER (desktop e mobile). Pílula discreta de
// hairline dourado — presente sem gritar, no mesmo peso dos outros controles
// da barra.
export function ProCta({
  ehPro,
  className = "",
  compacto = false,
}: {
  ehPro: boolean;
  className?: string;
  compacto?: boolean;
}) {
  return (
    <Link
      href="/pro"
      aria-label={ehPro ? "Expectrum Pro" : "Assinar o Expectrum Pro"}
      title={ehPro ? "Expectrum Pro" : "Assinar o Expectrum Pro"}
      className={`group inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-questly-gold/30 bg-questly-gold/[0.07] font-semibold text-questly-gold transition-colors hover:border-questly-gold/55 hover:bg-questly-gold/15 active:scale-[0.97] ${
        compacto ? "px-2.5 text-[11.5px]" : "px-3 text-[12px]"
      } ${className}`}
    >
      <ProMark size={12} strokeWidth={2.3} />
      {ehPro ? "Pro" : "Seja Pro"}
    </Link>
  );
}

// Bloqueio de recurso premium: card com cadeado + CTA pra /pro. Substitui o
// conteúdo travado pra quem é grátis, em vez de só esconder (deixa claro que o
// recurso existe e vale a pena assinar).
export function ProBloqueio({
  titulo,
  descricao,
  className = "",
  compacto = false,
}: {
  titulo: string;
  descricao: string;
  className?: string;
  compacto?: boolean;
}) {
  return (
    <div
      className={`surface-gold flex flex-col items-center rounded-2xl text-center ${
        compacto ? "gap-1.5 p-4" : "gap-2 p-6"
      } ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-questly-gold/15 text-questly-gold ring-1 ring-questly-gold/25">
        <Lock size={15} strokeWidth={2} />
      </span>
      <p className={`font-heading font-semibold ${compacto ? "text-[13.5px]" : "text-[15px]"}`}>{titulo}</p>
      <p className={`text-muted-foreground ${compacto ? "text-[11.5px]" : "max-w-xs text-[12.5px]"}`}>
        {descricao}
      </p>
      <Link
        href="/pro"
        className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-questly-gold/35 bg-questly-gold/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-questly-gold transition-colors hover:border-questly-gold/60 hover:bg-questly-gold/20 active:scale-[0.98]"
      >
        Conhecer o Pro
        <ArrowRight size={13} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

// Versão inline (chip) pra travar um botão/ação sem ocupar um card inteiro —
// ex.: o "Recomendar" da grade semanal.
export function ProLockChip({ label }: { label: string }) {
  return (
    <Link
      href="/pro"
      className="inline-flex items-center gap-1.5 rounded-full border border-questly-gold/35 bg-questly-gold/10 px-3 py-1.5 text-[12.5px] font-semibold text-questly-gold transition-colors hover:border-questly-gold/60 hover:bg-questly-gold/20"
    >
      <Lock size={13} strokeWidth={2} />
      {label}
    </Link>
  );
}
