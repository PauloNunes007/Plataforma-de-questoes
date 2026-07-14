"use client";

// Tour cinematográfico pós-onboarding — uma sequência de "capítulos" em tela
// cheia (estilo stories premium/fintech: fundo dark fixo independente do tema,
// aurora animada, cartões de vidro) apresentando as mecânicas da plataforma e
// fechando na oferta do Pro. Auto-avança com barra de progresso por capítulo;
// toque à direita/esquerda (ou ←/→) navega, Esc pula. `prefers-reduced-motion`
// desliga o auto-avanço e os loops decorativos — o aluno clica no próprio ritmo.
//
// O fundo é deliberadamente sempre escuro (não segue o tema do app): é uma
// peça de apresentação, não uma tela de produto — por isso as cores aqui são
// fixas (hex) em vez dos tokens `--questly-*` sensíveis a tema.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Infinity as InfinityIcon,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Mascote } from "@/components/trilha/mascote-capivara";
import { CursoIcone } from "@/components/cursos/curso-icone";
import { cursoReconhecido, type CursoIdentidade } from "@/lib/cursos/registro";

/* ------------------------------------------------------------------ */
/* Roteiro                                                              */
/* ------------------------------------------------------------------ */

// dur = quanto tempo o capítulo fica na tela antes do auto-avanço (ms).
// O capítulo final (Pro) não auto-avança — a decisão é do aluno.
const CAPITULOS = [
  { id: "abertura", dur: 5600 },
  { id: "missao", dur: 7600 },
  { id: "jornada", dur: 7800 },
  { id: "liga", dur: 7000 },
  { id: "ciencia", dur: 7600 },
  { id: "pro", dur: 0 },
] as const;

const ULTIMO = CAPITULOS.length - 1;

// Grão de filme sutil (feTurbulence) — dá textura premium sem custo de rede.
const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

// Coreografia de entrada/saída das cenas — a direção vem via `custom`.
const VARIANTES_CENA = {
  enter: (dir: number) => ({ opacity: 0, y: 26 * dir, scale: 0.985, filter: "blur(6px)" }),
  center: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ opacity: 0, y: -20 * dir, scale: 0.99, filter: "blur(4px)" }),
};

type TourProps = {
  identidade: CursoIdentidade | null;
  onFinalizar: () => void;
};

export function TourPlataforma({ identidade, onFinalizar }: TourProps) {
  const router = useRouter();
  const rm = useReducedMotion();
  // Capítulo atual + direção da última navegação (pra coreografia da transição).
  const [pos, setPos] = useState({ cap: 0, dir: 1 });
  const cap = pos.cap;

  const irPara = useCallback((n: number) => {
    setPos((p) => (n < 0 || n > ULTIMO || n === p.cap ? p : { cap: n, dir: n > p.cap ? 1 : -1 }));
  }, []);

  const avancar = useCallback(() => irPara(cap + 1), [cap, irPara]);
  const voltar = useCallback(() => irPara(cap - 1), [cap, irPara]);

  // Auto-avanço — desligado com reduced-motion (o aluno controla o ritmo).
  useEffect(() => {
    if (rm) return;
    const dur = CAPITULOS[cap].dur;
    if (!dur) return;
    const t = setTimeout(
      () => setPos((p) => (p.cap === cap ? { cap: Math.min(p.cap + 1, ULTIMO), dir: 1 } : p)),
      dur,
    );
    return () => clearTimeout(t);
  }, [cap, rm]);

  // Teclado: setas navegam, Esc encerra.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") avancar();
      else if (e.key === "ArrowLeft") voltar();
      else if (e.key === "Escape") onFinalizar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [avancar, voltar, onFinalizar]);

  const ehOuro = CAPITULOS[cap].id === "pro";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex min-h-dvh flex-col overflow-hidden bg-[#080d1a] text-white"
      role="dialog"
      aria-label="Tour pela plataforma Questly"
    >
      <Cenario ouro={ehOuro} rm={!!rm} corCurso={identidade && cursoReconhecido(identidade) ? identidade.corA : null} />

      {/* barra de progresso estilo stories */}
      <div className="relative z-30 flex gap-1.5 px-5 pt-5 sm:px-8" aria-hidden>
        {CAPITULOS.map((c, i) => (
          <div key={c.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
            {i < cap || (i === ULTIMO && cap === ULTIMO) ? (
              <div className="h-full w-full rounded-full bg-white/85" />
            ) : i === cap ? (
              <motion.div
                key={`fill-${cap}`}
                className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{ originX: 0 }}
                transition={rm ? { duration: 0 } : { duration: c.dur / 1000, ease: "linear" }}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* topo: marca + pular */}
      <div className="relative z-30 flex items-center justify-between px-5 pt-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2dd4a0] to-[#0b7a56] shadow-[0_0_28px_rgba(45,212,160,0.4)] ring-1 ring-inset ring-white/25">
            <Swords size={15} strokeWidth={2.4} />
          </span>
          <span className="font-heading text-sm font-semibold tracking-tight text-white/90">Questly</span>
        </div>
        <button
          type="button"
          onClick={onFinalizar}
          className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold text-white/60 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          Pular tour
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* zonas de toque (atrás do conteúdo — o conteúdo é pointer-events-none,
          então o toque "atravessa" pra cá; CTAs reativam pointer-events) */}
      <button
        type="button"
        aria-label="Capítulo anterior"
        onClick={voltar}
        className={`absolute inset-y-0 left-0 z-10 w-1/3 cursor-pointer ${cap === 0 ? "pointer-events-none" : ""}`}
      />
      <button
        type="button"
        aria-label="Próximo capítulo"
        onClick={avancar}
        className={`absolute inset-y-0 right-0 z-10 w-2/3 cursor-pointer ${cap === ULTIMO ? "pointer-events-none" : ""}`}
      />

      {/* palco */}
      <div className="pointer-events-none relative z-20 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-4 [perspective:1200px] sm:pb-20">
        <AnimatePresence mode="wait" custom={pos.dir}>
          <motion.div
            key={cap}
            custom={pos.dir}
            variants={VARIANTES_CENA}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: rm ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full max-w-[620px] flex-col items-center"
          >
            {cap === 0 && <CenaAbertura identidade={identidade} rm={!!rm} />}
            {cap === 1 && <CenaMissao rm={!!rm} />}
            {cap === 2 && <CenaJornada rm={!!rm} />}
            {cap === 3 && <CenaLiga rm={!!rm} />}
            {cap === 4 && <CenaCiencia rm={!!rm} />}
            {cap === 5 && (
              <CenaPro rm={!!rm} onVerPro={() => router.push("/pro")} onComecar={onFinalizar} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* rodapé: navegação explícita (além das zonas de toque) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between bg-gradient-to-t from-[#080d1a]/80 to-transparent px-5 pb-5 pt-8 sm:px-8">
        <button
          type="button"
          aria-label="Anterior"
          onClick={voltar}
          className={`pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 backdrop-blur-md transition-opacity hover:bg-white/10 ${
            cap === 0 ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>

        {cap === 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.4] }}
            transition={{ duration: 3.2, delay: 1.2, times: [0, 0.2, 0.8, 1] }}
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40"
          >
            toque para avançar
          </motion.span>
        )}

        <button
          type="button"
          aria-label="Próximo"
          onClick={avancar}
          className={`pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 backdrop-blur-md transition-opacity hover:bg-white/10 ${
            cap === ULTIMO ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Cenário — aurora + grade + partículas + grão, atrás de tudo          */
/* ------------------------------------------------------------------ */

// Partículas de poeira flutuando — posições determinísticas (nada de random
// no render), só transform/opacity.
const PARTICULAS = [
  { left: "12%", top: "68%", dur: 11, delay: 0 },
  { left: "26%", top: "30%", dur: 13, delay: 1.8 },
  { left: "44%", top: "78%", dur: 10, delay: 0.9 },
  { left: "58%", top: "22%", dur: 14, delay: 2.6 },
  { left: "72%", top: "62%", dur: 12, delay: 1.2 },
  { left: "86%", top: "38%", dur: 15, delay: 0.4 },
  { left: "34%", top: "52%", dur: 16, delay: 3.1 },
  { left: "92%", top: "74%", dur: 12, delay: 2.1 },
];

function Cenario({ ouro, rm, corCurso }: { ouro: boolean; rm: boolean; corCurso: string | null }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* grade técnica bem sutil */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 78%)",
        }}
      />

      {/* aurora — blobs desfocados que derivam lentamente; a cor muda pro
          dourado no capítulo Pro (transição de cor via animate) */}
      <motion.div
        className="absolute -left-[18%] top-[-22%] h-[62vh] w-[62vh] rounded-full blur-[110px]"
        animate={{
          backgroundColor: ouro ? "rgba(232,185,49,0.20)" : "rgba(14,159,110,0.22)",
          x: rm ? 0 : [0, 46, 0],
          y: rm ? 0 : [0, 28, 0],
        }}
        transition={{
          backgroundColor: { duration: 1.2 },
          x: { duration: 17, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 21, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute -right-[16%] bottom-[-24%] h-[58vh] w-[58vh] rounded-full blur-[120px]"
        animate={{
          backgroundColor: ouro ? "rgba(201,147,10,0.16)" : corCurso ? `${corCurso}2e` : "rgba(139,92,246,0.18)",
          x: rm ? 0 : [0, -40, 0],
          y: rm ? 0 : [0, -30, 0],
        }}
        transition={{
          backgroundColor: { duration: 1.2 },
          x: { duration: 19, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 23, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      {/* facho central atrás do palco — destaca a cena como um holofote */}
      <motion.div
        className="absolute left-1/2 top-[38%] h-[46vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        animate={{ backgroundColor: ouro ? "rgba(232,185,49,0.07)" : "rgba(255,255,255,0.05)" }}
        transition={{ duration: 1.2 }}
      />

      {/* poeira em suspensão */}
      {!rm &&
        PARTICULAS.map((p, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/40"
            style={{ left: p.left, top: p.top }}
            animate={{ y: [0, -46, 0], opacity: [0, 0.55, 0] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      {/* vinheta + grão de filme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_90%_at_50%_35%,transparent_45%,rgba(3,6,14,0.8)_100%)]" />
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: GRAO }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos reutilizáveis                                                 */
/* ------------------------------------------------------------------ */

// Título/subtítulo padrão de capítulo — a "voz" do tour.
function Legenda({
  kicker,
  titulo,
  children,
  tom = "verde",
  delay = 0.35,
}: {
  kicker: string;
  titulo: React.ReactNode;
  children: React.ReactNode;
  tom?: "verde" | "ouro";
  delay?: number;
}) {
  const cor = tom === "ouro" ? "text-[#e8b931]" : "text-[#2dd4a0]";
  const traco = tom === "ouro" ? "to-[#e8b931]/70" : "to-[#2dd4a0]/70";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7 text-center"
    >
      <p className={`flex items-center justify-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] ${cor}`}>
        <span className={`h-px w-7 bg-gradient-to-r from-transparent ${traco}`} />
        {kicker}
        <span className={`h-px w-7 bg-gradient-to-l from-transparent ${traco}`} />
      </p>
      <h2 className="mx-auto mt-2.5 max-w-[500px] text-balance bg-gradient-to-b from-white via-white to-white/60 bg-clip-text font-heading text-[27px] font-semibold leading-[1.12] tracking-tight text-transparent sm:text-[33px]">
        {titulo}
      </h2>
      <p className="mx-auto mt-3 max-w-[440px] text-balance text-[13.5px] leading-relaxed text-white/55 sm:text-sm">
        {children}
      </p>
    </motion.div>
  );
}

// Cartão de vidro com entrada 3D (leve rotateX) + holofote atrás — a
// superfície das maquetes de UI dentro das cenas.
function Vidro({ rm, className = "", children }: { rm: boolean; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={rm ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 22, delay: 0.12 }}
      style={{ transformPerspective: 1100 }}
      className="relative w-full max-w-[440px]"
    >
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-white/[0.05] blur-2xl" />
      <div
        className={`rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.035] shadow-[0_28px_70px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl ${className}`}
      >
        {children}
      </div>
    </motion.div>
  );
}

// Contador animado (XP, %) — número tabular pra não "dançar".
function Contador({
  ate,
  delay,
  dur = 1.4,
  rm,
  sufixo = "",
}: {
  ate: number;
  delay: number;
  dur?: number;
  rm: boolean;
  sufixo?: string;
}) {
  const mv = useMotionValue(0);
  const texto = useTransform(mv, (v) => `${Math.round(v)}${sufixo}`);
  useEffect(() => {
    const c = animate(mv, ate, { duration: rm ? 0 : dur, delay: rm ? 0 : delay, ease: "easeOut" });
    return () => c.stop();
  }, [mv, ate, delay, dur, rm]);
  return <motion.span className="tnum">{texto}</motion.span>;
}

/* ------------------------------------------------------------------ */
/* Capítulo 1 — Abertura                                                */
/* ------------------------------------------------------------------ */

function CenaAbertura({ identidade, rm }: { identidade: CursoIdentidade | null; rm: boolean }) {
  const reconhecido = identidade && cursoReconhecido(identidade);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
        className="relative"
      >
        {/* anel de energia atrás do mascote */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-full bg-[#2dd4a0]/25 blur-2xl"
          animate={rm ? undefined : { scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <Mascote size={128} />
      </motion.div>

      {reconhecido && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 20 }}
          className="mt-5 flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] py-1.5 pl-1.5 pr-4 backdrop-blur-md"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-white"
            style={{ background: `radial-gradient(circle at 50% 35%, ${identidade.corA}, ${identidade.corB})` }}
          >
            <CursoIcone icone={identidade.icone} size={13} strokeWidth={2.2} />
          </span>
          <span className="text-xs font-semibold text-white/80">Campanha de {identidade.nome}</span>
        </motion.div>
      )}

      <Legenda kicker="Boas-vindas à Questly" titulo="Você acabou de sair do modo difícil." delay={0.7}>
        Sua campanha está montada. Em meio minuto, você vai entender como cada dia de estudo te deixa
        visivelmente mais perto da aprovação.
      </Legenda>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Capítulo 2 — Missão diária                                           */
/* ------------------------------------------------------------------ */

const QUESTOES_DEMO = [
  { nome: "Regra da cadeia", xp: 5 },
  { nome: "Derivadas implícitas", xp: 8 },
  { nome: "Taxas relacionadas", xp: 5 },
];

function CenaMissao({ rm }: { rm: boolean }) {
  return (
    <>
      <Vidro rm={rm} className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0e9f6e]/40 to-[#0e9f6e]/15 text-[#2dd4a0] ring-1 ring-inset ring-[#2dd4a0]/25">
              <Target size={17} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Missão de hoje</p>
              <p className="font-heading text-sm font-semibold">Cálculo II · 3 questões · 35 min</p>
            </div>
          </div>
          <div className="rounded-full border border-[#e8b931]/25 bg-[#e8b931]/12 px-3 py-1.5 text-xs font-bold text-[#e8b931] shadow-[0_0_18px_-4px_rgba(232,185,49,0.45)]">
            <Zap size={11} strokeWidth={2.6} className="mr-1 inline -translate-y-px fill-current" />
            <Contador ate={18} delay={1.1} dur={2.2} rm={rm} sufixo=" XP" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {QUESTOES_DEMO.map((q, i) => (
            <LinhaQuestao key={q.nome} nome={q.nome} xp={q.xp} delay={0.9 + i * 0.85} rm={rm} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#0e9f6e] to-[#2dd4a0] shadow-[0_0_10px_rgba(45,212,160,0.6)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ originX: 0 }}
              transition={{ delay: rm ? 0 : 0.9, duration: rm ? 0 : 2.6, ease: "easeInOut" }}
            />
          </div>
          <span className="text-[11px] font-bold text-[#2dd4a0]">
            <Contador ate={100} delay={0.9} dur={2.6} rm={rm} sufixo="%" />
          </span>
        </div>
      </Vidro>

      <Legenda kicker="Missões diárias" titulo="Abra o app. Sua missão já está pronta.">
        Chega de perder meia hora decidindo o que estudar: a Questly escolhe as questões certas, na ordem
        certa da ementa, no tempo que você tem hoje. Você só resolve.
      </Legenda>
    </>
  );
}

function LinhaQuestao({ nome, xp, delay, rm }: { nome: string; xp: number; delay: number; rm: boolean }) {
  const d = rm ? 0 : delay;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{
        opacity: 1,
        x: 0,
        borderColor: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)", "rgba(45,212,160,0.3)"],
        backgroundColor: ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.04)", "rgba(14,159,110,0.09)"],
      }}
      transition={{
        opacity: { delay: rm ? 0 : delay - 0.5, duration: 0.4 },
        x: { delay: rm ? 0 : delay - 0.5, duration: 0.4, ease: "easeOut" },
        borderColor: { delay: d, duration: 0.5, times: [0, 0.01, 1] },
        backgroundColor: { delay: d, duration: 0.5, times: [0, 0.01, 1] },
      }}
      className="relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-md border-2 border-white/25"
          animate={{ opacity: [1, 1, 0] }}
          transition={{ delay: d, duration: 0.25, times: [0, 0.99, 1] }}
        />
        <motion.span
          className="absolute inset-0 flex items-center justify-center rounded-md bg-[#0e9f6e] shadow-[0_0_12px_rgba(45,212,160,0.5)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: d, type: "spring", stiffness: 420, damping: 16 }}
        >
          <Check size={12} strokeWidth={3.2} />
        </motion.span>
      </span>
      <span className="flex-1 text-[13px] font-medium text-white/85">{nome}</span>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1, 1], y: [6, -2, -2] }}
        transition={{ delay: d + 0.1, duration: 0.6 }}
        className="text-[11px] font-bold text-[#2dd4a0]"
      >
        +{xp} XP
      </motion.span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Capítulo 3 — Jornada até o Boss                                      */
/* ------------------------------------------------------------------ */

// Trilha serpenteante em SVG: o traço se desenha, os marcos acendem em
// sequência e o último é o Boss.
const MARCOS = [
  { x: 30, y: 96 },
  { x: 110, y: 44 },
  { x: 195, y: 92 },
  { x: 280, y: 40 },
  { x: 356, y: 84 },
];

function CenaJornada({ rm }: { rm: boolean }) {
  return (
    <>
      <Vidro rm={rm} className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Trilha de Cálculo II</p>
          <span className="rounded-full border border-[#f5a623]/25 bg-[#f5a623]/12 px-2.5 py-1 text-[10px] font-bold text-[#f5a623]">
            P1 em 12 dias
          </span>
        </div>

        <svg viewBox="0 0 390 130" className="w-full" aria-hidden>
          <path
            d="M 30 96 C 65 96, 75 44, 110 44 S 160 92, 195 92 S 245 40, 280 40 S 321 84, 356 84"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <motion.path
            d="M 30 96 C 65 96, 75 44, 110 44 S 160 92, 195 92 S 245 40, 280 40 S 321 84, 356 84"
            fill="none"
            stroke="#2dd4a0"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(45,212,160,0.55))" }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: rm ? 0 : 0.5, duration: rm ? 0 : 2.8, ease: "easeInOut" }}
          />
          {/* pulso permanente em volta do Boss */}
          {!rm && (
            <motion.circle
              cx={356}
              cy={84}
              r={17}
              fill="none"
              stroke="#f5a623"
              strokeWidth="1.5"
              style={{ transformOrigin: "356px 84px" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0], scale: [1, 1.5, 1.9] }}
              transition={{ delay: 3.6, duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          {MARCOS.map((m, i) => {
            const ehBoss = i === MARCOS.length - 1;
            const delay = rm ? 0 : 0.5 + i * 0.62;
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay, type: "spring", stiffness: 320, damping: 15 }}
                style={{ transformOrigin: `${m.x}px ${m.y}px` }}
              >
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={ehBoss ? 17 : 12}
                  fill={ehBoss ? "#1c1408" : "#0d2b22"}
                  stroke={ehBoss ? "#f5a623" : "#2dd4a0"}
                  strokeWidth="2.5"
                />
                {ehBoss ? <SwordsSvg x={m.x} y={m.y} /> : <CheckSvg x={m.x} y={m.y} />}
              </motion.g>
            );
          })}
        </svg>

        {/* card do boss com HP */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rm ? 0 : 3.4, duration: 0.5, ease: "easeOut" }}
          className="mt-3 rounded-xl border border-[#f5a623]/25 bg-gradient-to-r from-[#f5a623]/[0.1] to-[#f5a623]/[0.03] p-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords size={14} strokeWidth={2.4} className="text-[#f5a623]" />
              <span className="text-xs font-bold text-white/90">Boss: P1 de Cálculo II</span>
            </div>
            <span className="text-[10px] font-bold text-[#f5a623]">
              HP <Contador ate={64} delay={3.7} dur={1.6} rm={rm} sufixo="%" />
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#d97706]"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0.64 }}
              style={{ originX: 0 }}
              transition={{ delay: rm ? 0 : 3.7, duration: rm ? 0 : 1.6, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </Vidro>

      <Legenda kicker="Trilha & Bosses" titulo="Sua prova é o Boss. Cada questão é um golpe.">
        A trilha avança com você pela ementa e mostra, em tempo real, o quanto falta pra chegar pronto.
        Quando o dia da prova chegar, o jogo já está virado.
      </Legenda>
    </>
  );
}

// Ícones desenhados direto no SVG da trilha (lucide não entra em <svg> externo).
function CheckSvg({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M ${x - 4.5} ${y} l 3 3.4 l 6 -6.8`}
      fill="none"
      stroke="#2dd4a0"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function SwordsSvg({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#f5a623" strokeWidth="2.2" strokeLinecap="round">
      <path d={`M ${x - 6} ${y - 6} L ${x + 6} ${y + 6}`} />
      <path d={`M ${x + 6} ${y - 6} L ${x - 6} ${y + 6}`} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Capítulo 4 — Liga & Ranking                                          */
/* ------------------------------------------------------------------ */

const PODIO = [
  { nome: "Ana", xp: 410, altura: 84, cor: "#8f8fe8", lugar: 2, delay: 0.7 },
  { nome: "Você", xp: 540, altura: 116, cor: "#2dd4a0", lugar: 1, delay: 1.0 },
  { nome: "Léo", xp: 335, altura: 62, cor: "#f5a623", lugar: 3, delay: 1.3 },
];

const LIGAS = ["Bronze", "Prata", "Ouro", "Platina", "Diamante"];

// Faíscas que estouram quando a coroa pousa no 1º lugar.
const FAISCAS = [
  { x: -22, y: -18, delay: 2.15 },
  { x: 20, y: -24, delay: 2.25 },
  { x: 0, y: -34, delay: 2.35 },
];

function CenaLiga({ rm }: { rm: boolean }) {
  return (
    <>
      <Vidro rm={rm} className="max-w-[420px] p-5">
        <div className="mb-4 flex items-center justify-center gap-2">
          {LIGAS.map((l, i) => (
            <motion.span
              key={l}
              initial={{ opacity: 0.3, scale: 0.9 }}
              animate={{ opacity: i === 2 ? 1 : 0.35, scale: i === 2 ? 1.08 : 0.9 }}
              transition={{ delay: rm ? 0 : 0.4 + i * 0.14, duration: 0.4 }}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                i === 2
                  ? "bg-[#e8b931]/20 text-[#e8b931] shadow-[0_0_18px_rgba(232,185,49,0.35)]"
                  : "bg-white/8 text-white/60"
              }`}
            >
              {l}
            </motion.span>
          ))}
        </div>

        <div className="flex items-end justify-center gap-3">
          {PODIO.map((p) => (
            <div key={p.nome} className="flex w-[86px] flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rm ? 0 : p.delay + 0.35, type: "spring", stiffness: 300, damping: 18 }}
                className="relative mb-2 flex flex-col items-center"
              >
                {p.lugar === 1 && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, y: -14, rotate: -12 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      transition={{ delay: rm ? 0 : 2.1, type: "spring", stiffness: 260, damping: 12 }}
                      className="absolute -top-5 text-[#e8b931]"
                    >
                      <Crown size={16} strokeWidth={2.4} className="fill-current" />
                    </motion.span>
                    {!rm &&
                      FAISCAS.map((f, i) => (
                        <motion.span
                          key={i}
                          className="absolute -top-3 text-[#e8b931]"
                          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                          animate={{ opacity: [0, 1, 0], x: f.x, y: f.y, scale: [0.4, 1, 0.5] }}
                          transition={{ delay: f.delay, duration: 0.7, ease: "easeOut" }}
                        >
                          <Sparkles size={10} strokeWidth={2.4} />
                        </motion.span>
                      ))}
                  </>
                )}
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-extrabold text-[#0a1020] ring-2 ring-white/20"
                  style={{ backgroundColor: p.cor }}
                >
                  {p.nome[0]}
                </span>
                <span className="mt-1 text-[10px] font-bold text-white/75">{p.nome}</span>
                <span className="text-[10px] font-semibold text-white/45">
                  <Contador ate={p.xp} delay={p.delay + 0.5} dur={1.2} rm={rm} sufixo=" XP" />
                </span>
              </motion.div>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{
                  originY: 1,
                  height: p.altura,
                  background: `linear-gradient(to top, ${p.cor}14, ${p.cor}30)`,
                  borderColor: `${p.cor}55`,
                }}
                transition={{ delay: rm ? 0 : p.delay, type: "spring", stiffness: 160, damping: 20 }}
                className="w-full rounded-t-xl border border-b-0"
              >
                <p className="pt-2 text-center font-heading text-lg font-bold" style={{ color: p.cor }}>
                  {p.lugar}º
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </Vidro>

      <Legenda kicker="Ligas semanais" titulo="Estudar sozinho, nunca mais.">
        Cada questão da semana vira XP no ranking. Suba do Bronze ao Diamante contra estudantes do Brasil
        inteiro — e sinta a diferença de ter um placar do seu lado.
      </Legenda>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Capítulo 5 — Ciência do aprendizado                                  */
/* ------------------------------------------------------------------ */

const CHIPS_CIENCIA = [
  { icone: CalendarClock, rotulo: "Revisão na hora certa" },
  { icone: BrainCircuit, rotulo: "Maestria por tópico" },
  { icone: SearchCheck, rotulo: "Diagnóstico do erro" },
];

function CenaCiencia({ rm }: { rm: boolean }) {
  return (
    <>
      <Vidro rm={rm} className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          Curva do esquecimento · sua memória
        </p>
        <svg viewBox="0 0 390 120" className="mt-2 w-full" aria-hidden>
          <defs>
            <linearGradient id="tour-area-memoria" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4a0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2dd4a0" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* área sob a curva "com Questly" */}
          <motion.path
            d="M 20 22 C 55 52, 80 68, 105 76 L 105 30 C 150 58, 180 68, 205 74 L 205 34 C 260 56, 300 62, 330 66 L 330 38 C 350 44, 362 46, 370 48 L 370 112 L 20 112 Z"
            fill="url(#tour-area-memoria)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rm ? 0 : 2.6, duration: rm ? 0 : 1 }}
          />
          {/* curva caindo sem revisão (fantasma) */}
          <motion.path
            d="M 20 22 C 90 88, 180 102, 370 108"
            fill="none"
            stroke="rgba(244,113,113,0.45)"
            strokeWidth="2.5"
            strokeDasharray="5 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: rm ? 0 : 0.5, duration: rm ? 0 : 1.6, ease: "easeOut" }}
          />
          {/* curva com revisões: cai e é "resgatada" 3x */}
          <motion.path
            d="M 20 22 C 55 52, 80 68, 105 76 L 105 30 C 150 58, 180 68, 205 74 L 205 34 C 260 56, 300 62, 330 66 L 330 38 C 350 44, 362 46, 370 48"
            fill="none"
            stroke="#2dd4a0"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 5px rgba(45,212,160,0.5))" }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: rm ? 0 : 0.9, duration: rm ? 0 : 3.2, ease: "easeInOut" }}
          />
          {[105, 205, 330].map((x, i) => (
            <motion.g
              key={x}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: rm ? 0 : 1.5 + i * 0.85, type: "spring", stiffness: 340, damping: 14 }}
              style={{ transformOrigin: `${x}px ${i === 0 ? 30 : i === 1 ? 34 : 38}px` }}
            >
              <circle cx={x} cy={i === 0 ? 30 : i === 1 ? 34 : 38} r="9" fill="#0d2b22" stroke="#2dd4a0" strokeWidth="2" />
              <path
                d={`M ${x - 3.4} ${(i === 0 ? 30 : i === 1 ? 34 : 38)} l 2.3 2.6 l 4.5 -5.2`}
                fill="none"
                stroke="#2dd4a0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.g>
          ))}
          <text x="374" y="104" textAnchor="end" fill="rgba(244,113,113,0.7)" fontSize="9" fontWeight="600">
            sem revisar
          </text>
          <text x="374" y="42" textAnchor="end" fill="#2dd4a0" fontSize="9" fontWeight="700">
            com a Questly
          </text>
        </svg>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CHIPS_CIENCIA.map((c, i) => (
            <motion.span
              key={c.rotulo}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rm ? 0 : 2.6 + i * 0.3, duration: 0.4, ease: "easeOut" }}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-white/75"
            >
              <c.icone size={12} strokeWidth={2.4} className="text-[#2dd4a0]" />
              {c.rotulo}
            </motion.span>
          ))}
        </div>
      </Vidro>

      <Legenda kicker="Ciência da memória" titulo="Você esquece. A Questly lembra.">
        Sem revisão, boa parte do que você estuda some da memória em poucos dias. A Questly calcula o
        momento exato em que cada tópico ia escapar — e te chama de volta antes.
      </Legenda>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Capítulo 6 — Pro                                                     */
/* ------------------------------------------------------------------ */

const BENEFICIOS_TOUR = [
  { icone: TrendingUp, texto: "Nota prevista pro dia da prova, tópico por tópico" },
  { icone: CalendarCheck, texto: "Grade de estudos que se monta sozinha" },
  { icone: BrainCircuit, texto: "Diagnóstico do porquê de cada erro" },
  { icone: Trophy, texto: "Percentil, recordes e estatísticas avançadas" },
  { icone: InfinityIcon, texto: "Disciplinas e provas ilimitadas" },
];

function CenaPro({ rm, onVerPro, onComecar }: { rm: boolean; onVerPro: () => void; onComecar: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.15 }}
        className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f2ca55] to-[#c9930a] shadow-[0_0_44px_rgba(232,185,49,0.45)] ring-1 ring-inset ring-white/40"
      >
        <Crown size={26} strokeWidth={2.2} className="fill-[#0a1020]/20 text-[#241a03]" />
        <motion.span
          className="absolute inset-0 rounded-2xl bg-[#e8b931]/30 blur-xl"
          animate={rm ? undefined : { opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-balance text-center font-heading text-[28px] font-semibold leading-[1.12] tracking-tight sm:text-[34px]"
      >
        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          No grátis, você passa.
        </span>
        <br />
        <span className="bg-gradient-to-r from-[#f2ca55] via-[#e8b931] to-[#c9930a] bg-clip-text text-transparent">
          No Pro, você gabarita.
        </span>
      </motion.h2>

      {/* benefícios com varredura holográfica */}
      <div className="relative mt-6 w-full max-w-[460px] overflow-hidden rounded-2xl p-px">
        {!rm && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-10 w-1/3 rotate-[8deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
            initial={{ x: "-160%" }}
            animate={{ x: "460%" }}
            transition={{ delay: 1.6, duration: 2.4, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
          />
        )}
        <div className="grid gap-2">
          {BENEFICIOS_TOUR.map((b, i) => (
            <motion.div
              key={b.texto}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rm ? 0 : 0.55 + i * 0.14, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-xl border border-[#e8b931]/15 bg-gradient-to-r from-[#e8b931]/[0.08] to-[#e8b931]/[0.02] px-3.5 py-2.5 backdrop-blur-md"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8b931]/15 text-[#e8b931] ring-1 ring-inset ring-[#e8b931]/20">
                <b.icone size={14} strokeWidth={2.3} />
              </span>
              <span className="text-[12.5px] font-medium text-white/85 sm:text-[13px]">{b.texto}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: rm ? 0 : 1.4, duration: 0.5 }}
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-white/55"
      >
        <ShieldCheck size={13} strokeWidth={2.4} className="text-[#e8b931]" />
        A partir de R$ 10/mês · cancele quando quiser
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rm ? 0 : 1.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto mt-5 flex w-full max-w-[460px] flex-col gap-2.5 sm:flex-row"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onVerPro}
          className="relative flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#f2ca55] to-[#c9930a] px-6 font-heading text-[15px] font-semibold text-[#241a03] shadow-[0_8px_32px_-8px_rgba(232,185,49,0.6)] transition-[filter] hover:brightness-105"
        >
          {!rm && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              initial={{ x: "-160%" }}
              animate={{ x: "460%" }}
              transition={{ delay: 2.4, duration: 1.1, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" }}
            />
          )}
          <Crown size={16} strokeWidth={2.4} className="fill-current" />
          Quero gabaritar com o Pro
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onComecar}
          className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 font-heading text-[15px] font-semibold text-white/85 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Continuar no grátis
          <ArrowRight size={16} strokeWidth={2.4} />
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: rm ? 0 : 1.9, duration: 0.5 }}
        className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40"
      >
        <Flame size={11} strokeWidth={2.4} />
        Sua primeira missão já te espera no dashboard.
      </motion.p>
    </>
  );
}
