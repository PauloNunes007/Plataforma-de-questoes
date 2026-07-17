"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type { DisciplinaPratica } from "@/lib/disciplinas/disciplinas-data";

// Tiles sólidos vibrantes (grid "LISTAS DE X") — pedido explícito do
// usuário pra bater com o print de referência, em vez do padrão de linha
// discreta do DisciplinaPicker/MapaMundi.
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

export function DisciplinaNavegarGrid({ disciplinas }: { disciplinas: DisciplinaPratica[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {disciplinas.map((d, i) => {
        const [corA, corB] = CORES[i % CORES.length];
        const Icone = iconePorNome(d.nome);
        return (
          <motion.div
            key={d.materiaId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={`/questoes/listas/${d.materiaId}`}
              className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl p-3 text-center shadow-md shadow-black/10 transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:shadow-lg active:scale-[0.97]"
              style={{ background: `radial-gradient(circle at 50% 40%, ${corA}, ${corB})` }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 transition-[box-shadow] group-hover:ring-white/25" />
              {/* Matéria com questões que o aluno ainda não adicionou como
                  disciplina — sinaliza que é descoberta, não uma das suas. */}
              {!d.matriculada && (
                <span className="absolute top-2 left-2 rounded-full bg-black/25 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
                  Descobrir
                </span>
              )}
              <Icone size={34} strokeWidth={1.6} className="mb-3 text-white/90" />
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/75">
                Listas de
              </span>
              <span className="mt-0.5 line-clamp-2 text-[13.5px] font-bold leading-tight text-white">
                {d.nome}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
