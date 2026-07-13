"use client";

// A entrada do mundo: um tile vibrante por disciplina, IGUAL ao grid de
// /questoes/listas (pedido explícito do usuário) — gradiente radial
// saturado, ícone da matéria, kicker uppercase — só que com a leitura da
// jornada por cima: % do caminho, prova/boss, mestres e selo de risco.
// Mantém o tilt 3D do card do ranking (useMotionValue+useSpring 220/18).
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  AlertTriangle,
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Check,
  Crown,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  MessageCircle,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type { RegiaoMapa } from "@/lib/trilha/trilha-data";

type Props = {
  regioes: RegiaoMapa[];
  selecionada: string | null;
  onSelecionar: (subjectId: string) => void;
};

// mesma paleta e heurística de ícone do disciplina-navegar-grid.tsx —
// duplicadas de propósito (convenção do repo: helpers por arquivo)
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

export function MundoIlhas({ regioes, selecionada, onSelecionar }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" style={{ perspective: 1000 }}>
      {regioes.map((r, i) => {
        const Icone = iconePorNome(r.nome);
        return (
          <Ilha
            key={r.subjectId}
            regiao={r}
            icone={<Icone size={32} strokeWidth={1.6} className="mb-2.5 text-white/90" />}
            cores={CORES[i % CORES.length]}
            indice={i}
            ativa={r.subjectId === selecionada}
            onSelecionar={() => onSelecionar(r.subjectId)}
          />
        );
      })}
    </div>
  );
}

function Ilha({
  regiao: r,
  icone,
  cores: [corA, corB],
  indice,
  ativa,
  onSelecionar,
}: {
  regiao: RegiaoMapa;
  icone: React.ReactNode;
  cores: [string, string];
  indice: number;
  ativa: boolean;
  onSelecionar: () => void;
}) {
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 18 });

  const pct = r.totalTopicos > 0 ? Math.round(((r.concluidos + r.pulados) / r.totalTopicos) * 100) : 0;

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (reduzir) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 10);
    rotateX.set(-py * 10);
  }
  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelecionar}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-pressed={ativa}
      initial={reduzir ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: indice * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl p-3 text-center shadow-md shadow-black/10 transition-shadow duration-200 will-change-transform hover:shadow-lg"
      style={{
        background: `radial-gradient(circle at 50% 40%, ${corA}, ${corB})`,
        rotateX: reduzir ? 0 : springX,
        rotateY: reduzir ? 0 : springY,
        transformStyle: "preserve-3d",
      }}
    >
      {/* moldura interna, mais forte quando selecionada */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl ring-inset transition-[box-shadow] ${
          ativa ? "ring-[3px] ring-white/70" : "ring-1 ring-white/10 group-hover:ring-white/25"
        }`}
      />

      {/* selos no topo */}
      <div className="absolute left-2 right-2 top-2 flex items-start justify-between" style={{ transform: "translateZ(18px)" }}>
        {r.completo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm">
            <Check size={10} strokeWidth={3} />
            Completa
          </span>
        ) : r.emRisco > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[9.5px] font-bold text-amber-200 backdrop-blur-sm"
            title={`${r.emRisco} tópico(s) devem chegar fracos no dia da prova`}
          >
            <AlertTriangle size={10} strokeWidth={2.75} />
            {r.emRisco} em risco
          </span>
        ) : (
          <span />
        )}
        {r.mestres > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm">
            <Crown size={10} strokeWidth={2.75} />
            <span className="tnum">{r.mestres}</span>
          </span>
        )}
      </div>

      <div style={{ transform: "translateZ(24px)" }} className="flex flex-col items-center">
        {icone}
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/75">Jornada de</span>
        <span className="mt-0.5 line-clamp-2 text-[13.5px] font-bold leading-tight text-white">{r.nome}</span>
      </div>

      {/* rodapé: progresso + prova */}
      <div className="absolute inset-x-3 bottom-2.5" style={{ transform: "translateZ(18px)" }}>
        {r.temEmenta ? (
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/25">
              <motion.div
                className="h-full rounded-full bg-white/90"
                initial={reduzir ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: indice * 0.04, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-semibold text-white/85">
              <span className="tnum">{pct}%</span>
              {r.bossNome ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Swords size={10} strokeWidth={2.25} />
                  <span className="tnum truncate">
                    {r.diasAteProva} {r.diasAteProva === 1 ? "dia" : "dias"}
                  </span>
                </span>
              ) : (
                <span className="truncate opacity-80">sem prova</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-[9.5px] font-semibold text-white/80">Sem ementa ainda</p>
        )}
      </div>
    </motion.button>
  );
}
