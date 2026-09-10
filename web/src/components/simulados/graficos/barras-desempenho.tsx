"use client";

// Barras horizontais de aproveitamento — o cavalo de batalha das telas de
// simulado (por disciplina, por tópico, por dificuldade).
//
// Forma: barra horizontal ordenada, porque a pergunta que a tela responde é
// "onde eu preciso melhorar?" e comparação de magnitude com rótulo comprido é
// exatamente o caso da barra deitada (radar/pizza não sobreviveriam a nomes
// como "Fundamentos de Cálculo e Geometria"). Cor é STATUS, não identidade —
// e todo valor está rotulado ao lado da barra, então a cor nunca é a única
// informação.

import type { GrupoDesempenho } from "@/lib/simulados/analise";
import { PCT_BOM, fmtSegundos, tomDoPct } from "@/lib/simulados/analise";
import { CLASSE_TEXTO_STATUS, COR_STATUS, CamadaDica, SemDado, useDica } from "./base";

export function BarrasDesempenho({
  grupos,
  mostrarSub = false,
  mostrarTempo = false,
  linhaAlvo = true,
  vazio = "Sem dados suficientes ainda.",
}: {
  grupos: GrupoDesempenho[];
  /** mostra o contexto do grupo (a matéria do tópico) abaixo do nome */
  mostrarSub?: boolean;
  mostrarTempo?: boolean;
  /** marca de referência em PCT_BOM na trilha da barra */
  linhaAlvo?: boolean;
  vazio?: string;
}) {
  const { ref, dica, mostrar, esconder } = useDica();

  if (grupos.length === 0) return <SemDado>{vazio}</SemDado>;

  return (
    <div ref={ref} className="relative flex flex-col gap-3.5">
      {grupos.map((g) => {
        const tom = tomDoPct(g.pct);
        return (
          <div key={g.chave}>
            <div className="mb-1.5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight">{g.rotulo}</p>
                {mostrarSub && g.sub && (
                  <p className="truncate text-[11px] font-medium leading-tight text-muted-foreground">{g.sub}</p>
                )}
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5">
                <span className="tnum text-[11.5px] font-medium text-muted-foreground">
                  {g.acertos}/{g.total}
                </span>
                <span className={`tnum text-[13px] font-bold ${CLASSE_TEXTO_STATUS[tom]}`}>{g.pct}%</span>
              </div>
            </div>

            <div
              className="relative h-2.5 w-full cursor-default overflow-hidden rounded-full bg-muted"
              onPointerMove={(e) =>
                mostrar(e, {
                  titulo: g.rotulo,
                  linhas: [
                    `${g.acertos} ${g.acertos === 1 ? "acerto" : "acertos"} de ${g.total}`,
                    `${g.erros} ${g.erros === 1 ? "erro" : "erros"}${g.brancos > 0 ? ` · ${g.brancos} em branco` : ""}`,
                    ...(mostrarTempo && g.tempoSeg != null ? [`Tempo somado: ${fmtSegundos(g.tempoSeg)}`] : []),
                  ],
                })
              }
              onPointerLeave={esconder}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${g.pct}%`, background: COR_STATUS[tom] }}
              />
              {/* referência de aproveitamento bom — hairline, nunca tracejada */}
              {linhaAlvo && (
                <span
                  aria-hidden
                  className="absolute top-0 h-full w-px bg-foreground/25"
                  style={{ left: `${PCT_BOM}%` }}
                />
              )}
            </div>
          </div>
        );
      })}

      {linhaAlvo && (
        <p className="text-[11px] font-medium text-muted-foreground">
          A marca na barra é {PCT_BOM}% — a linha a partir da qual um conteúdo já conta como bem resolvido.
        </p>
      )}

      <CamadaDica dica={dica} />
    </div>
  );
}
