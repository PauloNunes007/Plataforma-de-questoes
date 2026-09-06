import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Estado vazio padrão do app. Regra do design system: um estado vazio nunca é
// só "nada aqui" — ele diz POR QUE está vazio e dá a próxima ação. Antes cada
// tela improvisava um parágrafo cinza, o que fazia a plataforma parecer quebrada
// quando na verdade era só o começo da jornada do aluno.
export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  acaoHref,
  acaoLabel,
  className,
  children,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  acaoHref?: string;
  acaoLabel?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface flex flex-col items-center rounded-2xl px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-muted-foreground">
        <Icon size={22} strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-heading text-[15px] font-semibold tracking-tight">{titulo}</h3>
      {descricao && (
        <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground text-pretty">
          {descricao}
        </p>
      )}
      {acaoHref && acaoLabel && (
        <Link href={acaoHref} className={cn(buttonVariants(), "mt-5 h-10 px-4")}>
          {acaoLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
