"use client";

// Gráfico de evolução da nota nos simulados — SVG puro (sem Chart.js/CDN, mesma
// linha do gráfico do Modo Aprovação). Eixo Y = nota 0..10; X = simulados em
// ordem cronológica. Só faz sentido com ≥2 pontos.
import { useId } from "react";

type Ponto = { nota: number; rotulo: string };

export function EvolucaoChart({ pontos }: { pontos: Ponto[] }) {
  const gradId = useId();
  if (pontos.length < 2) return null;

  const W = 640;
  const H = 200;
  const padX = 32;
  const padY = 22;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const x = (i: number) => padX + (innerW * i) / (pontos.length - 1);
  const y = (nota: number) => padY + innerH * (1 - Math.max(0, Math.min(10, nota)) / 10);

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.nota).toFixed(1)}`).join(" ");
  const area = `${linha} L ${x(pontos.length - 1).toFixed(1)} ${padY + innerH} L ${x(0).toFixed(1)} ${padY + innerH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[420px]" role="img" aria-label="Evolução da nota nos simulados">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-questly-green)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-questly-green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* linhas de grade horizontais (0/5/10) */}
        {[0, 5, 10].map((n) => (
          <g key={n}>
            <line x1={padX} y1={y(n)} x2={W - padX} y2={y(n)} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
            <text x={padX - 8} y={y(n) + 3} textAnchor="end" className="fill-muted-foreground text-[10px] font-medium">
              {n}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradId})`} />
        <path d={linha} fill="none" stroke="var(--color-questly-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {pontos.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.nota)} r="4" fill="var(--color-questly-green)" stroke="var(--background)" strokeWidth="2">
            <title>{`${p.rotulo}: ${p.nota.toFixed(1)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
