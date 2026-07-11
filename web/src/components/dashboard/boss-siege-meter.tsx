"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { BossAlvo, DiaTicker } from "@/lib/questly/dashboard-data";

type BossSiegeMeterProps = {
  bossAlvo: BossAlvo | null;
  hasSubjects: boolean;
  dayTicker: DiaTicker[];
  missoesPendentesIds: string[];
};

const ESTADO_ESTILO: Record<DiaTicker["estado"], string> = {
  feito: "border-white/0 bg-white/25 text-white",
  perdido: "border-white/10 bg-white/5 text-white/40",
  hoje: "border-white bg-white text-questly-green-dark",
  bloqueado: "border-dashed border-white/20 bg-transparent text-white/35",
};

const ESTADO_ICONE: Record<DiaTicker["estado"], string> = {
  feito: "✓",
  perdido: "·",
  hoje: "🎯",
  bloqueado: "🔒",
};

export function BossSiegeMeter({
  bossAlvo,
  hasSubjects,
  dayTicker,
  missoesPendentesIds,
}: BossSiegeMeterProps) {
  const router = useRouter();

  if (!hasSubjects) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mb-3 text-4xl">🗺️</div>
        <p className="mb-1 font-heading text-lg font-semibold">
          Sua campanha nasce aqui
        </p>
        <p className="text-sm font-semibold text-muted-foreground">
          Configure suas disciplinas e as datas das provas pra desbloquear seu
          primeiro Boss.
        </p>
      </div>
    );
  }

  if (!bossAlvo) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mb-3 text-4xl">⚔️</div>
        <p className="mb-1 font-heading text-lg font-semibold">
          Nenhum Boss no horizonte
        </p>
        <p className="text-sm font-semibold text-muted-foreground">
          Cadastre a data da sua próxima prova pra começar o cerco.
        </p>
      </div>
    );
  }

  const handleHojeClick = () => {
    if (missoesPendentesIds.length === 1) {
      router.push(`/questao?missao=${missoesPendentesIds[0]}`);
    } else if (missoesPendentesIds.length > 1) {
      document.getElementById("missoes-do-dia")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF9600] to-[#D9480F] p-7 text-white shadow-[0_4px_0_#B0470A]">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-white/20 px-3.5 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider">
            ⚔️ Cerco ao Boss
          </span>
          <span className="font-heading text-sm font-bold">
            {bossAlvo.diasAteProva} {bossAlvo.diasAteProva === 1 ? "dia" : "dias"}
          </span>
        </div>

        <h2 className="mb-1 font-heading text-2xl font-semibold">
          {bossAlvo.bossNome}
        </h2>
        <p className="mb-5 text-sm font-semibold text-white/85">
          {bossAlvo.subjectNome}
        </p>

        <div className="mb-2 flex items-center gap-4">
          <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-black/20">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-white to-[#FFE1B3]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, bossAlvo.preparoPercentual)}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <motion.div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/25 text-2xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            👹
          </motion.div>
        </div>
        <div className="mb-6 flex items-center justify-between text-xs font-bold text-white/85">
          <span>{Math.round(bossAlvo.preparoPercentual)}% preparado</span>
          {bossAlvo.chanceAprovacao != null && (
            <span>Chance de aprovação: {bossAlvo.chanceAprovacao}%</span>
          )}
        </div>

        <div className="flex items-end justify-center gap-2.5 border-t border-white/15 pt-5">
          {dayTicker.map((dia) => {
            const isHoje = dia.estado === "hoje";
            return (
              <button
                key={dia.data}
                type="button"
                onClick={isHoje ? handleHojeClick : undefined}
                disabled={!isHoje}
                className={`flex flex-col items-center gap-1.5 ${isHoje ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="font-heading text-[10px] font-bold uppercase tracking-wide text-white/70">
                  {isHoje ? "Hoje" : dia.label}
                </span>
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full">
                  {isHoje && (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-white"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm ${ESTADO_ESTILO[dia.estado]}`}
                  >
                    {ESTADO_ICONE[dia.estado]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
