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

import { motion, useReducedMotion } from "framer-motion";
import { Lock, Medal } from "lucide-react";
import { Insignia } from "@/components/insignias/insignia";
import type { Distintivo } from "@/lib/ranking/badges";

export function ConquistasView({ distintivos }: { distintivos: Distintivo[] }) {
  const semMovimento = useReducedMotion();
  const conquistados = distintivos.filter((d) => d.conquistado);
  const pendentes = distintivos.filter((d) => !d.conquistado);
  const pct = distintivos.length > 0 ? Math.round((conquistados.length / distintivos.length) * 100) : 0;

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
        <Grupo titulo="Conquistados" distintivos={conquistados} semMovimento={Boolean(semMovimento)} />
      )}
      {pendentes.length > 0 && (
        <Grupo titulo="Ainda por acender" distintivos={pendentes} semMovimento={Boolean(semMovimento)} />
      )}
    </div>
  );
}

function Grupo({
  titulo,
  distintivos,
  semMovimento,
}: {
  titulo: string;
  distintivos: Distintivo[];
  semMovimento: boolean;
}) {
  return (
    <section className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-[15px] font-semibold tracking-tight">{titulo}</h2>
        <span className="tnum text-[12px] font-semibold text-muted-foreground">{distintivos.length}</span>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {distintivos.map((d, i) => (
          <motion.li
            key={d.id}
            initial={semMovimento ? false : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.35), ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center ${
              d.conquistado
                ? "border-questly-gold/30 bg-questly-gold-light/40"
                : "border-border bg-background/60"
            }`}
          >
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
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
