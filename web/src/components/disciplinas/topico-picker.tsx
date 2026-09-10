"use client";

import { Check, FileText, Target } from "lucide-react";
import type { TopicoPratica } from "@/lib/disciplinas/disciplinas-data";
import { contagemQuestoes } from "@/lib/questly/shared";

type Tier = { cor: string; texto: string; label: string };

function tierDoTopico(t: TopicoPratica): Tier {
  if (t.taxaAcerto == null) {
    return {
      cor: "bg-muted-foreground/30",
      texto: "text-muted-foreground",
      label: "Ainda sem dados seus nesse tópico",
    };
  }
  const pct = Math.round(t.taxaAcerto * 100);
  if (t.taxaAcerto < 0.6) {
    return { cor: "bg-questly-red", texto: "text-questly-red-dark", label: `Seu aproveitamento: ${pct}% — ponto fraco` };
  }
  if (t.taxaAcerto < 0.85) {
    return { cor: "bg-questly-orange", texto: "text-questly-orange-dark", label: `Seu aproveitamento: ${pct}%` };
  }
  return { cor: "bg-questly-green", texto: "text-questly-green-dark", label: `Seu aproveitamento: ${pct}% — forte` };
}

export function TopicoPicker({
  topicos,
  selecionados,
  onToggle,
  onSelecionarTodos,
  onLimpar,
  onFocarFracos,
}: {
  topicos: TopicoPratica[];
  selecionados: Set<string>;
  onToggle: (id: string) => void;
  onSelecionarTodos: () => void;
  onLimpar: () => void;
  onFocarFracos: () => void;
}) {
  const temFracos = topicos.some((t) => t.taxaAcerto != null && t.taxaAcerto < 0.6);

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <BotaoFiltro onClick={onSelecionarTodos}>Selecionar todos</BotaoFiltro>
        <BotaoFiltro onClick={onLimpar}>Limpar seleção</BotaoFiltro>
        {temFracos && (
          <button
            type="button"
            onClick={onFocarFracos}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-questly-red-light px-3 py-1.5 text-xs font-medium text-questly-red-dark transition-[filter] hover:brightness-95"
          >
            <Target size={12} strokeWidth={2} />
            Focar nos pontos fracos
          </button>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {selecionados.size === 0
            ? "nenhum marcado = disciplina toda"
            : `${selecionados.size} ${selecionados.size === 1 ? "marcado" : "marcados"}`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {topicos.map((t) => {
          const ativo = selecionados.has(t.id);
          const tier = tierDoTopico(t);
          const pct = t.taxaAcerto == null ? null : Math.round(t.taxaAcerto * 100);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              title={`${tier.label} · ${contagemQuestoes(t.totalQuestoes)} no banco`}
              aria-pressed={ativo}
              className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                ativo
                  ? "border-questly-green/50 bg-questly-green-light/60"
                  : "border-border bg-card hover:border-foreground/15 hover:bg-muted/40"
              }`}
            >
              {/* caixa de marcação — sem ela não dava pra saber o que está
                  selecionado sem comparar cores de fundo */}
              <span
                className={`mt-px flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  ativo
                    ? "border-questly-green bg-questly-green text-white"
                    : "border-border bg-background group-hover:border-foreground/25"
                }`}
              >
                {ativo && <Check size={11} strokeWidth={3.25} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-medium leading-snug tracking-tight">{t.nome}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FileText size={10} strokeWidth={1.9} />
                    <span className="tnum">{t.totalQuestoes}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${tier.cor}`} />
                    {pct == null ? (
                      "sem dados ainda"
                    ) : (
                      <>
                        <span className={`tnum font-semibold ${tier.texto}`}>{pct}%</span> de acerto
                      </>
                    )}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BotaoFiltro({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
