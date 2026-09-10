"use client";

// Evolução da nota nos simulados — série única, então UMA cor (a da marca) e
// nenhuma legenda: o título já diz o que a linha é. Eixo Y sempre 0..10 (fixar
// a escala é o que impede uma variação de 0,3 parecer um salto). Traz média
// histórica como referência, rótulo direto só no último ponto (nunca um número
// em cada ponto) e tabela espelho pra ler os valores exatos.

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BotaoDados, CamadaDica, SemDado, TabelaEspelho, useDica } from "./base";

export type PontoEvolucao = {
  id?: string;
  rotulo: string;
  nota: number;
  acertos?: number;
  total?: number;
};

const W = 680;
const H = 232;
const PAD_X = 34;
const PAD_TOPO = 18;
const PAD_BASE = 30;

export function LinhaEvolucao({ pontos }: { pontos: PontoEvolucao[] }) {
  const gradId = useId();
  const router = useRouter();
  const { ref, dica, mostrar, esconder } = useDica();
  const [tabela, setTabela] = useState(false);

  const media = useMemo(
    () => (pontos.length > 0 ? pontos.reduce((s, p) => s + p.nota, 0) / pontos.length : 0),
    [pontos],
  );

  if (pontos.length < 2) {
    return (
      <SemDado>
        A curva de evolução aparece a partir do segundo simulado concluído — com um ponto só não há o que
        comparar.
      </SemDado>
    );
  }

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOPO - PAD_BASE;
  const x = (i: number) => PAD_X + (innerW * i) / (pontos.length - 1);
  const y = (nota: number) => PAD_TOPO + innerH * (1 - Math.max(0, Math.min(10, nota)) / 10);

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.nota).toFixed(1)}`).join(" ");
  const area = `${linha} L ${x(pontos.length - 1).toFixed(1)} ${PAD_TOPO + innerH} L ${x(0).toFixed(1)} ${PAD_TOPO + innerH} Z`;
  const ultimo = pontos[pontos.length - 1];
  const larguraBanda = innerW / Math.max(1, pontos.length - 1);
  // Rótulo do eixo X só cabe em algumas posições quando há muitos simulados.
  const passoRotulo = Math.ceil(pontos.length / 6);

  return (
    <div>
      <div ref={ref} className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[440px]"
          role="img"
          aria-label={`Evolução da nota em ${pontos.length} simulados. Última nota ${ultimo.nota.toFixed(1)} de 10.`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-questly-green)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--color-questly-green)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grade: hairline sólido, um tom acima da superfície */}
          {[0, 5, 10].map((n) => (
            <g key={n}>
              <line
                x1={PAD_X}
                y1={y(n)}
                x2={W - PAD_X}
                y2={y(n)}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
              <text x={PAD_X - 9} y={y(n) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {n}
              </text>
            </g>
          ))}

          {/* média histórica — referência, não série */}
          <line
            x1={PAD_X}
            y1={y(media)}
            x2={W - PAD_X}
            y2={y(media)}
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <text
            x={W - PAD_X}
            y={y(media) - 5}
            textAnchor="end"
            className="fill-muted-foreground text-[9.5px] font-semibold"
          >
            média {media.toFixed(1)}
          </text>

          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={linha}
            fill="none"
            stroke="var(--color-questly-green)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pontos.map((p, i) => {
            const ativo = dica?.titulo === `${p.rotulo} · nota ${p.nota.toFixed(1)}`;
            return (
              <g key={`${p.id ?? i}`}>
                <circle
                  cx={x(i)}
                  cy={y(p.nota)}
                  r={ativo ? 5.5 : 4}
                  fill="var(--color-questly-green)"
                  stroke="var(--card)"
                  strokeWidth="2"
                >
                  <title>{`${p.rotulo}: nota ${p.nota.toFixed(1)}`}</title>
                </circle>
                {/* alvo de toque largo: banda de altura cheia, nunca a mira de 8px */}
                <rect
                  x={x(i) - larguraBanda / 2}
                  y={PAD_TOPO}
                  width={larguraBanda}
                  height={innerH}
                  fill="transparent"
                  className={p.id ? "cursor-pointer" : "cursor-default"}
                  onPointerMove={(e) =>
                    mostrar(e, {
                      titulo: `${p.rotulo} · nota ${p.nota.toFixed(1)}`,
                      linhas: [
                        ...(p.acertos != null && p.total != null ? [`${p.acertos} de ${p.total} acertos`] : []),
                        ...(p.id ? ["Toque para abrir o resultado"] : []),
                      ],
                    })
                  }
                  onPointerLeave={esconder}
                  onClick={() => p.id && router.push(`/simulados/${p.id}`)}
                />
              </g>
            );
          })}

          {/* rótulo direto só no último ponto */}
          <text
            x={x(pontos.length - 1)}
            y={y(ultimo.nota) - 12}
            textAnchor="end"
            className="fill-foreground text-[12px] font-bold"
          >
            {ultimo.nota.toFixed(1)}
          </text>

          {pontos.map((p, i) =>
            i % passoRotulo === 0 || i === pontos.length - 1 ? (
              <text
                key={`r-${p.id ?? i}`}
                x={x(i)}
                y={H - 10}
                textAnchor={i === 0 ? "start" : i === pontos.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[9.5px]"
              >
                {p.rotulo}
              </text>
            ) : null,
          )}
        </svg>
        <CamadaDica dica={dica} />
      </div>

      <div className="mt-3 flex justify-end">
        <BotaoDados aberta={tabela} onToggle={() => setTabela((v) => !v)} />
      </div>
      <TabelaEspelho
        aberta={tabela}
        colunas={["Simulado", "Nota", "Acertos"]}
        linhas={pontos.map((p) => [
          p.rotulo,
          p.nota.toFixed(1),
          p.acertos != null && p.total != null ? `${p.acertos}/${p.total}` : "—",
        ])}
      />
    </div>
  );
}
