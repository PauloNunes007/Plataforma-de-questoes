"use client";

// ESTATÍSTICAS DA QUESTÃO — "como a plataforma foi nesta questão".
//
// Duas perguntas, um desenho: quantos acertam (o anel) e onde os outros caem
// (as cápsulas). O dado vem agregado de `vw_distribuicao_respostas`
// (supabase_estatisticas_questao.sql) sob demanda — ver
// lib/questao/estatisticas.ts pra por que não vem junto com a lista.
//
// REGRAS HERDADAS DO SISTEMA DE GRÁFICOS DO APP
// (components/simulados/graficos/base.tsx — as mesmas, de propósito: o app não
// precisa de um segundo idioma de gráfico):
//
//   * SVG na mão, sem lib de chart;
//   * cor é STATUS, nunca hue por categoria. Aqui são três papéis e só três:
//     VERDE = o gabarito, ÂMBAR = o distrator que mais pega gente, CINZA = o
//     resto. Cinco alternativas em cinco cores seria arco-íris decorativo;
//   * nenhum valor mora só no hover: cada cápsula tem o percentual escrito ao
//     lado e o `title` traz a contagem absoluta;
//   * estado vazio honesto — amostra pequena não vira gráfico bonito de duas
//     barras, vira uma frase dizendo que ainda não dá pra dizer.
//
// O QUE O DESENHO ACRESCENTA AO "GRÁFICO DE BARRAS"
//
//   * a marca do CHUTE (hairline vertical em 100/n %): é a referência que
//     transforma "37% marcaram a C" em informação — acima dela, o distrator
//     está atraindo gente de verdade; abaixo, é ruído de chute. Mesmo papel da
//     marca da metade no anel de nota dos simulados;
//   * a cápsula do gabarito é mais alta e tem brilho próprio, então a
//     alternativa certa se acha sem ler nada;
//   * a "pegadinha" é nomeada. Saber que metade da turma caiu na mesma
//     armadilha é o que muda o estudo depois do erro — e é o tipo de coisa que
//     um gráfico genérico deixa o aluno deduzir sozinho.

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, Check, Clock, Target, Users } from "lucide-react";
import { carregarEstatisticasQuestaoAction } from "@/lib/questao/actions";
import {
  EST_MIN_AMOSTRA,
  type EstatisticasQuestao,
  type FatiaAlternativa,
} from "@/lib/questao/estatisticas";

// ---------------------------------------------------------------------------
// anel de acerto — escala fixa 0..100%, sempre desenhada por inteiro
// ---------------------------------------------------------------------------

const ABERTURA = 260; // graus varridos (mesma abertura do anel de nota)
const INICIO = 90 + (360 - ABERTURA) / 2;
const R = 50;
const CENTRO = 64;

function ponto(graus: number, raio: number) {
  const rad = (graus * Math.PI) / 180;
  return { x: CENTRO + raio * Math.cos(rad), y: CENTRO + raio * Math.sin(rad) };
}

function arco(de: number, ate: number, raio: number): string {
  const a = ponto(de, raio);
  const b = ponto(ate, raio);
  const grande = ate - de > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${raio} ${raio} 0 ${grande} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Faixas de status da taxa de acerto — as mesmas do resto do app
 *  (PCT_BOM/PCT_ATENCAO dos simulados). Numa questão a leitura se inverte: taxa
 *  BAIXA não é "ruim", é questão difícil. Por isso o rótulo é sobre a QUESTÃO
 *  ("difícil"/"tranquila"), nunca sobre o aluno. */
function faixa(pct: number) {
  if (pct >= 70) return { tom: "var(--color-questly-green)", rotulo: "tranquila para a maioria" };
  if (pct >= 40) return { tom: "var(--color-questly-gold)", rotulo: "divide a turma" };
  return { tom: "var(--color-questly-red)", rotulo: "das que mais derrubam" };
}

function AnelAcerto({ taxa }: { taxa: number }) {
  const gradId = useId();
  const pct = Math.max(0, Math.min(100, taxa * 100));
  const { tom, rotulo } = faixa(pct);
  const fim = INICIO + (pct / 100) * ABERTURA;

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        className="relative h-[128px] w-[128px]"
        role="img"
        aria-label={`${pct.toFixed(0)}% da plataforma acerta esta questão — ${rotulo}`}
      >
        <svg viewBox="0 0 128 128" className="h-full w-full">
          <defs>
            <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={tom} stopOpacity="0.5" />
              <stop offset="100%" stopColor={tom} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* trilha inteira: é ela que diz que a escala vai até 100% */}
          <path
            d={arco(INICIO, INICIO + ABERTURA, R)}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* marca da metade — referência silenciosa, hairline */}
          <line
            x1={ponto(INICIO + ABERTURA / 2, R - 9).x}
            y1={ponto(INICIO + ABERTURA / 2, R - 9).y}
            x2={ponto(INICIO + ABERTURA / 2, R + 9).x}
            y2={ponto(INICIO + ABERTURA / 2, R + 9).y}
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          {pct > 0.5 && (
            <path
              d={arco(INICIO, fim, R)}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="11"
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tnum font-heading text-[30px] font-bold leading-none">
            {pct.toFixed(0)}
            <span className="text-[17px] font-semibold">%</span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            acertam
          </span>
        </div>
      </div>
      <span className="mt-1 max-w-[150px] text-center text-[11px] font-semibold leading-snug text-muted-foreground">
        {rotulo}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// cápsulas de distribuição
// ---------------------------------------------------------------------------

/** Três papéis, três cores — ver o cabeçalho. */
function tintaDaFatia(fatia: FatiaAlternativa, ehPegadinha: boolean) {
  if (fatia.correta) {
    return {
      preenchimento:
        "linear-gradient(90deg, color-mix(in oklab, var(--questly-green) 78%, white), var(--questly-green-dark))",
      chip: "bg-questly-green text-white dark:text-[#0c1512]",
      numero: "text-questly-green-dark",
    };
  }
  if (ehPegadinha) {
    return {
      preenchimento:
        "linear-gradient(90deg, color-mix(in oklab, var(--questly-orange) 72%, white), var(--questly-orange-dark))",
      chip: "bg-questly-orange-light text-questly-orange-dark",
      numero: "text-questly-orange-dark",
    };
  }
  return {
    preenchimento:
      "linear-gradient(90deg, color-mix(in oklab, var(--muted-foreground) 45%, var(--muted)), color-mix(in oklab, var(--muted-foreground) 70%, var(--muted)))",
    chip: "bg-muted text-muted-foreground",
    numero: "text-muted-foreground",
  };
}

function Capsula({
  fatia,
  ehPegadinha,
  maiorFracao,
  chutePct,
  atraso,
  animar,
}: {
  fatia: FatiaAlternativa;
  ehPegadinha: boolean;
  maiorFracao: number;
  /** % que o puro chute daria (100/n) — a régua do gráfico */
  chutePct: number;
  atraso: number;
  animar: boolean;
}) {
  const tinta = tintaDaFatia(fatia, ehPegadinha);
  const pct = fatia.fracao * 100;
  // A barra é escalada pela MAIOR fatia, não por 100%: num item em que a
  // distribuição toda cabe em 40%, escalar por 100 deixaria todas as cápsulas
  // rasas e visualmente iguais. O número ao lado continua sendo o percentual
  // real, então a escala relativa não engana.
  const largura = maiorFracao > 0 ? (fatia.fracao / maiorFracao) * 100 : 0;

  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12.5px] font-bold ${tinta.chip}`}
      >
        {fatia.correta ? <Check size={14} strokeWidth={3} /> : fatia.letra.toUpperCase()}
      </span>

      <span
        className={`relative min-w-0 flex-1 overflow-hidden rounded-full bg-muted ${
          fatia.correta ? "h-4" : "h-3"
        }`}
        title={`Alternativa ${fatia.letra.toUpperCase()}: ${fatia.total} ${
          fatia.total === 1 ? "resposta" : "respostas"
        } (${pct.toFixed(1).replace(".", ",")}%)`}
      >
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: tinta.preenchimento }}
          initial={animar ? { width: 0 } : false}
          animate={{ width: `${Math.max(largura, fatia.total > 0 ? 3 : 0)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: atraso }}
        >
          {/* brilho só na do gabarito: é o realce dela DENTRO do gráfico */}
          {fatia.correta && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 to-transparent"
            />
          )}
        </motion.span>

        {/* régua do chute — hairline, sem rótulo na marca (a legenda explica) */}
        {chutePct > 0 && chutePct < 100 && (
          <span
            aria-hidden
            className="absolute inset-y-0 w-px bg-foreground/20"
            style={{ left: `${Math.min(99, (chutePct / (maiorFracao * 100)) * 100)}%` }}
          />
        )}
      </span>

      <span className={`tnum w-[46px] shrink-0 text-right text-[12.5px] font-bold ${tinta.numero}`}>
        {pct.toFixed(0)}%
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// painel
// ---------------------------------------------------------------------------

function Rodape({ dados }: { dados: EstatisticasQuestao }) {
  // Abaixo de 90s o número útil é em segundos: "1 min em média" pra uma questão
  // de 30s mentiria por arredondamento.
  const tempo =
    dados.tempoMedioSeg == null
      ? null
      : dados.tempoMedioSeg < 90
        ? `${Math.round(dados.tempoMedioSeg)}s em média`
        : `${Math.round(dados.tempoMedioSeg / 60)} min em média`;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[11.5px] font-medium text-muted-foreground">
      <span className="tnum inline-flex items-center gap-1.5">
        <Users size={12.5} strokeWidth={2} />
        {dados.amostra} {dados.amostra === 1 ? "resposta" : "respostas"} na plataforma
      </span>
      {tempo && (
        <span className="tnum inline-flex items-center gap-1.5">
          <Clock size={12.5} strokeWidth={2} />
          {tempo}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-px bg-foreground/25" />
        linha fina = o que o puro chute daria
      </span>
    </div>
  );
}

/**
 * Estado do painel. Vive num hook (e não dentro do painel) porque o BOTÃO que
 * abre a seção fica na barra de ações, junto de "Ver resolução" e "Discussão",
 * enquanto o painel desenha ABAIXO da barra inteira — os dois precisam do mesmo
 * estado sem que um seja filho do outro.
 *
 * A busca acontece no HANDLER do clique, nunca num efeito: a regra
 * react-hooks/set-state-in-effect do compilador do React 19 (ver web/CLAUDE.md)
 * proíbe setState no corpo de efeito, e de todo modo carregar por evento é mais
 * honesto — o dado é consequência do aluno pedir pra ver.
 */
export function useEstatisticasQuestao(questionId: string) {
  const [aberto, setAberto] = useState(false);
  // Resultado guardado POR QUESTÃO. Um único `dados` com reset na troca de
  // questão não basta: se o aluno avança antes da resposta chegar, o `.then`
  // escreveria a estatística da questão VELHA no estado da nova. Indexado pelo
  // id isso não pode acontecer, e de graça o painel não refaz a busca quando
  // ele volta pro "Anterior". O mapa cresce no máximo o tamanho da lista.
  const [porQuestao, setPorQuestao] = useState<
    Record<string, { dados?: EstatisticasQuestao; erro?: string }>
  >({});
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  // Trocar de questão fecha o painel — ajustado durante o render, que é o
  // padrão documentado do React pra "estado que depende de uma prop" (o mesmo
  // já usado em questao-acoes.tsx). Efeito aqui esbarraria na regra
  // react-hooks/set-state-in-effect do compilador do React 19.
  const [idAnterior, setIdAnterior] = useState(questionId);
  if (questionId !== idAnterior) {
    setIdAnterior(questionId);
    setAberto(false);
  }

  const atual = porQuestao[questionId];
  const carregando = carregandoId === questionId;

  function alternar() {
    if (aberto) {
      setAberto(false);
      return;
    }
    setAberto(true);
    if (atual || carregando) return;

    const id = questionId;
    setCarregandoId(id);
    carregarEstatisticasQuestaoAction(id).then((res) => {
      setCarregandoId((emCurso) => (emCurso === id ? null : emCurso));
      setPorQuestao((prev) => ({
        ...prev,
        [id]: "error" in res ? { erro: res.error } : { dados: res },
      }));
    });
  }

  return {
    aberto,
    alternar,
    dados: atual?.dados ?? null,
    erro: atual?.erro ?? null,
    carregando,
  };
}

export type EstadoEstatisticas = ReturnType<typeof useEstatisticasQuestao>;

export function PainelEstatisticas({ estado }: { estado: EstadoEstatisticas }) {
  const reduzirMovimento = useReducedMotion();
  const { aberto, dados, erro, carregando } = estado;

  const maiorFracao = dados?.fatias.length
    ? Math.max(...dados.fatias.map((f) => f.fracao))
    : 0;
  const chutePct = dados?.fatias.length ? 100 / dados.fatias.length : 0;

  return (
    <AnimatePresence initial={false}>
      {aberto && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <section className="mb-4 rounded-2xl border border-border bg-muted/35 p-4 sm:p-5">
            <header className="mb-4 flex items-center gap-2">
              <BarChart3
                size={15}
                strokeWidth={2.2}
                className="shrink-0 text-questly-purple"
              />
              <h3 className="text-[13.5px] font-bold text-foreground">
                Estatísticas desta questão
              </h3>
            </header>

            {carregando && (
              <div className="flex items-center gap-4">
                <div className="h-[128px] w-[128px] shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-3 animate-pulse rounded-full bg-muted" />
                  ))}
                </div>
              </div>
            )}

            {!carregando && erro && (
              <p className="rounded-xl bg-card px-4 py-5 text-center text-[12.5px] text-muted-foreground">
                {erro}
              </p>
            )}

            {!carregando && !erro && dados && dados.fatias.length === 0 && (
              <p className="rounded-xl bg-card px-4 py-5 text-center text-[12.5px] leading-relaxed text-muted-foreground">
                {dados.amostraInsuficiente ? (
                  <>
                    Só {dados.amostra}{" "}
                    {dados.amostra === 1 ? "pessoa respondeu" : "pessoas responderam"} essa
                    questão até agora. Com menos de {EST_MIN_AMOSTRA} respostas, um gráfico
                    aqui descreveria essas pessoas, não a questão.
                  </>
                ) : (
                  <>
                    Você é dos primeiros a encarar essa questão. Quando mais gente responder,
                    aparece aqui quanto da plataforma acerta e onde os outros escorregam.
                  </>
                )}
              </p>
            )}

            {!carregando && !erro && dados && dados.fatias.length > 0 && (
              <>
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                  {dados.taxaAcerto != null && <AnelAcerto taxa={dados.taxaAcerto} />}

                  <div className="min-w-0 flex-1">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      Onde a plataforma marcou
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {dados.fatias.map((f, i) => (
                        <Capsula
                          key={f.letra}
                          fatia={f}
                          ehPegadinha={dados.pegadinha?.letra === f.letra}
                          maiorFracao={maiorFracao}
                          chutePct={chutePct}
                          atraso={reduzirMovimento ? 0 : i * 0.06}
                          animar={!reduzirMovimento}
                        />
                      ))}
                    </ul>
                  </div>
                </div>

                {/* A leitura do gráfico em uma frase. Cor não carrega
                    informação sozinha — nem aqui, nem no gráfico. */}
                {dados.pegadinha && dados.pegadinha.fracao >= chutePct / 100 && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-questly-orange-light/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-questly-orange-dark">
                    <Target size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
                    <span>
                      A pegadinha é a{" "}
                      <b className="font-bold">{dados.pegadinha.letra.toUpperCase()}</b>:{" "}
                      {(dados.pegadinha.fracao * 100).toFixed(0)}% marcaram ela. Vale entender
                      o que nela parece certo — é o erro que a banca está caçando.
                    </span>
                  </p>
                )}

                <Rodape dados={dados} />
              </>
            )}
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
