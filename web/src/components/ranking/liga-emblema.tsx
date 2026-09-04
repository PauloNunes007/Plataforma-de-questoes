"use client";

import { useId } from "react";
import type { Liga } from "@/lib/questly/liga";

// Escudo ALADO heráldico por liga (SVG vetorial, brilho/bisel metálico) — a
// peça de identidade "profissional" do ranking, pedida a partir dos prints da
// plataforma de referência. Sem imagem raster: escala nítido em qualquer
// tamanho e troca de cor por liga via gradientes. `useId` garante ids de
// gradiente únicos quando vários emblemas renderizam na mesma tela.
type Tons = { claro: string; medio: string; escuro: string; brilho: string };

const CORES: Record<Liga, Tons> = {
  bronze: { claro: "#e0a973", medio: "#a86a34", escuro: "#5e3416", brilho: "#f6cfa1" },
  prata: { claro: "#eef2f6", medio: "#aab6c2", escuro: "#6b7885", brilho: "#ffffff" },
  ouro: { claro: "#f8da85", medio: "#d4a017", escuro: "#8a6510", brilho: "#fff3c6" },
  platina: { claro: "#aae8f3", medio: "#46b6cc", escuro: "#1c7791", brilho: "#dcf7fd" },
  diamante: { claro: "#dccbff", medio: "#a78bfa", escuro: "#6321c9", brilho: "#f1e9ff" },
};

export function LigaEmblema({
  liga,
  size = 88,
  className = "",
}: {
  liga: Liga;
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const c = CORES[liga];
  const gShield = `sh-${uid}`;
  const gWing = `wg-${uid}`;
  const gGem = `gm-${uid}`;
  const gGloss = `gl-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Emblema da liga ${liga}`}
    >
      <defs>
        <linearGradient id={gShield} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.claro} />
          <stop offset="0.5" stopColor={c.medio} />
          <stop offset="1" stopColor={c.escuro} />
        </linearGradient>
        <linearGradient id={gWing} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.brilho} />
          <stop offset="1" stopColor={c.medio} />
        </linearGradient>
        <radialGradient id={gGem} cx="0.5" cy="0.38" r="0.7">
          <stop offset="0" stopColor={c.brilho} />
          <stop offset="0.55" stopColor={c.claro} />
          <stop offset="1" stopColor={c.escuro} />
        </radialGradient>
        <linearGradient id={gGloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Asas (esquerda + espelhada) atrás do escudo */}
      {[1, -1].map((lado) => (
        <g key={lado} transform={lado === -1 ? "translate(120,0) scale(-1,1)" : undefined}>
          <path
            d="M58 40 C40 34 22 36 8 50 C24 48 30 52 34 58 C24 56 20 60 16 66 C30 62 36 66 40 72 C33 72 30 76 28 82 C42 72 54 66 60 62 Z"
            fill={`url(#${gWing})`}
            stroke={c.escuro}
            strokeWidth="1"
            strokeLinejoin="round"
            opacity="0.96"
          />
          {/* nervuras das penas */}
          <path
            d="M52 45 C38 43 27 46 18 54 M50 55 C38 54 31 57 25 63 M50 64 C40 64 35 67 31 72"
            fill="none"
            stroke={c.escuro}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.35"
          />
        </g>
      ))}

      {/* Escudo */}
      <path
        d="M60 20 L92 30 L92 58 C92 82 78 96 60 104 C42 96 28 82 28 58 L28 30 Z"
        fill={`url(#${gShield})`}
        stroke={c.escuro}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* borda interna clara (bisel) */}
      <path
        d="M60 27 L86 34.5 L86 58 C86 78 74 90 60 97 C46 90 34 78 34 58 L34 34.5 Z"
        fill="none"
        stroke={c.brilho}
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* brilho superior */}
      <path
        d="M60 27 L86 34.5 L86 52 C74 46 46 46 34 52 L34 34.5 Z"
        fill={`url(#${gGloss})`}
        opacity="0.5"
      />

      {/* Gema/estrela central */}
      <g transform="translate(60 60)">
        <path
          d="M0 -17 L4.9 -5.3 L17 -5.3 L7.1 2.6 L11 14.5 L0 7.2 L-11 14.5 L-7.1 2.6 L-17 -5.3 L-4.9 -5.3 Z"
          fill={`url(#${gGem})`}
          stroke={c.escuro}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M0 -17 L4.9 -5.3 L0 0 Z" fill="#ffffff" opacity="0.5" />
      </g>
    </svg>
  );
}
