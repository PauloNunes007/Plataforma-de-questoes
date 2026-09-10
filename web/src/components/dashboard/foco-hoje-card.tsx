"use client";

// "Seu foco de hoje" — o cartão protagonista da home.
//
// Ele consolida TRÊS cartões que antes disputavam a mesma dobra e diziam
// pedaços da mesma coisa: o "Continuar de onde parou", o painel de Missões
// (anel de XP + mini-stats) e o banner com um cartão por missão do dia.
//
// A regra continua sendo: UMA ação primária, escolhida por urgência —
//   1. tem missão começada e não terminada  → continuar (é o menor caminho);
//   2. tem missão pendente                  → começar a próxima;
//   3. está tudo feito                      → estado de conclusão, sem CTA falso.
//
// REPASSE VISUAL (2026-09-10): na consolidação anterior a ação virou um card
// branco com um botãozinho colorido, e a home perdeu o ponto de fixação — o
// "continuar de onde parou" tinha um painel inteiro na cor da disciplina e
// era o que dava identidade à tela. A cor voltou, e mais forte: o painel de
// ação é uma superfície ESCURA na cor da disciplina (gradienteProfundo, que
// passa AA com texto branco nos oito tons da paleta — ver disciplina-cor.ts),
// com o anel do dia em vidro por cima. Assim o aluno reconhece de longe que
// hoje é dia de Cálculo antes mesmo de ler.
//
// O painel é deliberadamente escuro NOS DOIS TEMAS — é uma superfície própria,
// como uma capa, e não um card que segue o canvas. Por isso os tons dele são
// literais em vez de tokens (os tokens de marca invertem no escuro e quebrariam
// o texto branco).

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { hrefQuestao } from "@/lib/questao/navegacao";
import type { MetasHoje, MissionCardData } from "@/lib/questly/dashboard-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";

const RAIO = 32;
const CIRC = 2 * Math.PI * RAIO;

// Superfícies dos estados que não pertencem a uma disciplina.
const GRAD_CONCLUIDO = "linear-gradient(135deg, #076b4a, #04412e)";
const GRAD_MESTRE = "linear-gradient(135deg, #7a5806, #4a3403)";

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
  const origem = usePathname();

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
  const alvo = retomar
    ? { id: retomar.missaoId, nome: retomar.subjectNome }
    : proxima
      ? { id: proxima.id, nome: proxima.subjects?.nome ?? null }
      : null;
  const cor = corDaDisciplina(alvo?.nome ?? null);
  const mestreAlvo = Boolean(proxima?.mestre) && !retomar;

  // Dia sem missão (não é dia de estudo, ou nada agendado): estado honesto, sem
  // inventar tarefa nem oferecer botão que não leva a lugar nenhum.
  if (semMissaoHoje || missions.length === 0) {
    return (
      <section className="surface flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Moon size={20} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <div>
          <p className="font-heading text-[16px] font-semibold">Sem missão hoje</p>
          <p className="mx-auto mt-1 max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
            {motivoSemMissao ||
              "Não foi possível gerar sua missão agora. Tente recarregar a página."}
          </p>
        </div>
        <Link
          href="/questoes/banco"
          className="mt-1 inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          Praticar mesmo assim <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </section>
    );
  }

  const gradientePainel = tudoFeito
    ? GRAD_CONCLUIDO
    : mestreAlvo
      ? GRAD_MESTRE
      : cor.gradienteProfundo;

  const kicker = tudoFeito ? "Dia cumprido" : retomar ? "Você parou aqui" : "Seu foco de hoje";
  const titulo = tudoFeito ? "Tudo feito por hoje" : (alvo?.nome ?? "Sua missão de hoje");

  // Barra sob o título: no "continuar" ela mede a missão em andamento; nos
  // demais casos mede o dia (mesma métrica do anel), pra não inventar um
  // progresso que não existe.
  const pctBarra = retomar ? retomar.pct : pct;

  return (
    <section
      id="missoes-do-dia"
      className="surface overflow-hidden rounded-2xl p-0"
    >
      {/* ------------------------------------------- painel de ação (cor) */}
      <div className="relative isolate overflow-hidden" style={{ background: gradientePainel }}>
        {/* brilho superior: dá profundidade sem competir com o texto */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/15"
        />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">
              {tudoFeito ? (
                <CheckCircle2 size={13} strokeWidth={2.4} />
              ) : mestreAlvo ? (
                <Crown size={13} strokeWidth={2.2} />
              ) : (
                <Play size={11} strokeWidth={2.6} fill="currentColor" />
              )}
              {kicker}
            </span>

            <h2 className="mt-1 truncate font-heading text-[22px] font-bold leading-tight tracking-tight text-white sm:text-[26px]">
              {titulo}
            </h2>

            <p className="tnum mt-1.5 text-[13px] leading-snug text-white/80">
              {tudoFeito ? (
                <>
                  {metas.questoesRespondidas} questões e {metas.xpHoje} XP hoje. Praticar mais é
                  opcional — e continua valendo XP.
                </>
              ) : retomar ? (
                <>
                  {retomar.respondidas} de {retomar.total} questões · faltam{" "}
                  {retomar.total - retomar.respondidas} pra fechar
                </>
              ) : (
                <>
                  {proxima?.qtd_questoes ?? "–"} questões · ~{proxima?.tempo_previsto_min ?? "–"} min ·{" "}
                  {proxima?.xp_recompensa ?? 0} XP
                  {mestreAlvo && <span className="font-bold text-white"> · XP em 1,5×</span>}
                </>
              )}
            </p>

            {/* Barra de progresso */}
            <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={semMovimento ? false : { width: 0 }}
                animate={{ width: `${Math.max(3, pctBarra)}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {alvo ? (
                <Link
                  href={hrefQuestao(alvo.id, origem)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold shadow-lg shadow-black/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ color: mestreAlvo ? "#7a5806" : cor.profundo }}
                >
                  <Play size={15} strokeWidth={2.6} fill="currentColor" />
                  {retomar ? "Continuar estudando" : "Começar missão"}
                </Link>
              ) : (
                <Link
                  href="/questoes/banco"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-5 text-[14px] font-bold text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  Praticar mais <ArrowRight size={15} strokeWidth={2.4} />
                </Link>
              )}
              <button
                type="button"
                onClick={foco.abrirBarra}
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-4 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20"
              >
                <Timer size={15} strokeWidth={2.1} />
                Foco
              </button>
            </div>
          </div>

          {/* Anel do dia, em vidro sobre a cor */}
          <div className="relative h-[104px] w-[104px] shrink-0 self-center">
            <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90">
              <circle cx="52" cy="52" r={RAIO} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="9" />
              <motion.circle
                cx="52"
                cy="52"
                r={RAIO}
                fill="none"
                stroke="#fff"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={semMovimento ? false : { strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {tudoFeito ? (
                <CheckCircle2 size={32} strokeWidth={2.2} className="text-white" />
              ) : (
                <>
                  <span className="tnum font-heading text-[24px] font-bold leading-none text-white">
                    {pct}%
                  </span>
                  <span className="text-[9.5px] font-semibold uppercase tracking-wide leading-tight text-white/70">
                    do dia
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------ rodapé (superfície card) */}
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {/* Três números do dia — os únicos que aparecem aqui, e só aqui */}
        <div className="grid grid-cols-3 gap-2.5">
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

        {/* Missões do dia (lista) — só quando há mais de uma */}
        {missions.length > 1 && (
          <div className="border-t border-border pt-4">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <span className="kicker">Missões de hoje</span>
              <span className="tnum text-[11.5px] font-semibold text-muted-foreground">
                {metas.missoesConcluidas} de {metas.missoesTotal} cumpridas
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {missions.map((m) => (
                <LinhaMissao key={m.id} missao={m} destacada={m.id === alvo?.id} origem={origem} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function LinhaMissao({
  missao,
  destacada,
  origem,
}: {
  missao: MissionCardData;
  destacada: boolean;
  origem: string;
}) {
  const nome = missao.subjects?.nome || "Missão avulsa";
  const cor = corDaDisciplina(nome);

  return (
    <li>
      <Link
        href={hrefQuestao(missao.id, origem)}
        className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
          destacada
            ? "border-questly-green/50 bg-questly-green-light/40"
            : "border-border hover:bg-muted/60"
        }`}
      >
        <span
          aria-hidden
          className="h-9 w-1.5 shrink-0 rounded-full"
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

function Numero({
  icone,
  valor,
  rotulo,
}: {
  icone: React.ReactNode;
  valor: string;
  rotulo: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-2.5 py-2.5">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        <span className="truncate">{rotulo}</span>
      </span>
      <p className="tnum mt-0.5 truncate font-heading text-[16px] font-bold leading-tight">{valor}</p>
    </div>
  );
}
