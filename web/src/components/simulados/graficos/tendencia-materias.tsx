"use client";

// Evolução por disciplina — gráfico de haltere (dumbbell): um ponto pro
// aproveitamento na primeira metade dos seus simulados, outro na segunda, e o
// traço entre eles é o quanto mudou.
//
// É a forma certa pra "antes → depois por item": duas barras lado a lado
// obrigariam a comparar comprimentos distantes, e uma linha por disciplina
// viraria espaguete. O sentido da mudança é polaridade (melhorou/piorou), então
// vem com cor de status E o número de pontos escrito — nunca só a cor.

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { TendenciaMateria } from "@/lib/simulados/analise";
import { CamadaDica, SemDado, useDica } from "./base";

/** Abaixo disso a variação é ruído de amostra, não tendência. */
const DELTA_RELEVANTE = 5;

export function TendenciaMaterias({ tendencias }: { tendencias: TendenciaMateria[] }) {
  const { ref, dica, mostrar, esconder } = useDica();

  if (tendencias.length === 0) {
    return (
      <SemDado>
        Para comparar “antes e depois” é preciso ter respondido a mesma disciplina em simulados diferentes,
        com pelo menos 3 questões de cada lado. Continue simulando que isso se preenche sozinho.
      </SemDado>
    );
  }

  return (
    <div ref={ref} className="relative flex flex-col gap-4">
      {tendencias.map((t) => {
        const subiu = t.delta >= DELTA_RELEVANTE;
        const caiu = t.delta <= -DELTA_RELEVANTE;
        const cor = subiu
          ? "var(--color-questly-green)"
          : caiu
            ? "var(--color-questly-red)"
            : "var(--color-muted-foreground)";
        const esq = Math.min(t.antes, t.depois);
        const dir = Math.max(t.antes, t.depois);
        return (
          <div key={t.chave}>
            <div className="mb-1.5 flex items-end justify-between gap-3">
              <p className="min-w-0 truncate text-[13px] font-semibold leading-tight">{t.rotulo}</p>
              <span
                className={`tnum inline-flex shrink-0 items-center gap-1 text-[12.5px] font-bold ${
                  subiu ? "text-questly-green-dark" : caiu ? "text-questly-red-dark" : "text-muted-foreground"
                }`}
              >
                {subiu ? <ArrowUpRight size={13} /> : caiu ? <ArrowDownRight size={13} /> : <Minus size={13} />}
                {t.delta > 0 ? "+" : ""}
                {t.delta} pts
              </span>
            </div>

            <div
              className="relative h-6 w-full cursor-default"
              onPointerMove={(e) =>
                mostrar(e, {
                  titulo: t.rotulo,
                  linhas: [
                    `Primeiros simulados: ${t.antes}%`,
                    `Mais recentes: ${t.depois}%`,
                    `${t.total} questões no total`,
                  ],
                })
              }
              onPointerLeave={esconder}
            >
              {/* trilha 0..100 */}
              <span className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted" />
              {/* haltere */}
              <span
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
                style={{ left: `${esq}%`, width: `${Math.max(0.5, dir - esq)}%`, background: cor }}
              />
              {/* ponto "antes": vazado, é o passado */}
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card"
                style={{ left: `${t.antes}%`, borderColor: cor }}
                aria-hidden
              />
              {/* ponto "depois": cheio, é o estado atual */}
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--card)]"
                style={{ left: `${t.depois}%`, background: cor }}
                aria-hidden
              />
              <span className="sr-only">
                {t.rotulo}: {t.antes}% nos primeiros simulados, {t.depois}% nos mais recentes.
              </span>
            </div>

            <div className="tnum mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>antes {t.antes}%</span>
              <span>agora {t.depois}%</span>
            </div>
          </div>
        );
      })}

      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
        Círculo vazado = seus primeiros simulados; círculo cheio = os mais recentes. Variação de menos de{" "}
        {DELTA_RELEVANTE} pontos é tratada como estável.
      </p>

      <CamadaDica dica={dica} />
    </div>
  );
}
