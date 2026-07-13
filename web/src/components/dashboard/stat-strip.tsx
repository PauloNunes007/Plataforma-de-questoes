"use client";

// Strip de estatísticas do topo do dashboard (redesign 2026-07).
// Consolida os antigos cards XP/Liga/Streak do rail em três tiles
// compactos; clicar num tile expande o detalhe ALI MESMO (sem navegar),
// via painel animado abaixo do strip — experiência "in-place".
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Zap, Medal, ArrowRight } from "lucide-react";
import type { EstadoLiga, Liga } from "@/lib/questly/liga";

type LigaVisual = (EstadoLiga & { icone: string; nomeExibicao: string }) | null;

type StatStripProps = {
  streakAtual: number;
  streakHeat: boolean[];
  xpTotal: number;
  nivel: number;
  xpPorNivel: number;
  liga: LigaVisual;
};

const COR_LIGA: Record<Liga, string> = {
  bronze: "#b0703c",
  prata: "#8d99ab",
  ouro: "var(--questly-gold)",
  platina: "#3fb6c9",
  diamante: "var(--questly-purple)",
};

type Painel = "streak" | "xp" | "liga";

export function StatStrip({ streakAtual, streakHeat, xpTotal, nivel, xpPorNivel, liga }: StatStripProps) {
  const [aberto, setAberto] = useState<Painel | null>(null);

  const xpNoNivel = xpTotal % xpPorNivel;
  const pctNivel = Math.min(100, (xpNoNivel / xpPorNivel) * 100);
  const corLiga = liga ? COR_LIGA[liga.liga] : "var(--questly-locked-ic)";

  const alternar = (p: Painel) => setAberto((atual) => (atual === p ? null : p));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <Tile
          ativo={aberto === "streak"}
          onClick={() => alternar("streak")}
          icone={<Flame size={17} strokeWidth={1.9} className="text-questly-orange" />}
          iconeBg="bg-questly-orange-light"
          valor={String(streakAtual)}
          rotulo={streakAtual === 1 ? "dia seguido" : "dias seguidos"}
        />
        <Tile
          ativo={aberto === "xp"}
          onClick={() => alternar("xp")}
          icone={<Zap size={17} strokeWidth={1.9} className="text-questly-purple" />}
          iconeBg="bg-questly-purple/10"
          valor={`Nv ${nivel}`}
          rotulo={`${xpTotal.toLocaleString("pt-BR")} XP`}
        />
        <Tile
          ativo={aberto === "liga"}
          onClick={() => alternar("liga")}
          icone={<Medal size={17} strokeWidth={1.9} style={{ color: corLiga }} />}
          iconeBg="bg-muted"
          valor={liga ? liga.nomeExibicao : "—"}
          rotulo={`${(liga?.xp_semana || 0).toLocaleString("pt-BR")} XP na semana`}
        />
      </div>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            key={aberto}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="surface mt-2.5 p-4 sm:p-5">
              {aberto === "streak" && (
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-[13px] font-medium">Constância — últimos 10 dias</span>
                    <span className="text-xs text-muted-foreground">
                      missão cumprida = dia aceso
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5">
                    {streakHeat.map((estudou, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-md ${
                          estudou
                            ? "bg-questly-green"
                            : "border border-border bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {aberto === "xp" && (
                <div>
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <span className="text-[13px] font-medium">Progresso do nível {nivel}</span>
                    <span className="tnum text-xs text-muted-foreground">
                      {xpNoNivel.toLocaleString("pt-BR")} / {xpPorNivel.toLocaleString("pt-BR")} XP
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-questly-purple to-questly-blue"
                      initial={{ width: 0 }}
                      animate={{ width: `${pctNivel}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground">
                    Faltam{" "}
                    <b className="tnum font-semibold text-foreground">
                      {(xpPorNivel - xpNoNivel).toLocaleString("pt-BR")} XP
                    </b>{" "}
                    pro nível {nivel + 1}.
                  </p>
                </div>
              )}

              {aberto === "liga" && liga && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="block text-[13px] font-medium">
                      Liga {liga.nomeExibicao}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(liga.xp_semana || 0).toLocaleString("pt-BR")} XP acumulados nesta rodada
                      semanal
                    </span>
                  </div>
                  <Link
                    href="/ranking"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted"
                  >
                    Ver ranking
                    <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              )}

              {aberto === "liga" && !liga && (
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar sua liga agora.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Tile({
  ativo,
  onClick,
  icone,
  iconeBg,
  valor,
  rotulo,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  iconeBg: string;
  valor: string;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ativo}
      className={`surface flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors sm:gap-3 sm:px-4 sm:py-3 ${
        ativo ? "border-questly-green/40" : "hover:border-foreground/15"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconeBg}`}
      >
        {icone}
      </span>
      <span className="min-w-0">
        <span className="tnum block truncate text-[15px] font-semibold leading-tight tracking-tight">
          {valor}
        </span>
        <span className="block truncate text-[11px] leading-tight text-muted-foreground">
          {rotulo}
        </span>
      </span>
    </button>
  );
}
