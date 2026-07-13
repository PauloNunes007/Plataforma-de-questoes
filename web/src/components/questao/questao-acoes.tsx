"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Flag, Sparkles, Star, StickyNote } from "lucide-react";
import { MathKeyboard } from "@/components/questao/math-keyboard";
import { MOTIVOS_REPORT, type MotivoReport } from "@/lib/anotacoes/types";
import { reportarQuestaoAction } from "@/lib/anotacoes/actions";

// Barra de ações da questão (favoritar / anotar / reportar), reaproveitada
// no QuestaoRunner e nos cards de /questoes/favoritos e /questoes/anotacoes.
// Estado de favorito/nota é controlado pelo pai; aqui é só a UI + chamada
// das Server Actions. Redesign fintech (2026-07): pills rotuladas em vez de
// ícones soltos, painéis animados, anotação com teclado de fórmulas.

function Pill({
  ativo,
  cor,
  icone,
  rotulo,
  onClick,
}: {
  ativo: boolean;
  cor: "gold" | "blue" | "red";
  icone: React.ReactNode;
  rotulo: string;
  onClick: () => void;
}) {
  const estilos = {
    gold: "bg-questly-gold-light text-questly-gold-dark ring-questly-gold/30",
    blue: "bg-questly-blue-light text-questly-blue-dark ring-questly-blue/30",
    red: "bg-questly-red-light text-questly-red-dark ring-questly-red/30",
  }[cor];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all ${
        ativo
          ? `${estilos} ring-1`
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icone}
      {rotulo}
    </button>
  );
}

const painelMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { type: "spring" as const, stiffness: 380, damping: 32 },
};

export function QuestaoAcoes({
  questionId,
  resolucao,
  favoritado,
  notaInicial,
  onToggleFavorito,
  onSalvarNota,
}: {
  questionId: string;
  resolucao: string | null;
  favoritado: boolean;
  notaInicial: string | null;
  onToggleFavorito: () => void | Promise<void>;
  onSalvarNota: (texto: string) => void | Promise<void>;
}) {
  const [painel, setPainel] = useState<"nota" | "report" | null>(null);
  const [nota, setNota] = useState(notaInicial || "");
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [notaSalva, setNotaSalva] = useState(false);

  const [motivo, setMotivo] = useState<MotivoReport | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const [enviandoReport, setEnviandoReport] = useState(false);
  const [reportEnviado, setReportEnviado] = useState(false);

  const temNota = nota.trim().length > 0;

  async function salvarNota() {
    setSalvandoNota(true);
    await onSalvarNota(nota);
    setSalvandoNota(false);
    setNotaSalva(true);
    setTimeout(() => setNotaSalva(false), 2200);
  }

  async function enviarReport() {
    if (!motivo) return;
    setEnviandoReport(true);
    const resultado = await reportarQuestaoAction(questionId, motivo, detalhe);
    setEnviandoReport(false);
    if ("error" in resultado) {
      alert(resultado.error);
      return;
    }
    setReportEnviado(true);
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-1">
        <Pill
          ativo={favoritado}
          cor="gold"
          icone={<Star size={14} strokeWidth={2} fill={favoritado ? "currentColor" : "none"} />}
          rotulo={favoritado ? "Favoritada" : "Favoritar"}
          onClick={() => onToggleFavorito()}
        />
        <Pill
          ativo={painel === "nota" || temNota}
          cor="blue"
          icone={<StickyNote size={14} strokeWidth={2} />}
          rotulo={temNota ? "Anotação" : "Anotar"}
          onClick={() => setPainel((p) => (p === "nota" ? null : "nota"))}
        />
        <Pill
          ativo={painel === "report"}
          cor="red"
          icone={<Flag size={14} strokeWidth={2} />}
          rotulo="Reportar"
          onClick={() => setPainel((p) => (p === "report" ? null : "report"))}
        />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {painel === "nota" && (
          <motion.div key="nota" {...painelMotion} className="overflow-hidden">
            <div className="mt-3 rounded-2xl border border-questly-blue/25 bg-questly-blue-light/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <StickyNote size={15} strokeWidth={2} className="text-questly-blue" />
                  Minha anotação
                </span>
                {resolucao && (
                  <button
                    type="button"
                    onClick={() => setNota((prev) => (prev.trim() ? `${prev}\n\n${resolucao}` : resolucao))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Sparkles size={12} strokeWidth={2} /> Usar nossa resolução
                  </button>
                )}
              </div>

              <MathKeyboard
                value={nota}
                onChange={setNota}
                placeholder="Escreva sua anotação. Clique nos símbolos abaixo pra montar fórmulas — não precisa saber LaTeX."
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={salvandoNota}
                  onClick={salvarNota}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-questly-blue px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {salvandoNota ? (
                    "Salvando..."
                  ) : notaSalva ? (
                    <>
                      <Check size={13} strokeWidth={2.5} /> Anotação salva
                    </>
                  ) : (
                    "Salvar anotação"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {painel === "report" && (
          <motion.div key="report" {...painelMotion} className="overflow-hidden">
            <div className="mt-3 rounded-2xl border border-questly-red/25 bg-questly-red-light/40 p-4">
              {reportEnviado ? (
                <div className="flex items-center gap-2.5 py-1 text-sm font-medium text-questly-green-dark">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-questly-green-light">
                    <Check size={16} strokeWidth={2.5} className="text-questly-green" />
                  </span>
                  Obrigado! Nosso time vai revisar essa questão.
                </div>
              ) : (
                <>
                  <span className="mb-3 block text-sm font-semibold text-foreground">O que está errado nessa questão?</span>
                  <div className="mb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {MOTIVOS_REPORT.map((m) => {
                      const ativo = motivo === m.valor;
                      return (
                        <button
                          key={m.valor}
                          type="button"
                          onClick={() => setMotivo(m.valor)}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-medium transition-all ${
                            ativo
                              ? "border-questly-red/50 bg-card text-foreground ring-1 ring-questly-red/20"
                              : "border-border bg-card/60 text-muted-foreground hover:border-questly-red/30 hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              ativo ? "border-questly-red bg-questly-red" : "border-border"
                            }`}
                          >
                            {ativo && <Check size={11} strokeWidth={3} className="text-white" />}
                          </span>
                          {m.rotulo}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={detalhe}
                    onChange={(e) => setDetalhe(e.target.value)}
                    rows={2}
                    placeholder="Quer detalhar? (opcional)"
                    className="mb-3 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-questly-red/50 focus:ring-4 focus:ring-questly-red/10"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={enviandoReport || !motivo}
                      onClick={enviarReport}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-questly-red px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {enviandoReport ? "Enviando..." : "Enviar relato"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
