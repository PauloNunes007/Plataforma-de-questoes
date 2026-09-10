"use client";

// Medidor da última nota. É o único gráfico do módulo que mostra UM valor só —
// existe porque a primeira pergunta de quem abre a tela ("como eu fui?") merece
// resposta antes de qualquer série temporal, e um número solto de 60px não
// carrega a escala (7,5 de quanto?).
//
// Forma: arco de 260°, escala fixa 0..10 sempre desenhada por inteiro — é a
// trilha completa que informa que 7,5 é 7,5 de 10. Cor é STATUS (as mesmas
// faixas do resto do módulo, PCT_BOM/PCT_ATENCAO convertidos pra nota), e o
// valor está escrito no centro, então a cor nunca é a única informação.

import { useId } from "react";
import { PCT_ATENCAO, PCT_BOM } from "@/lib/simulados/analise";
import { COR_STATUS, type TomStatus } from "./base";

const ABERTURA = 260; // graus varridos pelo arco
const INICIO = 90 + (360 - ABERTURA) / 2; // começa embaixo à esquerda
const R = 52;
const CENTRO = 64;

function ponto(anguloGraus: number, raio: number) {
  const rad = (anguloGraus * Math.PI) / 180;
  return { x: CENTRO + raio * Math.cos(rad), y: CENTRO + raio * Math.sin(rad) };
}

function arco(deGraus: number, ateGraus: number, raio: number): string {
  const a = ponto(deGraus, raio);
  const b = ponto(ateGraus, raio);
  const grande = ateGraus - deGraus > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${raio} ${raio} 0 ${grande} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function tomDaNota(nota: number): TomStatus {
  const pct = nota * 10;
  if (pct >= PCT_BOM) return "bom";
  if (pct >= PCT_ATENCAO) return "atencao";
  return "critico";
}

export function AnelNota({
  nota,
  rotulo = "última nota",
  detalhe,
  tamanho = 128,
}: {
  nota: number;
  rotulo?: string;
  /** linha curta abaixo do número (ex.: "18 de 24 acertos") */
  detalhe?: string;
  tamanho?: number;
}) {
  const gradId = useId();
  const segura = Math.max(0, Math.min(10, nota));
  const tom = tomDaNota(segura);
  const fim = INICIO + (segura / 10) * ABERTURA;

  return (
    <div
      className="relative shrink-0"
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={`${rotulo}: ${segura.toFixed(1)} de 10${detalhe ? `. ${detalhe}` : ""}`}
    >
      <svg viewBox="0 0 128 128" className="h-full w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={COR_STATUS[tom]} stopOpacity="0.55" />
            <stop offset="100%" stopColor={COR_STATUS[tom]} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* trilha completa: é ela que diz que a escala vai até 10 */}
        <path
          d={arco(INICIO, INICIO + ABERTURA, R)}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* marca da metade — referência silenciosa, hairline */}
        <line
          x1={ponto(INICIO + ABERTURA / 2, R - 8).x}
          y1={ponto(INICIO + ABERTURA / 2, R - 8).y}
          x2={ponto(INICIO + ABERTURA / 2, R + 8).x}
          y2={ponto(INICIO + ABERTURA / 2, R + 8).y}
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        {segura > 0.05 && (
          <path
            d={arco(INICIO, fim, R)}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tnum font-heading text-[30px] font-bold leading-none">{segura.toFixed(1)}</span>
        <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">de 10</span>
      </div>

      <span className="absolute inset-x-0 bottom-0 block text-center text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </span>
    </div>
  );
}
