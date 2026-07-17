import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Header padrão de página (redesign 2026-07-16): título + descrição curta +
// link "voltar" pra subpáginas. Antes cada subpágina inventava (ou omitia) o
// próprio caminho de volta — no celular, sem sidebar visível, o aluno entrava
// numa subrota de /questoes e ficava sem saber onde estava nem como voltar.
// Server-component-friendly (sem "use client").
export function PageHeader({
  titulo,
  descricao,
  voltarHref,
  voltarLabel,
}: {
  titulo: string;
  descricao?: string;
  voltarHref?: string;
  voltarLabel?: string;
}) {
  return (
    <header>
      {voltarHref && (
        <Link
          href={voltarHref}
          className="mb-2 inline-flex min-h-8 items-center gap-0.5 rounded-lg pr-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          {voltarLabel || "Voltar"}
        </Link>
      )}
      <h1 className="font-heading text-[22px] font-semibold tracking-tight">{titulo}</h1>
      {descricao && (
        <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      )}
    </header>
  );
}
