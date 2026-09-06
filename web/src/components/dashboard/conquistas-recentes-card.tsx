"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { HeroDados } from "@/lib/dashboard/hero-data";
import { Insignia } from "@/components/insignias/insignia";

// "Conquistas recentes": número grande de conquistas + fileira de brasões.
// Vem de hero.conquistasLista (derivado de calcularDistintivos — sem tabela
// nova). O ladrilho hexagonal com gradiente por posição saiu: cada insígnia
// já traz a própria moldura hexagonal no metal da conquista, então o
// gradiente rotativo só brigava com o material do brasão.
export function ConquistasRecentesCard({ hero }: { hero: HeroDados }) {
  const lista = hero.conquistasLista;

  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={17} strokeWidth={1.9} className="text-questly-gold" />
        <h3 className="font-heading text-[15px] font-semibold tracking-tight">Conquistas recentes</h3>
      </div>

      {lista.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <Insignia nome="estrela" tom="ouro" size={44} apagada className="shrink-0" />
          <p className="text-sm text-muted-foreground">
            Suas conquistas aparecem aqui conforme você evolui — resolva questões e mantenha o
            streak pra acender o primeiro brasão.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Contador grande à esquerda (estilo print) */}
          <div className="flex shrink-0 flex-col items-center">
            <span className="font-heading text-4xl font-bold text-questly-gold">{hero.conquistas}</span>
            <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">totais</span>
          </div>
          {/* Fileira rolável de distintivos */}
          <div className="-mx-1 flex flex-1 gap-3 overflow-x-auto px-1 pb-1">
            {lista.map((c, i) => (
              <motion.div
                key={c.nome}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: Math.min(i * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                className="flex w-[68px] shrink-0 flex-col items-center gap-1"
                title={c.nome}
              >
                <Insignia nome={c.insignia} tom={c.tom} size={52} titulo={c.nome} className="drop-shadow-md" />
                <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-muted-foreground">
                  {c.nome}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
