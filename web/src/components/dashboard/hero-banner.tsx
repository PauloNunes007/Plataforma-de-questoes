"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Flame, Award, Zap } from "lucide-react";
import { LigaEmblema } from "@/components/ranking/liga-emblema";
import { LIGA_COR, LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import { FocoHojeChip } from "@/components/foco/foco-bar";
import type { Liga } from "@/lib/questly/liga";
import type { HeroDados } from "@/lib/dashboard/hero-data";

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
  hero: HeroDados;
};

// Hero da home — releitura do topo dos prints da plataforma de referência,
// na identidade do Questly: painel escuro premium com brilho da liga, o
// escudo alado, o perfil e 4 cards de status (Nível/Ranking/Conquistas/
// Streak). Dark-first, com cores vivas por liga.
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
  hero,
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
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-questly-green to-questly-green-deep text-base font-bold text-white ring-2 ring-border dark:text-[#0c1512]">
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

        {/* Cards de status */}
        <div className="grid grid-cols-2 gap-2.5 lg:ml-auto lg:grid-cols-4">
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

          {/* Ranking geral */}
          <Link href="/ranking" className="group">
            <StatCard interativo>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ranking
                </span>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                />
              </div>
              <span className="tnum font-heading text-2xl font-bold leading-none" style={{ color: cor }}>
                {hero.posicaoGeral.toLocaleString("pt-BR")}º
              </span>
              <span className="text-[10px] text-muted-foreground">geral · {ligaNome}</span>
            </StatCard>
          </Link>

          {/* Conquistas */}
          <StatCard>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Conquistas
              </span>
              <Award size={14} className="text-questly-gold" strokeWidth={2.2} />
            </div>
            <span className="tnum font-heading text-2xl font-bold leading-none text-questly-gold">
              {hero.conquistas}
            </span>
            <span className="text-[10px] text-muted-foreground">distintivos</span>
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

function StatCard({
  children,
  interativo = false,
}: {
  children: React.ReactNode;
  interativo?: boolean;
}) {
  return (
    <div
      className={`flex min-w-[120px] flex-col gap-1 rounded-xl border border-border bg-background/70 p-3 backdrop-blur-sm transition-colors dark:bg-background/60 ${
        interativo ? "cursor-pointer hover:border-foreground/20 hover:bg-background" : ""
      }`}
    >
      {children}
    </div>
  );
}
