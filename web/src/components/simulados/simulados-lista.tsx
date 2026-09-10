"use client";

// Hub dos Simulados. A ordem da página segue a urgência do aluno:
//   1. retomar uma prova com o relógio correndo;
//   2. montar a próxima;
//   3. "como eu estou indo?" — o painel de desempenho;
//   4. o histórico.
//
// O painel usa a MESMA análise da página /simulados/desempenho (uma leitura,
// duas profundidades): aqui ficam as métricas que um aluno olha toda vez —
// última nota, média, evolução, aproveitamento, ritmo — e os cortes finos
// (consistência, tendência por disciplina, mapa de calor) seguem lá.

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  CircleSlash,
  Clock,
  Crown,
  FileText,
  Layers,
  Lock,
  Play,
  Plus,
  Sparkles,
  Swords,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { SimuladoResumo, StatusPlanoSimulado } from "@/lib/simulados/simulados-data";
import type { DesempenhoGeral } from "@/lib/simulados/analise";
import type { InstituicaoAgregada } from "@/lib/cursos/instituicao";
import { MIN_AMOSTRA_AGREGADO, fmtDataCurta, fmtSegundos, tomDoPct } from "@/lib/simulados/analise";
import { CLASSE_BG_STATUS, CLASSE_TEXTO_STATUS } from "./graficos/base";
import { LinhaEvolucao } from "./graficos/linha-evolucao";
import { BarrasDesempenho } from "./graficos/barras-desempenho";
import { AnelNota } from "./graficos/anel-nota";

type Props = {
  historico: SimuladoResumo[];
  desempenho: DesempenhoGeral;
  status: StatusPlanoSimulado;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  universidade: string | null;
  totalQuestoes: number;
  instituicoesDisponiveis: InstituicaoAgregada[];
};

export function SimuladosLista({
  historico,
  desempenho,
  status,
  reconhecida,
  nomeInstituicao,
  universidade,
  totalQuestoes,
  instituicoesDisponiveis,
}: Props) {
  const semMovimento = useReducedMotion();
  const concluidos = useMemo(() => historico.filter((s) => s.status === "concluido"), [historico]);
  const emAndamento = useMemo(() => historico.filter((s) => s.status === "em_andamento"), [historico]);
  const podeMontar = reconhecida && status.podeMontar;

  const pontos = useMemo(
    () =>
      desempenho.simulados.map((s) => ({
        id: s.id,
        rotulo: fmtDataCurta(s.criadoEm),
        nota: s.nota,
        acertos: s.acertos,
        total: s.total,
      })),
    [desempenho.simulados],
  );

  const temAnalise = desempenho.totalSimulados > 0;
  const acertosGerais = desempenho.questoes.filter((q) => q.status === "acerto").length;
  const brancos = desempenho.questoes.filter((q) => q.status === "branco").length;
  const aproveitamento =
    desempenho.totalQuestoes > 0 ? Math.round((acertosGerais / desempenho.totalQuestoes) * 100) : 0;
  const tempoMedioProva =
    desempenho.totalSimulados > 0 && desempenho.tempoTotalSeg > 0
      ? Math.round(desempenho.tempoTotalSeg / desempenho.totalSimulados)
      : null;
  const ultima = desempenho.ultimaNota;
  // Diferença da última prova pra média histórica: é a leitura que responde
  // "esse resultado foi normal pra mim?" sem precisar do gráfico.
  const vsMedia = ultima != null && desempenho.totalSimulados >= 2 ? ultima - desempenho.notaMedia : null;

  const anim = semMovimento ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      {/* ------------------------------------------------------------- topo */}
      <motion.header {...anim} className="surface-brand overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-questly-green text-white shadow-sm dark:text-[#0c1512]">
            <FileText size={24} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="kicker">Provas cronometradas</span>
            <h1 className="mt-0.5 font-heading text-[21px] font-semibold leading-tight tracking-tight">
              Simulados
            </h1>
            <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
              {reconhecida ? (
                <>
                  Questões reais de <b className="font-semibold text-foreground">{nomeInstituicao}</b>, de anos
                  variados, no relógio. No fim você vê a nota, onde perdeu ponto e o gabarito comentado.
                </>
              ) : (
                <>
                  Uma prova cronometrada com questões reais da sua universidade — o jeito mais rápido de
                  descobrir o que ainda não está pronto.
                </>
              )}
            </p>
            {reconhecida && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="tnum inline-flex items-center gap-1.5 rounded-full bg-questly-green-light px-2.5 py-1 text-[11px] font-bold text-questly-green-dark">
                  <Layers size={12} /> {totalQuestoes.toLocaleString("pt-BR")} questões no banco
                </span>
                {status.ehPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-questly-gold-light px-2.5 py-1 text-[11px] font-bold text-questly-gold-dark">
                    <Crown size={12} /> Simulados ilimitados
                  </span>
                ) : (
                  <span className="tnum inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    <TimerReset size={12} /> {status.restantes} de {status.limite} nesta semana
                  </span>
                )}
              </div>
            )}
          </div>
          {podeMontar && (
            <Link
              href="/simulados/montar"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
            >
              <Plus size={16} strokeWidth={2.5} /> Montar simulado
            </Link>
          )}
        </div>
      </motion.header>

      {/* Em andamento vem PRIMEIRO: é a única coisa aqui com relógio correndo. */}
      {emAndamento.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="kicker">Continue de onde parou</span>
          {emAndamento.map((s) => (
            <Link
              key={s.id}
              href={`/simulados/${s.id}`}
              className="group surface flex items-center gap-3.5 border-questly-blue/35 p-4 transition-all hover:shadow-md"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-blue-light text-questly-blue-dark">
                <Play size={18} fill="currentColor" />
                {!semMovimento && (
                  <motion.span
                    className="absolute inset-0 rounded-xl border-2 border-questly-blue"
                    animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{s.titulo}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {s.qtd_questoes} questões · {s.duracao_min}min · o relógio está correndo desde{" "}
                  {fmtDataCurta(s.iniciado_em)}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-questly-blue-dark">Continuar →</span>
            </Link>
          ))}
        </section>
      )}

      {/* Sem provas da universidade catalogadas — estado honesto, mas com saída:
          a causa mais comum é a universidade escrita de outro jeito (ou não
          preenchida), não a ausência real de conteúdo. */}
      {!reconhecida && (
        <div className="surface flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText size={20} className="text-muted-foreground" strokeWidth={1.75} />
          </span>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {universidade ? (
              <>
                Ainda não temos provas catalogadas de{" "}
                <b className="font-semibold text-foreground">{universidade}</b> pra montar um simulado. Assim
                que tivermos, ele aparece aqui.
              </>
            ) : (
              <>
                Você ainda não disse em qual universidade estuda — é isso que libera os simulados com as provas
                dela.
              </>
            )}
          </p>

          {instituicoesDisponiveis.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Instituições já no banco:</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {instituicoesDisponiveis.slice(0, 6).map((i) => (
                  <span
                    key={i.nome}
                    className="inline-flex items-center gap-1.5 rounded-full border border-questly-green/30 bg-questly-green/10 px-2.5 py-1 text-[12px] font-semibold text-questly-green-dark dark:text-questly-green"
                  >
                    {i.nome}
                    <span className="tnum text-[10.5px] opacity-70">{i.questoes}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/configuracoes"
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            {universidade ? "Corrigir minha universidade" : "Definir minha universidade"}
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      )}

      {/* Gate: free que estourou o limite da semana */}
      {reconhecida && !status.ehPro && !status.podeMontar && (
        <div className="surface flex flex-col gap-3 border-questly-gold/40 p-5 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-gold-light text-questly-gold-dark">
            <Lock size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Você usou seu simulado grátis da semana</p>
            <p className="text-xs font-medium text-muted-foreground">
              No plano free você monta {status.limite} simulado por semana. Com o Pro, são ilimitados — simule
              quantas provas quiser.
            </p>
          </div>
          <Link
            href="/pro"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-questly-gold px-3.5 py-2 text-sm font-bold text-[#3a2c05] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <Sparkles size={15} /> Seja Pro
          </Link>
        </div>
      )}

      {/* --------------------------------------------------- como estou indo */}
      {temAnalise && (
        <>
          <motion.section {...anim} className="surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-questly-green" />
                <h2 className="text-sm font-bold">Como você está indo</h2>
              </div>
              <Link
                href="/simulados/desempenho"
                className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-questly-green-dark transition-opacity hover:opacity-80 dark:text-questly-green"
              >
                Análise completa
                <ArrowUpRight size={13} strokeWidth={2.5} />
              </Link>
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              {ultima != null && (
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <AnelNota nota={ultima} detalhe={`média ${desempenho.notaMedia.toFixed(1)}`} />
                  {vsMedia != null && (
                    <span
                      className={`tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        vsMedia >= 0
                          ? "bg-questly-green-light text-questly-green-dark"
                          : "bg-questly-red-light text-questly-red-dark"
                      }`}
                    >
                      {vsMedia >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {vsMedia >= 0 ? "+" : ""}
                      {vsMedia.toFixed(1)} vs. sua média
                    </span>
                  )}
                </div>
              )}

              <div className="grid w-full min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3">
                <Indicador
                  icone={<Target size={13} />}
                  valor={desempenho.notaMedia.toFixed(1)}
                  rotulo="nota média"
                />
                <Indicador
                  icone={<Award size={13} />}
                  valor={desempenho.melhorNota.toFixed(1)}
                  rotulo="melhor nota"
                />
                <Indicador
                  icone={<TrendingUp size={13} />}
                  valor={
                    desempenho.deltaNota == null
                      ? "—"
                      : `${desempenho.deltaNota > 0 ? "+" : ""}${desempenho.deltaNota.toFixed(1)}`
                  }
                  rotulo="do 1º ao último"
                  tom={
                    desempenho.deltaNota == null ? "neutro" : desempenho.deltaNota >= 0 ? "bom" : "critico"
                  }
                />
                <Indicador
                  icone={<BarChart3 size={13} />}
                  valor={`${aproveitamento}%`}
                  rotulo="aproveitamento"
                  detalhe={`${desempenho.totalQuestoes} questões`}
                />
                <Indicador
                  icone={<Clock size={13} />}
                  valor={tempoMedioProva ? fmtSegundos(tempoMedioProva) : "—"}
                  rotulo="por prova"
                  detalhe={desempenho.tempo.temDados ? `${fmtSegundos(desempenho.tempo.medioSeg)}/questão` : undefined}
                />
                <Indicador
                  icone={<CircleSlash size={13} />}
                  valor={String(brancos)}
                  rotulo="em branco"
                  detalhe={brancos > 0 ? "valem zero, igual a erro" : "você marcou tudo"}
                  tom={brancos > 0 ? "critico" : "bom"}
                />
              </div>
            </div>
          </motion.section>

          {pontos.length >= 2 && (
            <motion.section {...anim} className="surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-questly-green" />
                <div>
                  <h2 className="text-sm font-bold">Evolução da nota</h2>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    Cada ponto é um simulado concluído. Toque num ponto pra abrir aquele resultado.
                  </p>
                </div>
              </div>
              <LinhaEvolucao pontos={pontos} />
            </motion.section>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers size={16} className="text-questly-green" />
                <div>
                  <h2 className="text-sm font-bold">Por disciplina</h2>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    Somando todas as questões que já caíram nos seus simulados.
                  </p>
                </div>
              </div>
              <BarrasDesempenho grupos={desempenho.materias.slice(0, 6)} mostrarTempo />
            </section>

            <section className="surface flex flex-col p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Swords size={16} className="text-questly-red" />
                  <div>
                    <h2 className="text-sm font-bold">Onde o estudo rende mais</h2>
                    <p className="text-[12px] leading-relaxed text-muted-foreground">
                      Seus tópicos mais fracos com pelo menos {MIN_AMOSTRA_AGREGADO} questões.
                    </p>
                  </div>
                </div>
              </div>
              <BarrasDesempenho
                grupos={desempenho.aMelhorar.slice(0, 4)}
                mostrarSub
                linhaAlvo={false}
                vazio="Nada abaixo da linha com amostra suficiente ainda. Ou você está bem, ou faltam questões por tópico."
              />
              {desempenho.aMelhorar.length > 0 && (
                <Link
                  href="/simulados/desempenho"
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
                >
                  <Swords size={13} /> Treinar esses tópicos
                </Link>
              )}
            </section>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------- histórico */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="kicker">Histórico</span>
          {concluidos.length > 0 && (
            <span className="tnum text-[11.5px] font-medium text-muted-foreground">
              {concluidos.length} {concluidos.length === 1 ? "prova concluída" : "provas concluídas"}
            </span>
          )}
        </div>
        {concluidos.length === 0 ? (
          <div className="surface flex flex-col items-center gap-2.5 p-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <BarChart3 size={19} className="text-muted-foreground" strokeWidth={1.75} />
            </span>
            <p className="max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
              {reconhecida
                ? "Você ainda não concluiu nenhum simulado. Monte o primeiro — é ele que liga toda a análise desta página."
                : "Nenhum simulado ainda."}
            </p>
            {podeMontar && (
              <Link
                href="/simulados/montar"
                className="mt-1 inline-flex items-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
              >
                <Plus size={16} strokeWidth={2.5} /> Montar meu primeiro simulado
              </Link>
            )}
          </div>
        ) : (
          concluidos.map((s) => {
            const nota = Number(s.nota ?? 0);
            const pct = s.total && s.total > 0 ? Math.round(((s.acertos ?? 0) / s.total) * 100) : 0;
            const tom = tomDoPct(pct);
            return (
              <Link
                key={s.id}
                href={`/simulados/${s.id}`}
                className="group surface-interativa flex items-center gap-3.5 p-4"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-heading text-[15px] font-bold ${CLASSE_BG_STATUS[tom]} ${CLASSE_TEXTO_STATUS[tom]}`}
                >
                  {nota.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{s.titulo}</p>
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs font-medium text-muted-foreground">
                    <span>{fmtDataCurta(s.criado_em)}</span>
                    <span className="tnum">
                      {s.acertos}/{s.total} acertos
                    </span>
                    <span className="tnum inline-flex items-center gap-1">
                      <Clock size={11} /> {fmtSegundos(s.tempo_gasto_seg)}
                    </span>
                  </p>
                  <span className="mt-1.5 block h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          tom === "bom"
                            ? "var(--color-questly-green)"
                            : tom === "atencao"
                              ? "var(--color-questly-gold)"
                              : "var(--color-questly-red)",
                      }}
                    />
                  </span>
                </div>
                <ArrowRight
                  size={17}
                  strokeWidth={2}
                  className="shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}

function Indicador({
  icone,
  valor,
  rotulo,
  detalhe,
  tom = "neutro",
}: {
  icone: React.ReactNode;
  valor: React.ReactNode;
  rotulo: string;
  detalhe?: string;
  tom?: "neutro" | "bom" | "critico";
}) {
  const cor =
    tom === "bom" ? "text-questly-green-dark" : tom === "critico" ? "text-questly-red-dark" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      <p className={`tnum mt-1 font-heading text-[21px] font-bold leading-none ${cor}`}>{valor}</p>
      {detalhe && <p className="mt-1 truncate text-[10.5px] font-medium text-muted-foreground">{detalhe}</p>}
    </div>
  );
}
