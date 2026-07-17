"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, CheckCircle2, CircleSlash, Loader2, Play, ShieldCheck } from "lucide-react";
import { treinarRedeAction, type ResultadoTreinoAction } from "@/lib/ml/actions";
import type { MetricasModelo } from "@/lib/ml/treinar";
import { AdminTabs } from "@/components/admin/admin-tabs";

export type ModeloRow = {
  id: string;
  criado_em: string;
  num_exemplos: number;
  venceu_baseline: boolean;
  ativo: boolean;
  motivo: string | null;
  metricas: MetricasModelo | null;
};

export function ModeloMl({ modelos, migracaoPendente }: { modelos: ModeloRow[]; migracaoPendente: boolean }) {
  const router = useRouter();
  const [treinando, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoTreinoAction | null>(null);

  const ativo = modelos.find((m) => m.ativo) ?? null;

  const treinar = () => {
    startTransition(async () => {
      const r = await treinarRedeAction();
      setResultado(r);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[980px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-questly-purple/12 text-questly-purple">
            <Brain size={20} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold">Rede neural de P(acerto)</h1>
            <p className="text-[13px] text-muted-foreground">
              Treina nas tentativas reais e só entra no ar se vencer o baseline BKT na validação temporal.
            </p>
          </div>
        </div>
        <AdminTabs />
      </div>

      {migracaoPendente && (
        <div className="mb-4 rounded-xl border border-questly-orange/40 bg-questly-orange/10 p-4 text-[13px]">
          A tabela <code className="font-mono">ml_modelos</code> ainda não existe — rode{" "}
          <code className="font-mono">supabase_rede_neural.sql</code> no SQL Editor do Supabase antes de treinar.
        </div>
      )}

      {/* Status atual: quem está prevendo hoje */}
      <div className="surface mb-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          {ativo ? (
            <CheckCircle2 className="text-questly-green" size={22} />
          ) : (
            <ShieldCheck className="text-muted-foreground" size={22} />
          )}
          <div>
            <p className="text-sm font-semibold">
              {ativo ? "Rede neural ATIVA nas projeções" : "Projeções rodando no BKT (baseline)"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {ativo
                ? `Modelo de ${new Date(ativo.criado_em).toLocaleString("pt-BR")} · ${ativo.num_exemplos} exemplos`
                : "Nenhum modelo venceu o baseline ainda — o app segue no motor bayesiano, sem regressão."}
            </p>
          </div>
        </div>
        <button
          onClick={treinar}
          disabled={treinando || migracaoPendente}
          className="inline-flex items-center gap-2 rounded-xl bg-questly-purple px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {treinando ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
          {treinando ? "Treinando…" : "Treinar agora"}
        </button>
      </div>

      {resultado && (
        <div
          className={`mb-4 rounded-xl border p-4 text-[13px] ${
            resultado.ok && resultado.venceuBaseline
              ? "border-questly-green/40 bg-questly-green/10"
              : "border-border bg-card"
          }`}
        >
          <p className="font-semibold">{resultado.ok ? "Rodada concluída" : "Falha no treino"}</p>
          <p className="mt-1 text-muted-foreground">{resultado.motivo}</p>
          {resultado.ok && resultado.metricas && <TabelaMetricas m={resultado.metricas} />}
        </div>
      )}

      {/* Histórico de rodadas */}
      <div className="space-y-3">
        {modelos.length === 0 && !migracaoPendente && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma rodada de treino ainda — clique em “Treinar agora”.
          </p>
        )}
        {modelos.map((m) => (
          <div key={m.id} className="surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              {m.ativo ? (
                <span className="rounded-full bg-questly-green/15 px-2.5 py-0.5 text-[11px] font-bold text-questly-green-dark">
                  ATIVO
                </span>
              ) : m.venceu_baseline ? (
                <span className="rounded-full bg-questly-blue/15 px-2.5 py-0.5 text-[11px] font-bold text-questly-blue-dark">
                  venceu (substituído)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                  <CircleSlash size={11} /> não ativado
                </span>
              )}
              <span className="text-[13px] font-semibold">{new Date(m.criado_em).toLocaleString("pt-BR")}</span>
              <span className="text-[12px] text-muted-foreground">· {m.num_exemplos} exemplos</span>
            </div>
            {m.motivo && <p className="mt-2 text-[13px] text-muted-foreground">{m.motivo}</p>}
            {m.metricas && <TabelaMetricas m={m.metricas} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelaMetricas({ m }: { m: MetricasModelo }) {
  const linhas: Array<[string, string, string]> = [
    ["Log-loss (menor = melhor)", m.logLoss.toFixed(4), m.baselineLogLoss.toFixed(4)],
    ["Brier", m.brier.toFixed(4), m.baselineBrier.toFixed(4)],
    ["AUC (maior = melhor)", m.auc?.toFixed(3) ?? "—", m.baselineAuc?.toFixed(3) ?? "—"],
  ];
  return (
    <div className="tnum mt-3 overflow-x-auto">
      <table className="w-full max-w-[560px] text-[12px]">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-1 pr-4 font-medium">Validação temporal ({m.exemplosValidacao} ex.)</th>
            <th className="py-1 pr-4 font-medium">Rede</th>
            <th className="py-1 font-medium">Baseline BKT</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(([nome, rede, base]) => (
            <tr key={nome} className="border-t border-border/60">
              <td className="py-1 pr-4">{nome}</td>
              <td className="py-1 pr-4 font-semibold">{rede}</td>
              <td className="py-1">{base}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
