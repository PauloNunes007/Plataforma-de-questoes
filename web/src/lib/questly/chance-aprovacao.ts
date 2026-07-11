// Portado de js/chance-aprovacao.js — heurística transparente de "chance
// de aprovação" e cobertura de conteúdo, a partir de dados já coletados
// (taxa_acerto/num_questoes_respondidas por tópico + frequência de
// estudo). NÃO é uma previsão validada cientificamente — função pura,
// mesmos pesos/constantes do arquivo legado. Ver comentário original pra
// fundamentação completa de cada peso/gate.
export const META_QUESTOES_TOPICO = 5;
const DIAS_POR_TOPICO_PENDENTE = 2;

const PESO_COBERTURA = 0.45;
const PESO_PRECISAO = 0.35;
const PESO_FREQUENCIA = 0.2;

const META_THRESHOLD_POR_NOTA: Record<number, number> = { 6: 0.65, 7: 0.65, 8: 0.75, 9: 0.85, 10: 0.92 };

const PERDAO_POR_MOTIVO: Record<string, number> = { conceito: 0, calculo: 0.5, interpretacao: 0.3, chute: 0 };

const MIN_QUESTOES_POR_TOPICO = 3;
const MIN_QUESTOES_TOTAL = 15;
const MIN_FRACAO_TOPICOS_TOCADOS = 0.6;
const MIN_DIAS_COM_ESTUDO = 2;
export const FREQUENCIA_JANELA_DIAS = 14;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export type TopicoRelevante = { taxa_acerto: number; num_questoes_respondidas: number };
export type ErrosPorMotivo = Partial<Record<"conceito" | "calculo" | "interpretacao" | "chute", number>>;

export type MetricasCalculadas = {
  coberturaMedia: number;
  precisaoMedia: number;
  chanceAprovacao: number | null;
  temDadosSuficientes: boolean;
};

export function questlyCalcularMetricas(
  subject: { nota_desejada?: number | null } | null | undefined,
  topicosRelevantes: TopicoRelevante[],
  diasRestantesAteBoss: number | null,
  diasComEstudoRecente: number,
  errosPorMotivo?: ErrosPorMotivo,
): MetricasCalculadas {
  if (!topicosRelevantes || topicosRelevantes.length === 0) {
    return { coberturaMedia: 0, precisaoMedia: 0, chanceAprovacao: null, temDadosSuficientes: false };
  }

  const coberturas = topicosRelevantes.map((t) =>
    clamp((t.num_questoes_respondidas || 0) / META_QUESTOES_TOPICO, 0, 1),
  );
  const coberturaMedia = coberturas.reduce((a, b) => a + b, 0) / topicosRelevantes.length;

  const somaQuestoes = topicosRelevantes.reduce((acc, t) => acc + (t.num_questoes_respondidas || 0), 0);
  const precisaoMedia =
    somaQuestoes > 0
      ? topicosRelevantes.reduce((acc, t) => acc + (t.taxa_acerto || 0) * (t.num_questoes_respondidas || 0), 0) /
        somaQuestoes
      : 0;

  const topicosTocados = topicosRelevantes.filter((t) => (t.num_questoes_respondidas || 0) > 0).length;
  const fracaoTocados = topicosTocados / topicosRelevantes.length;
  const diasSeguro = diasComEstudoRecente || 0;

  const minimoTotal = Math.max(MIN_QUESTOES_TOTAL, topicosRelevantes.length * MIN_QUESTOES_POR_TOPICO);
  const temDadosSuficientes =
    somaQuestoes >= minimoTotal &&
    fracaoTocados >= MIN_FRACAO_TOPICOS_TOCADOS &&
    diasSeguro >= MIN_DIAS_COM_ESTUDO;

  if (!temDadosSuficientes) {
    return { coberturaMedia, precisaoMedia, chanceAprovacao: null, temDadosSuficientes: false };
  }

  let precisaoAjustada = precisaoMedia;
  if (errosPorMotivo && somaQuestoes > 0) {
    let credito = 0;
    (Object.keys(PERDAO_POR_MOTIVO) as (keyof ErrosPorMotivo)[]).forEach((motivo) => {
      credito += (errosPorMotivo[motivo] || 0) * PERDAO_POR_MOTIVO[motivo];
    });
    precisaoAjustada = clamp(precisaoMedia + credito / somaQuestoes, 0, 1);
  }

  const frequenciaSegura = clamp(diasSeguro / FREQUENCIA_JANELA_DIAS, 0, 1);
  const scoreBruto = coberturaMedia * PESO_COBERTURA + precisaoAjustada * PESO_PRECISAO + frequenciaSegura * PESO_FREQUENCIA;

  const notaDesejada = subject?.nota_desejada || 8;
  const metaThreshold = META_THRESHOLD_POR_NOTA[notaDesejada] || META_THRESHOLD_POR_NOTA[8];

  const topicosPendentes = coberturas.filter((c) => c < 1).length;
  let fatorTempo = 1;
  if (topicosPendentes > 0 && diasRestantesAteBoss != null) {
    const diasNecessarios = topicosPendentes * DIAS_POR_TOPICO_PENDENTE;
    fatorTempo = clamp(diasRestantesAteBoss / diasNecessarios, 0.3, 1);
  }

  const chanceAprovacao = Math.round(clamp(scoreBruto / metaThreshold, 0, 1) * fatorTempo * 100);

  return { coberturaMedia, precisaoMedia, chanceAprovacao, temDadosSuficientes: true };
}
