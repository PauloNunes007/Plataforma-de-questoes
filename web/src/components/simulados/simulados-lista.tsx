"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Clock,
  Crown,
  FileText,
  Lock,
  Play,
  Plus,
  Sparkles,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import type { SimuladoResumo, StatusPlanoSimulado } from "@/lib/simulados/simulados-data";
import { EvolucaoChart } from "./evolucao-chart";

type Props = {
  historico: SimuladoResumo[];
  status: StatusPlanoSimulado;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  universidade: string | null;
  totalQuestoes: number;
};

function fmtData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function fmtDuracao(seg: number | null): string {
  if (!seg && seg !== 0) return "—";
  const m = Math.round(seg / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

function corNota(nota: number): string {
  if (nota >= 7) return "text-questly-green-dark bg-questly-green-light";
  if (nota >= 5) return "text-questly-gold-dark bg-questly-gold-light";
  return "text-questly-red-dark bg-questly-red-light";
}

export function SimuladosLista({
  historico,
  status,
  reconhecida,
  nomeInstituicao,
  universidade,
  totalQuestoes,
}: Props) {
  const concluidos = historico.filter((s) => s.status === "concluido");
  const emAndamento = historico.filter((s) => s.status === "em_andamento");
  const pontosEvolucao = concluidos
    .slice()
    .reverse()
    .map((s) => ({ nota: Number(s.nota ?? 0), rotulo: fmtData(s.criado_em) }));

  const podeMontar = reconhecida && status.podeMontar;

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker">Provas cronometradas</span>
          <h1 className="mt-1 font-heading text-[22px] font-semibold tracking-tight">Simulados</h1>
          <p className="mt-1 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
            Monte uma prova no estilo da sua universidade com questões reais de anos anteriores, com
            tempo cronometrado — e veja seu resultado no fim.
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

      {/* Sem provas da universidade catalogadas — estado honesto */}
      {!reconhecida && (
        <div className="surface flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText size={20} className="text-muted-foreground" strokeWidth={1.75} />
          </span>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {universidade
              ? <>Ainda não temos provas catalogadas de <b className="font-semibold text-foreground">{universidade}</b> pra montar um simulado. Assim que tivermos, ele aparece aqui.</>
              : <>Defina sua universidade nas <Link href="/configuracoes" className="font-semibold text-questly-green underline-offset-2 hover:underline">Configurações</Link> pra montar simulados com provas dela.</>}
          </p>
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
              No plano free você monta {status.limite} simulado por semana. Com o Pro, são ilimitados —
              simule quantas provas quiser.
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

      {/* Simulados em andamento — retomar */}
      {emAndamento.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="kicker">Em andamento</span>
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
                  {s.qtd_questoes} questões · {s.duracao_min}min · iniciado {fmtData(s.iniciado_em)}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-questly-blue-dark">Continuar →</span>
            </Link>
          ))}
        </section>
      )}

      {/* Evolução */}
      {pontosEvolucao.length >= 2 && (
        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-questly-green" />
            <h2 className="text-sm font-bold">Sua evolução</h2>
          </div>
          <EvolucaoChart pontos={pontosEvolucao} />
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
            return (
              <Link
                key={s.id}
                href={`/simulados/${s.id}`}
                className="group surface flex items-center gap-3.5 p-4 transition-all hover:shadow-md"
              >
                <span className={`tnum flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-heading font-bold ${corNota(nota)}`}>
                  {nota.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{s.titulo}</p>
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs font-medium text-muted-foreground">
                    <span>{fmtData(s.criado_em)}</span>
                    <span className="tnum">{s.acertos}/{s.total} acertos</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {fmtDuracao(s.tempo_gasto_seg)}
                    </span>
                  </p>
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
