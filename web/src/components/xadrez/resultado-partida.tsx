"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ChevronDown, Handshake, Loader2, RotateCcw, Sparkles, Trophy, XCircle, Zap } from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";
import { NIVEIS_IA } from "@/lib/xadrez/regras";
import type { NivelIa, RegistroRodada, ResultadoPartida as Resultado } from "@/lib/xadrez/types";

// Tela final da Arena: herói de vitória/derrota/empate, stats em blocos
// (com os valores AUTORITATIVOS do servidor — o XP local do HUD era só
// estimativa) e a revisão das questões erradas com gabarito/resolução.

const HERO: Record<Resultado, { titulo: string; sub: string; grad: string; Icone: typeof Trophy }> = {
  vitoria: {
    titulo: "Xeque-mate!",
    sub: "Suas respostas venceram a máquina.",
    grad: "from-questly-green to-emerald-600",
    Icone: Trophy,
  },
  derrota: {
    titulo: "Derrota",
    sub: "A máquina levou essa — revise os erros e volte pra revanche.",
    grad: "from-questly-red to-rose-700",
    Icone: XCircle,
  },
  empate: {
    titulo: "Empate",
    sub: "Ninguém caiu — partida equilibrada.",
    grad: "from-slate-500 to-slate-700",
    Icone: Handshake,
  },
};

export function ResultadoPartida({
  resultado,
  nivelIa,
  finalizando,
  erro,
  servidor,
  rodadas,
  totalLances,
  perguntasErradas,
  podeJogarDeNovo,
  onJogarDeNovo,
}: {
  resultado: Resultado;
  nivelIa: NivelIa;
  finalizando: boolean;
  erro: string | null;
  servidor: { xpGanho: number; acertos: number; erros: number } | null;
  rodadas: RegistroRodada[];
  totalLances: number;
  perguntasErradas: Pergunta[];
  podeJogarDeNovo: boolean;
  onJogarDeNovo: () => void;
}) {
  const hero = HERO[resultado];
  const brilhantes = rodadas.filter((r) => r.tier === "brilhante").length;
  const acertos = servidor?.acertos ?? rodadas.filter((r) => r.correta).length;
  const erros = servidor?.erros ?? rodadas.length - acertos;

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      {/* herói */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br p-7 text-white shadow-xl shadow-black/10 sm:p-9 ${hero.grad}`}
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/12 blur-md" />
        <hero.Icone size={150} strokeWidth={1} className="pointer-events-none absolute -bottom-6 -right-6 text-white/15" />
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
          <hero.Icone size={26} strokeWidth={2} />
        </span>
        <h1 className="mt-4 font-heading text-[26px] font-bold tracking-tight sm:text-[30px]">{hero.titulo}</h1>
        <p className="mt-1 max-w-[420px] text-[13.5px] text-white/85">{hero.sub}</p>
        <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white/70">
          Máquina no nível {NIVEIS_IA[nivelIa].rotulo.toLowerCase()} · {totalLances} lances
        </p>
      </motion.div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BlocoStat rotulo="Acertos" valor={acertos} classe="bg-questly-green-light text-questly-green-dark" Icone={CheckCircle2} />
        <BlocoStat rotulo="Erros" valor={erros} classe="bg-questly-red-light text-questly-red-dark" Icone={XCircle} />
        <BlocoStat rotulo="Lances brilhantes" valor={brilhantes} classe="bg-questly-gold-light text-questly-gold-dark" Icone={Sparkles} />
        <BlocoStat
          rotulo="XP ganho"
          valor={finalizando ? null : (servidor?.xpGanho ?? 0)}
          classe="bg-questly-purple/15 text-questly-purple"
          Icone={Zap}
        />
      </div>

      {erro && (
        <p className="rounded-xl bg-questly-red-light px-4 py-3 text-[13px] font-medium text-questly-red-dark">
          {erro}
        </p>
      )}

      {/* revisão dos erros */}
      {perguntasErradas.length > 0 && (
        <div className="surface p-5">
          <span className="kicker mb-3 block">Questões pra revisar</span>
          <div className="flex flex-col gap-2">
            {perguntasErradas.map((p) => (
              <QuestaoRevisao key={p.id} pergunta={p} />
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3">
        {podeJogarDeNovo ? (
          <button
            type="button"
            onClick={onJogarDeNovo}
            className="inline-flex items-center gap-2 rounded-full bg-questly-green px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-105 active:scale-[0.98]"
          >
            <RotateCcw size={14} strokeWidth={2.25} />
            Jogar de novo
          </button>
        ) : (
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 rounded-full bg-questly-gold px-5 py-2.5 text-[13.5px] font-semibold text-[#3a2a05] shadow-sm transition-[filter] hover:brightness-105 active:scale-[0.98]"
          >
            <Sparkles size={14} strokeWidth={2.25} />
            Jogar sem limite com o Pro
          </Link>
        )}
        <Link
          href="/questoes"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={2.25} />
          Voltar pras questões
        </Link>
      </div>
    </div>
  );
}

function BlocoStat({
  rotulo,
  valor,
  classe,
  Icone,
}: {
  rotulo: string;
  valor: number | null; // null = ainda salvando
  classe: string;
  Icone: typeof Zap;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl p-4 ${classe}`}>
      <Icone size={16} strokeWidth={2} />
      {valor === null ? (
        <Loader2 size={20} strokeWidth={2} className="mt-1 animate-spin" />
      ) : (
        <span className="tnum font-heading text-[26px] font-bold leading-none">{valor}</span>
      )}
      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{rotulo}</span>
    </div>
  );
}

function QuestaoRevisao({ pergunta }: { pergunta: Pergunta }) {
  const [aberta, setAberta] = useState(false);
  const textoGabarito = pergunta.alternativas?.[pergunta.gabarito] ?? "";

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
          <MathText text={pergunta.enunciado} />
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`shrink-0 text-muted-foreground transition-transform ${aberta ? "rotate-180" : ""}`}
        />
      </button>
      {aberta && (
        <div className="border-t border-border px-4 py-3.5">
          <div className="text-[13.5px] leading-relaxed">
            <MathText text={pergunta.enunciado} />
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-questly-green-light px-3 py-2 text-[13px] font-medium text-questly-green-dark">
            <CheckCircle2 size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
            <span>
              Gabarito: <strong>{pergunta.gabarito.toUpperCase()}</strong>
              {textoGabarito && (
                <>
                  {" — "}
                  <MathText text={textoGabarito} />
                </>
              )}
            </span>
          </p>
          {pergunta.resolucao && (
            <div className="mt-2.5 rounded-lg bg-muted px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide">Resolução</span>
              <MathText text={pergunta.resolucao} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
