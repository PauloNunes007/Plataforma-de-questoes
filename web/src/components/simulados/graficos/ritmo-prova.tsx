"use client";

// Ritmo da prova — quanto tempo cada questão custou, na ordem em que ela foi
// aplicada, com a cor dizendo se deu acerto, erro ou branco.
//
// É o gráfico que mostra o que a nota esconde: as três questões que comeram
// metade da prova, o bloco de erros rápidos no fim (correria) e as em branco
// que ficaram sem tempo. A linha de referência é o ritmo disponível
// (duração ÷ número de questões) — aritmética explícita, não predição.

import { useMemo, useState } from "react";
import type { QuestaoAnalisada, StatusQuestao } from "@/lib/simulados/analise";
import { fmtSegundosPreciso } from "@/lib/simulados/analise";
import {
  BotaoDados,
  CamadaDica,
  COR_STATUS,
  LegendaStatus,
  SemDado,
  TabelaEspelho,
  type TomStatus,
  useDica,
} from "./base";

const TOM_POR_STATUS: Record<StatusQuestao, TomStatus> = {
  acerto: "bom",
  erro: "critico",
  branco: "neutro",
};

const ROTULO_STATUS: Record<StatusQuestao, string> = {
  acerto: "Acertou",
  erro: "Errou",
  branco: "Em branco",
};

const H = 190;
const PAD_TOPO = 16;
const PAD_BASE = 24;
const PAD_ESQ = 40;

/** Barra ancorada na base com só o topo arredondado (4px). */
function barraTopo(x: number, y: number, w: number, h: number, base: number): string {
  const r = Math.min(4, w / 2, h);
  if (h <= 0.5) return `M ${x} ${base} L ${x + w} ${base}`;
  return `M ${x} ${base} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${base} Z`;
}

export function RitmoProva({
  questoes,
  duracaoMin,
}: {
  questoes: QuestaoAnalisada[];
  duracaoMin: number;
}) {
  const { ref, dica, mostrar, esconder } = useDica();
  const [tabela, setTabela] = useState(false);

  const comTempo = useMemo(() => questoes.filter((q) => q.tempoSeg != null && q.tempoSeg > 0), [questoes]);

  if (comTempo.length < 3) {
    return (
      <SemDado>
        O ritmo é medido enquanto você resolve. Simulados feitos antes dessa medição — ou entregues muito
        rápido — não têm esse detalhamento; o próximo já terá.
      </SemDado>
    );
  }

  const ritmoDisponivel = (duracaoMin * 60) / Math.max(1, questoes.length);
  const maxSeg = Math.max(...comTempo.map((q) => q.tempoSeg || 0), ritmoDisponivel);
  const W = Math.max(360, questoes.length * 26);
  const innerH = H - PAD_TOPO - PAD_BASE;
  const base = PAD_TOPO + innerH;
  const passo = (W - PAD_ESQ - 8) / questoes.length;
  const largura = Math.max(4, passo - 2); // folga de 2px entre barras vizinhas
  const alturaDe = (seg: number) => (seg / maxSeg) * innerH;
  const yRef = base - alturaDe(ritmoDisponivel);

  const presentes = new Set(questoes.map((q) => q.status));

  return (
    <div>
      <div ref={ref} className="relative w-full">
        <div className="rolagem-x">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            style={{ minWidth: Math.min(W, 560) }}
            role="img"
            aria-label={`Tempo gasto em cada uma das ${questoes.length} questões, na ordem da prova.`}
          >
            {/* eixo do tempo: base + a referência de ritmo */}
            <line x1={PAD_ESQ} y1={base} x2={W - 4} y2={base} stroke="currentColor" strokeOpacity="0.16" strokeWidth="1" />
            <line
              x1={PAD_ESQ}
              y1={yRef}
              x2={W - 4}
              y2={yRef}
              stroke="currentColor"
              strokeOpacity="0.32"
              strokeWidth="1"
            />
            <text x={PAD_ESQ - 6} y={yRef + 3.5} textAnchor="end" className="fill-muted-foreground text-[9.5px]">
              {Math.round(ritmoDisponivel / 60) >= 1
                ? `${Math.round(ritmoDisponivel / 60)}min`
                : `${Math.round(ritmoDisponivel)}s`}
            </text>
            <text x={PAD_ESQ - 6} y={base + 3.5} textAnchor="end" className="fill-muted-foreground text-[9.5px]">
              0
            </text>

            {questoes.map((q, i) => {
              const x = PAD_ESQ + i * passo + (passo - largura) / 2;
              const seg = q.tempoSeg || 0;
              const h = seg > 0 ? Math.max(2, alturaDe(seg)) : 0;
              const tom = TOM_POR_STATUS[q.status];
              return (
                <g key={q.id}>
                  {h > 0 && (
                    <path d={barraTopo(x, base - h, largura, h, base)} fill={COR_STATUS[tom]} opacity={q.status === "branco" ? 0.45 : 1}>
                      <title>{`Questão ${q.numero} — ${ROTULO_STATUS[q.status]} em ${fmtSegundosPreciso(seg)}`}</title>
                    </path>
                  )}
                  {/* alvo de toque de altura cheia */}
                  <rect
                    x={PAD_ESQ + i * passo}
                    y={PAD_TOPO}
                    width={passo}
                    height={innerH}
                    fill="transparent"
                    onPointerMove={(e) =>
                      mostrar(e, {
                        titulo: `Questão ${q.numero} · ${ROTULO_STATUS[q.status]}`,
                        linhas: [
                          seg > 0 ? `Tempo: ${fmtSegundosPreciso(seg)}` : "Sem tempo registrado",
                          q.topico,
                        ],
                      })
                    }
                    onPointerLeave={esconder}
                  />
                </g>
              );
            })}

            {/* números do eixo X, esparsos pra não colidir */}
            {questoes.map((q, i) =>
              i === 0 || i === questoes.length - 1 || (i + 1) % 5 === 0 ? (
                <text
                  key={`n-${q.id}`}
                  x={PAD_ESQ + i * passo + passo / 2}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {q.numero}
                </text>
              ) : null,
            )}
          </svg>
        </div>
          {/* A dica mora FORA do trilho que rola: dentro dele, o balão (que
              sobe acima do gráfico) transbordava e o cartão ganhava uma barra
              de rolagem VERTICAL fantasma — o filete que aparecia no cartão.
              A posição continua certa porque `useDica` mede a partir deste
              contêiner, que não rola. */}
        <CamadaDica dica={dica} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <LegendaStatus
          itens={(["acerto", "erro", "branco"] as StatusQuestao[])
            .filter((s) => presentes.has(s))
            .map((s) => ({ tom: TOM_POR_STATUS[s], rotulo: ROTULO_STATUS[s] }))}
        />
        <BotaoDados aberta={tabela} onToggle={() => setTabela((v) => !v)} />
      </div>
      <p className="mt-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
        A linha marca o ritmo disponível: {fmtSegundosPreciso(ritmoDisponivel)} por questão em{" "}
        {duracaoMin} minutos de prova. Barra acima dela é questão que consumiu o tempo de outra.
      </p>

      <TabelaEspelho
        aberta={tabela}
        colunas={["Questão", "Resultado", "Tempo"]}
        linhas={questoes.map((q) => [
          `${q.numero}. ${q.topico}`,
          ROTULO_STATUS[q.status],
          fmtSegundosPreciso(q.tempoSeg),
        ])}
      />
    </div>
  );
}
