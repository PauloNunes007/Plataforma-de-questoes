"use client";

// A entrada do mundo: um tile por disciplina, IGUAL ao grid de
// /questoes/listas (pedido explícito do usuário) — gradiente radial, ícone da
// matéria, kicker uppercase — só que com a leitura da jornada por cima: % do
// caminho, mestres e selo de revisão. Mantém o tilt 3D do card do ranking
// (useMotionValue+useSpring 220/18).
//
// **Repasse de 2026-09-16 (cor).** A cor saía de um array de hex cru copiado
// daqui pra mais quatro arquivos, no croma cheio ("as cores estão ardendo meus
// olhos"). Agora vem da rampa única dos cartões (PALETA_CARTOES →
// `--cartao-N-*`), tema-ciente e já desaturada em globals.css.
//
// **Repasse de 2026-09-16 (tamanho).** O tile era um QUADRADO numa grade que
// parava em 4 colunas: num monitor largo, seis disciplinas viravam seis
// pôsteres de ~380px e o mapa inteiro nascia abaixo da dobra. Ele agora é
// deitado (5/4) e a grade vai até 6 colunas — a mesma informação em pouco mais
// da metade da altura, que é o que devolve a trilha pra primeira tela.
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  Atom,
  BrainCircuit,
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
  Target,
  type LucideIcon,
} from "lucide-react";
import type { RegiaoMapa } from "@/lib/trilha/trilha-data";
import { corDoCartao } from "@/lib/questly/paleta-cartoes";

type Props = {
  regioes: RegiaoMapa[];
  selecionada: string | null;
  onSelecionar: (subjectId: string) => void;
};

// heurística de ícone duplicada do disciplina-navegar-grid.tsx — de
// propósito (convenção do repo: helpers por arquivo). A COR não é mais
// duplicada: vem de corDoCartao().
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
    <div
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      style={{ perspective: 1000 }}
    >
      {regioes.map((r, i) => {
        const Icone = iconePorNome(r.nome);
        return (
          <Ilha
            key={r.subjectId}
            regiao={r}
            icone={<Icone size={22} strokeWidth={1.7} className="mb-1.5 text-white/90" />}
            cores={corDoCartao(i)}
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
  cores: readonly [string, string];
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
      className="group relative flex aspect-[5/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl p-2.5 text-center shadow-sm shadow-black/10 transition-shadow duration-200 will-change-transform hover:shadow-md"
      style={{
        background: `radial-gradient(circle at 50% 40%, ${corA}, ${corB})`,
        rotateX: reduzir ? 0 : springX,
        rotateY: reduzir ? 0 : springY,
        transformStyle: "preserve-3d",
      }}
    >
      {/* moldura interna, mais forte quando selecionada */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-xl ring-inset transition-[box-shadow] ${
          ativa ? "ring-2 ring-white/70" : "ring-1 ring-white/10 group-hover:ring-white/25"
        }`}
      />

      {/* selos no topo */}
      <div className="absolute left-1.5 right-1.5 top-1.5 flex items-start justify-between" style={{ transform: "translateZ(18px)" }}>
        {r.completo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm">
            <Check size={10} strokeWidth={3} />
            Completa
          </span>
        ) : r.revisar > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm"
            title={`${r.revisar} tópico(s) com a memória caindo — hora de revisar`}
          >
            <BrainCircuit size={10} strokeWidth={2.75} />
            {r.revisar} revisar
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
        <span className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-white/70">Jornada de</span>
        <span className="mt-0.5 line-clamp-2 text-[12px] font-bold leading-tight text-white">{r.nome}</span>
      </div>

      {/* rodapé: quanto da ementa foi percorrido + aproveitamento real */}
      <div className="absolute inset-x-2.5 bottom-2" style={{ transform: "translateZ(18px)" }}>
        {r.temEmenta ? (
          <>
            <div className="h-1 overflow-hidden rounded-full bg-black/25">
              <motion.div
                className="h-full rounded-full bg-white/90"
                initial={reduzir ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: indice * 0.04, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] font-semibold text-white/85">
              <span className="tnum">{pct}%</span>
              {r.precisaoMedia != null ? (
                <span
                  className="inline-flex min-w-0 items-center gap-1"
                  title={`${r.questoesRespondidas} questões respondidas nesta disciplina`}
                >
                  <Target size={10} strokeWidth={2.25} />
                  <span className="tnum truncate">{Math.round(r.precisaoMedia * 100)}% acerto</span>
                </span>
              ) : (
                <span className="truncate opacity-80">sem questões ainda</span>
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
