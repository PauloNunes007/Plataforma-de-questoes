"use client";

// Atalho de Simulados no rail da home. Três estados, nessa prioridade:
//   1. prova em andamento → um botão só, "continuar" (tem relógio correndo);
//   2. já fez simulados   → última nota, média e a curva em miniatura;
//   3. nunca fez          → convite curto explicando o que é.
//
// O sparkline aqui é intencionalmente sem eixo e sem rótulo por ponto: ele diz
// só a forma ("subindo/estável/caindo"), e o número que importa (a última nota)
// está escrito ao lado. A leitura precisa mora em /simulados/desempenho.

import Link from "next/link";
import { ArrowUpRight, FileText, Play, Plus } from "lucide-react";
import type { AtalhoSimulados } from "@/lib/simulados/simulados-data";

function sparkline(notas: number[]): { linha: string; ultimo: { x: number; y: number } } | null {
  if (notas.length < 2) return null;
  const W = 92;
  const H = 28;
  const x = (i: number) => (W * i) / (notas.length - 1);
  const y = (n: number) => H - (Math.max(0, Math.min(10, n)) / 10) * H;
  const linha = notas.map((n, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(n).toFixed(1)}`).join(" ");
  return { linha, ultimo: { x: x(notas.length - 1), y: y(notas[notas.length - 1]) } };
}

export function SimuladosCard({ atalho }: { atalho: AtalhoSimulados }) {
  const spark = sparkline(atalho.notas.map((n) => n.nota));

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
            <div>
              <p className="font-heading text-[28px] font-bold leading-none">{atalho.ultima?.toFixed(1)}</p>
              <p className="mt-1 text-[11.5px] font-medium text-muted-foreground">
                última nota · média {atalho.media?.toFixed(1)} em {atalho.totalConcluidos}
              </p>
            </div>
            {spark && (
              <svg
                viewBox="0 0 92 28"
                className="h-8 w-[92px] shrink-0 overflow-visible"
                role="img"
                aria-label={`Suas últimas ${atalho.notas.length} notas, da mais antiga para a mais recente.`}
              >
                <path
                  d={spark.linha}
                  fill="none"
                  stroke="var(--color-questly-green)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={spark.ultimo.x}
                  cy={spark.ultimo.y}
                  r="3"
                  fill="var(--color-questly-green)"
                  stroke="var(--card)"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </div>
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
            Uma prova cronometrada com questões reais da sua universidade — o jeito mais rápido de descobrir o
            que ainda não está pronto.
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
