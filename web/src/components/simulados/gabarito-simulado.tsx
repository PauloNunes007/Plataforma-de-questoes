"use client";

// Gabarito do simulado — a parte que faz o aluno aprender com a prova em vez de
// só olhar a nota.
//
// Antes isto era uma lista sanfonada com TODAS as questões despejada no fim da
// página de resultado: o aluno terminava a prova e caía num paredão de 20+
// linhas que ele não tinha pedido. Agora são duas etapas:
//
//   1. um CONVITE — um cartão que diz o que tem lá dentro (quantas erradas, em
//      branco, certas) e deixa escolher por onde entrar;
//   2. um LEITOR em tela cheia, UMA questão por vez, com a folha de respostas
//      virando navegador no topo. Uma questão por tela é o que torna a revisão
//      legível: enunciado, sua marcação, a correta e a resolução, sem competir
//      com mais dezenove cartões.
//
// A folha de respostas continua sendo a visão de conjunto (status de tudo numa
// olhada) — só que dentro do leitor, onde ela serve pra navegar, e não como
// mais um bloco solto na página.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  MinusCircle,
  X,
  XCircle,
} from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import { FiguraQuestao, figurasDaPergunta, usePrefetchFiguras } from "@/components/questao/figura-questao";
import type { Pergunta } from "@/lib/questao/types";
import type { QuestaoAnalisada, StatusQuestao } from "@/lib/simulados/analise";
import { ROTULO_DIFICULDADE, fmtSegundosPreciso } from "@/lib/simulados/analise";

type Filtro = "todas" | "erro" | "branco" | "acerto";

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: "todas", rotulo: "Todas" },
  { chave: "erro", rotulo: "Erradas" },
  { chave: "branco", rotulo: "Em branco" },
  { chave: "acerto", rotulo: "Certas" },
];

const ICONE_STATUS: Record<StatusQuestao, React.ReactNode> = {
  acerto: <CheckCircle2 size={15} />,
  erro: <XCircle size={15} />,
  branco: <MinusCircle size={15} />,
};

const CLASSE_CHIP: Record<StatusQuestao, string> = {
  acerto: "bg-questly-green-light text-questly-green-dark border-questly-green/40",
  erro: "bg-questly-red-light text-questly-red-dark border-questly-red/40",
  branco: "bg-muted text-muted-foreground border-border",
};

const ROTULO_STATUS: Record<StatusQuestao, string> = {
  acerto: "Você acertou",
  erro: "Você errou",
  branco: "Você deixou em branco",
};

export function GabaritoSimulado({
  perguntas,
  analise,
}: {
  perguntas: Pergunta[];
  analise: QuestaoAnalisada[];
}) {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [indice, setIndice] = useState(0);

  const porId = useMemo(() => new Map(analise.map((a) => [a.id, a])), [analise]);
  const contagem = useMemo(
    () => ({
      todas: analise.length,
      acerto: analise.filter((a) => a.status === "acerto").length,
      erro: analise.filter((a) => a.status === "erro").length,
      branco: analise.filter((a) => a.status === "branco").length,
    }),
    [analise],
  );

  // O baralho visível depende do filtro; o índice é sempre posição DENTRO dele.
  const visiveis = useMemo(
    () => perguntas.filter((p) => filtro === "todas" || porId.get(p.id)?.status === filtro),
    [perguntas, porId, filtro],
  );

  const abrir = useCallback(
    (comFiltro: Filtro, idInicial?: string) => {
      setFiltro(comFiltro);
      const lista =
        comFiltro === "todas" ? perguntas : perguntas.filter((p) => porId.get(p.id)?.status === comFiltro);
      const pos = idInicial ? lista.findIndex((p) => p.id === idInicial) : 0;
      setIndice(pos >= 0 ? pos : 0);
      setAberto(true);
    },
    [perguntas, porId],
  );

  /** Trocar de filtro dentro do leitor tenta manter a questão em foco. */
  const trocarFiltro = useCallback(
    (novo: Filtro) => {
      const atualId = visiveis[indice]?.id;
      const lista = novo === "todas" ? perguntas : perguntas.filter((p) => porId.get(p.id)?.status === novo);
      const pos = atualId ? lista.findIndex((p) => p.id === atualId) : -1;
      setFiltro(novo);
      setIndice(pos >= 0 ? pos : 0);
    },
    [visiveis, indice, perguntas, porId],
  );

  // Mesma ideia do runner: com o leitor aberto, adianta as figuras das
  // próximas questões da revisão.
  usePrefetchFiguras(
    aberto ? visiveis.slice(indice, indice + 3).flatMap((p) => figurasDaPergunta(p)) : [],
  );

  if (analise.length === 0) return null;

  return (
    <>
      <ConviteGabarito contagem={contagem} onAbrir={abrir} />
      <AnimatePresence>
        {aberto && (
          <LeitorGabarito
            visiveis={visiveis}
            porId={porId}
            contagem={contagem}
            filtro={filtro}
            indice={Math.min(indice, Math.max(0, visiveis.length - 1))}
            onIndice={setIndice}
            onFiltro={trocarFiltro}
            onFechar={() => setAberto(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1. Convite
// ---------------------------------------------------------------------------

function ConviteGabarito({
  contagem,
  onAbrir,
}: {
  contagem: Record<Filtro, number>;
  onAbrir: (f: Filtro) => void;
}) {
  const temErro = contagem.erro > 0;
  const temBranco = contagem.branco > 0;

  return (
    <section className="surface-brand rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-questly-green text-white shadow-sm dark:text-[#0c1512]">
          <BookOpen size={21} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold tracking-tight">Quer ver o gabarito comentado?</h2>
          <p className="mt-0.5 max-w-[58ch] text-[12.5px] leading-relaxed text-muted-foreground">
            Uma questão por vez: o enunciado, o que você marcou, a alternativa correta e a resolução. Dá pra
            pular direto pras que você errou.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Selo tom="erro" n={contagem.erro} rotulo={contagem.erro === 1 ? "errada" : "erradas"} />
            <Selo tom="branco" n={contagem.branco} rotulo="em branco" />
            <Selo tom="acerto" n={contagem.acerto} rotulo={contagem.acerto === 1 ? "certa" : "certas"} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => onAbrir(temErro ? "erro" : temBranco ? "branco" : "todas")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            <ListChecks size={16} strokeWidth={2.4} />
            {temErro ? `Revisar as ${contagem.erro} que errei` : temBranco ? "Revisar as em branco" : "Ver gabarito"}
          </button>
          {(temErro || temBranco) && (
            <button
              type="button"
              onClick={() => onAbrir("todas")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
            >
              Ver a prova inteira ({contagem.todas})
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Selo({ tom, n, rotulo }: { tom: StatusQuestao; n: number; rotulo: string }) {
  if (n === 0) return null;
  return (
    <span
      className={`tnum inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${CLASSE_CHIP[tom]}`}
    >
      {ICONE_STATUS[tom]}
      {n} {rotulo}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 2. Leitor
// ---------------------------------------------------------------------------

function LeitorGabarito({
  visiveis,
  porId,
  contagem,
  filtro,
  indice,
  onIndice,
  onFiltro,
  onFechar,
}: {
  visiveis: Pergunta[];
  porId: Map<string, QuestaoAnalisada>;
  contagem: Record<Filtro, number>;
  filtro: Filtro;
  indice: number;
  onIndice: (i: number) => void;
  onFiltro: (f: Filtro) => void;
  onFechar: () => void;
}) {
  const semMovimento = useReducedMotion();
  const pergunta = visiveis[indice];
  const item = pergunta ? porId.get(pergunta.id) : undefined;

  // Trava o scroll do fundo enquanto o leitor está aberto (mesmo padrão do
  // bottom sheet da trilha e do recortador de PDF do importador).
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  // Setas navegam, Esc fecha — revisar 20 questões no mouse é cansativo.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
      else if (e.key === "ArrowRight") onIndice(Math.min(indice + 1, visiveis.length - 1));
      else if (e.key === "ArrowLeft") onIndice(Math.max(indice - 1, 0));
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [indice, visiveis.length, onIndice, onFechar]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      initial={semMovimento ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={semMovimento ? undefined : { opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-modal="true"
      aria-label="Gabarito comentado"
    >
      {/* ------------------------------------------------------ cabeçalho */}
      <header className="shrink-0 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[860px] items-center gap-3 px-4 py-3">
          <span className="flex items-center gap-2 text-[13px] font-bold">
            <BookOpen size={16} className="text-questly-green" />
            Gabarito
          </span>
          <span className="tnum ml-auto text-[12px] font-semibold text-muted-foreground">
            {visiveis.length > 0 ? `${indice + 1} de ${visiveis.length}` : "0"}
          </span>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar gabarito"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto w-full max-w-[860px] px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => {
              const n = contagem[f.chave];
              if (n === 0 && f.chave !== "todas") return null;
              const ativo = filtro === f.chave;
              return (
                <button
                  key={f.chave}
                  type="button"
                  onClick={() => onFiltro(f.chave)}
                  aria-pressed={ativo}
                  className={`tnum rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
                    ativo
                      ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                      : "border-border bg-card text-muted-foreground hover:border-questly-green/45"
                  }`}
                >
                  {f.rotulo} <span className="opacity-70">{n}</span>
                </button>
              );
            })}
          </div>

          {/* Folha de respostas: visão de conjunto E navegador. */}
          <div className="mt-2.5 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {visiveis.map((p, i) => {
              const a = porId.get(p.id);
              if (!a) return null;
              const atual = i === indice;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onIndice(i)}
                  aria-current={atual ? "true" : undefined}
                  title={`Questão ${a.numero} — ${ROTULO_STATUS[a.status].toLowerCase()}`}
                  className={`tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11.5px] font-bold transition-all ${
                    CLASSE_CHIP[a.status]
                  } ${atual ? "ring-2 ring-foreground/60 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100"}`}
                >
                  {a.numero}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------- corpo */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[860px] px-4 py-5">
          {!pergunta || !item ? (
            <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-[13px] text-muted-foreground">
              Nenhuma questão neste filtro.
            </p>
          ) : (
            <motion.article
              key={pergunta.id}
              initial={semMovimento ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="surface p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${CLASSE_CHIP[item.status]}`}
                >
                  {ICONE_STATUS[item.status]}
                  {ROTULO_STATUS[item.status]}
                </span>
                <span className="tnum text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  Questão {item.numero} · {item.topico}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {item.dificuldade && <Chip>{ROTULO_DIFICULDADE[item.dificuldade]}</Chip>}
                {pergunta.instituicao && (
                  <Chip>
                    {pergunta.instituicao}
                    {pergunta.ano ? ` ${pergunta.ano}` : ""}
                  </Chip>
                )}
                {item.subtopico && <Chip>{item.subtopico}</Chip>}
                {item.tempoSeg != null && (
                  <Chip>
                    <Clock size={11} className="mr-1 inline align-[-1px]" />
                    {fmtSegundosPreciso(item.tempoSeg)}
                  </Chip>
                )}
              </div>

              <div className="mb-4 text-[15px] font-medium leading-relaxed">
                <MathText text={pergunta.enunciado} />
              </div>

              {pergunta.imagem_url && (
                <FiguraQuestao
                  src={pergunta.imagem_url}
                  alt="Imagem da questão"
                  className="mb-4 h-[240px] rounded-xl border border-border p-3"
                />
              )}

              <Alternativas pergunta={pergunta} marcada={item.marcada} />

              {pergunta.resolucao ? (
                <div className="mt-4 rounded-xl border border-questly-green/25 bg-questly-green-light/45 p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-questly-green-dark">
                    <BookOpen size={12} /> Resolução
                  </p>
                  <div className="text-[14px] leading-relaxed">
                    <MathText text={pergunta.resolucao} />
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-muted/50 px-3 py-2.5 text-[12px] font-medium text-muted-foreground">
                  Essa questão ainda não tem resolução escrita no banco.
                </p>
              )}
            </motion.article>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------- rodapé */}
      <footer className="shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-[860px] items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => onIndice(Math.max(indice - 1, 0))}
            disabled={indice <= 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} /> Anterior
          </button>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-questly-green transition-[width] duration-300"
              style={{ width: `${visiveis.length > 0 ? ((indice + 1) / visiveis.length) * 100 : 0}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              indice >= visiveis.length - 1 ? onFechar() : onIndice(Math.min(indice + 1, visiveis.length - 1))
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-3.5 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            {indice >= visiveis.length - 1 ? "Concluir" : "Próxima"}
            <ChevronRight size={15} />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}

function Alternativas({ pergunta, marcada }: { pergunta: Pergunta; marcada: string | null }) {
  const letras = Object.keys(pergunta.alternativas || {}).sort();
  const imagensAlt = pergunta.alternativas_imagens || {};

  return (
    <div className="flex flex-col gap-2">
      {letras.map((letra) => {
        const eGab = letra === pergunta.gabarito;
        const eSua = letra === marcada;
        return (
          <div
            key={letra}
            className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-[14px] ${
              eGab
                ? "border-questly-green/60 bg-questly-green-light"
                : eSua
                  ? "border-questly-red/60 bg-questly-red-light"
                  : "border-border"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-bold ${
                eGab
                  ? "bg-questly-green text-white dark:text-[#0c1512]"
                  : eSua
                    ? "bg-questly-red text-white dark:text-[#2b0a0a]"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {letra.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              {imagensAlt[letra] && (
                <span className="mb-2 flex h-[130px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagensAlt[letra]}
                    alt={`Imagem da alternativa ${letra.toUpperCase()}`}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </span>
              )}
              <MathText text={pergunta.alternativas?.[letra] ?? ""} />
            </span>
            {eGab && <span className="shrink-0 text-[11px] font-bold text-questly-green-dark">Correta</span>}
            {eSua && !eGab && (
              <span className="shrink-0 text-[11px] font-bold text-questly-red-dark">Sua resposta</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}
