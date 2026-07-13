"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { MetasHoje } from "@/lib/questly/dashboard-data";

const RAIO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

// Gauge circular de XP do dia — substitui o número "protagonista" plano
// do BossSiegeMeter por uma leitura mais rápida no card do hero da aba
// Hoje. xpMetaHoje é a soma do xp_recompensa de todas as missões de hoje
// (dados.missions), não um alvo fixo — sem meta configurável ainda.
export function XpDiarioCard({
  metas,
  proximaMissaoId,
  proximaMissaoNome,
}: {
  metas: MetasHoje;
  proximaMissaoId: string | null;
  proximaMissaoNome: string | null;
}) {
  const pct = metas.xpMetaHoje > 0 ? Math.min(100, Math.round((metas.xpHoje / metas.xpMetaHoje) * 100)) : 0;
  const offset = CIRCUNFERENCIA - (pct / 100) * CIRCUNFERENCIA;

  return (
    <div className="surface flex flex-col items-center p-5 text-center">
      <span className="mb-3 self-start text-[13.5px] font-semibold tracking-tight">XP Diário</span>

      <div className="relative flex h-[132px] w-[132px] items-center justify-center">
        <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
          <circle cx="66" cy="66" r={RAIO} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <motion.circle
            cx="66"
            cy="66"
            r={RAIO}
            fill="none"
            stroke="var(--questly-green)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            initial={{ strokeDashoffset: CIRCUNFERENCIA }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="rounded-full bg-questly-green-light px-2 py-0.5 text-[10.5px] font-semibold text-questly-green-dark">
            {pct}%
          </span>
          <span className="tnum mt-1.5 font-heading text-2xl font-semibold leading-none">{metas.xpHoje}</span>
          <span className="tnum text-[11px] text-muted-foreground">/ {metas.xpMetaHoje} XP</span>
        </div>
      </div>

      <p className="mt-3 text-[13px] font-medium">
        {metas.xpMetaHoje === 0 ? "Sem missão hoje" : pct >= 100 ? "Meta batida! 🎉" : "Hora de começar!"}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {metas.xpMetaHoje === 0
          ? "Volte amanhã pra sua próxima missão."
          : "Todo progresso começa com o primeiro passo!"}
      </p>

      {proximaMissaoId && (
        <Link
          href={`/questao?missao=${proximaMissaoId}`}
          className="inline-flex w-full items-center justify-between gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-muted/70"
        >
          <span className="min-w-0 truncate">
            <span className="block text-[10.5px] font-normal text-muted-foreground">Continuar de onde parei</span>
            <span className="block truncate">{proximaMissaoNome || "Próxima missão"}</span>
          </span>
          <ArrowRight size={15} strokeWidth={2} className="shrink-0 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}
