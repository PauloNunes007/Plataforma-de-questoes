"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { BossAlvo, CalDay, ProfileRow, SubjectListItem } from "@/lib/questly/dashboard-data";
import { XP_POR_NIVEL } from "@/lib/questly/dashboard-data";
import type { EstadoLiga as EstadoLigaBase } from "@/lib/questly/liga";

type EstadoLigaComVisual = EstadoLigaBase & { icone: string; nomeExibicao: string };

const CARD_CLASS = "rounded-[18px] border border-border bg-card p-5";

function CardEntry({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
      className={CARD_CLASS}
    >
      {children}
    </motion.div>
  );
}

function CardLabel({ children, seeAllHref, seeAllLabel }: { children: React.ReactNode; seeAllHref?: string; seeAllLabel?: string }) {
  return (
    <div className="mb-3.5 flex items-center justify-between font-heading text-[15px] font-semibold">
      <span>{children}</span>
      {seeAllHref && (
        <Link href={seeAllHref} className="text-[11.5px] font-extrabold uppercase tracking-wide text-questly-blue">
          {seeAllLabel}
        </Link>
      )}
    </div>
  );
}

export function BossRailCard({ bossAlvo, index }: { bossAlvo: BossAlvo | null; index: number }) {
  return (
    <CardEntry index={index}>
      <CardLabel>Boss atual</CardLabel>
      {!bossAlvo ? (
        <p className="text-sm font-semibold text-muted-foreground">Nenhuma prova cadastrada ainda.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-questly-orange to-[#FF6D00] text-2xl shadow-[0_3px_0_#C25B00]">
              ⚔️
            </div>
            <div className="min-w-0">
              <b className="block truncate font-heading text-[15px] font-semibold leading-tight">
                {bossAlvo.subjectNome} — {bossAlvo.bossNome}
              </b>
              <span className="text-xs font-extrabold text-questly-orange-dark">
                Prova em {bossAlvo.diasAteProva} dias
              </span>
            </div>
          </div>
          <div className="mb-1.5 h-3.5 overflow-hidden rounded-full border-2 border-border bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-questly-orange to-[#FFB84D] transition-[width] duration-700"
              style={{ width: `${Math.min(100, bossAlvo.preparoPercentual)}%` }}
            />
          </div>
          <div className="mb-4 text-xs font-extrabold text-muted-foreground">
            Preparação: {Math.round(bossAlvo.preparoPercentual)}%
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-questly-green-light px-4 py-3">
            <span className="text-xs font-extrabold text-questly-green-dark">Chance de aprovação</span>
            <span className="font-heading text-2xl font-bold text-questly-green-dark">
              {bossAlvo.chanceAprovacao != null ? `${bossAlvo.chanceAprovacao}%` : "-"}
            </span>
          </div>
        </>
      )}
    </CardEntry>
  );
}

export function XpRailCard({ profile, index }: { profile: ProfileRow | null; index: number }) {
  const xp = profile?.xp_total || 0;
  const nivel = profile?.nivel || 1;
  const xpNoNivel = xp % XP_POR_NIVEL;
  const pct = Math.min(100, (xpNoNivel / XP_POR_NIVEL) * 100);

  return (
    <CardEntry index={index}>
      <CardLabel>XP &amp; Nível</CardLabel>
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-questly-gold to-[#FFAD00] font-heading text-base font-bold text-white shadow-[0_3px_0_var(--questly-gold-dark)]">
          N{nivel}
        </div>
        <div>
          <b className="block font-heading text-base font-semibold">Nível {nivel}</b>
          <span className="text-xs font-bold text-muted-foreground">
            {xp.toLocaleString("pt-BR")} XP na campanha
          </span>
        </div>
      </div>
      <div className="mt-3.5 h-3.5 overflow-hidden rounded-full border-2 border-border bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-questly-gold to-[#FFDE59] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-extrabold text-muted-foreground">
        <span>{xpNoNivel.toLocaleString("pt-BR")} XP</span>
        <span>{XP_POR_NIVEL.toLocaleString("pt-BR")} XP p/ nível {nivel + 1}</span>
      </div>
    </CardEntry>
  );
}

export function LigaRailCard({ liga, index }: { liga: EstadoLigaComVisual | null; index: number }) {
  return (
    <CardEntry index={index}>
      <CardLabel seeAllHref="/ranking" seeAllLabel="Ver ranking">
        Liga
      </CardLabel>
      {!liga ? (
        <p className="text-sm font-semibold text-muted-foreground">Não foi possível carregar sua liga.</p>
      ) : (
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-questly-purple to-[#A855F7] text-xl shadow-[0_3px_0_#7C3AED]">
            {liga.icone}
          </div>
          <div>
            <b className="block font-heading text-base font-semibold">{liga.nomeExibicao}</b>
            <span className="text-xs font-bold text-muted-foreground">
              {liga.xp_semana || 0} XP essa semana
            </span>
          </div>
        </div>
      )}
    </CardEntry>
  );
}

export function StreakRailCard({
  streakAtual,
  heat,
  index,
}: {
  streakAtual: number;
  heat: boolean[];
  index: number;
}) {
  return (
    <CardEntry index={index}>
      <CardLabel>Streak</CardLabel>
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-questly-orange to-questly-red text-2xl shadow-[0_3px_0_#C23A3A]">
          🔥
        </div>
        <div>
          <div className="font-heading text-2xl font-bold leading-none">{streakAtual}</div>
          <div className="mt-1 text-xs font-bold text-muted-foreground">dias seguidos cumprindo missão</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-10 gap-1.5">
        {heat.map((estudou, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[6px] border ${
              estudou ? "border-questly-green-dark bg-questly-green" : "border-border bg-muted"
            }`}
          />
        ))}
      </div>
    </CardEntry>
  );
}

const CAL_DOW = ["D", "S", "T", "Q", "Q", "S", "S"];
const CAL_ESTADO_CLASSE: Record<CalDay["estado"], string> = {
  normal: "text-muted-foreground",
  hoje: "bg-questly-blue text-white shadow-[0_2px_0_var(--questly-blue-dark)]",
  prova: "bg-questly-orange-light text-questly-orange-dark",
  estudou: "bg-questly-green-light text-questly-green-dark",
};

export function CalendarRailCard({
  monthLabel,
  dowOffset,
  days,
  index,
}: {
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  index: number;
}) {
  return (
    <CardEntry index={index}>
      <CardLabel seeAllHref="/configuracoes" seeAllLabel="Ver tudo">
        {monthLabel}
      </CardLabel>
      <div className="grid grid-cols-7 gap-1 text-center">
        {CAL_DOW.map((d, i) => (
          <div key={i} className="pb-1 text-[10px] font-black text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: dowOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => (
          <div
            key={day.dia}
            title={day.title}
            className={`relative flex aspect-square items-center justify-center rounded-[10px] text-[11.5px] font-extrabold ${CAL_ESTADO_CLASSE[day.estado]}`}
          >
            {day.dia}
            {day.estado === "prova" && (
              <span className="absolute bottom-0 right-0.5 text-[8px]">⚔️</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex flex-wrap gap-3.5">
        <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-muted-foreground">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-questly-green-light" />
          Estudou
        </span>
        <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-muted-foreground">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-questly-blue" />
          Hoje
        </span>
        <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-muted-foreground">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-questly-orange-light" />
          Boss (prova)
        </span>
      </div>
    </CardEntry>
  );
}

const EMOJIS_DISCIPLINA = ["📘", "📕", "📗", "📙", "📒", "📓"];

export function SubjectsRailCard({ subjects, index }: { subjects: SubjectListItem[]; index: number }) {
  return (
    <CardEntry index={index}>
      <CardLabel>
        <span className="flex items-center gap-2">
          Disciplinas
          {subjects.length > 0 && (
            <span className="text-[11.5px] font-extrabold uppercase tracking-wide text-questly-blue">
              {subjects.length === 1 ? "1 ativa" : `${subjects.length} ativas`}
            </span>
          )}
        </span>
      </CardLabel>
      {subjects.length === 0 ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Você ainda não configurou nenhuma disciplina.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-questly-green px-4 py-2.5 font-heading text-sm font-semibold text-white shadow-[0_3px_0_var(--questly-green-dark)]"
          >
            Configurar
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {subjects.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3.5 border-b border-muted py-2.5 last:border-none last:pb-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-questly-blue-light text-lg shadow-[0_2px_0_#B8E4FB]">
                {EMOJIS_DISCIPLINA[i % EMOJIS_DISCIPLINA.length]}
              </div>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[13px] font-extrabold">{s.nome}</b>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {s.diasBoss != null ? `Boss em ${s.diasBoss} dias` : "Sem prova marcada"} · Nv. {s.nivel}
                </span>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-border bg-muted">
                  <div
                    className="h-full rounded-full bg-questly-green transition-[width] duration-700"
                    style={{ width: `${s.diasBoss != null ? s.preparo : 0}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 font-heading text-sm font-semibold text-questly-green-dark">
                {s.aprovacao != null ? `${s.aprovacao}%` : "–"}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardEntry>
  );
}
