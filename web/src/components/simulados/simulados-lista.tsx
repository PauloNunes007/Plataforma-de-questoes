"use client";

// Hub dos Simulados. A ordem da página segue a urgência do aluno: retomar uma
// prova em andamento → montar uma nova → ver como está indo → histórico.
//
// Os números do topo saem só dos resumos já carregados (nota/acertos/tempo por
// simulado); a análise pesada — por tópico, por dificuldade, consistência —
// mora em /simulados/desempenho, pra esta tela abrir rápido.

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BarChart3,
  Clock,
  Crown,
  FileText,
  Lock,
  Play,
  Plus,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import type { SimuladoResumo, StatusPlanoSimulado } from "@/lib/simulados/simulados-data";
import type { InstituicaoAgregada } from "@/lib/cursos/instituicao";
import { fmtDataCurta, fmtSegundos, tomDoPct } from "@/lib/simulados/analise";
import { CLASSE_BG_STATUS, CLASSE_TEXTO_STATUS } from "./graficos/base";
import { LinhaEvolucao } from "./graficos/linha-evolucao";

type Props = {
  historico: SimuladoResumo[];
  status: StatusPlanoSimulado;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  universidade: string | null;
  totalQuestoes: number;
  instituicoesDisponiveis: InstituicaoAgregada[];
};

export function SimuladosLista({
  historico,
  status,
  reconhecida,
  nomeInstituicao,
  universidade,
  totalQuestoes,
  instituicoesDisponiveis,
}: Props) {
  const concluidos = useMemo(() => historico.filter((s) => s.status === "concluido"), [historico]);
  const emAndamento = useMemo(() => historico.filter((s) => s.status === "em_andamento"), [historico]);

  const resumo = useMemo(() => {
    if (concluidos.length === 0) return null;
    const notas = concluidos.map((s) => Number(s.nota ?? 0));
    const cronologico = [...concluidos].reverse();
    return {
      quantidade: concluidos.length,
      media: Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10,
      melhor: Math.max(...notas),
      // `notas` está do mais recente pro mais antigo (ordem do histórico)
      delta: notas.length >= 2 ? Math.round((notas[0] - notas[notas.length - 1]) * 10) / 10 : null,
      pontos: cronologico.map((s) => ({
        id: s.id,
        rotulo: fmtDataCurta(s.criado_em),
        nota: Number(s.nota ?? 0),
        acertos: s.acertos ?? undefined,
        total: s.total ?? undefined,
      })),
    };
  }, [concluidos]);

  const podeMontar = reconhecida && status.podeMontar;

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker">Provas cronometradas</span>
          <h1 className="mt-1 font-heading text-[22px] font-semibold tracking-tight">Simulados</h1>
          <p className="mt-1 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
            Monte uma prova no estilo da sua universidade com questões reais de anos anteriores, no tempo do
            relógio. No fim você vê a nota, onde perdeu ponto e o gabarito comentado.
          </p>
        </div>
        {podeMontar && (
          <Link
            href="/simulados/montar"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            <Plus size={16} strokeWidth={2.5} /> Montar simulado
          </Link>
        )}
      </header>

      {/* Em andamento vem PRIMEIRO: é a única coisa aqui com relógio correndo. */}
      {emAndamento.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="kicker">Continue de onde parou</span>
          {emAndamento.map((s) => (
            <Link
              key={s.id}
              href={`/simulados/${s.id}`}
              className="group surface flex items-center gap-3.5 border-questly-blue/30 p-4 transition-all hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-blue-light text-questly-blue-dark">
                <Play size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{s.titulo}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {s.qtd_questoes} questões · {s.duracao_min}min · iniciado {fmtDataCurta(s.iniciado_em)}
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

      {/* Card da instituição reconhecida */}
      {reconhecida && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-brand flex items-center gap-4 p-5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-questly-green text-white shadow-sm">
            <Award size={24} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Provas de {nomeInstituicao}</p>
            <p className="text-xs font-medium text-muted-foreground">
              {totalQuestoes.toLocaleString("pt-BR")} questões reais no banco, prontas pra virar simulado.
            </p>
          </div>
          {status.ehPro ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-questly-gold-light px-2.5 py-1 text-[11px] font-bold text-questly-gold-dark">
              <Crown size={12} /> Ilimitado
            </span>
          ) : (
            <span className="tnum inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
              <TimerReset size={12} /> {status.restantes}/{status.limite} nesta semana
            </span>
          )}
        </motion.div>
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

      {/* Resumo + evolução */}
      {resumo && (
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador icone={<BarChart3 size={13} />} valor={resumo.quantidade} rotulo="simulados" />
            <Indicador icone={<Target size={13} />} valor={resumo.media.toFixed(1)} rotulo="nota média" />
            <Indicador icone={<Award size={13} />} valor={resumo.melhor.toFixed(1)} rotulo="melhor nota" />
            <Indicador
              icone={<TrendingUp size={13} />}
              valor={resumo.delta == null ? "—" : `${resumo.delta > 0 ? "+" : ""}${resumo.delta.toFixed(1)}`}
              rotulo="evolução"
              tom={resumo.delta == null ? "neutro" : resumo.delta >= 0 ? "bom" : "critico"}
            />
          </div>

          <div className="surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-questly-green" />
                <h2 className="text-sm font-bold">Sua evolução</h2>
              </div>
              <Link
                href="/simulados/desempenho"
                className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-questly-green-dark transition-opacity hover:opacity-80 dark:text-questly-green"
              >
                Análise completa
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
            <LinhaEvolucao pontos={resumo.pontos} />
          </div>
        </section>
      )}

      {/* Histórico */}
      <section className="flex flex-col gap-2">
        <span className="kicker">Histórico</span>
        {concluidos.length === 0 ? (
          <div className="surface p-6 text-center text-sm text-muted-foreground">
            {reconhecida
              ? "Você ainda não concluiu nenhum simulado. Monte o primeiro e ele aparece aqui."
              : "Nenhum simulado ainda."}
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
  tom = "neutro",
}: {
  icone: React.ReactNode;
  valor: React.ReactNode;
  rotulo: string;
  tom?: "neutro" | "bom" | "critico";
}) {
  const cor =
    tom === "bom" ? "text-questly-green-dark" : tom === "critico" ? "text-questly-red-dark" : "text-foreground";
  return (
    <div className="surface p-3.5">
      <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      <p className={`mt-1 font-heading text-[22px] font-bold leading-none ${cor}`}>{valor}</p>
    </div>
  );
}
