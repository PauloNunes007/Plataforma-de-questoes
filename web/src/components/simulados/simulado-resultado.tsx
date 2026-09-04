"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronDown, Clock, MinusCircle, RotateCcw, Target, XCircle } from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import type { SimuladoCompleto } from "@/lib/simulados/simulados-data";

function fmtDuracao(seg: number | null): string {
  if (!seg && seg !== 0) return "—";
  const m = Math.round(seg / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

function corNota(nota: number): { text: string; bg: string; ring: string } {
  if (nota >= 7) return { text: "text-questly-green-dark", bg: "bg-questly-green-light", ring: "var(--color-questly-green)" };
  if (nota >= 5) return { text: "text-questly-gold-dark", bg: "bg-questly-gold-light", ring: "var(--color-questly-gold)" };
  return { text: "text-questly-red-dark", bg: "bg-questly-red-light", ring: "var(--color-questly-red)" };
}

export function SimuladoResultado({ simulado }: { simulado: SimuladoCompleto }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const nota = Number(simulado.nota ?? 0);
  const acertos = simulado.acertos ?? 0;
  const total = simulado.total ?? simulado.perguntas.length;
  const emBranco = simulado.perguntas.filter((p) => !simulado.respostas[p.id]).length;
  const cor = corNota(nota);

  // Detalhamento por matéria
  const porMateria = useMemo(() => {
    const mapa = new Map<string, { acertos: number; total: number }>();
    for (const p of simulado.perguntas) {
      const materia = (p.topic_id && simulado.contexto[p.topic_id]?.materia) || "Geral";
      const m = mapa.get(materia) || { acertos: 0, total: 0 };
      m.total += 1;
      if (simulado.respostas[p.id] === p.gabarito) m.acertos += 1;
      mapa.set(materia, m);
    }
    return [...mapa.entries()]
      .map(([materia, v]) => ({ materia, ...v, pct: v.total ? Math.round((v.acertos / v.total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
  }, [simulado]);

  const anguloAcertos = total > 0 ? (acertos / total) * 360 : 0;

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-6 sm:px-6 lg:py-8">
      <Link
        href="/simulados"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> Simulados
      </Link>

      {/* Cabeçalho do resultado */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Resultado</p>
        <h1 className="mt-0.5 font-heading text-lg font-bold sm:text-xl">{simulado.titulo}</h1>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          {/* anel de nota */}
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(${cor.ring} ${anguloAcertos}deg, var(--color-muted) 0deg)` }}
            />
            <div className="absolute inset-[10px] rounded-full bg-background" />
            <div className="relative text-center">
              <div className={`tnum font-heading text-4xl font-bold leading-none ${cor.text}`}>{nota.toFixed(1)}</div>
              <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">de 10</div>
            </div>
          </div>

          {/* números */}
          <div className="grid flex-1 grid-cols-3 gap-3">
            <div className={`rounded-xl p-3 text-center ${cor.bg}`}>
              <div className="tnum font-heading text-2xl font-bold">{acertos}</div>
              <div className="text-[11px] font-semibold text-muted-foreground">acertos</div>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <div className="tnum font-heading text-2xl font-bold">{total - acertos}</div>
              <div className="text-[11px] font-semibold text-muted-foreground">erros</div>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <div className="tnum flex items-center justify-center gap-1 font-heading text-lg font-bold">
                <Clock size={15} className="text-muted-foreground" />
                {fmtDuracao(simulado.tempo_gasto_seg)}
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">tempo</div>
            </div>
          </div>
        </div>

        {emBranco > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground sm:text-left">
            <MinusCircle size={12} className="mb-0.5 mr-1 inline" />
            {emBranco} {emBranco === 1 ? "questão ficou em branco" : "questões ficaram em branco"}.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/simulados/montar"
            className="inline-flex items-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            <RotateCcw size={15} /> Montar outro
          </Link>
        </div>
      </motion.div>

      {/* Desempenho por matéria */}
      {porMateria.length > 1 && (
        <section className="surface mt-5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target size={16} className="text-questly-green" />
            <h2 className="text-sm font-bold">Desempenho por disciplina</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {porMateria.map((m) => (
              <div key={m.materia}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold">{m.materia}</span>
                  <span className="tnum font-bold text-muted-foreground">
                    {m.acertos}/{m.total} · {m.pct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${m.pct >= 70 ? "bg-questly-green" : m.pct >= 50 ? "bg-questly-gold" : "bg-questly-red"}`}
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Revisão questão a questão */}
      <section className="mt-5">
        <h2 className="mb-2.5 text-sm font-bold">Gabarito comentado</h2>
        <div className="flex flex-col gap-2">
          {simulado.perguntas.map((p, i) => {
            const marcada = simulado.respostas[p.id];
            const acertou = marcada === p.gabarito;
            const expandida = aberta === p.id;
            const letras = Object.keys(p.alternativas || {}).sort();
            return (
              <div key={p.id} className="surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAberta(expandida ? null : p.id)}
                  aria-expanded={expandida}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      acertou
                        ? "bg-questly-green-light text-questly-green-dark"
                        : marcada
                          ? "bg-questly-red-light text-questly-red-dark"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {acertou ? <CheckCircle2 size={16} /> : marcada ? <XCircle size={16} /> : <MinusCircle size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="tnum text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Questão {i + 1}
                    </span>
                    <span className="line-clamp-1 text-[13px] font-medium text-muted-foreground">
                      <MathText text={p.enunciado} />
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[11px] font-bold text-muted-foreground">
                    {marcada ? `Você: ${marcada.toUpperCase()}` : "Em branco"} · Gab: {p.gabarito.toUpperCase()}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${expandida ? "rotate-180" : ""}`} />
                </button>

                {expandida && (
                  <div className="border-t border-border/60 p-4 pt-4">
                    <div className="mb-4 text-[15px] font-medium leading-relaxed">
                      <MathText text={p.enunciado} />
                    </div>
                    {p.imagem_url && (
                      <div className="mb-4 flex h-[220px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imagem_url} alt="Imagem da questão" loading="lazy" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      {letras.map((letra) => {
                        const eGab = letra === p.gabarito;
                        const eSua = letra === marcada;
                        return (
                          <div
                            key={letra}
                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[14px] ${
                              eGab
                                ? "border-questly-green/60 bg-questly-green-light"
                                : eSua
                                  ? "border-questly-red/60 bg-questly-red-light"
                                  : "border-border"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-bold ${
                                eGab
                                  ? "bg-questly-green text-white dark:text-[#0c1512]"
                                  : eSua
                                    ? "bg-questly-red text-white dark:text-[#2b0a0a]"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {letra.toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <MathText text={p.alternativas?.[letra] ?? ""} />
                            </span>
                            {eGab && <span className="shrink-0 text-[11px] font-bold text-questly-green-dark">Correta</span>}
                            {eSua && !eGab && <span className="shrink-0 text-[11px] font-bold text-questly-red-dark">Sua resposta</span>}
                          </div>
                        );
                      })}
                    </div>
                    {p.resolucao && (
                      <div className="mt-4 rounded-xl bg-muted/60 p-4">
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Resolução</p>
                        <div className="text-[14px] leading-relaxed">
                          <MathText text={p.resolucao} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
