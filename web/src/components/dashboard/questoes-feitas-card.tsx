"use client";

// "Questões feitas" — o medidor de pontaria da vida toda.
//
// **Repasse de 2026-09-16.** Queixa direta do dono: no desktop o cartão estava
// GIGANTE e mal distribuído — um anel de 236px e duas caixinhas de legenda
// numa coluna estreita, o que empurrava meia tela de vazio pra pouca
// informação. A correção não foi encolher o anel e pronto; foi mudar a FORMA:
//
//   • o cartão virou uma FAIXA horizontal de largura inteira (ele já não
//     precisa mais preencher a altura de uma coluna — a missão do dia, que
//     era o vizinho alto, deixou de existir);
//   • o anel tem tamanho fixo e modesto (132px) e mora à esquerda, como o
//     ícone-resumo da faixa — não como a ilustração principal da home;
//   • o espaço que sobrou virou INFORMAÇÃO, não margem: três mostradores em
//     linha (respondidas / acertos / erros) no padrão fintech — rótulo
//     pequeno em caixa alta, número grande tabular, variação em %;
//   • o centro do anel mostra o % DE ACERTO, não o total. O total já é um dos
//     mostradores ao lado, e repetir o mesmo número duas vezes na mesma faixa
//     era metade do "pouca informação".
//
// **Forma.** Não é uma pizza de 2 fatias (a skill de dataviz proíbe, e com
// razão): é um MEDIDOR radial — um arco de acerto sobre um leito de erro. A
// leitura é "o quanto do círculo eu acerto", não "compare estas duas fatias".
//
// **Cor.** A paleta é própria do anel (`.anel-paleta` em globals.css), não os
// tokens do tema: eles são profundos de propósito (contraste de TEXTO) e
// ficavam apagados num traço grosso. Os valores foram validados em claro e
// escuro — banda de luminosidade, piso de croma, separação para daltonismo e
// contraste; o laudo está no comentário de `.anel-paleta`. O vinho, em vez do
// vermelho-tijolo do tema, é o que dá separação para deuteranopia.
//
// Acessibilidade: o % vive no centro em texto; cada mostrador repete número e
// % por escrito com ícone próprio; e a barra 100% no rodapé é a alternativa
// empilhada ao anel. Nada aqui depende de enxergar cor nem de acertar um hover.

import { motion, useReducedMotion } from "framer-motion";
import { CircleCheck, CircleX, Target } from "lucide-react";
import type { HeroDados } from "@/lib/dashboard/hero-data";

const R = 52;
const TRACO = 18;
const C = 2 * Math.PI * R;
const BOX = 132;
const CENTRO = BOX / 2;

export function QuestoesFeitasCard({ hero }: { hero: HeroDados }) {
  const semMovimento = useReducedMotion();
  const total = hero.totalQuestoes;
  const fracAcerto = total > 0 ? hero.acertos / total : 0;
  const pctErro = total > 0 ? 100 - hero.pctAcerto : 0;
  const arcoAcerto = C * fracAcerto;

  return (
    <section className="surface anel-paleta @container p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target size={15} strokeWidth={2.1} className="text-questly-green-dark dark:text-questly-green" />
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">Questões feitas</h2>
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Desde o início
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-3 rounded-xl bg-muted/50 px-4 py-6 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          O anel acende assim que você responder a primeira questão — ele divide tudo que já
          respondeu entre acertos e erros.
        </p>
      ) : (
        <div className="mt-3.5 flex flex-col items-center gap-4 @[30rem]:flex-row @[30rem]:items-center @[30rem]:gap-6">
          {/* Anel de tamanho FIXO: ele é o resumo visual da faixa, não a
              ilustração principal da home. Crescer com a largura era o que
              fazia o cartão comer meia tela no desktop. */}
          <div className="relative h-[132px] w-[132px] shrink-0">
            <svg viewBox={`0 0 ${BOX} ${BOX}`} className="h-full w-full">
              <defs>
                {/* Gradiente do arco: um só matiz, claro → fundo. É o que dá
                    volume ao traço grosso sem inventar uma segunda cor (e sem
                    virar aquele degradê arco-íris de dashboard genérico). */}
                <linearGradient id="anel-acerto" x1="10" y1="10" x2="122" y2="122" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--anel-acerto-claro)" />
                  <stop offset="1" stopColor="var(--anel-acerto-fundo)" />
                </linearGradient>
                <linearGradient id="anel-erro" x1="122" y1="10" x2="10" y2="122" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--anel-erro-claro)" />
                  <stop offset="1" stopColor="var(--anel-erro-fundo)" />
                </linearGradient>
              </defs>

              <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
                {/* Leito = a parte errada. Volta inteira por baixo: o arco de
                    acerto cobre a fração certa e o que sobra JÁ É o erro — sem
                    dois arcos concorrendo pelo mesmo pixel. */}
                <circle cx={CENTRO} cy={CENTRO} r={R} fill="none" stroke="url(#anel-erro)" strokeWidth={TRACO}>
                  <title>{`Erros: ${hero.erros} de ${total} (${pctErro}%)`}</title>
                </circle>

                {/* Folga na cor da superfície sob o arco (a "2px surface gap"
                    da skill): sem ela a ponta arredondada do verde parece
                    derretida em cima do vinho. */}
                <motion.circle
                  cx={CENTRO}
                  cy={CENTRO}
                  r={R}
                  fill="none"
                  stroke="var(--card)"
                  strokeWidth={TRACO}
                  strokeLinecap="round"
                  strokeDasharray={`${arcoAcerto} ${C - arcoAcerto}`}
                  initial={semMovimento ? false : { strokeDasharray: `0 ${C}` }}
                  animate={{ strokeDasharray: `${arcoAcerto} ${C - arcoAcerto}` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  aria-hidden
                />

                <motion.circle
                  cx={CENTRO}
                  cy={CENTRO}
                  r={R}
                  fill="none"
                  stroke="url(#anel-acerto)"
                  strokeWidth={TRACO - 3}
                  strokeLinecap="round"
                  strokeDasharray={`${arcoAcerto} ${C - arcoAcerto}`}
                  initial={semMovimento ? false : { strokeDasharray: `0 ${C}` }}
                  animate={{ strokeDasharray: `${arcoAcerto} ${C - arcoAcerto}` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <title>{`Acertos: ${hero.acertos} de ${total} (${hero.pctAcerto}%)`}</title>
                </motion.circle>
              </g>

              <text
                x={CENTRO}
                y={CENTRO + 2}
                textAnchor="middle"
                className="tnum fill-foreground font-heading"
                style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {hero.pctAcerto}%
              </text>
              <text
                x={CENTRO}
                y={CENTRO + 17}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                de acerto
              </text>
            </svg>
          </div>

          {/* Os mostradores. No desktop eles ocupam a largura que antes era
              vazio; no celular viram três colunas estreitas embaixo do anel. */}
          <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
            <div className="grid grid-cols-3 gap-2 @[30rem]:gap-3">
              <Mostrador rotulo="Respondidas" valor={total} />
              <Mostrador
                icone={<CircleCheck size={13} strokeWidth={2.4} />}
                rotulo="Acertos"
                valor={hero.acertos}
                pct={hero.pctAcerto}
                tom="bom"
              />
              <Mostrador
                icone={<CircleX size={13} strokeWidth={2.4} />}
                rotulo="Erros"
                valor={hero.erros}
                pct={pctErro}
                tom="ruim"
              />
            </div>

            {/* Barra 100% — a alternativa acessível ao anel (regra da skill:
                donut/medidor exige fallback empilhado). */}
            <span
              className="flex h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--anel-erro-fundo)" }}
              role="img"
              aria-label={`${hero.pctAcerto}% de acerto em ${total} questões respondidas.`}
            >
              <span
                className="h-full rounded-full"
                style={{
                  width: `${hero.pctAcerto}%`,
                  background: "var(--anel-acerto-fundo)",
                  boxShadow: "0 0 0 2px var(--card)",
                }}
              />
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function Mostrador({
  icone,
  rotulo,
  valor,
  pct,
  tom,
}: {
  icone?: React.ReactNode;
  rotulo: string;
  valor: number;
  pct?: number;
  tom?: "bom" | "ruim";
}) {
  const cor = tom === "bom" ? "var(--anel-acerto-fundo)" : tom === "ruim" ? "var(--anel-erro-fundo)" : undefined;
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <span className="flex items-center gap-1.5">
        {icone && <span style={{ color: cor }}>{icone}</span>}
        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
      </span>
      <span className="mt-1 flex items-baseline gap-1.5">
        <span className="tnum font-heading text-[21px] font-bold leading-none">
          {valor.toLocaleString("pt-BR")}
        </span>
        {pct != null && <span className="tnum text-[11.5px] font-bold text-muted-foreground">{pct}%</span>}
      </span>
    </div>
  );
}
