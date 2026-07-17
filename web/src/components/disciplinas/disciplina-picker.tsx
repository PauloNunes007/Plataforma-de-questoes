"use client";

import { motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Check,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  MessageCircle,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type { DisciplinaPratica } from "@/lib/disciplinas/disciplinas-data";

// Mesmos tiles sólidos vibrantes do grid de "Listas de Questões"
// (components/questoes/disciplina-navegar-grid.tsx) — pedido explícito do
// usuário pra bater visualmente com aquela página (CORES/iconePorNome
// duplicados de propósito, mesma convenção do resto do repo).
const CORES: [string, string][] = [
  ["#5b7cf0", "#3a52c4"], // azul
  ["#f0555a", "#c93338"], // vermelho
  ["#3fbf78", "#279357"], // verde
  ["#9b6ff0", "#7443d6"], // roxo
  ["#c07a3a", "#96591f"], // marrom
  ["#f0a23f", "#d67c1a"], // laranja
  ["#2fb6c9", "#1a8c9c"], // teal
  ["#4a4f5c", "#2c2f38"], // grafite
];

const ICONES: [RegExp, LucideIcon][] = [
  [/matemátic|cálculo|algebr/i, Calculator],
  [/física/i, Atom],
  [/bio/i, Dna],
  [/quí?mic/i, FlaskConical],
  [/geografi/i, Globe],
  [/históri/i, Landmark],
  [/portugu|linguage|literatur|redaç/i, MessageCircle],
  [/filosofi|sociologi|human/i, Brain],
];

function iconePorNome(nome: string): LucideIcon {
  const achado = ICONES.find(([re]) => re.test(nome));
  return achado ? achado[1] : BookOpen;
}

export function DisciplinaPicker({
  disciplinas,
  selecionada,
  onSelecionar,
}: {
  disciplinas: DisciplinaPratica[];
  selecionada: string | null;
  onSelecionar: (materiaId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {disciplinas.map((d, i) => {
        const ativa = d.materiaId === selecionada;
        const [corA, corB] = CORES[i % CORES.length];
        const Icone = iconePorNome(d.nome);
        return (
          <motion.button
            key={d.materiaId}
            type="button"
            onClick={() => onSelecionar(d.materiaId)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
            className={`group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl p-3 text-center shadow-md shadow-black/10 transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:shadow-lg ${
              ativa ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""
            }`}
            style={{ background: `radial-gradient(circle at 50% 40%, ${corA}, ${corB})` }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 transition-[box-shadow] group-hover:ring-white/25" />
            {ativa && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-questly-green shadow-sm">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
            {!d.matriculada && (
              <span className="absolute top-2 left-2 rounded-full bg-black/25 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
                Descobrir
              </span>
            )}
            <Icone size={30} strokeWidth={1.6} className="mb-2 text-white/90" />
            <span className="line-clamp-2 text-[13px] font-bold leading-tight text-white">
              {d.nome}
            </span>
            <span className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-white/75">
              {d.bossNome ? (
                <>
                  <Swords size={10} strokeWidth={2} className="shrink-0" />
                  <span className="tnum truncate">{d.diasAteProva}d</span>
                </>
              ) : d.matriculada ? (
                "Sem prova"
              ) : (
                "Não cadastrada"
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
