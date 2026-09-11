"use client";

// "Evolução: taxa de acerto" — a curva acumulada do período sobre as barras de
// volume por dia, como no material de referência.
//
// Por que ACUMULADA e não a taxa do dia: a taxa de um dia com 4 questões
// oscila 25 pontos por acaso e desenha uma serra sem significado. A acumulada
// responde a pergunta real ("estou melhorando?") e as barras logo abaixo já
// mostram o peso de cada dia — quem quiser o valor cru do dia lê no hover ou
// na tabela espelho.
//
// Escala Y fixa em 0–100: deixar o eixo respirar faz uma variação de 2 pontos
// parecer um salto. Eixo direito (barras) é rotulado com o máximo do período.

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { BotaoDados, CamadaDica, TabelaEspelho, useDica } from "@/components/simulados/graficos/base";
import type { PontoDia } from "@/lib/dashboard/desempenho-calc";

const W = 700;
const H = 250;
const PAD_E = 38;
const PAD_D = 34;
const PAD_TOPO = 16;
const PAD_BASE = 30;
const LIMITE_MARCADORES = 24;

export function EvolucaoAcerto({ dias }: { dias: PontoDia[] }) {
  const semMovimento = useReducedMotion();
  const { ref, dica, mostrar, esconder } = useDica();
  const [tabela, setTabela] = useState(false);

  return (
    <section className="surface flex flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-2">
            <TrendingUp size={15} strokeWidth={2.1} className="text-questly-green-dark dark:text-questly-green" />
            <h2 className="font-heading text-[15px] font-semibold tracking-tight">
              Evolução: taxa de acerto
            </h2>
          </span>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            A linha é a taxa acumulada no período; as barras, quantas questões você fez em cada dia.
          </p>
        </div>
        {dias.length >= 2 && <BotaoDados aberta={tabela} onToggle={() => setTabela((v) => !v)} />}
      </div>

      {dias.length < 2 ? (
        <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          A curva aparece a partir do segundo dia com questões respondidas — com um dia só não há o
          que comparar.
        </p>
      ) : (
        <>
          <div ref={ref} className="relative -mx-1 overflow-x-auto px-1">
            <Grafico
              dias={dias}
              semMovimento={Boolean(semMovimento)}
              onEntrar={mostrar}
              onSair={esconder}
            />
            <CamadaDica dica={dica} />
          </div>

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Legenda cor="var(--color-questly-green)" forma="linha" rotulo="Taxa acumulada" />
            <Legenda cor="var(--color-questly-blue)" forma="barra" rotulo="Questões no dia" />
          </ul>

          <TabelaEspelho
            aberta={tabela}
            colunas={["Dia", "Questões", "Acertos", "Taxa do dia", "Acumulada"]}
            linhas={dias.map((d) => [d.rotulo, d.questoes, d.acertos, `${d.pctDia}%`, `${d.pctAcumulado}%`])}
          />
        </>
      )}
    </section>
  );
}

function Grafico({
  dias,
  semMovimento,
  onEntrar,
  onSair,
}: {
  dias: PontoDia[];
  semMovimento: boolean;
  onEntrar: (e: { clientX: number; clientY: number }, c: { titulo: string; linhas: string[] }) => void;
  onSair: () => void;
}) {
  const innerW = W - PAD_E - PAD_D;
  const innerH = H - PAD_TOPO - PAD_BASE;
  const maxQuestoes = Math.max(1, ...dias.map((d) => d.questoes));

  const x = (i: number) => PAD_E + (dias.length === 1 ? innerW / 2 : (innerW * i) / (dias.length - 1));
  const y = (pct: number) => PAD_TOPO + innerH * (1 - Math.max(0, Math.min(100, pct)) / 100);

  const linha = dias.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(d.pctAcumulado).toFixed(1)}`).join(" ");
  const area = `${linha} L${x(dias.length - 1).toFixed(1)} ${H - PAD_BASE} L${x(0).toFixed(1)} ${H - PAD_BASE} Z`;

  const larguraBarra = Math.max(4, Math.min(22, innerW / dias.length - 4));
  // Rótulos de dia: só uns poucos, senão viram uma cerca ilegível no celular.
  const passoRotulo = Math.max(1, Math.ceil(dias.length / 7));
  // Marcador em cada ponto só faz sentido enquanto dá pra distinguir um do
  // outro; acima disso a linha vira uma lagarta de bolinhas e some. Passando
  // do teto, só o último ponto (o que carrega o rótulo direto) fica desenhado
  // — o alvo de hover continua existindo em todos.
  const marcadores = dias.length <= LIMITE_MARCADORES;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img"
      aria-label={`Taxa de acerto acumulada de ${dias[0].pctAcumulado}% em ${dias[0].rotulo} a ${dias[dias.length - 1].pctAcumulado}% em ${dias[dias.length - 1].rotulo}`}>
      <defs>
        <linearGradient id="evo-area" x1="0" y1={PAD_TOPO} x2="0" y2={H - PAD_BASE} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-questly-green)" stopOpacity="0.26" />
          <stop offset="1" stopColor="var(--color-questly-green)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grade horizontal + eixo Y em % */}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={PAD_E} y1={y(v)} x2={W - PAD_D} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
          <text x={PAD_E - 8} y={y(v) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] font-medium">
            {v}%
          </text>
        </g>
      ))}

      {/* barras de volume, ancoradas na base */}
      {dias.map((d, i) => {
        const alturaMax = innerH * 0.42;
        const h = (d.questoes / maxQuestoes) * alturaMax;
        return (
          <motion.rect
            key={`b-${d.data}`}
            x={x(i) - larguraBarra / 2}
            width={larguraBarra}
            y={H - PAD_BASE - h}
            height={Math.max(2, h)}
            rx={Math.min(3, larguraBarra / 2)}
            fill="var(--color-questly-blue)"
            opacity="0.3"
            initial={semMovimento ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ transformOrigin: `0px ${H - PAD_BASE}px` }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.015, 0.3) }}
          />
        );
      })}

      <path d={area} fill="url(#evo-area)" />
      <motion.path
        d={linha}
        fill="none"
        stroke="var(--color-questly-green)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={semMovimento ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* pontos + alvo de toque generoso (nada de mira de 3px) */}
      {dias.map((d, i) => (
        <g key={`p-${d.data}`}>
          {(marcadores || i === dias.length - 1) && (
            <circle
              cx={x(i)}
              cy={y(d.pctAcumulado)}
              r={i === dias.length - 1 ? 4.2 : 3.6}
              fill="var(--card)"
              stroke="var(--color-questly-green)"
              strokeWidth="2.4"
            />
          )}
          <rect
            x={x(i) - 14}
            y={PAD_TOPO}
            width="28"
            height={innerH}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={(e) =>
              onEntrar(e, {
                titulo: d.rotulo,
                linhas: [
                  `${d.questoes} questões · ${d.acertos} certas`,
                  `taxa do dia: ${d.pctDia}%`,
                  `acumulada: ${d.pctAcumulado}%`,
                ],
              })
            }
            onMouseLeave={onSair}
          >
            <title>{`${d.rotulo}: ${d.acertos} de ${d.questoes} (${d.pctDia}%), acumulada ${d.pctAcumulado}%`}</title>
          </rect>
        </g>
      ))}

      {/* rótulo direto no último ponto — nunca um número em cada ponto */}
      <text
        x={W - PAD_D}
        y={y(dias[dias.length - 1].pctAcumulado) - 10}
        textAnchor="end"
        className="fill-questly-green-dark text-[12px] font-bold dark:fill-questly-green"
      >
        {dias[dias.length - 1].pctAcumulado}%
      </text>

      {/* eixo X */}
      {dias.map((d, i) =>
        i % passoRotulo === 0 || i === dias.length - 1 ? (
          <text
            key={`x-${d.data}`}
            x={x(i)}
            y={H - 10}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {d.rotulo}
          </text>
        ) : null,
      )}

      <text
        x={W - PAD_D + 6}
        y={H - PAD_BASE + 3.5}
        textAnchor="start"
        className="fill-muted-foreground text-[10px] font-medium"
      >
        0
      </text>
      <text
        x={W - PAD_D + 6}
        y={H - PAD_BASE - innerH * 0.42 + 3.5}
        textAnchor="start"
        className="fill-muted-foreground text-[10px] font-medium"
      >
        {maxQuestoes}
      </text>
    </svg>
  );
}

function Legenda({ cor, forma, rotulo }: { cor: string; forma: "linha" | "barra"; rotulo: string }) {
  return (
    <li className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
      {forma === "linha" ? (
        <span aria-hidden className="inline-block h-[3px] w-6 rounded-full" style={{ background: cor }} />
      ) : (
        <span aria-hidden className="inline-block h-3 w-2.5 rounded-[3px]" style={{ background: cor, opacity: 0.45 }} />
      )}
      {rotulo}
    </li>
  );
}
