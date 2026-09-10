"use client";

// "Seu foco de hoje" — o cartão protagonista da home.
//
// Ele substitui TRÊS cartões que antes disputavam a mesma dobra e diziam
// pedaços da mesma coisa: o "Continuar de onde parou", o painel de Missões
// (anel de XP + mini-stats) e o banner com um cartão por missão do dia. O aluno
// abria a home e tinha três botões verdes competindo — e o XP do dia aparecia
// duas vezes dentro do mesmo cartão.
//
// A regra aqui é: UMA ação primária. A escolha é por urgência —
//   1. tem missão começada e não terminada  → continuar (é o menor caminho);
//   2. tem missão pendente                  → começar a próxima;
//   3. está tudo feito                      → estado de conclusão, sem CTA falso.
// As demais missões do dia ficam na lista abaixo, cada uma com sua própria
// ação secundária discreta.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Moon,
  Play,
  Timer,
  Zap,
} from "lucide-react";
import { useFoco, formatarDuracaoCurta } from "@/components/foco/foco-provider";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import type { MetasHoje, MissionCardData } from "@/lib/questly/dashboard-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";

const RAIO = 34;
const CIRC = 2 * Math.PI * RAIO;

export function FocoHojeCard({
  retomar,
  missions,
  semMissaoHoje,
  motivoSemMissao,
  metas,
}: {
  retomar: RetomarInfo;
  missions: MissionCardData[];
  semMissaoHoje: boolean;
  motivoSemMissao?: string;
  metas: MetasHoje;
}) {
  const foco = useFoco();
  const semMovimento = useReducedMotion();

  const pendentes = missions.filter((m) => !m.concluida);
  const proxima = pendentes[0] || null;

  // O anel mede o DIA, não uma missão: é a pergunta "quanto falta pra fechar
  // hoje?", que é o que a home precisa responder de longe.
  const pct =
    metas.questoesTotal > 0
      ? Math.min(100, Math.round((metas.questoesRespondidas / metas.questoesTotal) * 100))
      : 0;
  const offset = CIRC - (pct / 100) * CIRC;
  const focoSeg = foco.montado ? foco.focoHojeSeg : 0;

  const tudoFeito = missions.length > 0 && pendentes.length === 0;
  const alvo = retomar ? { id: retomar.missaoId, nome: retomar.subjectNome } : proxima
    ? { id: proxima.id, nome: proxima.subjects?.nome ?? null }
    : null;
  const cor = corDaDisciplina(alvo?.nome ?? null);
  const mestreAlvo = proxima?.mestre && !retomar;

  // Dia sem missão (não é dia de estudo, ou nada agendado): estado honesto, sem
  // inventar tarefa nem oferecer botão que não leva a lugar nenhum.
  if (semMissaoHoje || missions.length === 0) {
    return (
      <section className="surface flex flex-col items-center gap-3 rounded-2xl px-6 py-9 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Moon size={19} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Sem missão hoje</p>
          <p className="mx-auto mt-1 max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
            {motivoSemMissao || "Não foi possível gerar sua missão agora. Tente recarregar a página."}
          </p>
        </div>
        <Link
          href="/questoes/banco"
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          Praticar mesmo assim <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </section>
    );
  }

  return (
    <section
      id="missoes-do-dia"
      className={`${mestreAlvo ? "surface-gold" : "surface-brand"} overflow-hidden rounded-2xl`}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* --------------------------------------------------- linha da ação */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Anel do dia */}
          <div className="relative h-[92px] w-[92px] shrink-0 self-center sm:self-auto">
            <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90">
              <circle cx="46" cy="46" r={RAIO} fill="none" stroke="var(--muted)" strokeWidth="9" />
              <motion.circle
                cx="46"
                cy="46"
                r={RAIO}
                fill="none"
                stroke={tudoFeito ? "var(--color-questly-green)" : cor.para}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={semMovimento ? undefined : { strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {tudoFeito ? (
                <CheckCircle2 size={28} strokeWidth={2.2} className="text-questly-green" />
              ) : (
                <>
                  <span className="tnum font-heading text-[22px] font-bold leading-none">{pct}%</span>
                  <span className="text-[9.5px] font-medium leading-tight text-muted-foreground">do dia</span>
                </>
              )}
            </div>
          </div>

          {/* Texto + CTA */}
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                mestreAlvo ? "text-questly-gold" : "text-questly-green"
              }`}
            >
              {mestreAlvo ? <Crown size={13} strokeWidth={2} /> : <Play size={12} strokeWidth={2.4} fill="currentColor" />}
              {tudoFeito ? "Dia cumprido" : retomar ? "Você parou aqui" : "Seu foco de hoje"}
            </span>

            <h2 className="mt-0.5 truncate font-heading text-[19px] font-semibold leading-tight tracking-tight">
              {tudoFeito ? "Tudo feito por hoje" : (alvo?.nome ?? "Sua missão de hoje")}
            </h2>

            <p className="tnum mt-1 text-[13px] leading-snug text-muted-foreground">
              {tudoFeito ? (
                <>
                  {metas.questoesRespondidas} questões e {metas.xpHoje} XP hoje. Praticar mais é opcional — e
                  continua valendo XP.
                </>
              ) : retomar ? (
                <>
                  {retomar.respondidas} de {retomar.total} questões · faltam {retomar.total - retomar.respondidas}{" "}
                  pra fechar
                </>
              ) : (
                <>
                  {proxima?.qtd_questoes ?? "–"} questões · ~{proxima?.tempo_previsto_min ?? "–"} min ·{" "}
                  {proxima?.xp_recompensa ?? 0} XP
                  {mestreAlvo && <span className="font-semibold text-questly-gold-dark"> · XP em 1.5×</span>}
                </>
              )}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {alvo ? (
                <Link
                  href={`/questao?missao=${alvo.id}`}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: mestreAlvo ? "var(--color-questly-gold)" : cor.gradiente }}
                >
                  <Play size={15} strokeWidth={2.5} fill="currentColor" />
                  {retomar ? "Continuar estudando" : "Começar missão"}
                </Link>
              ) : (
                <Link
                  href="/questoes/banco"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Praticar mais <ArrowRight size={15} strokeWidth={2.2} />
                </Link>
              )}
              <button
                type="button"
                onClick={foco.abrirBarra}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-muted"
              >
                <Timer size={14} strokeWidth={2} className="text-cyan-500" />
                Foco
              </button>
            </div>
          </div>

          {/* Três números do dia — os únicos que aparecem aqui, e só aqui */}
          <div className="grid shrink-0 grid-cols-3 gap-2 sm:w-[228px] sm:grid-cols-1">
            <Numero
              icone={<FileText size={13} className="text-questly-blue" />}
              valor={`${metas.questoesRespondidas}/${metas.questoesTotal}`}
              rotulo="questões"
            />
            <Numero
              icone={<Zap size={13} className="text-questly-purple" />}
              valor={metas.xpMetaHoje > 0 ? `${metas.xpHoje}/${metas.xpMetaHoje}` : String(metas.xpHoje)}
              rotulo="XP de hoje"
            />
            <Numero
              icone={<Clock size={13} className="text-cyan-500" />}
              valor={focoSeg > 0 ? formatarDuracaoCurta(focoSeg) : "0min"}
              rotulo="de foco"
            />
          </div>
        </div>

        {/* ------------------------------------------ missões do dia (lista) */}
        {missions.length > 1 && (
          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="kicker">Missões de hoje</span>
              <span className="tnum text-[11.5px] font-semibold text-muted-foreground">
                {metas.missoesConcluidas} de {metas.missoesTotal} cumpridas
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {missions.map((m) => (
                <LinhaMissao key={m.id} missao={m} destacada={m.id === alvo?.id} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function LinhaMissao({ missao, destacada }: { missao: MissionCardData; destacada: boolean }) {
  const nome = missao.subjects?.nome || "Missão avulsa";
  const cor = corDaDisciplina(nome);

  return (
    <li>
      <Link
        href={`/questao?missao=${missao.id}`}
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
          destacada ? "border-questly-green/50 bg-questly-green-light/30" : "border-border hover:bg-muted/60"
        }`}
      >
        <span
          aria-hidden
          className="h-8 w-1.5 shrink-0 rounded-full"
          style={{ background: missao.concluida ? "var(--muted)" : cor.gradiente }}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              className={`truncate text-[13.5px] font-semibold ${missao.concluida ? "text-muted-foreground" : ""}`}
            >
              {nome}
            </span>
            {missao.mestre && <Crown size={12} className="shrink-0 text-questly-gold" />}
          </span>
          <span className="tnum block text-[11.5px] font-medium text-muted-foreground">
            {missao.qtd_questoes ?? "–"} questões · ~{missao.tempo_previsto_min ?? "–"}min ·{" "}
            {missao.xp_recompensa ?? 0} XP
          </span>
        </span>
        {missao.concluida ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-questly-green-light px-2 py-0.5 text-[11px] font-bold text-questly-green-dark">
            <CheckCircle2 size={11} /> Cumprida
          </span>
        ) : (
          <ArrowRight size={15} strokeWidth={2.2} className="shrink-0 text-muted-foreground" />
        )}
      </Link>
    </li>
  );
}

function Numero({ icone, valor, rotulo }: { icone: React.ReactNode; valor: string; rotulo: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-2.5 py-2">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        <span className="truncate">{rotulo}</span>
      </span>
      <p className="tnum mt-0.5 truncate text-[15px] font-bold leading-tight">{valor}</p>
    </div>
  );
}
