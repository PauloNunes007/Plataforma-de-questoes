"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  Crown,
  Dices,
  Dumbbell,
  Lock,
  PartyPopper,
  Search,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import { QuestaoAcoes } from "@/components/questao/questao-acoes";
import { QUESTLY_MAESTRIA_MULT_XP, questlyXpDaQuestao } from "@/lib/questly/shared";
import {
  aceitarDesafioAction,
  classificarMotivoErroAction,
  finalizarMissaoAction,
  registrarRespostaAction,
  type FinalizarMissaoResultado,
} from "@/lib/questao/actions";
import { alternarFavoritoAction, salvarNotaAction } from "@/lib/anotacoes/actions";
import type { MissaoResumo, Pergunta } from "@/lib/questao/types";

type EstadoPergunta = {
  selecionada: string | null;
  respondida: boolean;
  correta: boolean | null;
  riscadas: Set<string>;
  attemptId: string | null;
  motivoErro: string | null;
  xpConcedido: number;
};

const MOTIVOS_ERRO = [
  { valor: "conceito", rotulo: "Não sabia o conceito", icone: BookOpen },
  { valor: "calculo", rotulo: "Errei a conta", icone: Calculator },
  { valor: "interpretacao", rotulo: "Interpretei errado", icone: Search },
  { valor: "chute", rotulo: "Chutei", icone: Dices },
];

function estadoInicial(): EstadoPergunta {
  return {
    selecionada: null,
    respondida: false,
    correta: null,
    riscadas: new Set(),
    attemptId: null,
    motivoErro: null,
    xpConcedido: 0,
  };
}

export function QuestaoRunner({
  missao,
  perguntas,
  jaAcertadasAntesIds,
  topicosMestreInicioIds,
  favoritosIniciaisIds,
  notasIniciais,
  ehPro,
}: {
  missao: MissaoResumo;
  perguntas: Pergunta[];
  jaAcertadasAntesIds: string[];
  topicosMestreInicioIds: string[];
  favoritosIniciaisIds: string[];
  notasIniciais: Record<string, string>;
  ehPro: boolean;
}) {
  const router = useRouter();
  const [perguntasState, setPerguntasState] = useState(perguntas);
  const [estados, setEstados] = useState<EstadoPergunta[]>(() => perguntas.map(estadoInicial));
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [xpGanho, setXpGanho] = useState(0);
  const [view, setView] = useState<"questao" | "resultado">("questao");
  const [finalizando, setFinalizando] = useState(false);
  const [resultadoExtra, setResultadoExtra] = useState<FinalizarMissaoResultado | null>(null);
  const [tempoGastoMinMissao, setTempoGastoMinMissao] = useState(0);
  const [flash, setFlash] = useState<{ tipo: "ok" | "bad"; key: number } | null>(null);
  const [xpFloat, setXpFloat] = useState<{ xp: number; key: number } | null>(null);
  const [desafioAceitando, setDesafioAceitando] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritosIniciaisIds));
  const [notas, setNotas] = useState<Record<string, string>>(notasIniciais);

  const jaAcertadasAntes = useRef(new Set(jaAcertadasAntesIds));
  const topicosMestreInicio = useRef(new Set(topicosMestreInicioIds));
  const tempoInicioMissaoMs = useRef(0);
  const tempoInicioPergunta = useRef(new Map<number, number>());
  const correctBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    tempoInicioMissaoMs.current = Date.now();
  }, []);

  useEffect(() => {
    if (!tempoInicioPergunta.current.has(indiceAtual)) {
      tempoInicioPergunta.current.set(indiceAtual, Date.now());
    }
  }, [indiceAtual]);

  const pergunta = perguntasState[indiceAtual];
  const estado = estados[indiceAtual];

  function atualizarEstado(indice: number, patch: Partial<EstadoPergunta>) {
    setEstados((prev) => prev.map((e, i) => (i === indice ? { ...e, ...patch } : e)));
  }

  function selecionarAlternativa(letra: string) {
    if (estado.respondida) return;
    atualizarEstado(indiceAtual, { selecionada: letra });
  }

  function toggleRiscar(letra: string) {
    if (estado.respondida) return;
    const riscadas = new Set(estado.riscadas);
    if (riscadas.has(letra)) riscadas.delete(letra);
    else riscadas.add(letra);
    atualizarEstado(indiceAtual, { riscadas });
  }

  async function confirmarResposta() {
    if (estado.respondida || !estado.selecionada) return;

    const correta = estado.selecionada === pergunta.gabarito;
    const inicio = tempoInicioPergunta.current.get(indiceAtual) ?? Date.now();
    const tempoSeg = Math.round((Date.now() - inicio) / 1000);

    let xpPergunta = 0;
    if (correta) {
      xpPergunta = questlyXpDaQuestao(pergunta);
      if (jaAcertadasAntes.current.has(pergunta.id)) xpPergunta = Math.max(1, Math.round(xpPergunta / 2));
      if (pergunta.topic_id && topicosMestreInicio.current.has(pergunta.topic_id)) {
        xpPergunta = Math.round(xpPergunta * QUESTLY_MAESTRIA_MULT_XP);
      }
      setAcertos((a) => a + 1);
      setXpGanho((x) => x + xpPergunta);
    } else {
      setErros((e) => e + 1);
    }

    atualizarEstado(indiceAtual, { respondida: true, correta, xpConcedido: xpPergunta });

    if (correta) {
      setFlash({ tipo: "ok", key: Date.now() });
      setXpFloat({ xp: xpPergunta, key: Date.now() });
    } else {
      setFlash({ tipo: "bad", key: Date.now() });
    }

    const resultado = await registrarRespostaAction({
      questionId: pergunta.id,
      topicId: pergunta.topic_id,
      missaoId: missao.id,
      correta,
      tempoSeg,
      respostaMarcada: estado.selecionada,
      tempoMedioAnterior: pergunta.tempo_medio_seg,
    });

    atualizarEstado(indiceAtual, { attemptId: resultado.attemptId });
    if (resultado.novoTempoMedio != null) {
      setPerguntasState((prev) =>
        prev.map((p, i) => (i === indiceAtual ? { ...p, tempo_medio_seg: resultado.novoTempoMedio! } : p)),
      );
    }
  }

  async function classificarMotivo(motivo: string) {
    atualizarEstado(indiceAtual, { motivoErro: motivo });
    if (estado.attemptId) {
      await classificarMotivoErroAction(estado.attemptId, motivo);
    }
  }

  async function toggleFavorito() {
    const id = pergunta.id;
    const eraFavorito = favoritos.has(id);
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (eraFavorito) next.delete(id);
      else next.add(id);
      return next;
    });
    const resultado = await alternarFavoritoAction(id);
    if ("error" in resultado) {
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (eraFavorito) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }

  async function salvarNota(texto: string) {
    const id = pergunta.id;
    setNotas((prev) => ({ ...prev, [id]: texto }));
    await salvarNotaAction(id, texto);
  }

  function navegarPara(indice: number) {
    if (indice < 0 || indice >= perguntasState.length) return;
    setIndiceAtual(indice);
  }

  async function handleProximo() {
    if (indiceAtual >= perguntasState.length - 1) {
      await finalizarMissao();
    } else {
      navegarPara(indiceAtual + 1);
    }
  }

  async function finalizarMissao() {
    setFinalizando(true);
    const tempoMin = Math.max(1, Math.round((Date.now() - tempoInicioMissaoMs.current) / 60000));
    setTempoGastoMinMissao(tempoMin);

    const resultado = await finalizarMissaoAction({
      missaoId: missao.id,
      tempoGastoMinMissao: tempoMin,
      topicosMestreInicioIds: Array.from(topicosMestreInicio.current),
    });

    // O servidor é a autoridade: XP/acertos/erros são recomputados lá a partir
    // das tentativas reais. A tela de resultado mostra o que foi de fato
    // concedido (o placar local era só otimista/imediato).
    setAcertos(resultado.placar.acertos);
    setErros(resultado.placar.erros);
    setXpGanho(resultado.placar.xpGanho);
    setResultadoExtra(resultado);
    setFinalizando(false);
    setView("resultado");
  }

  async function aceitarDesafio() {
    if (!resultadoExtra?.desafio) return;
    setDesafioAceitando(true);
    const { missaoId } = await aceitarDesafioAction({
      subjectId: resultadoExtra.desafio.subjectId,
      topicoId: resultadoExtra.desafio.topicoId,
      questaoId: resultadoExtra.desafio.questaoId,
      tempoMedioSeg: resultadoExtra.desafio.tempoMedioSeg,
      dificuldade: resultadoExtra.desafio.dificuldade,
    });
    if (missaoId) {
      router.push(`/questao?missao=${missaoId}`);
    } else {
      setDesafioAceitando(false);
    }
  }

  if (view === "resultado") {
    return (
      <ResultView
        acertos={acertos}
        erros={erros}
        xpGanho={xpGanho}
        tempoGastoMinMissao={tempoGastoMinMissao}
        tempoPrevistoMin={missao.tempo_previsto_min}
        resultadoExtra={resultadoExtra}
        desafioAceitando={desafioAceitando}
        onAceitarDesafio={aceitarDesafio}
      />
    );
  }

  const letras = Object.keys(pergunta.alternativas || {}).sort();
  const imagensAlternativas = pergunta.alternativas_imagens || {};
  const progressoPct = ((indiceAtual + 1) / perguntasState.length) * 100;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-[980px] flex-col px-4 py-4 sm:px-6 sm:py-6">
      <FlashOverlay flash={flash} />
      <XpFloatOverlay xpFloat={xpFloat} anchorRef={correctBtnRef} />

      <div className="mb-6 flex items-center gap-3 sm:gap-4">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sair da missão"
        >
          <X size={18} strokeWidth={2} />
        </Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-questly-green"
            animate={{ width: `${progressoPct}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
        <div className="tnum flex shrink-0 items-center gap-1 text-xs font-semibold text-questly-gold-dark sm:text-[13px]">
          <Zap size={13} strokeWidth={2} />
          +{xpGanho} XP
        </div>
      </div>

      <div className="surface relative overflow-hidden rounded-2xl p-5 sm:p-10">
        <div className="tnum kicker mb-2">
          Pergunta {indiceAtual + 1} de {perguntasState.length}
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {pergunta.dificuldade && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              {pergunta.dificuldade}
            </span>
          )}
          {pergunta.instituicao && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              {pergunta.instituicao}
              {pergunta.ano ? ` ${pergunta.ano}` : ""}
            </span>
          )}
          {pergunta.subtopico && (
            <span className="rounded-full bg-questly-blue-light px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-questly-blue-dark">
              {pergunta.subtopico}
            </span>
          )}
        </div>

        <QuestaoAcoes
          key={pergunta.id}
          questionId={pergunta.id}
          resolucao={pergunta.resolucao}
          favoritado={favoritos.has(pergunta.id)}
          notaInicial={notas[pergunta.id] ?? null}
          onToggleFavorito={toggleFavorito}
          onSalvarNota={salvarNota}
        />

        <div className="mb-7 text-[18px] font-medium leading-relaxed tracking-tight sm:text-[19px]">
          <MathText text={pergunta.enunciado} />
        </div>

        {pergunta.imagem_url && (
          <div className="mb-7 flex h-[280px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-3 sm:h-[380px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pergunta.imagem_url}
              alt="Imagem da questão"
              loading="lazy"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div className="mb-7 flex flex-col gap-3">
          {letras.map((letra, i) => {
            const texto = pergunta.alternativas?.[letra] ?? "";
            const imgAlt = imagensAlternativas[letra];
            const riscada = estado.riscadas.has(letra);
            const selecionada = estado.selecionada === letra && !estado.respondida;
            const isCorreta = estado.respondida && letra === pergunta.gabarito;
            const isErrada = estado.respondida && letra === estado.selecionada && letra !== pergunta.gabarito;

            return (
              <motion.div
                key={letra}
                ref={isCorreta ? correctBtnRef : undefined}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: isErrada ? [0, -8, 7, -5, 3, 0] : 0,
                }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => !estado.respondida && selecionarAlternativa(letra)}
                className={`relative flex min-h-[68px] cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-4 pr-13 transition-colors ${
                  estado.respondida ? "cursor-default" : "hover:border-questly-green/50"
                } ${
                  isCorreta
                    ? "border-questly-green/60 bg-questly-green-light"
                    : isErrada
                      ? "border-questly-red/60 bg-questly-red-light"
                      : selecionada
                        ? "border-questly-green/60 bg-questly-green-light/50"
                        : "border-border bg-card"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[14px] font-semibold transition-colors ${
                    isCorreta
                      ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                      : isErrada
                        ? "border-transparent bg-questly-red text-white dark:text-[#2b0a0a]"
                        : selecionada
                          ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                          : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {letra.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-[15.5px] font-normal leading-relaxed sm:text-[16px]">
                  {imgAlt && (
                    <div className="mb-2 flex h-[150px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgAlt}
                        alt={`Imagem da alternativa ${letra.toUpperCase()}`}
                        loading="lazy"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <MathText text={texto} />
                </span>
                {riscada && (
                  <motion.span
                    className="pointer-events-none absolute left-4 right-13 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-questly-red"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: "left center" }}
                    transition={{ duration: 0.28, ease: [0.16, 0.9, 0.3, 1.05] }}
                  />
                )}
                {!estado.respondida && (
                  <button
                    type="button"
                    title="Riscar alternativa"
                    aria-label={`Riscar alternativa ${letra.toUpperCase()}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleRiscar(letra);
                    }}
                    className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                      riscada
                        ? "bg-questly-red-light text-questly-red-dark"
                        : "text-muted-foreground/50 hover:bg-questly-red-light hover:text-questly-red-dark"
                    }`}
                  >
                    <X size={15} strokeWidth={2.25} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {!estado.respondida ? (
          <button
            type="button"
            disabled={!estado.selecionada}
            onClick={confirmarResposta}
            className="w-full cursor-pointer rounded-xl bg-questly-green px-6 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 dark:text-[#0c1512]"
          >
            Confirmar resposta
          </button>
        ) : (
          <FeedbackArea
            pergunta={pergunta}
            estado={estado}
            onClassificarMotivo={classificarMotivo}
            ehPro={ehPro}
          />
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={indiceAtual === 0}
          onClick={() => navegarPara(indiceAtual - 1)}
          className="inline-flex w-[110px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 sm:w-[150px]"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Anterior
        </button>
        <button
          type="button"
          disabled={finalizando}
          onClick={handleProximo}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-green px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 dark:text-[#0c1512]"
        >
          {finalizando
            ? "Finalizando..."
            : indiceAtual < perguntasState.length - 1
              ? "Próxima"
              : "Finalizar missão"}
          {!finalizando && <ArrowRight size={15} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

function FeedbackArea({
  pergunta,
  estado,
  onClassificarMotivo,
  ehPro,
}: {
  pergunta: Pergunta;
  estado: EstadoPergunta;
  onClassificarMotivo: (motivo: string) => void;
  ehPro: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div
        className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3.5 text-[14.5px] font-medium ${
          estado.correta
            ? "bg-questly-green-light text-questly-green-dark"
            : "bg-questly-red-light text-questly-red-dark"
        }`}
      >
        {estado.correta ? (
          <CheckCircle2 size={20} strokeWidth={2} className="shrink-0" />
        ) : (
          <XCircle size={20} strokeWidth={2} className="shrink-0" />
        )}
        <span>
          {estado.correta
            ? "Isso aí! Resposta certa."
            : `Não foi dessa vez — a certa era a ${pergunta.gabarito.toUpperCase()}.`}
        </span>
      </div>

      {pergunta.resolucao && (
        <div className="mb-4 rounded-xl bg-muted/60 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          <b className="font-semibold text-foreground">Resolução:</b>
          <br />
          <MathText text={pergunta.resolucao} />
        </div>
      )}

      {!estado.correta && !ehPro && (
        <Link
          href="/pro"
          className="flex items-center gap-2 rounded-xl border border-questly-gold/30 bg-questly-gold/10 px-3.5 py-2.5 text-xs font-medium text-questly-gold transition-colors hover:bg-questly-gold/20"
        >
          <Lock size={13} strokeWidth={2} />
          <span>
            <b className="font-semibold">Autópsia do erro</b> é do Pro: descubra por que errou (conceito,
            cálculo, interpretação ou chute) e corrija o padrão.
          </span>
        </Link>
      )}

      {!estado.correta && ehPro && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Brain size={13} strokeWidth={1.75} />
            Por que você errou? Classificar ajuda a calibrar sua chance de aprovação.
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_ERRO.map((m) => {
              const Icone = m.icone;
              const ativo = estado.motivoErro === m.valor;
              return (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => onClassificarMotivo(m.valor)}
                  aria-pressed={ativo}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    ativo
                      ? "border-questly-green/50 bg-questly-green-light text-questly-green-dark"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icone size={12} strokeWidth={1.75} />
                  {m.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FlashOverlay({ flash }: { flash: { tipo: "ok" | "bad"; key: number } | null }) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.key}
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            background:
              flash.tipo === "ok"
                ? "radial-gradient(circle at 50% 30%, rgba(45,212,160,0.15), transparent 60%)"
                : "radial-gradient(circle at 50% 30%, rgba(220,71,71,0.15), transparent 60%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </AnimatePresence>
  );
}

function XpFloatOverlay({
  xpFloat,
  anchorRef,
}: {
  xpFloat: { xp: number; key: number } | null;
  anchorRef: RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!xpFloat) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    setPos(rect ? { left: rect.right - 60, top: rect.top } : { left: 0, top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpFloat]);

  if (!xpFloat) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={xpFloat.key}
        className="tnum pointer-events-none fixed z-50 font-heading text-lg font-semibold text-questly-gold"
        style={{ left: pos.left, top: pos.top, textShadow: "0 2px 10px rgba(201,147,10,0.35)" }}
        initial={{ opacity: 0, y: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1, 0], y: -70, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        +{xpFloat.xp} XP
      </motion.div>
    </AnimatePresence>
  );
}

function ResultView({
  acertos,
  erros,
  xpGanho,
  tempoGastoMinMissao,
  tempoPrevistoMin,
  resultadoExtra,
  desafioAceitando,
  onAceitarDesafio,
}: {
  acertos: number;
  erros: number;
  xpGanho: number;
  tempoGastoMinMissao: number;
  tempoPrevistoMin: number | null;
  resultadoExtra: FinalizarMissaoResultado | null;
  desafioAceitando: boolean;
  onAceitarDesafio: () => void;
}) {
  const total = acertos + erros;
  const taxa = total > 0 ? acertos / total : 0;
  const recap = resultadoExtra?.recapResultado;

  let Icone = PartyPopper;
  let corIcone = "text-questly-green";
  let bgIcone = "bg-questly-green-light";
  let titulo = "Missão cumprida!";
  let subtitulo = "Bom progresso. Alguns pontos pra revisar.";

  if (recap) {
    Icone = recap.dominou ? CheckCircle2 : BookOpen;
    corIcone = recap.dominou ? "text-questly-green" : "text-questly-orange";
    bgIcone = recap.dominou ? "bg-questly-green-light" : "bg-questly-orange-light";
    titulo = recap.dominou ? "Recap aprovado!" : "Ainda vale revisar";
    subtitulo = recap.dominou
      ? "Você provou que domina esse tópico — ele saiu das suas missões. Pode focar no que falta."
      : "Faltou pouco pra fechar o recap — esse tópico continua na sua trilha pra você reforçar.";
  } else if (taxa >= 0.8) {
    Icone = Trophy;
    corIcone = "text-questly-gold";
    bgIcone = "bg-questly-gold-light";
    titulo = "Missão dominada!";
    subtitulo = "Mandou muito bem — continue assim.";
  } else if (taxa < 0.5) {
    Icone = Dumbbell;
    corIcone = "text-questly-orange";
    bgIcone = "bg-questly-orange-light";
    titulo = "Missão concluída";
    subtitulo = "Foi difícil dessa vez — esses tópicos vão voltar em revisão.";
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface w-full p-5 text-center sm:p-9"
      >
        <span className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${bgIcone}`}>
          <Icone size={26} strokeWidth={1.75} className={corIcone} />
        </span>
        <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight">{titulo}</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{subtitulo}</p>

        <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox valor={acertos} label="acertos" cor="text-questly-green-dark" />
          <StatBox valor={erros} label="erros" cor="text-questly-red-dark" />
          <StatBox valor={xpGanho} label="XP ganho" cor="text-questly-gold-dark" />
          <StatBox valor={`${tempoGastoMinMissao} min`} label="tempo gasto" cor="text-questly-blue-dark" />
        </div>
        {tempoPrevistoMin != null && (
          <p className="tnum mb-5 mt-1 text-xs text-muted-foreground">previsto: ~{tempoPrevistoMin} min</p>
        )}

        {resultadoExtra && resultadoExtra.novosMestresNomes.length > 0 && (
          <div className="surface-gold mb-4 rounded-xl p-4 text-left">
            <div className="mb-1.5 flex items-center gap-2 text-[14.5px] font-semibold text-questly-gold-dark">
              <Crown size={16} strokeWidth={2} />
              Novo distintivo de Mestre!
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Você atingiu 90%+ de acerto em{" "}
              <b className="font-medium text-foreground">{resultadoExtra.novosMestresNomes.join(", ")}</b>. A
              partir de agora, questões desse tópico pagam{" "}
              <b className="font-medium text-foreground">XP em 1.5×</b> pra manter a coroa.
            </p>
          </div>
        )}

        {resultadoExtra?.desafio && (
          <div className="mb-4 rounded-xl border border-questly-purple/30 bg-questly-purple/5 p-4 text-left">
            <div className="mb-1.5 flex items-center gap-2 text-[14.5px] font-semibold text-questly-purple">
              <Brain size={16} strokeWidth={2} />
              Desafio de Recuperação
            </div>
            <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">
              Você não toca em{" "}
              <b className="font-medium text-foreground">{resultadoExtra.desafio.topicoNome}</b> há{" "}
              {resultadoExtra.desafio.diasSemTocar} dias. Resgatar da memória agora é o que fixa de verdade.
              Topa 1 questão?
            </p>
            <button
              type="button"
              disabled={desafioAceitando}
              onClick={onAceitarDesafio}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-purple px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              <Zap size={14} strokeWidth={2} />
              {desafioAceitando ? "Preparando..." : "Aceitar desafio"}
            </button>
          </div>
        )}

        <Link
          href="/dashboard"
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-questly-green px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          Voltar ao Dashboard
        </Link>
      </motion.div>
    </div>
  );
}

function StatBox({ valor, label, cor }: { valor: string | number; label: string; cor: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-3.5">
      <div className={`tnum font-heading text-lg font-semibold tracking-tight ${cor}`}>{valor}</div>
      <div className="mt-0.5 text-[10.5px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
