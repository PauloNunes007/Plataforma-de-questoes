"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CreditCard, Crown, Check, Loader2 } from "lucide-react";
import {
  ativarAssinaturaAdminAction,
  revogarProAdminAction,
  type AssinaturaAdmin,
} from "@/lib/admin/actions";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { reais } from "@/lib/plano/plano";

function rotuloPlano(a: AssinaturaAdmin): string {
  if (a.ciclo === "mensal") return "Mensal · recorrente";
  if (a.forma === "a_vista") return "Semestral · à vista (6 meses)";
  return "Semestral · R$/mês (fidelidade 6 meses)";
}

const STATUS_COR: Record<string, string> = {
  pendente: "bg-questly-orange-light text-questly-orange-dark",
  ativa: "bg-questly-green-light text-questly-green-dark",
  cancelada: "bg-muted text-muted-foreground",
  expirada: "bg-muted text-muted-foreground",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function AssinaturasLista({ assinaturasIniciais }: { assinaturasIniciais: AssinaturaAdmin[] }) {
  const [assinaturas, setAssinaturas] = useState(assinaturasIniciais);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const pendentes = assinaturas.filter((a) => a.status === "pendente").length;

  async function ativar(a: AssinaturaAdmin) {
    setProcessandoId(a.id);
    const res = await ativarAssinaturaAdminAction(a.id);
    setProcessandoId(null);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    setAssinaturas((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, status: "ativa", ativadaEm: new Date().toISOString() } : x)),
    );
  }

  async function revogar(a: AssinaturaAdmin) {
    if (!confirm(`Revogar o Pro de ${a.nome}?`)) return;
    setProcessandoId(a.id);
    const res = await revogarProAdminAction(a.userId);
    setProcessandoId(null);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    setAssinaturas((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "cancelada" } : x)));
  }

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-7 sm:px-6 lg:py-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-gold/15 text-questly-gold">
            <CreditCard size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Assinaturas Pro</h1>
            <p className="text-[13px] text-muted-foreground">
              Confirme o pagamento (Pix) pra ativar o Pro do aluno.
            </p>
          </div>
        </div>
        <AdminTabs assinaturasPendentes={pendentes} />
      </div>

      {assinaturas.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Crown size={24} strokeWidth={1.9} />
          </span>
          <p className="text-sm font-medium">Nenhuma assinatura ainda</p>
          <p className="max-w-[300px] text-[13px] leading-relaxed text-muted-foreground">
            Quando um aluno pedir o Pro na tela de planos, o pedido aparece aqui pra você confirmar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {assinaturas.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold">{a.nome}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        STATUS_COR[a.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {rotuloPlano(a)} · <span className="tnum font-medium">{reais(a.valorCentavos)}</span>
                    {a.forma === "recorrente" ? "/mês" : ""} · pedido em {fmt(a.criadaEm)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {a.status === "pendente" ? (
                    <button
                      type="button"
                      disabled={processandoId === a.id}
                      onClick={() => ativar(a)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-questly-green px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]"
                    >
                      {processandoId === a.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <BadgeCheck size={14} strokeWidth={2.25} />
                      )}
                      Ativar Pro
                    </button>
                  ) : a.status === "ativa" ? (
                    <button
                      type="button"
                      disabled={processandoId === a.id}
                      onClick={() => revogar(a)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-questly-red disabled:opacity-50"
                    >
                      {processandoId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Revogar
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
