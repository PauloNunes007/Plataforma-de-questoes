"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ImageIcon, Star, StickyNote } from "lucide-react";
import { PreviewCard } from "@/components/importar/preview-card";
import { QuestaoAcoes } from "@/components/questao/questao-acoes";
import { MathText } from "@/components/questao/math-text";
import { salvarNotaAction, alternarFavoritoAction } from "@/lib/anotacoes/actions";
import { questaoParaItemImportado } from "@/lib/anotacoes/mapear";
import type { ItemFavoritoOuAnotado } from "@/lib/anotacoes/dados";

const CHIP_DIFICULDADE: Record<string, string> = {
  facil: "bg-questly-green-light text-questly-green-dark",
  medio: "bg-questly-orange-light text-questly-orange-dark",
  dificil: "bg-questly-red-light text-questly-red-dark",
};

// Reaproveitada em /questoes/favoritos e /questoes/anotacoes — a única
// diferença real entre as duas é qual ação remove um item da lista visível
// (desfavoritar vs. apagar a anotação), daí o `criterioRemocao`.
export function MinhasQuestoesLista({
  itens,
  agruparPorDisciplina,
  criterioRemocao,
}: {
  itens: ItemFavoritoOuAnotado[];
  agruparPorDisciplina: boolean;
  criterioRemocao: "favorito" | "nota";
}) {
  const [lista, setLista] = useState(itens);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  function toggleAberto(id: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onToggleFavorito(id: string) {
    const resultado = await alternarFavoritoAction(id);
    if ("error" in resultado) return;
    if (criterioRemocao === "favorito" && !resultado.favoritado) {
      setLista((prev) => prev.filter((it) => it.questao.id !== id));
      return;
    }
    setLista((prev) => prev.map((it) => (it.questao.id === id ? { ...it, favoritado: resultado.favoritado } : it)));
  }

  async function onSalvarNota(id: string, texto: string) {
    await salvarNotaAction(id, texto);
    if (criterioRemocao === "nota" && !texto.trim()) {
      setLista((prev) => prev.filter((it) => it.questao.id !== id));
      return;
    }
    setLista((prev) => prev.map((it) => (it.questao.id === id ? { ...it, notaTexto: texto } : it)));
  }

  const grupos = useMemo(() => {
    if (!agruparPorDisciplina) return [{ titulo: null as string | null, itens: lista }];
    const mapa = new Map<string, ItemFavoritoOuAnotado[]>();
    lista.forEach((it) => {
      const chave = `${it.questao.materiaNome || "Sem matéria"} · ${it.questao.topicoNome || "Sem tópico"}`;
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(it);
    });
    return Array.from(mapa.entries()).map(([titulo, grupoItens]) => ({ titulo, itens: grupoItens }));
  }, [lista, agruparPorDisciplina]);

  if (lista.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {criterioRemocao === "favorito" ? <Star size={22} strokeWidth={1.75} /> : <StickyNote size={22} strokeWidth={1.75} />}
        </span>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          {criterioRemocao === "favorito"
            ? "Você ainda não favoritou nenhuma questão. Toque na estrela numa questão pra guardá-la aqui."
            : "Você ainda não anotou nenhuma questão. Suas anotações aparecem aqui, organizadas por disciplina."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {grupos.map((grupo) => (
        <div key={grupo.titulo ?? "todas"}>
          {grupo.titulo && (
            <div className="mb-2.5 flex items-center gap-2">
              <h2 className="text-[13px] font-semibold tracking-tight">{grupo.titulo}</h2>
              <span className="tnum rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                {grupo.itens.length}
              </span>
            </div>
          )}
          <div className="surface divide-y divide-border overflow-hidden">
            {grupo.itens.map(({ questao, notaTexto, favoritado }) => {
              const aberto = abertos.has(questao.id);
              const chipDif = CHIP_DIFICULDADE[questao.dificuldade || ""] || "bg-muted text-muted-foreground";
              return (
                <div key={questao.id}>
                  <button
                    type="button"
                    onClick={() => toggleAberto(questao.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                      {favoritado && <Star size={14} strokeWidth={2} className="text-questly-gold" fill="currentColor" />}
                      {notaTexto && <StickyNote size={14} strokeWidth={2} className="text-questly-blue" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13.5px] font-medium leading-snug">
                        <MathText text={questao.enunciado || "(sem enunciado)"} />
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {questao.dificuldade && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chipDif}`}>
                            {questao.dificuldade}
                          </span>
                        )}
                        {questao.imagem_url && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                            <ImageIcon size={11} strokeWidth={2} /> figura
                          </span>
                        )}
                        {notaTexto && !aberto && (
                          <span className="truncate text-[11px] text-muted-foreground">— {notaTexto.replace(/\$/g, "")}</span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      size={17}
                      strokeWidth={2}
                      className={`mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {aberto && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 340, damping: 34 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3">
                          <QuestaoAcoes
                            questionId={questao.id}
                            resolucao={questao.resolucao}
                            favoritado={favoritado}
                            notaInicial={notaTexto}
                            onToggleFavorito={() => onToggleFavorito(questao.id)}
                            onSalvarNota={(texto) => onSalvarNota(questao.id, texto)}
                          />
                          <PreviewCard item={questaoParaItemImportado(questao)} motivos={[]} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
