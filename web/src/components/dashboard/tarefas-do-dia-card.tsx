"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListTodo, Plus, X } from "lucide-react";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import { alternarTarefaAction, criarTarefaAction, excluirTarefaAction } from "@/lib/tarefas/actions";

// Tarefas pontuais que o aluno adiciona pro dia de hoje — sem lógica
// derivada no servidor (CRUD simples), então atualiza o estado local
// direto depois do "ok" da action em vez de refetch.
export function TarefasDoDiaCard({
  tarefasIniciais,
  hoje,
  subjects,
}: {
  tarefasIniciais: TarefaRow[];
  hoje: string;
  subjects: { id: string; nome: string }[];
}) {
  const [tarefas, setTarefas] = useState(tarefasIniciais);
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function adicionar() {
    if (!nome.trim() || salvando || !hoje) return;
    setSalvando(true);
    const { ok, id } = await criarTarefaAction({
      nome,
      descricao: descricao || null,
      subjectId: subjectId || null,
      data: hoje,
    });
    if (ok && id) {
      const subjectNome = subjects.find((s) => s.id === subjectId)?.nome || null;
      setTarefas((prev) => [
        ...prev,
        {
          id,
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          data: hoje,
          concluida: false,
          subjectId: subjectId || null,
          subjectNome,
        },
      ]);
      setNome("");
      setDescricao("");
      setSubjectId("");
      setFormAberto(false);
    }
    setSalvando(false);
  }

  async function alternar(id: string, concluidaAtual: boolean) {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, concluida: !concluidaAtual } : t)));
    await alternarTarefaAction(id, !concluidaAtual);
  }

  async function remover(id: string) {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
    await excluirTarefaAction(id);
  }

  return (
    <div className="surface flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13.5px] font-semibold tracking-tight">Tarefas do dia</span>
        <button
          type="button"
          onClick={() => setFormAberto((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-questly-green text-white transition-transform active:scale-95 dark:text-[#0c1512]"
        >
          {formAberto ? <X size={15} strokeWidth={2.25} /> : <Plus size={15} strokeWidth={2.25} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {formAberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mb-3 flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da tarefa"
                className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-questly-green"
              />
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-questly-green"
              >
                <option value="">Sem disciplina</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-questly-green"
              />
              <button
                type="button"
                onClick={adicionar}
                disabled={!nome.trim() || salvando}
                className="mt-1 rounded-lg bg-questly-green px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50 dark:text-[#0c1512]"
              >
                {salvando ? "Salvando..." : "Adicionar tarefa"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tarefas.length === 0 && !formAberto ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-questly-purple/10">
            <ListTodo size={20} strokeWidth={1.75} className="text-questly-purple" />
          </span>
          <p className="mb-1 text-[13px] font-medium">Adicione tarefas ao seu dia</p>
          <p className="mb-4 max-w-[220px] text-xs text-muted-foreground">
            Organize o que você quer estudar hoje, além da missão gerada.
          </p>
          <button
            type="button"
            onClick={() => setFormAberto(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-4 py-2 text-[13px] font-medium text-white dark:text-[#0c1512]"
          >
            <Plus size={14} strokeWidth={2.25} />
            Começar
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {tarefas.map((t) => (
            <li key={t.id} className="group flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-muted/60">
              <button
                type="button"
                onClick={() => alternar(t.id, t.concluida)}
                className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  t.concluida ? "border-questly-green bg-questly-green text-white" : "border-border"
                }`}
              >
                {t.concluida && <Check size={11} strokeWidth={3} />}
              </button>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] font-medium ${
                    t.concluida ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {t.nome}
                </span>
                {(t.subjectNome || t.descricao) && (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {[t.subjectNome, t.descricao].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => remover(t.id)}
                className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-questly-red-dark group-hover:opacity-100"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
