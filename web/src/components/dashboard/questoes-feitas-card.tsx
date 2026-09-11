"use client";

// "Questões feitas" — o anel de acertos/erros da vida toda.
//
// Repasse de 2026-09-11: o anel de antes era um fio de 6px e sumia na tela.
// Aqui ele é a MARCA do cartão — 26px de traço sobre um raio de 74, com os
// dois arcos separados por um vão real (nada de dois semicírculos colados que
// viram um borrão), ponta arredondada, gradiente no traço e um halo suave por
// baixo pra dar volume sem virar 3D de clip-art.
//
// Acessibilidade (regra `color-not-only` + `direct-labeling` da skill): o
// valor vive no CENTRO em texto, e a legenda ao lado repete número e % por
// escrito com um marcador de forma. Nada aqui depende de enxergar cor nem de
// acertar um hover.

import { motion, useReducedMotion } from "framer-motion";
import { CircleCheck, CircleX, PieChart } from "lucide-react";
import type { HeroDados } from "@/lib/dashboard/hero-data";

const R = 74;
const TRACO = 26;
const C = 2 * Math.PI * R;
/** vão entre os arcos, em fração da volta (≈6°) */
const VAO = 0.017;

export function QuestoesFeitasCard({ hero }: { hero: HeroDados }) {
  const semMovimento = useReducedMotion();
  const total = hero.totalQuestoes;
  const fracAcerto = total > 0 ? hero.acertos / total : 0;
  const pctErro = total > 0 ? 100 - hero.pctAcerto : 0;

  // Com 100% de um lado o vão não existe — senão o anel "abre" sem motivo.
  const soUmLado = total > 0 && (hero.acertos === 0 || hero.erros === 0);
  const vao = soUmLado ? 0 : VAO;
  const arcoVerde = Math.max(0, C * (fracAcerto - vao));
  const arcoVermelho = Math.max(0, C * (1 - fracAcerto - vao));
  const giroVermelho = fracAcerto * 360 + vao * 360;

  return (
    <section className="surface flex flex-col p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <PieChart size={15} strokeWidth={2.1} className="text-questly-green-dark dark:text-questly-green" />
        <h2 className="font-heading text-[15px] font-semibold tracking-tight">Questões feitas</h2>
      </div>

      {total === 0 ? (
        <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          O anel acende assim que você responder a primeira questão — ele divide tudo que já
          respondeu entre acertos e erros.
        </p>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2 sm:flex-row sm:gap-6">
          <div className="relative h-[188px] w-[188px] shrink-0">
            <svg viewBox="0 0 188 188" className="h-full w-full">
              <defs>
                <linearGradient id="anel-acerto" x1="0" y1="0" x2="188" y2="188" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--color-questly-green)" />
                  <stop offset="1" stopColor="var(--color-questly-green-deep)" />
                </linearGradient>
                <linearGradient id="anel-erro" x1="188" y1="0" x2="0" y2="188" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--color-questly-red)" />
                  <stop offset="1" stopColor="var(--color-questly-red-dark)" />
                </linearGradient>
              </defs>

              {/* leito do anel: dá o volume sem depender de sombra */}
              <circle
                cx="94"
                cy="94"
                r={R}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={TRACO}
                opacity="0.7"
              />

              <g transform="rotate(-90 94 94)">
                <motion.circle
                  cx="94"
                  cy="94"
                  r={R}
                  fill="none"
                  stroke="url(#anel-acerto)"
                  strokeWidth={TRACO}
                  strokeLinecap={soUmLado ? "butt" : "round"}
                  strokeDasharray={`${arcoVerde} ${C - arcoVerde}`}
                  initial={semMovimento ? false : { strokeDasharray: `0 ${C}` }}
                  animate={{ strokeDasharray: `${arcoVerde} ${C - arcoVerde}` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <title>{`Acertos: ${hero.acertos} de ${total} (${hero.pctAcerto}%)`}</title>
                </motion.circle>

                <motion.circle
                  cx="94"
                  cy="94"
                  r={R}
                  fill="none"
                  stroke="url(#anel-erro)"
                  strokeWidth={TRACO}
                  strokeLinecap={soUmLado ? "butt" : "round"}
                  strokeDasharray={`${arcoVermelho} ${C - arcoVermelho}`}
                  transform={`rotate(${giroVermelho} 94 94)`}
                  initial={semMovimento ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                >
                  <title>{`Erros: ${hero.erros} de ${total} (${pctErro}%)`}</title>
                </motion.circle>
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
              <span className="tnum font-heading text-[30px] font-bold leading-none tracking-tight">
                {total.toLocaleString("pt-BR")}
              </span>
              <span className="mt-1 text-[10.5px] font-semibold leading-tight text-muted-foreground">
                questões
                <br />
                respondidas
              </span>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2.5">
            <Linha
              icone={<CircleCheck size={15} strokeWidth={2.2} />}
              rotulo="Acertos"
              valor={hero.acertos}
              pct={hero.pctAcerto}
              tom="bom"
            />
            <Linha
              icone={<CircleX size={15} strokeWidth={2.2} />}
              rotulo="Erros"
              valor={hero.erros}
              pct={pctErro}
              tom="ruim"
            />

            {/* Barra 100% — a alternativa acessível ao anel (regra da skill:
                donut exige fallback empilhado). Também é ela que dá a leitura
                rápida da proporção quando o anel está fora do campo de visão. */}
            <div className="mt-1">
              <span className="flex h-3 w-full overflow-hidden rounded-full bg-questly-red">
                <span
                  className="h-full bg-questly-green"
                  style={{ width: `${hero.pctAcerto}%` }}
                />
              </span>
              <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
                Você acerta <span className="font-bold text-foreground">{hero.pctAcerto}%</span> do
                que responde — cerca de {Math.round(hero.pctAcerto / 10)} a cada 10 questões.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Linha({
  icone,
  rotulo,
  valor,
  pct,
  tom,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: number;
  pct: number;
  tom: "bom" | "ruim";
}) {
  const bom = tom === "bom";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          bom
            ? "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
            : "bg-questly-red-light text-questly-red-dark"
        }`}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
        <span className="tnum block font-heading text-[19px] font-bold leading-tight">
          {valor.toLocaleString("pt-BR")}
        </span>
      </span>
      <span
        className={`tnum shrink-0 rounded-lg px-2 py-1 text-[12.5px] font-bold ${
          bom
            ? "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
            : "bg-questly-red-light text-questly-red-dark"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}
