"use client";

// Rail direito do dashboard (redesign 2026-07). Os antigos cards de
// Boss/XP/Liga/Streak foram consolidados no StatStrip e no painel do
// Boss; aqui ficam o calendário (agora interativo: clicar num dia abre
// o detalhe ali mesmo) e a lista de disciplinas (cada linha navega pra
// trilha da disciplina).
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowUpRight, Check, Plus, Swords, X } from "lucide-react";
import type { CalDay, SubjectListItem } from "@/lib/questly/dashboard-data";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import { alternarTarefaAction, criarTarefaAction } from "@/lib/tarefas/actions";

const CARD_CLASS = "surface p-5";

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

function CardLabel({
  children,
  seeAllHref,
  seeAllLabel,
}: {
  children: React.ReactNode;
  seeAllHref?: string;
  seeAllLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[13.5px] font-semibold tracking-tight">{children}</span>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {seeAllLabel}
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

const CAL_DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarRailCard({
  monthLabel,
  dowOffset,
  days,
  tarefas,
  subjects,
  index,
}: {
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  tarefas: Record<string, TarefaRow[]>;
  subjects: { id: string; nome: string }[];
  index: number;
}) {
  const [selecionado, setSelecionado] = useState<CalDay | null>(null);
  const [tarefasPorDia, setTarefasPorDia] = useState(tarefas);
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const descricaoDia = (day: CalDay) => {
    switch (day.estado) {
      case "prova":
        return day.title || "Dia de prova";
      case "estudou":
        return "Missão cumprida nesse dia";
      case "hoje":
        return "Hoje — sua missão te espera";
      default:
        return "Nada registrado nesse dia";
    }
  };

  function selecionar(day: CalDay) {
    const ativo = selecionado?.dia === day.dia;
    setSelecionado(ativo ? null : day);
    setFormAberto(false);
    setNome("");
    setSubjectId("");
  }

  async function adicionarTarefa() {
    if (!selecionado || !nome.trim() || salvando) return;
    setSalvando(true);
    const { ok, id } = await criarTarefaAction({
      nome,
      descricao: null,
      subjectId: subjectId || null,
      data: selecionado.data,
    });
    if (ok && id) {
      const subjectNome = subjects.find((s) => s.id === subjectId)?.nome || null;
      setTarefasPorDia((prev) => ({
        ...prev,
        [selecionado.data]: [
          ...(prev[selecionado.data] || []),
          { id, nome: nome.trim(), descricao: null, data: selecionado.data, concluida: false, subjectId: subjectId || null, subjectNome },
        ],
      }));
      setNome("");
      setSubjectId("");
      setFormAberto(false);
    }
    setSalvando(false);
  }

  async function alternarTarefa(data: string, id: string, concluidaAtual: boolean) {
    setTarefasPorDia((prev) => ({
      ...prev,
      [data]: (prev[data] || []).map((t) => (t.id === id ? { ...t, concluida: !concluidaAtual } : t)),
    }));
    await alternarTarefaAction(id, !concluidaAtual);
  }

  const tarefasDoDiaSelecionado = selecionado ? tarefasPorDia[selecionado.data] || [] : [];

  return (
    <CardEntry index={index}>
      <CardLabel>{monthLabel}</CardLabel>
      <div className="grid grid-cols-7 gap-1 text-center">
        {CAL_DOW.map((d, i) => (
          <div key={i} className="pb-1.5 text-[10px] font-semibold text-muted-foreground/70">
            {d}
          </div>
        ))}
        {Array.from({ length: dowOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const ativo = selecionado?.dia === day.dia;
          const temTarefa = (tarefasPorDia[day.data]?.length || 0) > 0;
          return (
            <button
              key={day.dia}
              type="button"
              onClick={() => selecionar(day)}
              className={`tnum relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-[11.5px] font-medium transition-colors ${
                day.estado === "hoje"
                  ? "bg-questly-green font-semibold text-white dark:text-[#0c1512]"
                  : day.estado === "prova"
                    ? "bg-questly-orange-light font-semibold text-questly-orange-dark"
                    : day.estado === "estudou"
                      ? "bg-questly-green-light text-questly-green-dark"
                      : "text-muted-foreground hover:bg-muted"
              } ${ativo ? "ring-2 ring-questly-green/50 ring-offset-1 ring-offset-card" : ""}`}
            >
              {day.dia}
              {day.estado === "prova" && (
                <Swords
                  size={8}
                  strokeWidth={2.5}
                  className="absolute bottom-0.5 right-0.5 text-questly-orange-dark"
                />
              )}
              {temTarefa && day.estado !== "prova" && (
                <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-questly-purple" />
              )}
            </button>
          );
        })}
      </div>

      {/* Detalhe do dia selecionado — in-place, sem sair do dashboard */}
      <AnimatePresence initial={false}>
        {selecionado && (
          <motion.div
            key={selecionado.dia}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-muted/60 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-[13px] font-semibold shadow-sm">
                    {selecionado.dia}
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">{descricaoDia(selecionado)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAberto((v) => !v)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                >
                  {formAberto ? <X size={13} strokeWidth={2.25} /> : <Plus size={13} strokeWidth={2.25} />}
                </button>
              </div>

              {tarefasDoDiaSelecionado.length > 0 && (
                <ul className="mt-2.5 flex flex-col gap-1">
                  {tarefasDoDiaSelecionado.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alternarTarefa(selecionado.data, t.id, t.concluida)}
                        className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          t.concluida ? "border-questly-green bg-questly-green text-white" : "border-border"
                        }`}
                      >
                        {t.concluida && <Check size={9} strokeWidth={3} />}
                      </button>
                      <span
                        className={`truncate text-xs ${t.concluida ? "text-muted-foreground line-through" : ""}`}
                      >
                        {t.nome}
                        {t.subjectNome && <span className="text-muted-foreground"> · {t.subjectNome}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <AnimatePresence initial={false}>
                {formAberto && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome da tarefa"
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-questly-green"
                      />
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-questly-green"
                      >
                        <option value="">Sem disciplina</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={adicionarTarefa}
                        disabled={!nome.trim() || salvando}
                        className="rounded-lg bg-questly-green px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50 dark:text-[#0c1512]"
                      >
                        {salvando ? "Salvando..." : "Adicionar"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendaItem cor="bg-questly-green-light" rotulo="Estudou" />
        <LegendaItem cor="bg-questly-green" rotulo="Hoje" />
        <LegendaItem cor="bg-questly-orange-light" rotulo="Prova" />
        <LegendaItem cor="bg-questly-purple" rotulo="Tarefa" />
      </div>
    </CardEntry>
  );
}

function LegendaItem({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
      <i className={`inline-block h-2 w-2 rounded-[3px] ${cor}`} />
      {rotulo}
    </span>
  );
}

// Paleta de acento por posição — tons desaturados coerentes com o tema.
const CORES_DISCIPLINA = [
  "var(--questly-green)",
  "var(--questly-purple)",
  "var(--questly-blue)",
  "var(--questly-orange)",
  "var(--questly-red)",
  "var(--questly-gold)",
];

export function SubjectsRailCard({ subjects, index }: { subjects: SubjectListItem[]; index: number }) {
  return (
    <CardEntry index={index}>
      <CardLabel seeAllHref="/questoes" seeAllLabel="Praticar">
        Disciplinas
      </CardLabel>
      {subjects.length === 0 ? (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Você ainda não configurou nenhuma disciplina.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex w-full items-center justify-center rounded-xl bg-questly-green px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            Configurar
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {subjects.map((s, i) => {
            const cor = CORES_DISCIPLINA[i % CORES_DISCIPLINA.length];
            return (
              <Link
                key={s.id}
                href="/trilha"
                className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
                  style={{
                    color: cor,
                    background: `color-mix(in oklab, ${cor} 12%, transparent)`,
                  }}
                >
                  {s.nome.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight">
                    {s.nome}
                  </span>
                  <span className="tnum block text-[11px] leading-tight text-muted-foreground">
                    {s.diasBoss != null ? `Boss em ${s.diasBoss} dias` : "Sem prova marcada"}
                  </span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${s.diasBoss != null ? s.preparo : 0}%`,
                        background: cor,
                      }}
                    />
                  </span>
                </span>
                <span className="tnum shrink-0 text-[13px] font-semibold text-muted-foreground group-hover:text-foreground">
                  {s.aprovacao != null ? `${s.aprovacao}%` : "–"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </CardEntry>
  );
}
