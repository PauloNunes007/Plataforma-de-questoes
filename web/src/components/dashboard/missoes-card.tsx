"use client";

// "Missões" — o painel de metas do dia, ao lado do cartão de ação.
//
// Formato do repasse de 2026-09-11: um anel de XP pequeno no cabeçalho (o
// número do dia, não uma rosácea gigante) e METAS em linhas com progresso —
// questões, XP, foco e missões cumpridas. Cada linha é uma meta com alvo
// declarado; nenhuma repete número de outro andar da home.
//
// A lista das missões do dia entra abaixo quando há mais de uma: com uma só,
// o cartão de ação ao lado já É essa missão e repetir seria eco.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Crown, FileText, Target, Timer, Zap } from "lucide-react";
import { useFoco, formatarDuracaoCurta } from "@/components/foco/foco-provider";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { hrefQuestao } from "@/lib/questao/navegacao";
import type { MetasHoje, MissionCardData } from "@/lib/questly/dashboard-data";

const RAIO = 26;
const CIRC = 2 * Math.PI * RAIO;

export function MissoesCard({
  missions,
  metas,
}: {
  missions: MissionCardData[];
  metas: MetasHoje;
}) {
  const foco = useFoco();
  const semMovimento = useReducedMotion();
  const origem = usePathname();

  const focoSeg = foco.montado ? foco.focoHojeSeg : 0;
  const metaFocoSeg = Math.max(1, metas.questoesTotal) * 90; // ~1,5 min por questão prevista
  const pctXp = metas.xpMetaHoje > 0 ? Math.min(100, (metas.xpHoje / metas.xpMetaHoje) * 100) : 0;
  const offset = CIRC - (pctXp / 100) * CIRC;

  const tudoFeito = missions.length > 0 && metas.missoesConcluidas === metas.missoesTotal;

  return (
    <section className="surface flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Target size={15} strokeWidth={2.1} className="text-questly-green-dark dark:text-questly-green" />
            <h2 className="font-heading text-[15px] font-semibold tracking-tight">Missões de hoje</h2>
          </span>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            {tudoFeito
              ? "Metas do dia cumpridas. O que vier agora é bônus."
              : metas.questoesRespondidas > 0
                ? "Você já começou — falta pouco pra fechar o dia."
                : "Comece por qualquer meta; elas contam juntas."}
          </p>
        </div>

        {/* anel pequeno de XP do dia */}
        <div className="relative h-[70px] w-[70px] shrink-0">
          <svg viewBox="0 0 70 70" className="h-full w-full -rotate-90">
            <circle cx="35" cy="35" r={RAIO} fill="none" stroke="var(--muted)" strokeWidth="7" />
            <motion.circle
              cx="35"
              cy="35"
              r={RAIO}
              fill="none"
              stroke="var(--color-questly-purple)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={semMovimento ? false : { strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tnum font-heading text-[15px] font-bold leading-none">{metas.xpHoje}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">XP</span>
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        <Meta
          icone={<FileText size={14} className="text-questly-blue" />}
          rotulo="questões"
          feito={metas.questoesRespondidas}
          alvo={metas.questoesTotal}
          cor="var(--color-questly-blue)"
        />
        <Meta
          icone={<Zap size={14} className="text-questly-purple" />}
          rotulo="XP do dia"
          feito={metas.xpHoje}
          alvo={metas.xpMetaHoje}
          cor="var(--color-questly-purple)"
        />
        <Meta
          icone={<Clock size={14} className="text-cyan-500" />}
          rotulo="de foco"
          feito={focoSeg}
          alvo={metaFocoSeg}
          formatar={(v) => (v > 0 ? formatarDuracaoCurta(v) : "0min")}
          cor="#06b6d4"
        />
        <Meta
          icone={<CheckCircle2 size={14} className="text-questly-green" />}
          rotulo="missões cumpridas"
          feito={metas.missoesConcluidas}
          alvo={metas.missoesTotal}
          cor="var(--color-questly-green)"
        />
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={foco.abrirBarra}
          className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          <Timer size={14} strokeWidth={2.1} />
          Sessão de foco
        </button>
        <Link
          href="/questoes/banco"
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          Praticar livre
          <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </div>

      {missions.length > 1 && (
        <div className="border-t border-border pt-3.5">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span className="kicker">Suas missões</span>
            <span className="tnum text-[11.5px] font-semibold text-muted-foreground">
              {metas.missoesConcluidas} de {metas.missoesTotal}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {missions.map((m) => (
              <LinhaMissao key={m.id} missao={m} origem={origem} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Meta({
  icone,
  rotulo,
  feito,
  alvo,
  cor,
  formatar,
}: {
  icone: React.ReactNode;
  rotulo: string;
  feito: number;
  alvo: number;
  cor: string;
  formatar?: (v: number) => string;
}) {
  const semMovimento = useReducedMotion();
  const pct = alvo > 0 ? Math.min(100, (feito / alvo) * 100) : 0;
  const completa = alvo > 0 && feito >= alvo;
  const fmt = formatar ?? ((v: number) => v.toLocaleString("pt-BR"));

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          completa ? "bg-questly-green-light" : "bg-muted"
        }`}
      >
        {completa ? <CheckCircle2 size={15} className="text-questly-green-dark dark:text-questly-green" /> : icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="tnum font-heading text-[14.5px] font-bold leading-none">
            {fmt(feito)}
            {alvo > 0 && <span className="font-semibold text-muted-foreground">/{fmt(alvo)}</span>}
          </span>
          <span className="truncate text-[11.5px] font-medium text-muted-foreground">{rotulo}</span>
        </span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.span
            className="block h-full rounded-full"
            style={{ background: cor }}
            initial={semMovimento ? false : { width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </span>
    </li>
  );
}

function LinhaMissao({ missao, origem }: { missao: MissionCardData; origem: string }) {
  const nome = missao.subjects?.nome || "Missão avulsa";
  const cor = corDaDisciplina(nome);

  return (
    <li>
      <Link
        href={hrefQuestao(missao.id, origem)}
        className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/60"
      >
        <span
          aria-hidden
          className="h-8 w-1.5 shrink-0 rounded-full"
          style={{ background: missao.concluida ? "var(--muted)" : cor.gradiente }}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              className={`truncate text-[13px] font-semibold ${missao.concluida ? "text-muted-foreground" : ""}`}
            >
              {nome}
            </span>
            {missao.mestre && <Crown size={12} className="shrink-0 text-questly-gold" />}
          </span>
          <span className="tnum block text-[11px] font-medium text-muted-foreground">
            {missao.qtd_questoes ?? "–"} questões · ~{missao.tempo_previsto_min ?? "–"}min ·{" "}
            {missao.xp_recompensa ?? 0} XP
          </span>
        </span>
        {missao.concluida ? (
          <CheckCircle2 size={15} className="shrink-0 text-questly-green" />
        ) : (
          <ArrowRight size={15} strokeWidth={2.2} className="shrink-0 text-muted-foreground" />
        )}
      </Link>
    </li>
  );
}
