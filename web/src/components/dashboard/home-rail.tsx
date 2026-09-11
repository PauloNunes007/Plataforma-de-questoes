"use client";

// Trilho lateral da home: troca a VISÃO da própria página (não navega).
//
// Por que um trilho e não abas: as três visões não são irmãs de mesmo peso —
// "Global" é onde o aluno passa 90% do tempo, e Desempenho/Conquistas são
// consultas ocasionais. Um trilho fixo à esquerda deixa Global sempre em
// primeiro plano e as outras a um clique, sem roubar a dobra do conteúdo.
//
// O botão "Carta" fica SEPARADO do grupo de visões, acima e com moldura
// própria: ele não troca de visão, abre a carta do aluno por cima da tela.
// Misturar os dois no mesmo grupo faria o estado "ativo" mentir.
//
// No mobile o trilho vira uma fita horizontal rolável no topo do conteúdo —
// trilho vertical em 375px come metade da largura útil.

import { motion, useReducedMotion } from "framer-motion";
import { Globe2, IdCard, LineChart, Medal } from "lucide-react";

export type VisaoHome = "global" | "desempenho" | "conquistas";

const VISOES: { id: VisaoHome; rotulo: string; icone: React.ReactNode }[] = [
  { id: "global", rotulo: "Global", icone: <Globe2 size={20} strokeWidth={1.9} /> },
  { id: "desempenho", rotulo: "Desempenho", icone: <LineChart size={20} strokeWidth={1.9} /> },
  { id: "conquistas", rotulo: "Conquistas", icone: <Medal size={20} strokeWidth={1.9} /> },
];

export function HomeRail({
  visao,
  onVisao,
  onAbrirCarta,
}: {
  visao: VisaoHome;
  onVisao: (v: VisaoHome) => void;
  onAbrirCarta: () => void;
}) {
  const semMovimento = useReducedMotion();

  return (
    <nav
      aria-label="Visões da home"
      className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:w-[92px] lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {/* Carta — ação, não visão */}
      <button
        type="button"
        onClick={onAbrirCarta}
        className="surface-interativa flex h-[60px] min-w-[104px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl px-3 lg:h-auto lg:min-w-0 lg:flex-col lg:gap-1.5 lg:py-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-questly-purple to-questly-blue text-white shadow-sm">
          <IdCard size={17} strokeWidth={2.1} />
        </span>
        <span className="text-[11.5px] font-bold tracking-tight">Carta</span>
      </button>

      <div
        role="tablist"
        aria-orientation="vertical"
        className="surface flex shrink-0 gap-1 rounded-2xl p-1.5 lg:flex-col"
      >
        {VISOES.map((v) => {
          const ativo = v.id === visao;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => onVisao(v.id)}
              className={`relative flex h-[68px] min-w-[86px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors lg:min-w-0 lg:px-1 ${
                ativo
                  ? "text-questly-green-dark dark:text-questly-green"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ativo && (
                <motion.span
                  layoutId={semMovimento ? undefined : "visao-home-ativa"}
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-questly-green-light ring-1 ring-questly-green/25"
                  transition={{ type: "spring", stiffness: 460, damping: 38 }}
                />
              )}
              <span className="relative">{v.icone}</span>
              <span className="relative text-[10.5px] font-bold leading-tight tracking-tight">
                {v.rotulo}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
