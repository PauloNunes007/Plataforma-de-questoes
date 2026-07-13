"use client";

// Cenário do mapa da jornada — gramado, lagos, árvores, pinheiros, moitas,
// pedras, flores e tufos de grama, tudo SVG desenhado (sem asset externo).
// A geração é DETERMINÍSTICA (pseudo-random semeado pelo índice) pra
// paisagem não "pular" entre renders. As cores vêm de CSS vars (--cen-*)
// definidas no wrapper em caminho-jornada.tsx com variante dia/noite
// (dark:), então o mapa inteiro respeita o tema.

type Ponto = { x: number; y: number };

// pseudo-random determinístico [0,1) — mesmo seed, mesma paisagem
function rnd(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function CenarioTrilha({
  largura,
  altura,
  pontos,
}: {
  largura: number;
  altura: number;
  pontos: Ponto[];
}) {
  if (largura <= 0 || pontos.length === 0) return null;

  const decoracoes: React.ReactNode[] = [];

  // ── tufos de grama + flores espalhados pelo gramado inteiro ─────────
  const nTufos = Math.round((largura * altura) / 14000);
  for (let k = 0; k < nTufos; k++) {
    const x = rnd(k * 3 + 1) * largura;
    const y = 18 + rnd(k * 7 + 2) * (altura - 36);
    if (k % 4 === 0) {
      decoracoes.push(<Flor key={`fl-${k}`} x={x} y={y} seed={k} />);
    } else {
      decoracoes.push(<TufoGrama key={`tf-${k}`} x={x} y={y} seed={k} />);
    }
  }

  // ── decorações grandes nos "bolsões" entre um nó e o próximo ────────
  // o caminho serpenteia em torno do centro; o bolsão livre fica no lado
  // espelhado do ponto médio do segmento.
  for (let i = 0; i < pontos.length - 1; i++) {
    const meioY = (pontos[i].y + pontos[i + 1].y) / 2;
    const meioX = (pontos[i].x + pontos[i + 1].x) / 2;
    const bolsaoX = largura - meioX; // lado oposto da curva
    const jx = (rnd(i * 13 + 5) - 0.5) * largura * 0.08;
    const x = Math.min(largura - 56, Math.max(56, bolsaoX + jx));
    const y = meioY + (rnd(i * 17 + 3) - 0.5) * 24;

    switch (i % 5) {
      case 0:
        decoracoes.push(<Arvore key={`d-${i}a`} x={x - 20} y={y} escala={1.05} seed={i} />);
        decoracoes.push(<Arvore key={`d-${i}b`} x={x + 22} y={y + 14} escala={0.8} seed={i + 40} />);
        break;
      case 1:
        decoracoes.push(<Lago key={`d-${i}`} x={x} y={y} seed={i} />);
        break;
      case 2:
        decoracoes.push(<Moita key={`d-${i}a`} x={x - 12} y={y} seed={i} />);
        decoracoes.push(<Pedra key={`d-${i}b`} x={x + 22} y={y + 8} escala={0.9} seed={i + 9} />);
        break;
      case 3:
        decoracoes.push(<Pinheiro key={`d-${i}a`} x={x} y={y} escala={1} seed={i} />);
        decoracoes.push(<Flor key={`d-${i}b`} x={x + 26} y={y + 16} seed={i + 21} />);
        break;
      default:
        decoracoes.push(<Arvore key={`d-${i}a`} x={x} y={y} escala={0.95} seed={i} />);
        decoracoes.push(<Pedra key={`d-${i}b`} x={x - 26} y={y + 14} escala={0.7} seed={i + 31} />);
        break;
    }

    // guarnição nas margens esquerda/direita, alternando
    const mx = i % 2 === 0 ? 16 + rnd(i * 23) * 14 : largura - 16 - rnd(i * 23) * 14;
    if (i % 3 === 0) {
      decoracoes.push(<Pinheiro key={`m-${i}`} x={mx} y={y + 30} escala={0.7} seed={i + 60} />);
    } else {
      decoracoes.push(<Moita key={`m-${i}`} x={mx} y={y + 26} seed={i + 71} />);
    }
  }

  return <g aria-hidden>{decoracoes}</g>;
}

// ── elementos da paisagem ─────────────────────────────────────────────

function TufoGrama({ x, y, seed }: { x: number; y: number; seed: number }) {
  const s = 0.8 + rnd(seed) * 0.6;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`} opacity={0.85}>
      <path d="M0 0 C-1 -4 -3 -6 -4 -7 M0 0 C0 -5 0 -7 0 -9 M0 0 C1 -4 3 -6 4 -7"
        stroke="var(--cen-grama-tufo)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Flor({ x, y, seed }: { x: number; y: number; seed: number }) {
  const cor = rnd(seed * 3) > 0.5 ? "var(--cen-flor-a)" : "var(--cen-flor-b)";
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {[0, 72, 144, 216, 288].map((ang) => (
        <circle
          key={ang}
          cx={Math.cos((ang * Math.PI) / 180) * 2.4}
          cy={Math.sin((ang * Math.PI) / 180) * 2.4}
          r={1.9}
          fill={cor}
        />
      ))}
      <circle r={1.7} fill="var(--cen-flor-miolo)" />
    </g>
  );
}

function Arvore({ x, y, escala, seed }: { x: number; y: number; escala: number; seed: number }) {
  const flip = rnd(seed * 5) > 0.5 ? 1 : -1;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(escala * flip).toFixed(2)} ${escala.toFixed(2)})`}>
      <ellipse cx="0" cy="20" rx="15" ry="4" fill="var(--cen-sombra)" />
      <rect x="-2.5" y="4" width="5" height="17" rx="2.2" fill="var(--cen-tronco)" />
      <circle cx="-7" cy="-2" r="9.5" fill="var(--cen-copa-2)" />
      <circle cx="7" cy="-1" r="9" fill="var(--cen-copa-2)" />
      <circle cx="0" cy="-9" r="11" fill="var(--cen-copa-1)" />
      <circle cx="-3.5" cy="-11" r="3" fill="var(--cen-copa-brilho)" opacity="0.5" />
    </g>
  );
}

function Pinheiro({ x, y, escala, seed }: { x: number; y: number; escala: number; seed: number }) {
  const flip = rnd(seed * 7) > 0.5 ? 1 : -1;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(escala * flip).toFixed(2)} ${escala.toFixed(2)})`}>
      <ellipse cx="0" cy="22" rx="12" ry="3.5" fill="var(--cen-sombra)" />
      <rect x="-2" y="12" width="4" height="10" rx="1.8" fill="var(--cen-tronco)" />
      <path d="M0 -18 L11 0 L-11 0 Z" fill="var(--cen-copa-1)" />
      <path d="M0 -8 L13 9 L-13 9 Z" fill="var(--cen-copa-2)" />
      <path d="M0 -18 L5 -10 L-5 -10 Z" fill="var(--cen-copa-brilho)" opacity="0.35" />
    </g>
  );
}

function Moita({ x, y, seed }: { x: number; y: number; seed: number }) {
  const s = 0.8 + rnd(seed * 11) * 0.5;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`}>
      <ellipse cx="0" cy="7" rx="13" ry="3" fill="var(--cen-sombra)" />
      <circle cx="-6" cy="0" r="6.5" fill="var(--cen-copa-2)" />
      <circle cx="6" cy="1" r="5.5" fill="var(--cen-copa-2)" />
      <circle cx="0" cy="-3" r="6.5" fill="var(--cen-copa-1)" />
    </g>
  );
}

function Pedra({ x, y, escala, seed }: { x: number; y: number; escala: number; seed: number }) {
  const flip = rnd(seed * 13) > 0.5 ? 1 : -1;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(escala * flip).toFixed(2)} ${escala.toFixed(2)})`}>
      <ellipse cx="0" cy="6" rx="11" ry="3" fill="var(--cen-sombra)" />
      <path d="M-9 6 Q-10 -2 -3 -5 Q4 -8 8 -2 Q11 3 7 6 Z" fill="var(--cen-pedra)" />
      <path d="M-6 5 Q-7 0 -2 -3 L0 -4 Q-4 1 -3 5 Z" fill="var(--cen-pedra-luz)" opacity="0.6" />
    </g>
  );
}

function Lago({ x, y, seed }: { x: number; y: number; seed: number }) {
  const s = 0.9 + rnd(seed * 17) * 0.4;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`}>
      <ellipse cx="0" cy="0" rx="46" ry="19" fill="var(--cen-agua-borda)" />
      <ellipse cx="0" cy="-1" rx="41" ry="16" fill="var(--cen-agua)" />
      <ellipse cx="-10" cy="-5" rx="14" ry="4.5" fill="var(--cen-agua-luz)" opacity="0.7" />
      <path d="M8 3 q5 -2.5 10 0" stroke="var(--cen-agua-luz)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M-20 6 q4 -2 8 0" stroke="var(--cen-agua-luz)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* vitória-régia */}
      <circle cx="22" cy="-4" r="3.4" fill="var(--cen-copa-1)" />
      <path d="M22 -4 L26 -6 L25.4 -2.6 Z" fill="var(--cen-agua)" />
    </g>
  );
}
