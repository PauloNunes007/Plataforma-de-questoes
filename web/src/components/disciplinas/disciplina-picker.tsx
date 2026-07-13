"use client";

import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import type { DisciplinaPratica } from "@/lib/disciplinas/disciplinas-data";

// Mesma rotação de cores de acento usada na Trilha/Dashboard — cada
// disciplina tem "sua" cor, mas em card sóbrio (redesign 2026-07).
const CORES = [
  "var(--questly-blue)",
  "var(--questly-purple)",
  "var(--questly-orange)",
  "var(--questly-green)",
  "var(--questly-gold)",
  "var(--questly-red)",
];

export function DisciplinaPicker({
  disciplinas,
  selecionada,
  onSelecionar,
}: {
  disciplinas: DisciplinaPratica[];
  selecionada: string | null;
  onSelecionar: (subjectId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {disciplinas.map((d, i) => {
        const ativa = d.subjectId === selecionada;
        const cor = CORES[i % CORES.length];
        return (
          <motion.button
            key={d.subjectId}
            type="button"
            onClick={() => onSelecionar(d.subjectId)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileTap={{ scale: 0.99 }}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
              ativa ? "bg-muted/40" : "border-border hover:border-foreground/15"
            }`}
            style={ativa ? { borderColor: `color-mix(in oklab, ${cor} 55%, transparent)` } : undefined}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold"
              style={{ color: cor, background: `color-mix(in oklab, ${cor} 12%, transparent)` }}
            >
              {d.nome.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <b className="block truncate text-[13.5px] font-semibold leading-tight tracking-tight">
                {d.nome}
              </b>
              <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted-foreground">
                {d.bossNome ? (
                  <>
                    <Swords size={11} strokeWidth={1.75} className="shrink-0 text-questly-orange" />
                    <span className="tnum truncate">
                      {d.bossNome} · {d.diasAteProva}d
                    </span>
                  </>
                ) : (
                  "Sem prova marcada"
                )}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
