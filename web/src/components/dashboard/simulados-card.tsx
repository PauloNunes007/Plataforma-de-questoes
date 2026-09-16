"use client";

// Atalho de Simulados no rail da home — "como você está indo nos simulados",
// resumido no tamanho de um cartão de rail. Três estados, nessa prioridade:
//   1. prova em andamento → um botão só, "continuar" (tem relógio correndo);
//   2. já fez simulados   → última nota + a curva + os dois números que o aluno
//      compara sozinho de qualquer jeito (média e aproveitamento);
//   3. nunca fez          → convite curto explicando o que é.
//
// O sparkline é intencionalmente sem eixo e sem rótulo por ponto: ele diz só a
// forma ("subindo/estável/caindo"), e o número que importa (a última nota) está
// escrito ao lado. A leitura precisa mora em /simulados e /simulados/desempenho.

import Link from "next/link";
import { ArrowUpRight, FileText, Play, Plus, TrendingDown, TrendingUp } from "lucide-react";
import type { AtalhoSimulados } from "@/lib/simulados/simulados-data";

function sparkline(notas: number[]): { linha: string; area: string; ultimo: { x: number; y: number } } | null {
  if (notas.length < 2) return null;
  const W = 100;
  const H = 30;
  const x = (i: number) => (W * i) / (notas.length - 1);
  const y = (n: number) => H - (Math.max(0, Math.min(10, n)) / 10) * H;
  const linha = notas.map((n, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(n).toFixed(1)}`).join(" ");
  const area = `${linha} L ${W} ${H} L 0 ${H} Z`;
  return { linha, area, ultimo: { x: x(notas.length - 1), y: y(notas[notas.length - 1]) } };
}

export function SimuladosCard({ atalho }: { atalho: AtalhoSimulados }) {
  const spark = sparkline(atalho.notas.map((n) => n.nota));
  // Tendência = última nota contra a média das anteriores. É a leitura honesta
  // de "estou melhorando?" com poucos pontos — comparar só com a prova anterior
  // transformaria um dia ruim em queda de tendência.
  const anteriores = atalho.notas.slice(0, -1);
  const tendencia =
    atalho.ultima != null && anteriores.length > 0
      ? atalho.ultima - anteriores.reduce((a, b) => a + b.nota, 0) / anteriores.length
      : null;

  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold tracking-tight">
          <FileText size={15} className="text-questly-green" />
          Simulados
        </span>
        <Link
          href="/simulados"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todos
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      </div>

      {atalho.emAndamento ? (
        <>
          <p className="truncate text-[13px] font-semibold">{atalho.emAndamento.titulo}</p>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
            {atalho.emAndamento.qtdQuestoes} questões · {atalho.emAndamento.duracaoMin}min — o relógio já está
            correndo.
          </p>
          <Link
            href={`/simulados/${atalho.emAndamento.id}`}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-questly-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <Play size={15} /> Continuar prova
          </Link>
        </>
      ) : atalho.totalConcluidos > 0 ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <p className="tnum font-heading text-[30px] font-bold leading-none">
                  {atalho.ultima?.toFixed(1)}
                </p>
                {tendencia != null && Math.abs(tendencia) >= 0.05 && (
                  <span
                    className={`tnum inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
                      tendencia > 0
                        ? "bg-questly-green-light text-questly-green-dark"
                        : "bg-questly-red-light text-questly-red-dark"
                    }`}
                  >
                    {tendencia > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {tendencia > 0 ? "+" : ""}
                    {tendencia.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11.5px] font-medium text-muted-foreground">
                última nota · {atalho.totalConcluidos}{" "}
                {atalho.totalConcluidos === 1 ? "prova feita" : "provas feitas"}
              </p>
            </div>
            {spark && (
              <svg
                viewBox="0 0 100 30"
                preserveAspectRatio="none"
                className="h-9 w-[100px] shrink-0 overflow-visible"
                role="img"
                aria-label={`Suas últimas ${atalho.notas.length} notas, da mais antiga para a mais recente.`}
              >
                <path d={spark.area} fill="var(--color-questly-green)" fillOpacity="0.12" />
                <path
                  d={spark.linha}
                  fill="none"
                  stroke="var(--color-questly-green)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={spark.ultimo.x}
                  cy={spark.ultimo.y}
                  r="2.6"
                  fill="var(--color-questly-green)"
                  stroke="var(--card)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            )}
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-1.5 border-t border-border pt-3">
            <Mini rotulo="média" valor={atalho.media?.toFixed(1) ?? "—"} />
            <Mini rotulo="melhor" valor={atalho.melhor?.toFixed(1) ?? "—"} />
            <Mini
              rotulo="acertos"
              valor={atalho.aproveitamento != null ? `${atalho.aproveitamento}%` : "—"}
            />
          </dl>

          <div className="mt-3 flex gap-2">
            <Link
              href="/simulados/montar"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-questly-green px-3 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
            >
              <Plus size={14} strokeWidth={2.5} /> Novo
            </Link>
            <Link
              href="/simulados/desempenho"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 hover:text-foreground"
            >
              Desempenho
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Uma prova cronometrada, montada por você: provas da sua universidade, questões autorais, ou as
            duas — o jeito mais rápido de descobrir o que ainda não está pronto.
          </p>
          <Link
            href="/simulados"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            <Plus size={15} strokeWidth={2.5} /> Montar simulado
          </Link>
        </>
      )}
    </div>
  );
}

function Mini({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0 text-center">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="tnum mt-0.5 text-[15px] font-bold leading-none">{valor}</dd>
    </div>
  );
}
