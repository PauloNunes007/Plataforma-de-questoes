"use client";

// Mapa de calor disciplina × simulado — mostra a consistência que a nota geral
// esconde: uma média 7 pode ser "7 em tudo, sempre" ou "10 em Cálculo e 3 em
// Física, todo simulado". Ler as linhas responde a segunda pergunta.
//
// Escala SEQUENCIAL de um tom só (mais escuro = melhor aproveitamento), com
// legenda de escala e o valor impresso em cada célula — nunca só cor.

import { useMemo } from "react";
import type { SimuladoAnalisado } from "@/lib/simulados/analise";
import { fmtDataCurta, porMateria } from "@/lib/simulados/analise";
import { CamadaDica, SemDado, useDica } from "./base";

/** Quantos simulados cabem em colunas sem virar tabela ilegível. */
const MAX_COLUNAS = 10;

function fundoDaCelula(pct: number): string {
  // 12% → 92% da marca: o piso mantém a célula visível (0% não some no fundo)
  const intensidade = 12 + (Math.max(0, Math.min(100, pct)) / 100) * 80;
  return `color-mix(in oklab, var(--color-questly-green) ${intensidade}%, var(--card))`;
}

/** Acima de ~55% de tinta o texto escuro some — vira branco. */
function classeTextoCelula(pct: number): string {
  return pct >= 55 ? "text-white dark:text-[#0c1512]" : "text-foreground";
}

export function MapaCalor({ simulados }: { simulados: SimuladoAnalisado[] }) {
  const { ref, dica, mostrar, esconder } = useDica();

  const { colunas, linhas } = useMemo(() => {
    const recorte = simulados.slice(-MAX_COLUNAS);
    const materias = porMateria(recorte.flatMap((s) => s.questoes));
    const linhas = materias.map((m) => ({
      chave: m.chave,
      rotulo: m.rotulo,
      geral: m.pct,
      celulas: recorte.map((s) => {
        const grupo = porMateria(s.questoes).find((g) => g.chave === m.chave);
        return grupo ? { pct: grupo.pct, acertos: grupo.acertos, total: grupo.total } : null;
      }),
    }));
    return { colunas: recorte, linhas };
  }, [simulados]);

  if (colunas.length < 2 || linhas.length === 0) {
    return (
      <SemDado>
        O mapa de consistência aparece a partir do segundo simulado — ele compara o seu desempenho em cada
        disciplina de uma prova pra outra.
      </SemDado>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-[2px]">
          <caption className="sr-only">
            Aproveitamento por disciplina em cada um dos últimos {colunas.length} simulados
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-[34%] min-w-[110px] pb-1 text-left text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                Disciplina
              </th>
              {colunas.map((s) => (
                <th key={s.id} scope="col" className="pb-1 text-center text-[9.5px] font-semibold text-muted-foreground">
                  {fmtDataCurta(s.criadoEm)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave}>
                <th scope="row" className="pr-2 text-left align-middle">
                  <span className="block truncate text-[12px] font-semibold leading-tight">{l.rotulo}</span>
                  <span className="tnum block text-[10.5px] font-medium text-muted-foreground">{l.geral}% no total</span>
                </th>
                {l.celulas.map((c, i) =>
                  c ? (
                    <td key={colunas[i].id} className="p-0">
                      <div
                        className={`tnum flex h-9 items-center justify-center rounded-md text-[11px] font-bold ${classeTextoCelula(c.pct)}`}
                        style={{ background: fundoDaCelula(c.pct) }}
                        onPointerMove={(e) =>
                          mostrar(e, {
                            titulo: `${l.rotulo} · ${fmtDataCurta(colunas[i].criadoEm)}`,
                            linhas: [`${c.acertos} de ${c.total} acertos`, `Aproveitamento ${c.pct}%`],
                          })
                        }
                        onPointerLeave={esconder}
                      >
                        {c.pct}
                      </div>
                    </td>
                  ) : (
                    <td key={colunas[i].id} className="p-0">
                      <div
                        className="flex h-9 items-center justify-center rounded-md bg-muted/50 text-[11px] font-medium text-muted-foreground/60"
                        title="Essa disciplina não caiu nesse simulado"
                      >
                        —
                      </div>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* legenda da escala */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Aproveitamento</span>
        <span className="flex items-center gap-1">
          <span className="text-[10.5px] font-medium text-muted-foreground">0%</span>
          <span
            aria-hidden
            className="h-2.5 w-24 rounded-full"
            style={{
              background: `linear-gradient(to right, ${fundoDaCelula(0)}, ${fundoDaCelula(50)}, ${fundoDaCelula(100)})`,
            }}
          />
          <span className="text-[10.5px] font-medium text-muted-foreground">100%</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">· “—” = não caiu naquele simulado</span>
      </div>

      <CamadaDica dica={dica} />
    </div>
  );
}
