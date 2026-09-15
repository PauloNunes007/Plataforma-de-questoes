"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CreditCard, Check, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import {
  ativarAssinaturaAdminAction,
  conferirAssinaturaAdminAction,
  revogarProAdminAction,
  type AssinaturaAdmin,
} from "@/lib/admin/actions";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { reais } from "@/lib/plano/plano";
import { ProMark } from "@/components/plano/pro-ui";

export type DiagnosticoPagamento = {
  tokenMP: boolean;
  segredoWebhook: boolean;
  urlApp: string | null;
  webhookUrl: string | null;
};

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

export function AssinaturasLista({
  assinaturasIniciais,
  diagnostico,
}: {
  assinaturasIniciais: AssinaturaAdmin[];
  diagnostico: DiagnosticoPagamento | null;
}) {
  const [assinaturas, setAssinaturas] = useState(assinaturasIniciais);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [recado, setRecado] = useState<{ id: string; texto: string } | null>(null);

  const pendentes = assinaturas.filter((a) => a.status === "pendente").length;

  function marcarAtiva(id: string) {
    setAssinaturas((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "ativa", ativadaEm: new Date().toISOString() } : x)),
    );
  }

  // Caminho recomendado: pergunta pro Mercado Pago em vez de acreditar no
  // pedido. Só ativa se o MP disser "approved".
  async function conferir(a: AssinaturaAdmin) {
    setProcessandoId(a.id);
    setRecado(null);
    const res = await conferirAssinaturaAdminAction(a.id);
    setProcessandoId(null);
    if ("error" in res) {
      setRecado({ id: a.id, texto: res.error });
      return;
    }
    if (res.estado === "ativada") {
      marcarAtiva(a.id);
      return;
    }
    setRecado({
      id: a.id,
      texto:
        res.estado === "sem_pagamento"
          ? "O Mercado Pago não tem nenhum pagamento pra este pedido — o aluno abriu o checkout e não concluiu."
          : res.estado === "em_andamento"
            ? `O Mercado Pago ainda está processando (${res.status}). Quando aprovar, o Pro entra sozinho.`
            : `O pagamento não foi concluído (${res.status}).`,
    });
  }

  async function ativar(a: AssinaturaAdmin) {
    if (
      !confirm(
        `Ativar o Pro de ${a.nome} SEM confirmação do Mercado Pago?\n\nUse isto só se você recebeu o pagamento por fora. O caminho normal é "Conferir no MP".`,
      )
    )
      return;
    setProcessandoId(a.id);
    const res = await ativarAssinaturaAdminAction(a.id, "Ativação manual do admin");
    setProcessandoId(null);
    if ("error" in res) {
      setRecado({ id: a.id, texto: res.error });
      return;
    }
    marcarAtiva(a.id);
  }

  async function revogar(a: AssinaturaAdmin) {
    if (!confirm(`Revogar o Pro de ${a.nome}?`)) return;
    setProcessandoId(a.id);
    const res = await revogarProAdminAction(a.userId);
    setProcessandoId(null);
    if ("error" in res) {
      setRecado({ id: a.id, texto: res.error });
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
              O Pro é liberado sozinho quando o Mercado Pago aprova. Esta tela é só acompanhamento.
            </p>
          </div>
        </div>
        <AdminTabs assinaturasPendentes={pendentes} />
      </div>

      <DiagnosticoCard diagnostico={diagnostico} />

      {assinaturas.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ProMark size={24} strokeWidth={1.9} />
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
                  {recado?.id === a.id && (
                    <p className="mt-2 rounded-lg bg-questly-orange-light px-2.5 py-1.5 text-[12px] leading-snug text-questly-orange-dark">
                      {recado.texto}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {a.status === "pendente" ? (
                    <>
                      <button
                        type="button"
                        disabled={processandoId === a.id}
                        onClick={() => conferir(a)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-questly-green px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]"
                      >
                        {processandoId === a.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} strokeWidth={2.25} />
                        )}
                        Conferir no MP
                      </button>
                      <button
                        type="button"
                        disabled={processandoId === a.id}
                        onClick={() => ativar(a)}
                        title="Ativar sem confirmação do Mercado Pago (só pra pagamento recebido por fora)"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        <BadgeCheck size={13} strokeWidth={2.25} />
                        Ativar à mão
                      </button>
                    </>
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

// Painel de saúde do gateway. Existe porque a falha típica de pagamento não
// aparece aqui como erro — aparece como aluno reclamando que pagou e não
// liberou, enquanto a tela mostra um "pendente" silencioso. Com isto dá pra
// distinguir em 2 segundos "env faltando no deploy" de "o aluno não concluiu".
function DiagnosticoCard({ diagnostico }: { diagnostico: DiagnosticoPagamento | null }) {
  if (!diagnostico) return null;

  const tudoCerto = diagnostico.tokenMP && !!diagnostico.webhookUrl;
  if (tudoCerto && diagnostico.segredoWebhook) return null;

  const problemas: string[] = [];
  if (!diagnostico.tokenMP) {
    problemas.push(
      "MP_ACCESS_TOKEN não está configurado — a tela de planos cai no fluxo manual e ninguém consegue pagar online.",
    );
  }
  if (!diagnostico.urlApp) {
    problemas.push("NEXT_PUBLIC_APP_URL não está configurada — o aluno não volta do checkout pro app.");
  } else if (!diagnostico.webhookUrl) {
    problemas.push(
      `NEXT_PUBLIC_APP_URL (${diagnostico.urlApp}) não é https — o Mercado Pago não consegue avisar o webhook. A liberação ainda funciona pela conferência da tela /pro, mas só quando o aluno volta ao app.`,
    );
  }
  if (!diagnostico.segredoWebhook) {
    problemas.push(
      "MP_WEBHOOK_SECRET não está configurado — a liberação continua funcionando (o status vem da API do MP), mas sem a validação de origem das notificações.",
    );
  }

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-questly-orange/30 bg-questly-orange-light/60 px-4 py-3.5">
      <span className="mt-0.5 shrink-0 text-questly-orange-dark">
        <TriangleAlert size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-questly-orange-dark">
          Pagamento automático incompleto neste deploy
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {problemas.map((p) => (
            <li key={p} className="text-[12.5px] leading-relaxed text-questly-orange-dark/90">
              • {p}
            </li>
          ))}
        </ul>
        {diagnostico.webhookUrl && (
          <p className="mt-2 break-all text-[11.5px] text-questly-orange-dark/80">
            URL do webhook a cadastrar no Mercado Pago:{" "}
            <code className="font-mono">{diagnostico.webhookUrl}</code>
          </p>
        )}
      </div>
    </div>
  );
}
