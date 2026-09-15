"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Plus, Ticket, X } from "lucide-react";
import {
  alternarCupomAdminAction,
  criarCupomAdminAction,
  type CupomAdmin,
} from "@/lib/admin/actions";
import { AdminTabs } from "@/components/admin/admin-tabs";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function expirado(iso: string | null): boolean {
  return !!iso && new Date(iso).getTime() < Date.now();
}

export function CuponsLista({ cuponsIniciais }: { cuponsIniciais: CupomAdmin[] }) {
  const [cupons, setCupons] = useState(cuponsIniciais);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(cuponsIniciais.length === 0);

  async function alternar(c: CupomAdmin) {
    setProcessandoId(c.id);
    const res = await alternarCupomAdminAction(c.id, !c.ativo);
    setProcessandoId(null);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    setCupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, ativo: !x.ativo } : x)));
  }

  function onCriado(novo: CupomAdmin) {
    setCupons((prev) => [novo, ...prev]);
    setMostrarForm(false);
  }

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-7 sm:px-6 lg:py-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-purple/12 text-questly-purple">
            <Ticket size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Cupons de Pro</h1>
            <p className="text-[13px] text-muted-foreground">
              Códigos que liberam o Pro grátis por um número de dias, sem passar pelo Mercado Pago.
            </p>
          </div>
        </div>
        <AdminTabs />
      </div>

      {mostrarForm ? (
        <FormNovoCupom onCriado={onCriado} onCancelar={() => setMostrarForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg bg-questly-purple px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={2.4} />
          Novo cupom
        </button>
      )}

      {cupons.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Ticket size={22} strokeWidth={1.9} />
          </span>
          <p className="text-sm font-medium">Nenhum cupom ainda</p>
          <p className="max-w-[300px] text-[13px] leading-relaxed text-muted-foreground">
            Crie um código acima — quem digitar ele em /pro ganha Pro grátis na hora.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {cupons.map((c) => {
              const venceu = expirado(c.expiraEm);
              const esgotado = c.limiteUsos !== null && c.usos >= c.limiteUsos;
              const efetivamenteInativo = !c.ativo || venceu || esgotado;
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-[13px] font-semibold tracking-wide">
                        {c.codigo}
                      </code>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          efetivamenteInativo
                            ? "bg-muted text-muted-foreground"
                            : "bg-questly-green-light text-questly-green-dark"
                        }`}
                      >
                        {!c.ativo ? "desativado" : venceu ? "expirado" : esgotado ? "esgotado" : "ativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      <span className="tnum font-medium">{c.diasPro}</span> dias de Pro ·{" "}
                      <span className="tnum">
                        {c.usos}
                        {c.limiteUsos !== null ? `/${c.limiteUsos}` : ""}
                      </span>{" "}
                      usos
                      {c.expiraEm ? (
                        <>
                          {" "}
                          · expira em <span className="tnum">{fmt(c.expiraEm)}</span>
                        </>
                      ) : null}
                    </p>
                    {c.descricao && <p className="mt-1 text-[12px] text-muted-foreground/80">{c.descricao}</p>}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={processandoId === c.id}
                      onClick={() => alternar(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      {processandoId === c.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : c.ativo ? (
                        <X size={13} strokeWidth={2.25} />
                      ) : (
                        <Check size={13} strokeWidth={2.25} />
                      )}
                      {c.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FormNovoCupom({
  onCriado,
  onCancelar,
}: {
  onCriado: (c: CupomAdmin) => void;
  onCancelar: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [diasPro, setDiasPro] = useState("30");
  const [limiteUsos, setLimiteUsos] = useState("");
  const [expiraEm, setExpiraEm] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    setErro(null);
    const dias = Number.parseInt(diasPro, 10);
    const limite = limiteUsos.trim() ? Number.parseInt(limiteUsos, 10) : null;
    if (!codigo.trim()) {
      setErro("Digite um código.");
      return;
    }
    if (!Number.isFinite(dias) || dias <= 0) {
      setErro("Dias de Pro precisa ser um número maior que zero.");
      return;
    }
    setEnviando(true);
    const res = await criarCupomAdminAction({
      codigo: codigo.trim(),
      diasPro: dias,
      limiteUsos: limite,
      expiraEm: expiraEm ? new Date(expiraEm).toISOString() : null,
      descricao: descricao.trim() || null,
    });
    setEnviando(false);
    if ("error" in res) {
      setErro(res.error);
      return;
    }
    onCriado({
      id: crypto.randomUUID(),
      codigo: codigo.trim().toUpperCase(),
      descricao: descricao.trim() || null,
      diasPro: dias,
      limiteUsos: limite,
      usos: 0,
      ativo: true,
      expiraEm: expiraEm ? new Date(expiraEm).toISOString() : null,
      criadoEm: new Date().toISOString(),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface mb-5 flex flex-col gap-3.5 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo label="Código">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="LANCAMENTO2026"
            className="h-9 w-full rounded-lg border border-border bg-card px-2.5 font-mono text-[13px] uppercase tracking-wide outline-none focus:border-questly-purple"
          />
        </Campo>
        <Campo label="Dias de Pro">
          <input
            type="number"
            min={1}
            value={diasPro}
            onChange={(e) => setDiasPro(e.target.value)}
            className="tnum h-9 w-full rounded-lg border border-border bg-card px-2.5 text-[13px] outline-none focus:border-questly-purple"
          />
        </Campo>
        <Campo label="Limite de usos (opcional)">
          <input
            type="number"
            min={1}
            value={limiteUsos}
            onChange={(e) => setLimiteUsos(e.target.value)}
            placeholder="Ilimitado"
            className="tnum h-9 w-full rounded-lg border border-border bg-card px-2.5 text-[13px] outline-none focus:border-questly-purple"
          />
        </Campo>
        <Campo label="Expira em (opcional)">
          <input
            type="date"
            value={expiraEm}
            onChange={(e) => setExpiraEm(e.target.value)}
            className="tnum h-9 w-full rounded-lg border border-border bg-card px-2.5 text-[13px] outline-none focus:border-questly-purple"
          />
        </Campo>
      </div>

      <Campo label="Descrição interna (opcional)">
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: Lançamento campanha UFF"
          className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-[13px] outline-none focus:border-questly-purple"
        />
      </Campo>

      {erro && <p className="text-[12.5px] text-questly-red-dark">{erro}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={criar}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-questly-purple px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {enviando ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} strokeWidth={2.4} />}
          Criar cupom
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="h-9 rounded-lg px-3 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
