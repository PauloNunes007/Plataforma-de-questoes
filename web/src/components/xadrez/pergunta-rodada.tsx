"use client";

import { motion } from "framer-motion";
import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";

// Card da questão da rodada — mesma linguagem visual das alternativas do
// questao-runner (letra em quadrado, verde/vermelho no reveal, shake no
// erro), mais um anel de timer que muda de cor conforme o tempo escorre.

const RAIO_TIMER = 20;
const CIRC_TIMER = 2 * Math.PI * RAIO_TIMER;

export function PerguntaRodada({
  pergunta,
  numeroRodada,
  tempoTotalSeg,
  restanteSeg,
  selecionada,
  respondida,
  travada,
  onResponder,
}: {
  pergunta: Pergunta;
  numeroRodada: number;
  tempoTotalSeg: number;
  restanteSeg: number;
  selecionada: string | null;
  respondida: boolean; // reveal (verde/vermelho) ligado
  travada: boolean; // não aceita mais clique (avaliando/reveal)
  onResponder: (letra: string) => void;
}) {
  const letras = Object.keys(pergunta.alternativas || {}).sort();
  const imagensAlternativas = pergunta.alternativas_imagens || {};

  const fracao = tempoTotalSeg > 0 ? Math.max(0, restanteSeg) / tempoTotalSeg : 0;
  const corTimer =
    fracao > 0.5 ? "var(--questly-green)" : fracao > 0.2 ? "var(--questly-orange)" : "var(--questly-red)";

  return (
    <div className="surface flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="tnum kicker block">Rodada {numeroRodada}</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {pergunta.dificuldade && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {pergunta.dificuldade}
              </span>
            )}
            {pergunta.instituicao && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {pergunta.instituicao}
                {pergunta.ano ? ` ${pergunta.ano}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* anel do timer */}
        <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
          <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
            <circle cx="26" cy="26" r={RAIO_TIMER} fill="none" stroke="var(--muted)" strokeWidth="5" />
            <circle
              cx="26"
              cy="26"
              r={RAIO_TIMER}
              fill="none"
              stroke={corTimer}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRC_TIMER}
              strokeDashoffset={CIRC_TIMER * (1 - fracao)}
              style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s" }}
            />
          </svg>
          <span className="tnum absolute text-[13px] font-bold" style={{ color: corTimer }}>
            {Math.max(0, Math.ceil(restanteSeg))}
          </span>
        </div>
      </div>

      <div className="mb-4 text-[15px] font-medium leading-relaxed tracking-tight sm:text-[15.5px]">
        <MathText text={pergunta.enunciado} />
      </div>

      {pergunta.imagem_url && (
        <div className="mb-4 flex max-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pergunta.imagem_url}
            alt="Imagem da questão"
            loading="lazy"
            className="max-h-[204px] w-full object-contain"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {letras.map((letra, i) => {
          const texto = pergunta.alternativas?.[letra] ?? "";
          const imgAlt = imagensAlternativas[letra];
          const isCorreta = respondida && letra === pergunta.gabarito;
          const isErrada = respondida && letra === selecionada && letra !== pergunta.gabarito;
          const isSelecionada = !respondida && letra === selecionada;

          return (
            <motion.button
              key={`${pergunta.id}-${letra}`}
              type="button"
              disabled={travada}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, x: isErrada ? [0, -7, 6, -4, 2, 0] : 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              onClick={() => onResponder(letra)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                travada ? "cursor-default" : "cursor-pointer hover:border-questly-green/50"
              } ${
                isCorreta
                  ? "border-questly-green/60 bg-questly-green-light"
                  : isErrada
                    ? "border-questly-red/60 bg-questly-red-light"
                    : isSelecionada
                      ? "border-questly-green/60 bg-questly-green-light/50"
                      : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                  isCorreta
                    ? "bg-questly-green text-white"
                    : isErrada
                      ? "bg-questly-red text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {letra.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 text-[13.5px] leading-snug">
                {texto && <MathText text={texto} />}
                {imgAlt && (
                  <span className="mt-1 block max-h-[110px] overflow-hidden rounded-lg border border-border bg-white p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgAlt} alt={`Alternativa ${letra.toUpperCase()}`} loading="lazy" className="max-h-[100px] object-contain" />
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
