"use client";

// Card público do aluno em "vibe Pokémon TCG" (pedido do usuário,
// 2026-07-11): moldura metálica na cor da liga, janela de arte com o
// retrato, faixa de info como a linha "Nº 0025 Pokémon Rato…", os
// "ataques" são as contribuições reais (XP da semana, streak, questões),
// e o rodapé leva raridade + numeração como uma carta impressa. Ligas
// raras (ouro+) ganham o brilho holográfico; o card inteiro responde ao
// mouse com tilt 3D, como uma carta segurada na mão.
import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Flame, Medal, Target, X, Zap } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import {
  LIGA_CARD_BG,
  LIGA_FRAME,
  LIGA_GRADIENTE,
  LIGA_HOLO,
  LIGA_RARIDADE,
} from "@/components/ranking/liga-visual";
import { CursoIcone } from "@/components/cursos/curso-icone";
import { cursoReconhecido, resolverCurso } from "@/lib/cursos/registro";
import type { CardUsuario } from "@/lib/ranking/actions";

type StudentCardModalProps = {
  card: CardUsuario | null;
  loading: boolean;
  onClose: () => void;
};

const TEXTO_POP = "[text-shadow:0_1px_3px_rgba(0,0,0,0.4)]";

export function StudentCardModal({ card, loading, onClose }: StudentCardModalProps) {
  const aberto = loading || card !== null;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          style={{ perspective: 1100 }}
        >
          {loading || !card ? (
            <motion.div
              className="surface flex w-full max-w-[380px] flex-col items-center gap-3 p-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            </motion.div>
          ) : (
            <CartaTcg card={card} onClose={onClose} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CartaTcg({ card, onClose }: { card: CardUsuario; onClose: () => void }) {
  const raridade = LIGA_RARIDADE[card.liga];
  const numeroCarta = String(Math.max(1, card.nivel)).padStart(3, "0");
  const curso = resolverCurso(card.curso);
  const cursoNoCard = cursoReconhecido(curso);

  // tilt 3D acompanhando o mouse — a carta "na mão"
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 18 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateY.set(px * 14);
    rotateX.set(-py * 12);
  }

  function onMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`relative w-full max-w-[370px] rounded-[20px] bg-gradient-to-br p-[10px] shadow-2xl shadow-black/50 ${LIGA_FRAME[card.liga]}`}
      initial={{ opacity: 0, scale: 0.82, rotateX: -14, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 12 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute -right-2.5 -top-2.5 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        <X size={16} strokeWidth={2.25} />
      </button>

      <div
        className={`relative overflow-hidden rounded-[12px] bg-gradient-to-b p-3.5 ${LIGA_CARD_BG[card.liga]}`}
      >
        {/* brilho holográfico — só nas ligas raras (ouro pra cima) */}
        {LIGA_HOLO[card.liga] && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ width: "55%" }}
            initial={{ x: "-130%" }}
            animate={{ x: ["-130%", "260%"] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
          />
        )}
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-white/5" />

        {/* linha de título: estágio (liga) · nome · nível como "PS" */}
        <div className="relative z-10 flex items-center gap-2">
          <span
            className={`shrink-0 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${TEXTO_POP}`}
          >
            Liga {card.ligaNome}
          </span>
          <h3 className={`min-w-0 flex-1 truncate font-heading text-[17px] font-bold text-white ${TEXTO_POP}`}>
            {card.nome}
          </h3>
          <span className={`flex shrink-0 items-baseline gap-1 text-white ${TEXTO_POP}`}>
            <span className="text-[9px] font-bold uppercase">Nv</span>
            <span className="tnum font-heading text-2xl font-bold leading-none">{card.nivel}</span>
            <Medal size={15} strokeWidth={2.25} className="ml-0.5 self-center" />
          </span>
        </div>

        {/* janela de arte, com moldura "metálica" como numa carta */}
        <div className="relative z-10 mx-1 mt-2.5 rounded-lg bg-gradient-to-b from-white/70 via-white/30 to-white/60 p-[3px]">
          <div
            className={`relative flex items-center justify-center overflow-hidden rounded-[6px] bg-gradient-to-br py-6 ${LIGA_GRADIENTE[card.liga]}`}
          >
            {/* "tipo" da carta = identidade do curso do aluno */}
            {cursoNoCard && (
              <span
                title={`${curso.nome} — ${curso.tagline}`}
                className={`absolute left-2 top-2 z-20 flex max-w-[60%] items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-white ring-1 ring-white/40 ${TEXTO_POP}`}
                style={{ background: `linear-gradient(90deg, ${curso.corA}, ${curso.corB})` }}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <CursoIcone icone={curso.icone} size={13} strokeWidth={2.25} />
                </span>
                <span className="truncate text-[9.5px] font-bold uppercase tracking-wide">
                  {curso.nome}
                </span>
              </span>
            )}
            <RankAvatar
              nome={card.nome}
              fotoUrl={card.fotoUrl}
              size={112}
              gradientClassName="from-white/25 to-black/20"
              className="ring-4 ring-white/30"
            />
          </div>
        </div>

        {/* faixa de info, como "Nº 0025 Pokémon Rato Altura 0,4m..." */}
        <div className="relative z-10 mx-5 -mt-[1px] rounded-b-lg bg-gradient-to-r from-white/75 via-white/55 to-white/75 px-3 py-1 text-center">
          <span className="tnum block truncate text-[9.5px] font-semibold italic text-black/70">
            Nº {numeroCarta} · {card.curso || "Curso não informado"}
            {card.semestre ? ` · ${card.semestre}º sem` : ""}
          </span>
        </div>

        {/* "ataques": as contribuições reais do aluno */}
        <div className="relative z-10 mt-3.5 flex flex-col">
          <Ataque
            icone={<Zap size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-gold"
            nome="Investida semanal"
            descricao="XP conquistado nesta rodada da liga"
            valor={card.xpSemana}
            unidade="XP"
          />
          <Ataque
            icone={<Flame size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-orange"
            nome="Chama constante"
            descricao="dias seguidos cumprindo missão"
            valor={card.streakAtual}
            unidade={card.streakAtual === 1 ? "dia" : "dias"}
          />
          <Ataque
            icone={<Target size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-purple"
            nome="Rajada de questões"
            descricao="questões respondidas na carreira"
            valor={card.questoesTotal}
            unidade=""
            semDivisor
          />
        </div>

        {/* distintivos conquistados — só os que o aluno tem */}
        <div className="relative z-10 mt-3 rounded-xl bg-black/25 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/70">
              Distintivos
            </span>
            <span className="tnum text-[9.5px] font-bold text-white/70">{card.distintivos.length}</span>
          </div>
          {card.distintivos.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {card.distintivos.map((d, i) => (
                <motion.div
                  key={d.id}
                  title={`${d.nome} — ${d.descricao}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 320, damping: 20 }}
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1"
                >
                  <span className="text-[13px] leading-none">{d.icone}</span>
                  <span className="text-[10px] font-semibold text-white">{d.nome}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[10.5px] text-white/70">
              Ainda sem distintivos — responda questões pra desbloquear os primeiros.
            </p>
          )}
        </div>

        {/* linha de "fraqueza/resistência" → disciplinas em campanha */}
        <div className="relative z-10 mt-3 border-t border-white/15 pt-2.5">
          <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/70">
            Disciplinas em campanha
          </div>
          {card.disciplinas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {card.disciplinas.map((nome) => (
                <span
                  key={nome}
                  className="rounded-full bg-white/12 px-2.5 py-0.5 text-[10px] font-medium text-white"
                >
                  {nome}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10.5px] text-white/70">Nenhuma disciplina cadastrada ainda.</p>
          )}
        </div>

        {/* rodapé de carta impressa: ilustrador · raridade · numeração */}
        <div className="relative z-10 mt-3 flex items-center justify-between text-[8.5px] italic text-white/55">
          <span>Ilust. Questly</span>
          <span className="tnum not-italic">
            {raridade.simbolo} {numeroCarta}/100 · {raridade.nome}
          </span>
          <span>© Questly {new Date().getFullYear()}</span>
        </div>
      </div>
    </motion.div>
  );
}

function Ataque({
  icone,
  corEnergia,
  nome,
  descricao,
  valor,
  unidade,
  semDivisor,
}: {
  icone: React.ReactNode;
  corEnergia: string;
  nome: string;
  descricao: string;
  valor: number;
  unidade: string;
  semDivisor?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 py-2 ${semDivisor ? "" : "border-b border-white/12"}`}>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-white/40 ${corEnergia}`}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[12.5px] font-bold text-white ${TEXTO_POP}`}>{nome}</span>
        <span className="block truncate text-[9.5px] text-white/60">{descricao}</span>
      </span>
      <span className={`tnum shrink-0 font-heading text-lg font-bold text-white ${TEXTO_POP}`}>
        {valor.toLocaleString("pt-BR")}
        {unidade && <span className="ml-1 text-[10px] font-semibold text-white/70">{unidade}</span>}
      </span>
    </div>
  );
}
