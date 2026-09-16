"use client";

// A faixa de ação da home — "continue de onde parou".
//
// Formato vindo do repasse de 2026-09-11: uma FAIXA horizontal de altura fixa
// (~168px), não o painel gigante de antes. A régua é a de um cartão de curso:
// capa à esquerda, texto ao centro, CTA à direita, barra de progresso rente à
// base.
//
// A cor é a da disciplina (gradienteProfundo, que passa AA com texto branco
// nos oito tons — ver disciplina-cor.ts) e é deliberadamente escura NOS DOIS
// TEMAS: é uma capa, não um card que segue o canvas.
//
// **Repasse de 2026-09-16 — fim do motor de missões.** O cartão tinha três
// estados porque existia uma "missão do dia" pendente pra cobrar. Agora são
// dois, e nenhum deles inventa tarefa:
//   1. tem lista começada e não terminada → "Continuar estudando";
//   2. não tem nada aberto → o resumo honesto do que JÁ foi feito hoje, com o
//      caminho pro Banco de Questões. Sem meta, sem "você está atrasado".

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Sparkles, Timer } from "lucide-react";
import { useFoco } from "@/components/foco/foco-provider";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { hrefQuestao } from "@/lib/questao/navegacao";
import type { MetasHoje } from "@/lib/questly/dashboard-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";

const GRAD_DIA_FEITO = "linear-gradient(135deg, #076b4a, #04412e)";
const GRAD_NEUTRO = "linear-gradient(135deg, #253343, #151d27)";

export function AcaoCard({ retomar, metas }: { retomar: RetomarInfo; metas: MetasHoje }) {
  const foco = useFoco();
  const semMovimento = useReducedMotion();
  const origem = usePathname();

  const fezAlgoHoje = metas.questoesRespondidas > 0;
  const nomeDisciplina = retomar?.subjectNome ?? "Prática livre";
  const cor = corDaDisciplina(nomeDisciplina);

  const fundo = retomar ? cor.gradienteProfundo : fezAlgoHoje ? GRAD_DIA_FEITO : GRAD_NEUTRO;
  const corCta = retomar ? cor.profundo : fezAlgoHoje ? "#04412e" : "#1d2836";

  const kicker = retomar ? "Você parou aqui" : fezAlgoHoje ? "Seu dia até agora" : "Comece por onde quiser";
  const titulo = retomar ? nomeDisciplina : fezAlgoHoje ? "Bom trabalho hoje" : "Nada aberto no momento";

  const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);
  const legenda = retomar
    ? `${retomar.respondidas} de ${retomar.total} questões · faltam ${retomar.total - retomar.respondidas} pra fechar`
    : fezAlgoHoje
      ? `${metas.questoesRespondidas} ${plural(metas.questoesRespondidas, "questão", "questões")} · ${metas.xpHoje} XP · ${metas.listasConcluidas} ${plural(metas.listasConcluidas, "lista fechada", "listas fechadas")}`
      : "Monte uma lista com a disciplina, o assunto e o tamanho que você quiser.";

  return (
    <section
      className="surface relative isolate overflow-hidden border-black/25 p-0 dark:border-white/10"
      style={{ background: fundo }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-white/15 blur-3xl"
      />

      <div className="relative flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
        <Capa
          nome={nomeDisciplina}
          de={retomar ? cor.de : fezAlgoHoje ? "#10b981" : "#5c7085"}
          para={retomar ? cor.para : fezAlgoHoje ? "#047857" : "#2b3a4c"}
          concluido={!retomar && fezAlgoHoje}
        />

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/70">
            {retomar ? (
              <Play size={10} strokeWidth={2.6} fill="currentColor" />
            ) : fezAlgoHoje ? (
              <CheckCircle2 size={12} strokeWidth={2.4} />
            ) : (
              <Sparkles size={12} strokeWidth={2.2} />
            )}
            {kicker}
          </span>

          <h2 className="mt-1 truncate font-heading text-[20px] font-bold leading-tight tracking-tight text-white sm:text-[24px]">
            {titulo}
          </h2>

          <p className="tnum mt-1 line-clamp-2 text-[12.5px] leading-snug text-white/75 sm:text-[13px]">
            {legenda}
          </p>
        </div>

        {/* Ações à DIREITA da faixa (como um cartão de curso): no mobile elas
            descem pra baixo do texto, onde há largura. */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={foco.abrirBarra}
            className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-4 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20"
          >
            <Timer size={15} strokeWidth={2.1} />
            Foco
          </button>
          <Cta retomar={retomar} cor={corCta} origem={origem} />
        </div>
      </div>

      <div className="relative px-4 pb-3 sm:hidden">
        <Cta retomar={retomar} cor={corCta} origem={origem} larga />
      </div>

      {/* Progresso rente à base — só existe quando há uma lista aberta de
          verdade. Sem lista não há "quanto falta": inventar um percentual do
          dia seria trazer de volta, disfarçada, a meta que o motor cobrava. */}
      {retomar && (
        <div className="relative flex items-center gap-3 px-4 pb-3.5 sm:px-5">
          <span className="tnum shrink-0 text-[11px] font-bold text-white/70">{retomar.pct}% concluído</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.span
              className="block h-full rounded-full bg-white"
              initial={semMovimento ? false : { width: 0 }}
              animate={{ width: `${Math.max(2, retomar.pct)}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        </div>
      )}
    </section>
  );
}

function Cta({
  retomar,
  cor,
  origem,
  larga = false,
}: {
  retomar: RetomarInfo;
  cor: string;
  origem: string;
  larga?: boolean;
}) {
  const base = `inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] ${larga ? "w-full" : ""}`;

  if (!retomar) {
    return (
      <Link href="/questoes/banco" className={`${base} bg-white shadow-lg shadow-black/20`} style={{ color: cor }}>
        Montar uma lista <ArrowRight size={15} strokeWidth={2.4} />
      </Link>
    );
  }

  return (
    <Link
      href={hrefQuestao(retomar.missaoId, origem)}
      className={`${base} bg-white shadow-lg shadow-black/20`}
      style={{ color: cor }}
    >
      <Play size={15} strokeWidth={2.6} fill="currentColor" />
      Continuar estudando
    </Link>
  );
}

/**
 * Capa da disciplina: um quadrado com o gradiente vivo dela, uma malha de
 * arcos e a inicial gravada. É a única imagem do cartão — desenhada, não uma
 * foto de banco de imagens que não diz nada sobre a matéria.
 */
function Capa({
  nome,
  de,
  para,
  concluido,
}: {
  nome: string;
  de: string;
  para: string;
  concluido: boolean;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative hidden h-[112px] w-[112px] shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-black/25 ring-1 ring-white/20 sm:block">
      <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`capa-${inicial}`} x1="0" y1="0" x2="112" y2="112" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={de} />
            <stop offset="1" stopColor={para} />
          </linearGradient>
        </defs>
        <rect width="112" height="112" fill={`url(#capa-${inicial})`} />
        <g fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5">
          <circle cx="16" cy="98" r="28" />
          <circle cx="16" cy="98" r="44" />
          <circle cx="16" cy="98" r="60" />
        </g>
        <path d="M112 0 60 112h14L112 30Z" fill="#fff" fillOpacity="0.1" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {concluido ? (
          <CheckCircle2 size={40} strokeWidth={2} className="text-white drop-shadow" />
        ) : (
          <span className="font-heading text-[46px] font-bold leading-none text-white drop-shadow-md">
            {inicial}
          </span>
        )}
      </span>
    </div>
  );
}
