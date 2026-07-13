import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";

// Selo "PRO" — usado no card do ranking, na sidebar e onde mais precisar
// diferenciar quem é Pro. Dourado, no espírito do resto da gamificação.
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
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-questly-gold to-amber-400 font-bold uppercase tracking-wide text-[#3a2a05] shadow-sm ring-1 ring-white/40 ${
        sm ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${className}`}
    >
      <Crown size={sm ? 9 : 11} strokeWidth={2.5} className="fill-current" />
      Pro
    </span>
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
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-questly-gold/20 text-questly-gold">
        <Lock size={16} strokeWidth={2} />
      </span>
      <p className={`font-heading font-semibold ${compacto ? "text-[13.5px]" : "text-[15px]"}`}>{titulo}</p>
      <p className={`text-muted-foreground ${compacto ? "text-[11.5px]" : "max-w-xs text-[12.5px]"}`}>
        {descricao}
      </p>
      <Link
        href="/pro"
        className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-questly-gold px-3.5 py-1.5 text-[12.5px] font-semibold text-[#3a2a05] shadow-sm transition-[filter] hover:brightness-105 active:scale-[0.98]"
      >
        <Sparkles size={13} strokeWidth={2} />
        Assinar o Pro
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
      className="inline-flex items-center gap-1.5 rounded-full border border-questly-gold/40 bg-questly-gold/10 px-3 py-1.5 text-[12.5px] font-semibold text-questly-gold transition-colors hover:bg-questly-gold/20"
    >
      <Lock size={13} strokeWidth={2} />
      {label}
    </Link>
  );
}
