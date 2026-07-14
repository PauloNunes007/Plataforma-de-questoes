"use client";

import { FileText, Target } from "lucide-react";
import type { TopicoPratica } from "@/lib/disciplinas/disciplinas-data";

function tierDoTopico(t: TopicoPratica): { cor: string; label: string } {
  if (t.taxaAcerto == null) return { cor: "bg-muted-foreground/30", label: "Ainda sem dados seus nesse tópico" };
  if (t.taxaAcerto < 0.6) return { cor: "bg-questly-red", label: `Seu aproveitamento: ${Math.round(t.taxaAcerto * 100)}% — ponto fraco` };
  if (t.taxaAcerto < 0.85) return { cor: "bg-questly-orange", label: `Seu aproveitamento: ${Math.round(t.taxaAcerto * 100)}%` };
  return { cor: "bg-questly-green", label: `Seu aproveitamento: ${Math.round(t.taxaAcerto * 100)}% — forte` };
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
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-questly-red-light px-3 py-1.5 text-xs font-medium text-questly-red-dark transition-colors hover:brightness-95"
          >
            <Target size={12} strokeWidth={2} />
            Focar nos pontos fracos
          </button>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {selecionados.size === 0 ? "nenhum = todos os tópicos" : `${selecionados.size} selecionado(s)`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {topicos.map((t) => {
          const ativo = selecionados.has(t.id);
          const tier = tierDoTopico(t);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              title={`${tier.label} · ${t.totalQuestoes} questão${t.totalQuestoes === 1 ? "" : "ões"}`}
              aria-pressed={ativo}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                ativo
                  ? "border-questly-green/50 bg-questly-green-light/60"
                  : "border-border bg-card hover:border-foreground/15"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12.5px] font-medium leading-snug tracking-tight">{t.nome}</span>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tier.cor}`} />
              </div>
              <span className="mt-1 flex items-center gap-1 text-[10.5px] text-muted-foreground">
                <FileText size={10} strokeWidth={1.9} />
                <span className="tnum">{t.totalQuestoes}</span>
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
