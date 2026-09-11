"use client";

// Radar "Taxa de acerto por área".
//
// Regras seguidas (skill ui-ux-pro-max, domínio chart → Multi-Variable
// Comparison): no máximo 8 eixos (acima disso vira ilegível — o recorte já
// corta em 8), UMA série com preenchimento translúcido, e a alternativa em
// BARRAS é obrigatória, não opcional: radar é nota B de acessibilidade e a
// leitura precisa de valor exato mora na barra. O botão de alternar fica no
// cabeçalho do cartão, como no material de referência.
//
// Cor: um só tom (o verde da marca em degradê pro azul) pro polígono; o
// arco-íris do material de referência foi recusado de propósito — hue por
// eixo sugere categoria onde só existe intensidade. O STATUS (bom/atenção/
// crítico) aparece no rótulo de cada eixo, que é texto, não cor sozinha.

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChartColumnBig, Hexagon } from "lucide-react";
import type { AreaDesempenho } from "@/lib/dashboard/desempenho-calc";
import { MIN_AMOSTRA_AREA } from "@/lib/dashboard/desempenho-calc";

// A caixa é mais LARGA que alta de propósito: os rótulos dos eixos laterais
// ("Álgebra Linear", "Fundamentos de Cálculo…") saem pra fora do polígono e
// eram cortados na borda quando o SVG era quadrado.
const LARG = 440;
const ALT = 320;
const CX = LARG / 2;
const CY = ALT / 2 + 2;
const RAIO = 112;
/** distância dos rótulos, em % do raio */
const RAIO_ROTULO = 126;
const ANEIS = [25, 50, 75, 100];

function statusDe(pct: number): "bom" | "atencao" | "critico" {
  if (pct >= 70) return "bom";
  if (pct >= 50) return "atencao";
  return "critico";
}

const CLASSE_STATUS: Record<"bom" | "atencao" | "critico", string> = {
  bom: "text-questly-green-dark dark:text-questly-green",
  atencao: "text-questly-gold-dark",
  critico: "text-questly-red-dark",
};

const COR_STATUS: Record<"bom" | "atencao" | "critico", string> = {
  bom: "var(--color-questly-green)",
  atencao: "var(--color-questly-gold)",
  critico: "var(--color-questly-red)",
};

export function RadarAreas({ areas, media }: { areas: AreaDesempenho[]; media: number | null }) {
  const [modo, setModo] = useState<"radar" | "barras">("radar");
  const usaveis = areas.filter((a) => a.total >= MIN_AMOSTRA_AREA);

  return (
    <section className="surface flex flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">
            Taxa de acerto por área
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            Só entram áreas com {MIN_AMOSTRA_AREA}+ questões no período — abaixo disso é ruído, não
            desempenho.
          </p>
        </div>
        <div className="flex shrink-0 rounded-xl border border-border p-0.5">
          <BotaoModo
            ativo={modo === "radar"}
            onClick={() => setModo("radar")}
            rotulo="Ver como radar"
            icone={<Hexagon size={15} strokeWidth={2.1} />}
          />
          <BotaoModo
            ativo={modo === "barras"}
            onClick={() => setModo("barras")}
            rotulo="Ver como barras"
            icone={<ChartColumnBig size={15} strokeWidth={2.1} />}
          />
        </div>
      </div>

      {usaveis.length === 0 ? (
        <p className="rounded-xl bg-muted/50 px-4 py-8 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          Nenhuma área alcançou {MIN_AMOSTRA_AREA} questões neste período ainda. Responda mais
          algumas e o mapa aparece.
        </p>
      ) : modo === "radar" && usaveis.length >= 3 ? (
        <Radar areas={usaveis} media={media} />
      ) : (
        <Barras areas={usaveis} />
      )}

      {modo === "radar" && usaveis.length > 0 && usaveis.length < 3 && (
        <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
          O radar precisa de pelo menos 3 áreas — com menos, as barras dizem mais.
        </p>
      )}
    </section>
  );
}

function BotaoModo({
  ativo,
  onClick,
  rotulo,
  icone,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  icone: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${
        ativo
          ? "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icone}
    </button>
  );
}

function Radar({ areas, media }: { areas: AreaDesempenho[]; media: number | null }) {
  const semMovimento = useReducedMotion();
  const n = areas.length;

  const ponto = (i: number, valor: number) => {
    const ang = (-90 + (360 * i) / n) * (Math.PI / 180);
    const r = (RAIO * Math.max(0, Math.min(100, valor))) / 100;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)] as const;
  };

  const poligono = (valor: number | ((i: number) => number)) =>
    Array.from({ length: n }, (_, i) => {
      const v = typeof valor === "function" ? valor(i) : valor;
      const [x, y] = ponto(i, v);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  const serie = poligono((i) => areas[i].pct);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${LARG} ${ALT}`} className="h-auto w-full" role="img"
        aria-label={`Taxa de acerto por área: ${areas.map((a) => `${a.nome} ${a.pct}%`).join(", ")}`}>
        <defs>
          <linearGradient id="radar-preenche" x1="0" y1="0" x2={LARG} y2={ALT} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-questly-green)" stopOpacity="0.42" />
            <stop offset="1" stopColor="var(--color-questly-blue)" stopOpacity="0.34" />
          </linearGradient>
        </defs>

        {/* grade: anéis + raios, tudo em hairline recessivo */}
        {ANEIS.map((a) => (
          <polygon
            key={a}
            points={poligono(a)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={a === 100 ? 1.4 : 1}
          />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = ponto(i, 100);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
        })}

        {/* referência: a média do próprio aluno no período */}
        {media != null && (
          <polygon
            points={poligono(media)}
            fill="none"
            stroke="var(--color-muted-foreground)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.65"
          />
        )}

        {/* a série */}
        <motion.polygon
          points={serie}
          fill="url(#radar-preenche)"
          stroke="var(--color-questly-green)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          initial={semMovimento ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* vértices + rótulos */}
        {areas.map((a, i) => {
          const [px, py] = ponto(i, a.pct);
          const [lx, ly] = ponto(i, RAIO_ROTULO);
          const ancora = lx > CX + 8 ? "start" : lx < CX - 8 ? "end" : "middle";
          return (
            <g key={a.nome}>
              <circle cx={px} cy={py} r="4.5" fill={COR_STATUS[statusDe(a.pct)]} stroke="var(--card)" strokeWidth="2">
                <title>{`${a.nome}: ${a.pct}% (${a.acertos} de ${a.total})`}</title>
              </circle>
              <text
                x={lx}
                y={ly - 3}
                textAnchor={ancora}
                className="fill-foreground text-[11px] font-semibold"
              >
                {a.nome.length > 22 ? `${a.nome.slice(0, 21)}…` : a.nome}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor={ancora}
                fill={COR_STATUS[statusDe(a.pct)]}
                className="text-[11.5px] font-bold"
              >
                {a.pct}%
              </text>
            </g>
          );
        })}
      </svg>

      {media != null && (
        <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
          <span aria-hidden className="inline-block h-0 w-6 border-t-2 border-dashed border-muted-foreground" />
          sua média no período: {media}%
        </p>
      )}
    </div>
  );
}

function Barras({ areas }: { areas: AreaDesempenho[] }) {
  const semMovimento = useReducedMotion();
  const ordenadas = [...areas].sort((a, b) => b.pct - a.pct);

  return (
    <ul className="flex flex-col gap-3">
      {ordenadas.map((a, i) => {
        const st = statusDe(a.pct);
        return (
          <li key={a.nome}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-[12.5px] font-semibold">{a.nome}</span>
              <span className="tnum shrink-0 text-[12px] font-medium text-muted-foreground">
                <span className={`font-bold ${CLASSE_STATUS[st]}`}>{a.pct}%</span> · {a.acertos}/
                {a.total}
              </span>
            </div>
            <span className="block h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: COR_STATUS[st] }}
                initial={semMovimento ? false : { width: 0 }}
                animate={{ width: `${a.pct}%` }}
                transition={{ duration: 0.6, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
