"use client";

import { motion } from "framer-motion";
import { ArrowRight, MousePointerClick } from "lucide-react";
import type { PreviaPratica } from "@/lib/disciplinas/actions";

export function ResumoPratica({
  disciplinaNome,
  topicosLabel,
  dificuldadeLabel,
  quantidadeLabel,
  previa,
  carregandoPrevia,
  podeComecar,
  iniciando,
  onComecar,
}: {
  disciplinaNome: string | null;
  topicosLabel: string;
  dificuldadeLabel: string;
  quantidadeLabel: string;
  previa: PreviaPratica | null;
  carregandoPrevia: boolean;
  podeComecar: boolean;
  iniciando: boolean;
  onComecar: () => void;
}) {
  if (!disciplinaNome) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center xl:sticky xl:top-8">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <MousePointerClick size={18} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="text-sm text-muted-foreground">Escolha uma disciplina pra montar sua prática.</p>
      </div>
    );
  }

  return (
    <div className="surface-brand rounded-2xl p-5 xl:sticky xl:top-8">
      <span className="kicker mb-1 block text-questly-green">Missão avulsa</span>
      <h3 className="mb-4 text-[15px] font-semibold tracking-tight">Resumo da prática</h3>

      <dl className="mb-4 flex flex-col gap-2.5 text-[13px]">
        <Linha rotulo="Disciplina" valor={disciplinaNome} />
        <Linha rotulo="Tópicos" valor={topicosLabel} />
        <Linha rotulo="Dificuldade" valor={dificuldadeLabel} />
        <Linha rotulo="Quantidade" valor={quantidadeLabel} />
      </dl>

      <div className="mb-4 rounded-xl bg-muted/60 p-4">
        {carregandoPrevia ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-28 animate-pulse rounded-md bg-muted-foreground/15" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-muted-foreground/15" />
          </div>
        ) : previa && previa.total > 0 ? (
          <motion.div
            key={`${previa.total}-${previa.xpEstimado}`}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1 text-center"
          >
            <span className="tnum font-heading text-lg font-semibold tracking-tight">
              {previa.total} questão{previa.total === 1 ? "" : "ões"} disponí{previa.total === 1 ? "vel" : "veis"}
            </span>
            <span className="tnum text-xs font-medium text-questly-gold-dark">
              +{previa.xpEstimado} XP em jogo
            </span>
            {previa.tempoEstimadoMin != null && (
              <span className="tnum text-[11px] text-muted-foreground">
                ~{previa.tempoEstimadoMin} min estimados
              </span>
            )}
          </motion.div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Nenhuma questão encontrada com esse filtro.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onComecar}
        disabled={!podeComecar || iniciando}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-green px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:text-[#0c1512]"
      >
        {iniciando ? "Preparando..." : "Começar prática"}
        {!iniciando && <ArrowRight size={15} strokeWidth={2} />}
      </button>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
        Cria uma missão avulsa em segundo plano — não ocupa a sua missão do dia, é treino extra e
        conta XP e cobertura do Boss do mesmo jeito.
      </p>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
      <dd className="truncate text-right font-medium text-foreground">{valor}</dd>
    </div>
  );
}
