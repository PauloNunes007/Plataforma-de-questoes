"use client";

// Botão de AÇÃO SECUNDÁRIA — o grupo "Ver resolução / Estatísticas / Discussão /
// Anotar / Favoritar / Reportar" que acompanha um conteúdo. Componente da
// plataforma: usado no runner de questões, na barra de `QuestaoAcoes` (que
// aparece também em /questoes/favoritos e /questoes/anotacoes) e no gatilho da
// Discussão.
//
// POR QUE ELE EXISTE (repasse de 2026-09-23)
//
// As ações secundárias eram três estilos diferentes escritos à mão em três
// arquivos, todas com o mesmo defeito: fundo semitransparente
// (`bg-questly-gold-light/50`, `bg-questly-green-light/50`) ou fundo NENHUM
// (as pílulas de `QuestaoAcoes` no estado inativo só tinham
// `text-muted-foreground`). Sobre cartão branco isso some. E "Ver resolução",
// que é a ação mais importante do instante seguinte ao erro, era a mais apagada
// das três.
//
// As regras agora:
//
//   * fundo e borda SÓLIDOS. Os pares usados (`-light` de fundo, `-dark` de
//     texto) são os mesmos já aferidos em AA no repasse de cor da marca — o que
//     mudou foi tirar o `/50` que os diluía;
//   * altura fixa por tamanho, igual pra TODOS os botões do grupo. É o que faz
//     o grupo ler como um grupo, em vez de uma fila de botões de tamanhos
//     sorteados;
//   * `destaque` existe pra UMA ação por contexto (hoje: "Ver resolução" depois
//     de confirmar). Ele reforça com anel e sombra, nunca com tamanho — se
//     destacasse crescendo, quebraria a regra acima na primeira vez que fosse
//     usado.
//
// O estado `ativo` é pra ação que alterna (favoritada, anotada, painel aberto):
// inativo já tem contraste próprio, e ativo acrescenta o anel — o inativo
// invisível era justamente o bug.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TomAcao = "gold" | "green" | "blue" | "purple" | "red" | "neutro";
type TamanhoAcao = "sm" | "md";

const ALTURA: Record<TamanhoAcao, string> = {
  sm: "h-9 gap-1.5 px-3 text-[12.5px]",
  md: "h-11 gap-2 px-4 text-[13.5px]",
};

const TOM: Record<TomAcao, { base: string; anel: string; ponto: string }> = {
  gold: {
    base: "border-questly-gold/35 bg-questly-gold-light text-questly-gold-dark hover:border-questly-gold/60",
    anel: "ring-questly-gold/45",
    ponto: "bg-questly-gold",
  },
  green: {
    base: "border-questly-green/35 bg-questly-green-light text-questly-green-dark hover:border-questly-green/60",
    anel: "ring-questly-green/45",
    ponto: "bg-questly-green",
  },
  blue: {
    base: "border-questly-blue/35 bg-questly-blue-light text-questly-blue-dark hover:border-questly-blue/60",
    anel: "ring-questly-blue/45",
    ponto: "bg-questly-blue",
  },
  purple: {
    base: "border-questly-purple/35 bg-questly-purple/12 text-questly-purple hover:border-questly-purple/60",
    anel: "ring-questly-purple/45",
    ponto: "bg-questly-purple",
  },
  red: {
    base: "border-questly-red/35 bg-questly-red-light text-questly-red-dark hover:border-questly-red/60",
    anel: "ring-questly-red/45",
    ponto: "bg-questly-red",
  },
  // Neutro = cartão com borda, não "sem fundo". Continua sendo o mais discreto
  // do grupo, mas ainda se vê.
  neutro: {
    base: "border-border bg-card text-foreground hover:border-questly-green/40 hover:bg-muted",
    anel: "ring-foreground/15",
    ponto: "bg-muted-foreground",
  },
};

export function BotaoAcao({
  tom = "neutro",
  tamanho = "md",
  ativo = false,
  destaque = false,
  icone,
  sufixo,
  className,
  children,
  ...props
}: {
  tom?: TomAcao;
  tamanho?: TamanhoAcao;
  /** ação que alterna e está ligada (favoritada, painel aberto...) */
  ativo?: boolean;
  /** a ação mais importante do contexto — reforça com anel + sombra */
  destaque?: boolean;
  icone?: ReactNode;
  /** conteúdo curto à direita do rótulo (contador, atalho) */
  sufixo?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const estilo = TOM[tom];

  return (
    <button
      type="button"
      aria-pressed={ativo ? true : undefined}
      {...props}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border font-semibold",
        "shadow-xs transition-[background,border-color,box-shadow,transform] duration-200",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-questly-green/25",
        ALTURA[tamanho],
        estilo.base,
        (ativo || destaque) && `ring-1 ${estilo.anel}`,
        destaque && "shadow-sm ring-2",
        className,
      )}
    >
      {destaque && !icone && (
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", estilo.ponto)} />
      )}
      {icone}
      {children}
      {sufixo}
    </button>
  );
}

/**
 * A faixa que agrupa as ações secundárias. `flex-wrap` + gap constante: no
 * celular elas quebram de linha mantendo o alinhamento, em vez de encolher.
 */
export function BarraAcoes({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}
