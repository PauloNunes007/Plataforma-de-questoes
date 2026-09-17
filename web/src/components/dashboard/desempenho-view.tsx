"use client";

// Visão "Desempenho" da home — a tela de análise, separada da tela de ação.
//
// Quatro andares, do resumo pro detalhe:
//   1. filtro de período (Total / 7 / 30 / 60 / 90 dias);
//   2. quatro KPIs: taxa de acerto, volume, melhor área e ponto de atenção;
//   3. radar por área  +  curva de evolução;
//   4. tópicos que você mais errou  +  a sua semana (a tira de XP por dia).
//
// TUDO é recorte do mesmo histórico agregado que veio do servidor uma vez
// (ver desempenho-data.ts): trocar de período não refaz nenhuma consulta.
//
// Honestidade: "melhor área" e "ponto de atenção" só aparecem com amostra
// mínima por matéria, e quando não há nada a célula diz o que falta em vez de
// mostrar um 0% que não significa nada.

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, FileText, Sparkles, Target, TriangleAlert } from "lucide-react";
import type { DesempenhoDados } from "@/lib/dashboard/desempenho-data";
import { PERIODOS, recortar, type PeriodoId } from "@/lib/dashboard/desempenho-calc";
import type { SemanaResumo } from "@/lib/questly/dashboard-data";
import { RadarAreas } from "./graficos/radar-areas";
import { EvolucaoAcerto } from "./graficos/evolucao-acerto";
import { SemanaView } from "./semana-view";

export function DesempenhoView({
  dados,
  semana,
  ehPro,
}: {
  dados: DesempenhoDados;
  semana: SemanaResumo;
  ehPro: boolean;
}) {
  const [periodo, setPeriodo] = useState<PeriodoId>("total");
  const semMovimento = useReducedMotion();
  const r = useMemo(() => recortar(dados, periodo), [dados, periodo]);

  const entrada = semMovimento
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
      };

  if (dados.buckets.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Target size={20} strokeWidth={1.8} className="text-muted-foreground" />
        </span>
        <p className="font-heading text-[16px] font-semibold">Seu desempenho começa na primeira questão</p>
        <p className="max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
          Assim que você responder, esta aba passa a mostrar acertabilidade por área, a curva de
          evolução e os tópicos que mais te derrubam. Nada aqui é estimado — é o seu histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------ filtro de período */}
      <div
        role="tablist"
        aria-label="Período da análise"
        className="rolagem-x -mx-4 flex gap-2 px-4 sm:mx-0 sm:px-0"
      >
        {PERIODOS.map((p) => {
          const ativo = p.id === periodo;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setPeriodo(p.id)}
              className={`relative h-10 shrink-0 cursor-pointer rounded-xl px-4 text-[13px] font-semibold transition-colors ${
                ativo
                  ? "text-white"
                  : "border border-border text-muted-foreground hover:border-questly-green/45 hover:text-foreground"
              }`}
            >
              {ativo && (
                <motion.span
                  layoutId={semMovimento ? undefined : "periodo-ativo"}
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-questly-green to-questly-green-deep shadow-sm"
                  transition={{ type: "spring", stiffness: 460, damping: 38 }}
                />
              )}
              <span className="relative">{p.rotulo}</span>
            </button>
          );
        })}
      </div>

      {dados.truncado && periodo === "total" && (
        <p className="flex items-start gap-2 rounded-xl border border-questly-gold/30 bg-questly-gold-light px-3 py-2 text-[12px] leading-relaxed text-questly-gold-dark">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Seu histórico passou do limite lido de uma vez — a análise usa as tentativas mais
          recentes.
        </p>
      )}

      {/* ----------------------------------------------------------- KPIs */}
      <motion.div {...entrada} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icone={<Target size={15} strokeWidth={2.2} />}
          rotulo="Taxa de acerto"
          valor={r.pctAcerto != null ? `${r.pctAcerto}%` : "—"}
          detalhe={
            r.total > 0
              ? `${r.acertos.toLocaleString("pt-BR")} certas · ${r.erros.toLocaleString("pt-BR")} erradas`
              : "sem questões no período"
          }
          tom={r.pctAcerto != null ? faixa(r.pctAcerto) : "neutro"}
        />
        <Kpi
          icone={<FileText size={15} strokeWidth={2.2} />}
          rotulo="Questões no período"
          valor={r.total.toLocaleString("pt-BR")}
          detalhe={`em ${r.diasAtivos} ${r.diasAtivos === 1 ? "dia ativo" : "dias ativos"}`}
          tom="info"
        />
        <Kpi
          icone={<Sparkles size={15} strokeWidth={2.2} />}
          rotulo="Melhor área"
          valor={r.melhorArea ? `${r.melhorArea.pct}%` : "—"}
          detalhe={r.melhorArea ? r.melhorArea.nome : "amostra pequena demais ainda"}
          tom={r.melhorArea ? "bom" : "neutro"}
        />
        <Kpi
          icone={<TriangleAlert size={15} strokeWidth={2.2} />}
          rotulo="Ponto de atenção"
          valor={r.piorArea ? `${r.piorArea.pct}%` : "—"}
          detalhe={r.piorArea ? r.piorArea.nome : "sem área fraca destacada"}
          tom={r.piorArea ? faixa(r.piorArea.pct) : "neutro"}
        />
      </motion.div>

      {/* ------------------------------------------------------- gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <RadarAreas areas={r.areas} media={r.pctAcerto} />
        <EvolucaoAcerto dias={r.dias} />
      </div>

      {/* -------------------------------------- erros + a semana em barras */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopicosErrados topicos={r.topicosErrados} />
        <div className="min-w-0">
          <SemanaView semana={semana} ehPro={ehPro} />
        </div>
      </div>
    </div>
  );
}

function faixa(pct: number): "bom" | "atencao" | "critico" {
  if (pct >= 70) return "bom";
  if (pct >= 50) return "atencao";
  return "critico";
}

type TomKpi = "neutro" | "info" | "bom" | "atencao" | "critico";

function Kpi({
  icone,
  rotulo,
  valor,
  detalhe,
  tom,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  detalhe: string;
  tom: TomKpi;
}) {
  const numero: Record<TomKpi, string> = {
    neutro: "text-foreground",
    info: "text-questly-blue-dark dark:text-questly-blue",
    bom: "text-questly-green-dark dark:text-questly-green",
    atencao: "text-questly-gold-dark",
    critico: "text-questly-red-dark",
  };
  const chip: Record<TomKpi, string> = {
    neutro: "bg-muted text-muted-foreground",
    info: "bg-questly-blue-light text-questly-blue-dark dark:text-questly-blue",
    bom: "bg-questly-green-light text-questly-green-dark dark:text-questly-green",
    atencao: "bg-questly-gold-light text-questly-gold-dark",
    critico: "bg-questly-red-light text-questly-red-dark",
  };

  return (
    <div className="surface flex flex-col p-4">
      <span className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${chip[tom]}`}>
          {icone}
        </span>
        <span className="truncate text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
      </span>
      <p className={`tnum mt-2.5 font-heading text-[30px] font-bold leading-none tracking-tight ${numero[tom]}`}>
        {valor}
      </p>
      <p className="mt-1.5 truncate text-[11.5px] font-medium text-muted-foreground" title={detalhe}>
        {detalhe}
      </p>
    </div>
  );
}

function TopicosErrados({
  topicos,
}: {
  topicos: { nome: string; materia: string; erros: number; total: number; pctAcerto: number }[];
}) {
  return (
    <section className="surface flex flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <TriangleAlert size={15} strokeWidth={2.1} className="text-questly-red-dark" />
        <h2 className="font-heading text-[15px] font-semibold tracking-tight">
          Tópicos que você mais errou
        </h2>
      </div>

      {topicos.length === 0 ? (
        <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          Nenhum erro registrado neste período. Quando houver, os tópicos aparecem aqui em ordem —
          é por eles que vale começar a revisão.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {topicos.map((t, i) => (
            <li
              key={`${t.materia}-${t.nome}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5"
            >
              <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-questly-red-light font-heading text-[14px] font-bold text-questly-red-dark">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">
                  <span className="text-muted-foreground">{t.materia}: </span>
                  {t.nome}
                </span>
                <span className="tnum block text-[11px] font-medium text-muted-foreground">
                  {t.pctAcerto}% de acerto em {t.total} {t.total === 1 ? "questão" : "questões"}
                </span>
              </span>
              <span className="tnum shrink-0 rounded-lg bg-questly-red-light px-2 py-1 text-[12.5px] font-bold text-questly-red-dark">
                {t.erros} {t.erros === 1 ? "erro" : "erros"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
