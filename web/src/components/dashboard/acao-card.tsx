"use client";

// O cartão de ação da home — "continue de onde parou".
//
// Formato vindo do repasse de 2026-09-11: uma FAIXA horizontal de altura fixa
// (~168px), não o painel gigante de antes. A régua é a de um cartão de curso:
// capa à esquerda, texto ao centro, CTA à direita, barra de progresso rente à
// base. Tudo que era "estatística do dia" saiu daqui e foi pro MissoesCard ao
// lado — este cartão tem UMA função, que é levar o aluno de volta pra questão.
//
// A cor é a da disciplina (gradienteProfundo, que passa AA com texto branco
// nos oito tons — ver disciplina-cor.ts) e é deliberadamente escura NOS DOIS
// TEMAS: é uma capa, não um card que segue o canvas.
//
// Três estados, uma prioridade cada:
//   1. missão começada e não terminada → "Continuar estudando" (menor caminho);
//   2. missão pendente                 → "Começar missão";
//   3. tudo feito / sem missão         → estado honesto, sem CTA falso.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Crown, Moon, Play, Timer } from "lucide-react";
import { useFoco } from "@/components/foco/foco-provider";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { hrefQuestao } from "@/lib/questao/navegacao";
import type { MetasHoje, MissionCardData } from "@/lib/questly/dashboard-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";

const GRAD_CONCLUIDO = "linear-gradient(135deg, #076b4a, #04412e)";
const GRAD_MESTRE = "linear-gradient(135deg, #7a5806, #4a3403)";

export function AcaoCard({
  retomar,
  missions,
  semMissaoHoje,
  motivoSemMissao,
  metas,
  modoLivre = false,
}: {
  retomar: RetomarInfo;
  missions: MissionCardData[];
  semMissaoHoje: boolean;
  motivoSemMissao?: string;
  metas: MetasHoje;
  /** No modo livre não existe "missão do dia" — o vazio aqui não é uma falha
   *  do motor, é o estado normal de quem só quer praticar. */
  modoLivre?: boolean;
}) {
  const foco = useFoco();
  const semMovimento = useReducedMotion();
  const origem = usePathname();

  const pendentes = missions.filter((m) => !m.concluida);
  const proxima = pendentes[0] || null;
  const tudoFeito = missions.length > 0 && pendentes.length === 0;

  // Sem missão E sem nada começado: estado honesto, sem inventar tarefa.
  //
  // A ordem importa: `retomar` (uma lista do Banco de Questões, um recap, um
  // desafio de recuperação) é uma missão AVULSA e não aparece em `missions`.
  // Antes, quem tinha uma lista pela metade e nenhuma missão do dia via "Sem
  // missão hoje" e perdia o caminho de volta — no modo livre isso seria a
  // tela inteira, já que lá o motor nunca gera missão.
  if (!retomar && (semMissaoHoje || missions.length === 0)) {
    return (
      <section className="surface flex min-h-[168px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Moon size={20} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <div>
          <p className="font-heading text-[16px] font-semibold">
            {modoLivre ? "Bora praticar?" : "Sem missão hoje"}
          </p>
          <p className="mx-auto mt-1 max-w-[48ch] text-[13px] leading-relaxed text-muted-foreground">
            {modoLivre
              ? "Monte uma lista com os assuntos que você quiser, no tamanho que quiser."
              : motivoSemMissao || "Não foi possível gerar sua missão agora. Tente recarregar a página."}
          </p>
        </div>
        <Link
          href="/questoes/banco"
          className="mt-1 inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          {modoLivre ? "Montar minha lista" : "Praticar mesmo assim"}{" "}
          <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </section>
    );
  }

  const alvo = retomar
    ? { id: retomar.missaoId, nome: retomar.subjectNome }
    : proxima
      ? { id: proxima.id, nome: proxima.subjects?.nome ?? null }
      : null;
  const nomeDisciplina = alvo?.nome ?? "Missão avulsa";
  const cor = corDaDisciplina(nomeDisciplina);
  const mestreAlvo = Boolean(proxima?.mestre) && !retomar;

  const fundo = tudoFeito ? GRAD_CONCLUIDO : mestreAlvo ? GRAD_MESTRE : cor.gradienteProfundo;
  const kicker = tudoFeito ? "Dia cumprido" : retomar ? "Você parou aqui" : modoLivre ? "Prática livre" : "Seu foco de hoje";
  const titulo = tudoFeito ? "Tudo feito por hoje" : nomeDisciplina;
  const pct = retomar
    ? retomar.pct
    : metas.questoesTotal > 0
      ? Math.min(100, Math.round((metas.questoesRespondidas / metas.questoesTotal) * 100))
      : 0;

  const legenda = tudoFeito
    ? `${metas.questoesRespondidas} questões e ${metas.xpHoje} XP hoje — praticar mais continua valendo XP`
    : retomar
      ? `${retomar.respondidas} de ${retomar.total} questões · faltam ${retomar.total - retomar.respondidas} pra fechar`
      : `${proxima?.qtd_questoes ?? "–"} questões · ~${proxima?.tempo_previsto_min ?? "–"} min · ${proxima?.xp_recompensa ?? 0} XP`;

  return (
    <section
      id="missoes-do-dia"
      className="surface relative isolate overflow-hidden border-black/25 p-0 dark:border-white/10"
      style={{ background: fundo }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-white/15 blur-3xl"
      />

      <div className="relative flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
        {/* capa — o "quadrinho" colorido do cartão */}
        <Capa
          nome={nomeDisciplina}
          de={tudoFeito ? "#10b981" : mestreAlvo ? "#fbbf24" : cor.de}
          para={tudoFeito ? "#047857" : mestreAlvo ? "#d97706" : cor.para}
          concluido={tudoFeito}
          mestre={mestreAlvo}
        />

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/70">
            {tudoFeito ? (
              <CheckCircle2 size={12} strokeWidth={2.4} />
            ) : mestreAlvo ? (
              <Crown size={12} strokeWidth={2.2} />
            ) : (
              <Play size={10} strokeWidth={2.6} fill="currentColor" />
            )}
            {kicker}
          </span>

          <h2 className="mt-1 truncate font-heading text-[20px] font-bold leading-tight tracking-tight text-white sm:text-[24px]">
            {titulo}
          </h2>

          <p className="tnum mt-1 line-clamp-2 text-[12.5px] leading-snug text-white/75 sm:text-[13px]">
            {legenda}
            {mestreAlvo && <span className="font-bold text-white"> · XP em 1,5×</span>}
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
          <Cta alvo={alvo} retomar={Boolean(retomar)} cor={mestreAlvo ? "#7a5806" : cor.profundo} origem={origem} />
        </div>
      </div>

      <div className="relative px-4 pb-3 sm:hidden">
        <Cta alvo={alvo} retomar={Boolean(retomar)} cor={mestreAlvo ? "#7a5806" : cor.profundo} origem={origem} larga />
      </div>

      {/* progresso rente à base, como a régua de um curso */}
      <div className="relative flex items-center gap-3 px-4 pb-3.5 sm:px-5">
        <span className="tnum shrink-0 text-[11px] font-bold text-white/70">{pct}% concluído</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
          <motion.span
            className="block h-full rounded-full bg-white"
            initial={semMovimento ? false : { width: 0 }}
            animate={{ width: `${Math.max(2, pct)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </div>
    </section>
  );
}

function Cta({
  alvo,
  retomar,
  cor,
  origem,
  larga = false,
}: {
  alvo: { id: string; nome: string | null } | null;
  retomar: boolean;
  cor: string;
  origem: string;
  larga?: boolean;
}) {
  const base = `inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] ${larga ? "w-full" : ""}`;

  if (!alvo) {
    return (
      <Link
        href="/questoes/banco"
        className={`${base} bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm`}
      >
        Praticar mais <ArrowRight size={15} strokeWidth={2.4} />
      </Link>
    );
  }

  return (
    <Link
      href={hrefQuestao(alvo.id, origem)}
      className={`${base} bg-white shadow-lg shadow-black/20`}
      style={{ color: cor }}
    >
      <Play size={15} strokeWidth={2.6} fill="currentColor" />
      {retomar ? "Continuar estudando" : "Começar missão"}
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
  mestre,
}: {
  nome: string;
  de: string;
  para: string;
  concluido: boolean;
  mestre: boolean;
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
        ) : mestre ? (
          <Crown size={38} strokeWidth={2} className="text-white drop-shadow" />
        ) : (
          <span className="font-heading text-[46px] font-bold leading-none text-white drop-shadow-md">
            {inicial}
          </span>
        )}
      </span>
    </div>
  );
}
