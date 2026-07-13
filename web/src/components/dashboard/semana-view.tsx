"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Target, Trophy, Users, Zap } from "lucide-react";
import type { SemanaResumo } from "@/lib/questly/dashboard-data";
import { ProBloqueio } from "@/components/plano/pro-ui";

const RAIO = 46;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

// Aba "Semana" (redesign vibrante — estilo "Vibrant & Block-based" da skill
// ui-ux-pro-max): tira de 7 dias no topo + 4 blocos coloridos de alto
// contraste (XP da semana, Streak, Comparativo, Recorde). Os dados de
// Comparativo/Recorde são reais (percentil cross-user por xp_semana e maior
// streak histórico do daily_logs) — sem número inventado, ver dashboard-data.ts.
export function SemanaView({ semana, ehPro }: { semana: SemanaResumo; ehPro: boolean }) {
  const reduzirMovimento = useReducedMotion();
  const diasComEstudo = semana.dias.filter((d) => d.estudou).length;
  const pctXp = Math.min(100, Math.round((semana.xpSemana / semana.metaSemanalXp) * 100));
  const faltamXp = Math.max(0, semana.metaSemanalXp - semana.xpSemana);
  const maxXpDia = Math.max(1, ...semana.dias.map((d) => d.xpGanho));

  const entrada = (i: number) =>
    reduzirMovimento
      ? {}
      : {
          initial: { opacity: 0, y: 16, scale: 0.96 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const, delay: i * 0.06 },
        };

  return (
    <div className="flex flex-col gap-4">
      {/* Tira de 7 dias — barras de XP com o dia de hoje em destaque vivo */}
      <motion.div {...entrada(0)} className="surface p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13.5px] font-semibold tracking-tight">Sua semana</span>
          <span className="text-xs font-medium text-muted-foreground">
            {diasComEstudo} de 7 dias ativos
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {semana.dias.map((d) => {
            const alturaPct = d.xpGanho > 0 ? Math.max(14, (d.xpGanho / maxXpDia) * 100) : 0;
            return (
              <div key={d.data} className="flex flex-col items-center gap-1.5">
                <span
                  className={`tnum text-[10.5px] font-bold ${
                    d.xpGanho > 0 ? "text-questly-orange-dark" : "text-muted-foreground/50"
                  }`}
                >
                  {d.xpGanho > 0 ? `+${d.xpGanho}` : "–"}
                </span>
                <div className="flex h-20 w-full items-end overflow-hidden rounded-lg bg-muted">
                  {d.xpGanho > 0 && (
                    <motion.div
                      initial={reduzirMovimento ? false : { height: 0 }}
                      animate={{ height: `${alturaPct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                      className={`w-full rounded-lg ${
                        d.hoje
                          ? "bg-gradient-to-t from-questly-orange to-questly-gold"
                          : "bg-gradient-to-t from-questly-green to-questly-green/70"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    d.hoje
                      ? "bg-questly-orange text-white dark:text-[#241703]"
                      : d.estudou
                        ? "bg-questly-green-light text-questly-green-dark"
                        : "bg-muted text-muted-foreground/60"
                  }`}
                >
                  {d.label.charAt(0).toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 4 blocos vibrantes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* XP DA SEMANA — gauge circular */}
        <motion.div
          {...entrada(1)}
          className="relative overflow-hidden rounded-2xl border border-questly-green/25 bg-gradient-to-br from-questly-green-light to-card p-5"
        >
          <BlocoTitulo icone={<Zap size={15} strokeWidth={2.2} />} cor="text-questly-green-dark">
            XP da Semana
          </BlocoTitulo>
          <div className="mx-auto flex h-[124px] w-[124px] items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <svg width="124" height="124" viewBox="0 0 124 124" className="-rotate-90">
                <circle cx="62" cy="62" r={RAIO} fill="none" stroke="var(--muted)" strokeWidth="9" />
                <motion.circle
                  cx="62"
                  cy="62"
                  r={RAIO}
                  fill="none"
                  stroke="var(--questly-green)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUNFERENCIA}
                  initial={reduzirMovimento ? false : { strokeDashoffset: CIRCUNFERENCIA }}
                  animate={{ strokeDashoffset: CIRCUNFERENCIA - (pctXp / 100) * CIRCUNFERENCIA }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="rounded-full bg-questly-green px-2 py-0.5 text-[10px] font-bold text-white dark:text-[#0c1512]">
                  {pctXp}%
                </span>
                <span className="tnum mt-1 font-heading text-2xl font-extrabold leading-none">
                  {semana.xpSemana}
                </span>
                <span className="tnum text-[10.5px] text-muted-foreground">/ {semana.metaSemanalXp}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {faltamXp > 0 ? (
              <>
                Faltam <b className="tnum font-bold text-questly-green-dark">{faltamXp} XP</b>
              </>
            ) : (
              "Meta da semana batida! 🎉"
            )}
          </p>
        </motion.div>

        {/* STREAK — chama + chips dos dias */}
        <motion.div
          {...entrada(2)}
          className="relative overflow-hidden rounded-2xl border border-questly-orange/25 bg-gradient-to-br from-questly-orange-light to-card p-5"
        >
          <BlocoTitulo icone={<Flame size={15} strokeWidth={2.2} />} cor="text-questly-orange-dark">
            Streak
          </BlocoTitulo>
          <div className="flex flex-col items-center">
            <motion.div
              animate={reduzirMovimento ? {} : { scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame size={54} strokeWidth={1.6} className="fill-questly-orange/20 text-questly-orange" />
            </motion.div>
            <span className="tnum mt-1 font-heading text-3xl font-extrabold leading-none">
              {semana.streakAtual}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {semana.streakAtual === 1 ? "dia seguido" : "dias seguidos"}
            </span>
          </div>
          <div className="mt-3 flex justify-center gap-1">
            {semana.dias.map((d) => (
              <span
                key={d.data}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${
                  d.estudou
                    ? "bg-questly-orange text-white dark:text-[#241703]"
                    : "bg-muted text-muted-foreground/50"
                }`}
              >
                {d.label.charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
        </motion.div>

        {/* COMPARATIVO — percentil vs. todos (estatística avançada = Pro) */}
        {!ehPro ? (
          <motion.div {...entrada(3)}>
            <ProBloqueio
              compacto
              titulo="Comparativo"
              descricao="Veja em que percentil você está entre quem mais estuda — com o Pro."
              className="h-full"
            />
          </motion.div>
        ) : (
          <motion.div
            {...entrada(3)}
            className="relative overflow-hidden rounded-2xl border border-questly-blue/25 bg-gradient-to-br from-questly-blue/10 to-card p-5"
          >
            <BlocoTitulo icone={<Users size={15} strokeWidth={2.2} />} cor="text-questly-blue-dark">
              Comparativo
            </BlocoTitulo>
            {semana.comparativo.percentil != null ? (
              <div className="flex flex-col items-center text-center">
                <span className="text-[13px] font-medium text-muted-foreground">Você está entre os</span>
                <span className="tnum my-1 font-heading text-[46px] font-extrabold leading-none text-questly-blue">
                  {semana.comparativo.percentil}%
                </span>
                <span className="text-xs leading-snug text-muted-foreground">
                  dos <b className="font-semibold text-foreground">alunos que mais estudam</b> na plataforma
                  esta semana.
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-3 text-center">
                <Target size={30} strokeWidth={1.6} className="mb-2 text-questly-blue" />
                <p className="text-[13px] font-medium">Estude pra entrar no comparativo</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete uma missão esta semana pra ver sua posição.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* RECORDE — maior streak histórico (estatística avançada = Pro) */}
        {!ehPro ? (
          <motion.div {...entrada(4)}>
            <ProBloqueio
              compacto
              titulo="Recorde"
              descricao="Acompanhe sua maior sequência de estudo de todos os tempos — com o Pro."
              className="h-full"
            />
          </motion.div>
        ) : (
          <motion.div
            {...entrada(4)}
            className="relative overflow-hidden rounded-2xl border border-questly-gold/30 bg-gradient-to-br from-questly-gold-light to-card p-5"
          >
            <BlocoTitulo icone={<Trophy size={15} strokeWidth={2.2} />} cor="text-questly-gold-dark">
              Recorde
            </BlocoTitulo>
            <div className="flex flex-col items-center text-center">
              <span className="tnum my-1 font-heading text-[46px] font-extrabold leading-none text-questly-gold">
                {semana.recorde.melhorStreak}
              </span>
              <span className="text-[13px] font-semibold">
                {semana.recorde.melhorStreak === 1 ? "dia de recorde" : "dias de recorde"}
              </span>
              <span className="mt-1 text-xs leading-snug text-muted-foreground">
                {semana.recorde.streakAtual >= semana.recorde.melhorStreak && semana.recorde.melhorStreak > 0
                  ? "Você está no seu melhor momento! 🔥"
                  : `Sua maior sequência de dias seguidos estudando.`}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BlocoTitulo({
  icone,
  cor,
  children,
}: {
  icone: React.ReactNode;
  cor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mb-3 flex items-center gap-1.5 ${cor}`}>
      {icone}
      <span className="text-[12.5px] font-bold tracking-tight">{children}</span>
    </div>
  );
}
