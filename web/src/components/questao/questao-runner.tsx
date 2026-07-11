"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MathText } from "@/components/questao/math-text";
import { QUESTLY_MAESTRIA_MULT_XP, questlyXpDaQuestao } from "@/lib/questly/shared";
import {
  aceitarDesafioAction,
  classificarMotivoErroAction,
  finalizarMissaoAction,
  registrarRespostaAction,
  type FinalizarMissaoResultado,
} from "@/lib/questao/actions";
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
  { valor: "conceito", rotulo: "📚 Não sabia o conceito" },
  { valor: "calculo", rotulo: "✏️ Errei a conta" },
  { valor: "interpretacao", rotulo: "🔍 Interpretei errado" },
  { valor: "chute", rotulo: "🎲 Chutei" },
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
}: {
  missao: MissaoResumo;
  perguntas: Pergunta[];
  jaAcertadasAntesIds: string[];
  topicosMestreInicioIds: string[];
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

    const topicIdsDasPerguntas = Array.from(new Set(perguntasState.map((p) => p.topic_id).filter(Boolean))) as string[];

    const resultado = await finalizarMissaoAction({
      missaoId: missao.id,
      subjectId: missao.subject_id,
      recapTopicoId: missao.recap_topico_id,
      avulsa: missao.avulsa,
      acertos,
      erros,
      xpGanho,
      tempoGastoMinMissao: tempoMin,
      topicIdsDasPerguntas,
      topicosMestreInicioIds: Array.from(topicosMestreInicio.current),
    });

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
    <div className="relative mx-auto flex min-h-screen max-w-[900px] flex-col px-6 py-6">
      <FlashOverlay flash={flash} />
      <XpFloatOverlay xpFloat={xpFloat} anchorRef={correctBtnRef} />

      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="shrink-0 text-2xl font-bold text-muted-foreground" title="Sair da missão">
          ×
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-questly-green"
            animate={{ width: `${progressoPct}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
        <div className="shrink-0 min-w-[70px] text-right font-mono text-sm font-bold text-questly-orange-dark">
          +{xpGanho} XP
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="mb-2 font-mono text-xs font-bold text-muted-foreground">
          Pergunta {indiceAtual + 1} de {perguntasState.length}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {pergunta.dificuldade && (
            <span className="rounded-full bg-questly-blue-light px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-questly-blue-dark">
              {pergunta.dificuldade}
            </span>
          )}
          {pergunta.instituicao && (
            <span className="rounded-full bg-questly-blue-light px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-questly-blue-dark">
              {pergunta.instituicao}
              {pergunta.ano ? ` ${pergunta.ano}` : ""}
            </span>
          )}
        </div>

        <div className="mb-7 text-lg font-semibold leading-relaxed">
          <MathText text={pergunta.enunciado} />
        </div>

        {pergunta.imagem_url && (
          <div className="mb-7 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pergunta.imagem_url}
              alt="Imagem da questão"
              loading="lazy"
              className="mx-auto max-h-[340px] max-w-full rounded-2xl border border-border"
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
                className={`relative flex min-h-[68px] cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-4 pr-14 transition-colors ${
                  estado.respondida ? "cursor-default" : "hover:border-questly-blue"
                } ${
                  isCorreta
                    ? "border-questly-green bg-questly-green-light"
                    : isErrada
                      ? "border-questly-red bg-questly-red-light"
                      : selecionada
                        ? "border-questly-blue bg-questly-blue-light"
                        : "border-border bg-card"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-2 font-heading text-sm font-bold ${
                    isCorreta
                      ? "border-questly-green bg-questly-green text-white"
                      : isErrada
                        ? "border-questly-red bg-questly-red text-white"
                        : selecionada
                          ? "border-questly-blue bg-questly-blue text-white"
                          : "border-border bg-muted"
                  }`}
                >
                  {letra.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-[15.5px] font-semibold leading-snug">
                  {imgAlt && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgAlt}
                      alt={`Imagem da alternativa ${letra.toUpperCase()}`}
                      loading="lazy"
                      className="mb-2 block max-h-[170px] max-w-full rounded-xl object-contain"
                      onError={(e) => e.currentTarget.remove()}
                    />
                  )}
                  <MathText text={texto} />
                </span>
                {riscada && (
                  <motion.span
                    className="pointer-events-none absolute left-5 right-14 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-questly-red"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: "left center" }}
                    transition={{ duration: 0.28, ease: [0.16, 0.9, 0.3, 1.05] }}
                  />
                )}
                {!estado.respondida && (
                  <button
                    type="button"
                    title="Marcar como errada"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleRiscar(letra);
                    }}
                    className={`absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-extrabold transition-colors ${
                      riscada
                        ? "border-questly-red bg-questly-red-light text-questly-red-dark"
                        : "border-border bg-card text-muted-foreground hover:border-questly-red hover:bg-questly-red hover:text-white"
                    }`}
                  >
                    ×
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
            className="w-full rounded-2xl bg-questly-green px-6 py-4 font-heading text-[15px] font-semibold text-white shadow-[0_4px_0_var(--questly-green-dark)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:pointer-events-none"
          >
            Confirmar resposta
          </button>
        ) : (
          <FeedbackArea
            pergunta={pergunta}
            estado={estado}
            onClassificarMotivo={classificarMotivo}
          />
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={indiceAtual === 0}
          onClick={() => navegarPara(indiceAtual - 1)}
          className="w-[150px] shrink-0 rounded-2xl border-2 border-border bg-card px-4 py-3.5 font-heading text-sm font-bold text-muted-foreground disabled:opacity-40"
        >
          ← Anterior
        </button>
        <button
          type="button"
          disabled={finalizando}
          onClick={handleProximo}
          className="flex-1 rounded-2xl bg-questly-green px-6 py-3.5 font-heading text-sm font-semibold text-white shadow-[0_4px_0_var(--questly-green-dark)] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          {finalizando
            ? "Finalizando..."
            : indiceAtual < perguntasState.length - 1
              ? "Próxima →"
              : "Finalizar missão →"}
        </button>
      </div>
    </div>
  );
}

function FeedbackArea({
  pergunta,
  estado,
  onClassificarMotivo,
}: {
  pergunta: Pergunta;
  estado: EstadoPergunta;
  onClassificarMotivo: (motivo: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div
        className={`mb-4 flex items-center gap-3 rounded-2xl px-5 py-4 font-heading text-base font-semibold ${
          estado.correta ? "bg-questly-green-light text-questly-green-dark" : "bg-questly-red-light text-questly-red-dark"
        }`}
      >
        <span className="text-2xl">{estado.correta ? "🎯" : "💥"}</span>
        <span>
          {estado.correta ? "Isso aí! Resposta certa." : `Não foi dessa vez — a certa era a ${pergunta.gabarito.toUpperCase()}.`}
        </span>
      </div>

      {pergunta.resolucao && (
        <div className="mb-4 rounded-2xl bg-muted px-5 py-4 text-sm font-semibold leading-relaxed text-muted-foreground">
          <b className="text-foreground">Resolução:</b>
          <br />
          <MathText text={pergunta.resolucao} />
        </div>
      )}

      {!estado.correta && (
        <div>
          <p className="mb-2 text-xs font-extrabold text-muted-foreground">
            Por que você errou? Classificar ajuda a calibrar sua chance de aprovação 🧠
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_ERRO.map((m) => (
              <button
                key={m.valor}
                type="button"
                onClick={() => onClassificarMotivo(m.valor)}
                className={`rounded-full border-2 px-3.5 py-2 text-xs font-extrabold transition-colors ${
                  estado.motivoErro === m.valor
                    ? "border-questly-blue bg-questly-blue-light text-questly-blue-dark"
                    : "border-border bg-card text-muted-foreground hover:border-questly-blue"
                }`}
              >
                {m.rotulo}
              </button>
            ))}
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
                ? "radial-gradient(circle at 50% 30%, rgba(47,196,76,0.18), transparent 60%)"
                : "radial-gradient(circle at 50% 30%, rgba(255,75,75,0.18), transparent 60%)",
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
        className="pointer-events-none fixed z-50 font-heading text-xl font-bold text-questly-gold"
        style={{ left: pos.left, top: pos.top, textShadow: "0 2px 8px rgba(255,200,0,0.4)" }}
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

  let icone = "🎉";
  let titulo = "Missão cumprida!";
  let subtitulo = "Bom progresso. Alguns pontos pra revisar.";

  if (recap) {
    icone = recap.dominou ? "✅" : "📚";
    titulo = recap.dominou ? "Recap aprovado!" : "Ainda vale revisar";
    subtitulo = recap.dominou
      ? "Você provou que domina esse tópico — ele saiu das suas missões. Pode focar no que falta."
      : "Faltou pouco pra fechar o recap — esse tópico continua na sua trilha pra você reforçar.";
  } else if (taxa >= 0.8) {
    icone = "🏆";
    titulo = "Missão dominada!";
    subtitulo = "Mandou muito bem — continue assim.";
  } else if (taxa < 0.5) {
    icone = "💪";
    titulo = "Missão concluída";
    subtitulo = "Foi difícil dessa vez — esses tópicos vão voltar em revisão.";
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full rounded-3xl border border-border bg-card p-9 text-center"
      >
        <div className="mb-2 text-5xl">{icone}</div>
        <h2 className="mb-1 font-heading text-xl font-semibold">{titulo}</h2>
        <p className="mb-6 text-sm font-semibold text-muted-foreground">{subtitulo}</p>

        <div className="mb-2 grid grid-cols-4 gap-2.5">
          <StatBox valor={acertos} label="acertos" cor="text-questly-green-dark" />
          <StatBox valor={erros} label="erros" cor="text-questly-red-dark" />
          <StatBox valor={xpGanho} label="XP ganho" cor="text-questly-orange-dark" />
          <StatBox valor={`${tempoGastoMinMissao} min`} label="tempo gasto" cor="text-questly-blue-dark" />
        </div>
        {tempoPrevistoMin != null && (
          <p className="mb-5 mt-1 text-xs font-semibold text-muted-foreground">previsto: ~{tempoPrevistoMin} min</p>
        )}

        {resultadoExtra && resultadoExtra.novosMestresNomes.length > 0 && (
          <div className="mb-4 rounded-2xl border-2 border-questly-gold bg-questly-gold-light p-4 text-left">
            <div className="mb-1.5 font-heading text-base font-semibold text-questly-gold-dark">
              🏅 Novo distintivo de Mestre!
            </div>
            <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
              Você atingiu 90%+ de acerto em{" "}
              <b className="text-foreground">{resultadoExtra.novosMestresNomes.join(", ")}</b>. A partir de agora,
              questões desse tópico pagam <b className="text-foreground">XP em 1.5x</b> pra manter a coroa.
            </p>
          </div>
        )}

        {resultadoExtra?.desafio && (
          <div className="mb-4 rounded-2xl border-2 border-questly-blue bg-questly-blue-light p-4 text-left">
            <div className="mb-1.5 font-heading text-base font-semibold text-questly-blue-dark">
              🧠 Desafio de Recuperação
            </div>
            <p className="mb-3.5 text-sm font-semibold leading-relaxed text-muted-foreground">
              Você não toca em <b className="text-foreground">{resultadoExtra.desafio.topicoNome}</b> há{" "}
              {resultadoExtra.desafio.diasSemTocar} dias. Resgatar da memória agora é o que fixa de verdade. Topa 1
              questão?
            </p>
            <button
              type="button"
              disabled={desafioAceitando}
              onClick={onAceitarDesafio}
              className="w-full rounded-xl bg-questly-gold px-5 py-2.5 font-heading text-sm font-semibold text-[#5C4700] shadow-[0_3px_0_#D9AB00] disabled:opacity-50"
            >
              {desafioAceitando ? "Preparando..." : "Aceitar desafio ⚡"}
            </button>
          </div>
        )}

        <Link
          href="/dashboard"
          className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-questly-green px-6 py-3.5 font-heading text-sm font-semibold text-white shadow-[0_4px_0_var(--questly-green-dark)]"
        >
          Voltar ao Dashboard
        </Link>
      </motion.div>
    </div>
  );
}

function StatBox({ valor, label, cor }: { valor: string | number; label: string; cor: string }) {
  return (
    <div className="rounded-2xl bg-muted px-2 py-4">
      <div className={`font-mono text-xl font-bold ${cor}`}>{valor}</div>
      <div className="mt-1 text-[10.5px] font-bold text-muted-foreground">{label}</div>
    </div>
  );
}
