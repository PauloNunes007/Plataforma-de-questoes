"use client";

// A faixa de ação da home — a primeira coisa que o aluno vê, e a única com
// CTA primário na dobra.
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
// **Repasse de 2026-09-16 (a) — fim do motor de missões.** O cartão tinha três
// estados porque existia uma "missão do dia" pendente pra cobrar. Nenhum dos
// estados de hoje inventa tarefa: o app não decide o dia de ninguém.
//
// **Repasse de 2026-09-16 (b) — o plano entra na faixa.** Faltava o meio do
// caminho. O aluno marcava "Estudar Cálculo II" na quarta e, na quarta, a home
// dizia "Nada aberto no momento" — o plano dele existia no calendário e a tela
// principal fingia que não, mandando-o remontar tudo no Banco de Questões.
//
// **Repasse de 2026-09-16 (c) — quem ganha a faixa.** A primeira versão dava a
// faixa pra QUALQUER lista aberta, e o resultado foi o oposto do pedido: uma
// lista de dias atrás parada em 6% ocupava a dobra inteira enquanto "Revisar
// derivadas, 20:30" — o bloco que o aluno tinha acabado de marcar pra hoje —
// ficava como uma linha de checkbox no trilho da direita. A regra agora é por
// TEMPERATURA, não por tipo:
//
//   • lista aberta HOJE ganha — é o que ele está fazendo agora;
//   • bloco marcado pra hoje ganha de lista FRIA (de outro dia) — o plano é o
//     assunto do dia, a lista de semana passada não é;
//   • quando a lista aberta É o bloco (elo `tarefas.mission_id`), não há
//     disputa: são a mesma coisa, e o título continua sendo o nome que o ALUNO
//     deu ("Revisar derivadas"), com a disciplina descendo pra legenda.
//
// Quem perde a disputa não some: vira uma pílula clicável rente à base da
// faixa, nos dois sentidos. Perder a dobra é uma coisa; perder o caminho de
// volta pro trabalho já começado é outra.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Play, Sparkles, Timer } from "lucide-react";
import { useFoco } from "@/components/foco/foco-provider";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { hrefQuestao } from "@/lib/questao/navegacao";
import { fmtDuracao } from "@/lib/agenda/formato";
import { iniciarEstudoPlanejadoAction } from "@/lib/tarefas/actions";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import type { MetasHoje } from "@/lib/questly/dashboard-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";

const GRAD_DIA_FEITO = "linear-gradient(135deg, #076b4a, #04412e)";
const GRAD_NEUTRO = "linear-gradient(135deg, #253343, #151d27)";

export function AcaoCard({
  retomar,
  plano,
  metas,
  hoje,
}: {
  retomar: RetomarInfo;
  /** O bloco de estudo de hoje ainda não concluído, se houver. */
  plano: TarefaRow | null;
  metas: MetasHoje;
  /** "YYYY-MM-DD" de hoje — a régua que separa lista quente de lista fria. */
  hoje: string;
}) {
  const foco = useFoco();
  const router = useRouter();
  const semMovimento = useReducedMotion();
  const origem = usePathname();
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fezAlgoHoje = metas.questoesRespondidas > 0;

  // A lista aberta É o bloco de hoje: uma coisa só, sem disputa.
  const planoLigado = Boolean(plano?.missionId && retomar && plano.missionId === retomar.missaoId);
  const listaQuente = Boolean(retomar && retomar.data === hoje);
  const planoVence = Boolean(plano) && !planoLigado && !listaQuente;

  const modo: "plano" | "retomar" | "dia" | "vazio" = planoVence
    ? "plano"
    : retomar
      ? "retomar"
      : fezAlgoHoje
        ? "dia"
        : "vazio";

  const naFaixa = modo === "plano" ? plano : null;
  const emCima = modo === "retomar" ? retomar : null;

  const nomeDisciplina = emCima?.subjectNome ?? naFaixa?.subjectNome ?? "Prática livre";
  const cor = corDaDisciplina(nomeDisciplina);
  const daDisciplina = modo === "plano" || modo === "retomar";

  const fundo = daDisciplina ? cor.gradienteProfundo : modo === "dia" ? GRAD_DIA_FEITO : GRAD_NEUTRO;
  const corCta = daDisciplina ? cor.profundo : modo === "dia" ? "#04412e" : "#1d2836";

  const kicker =
    modo === "retomar"
      ? "Você parou aqui"
      : modo === "plano"
        ? "No seu plano de hoje"
        : modo === "dia"
          ? "Seu dia até agora"
          : "Comece por onde quiser";

  // O nome que o aluno deu ao bloco sobrevive à execução — é ele que titula a
  // faixa enquanto a lista corre, com a disciplina descendo pra legenda.
  const titulo =
    modo === "retomar"
      ? emCima!.planoNome || nomeDisciplina
      : modo === "plano"
        ? naFaixa!.nome
        : modo === "dia"
          ? "Bom trabalho hoje"
          : "Nada aberto no momento";

  const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);
  const legenda =
    modo === "retomar"
      ? [
          emCima!.planoNome ? nomeDisciplina : null,
          `${emCima!.respondidas} de ${emCima!.total} questões`,
          `faltam ${emCima!.total - emCima!.respondidas} pra fechar`,
        ]
          .filter(Boolean)
          .join(" · ")
      : modo === "plano"
        ? detalheDoPlano(naFaixa!)
        : modo === "dia"
          ? `${metas.questoesRespondidas} ${plural(metas.questoesRespondidas, "questão", "questões")} · ${metas.xpHoje} XP · ${metas.listasConcluidas} ${plural(metas.listasConcluidas, "lista fechada", "listas fechadas")}`
          : "Monte uma lista com a disciplina, o assunto e o tamanho que você quiser.";

  async function comecarPlano() {
    if (!plano || iniciando) return;
    // Bloco que já virou lista (o aluno começou e saiu antes da 1ª questão):
    // abre a MESMA lista em vez de sortear outra.
    if (plano.missionId) {
      router.push(hrefQuestao(plano.missionId, origem));
      return;
    }
    setIniciando(true);
    setErro(null);
    try {
      const { missaoId, erro: falha } = await iniciarEstudoPlanejadoAction(plano.id);
      if (missaoId) {
        router.push(hrefQuestao(missaoId, origem));
        return;
      }
      setErro(falha || "Não foi possível montar a lista desse bloco.");
    } catch (e) {
      console.error("Falha ao começar o bloco de estudo:", e);
      setErro("Sem resposta do servidor. Confira a conexão e tente de novo.");
    }
    setIniciando(false);
  }

  const cta = (
    <Cta
      retomar={emCima}
      plano={naFaixa}
      iniciando={iniciando}
      onComecarPlano={comecarPlano}
      cor={corCta}
      origem={origem}
    />
  );

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
          de={daDisciplina ? cor.de : modo === "dia" ? "#10b981" : "#5c7085"}
          para={daDisciplina ? cor.para : modo === "dia" ? "#047857" : "#2b3a4c"}
          concluido={modo === "dia"}
        />

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/70">
            {modo === "retomar" ? (
              <Play size={10} strokeWidth={2.6} fill="currentColor" />
            ) : modo === "plano" ? (
              <CalendarDays size={12} strokeWidth={2.4} />
            ) : modo === "dia" ? (
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
          {cta}
        </div>
      </div>

      <div className="relative px-4 pb-3 sm:hidden">{cta}</div>

      {erro && (
        <p
          role="alert"
          className="relative mx-4 mb-3 rounded-xl bg-black/25 px-3 py-2 text-[11.5px] font-medium leading-relaxed text-white/90 sm:mx-5"
        >
          {erro}
        </p>
      )}

      {/* Quem perdeu a faixa continua a um clique. Sem isto, dar a dobra ao
          plano esconderia a lista já começada — trocaria um problema pelo
          outro, que é justamente o que esta faixa existe pra evitar. */}
      {modo === "plano" && retomar && (
        <Secundaria
          icone={<Play size={11} strokeWidth={2.6} fill="currentColor" />}
          href={hrefQuestao(retomar.missaoId, origem)}
          rotulo={`Continuar ${retomar.planoNome || retomar.subjectNome || "a lista aberta"}`}
          detalhe={`${retomar.respondidas} de ${retomar.total} · ${retomar.pct}%`}
        />
      )}
      {modo === "retomar" && plano && !planoLigado && (
        <Secundaria
          icone={<CalendarDays size={11} strokeWidth={2.5} />}
          onClick={comecarPlano}
          desabilitado={iniciando}
          rotulo={iniciando ? "Montando lista..." : `Começar ${plano.nome}`}
          detalhe={detalheDoPlano(plano)}
        />
      )}

      {/* Progresso rente à base — só existe quando há uma lista aberta de
          verdade NA FAIXA. Um bloco só planejado não tem "quanto falta": ele
          ainda não começou, e desenhar 0% seria cobrar algo que ninguém
          prometeu. */}
      {emCima && (
        <div className="relative flex items-center gap-3 px-4 pb-3.5 sm:px-5">
          <span className="tnum shrink-0 text-[11px] font-bold text-white/70">{emCima.pct}% concluído</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.span
              className="block h-full rounded-full bg-white"
              initial={semMovimento ? false : { width: 0 }}
              animate={{ width: `${Math.max(2, emCima.pct)}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        </div>
      )}
    </section>
  );
}

/**
 * A pílula do que perdeu a dobra: translúcida sobre a capa, uma linha só,
 * claramente subordinada ao CTA branco. É link quando o destino é uma lista
 * que já existe e botão quando ainda é preciso montá-la.
 */
function Secundaria({
  icone,
  rotulo,
  detalhe,
  href,
  onClick,
  desabilitado,
}: {
  icone: React.ReactNode;
  rotulo: string;
  detalhe: string;
  href?: string;
  onClick?: () => void;
  desabilitado?: boolean;
}) {
  const classe =
    "relative mx-4 mb-3.5 flex w-[calc(100%-2rem)] items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70 sm:mx-5 sm:w-[calc(100%-2.5rem)]";
  const conteudo = (
    <>
      <span className="shrink-0 text-white/80">{icone}</span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-white/90">{rotulo}</span>
      <span className="tnum hidden shrink-0 text-[11px] font-medium text-white/60 sm:block">{detalhe}</span>
      <ArrowRight size={13} strokeWidth={2.4} className="shrink-0 text-white/70" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={desabilitado} className={`${classe} cursor-pointer`}>
      {conteudo}
    </button>
  );
}

/** A legenda do bloco planejado: o que ele tem de concreto (hora, duração,
 *  alvo, disciplina), na ordem em que o aluno lê o próprio dia. Nenhum desses
 *  campos é obrigatório — o bloco pode ser só "Cálculo II". */
function detalheDoPlano(plano: TarefaRow): string {
  const partes = [
    plano.hora,
    plano.duracaoMin ? fmtDuracao(plano.duracaoMin) : null,
    plano.metaQuestoes ? `${plano.metaQuestoes} questões` : null,
    plano.subjectNome,
    // Os assuntos escolhidos: é a diferença entre "vou estudar Cálculo" e uma
    // lista que cobre o que a aula cobriu.
    plano.topicoIds.length > 0
      ? `${plano.topicoIds.length} ${plano.topicoIds.length === 1 ? "assunto" : "assuntos"}`
      : null,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "Marcado por você no calendário";
}

function Cta({
  retomar,
  plano,
  iniciando,
  onComecarPlano,
  cor,
  origem,
}: {
  retomar: RetomarInfo;
  plano: TarefaRow | null;
  iniciando: boolean;
  onComecarPlano: () => void;
  cor: string;
  origem: string;
}) {
  const base =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto";

  if (retomar) {
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

  if (plano) {
    return (
      <button
        type="button"
        onClick={onComecarPlano}
        disabled={iniciando}
        className={`${base} cursor-pointer bg-white shadow-lg shadow-black/20 disabled:cursor-not-allowed disabled:opacity-70`}
        style={{ color: cor }}
      >
        <Play size={15} strokeWidth={2.6} fill="currentColor" />
        {iniciando ? "Montando lista..." : plano.missionId ? "Continuar lista" : "Começar"}
      </button>
    );
  }

  return (
    <Link href="/questoes/banco" className={`${base} bg-white shadow-lg shadow-black/20`} style={{ color: cor }}>
      Montar uma lista <ArrowRight size={15} strokeWidth={2.4} />
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
