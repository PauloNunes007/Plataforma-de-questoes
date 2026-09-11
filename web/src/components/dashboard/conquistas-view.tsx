"use client";

// Visão "Conquistas" da home — a estante de brasões.
//
// Mostra TODOS os distintivos, conquistados e não conquistados: ver o que
// falta é metade da graça de uma estante (e o não-conquistado vem `apagada`,
// com a descrição do requisito por escrito — o estado nunca depende só de a
// insígnia estar colorida ou cinza).
//
// Os brasões vêm de `calcularDistintivos`, derivado de colunas que já existem
// em profiles + nº de disciplinas (ver lib/ranking/badges.ts): nenhuma tabela
// nova, e a mesma lista que o card público do ranking mostra.

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, IdCard, Lock, Medal } from "lucide-react";
import { Insignia } from "@/components/insignias/insignia";
import { MAX_DISTINTIVOS_CARD, type Distintivo } from "@/lib/ranking/badges";
import { salvarDistintivosCardAction } from "@/lib/ranking/actions";

export function ConquistasView({
  distintivos,
  selecionadosIniciais,
}: {
  distintivos: Distintivo[];
  /** o que o aluno já escolheu pro card público, ou null = resumo automático */
  selecionadosIniciais: string[] | null;
}) {
  const semMovimento = useReducedMotion();
  const conquistados = distintivos.filter((d) => d.conquistado);
  const pendentes = distintivos.filter((d) => !d.conquistado);
  const pct = distintivos.length > 0 ? Math.round((conquistados.length / distintivos.length) * 100) : 0;

  // Sem escolha própria ainda: nenhuma vaga marcada aqui (o card usa o
  // resumo automático por baixo) — a estante só passa a refletir uma
  // escolha real depois do primeiro toque.
  const [selecionados, setSelecionados] = useState<string[]>(selecionadosIniciais ?? []);
  const [, iniciarSalvamento] = useTransition();

  function alternar(id: string) {
    setSelecionados((atual) => {
      const proximo = atual.includes(id)
        ? atual.filter((x) => x !== id)
        : atual.length >= MAX_DISTINTIVOS_CARD
          ? atual
          : [...atual, id];
      iniciarSalvamento(() => {
        salvarDistintivosCardAction(proximo);
      });
      return proximo;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho: quantos, de quantos, e a barra */}
      <section className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="flex items-center gap-4">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-questly-gold to-questly-orange-dark text-white shadow-lg shadow-questly-gold/25">
            <Medal size={30} strokeWidth={1.9} />
          </span>
          <div>
            <p className="tnum font-heading text-[34px] font-bold leading-none tracking-tight">
              {conquistados.length}
              <span className="text-[20px] font-semibold text-muted-foreground">
                /{distintivos.length}
              </span>
            </p>
            <p className="mt-1 text-[12.5px] font-medium text-muted-foreground">
              brasões acesos — {pct}% da estante
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-questly-gold to-questly-orange"
              initial={semMovimento ? false : { width: 0 }}
              animate={{ width: `${Math.max(2, pct)}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            {pendentes.length === 0
              ? "Estante completa. Todos os brasões da plataforma são seus."
              : `Faltam ${pendentes.length} — cada um tem o requisito escrito no card.`}
          </p>
        </div>
      </section>

      {conquistados.length > 0 && (
        <section className="surface p-4 sm:p-5">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-1.5 font-heading text-[15px] font-semibold tracking-tight">
              <IdCard size={15} strokeWidth={2.1} className="text-muted-foreground" />
              Conquistados
            </h2>
            <span className="tnum text-[12px] font-semibold text-muted-foreground">
              {selecionados.length}/{MAX_DISTINTIVOS_CARD} no card
            </span>
          </div>
          <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">
            Escolha até {MAX_DISTINTIVOS_CARD} pra aparecer no seu card público (Ranking). Sem escolha,
            mostramos um resumo automático dos mais impressionantes.
          </p>
          <Grupo
            distintivos={conquistados}
            semMovimento={Boolean(semMovimento)}
            selecionados={selecionados}
            onAlternar={alternar}
          />
        </section>
      )}
      {pendentes.length > 0 && (
        <section className="surface p-4 sm:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-[15px] font-semibold tracking-tight">Ainda por acender</h2>
            <span className="tnum text-[12px] font-semibold text-muted-foreground">{pendentes.length}</span>
          </div>
          <Grupo distintivos={pendentes} semMovimento={Boolean(semMovimento)} />
        </section>
      )}
    </div>
  );
}

function Grupo({
  distintivos,
  semMovimento,
  selecionados,
  onAlternar,
}: {
  distintivos: Distintivo[];
  semMovimento: boolean;
  /** presente só no grupo "Conquistados" — habilita o toggle pro card. */
  selecionados?: string[];
  onAlternar?: (id: string) => void;
}) {
  const selecionavel = Boolean(onAlternar);

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {distintivos.map((d, i) => {
        const noCard = selecionados?.includes(d.id) ?? false;
        const cheio = selecionavel && !noCard && (selecionados?.length ?? 0) >= MAX_DISTINTIVOS_CARD;
        return (
          <motion.li
            key={d.id}
            initial={semMovimento ? false : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.35), ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              disabled={!selecionavel || cheio}
              onClick={() => onAlternar?.(d.id)}
              title={selecionavel ? (noCard ? "Tirar do card" : cheio ? `Máximo de ${MAX_DISTINTIVOS_CARD} no card` : "Mostrar no card") : undefined}
              className={`relative flex w-full flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-colors ${
                d.conquistado
                  ? noCard
                    ? "border-questly-green/50 bg-questly-green-light/40"
                    : "border-questly-gold/30 bg-questly-gold-light/40"
                  : "border-border bg-background/60"
              } ${selecionavel && !cheio ? "cursor-pointer hover:border-questly-green/45" : ""} ${
                cheio ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              {noCard && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-questly-green text-white shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <Insignia
                nome={d.insignia}
                tom={d.tom}
                size={62}
                titulo={d.nome}
                apagada={!d.conquistado}
                className={d.conquistado ? "drop-shadow-md" : ""}
              />
              <span className="flex items-center gap-1 text-[12.5px] font-bold leading-tight">
                {!d.conquistado && <Lock size={11} className="shrink-0 text-muted-foreground" />}
                {d.nome}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">{d.descricao}</span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
