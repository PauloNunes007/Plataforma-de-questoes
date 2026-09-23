"use client";

// Botões de NAVEGAÇÃO de um fluxo passo-a-passo (anterior / confirmar /
// próxima / finalizar). Componente da plataforma, não estilo de uma tela: hoje
// o runner de questões (`components/questao/questao-runner.tsx`) e o de
// simulados (`components/simulados/simulado-runner.tsx`) usam os mesmos botões,
// e qualquer fluxo novo com "avançar/voltar" deve entrar por aqui em vez de
// escrever a terceira cópia das classes.
//
// POR QUE ELE EXISTE (repasse de 2026-09-23)
//
// Cada tela tinha a sua régua, e as duas erravam pra lados opostos. No runner
// de questões, "Confirmar resposta" era uma barra de largura INTEIRA com
// `py-3.5` e "Próxima" era `flex-1` com `shadow-lg` — dois slabs que dominavam
// a tela e faziam o "Anterior" de 110px ao lado parecer um acessório. No runner
// de simulados era o contrário: `py-2.5`, discretos. Agora há UMA escala:
//
//   * altura fixa (`md` = 44px, `lg` = 48px) pros três botões do mesmo fluxo —
//     é o que faz "tamanhos proporcionais entre si" ser verdade por construção,
//     e não por coincidência de padding;
//   * largura LIMITADA. No desktop cada botão tem `min-w` (pra ser alvo fácil)
//     e cresce só até o conteúdo — nada de `w-full`. No celular os dois botões
//     da barra dividem a linha em partes iguais (`flex-1`), que é o único caso
//     em que "ocupar tudo" é a leitura certa;
//   * uma sombra só (`elev-sm`, a escala do design system) em vez do
//     `shadow-lg shadow-black/15` que fazia o CTA flutuar acima do cartão.
//
// A hierarquia continua óbvia — o primário é o verde da marca em gradiente, o
// secundário é cartão com borda de verdade (não fundo semitransparente) — mas
// ela agora vem da COR, não do tamanho.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario";
type Tamanho = "md" | "lg";

const ALTURA: Record<Tamanho, string> = {
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-5 text-[15px]",
};

/** Largura mínima por variante: o primário é o alvo principal, então é o mais
 *  largo — mas a razão entre eles fica em ~1,3x, nunca em "slab × botãozinho". */
const LARGURA: Record<Variante, string> = {
  primario: "sm:min-w-[184px]",
  secundario: "sm:min-w-[140px]",
};

const ESTILO: Record<Variante, string> = {
  // Gradiente da própria marca (verde → deep), como o resto do app depois do
  // repasse de cor de 2026-09-16: nada de esmeralda cru fora dos tokens.
  primario: [
    "text-white dark:text-[#04120c]",
    "bg-[linear-gradient(135deg,var(--questly-green),var(--questly-green-dark)_60%,var(--questly-green-deep))]",
    "shadow-sm hover:brightness-[1.07] hover:shadow-md",
  ].join(" "),
  // Borda e fundo SÓLIDOS, e texto `foreground`: o secundário anterior usava
  // `text-muted-foreground` sobre fundo de cartão e lia como desabilitado.
  secundario: [
    "border border-border bg-card text-foreground",
    "shadow-xs hover:border-questly-green/45 hover:bg-muted",
  ].join(" "),
};

export function BotaoNav({
  variante = "primario",
  tamanho = "lg",
  /** `flex` divide a linha em partes iguais no celular (o padrão dentro da
   *  BarraNav). `auto` mantém a largura do conteúdo em qualquer tela. */
  largura = "flex",
  iconeInicio,
  iconeFim,
  className,
  children,
  ...props
}: {
  variante?: Variante;
  tamanho?: Tamanho;
  largura?: "flex" | "auto";
  iconeInicio?: ReactNode;
  iconeFim?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold",
        "transition-[background,border-color,box-shadow,filter,transform] duration-200",
        "active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-questly-green/25",
        ALTURA[tamanho],
        ESTILO[variante],
        largura === "flex" && `flex-1 ${LARGURA[variante]} sm:flex-none`,
        className,
      )}
    >
      {iconeInicio}
      {children}
      {iconeFim}
    </button>
  );
}

/**
 * A linha dos botões de navegação. `justify-between` empurra voltar e avançar
 * pras pontas no desktop (o gesto esperado), e no celular os dois dividem a
 * largura porque aí a linha é o rodapé da tela.
 */
export function BarraNav({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {children}
    </div>
  );
}
