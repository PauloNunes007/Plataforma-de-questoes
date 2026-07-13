"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, CircleCheck, Flag } from "lucide-react";
import { resolverRelatoAdminAction, type RelatoAdmin } from "@/lib/admin/actions";
import { rotuloMotivoReport } from "@/lib/anotacoes/types";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { MathText } from "@/components/questao/math-text";

const COR_MOTIVO: Record<string, string> = {
  questao_errada: "bg-questly-red-light text-questly-red-dark",
  latex_quebrado: "bg-questly-orange-light text-questly-orange-dark",
};

export function RelatosLista({ relatosIniciais }: { relatosIniciais: RelatoAdmin[] }) {
  const [relatos, setRelatos] = useState(relatosIniciais);
  const [resolvendoId, setResolvendoId] = useState<string | null>(null);

  async function resolver(id: string) {
    setResolvendoId(id);
    const resultado = await resolverRelatoAdminAction(id);
    setResolvendoId(null);
    if ("error" in resultado) {
      alert(resultado.error);
      return;
    }
    setRelatos((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-7 sm:px-6 lg:py-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-red-light text-questly-red-dark">
            <Flag size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Relatos de problemas</h1>
            <p className="text-[13px] text-muted-foreground">Reportados pelos alunos direto na tela de questão.</p>
          </div>
        </div>
        <AdminTabs pendentes={relatos.length} />
      </div>

      {relatos.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-questly-green-light text-questly-green">
            <CircleCheck size={24} strokeWidth={1.9} />
          </span>
          <p className="text-sm font-medium">Tudo em dia</p>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
            Nenhum relato pendente. Quando um aluno reportar um problema numa questão, ele aparece aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {relatos.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                className="surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ${
                        COR_MOTIVO[r.motivo] || "bg-questly-purple/12 text-questly-purple"
                      }`}
                    >
                      {rotuloMotivoReport(r.motivo)}
                    </span>
                    <span className="tnum text-[11px] text-muted-foreground">
                      {new Date(r.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={resolvendoId === r.id}
                    onClick={() => resolver(r.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-questly-green px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]"
                  >
                    <Check size={13} strokeWidth={2.5} /> Resolver
                  </button>
                </div>

                <p className="mt-2.5 line-clamp-2 text-[13.5px] font-medium leading-snug">
                  <MathText text={r.enunciado} />
                </p>

                {r.detalhe && (
                  <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    “{r.detalhe}”
                  </p>
                )}

                <Link
                  href={`/admin/questoes/${r.questionId}`}
                  className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-questly-purple transition-opacity hover:opacity-80"
                >
                  Abrir e corrigir <ArrowUpRight size={13} strokeWidth={2.5} />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
