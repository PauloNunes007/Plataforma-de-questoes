"use client";

// "Questões feitas" — o medidor de pontaria da vida toda.
//
// **Repasse de 2026-09-11 (3).** O cartão mudou de vizinho: ele agora mora
// EMBAIXO do atalho de Simulados, na mesma coluna. O motivo é geométrico —
// quando há prova em andamento o cartão de Simulados vira três linhas e um
// botão, e sobrava meia coluna de vazio ao lado da missão do dia. O anel
// preenche esse vazio, e a dupla até faz sentido junta: "como fui na prova"
// em cima, "como venho indo no geral" embaixo.
//
// Por isso o layout virou ANFÍBIO, e a chave é a largura, não a tela:
// empilhado (anel em cima, números embaixo) quando a coluna é estreita;
// lado a lado (anel à esquerda, números à direita) assim que ela abre. O
// `h-full` + `flex-1` fazem o cartão esticar até o pé da coluna, que é o
// ponto todo da mudança.
//
// **Repasse de 2026-09-11 (2).** Duas queixas, uma resposta:
//
// 1. *O cartão ocupava meia home pra mostrar três números.* Ele saiu da grade
//    larga e virou um cartão de coluna estreita. O VETOR não encolheu (é a
//    marca visual do cartão) — o que encolheu foi tudo em volta: a legenda
//    desceu pra baixo do anel em vez de disputar largura com ele, os dois
//    blocos de acerto/erro viraram uma linha só de duas colunas, e a frase
//    explicativa saiu (o número no centro e os dois rótulos já dizem tudo).
//
// 2. *As cores eram sem vida.* Os tokens do tema são propositalmente
//    profundos (contraste de TEXTO, ver o tema claro fintech) e ficavam
//    apagados num traço grosso. O anel agora tem paleta própria, só pra ele:
//    escolhida contra a superfície do cartão e VALIDADA (validate_palette.js
//    da skill de dataviz) em claro e escuro — banda de luminosidade, piso de
//    croma, separação para daltonismo e contraste — os valores exatos e o
//    laudo do validador estão no comentário de `.anel-paleta` em
//    globals.css. O vinho, em vez do vermelho-tijolo do tema, é o que
//    dá a separação para deuteranopia — vermelho e verde de mesma
//    luminosidade viram a MESMA cor pra quem não distingue os dois.
//
// **Forma.** Não é uma pizza de 2 fatias (a skill de dataviz proíbe, e com
// razão): é um MEDIDOR radial — um arco de acerto sobre um leito de erro. A
// leitura é "o quanto do círculo eu acerto", não "compare estas duas fatias".
//
// Acessibilidade: o valor vive no centro em texto; a legenda repete número e
// % por escrito com ícone próprio; e a barra 100% embaixo é a alternativa
// empilhada. Nada aqui depende de enxergar cor nem de acertar um hover.

import { motion, useReducedMotion } from "framer-motion";
import { CircleCheck, CircleX, Target } from "lucide-react";
import type { HeroDados } from "@/lib/dashboard/hero-data";

const R = 74;
const TRACO = 26;
const C = 2 * Math.PI * R;

export function QuestoesFeitasCard({ hero }: { hero: HeroDados }) {
  const semMovimento = useReducedMotion();
  const total = hero.totalQuestoes;
  const fracAcerto = total > 0 ? hero.acertos / total : 0;
  const pctErro = total > 0 ? 100 - hero.pctAcerto : 0;
  const arcoAcerto = C * fracAcerto;

  return (
    <section className="surface anel-paleta @container flex h-full flex-col p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <Target size={15} strokeWidth={2.1} className="text-questly-green-dark dark:text-questly-green" />
        <h2 className="font-heading text-[15px] font-semibold tracking-tight">Questões feitas</h2>
      </div>

      {total === 0 ? (
        <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          O anel acende assim que você responder a primeira questão — ele divide tudo que já
          respondeu entre acertos e erros.
        </p>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3.5 pt-1 @[26rem]:flex-row @[26rem]:gap-5">
          {/* O anel cresce quando a coluna abre: com espaço de sobra, um
              vetor maior é melhor uso do pixel do que margem. */}
          <div className="relative h-[188px] w-[188px] shrink-0 @[26rem]:h-[236px] @[26rem]:w-[236px]">
            <svg viewBox="0 0 188 188" className="h-full w-full">
              <defs>
                {/* Gradiente do arco: um só matiz, claro → fundo. É o que dá
                    volume ao traço grosso sem inventar uma segunda cor (e sem
                    virar aquele degradê arco-íris de dashboard genérico). */}
                <linearGradient id="anel-acerto" x1="14" y1="14" x2="174" y2="174" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--anel-acerto-claro)" />
                  <stop offset="1" stopColor="var(--anel-acerto-fundo)" />
                </linearGradient>
                <linearGradient id="anel-erro" x1="174" y1="14" x2="14" y2="174" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="var(--anel-erro-claro)" />
                  <stop offset="1" stopColor="var(--anel-erro-fundo)" />
                </linearGradient>
              </defs>

              <g transform="rotate(-90 94 94)">
                {/* Leito = a parte errada. Volta inteira por baixo: o arco de
                    acerto cobre a fração certa e o que sobra JÁ É o erro — sem
                    dois arcos concorrendo pelo mesmo pixel. */}
                <circle cx="94" cy="94" r={R} fill="none" stroke="url(#anel-erro)" strokeWidth={TRACO}>
                  <title>{`Erros: ${hero.erros} de ${total} (${pctErro}%)`}</title>
                </circle>

                {/* Folga na cor da superfície sob o arco (a "2px surface gap"
                    da skill): sem ela a ponta arredondada do verde parece
                    derretida em cima do vinho. */}
                <motion.circle
                  cx="94"
                  cy="94"
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
                  cx="94"
                  cy="94"
                  r={R}
                  fill="none"
                  stroke="url(#anel-acerto)"
                  strokeWidth={TRACO - 4}
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
                x="94"
                y="88"
                textAnchor="middle"
                className="tnum fill-foreground font-heading"
                style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {total.toLocaleString("pt-BR")}
              </text>
              <text
                x="94"
                y="104"
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 10.5, fontWeight: 600 }}
              >
                respondidas
              </text>
              <text
                x="94"
                y="121"
                textAnchor="middle"
                className="tnum fill-foreground"
                style={{ fontSize: 12.5, fontWeight: 700 }}
              >
                {hero.pctAcerto}% de acerto
              </text>
            </svg>
          </div>

          {/* A legenda: duas colunas quando está embaixo do anel (coluna
              estreita), duas LINHAS empilhadas quando está ao lado dele —
              nesse caso a largura sobra e o que falta é altura. */}
          <div className="flex w-full min-w-0 flex-col gap-2.5 @[26rem]:max-w-[16rem] @[26rem]:flex-1">
            <div className="grid grid-cols-2 gap-2 @[26rem]:grid-cols-1">
              <Linha
                icone={<CircleCheck size={14} strokeWidth={2.3} />}
                rotulo="Acertos"
                valor={hero.acertos}
                pct={hero.pctAcerto}
                tom="bom"
              />
              <Linha
                icone={<CircleX size={14} strokeWidth={2.3} />}
                rotulo="Erros"
                valor={hero.erros}
                pct={pctErro}
                tom="ruim"
              />
            </div>

            {/* Barra 100% — a alternativa acessível ao anel (regra da skill:
                donut/medidor exige fallback empilhado), e a leitura rápida da
                proporção quando o anel está fora do campo de visão. */}
            <span
              className="flex h-2.5 w-full overflow-hidden rounded-full"
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
  const cor = bom ? "var(--anel-acerto-fundo)" : "var(--anel-erro-fundo)";
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/60 px-2.5 py-2">
      <span className="flex items-center gap-1.5">
        <span style={{ color: cor }}>{icone}</span>
        <span className="truncate text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
      </span>
      <span className="mt-0.5 flex items-baseline gap-1.5">
        <span className="tnum font-heading text-[19px] font-bold leading-tight">
          {valor.toLocaleString("pt-BR")}
        </span>
        <span className="tnum text-[12px] font-bold text-muted-foreground">{pct}%</span>
      </span>
    </div>
  );
}
