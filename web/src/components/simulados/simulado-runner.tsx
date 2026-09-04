"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, ArrowLeft, ArrowRight, CheckCircle2, Flag, Loader2, X } from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import type { SimuladoCompleto } from "@/lib/simulados/simulados-data";
import { finalizarSimuladoAction, salvarRespostasAction } from "@/lib/simulados/actions";

function fmtRelogio(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, "0");
  const sss = String(ss).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}

export function SimuladoRunner({ simulado }: { simulado: SimuladoCompleto }) {
  const router = useRouter();
  const perguntas = simulado.perguntas;

  const deadlineMs = useMemo(
    () => new Date(simulado.iniciado_em).getTime() + simulado.duracao_min * 60_000,
    [simulado.iniciado_em, simulado.duracao_min],
  );

  const [respostas, setRespostas] = useState<Record<string, string>>(simulado.respostas || {});
  const [indice, setIndice] = useState(0);
  const [restanteSeg, setRestanteSeg] = useState(() => Math.max(0, Math.round((deadlineMs - Date.now()) / 1000)));
  const [finalizando, setFinalizando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizouRef = useRef(false);
  // Espelho sempre-atual das respostas: o auto-finalizar do relógio roda a
  // partir de um closure criado no 1º render; sem o ref, entregaria respostas
  // velhas (o aluno perderia o que marcou depois). Atualizado num efeito
  // (fora do render — permitido, ao contrário de escrever ref no corpo).
  const respostasRef = useRef(respostas);
  useEffect(() => {
    respostasRef.current = respostas;
  }, [respostas]);

  // Corrige e encerra no servidor (autoritativo), depois recarrega a página —
  // o Server Component vê status=concluido e renderiza o resultado.
  async function finalizar() {
    if (finalizouRef.current) return;
    finalizouRef.current = true;
    setFinalizando(true);
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    const tempoGastoSeg = Math.min(
      simulado.duracao_min * 60,
      Math.round((Date.now() - new Date(simulado.iniciado_em).getTime()) / 1000),
    );
    await finalizarSimuladoAction(simulado.id, respostasRef.current, tempoGastoSeg);
    router.refresh();
  }

  // Relógio: 1 tick/s. Ao zerar, auto-finaliza com o que estiver marcado.
  useEffect(() => {
    const t = setInterval(() => {
      const rest = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setRestanteSeg(rest);
      if (rest <= 0 && !finalizouRef.current) finalizar();
    }, 1000);
    return () => clearInterval(t);
    // finalizar/respostas capturados por ref/closure; deadline é estável
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineMs]);

  function marcar(questionId: string, letra: string) {
    const proximo = { ...respostas };
    if (proximo[questionId] === letra) delete proximo[questionId]; // toca de novo = desmarca
    else proximo[questionId] = letra;
    setRespostas(proximo);
    // autosave debounced (sem useEffect — evita set-state-in-effect); usa o
    // objeto recém-calculado, não o estado (que só atualiza no próximo render)
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      salvarRespostasAction(simulado.id, proximo);
    }, 1000);
  }

  const pergunta = perguntas[indice];
  const letras = pergunta ? Object.keys(pergunta.alternativas || {}).sort() : [];
  const imagensAlternativas = pergunta?.alternativas_imagens || {};
  const respondidas = Object.keys(respostas).length;
  const critico = restanteSeg <= 300; // < 5min

  if (!pergunta) return null;

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-28 pt-4 sm:px-6">
      {/* Barra superior: título + relógio + progresso */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold">{simulado.titulo}</p>
            <p className="tnum text-[11px] font-medium text-muted-foreground">
              {respondidas}/{perguntas.length} respondidas
            </p>
          </div>
          <div
            className={`tnum inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[15px] font-heading font-bold ${
              critico ? "bg-questly-red-light text-questly-red-dark" : "bg-muted text-foreground"
            }`}
            aria-live="off"
          >
            <AlarmClock size={16} className={critico ? "animate-pulse" : ""} />
            {fmtRelogio(restanteSeg)}
          </div>
        </div>
        {/* barra de progresso */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-questly-green transition-all"
            style={{ width: `${(respondidas / perguntas.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Navegador de questões */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {perguntas.map((p, i) => {
          const feita = Boolean(respostas[p.id]);
          const atual = i === indice;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir pra questão ${i + 1}`}
              aria-current={atual}
              className={`tnum flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-bold transition-colors ${
                atual
                  ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                  : feita
                    ? "border-questly-green/40 bg-questly-green-light text-questly-green-dark"
                    : "border-border bg-card text-muted-foreground hover:border-questly-green/40"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Card da questão */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pergunta.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="surface p-5 sm:p-7"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="tnum text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Questão {indice + 1} de {perguntas.length}
            </span>
            {pergunta.instituicao && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                {pergunta.instituicao}
                {pergunta.ano ? ` ${pergunta.ano}` : ""}
              </span>
            )}
          </div>

          <div className="mb-6 text-[17px] font-medium leading-relaxed tracking-tight sm:text-[18px]">
            <MathText text={pergunta.enunciado} />
          </div>

          {pergunta.imagem_url && (
            <div className="mb-6 flex h-[260px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-3 sm:h-[360px]">
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

          <div className="flex flex-col gap-3">
            {letras.map((letra) => {
              const texto = pergunta.alternativas?.[letra] ?? "";
              const imgAlt = imagensAlternativas[letra];
              const selecionada = respostas[pergunta.id] === letra;
              return (
                <div
                  key={letra}
                  onClick={() => marcar(pergunta.id, letra)}
                  className={`relative flex min-h-[64px] cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-4 transition-colors ${
                    selecionada
                      ? "border-questly-green/60 bg-questly-green-light/60"
                      : "border-border bg-card hover:border-questly-green/50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[14px] font-semibold transition-colors ${
                      selecionada
                        ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {letra.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-normal leading-relaxed sm:text-[16px]">
                    {imgAlt && (
                      <div className="mb-2 flex h-[140px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
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
                </div>
              );
            })}
          </div>

          {/* Navegação prev/next */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={indice === 0}
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft size={15} /> Anterior
            </button>
            {indice < perguntas.length - 1 ? (
              <button
                type="button"
                onClick={() => setIndice((i) => Math.min(perguntas.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
              >
                Próxima <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
              >
                <Flag size={15} /> Finalizar
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Botão finalizar sempre acessível (rodapé) */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="text-sm font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Finalizar e entregar simulado
        </button>
      </div>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {confirmar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => !finalizando && setConfirmar(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="surface w-full max-w-sm p-6"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold">Entregar simulado?</h3>
                {!finalizando && (
                  <button type="button" onClick={() => setConfirmar(false)} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                )}
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Você respondeu <b className="tnum text-foreground">{respondidas}</b> de{" "}
                <b className="tnum text-foreground">{perguntas.length}</b> questões.
                {respondidas < perguntas.length && " As em branco contam como erro."} Depois de entregar,
                não dá pra mudar as respostas.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={finalizando}
                  onClick={() => setConfirmar(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 disabled:opacity-40"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  disabled={finalizando}
                  onClick={finalizar}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:text-[#0c1512]"
                >
                  {finalizando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {finalizando ? "Corrigindo…" : "Entregar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
