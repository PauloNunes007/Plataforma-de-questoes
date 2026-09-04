"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, FileText, Timer, Zap, CheckCircle2, Play } from "lucide-react";
import { useFoco, formatarDuracaoCurta } from "@/components/foco/foco-provider";
import type { MetasHoje, SemanaResumo } from "@/lib/questly/dashboard-data";

const RAIO = 30;
const CIRC = 2 * Math.PI * RAIO;

// Card "Missões" no espírito do print da referência, mas com métricas reais
// do Questly: % concluída + anel de XP + mini-stats (questões, foco, XP,
// missões) e um CTA que leva pra próxima missão. Toggle Hoje/Semana.
export function MissoesCard({
  metas,
  semana,
  proximaMissaoId,
}: {
  metas: MetasHoje;
  semana: SemanaResumo;
  proximaMissaoId: string | null;
}) {
  const [aba, setAba] = useState<"hoje" | "semana">("hoje");
  const foco = useFoco();

  const pctConcluida =
    aba === "hoje"
      ? metas.questoesTotal > 0
        ? Math.round((metas.questoesRespondidas / metas.questoesTotal) * 100)
        : 0
      : semana.metaSemanalXp > 0
        ? Math.min(100, Math.round((semana.xpSemana / semana.metaSemanalXp) * 100))
        : 0;

  const xpAtual = aba === "hoje" ? metas.xpHoje : semana.xpSemana;
  const xpMeta = aba === "hoje" ? metas.xpMetaHoje : semana.metaSemanalXp;
  const pctXp = xpMeta > 0 ? Math.min(100, (xpAtual / xpMeta) * 100) : 0;
  const offset = CIRC - (pctXp / 100) * CIRC;

  const focoSeg = foco.montado ? foco.focoHojeSeg : 0;

  return (
    <div className="surface flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={17} strokeWidth={2} className="text-questly-purple" />
          <h3 className="font-heading text-[15px] font-semibold tracking-tight">Missões</h3>
        </div>
        <div className="flex rounded-full bg-muted p-0.5">
          {(["hoje", "semana"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              className={`cursor-pointer rounded-full px-3 py-1 text-[12px] font-semibold capitalize transition-colors ${
                aba === a ? "bg-questly-purple text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <div className="tnum font-heading text-3xl font-bold leading-none">{pctConcluida}%</div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {aba === "hoje" ? "concluídas hoje" : "da meta semanal"}
          </div>
        </div>
        <div className="relative ml-auto h-[76px] w-[76px]">
          <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
            <circle cx="38" cy="38" r={RAIO} fill="none" stroke="var(--muted)" strokeWidth="8" />
            <motion.circle
              cx="38"
              cy="38"
              r={RAIO}
              fill="none"
              stroke="var(--questly-purple)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="tnum text-[13px] font-bold leading-none">{xpAtual}</span>
            <span className="tnum text-[9px] text-muted-foreground">/{xpMeta} XP</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <MiniStat
          icone={<FileText size={14} strokeWidth={2} className="text-questly-blue" />}
          bg="bg-questly-blue/10"
          valor={aba === "hoje" ? `${metas.questoesRespondidas}/${metas.questoesTotal}` : String(semana.xpSemana)}
          rotulo={aba === "hoje" ? "questões" : "XP na semana"}
        />
        <MiniStat
          icone={<Timer size={14} strokeWidth={2} className="text-cyan-500" />}
          bg="bg-cyan-500/10"
          valor={focoSeg > 0 ? formatarDuracaoCurta(focoSeg) : "0min"}
          rotulo="de foco"
        />
        <MiniStat
          icone={<Zap size={14} strokeWidth={2} className="text-questly-purple" />}
          bg="bg-questly-purple/10"
          valor={`${xpAtual}`}
          rotulo="XP"
        />
        <MiniStat
          icone={<CheckCircle2 size={14} strokeWidth={2} className="text-questly-green" />}
          bg="bg-questly-green-light"
          valor={`${metas.missoesConcluidas}/${metas.missoesTotal}`}
          rotulo="missões"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        {proximaMissaoId ? (
          <Link
            href={`/questao?missao=${proximaMissaoId}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-questly-purple to-questly-blue px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Play size={14} strokeWidth={2.5} fill="currentColor" />
            Cumprir missão
          </Link>
        ) : (
          <span className="flex-1 rounded-xl bg-muted px-3 py-2 text-center text-[13px] font-medium text-muted-foreground">
            Tudo feito por hoje 🎉
          </span>
        )}
        <button
          type="button"
          onClick={foco.abrirBarra}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-muted"
        >
          <Timer size={14} strokeWidth={2} className="text-cyan-500" />
          Foco
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  icone,
  bg,
  valor,
  rotulo,
}: {
  icone: React.ReactNode;
  bg: string;
  valor: string;
  rotulo: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 px-2.5 py-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg}`}>{icone}</span>
      <div className="min-w-0">
        <div className="tnum truncate text-[14px] font-bold leading-tight">{valor}</div>
        <div className="truncate text-[10.5px] leading-tight text-muted-foreground">{rotulo}</div>
      </div>
    </div>
  );
}
