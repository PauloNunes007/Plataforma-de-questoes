"use client";

// Primitivas dos gráficos de Simulados. SVG na mão, sem lib de chart (mesma
// linha do gráfico do Modo Aprovação e do resto do app — nada de CDN).
//
// Regras que valem pra TODOS os gráficos daqui:
//  - marca fina, grade em hairline recessivo, sem linha tracejada;
//  - cor é STATUS (bom/atenção/crítico) ou uma escala de um tom só — nunca
//    arco-íris, nunca hue por ranking;
//  - valor nunca existe só no hover: ou está rotulado na marca, ou a tabela
//    espelho (`TabelaEspelho`) mostra tudo em texto;
//  - `<title>` em cada marca dá o mesmo conteúdo pro leitor de tela.

import { useCallback, useRef, useState } from "react";

export type TomStatus = "bom" | "atencao" | "critico" | "neutro";

/** Cor de preenchimento da marca por status (as mesmas do app). */
export const COR_STATUS: Record<TomStatus, string> = {
  bom: "var(--color-questly-green)",
  atencao: "var(--color-questly-gold)",
  critico: "var(--color-questly-red)",
  neutro: "var(--color-muted-foreground)",
};

/** Classe de texto AA-safe correspondente (usada em rótulo, não na marca). */
export const CLASSE_TEXTO_STATUS: Record<TomStatus, string> = {
  bom: "text-questly-green-dark",
  atencao: "text-questly-gold-dark",
  critico: "text-questly-red-dark",
  neutro: "text-muted-foreground",
};

export const CLASSE_BG_STATUS: Record<TomStatus, string> = {
  bom: "bg-questly-green-light",
  atencao: "bg-questly-gold-light",
  critico: "bg-questly-red-light",
  neutro: "bg-muted",
};

export type ConteudoDica = { titulo: string; linhas: string[] };
type Dica = ConteudoDica & { x: number; y: number };

/**
 * Hover/foco dos gráficos. O alvo de toque é sempre uma marca invisível maior
 * que a marca desenhada (regra: nada de alvo de 8px que exige mira).
 */
export function useDica() {
  const ref = useRef<HTMLDivElement>(null);
  const [dica, setDica] = useState<Dica | null>(null);

  const mostrar = useCallback((evento: { clientX: number; clientY: number }, conteudo: ConteudoDica) => {
    const caixa = ref.current?.getBoundingClientRect();
    if (!caixa) return;
    const margem = 88;
    const x = Math.min(Math.max(evento.clientX - caixa.left, margem), Math.max(margem, caixa.width - margem));
    setDica({ ...conteudo, x, y: evento.clientY - caixa.top });
  }, []);

  const esconder = useCallback(() => setDica(null), []);

  return { ref, dica, mostrar, esconder };
}

export function CamadaDica({ dica }: { dica: Dica | null }) {
  if (!dica) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute z-20 w-max max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-border bg-popover px-3 py-2 shadow-lg"
      style={{ left: dica.x, top: dica.y }}
    >
      <p className="text-[12px] font-bold leading-tight">{dica.titulo}</p>
      {dica.linhas.map((l) => (
        <p key={l} className="tnum mt-0.5 text-[11.5px] font-medium leading-tight text-muted-foreground">
          {l}
        </p>
      ))}
    </div>
  );
}

/** Cartão padrão de gráfico: kicker + título + ação opcional + corpo. */
export function CartaoGrafico({
  titulo,
  descricao,
  icone,
  acao,
  children,
  className = "",
}: {
  titulo: string;
  descricao?: string;
  icone?: React.ReactNode;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icone}
            <h2 className="text-sm font-bold">{titulo}</h2>
          </div>
          {descricao && (
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{descricao}</p>
          )}
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      {children}
    </section>
  );
}

/**
 * Tabela espelho de um gráfico — o mesmo dado em texto puro, atrás de um
 * botão. Existe pra nenhum valor depender de enxergar cor ou de acertar o
 * hover (WCAG), e de quebra é o jeito rápido de conferir número exato.
 */
export function TabelaEspelho({
  colunas,
  linhas,
  aberta,
}: {
  colunas: string[];
  linhas: (string | number)[][];
  aberta: boolean;
}) {
  if (!aberta) return null;
  return (
    <div className="rolagem-x mt-4">
      <table className="w-full min-w-[320px] border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border">
            {colunas.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={`py-1.5 font-semibold text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {linha.map((celula, j) => (
                <td
                  key={j}
                  className={`py-1.5 ${j === 0 ? "text-left font-medium" : "tnum text-right text-muted-foreground"}`}
                >
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BotaoDados({ aberta, onToggle }: { aberta: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={aberta}
      className="rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 hover:text-foreground"
    >
      {aberta ? "Ocultar dados" : "Ver dados"}
    </button>
  );
}

/** Legenda de status — identidade nunca fica só na cor. */
export function LegendaStatus({ itens }: { itens: { tom: TomStatus; rotulo: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ background: COR_STATUS[i.tom] }}
          />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

/** Estado vazio interno de um gráfico — honesto, sem inventar dado. */
export function SemDado({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-[12.5px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
