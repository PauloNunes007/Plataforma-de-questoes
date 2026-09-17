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
import { corDoCartao, VERNIZ_CARTAO } from "@/lib/questly/paleta-cartoes";

// Tiles sólidos (grid "LISTAS DE X") — pedido explícito do usuário pra
// bater com o print de referência, em vez do padrão de linha discreta do
// DisciplinaPicker/MapaMundi. A cor sai da rampa do design system
// (paleta-cartoes.ts): antes eram hex crus de giz de cera, fixos nos dois
// temas; agora são tokens que respondem ao tema e carregam texto branco
// em AA nos dois.

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
  // Os cartões são quadrados (`aspect-square`): sem mais colunas numa casca
  // larga, cada um viraria um bloco de 300px de altura.
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {disciplinas.map((d, i) => {
        const [corA, corB] = corDoCartao(i);
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
              className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl p-3 text-center shadow-md transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:shadow-lg active:scale-[0.97]"
              style={{
                background: `${VERNIZ_CARTAO}, radial-gradient(circle at 50% 38%, ${corA}, ${corB})`,
              }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/15 transition-[box-shadow] group-hover:ring-white/30" />
              {/* Matéria com questões que o aluno ainda não adicionou como
                  disciplina — sinaliza que é descoberta, não uma das suas. */}
              {!d.matriculada && (
                <span className="absolute top-2 left-2 rounded-full bg-black/25 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
                  Descobrir
                </span>
              )}
              <Icone size={34} strokeWidth={1.6} className="mb-3 text-white/90" />
              {/* Branco CHEIO, não /75: sobre o tile mais claro da rampa o
                  branco puro já dá 4.66:1 no tema escuro, então qualquer
                  transparência derruba um texto de 10px abaixo de AA. A
                  hierarquia com o nome vem do corpo e do peso, não da opacidade. */}
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
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
