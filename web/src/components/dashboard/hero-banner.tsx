"use client";

import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import { LigaEmblema } from "@/components/ranking/liga-emblema";
import { LIGA_COR, LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import { FocoHojeChip } from "@/components/foco/foco-bar";
import type { Liga } from "@/lib/questly/liga";

type HeroBannerProps = {
  nome: string;
  fotoUrl: string | null;
  curso: string | null;
  liga: Liga;
  ligaNome: string;
  nivel: number;
  xpTotal: number;
  xpPorNivel: number;
  streakAtual: number;
  recordeStreak: number;
  /** assinante Pro: o retrato ganha aro dourado. Sem selo escrito ao lado do
   *  perfil (pedido do usuário) — a marca do plano vive no ranking. */
  pro?: boolean;
};

// Hero da home: quem é o aluno e onde ele está na progressão. Nada além
// disso — o hero é a linha de IDENTIDADE, não um painel de métricas.
//
// Ele já teve 4 tiles (Nível/Ranking/Conquistas/Streak) e virou o terceiro
// lugar da mesma tela a mostrar posição no ranking e nº de conquistas. Ranking
// foi pra `MetricasStrip` (junto com aproveitamento e percentil, onde compara
// com os outros números do mesmo tipo) e Conquistas foi pra aba Semana (é um
// retrospecto, não um dado de agora). Sobram os dois que são progressão pura:
// nível (com a barra de XP) e streak.
export function HeroBanner({
  nome,
  fotoUrl,
  curso,
  liga,
  ligaNome,
  nivel,
  xpTotal,
  xpPorNivel,
  streakAtual,
  recordeStreak,
  pro = false,
}: HeroBannerProps) {
  const xpNoNivel = xpTotal % xpPorNivel;
  const pctNivel = Math.min(100, (xpNoNivel / xpPorNivel) * 100);
  const cor = LIGA_COR[liga];

  return (
    <div className="surface relative overflow-hidden">
      {/* brilhos de fundo (vida + cor, dark-first) */}
      <div
        className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full opacity-[0.12] blur-3xl dark:opacity-30"
        style={{ background: cor }}
      />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-questly-blue/8 blur-3xl dark:bg-questly-blue/20" />

      <div className="relative flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
        {/* Emblema + perfil */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <motion.span
              className="absolute inset-0 rounded-full opacity-40 blur-lg"
              style={{ background: cor }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <LigaEmblema liga={liga} size={92} className="relative drop-shadow-xl" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-questly-green to-questly-green-deep text-base font-bold text-white dark:text-[#0c1512] ${
                  pro ? "ring-2 ring-questly-gold ring-offset-2 ring-offset-card" : "ring-2 ring-border"
                }`}
              >
                {fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  nome.charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-[19px] font-semibold leading-tight tracking-tight sm:text-[21px]">
                  {nome}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ${LIGA_GRADIENTE[liga]}`}
                  >
                    {ligaNome}
                  </span>
                  {curso && (
                    <span className="truncate text-[12px] text-muted-foreground">{curso}</span>
                  )}
                  <FocoHojeChip />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progressão — só nível e streak */}
        <div className="grid grid-cols-2 gap-2.5 lg:ml-auto lg:w-[300px]">
          {/* Nível + barra de XP */}
          <StatCard>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Nível
              </span>
              <Zap size={14} className="text-questly-purple" strokeWidth={2.2} />
            </div>
            <span className="tnum font-heading text-2xl font-bold leading-none">{nivel}</span>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-questly-purple to-questly-blue"
                style={{ width: `${pctNivel}%` }}
              />
            </div>
            <span className="tnum text-[10px] text-muted-foreground">
              {xpNoNivel.toLocaleString("pt-BR")}/{xpPorNivel.toLocaleString("pt-BR")} XP
            </span>
          </StatCard>

          {/* Streak + recorde */}
          <StatCard>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Streak
              </span>
              <Flame size={14} className="text-questly-orange" strokeWidth={2.2} />
            </div>
            <span className="tnum font-heading text-2xl font-bold leading-none text-questly-orange">
              {streakAtual}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {streakAtual === 1 ? "dia seguido" : "dias seguidos"} · recorde {recordeStreak}
            </span>
          </StatCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-[120px] flex-col gap-1 rounded-xl border border-border bg-background/70 p-3 backdrop-blur-sm dark:bg-background/60">
      {children}
    </div>
  );
}
