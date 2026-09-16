"use client";

// "Seu plano de hoje" — o painel de missões da home.
//
// **Repasse de 2026-09-16.** Este cartão era uma lista de metas com as missões
// escondidas atrás de um `missions.length > 1`, e a missão em si não dizia o
// que o aluno ia estudar: só "Cálculo II · 12 questões · 25 min". O assunto
// (os `topic_ids`) nunca virava texto, e o "por quê" morava num cartão
// separado, o GPS da Aprovação, com uma linguagem própria (Δnota/min, passos,
// ganho marginal) que ninguém pediu pra aprender.
//
// Agora o plano do dia é UM bloco por disciplina e ele responde as três
// perguntas na ordem em que elas aparecem na cabeça de quem abre o app:
//
//   1. o que eu estudo hoje?   → o nome do assunto, em destaque
//   2. por que isso?           → uma linha em português (ver plano-do-dia.ts)
//   3. e se eu não quiser?     → Ajustar / Trocar matéria / Adiar, ao lado
//
// As metas do dia (questões, XP, foco, missões) continuam embaixo: elas são o
// placar, não o plano.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  FlaskConical,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { useFoco, formatarDuracaoCurta } from "@/components/foco/foco-provider";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { hrefQuestao } from "@/lib/questao/navegacao";
import { ROTULO_MOTIVO, type MotivoTopico } from "@/lib/questly/plano-do-dia";
import type {
  AlternativaDoDia,
  MetasHoje,
  MissaoAdiada,
  MissionCardData,
} from "@/lib/questly/dashboard-data";
import { EscolherDisciplinaDoDia, MissaoControles } from "./missao-controles";

const RAIO = 26;
const CIRC = 2 * Math.PI * RAIO;

// Cor do selo de cada motivo — o mesmo vocabulário visual do resto do app:
// vermelho é risco, laranja é memória vencendo, verde é conteúdo novo.
const COR_MOTIVO: Record<MotivoTopico, string> = {
  risco: "bg-questly-red-light text-questly-red-dark dark:text-questly-red",
  revisao: "bg-questly-orange-light text-questly-orange-dark dark:text-questly-orange",
  novo: "bg-questly-green-light text-questly-green-dark dark:text-questly-green",
  reforco: "bg-muted text-muted-foreground",
};

export function MissoesCard({
  missions,
  metas,
  adiadas,
  alternativas,
  sugestaoSimulado = null,
}: {
  missions: MissionCardData[];
  metas: MetasHoje;
  adiadas: MissaoAdiada[];
  alternativas: AlternativaDoDia[];
  /** A outra metade do "distribuir listas E simulados": perto da prova, uma
   *  lista diária deixa de ser suficiente — o que falta medir é desempenho
   *  sob relógio. Aparece só quando a prova está perto E faz tempo que o
   *  aluno não faz um simulado; nunca substitui a missão, só se soma a ela. */
  sugestaoSimulado?: { subjectNome: string; diasAteProva: number } | null;
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
            <h2 className="font-heading text-[15px] font-semibold tracking-tight">Seu plano de hoje</h2>
          </span>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            {tudoFeito
              ? "Plano do dia cumprido. O que vier agora é bônus."
              : missions.length === 0
                ? "Nenhuma missão montada pra hoje — você pode escolher uma matéria mesmo assim."
                : "O motor sugere; a última palavra é sua."}
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

      {missions.length > 0 && (
        <div className="flex flex-col gap-3">
          {missions.map((m) => (
            <BlocoMissao key={m.id} missao={m} origem={origem} alternativas={alternativas} />
          ))}
        </div>
      )}

      {missions.length === 0 && alternativas.length > 0 && (
        <EscolherDisciplinaDoDia alternativas={alternativas} />
      )}

      {sugestaoSimulado && (
        <Link
          href="/simulados/montar"
          className="flex items-start gap-2.5 rounded-xl border border-dashed border-questly-blue/50 bg-questly-blue-light/40 px-3.5 py-3 transition-colors hover:border-questly-blue"
        >
          <FlaskConical size={15} strokeWidth={2.1} className="mt-0.5 shrink-0 text-questly-blue" />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">Hora de um simulado</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
              Sua prova de {sugestaoSimulado.subjectNome} é em {sugestaoSimulado.diasAteProva}{" "}
              {sugestaoSimulado.diasAteProva === 1 ? "dia" : "dias"}. Uma prova cronometrada mostra o
              que a lista do dia não mostra.
            </span>
          </span>
          <ArrowRight size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {adiadas.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {adiadas.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground"
            >
              <CalendarClock size={14} strokeWidth={2.1} className="shrink-0" />
              <span className="min-w-0 truncate">
                {a.subjectNome || "Missão"} foi adiada pra {formatarDia(a.para)}
              </span>
            </li>
          ))}
        </ul>
      )}

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
    </section>
  );
}

/** Uma disciplina do dia: assunto, porquê e os controles. */
function BlocoMissao({
  missao,
  origem,
  alternativas,
}: {
  missao: MissionCardData;
  origem: string;
  alternativas: AlternativaDoDia[];
}) {
  const nome = missao.subjects?.nome || "Missão avulsa";
  const cor = corDaDisciplina(nome);
  const principal = missao.topicos[0];

  return (
    <div className="rounded-xl border border-border bg-background/60 p-3.5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 h-9 w-1.5 shrink-0 rounded-full"
          style={{ background: missao.concluida ? "var(--muted)" : cor.gradiente }}
        />
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[11.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {nome}
            </span>
            {missao.mestre && <Crown size={12} className="shrink-0 text-questly-gold" />}
          </span>
          <p className="mt-0.5 truncate font-heading text-[15px] font-semibold leading-tight">
            {principal ? principal.nome : "Prática do dia"}
          </p>
        </div>
        {missao.concluida && <CheckCircle2 size={16} className="mt-1 shrink-0 text-questly-green" />}
      </div>

      {missao.topicos.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {missao.topicos.map((t) => (
            <span
              key={t.id}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${COR_MOTIVO[t.motivo]}`}
            >
              {ROTULO_MOTIVO[t.motivo]}
              {missao.topicos.length > 1 ? `: ${t.nome}` : ""}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{missao.porque}</p>

      <p className="tnum mt-2 text-[11.5px] font-semibold text-muted-foreground">
        {missao.qtd_questoes ?? "–"} questões · ~{missao.tempo_previsto_min ?? "–"}min ·{" "}
        {missao.xp_recompensa ?? 0} XP
      </p>

      {!missao.concluida && (
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={hrefQuestao(missao.id, origem)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: cor.gradiente }}
          >
            Começar
            <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
          <MissaoControles
            missaoId={missao.id}
            qtdAtual={missao.qtd_questoes ?? 0}
            alternativas={alternativas}
          />
        </div>
      )}
    </div>
  );
}

function formatarDia(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const d = new Date(ano, mes - 1, dia);
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
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
