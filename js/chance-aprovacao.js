// ============================================================
// QUESTLY — chance-aprovacao.js
// Heurística transparente de "chance de aprovação" e cobertura de
// conteúdo (barra do Boss), a partir de dados reais já coletados:
// taxa_acerto/num_questoes_respondidas por tópico e frequência de
// estudo (daily_logs). NÃO é uma previsão de nota validada
// cientificamente — é uma conta honesta em cima do que o aluno
// realmente fez, com pesos documentados aqui e fáceis de ajustar.
//
// Função pura: não faz chamadas ao Supabase, só recebe os dados já
// buscados e devolve números. Quem busca os dados é quem chama.
// ============================================================

const META_QUESTOES_TOPICO = 5;       // quantas questões de um tópico contam como "coberto" (100%)
const DIAS_POR_TOPICO_PENDENTE = 2;   // dias considerados necessários por tópico ainda não coberto

const PESO_COBERTURA = 0.45;
const PESO_PRECISAO = 0.35;
const PESO_FREQUENCIA = 0.20;

const META_THRESHOLD_POR_NOTA = { 6: 0.65, 7: 0.65, 8: 0.75, 9: 0.85, 10: 0.92 };

// Metacognição (autópsia do erro): um erro que o aluno classificou como
// "erro de cálculo" indica menos falta de domínio que um erro de
// "conceito" — parte da penalidade é perdoada devolvendo uma fração do
// erro como acerto na precisão AJUSTADA (a precisão crua continua sendo
// exibida como está; só o score da chance usa a ajustada).
// Chave = question_attempts.motivo_erro; valor = fração perdoada.
const PERDAO_POR_MOTIVO = { conceito: 0, calculo: 0.5, interpretacao: 0.3, chute: 0 };

// Gate de "dados suficientes" — precisa de volume real, tópicos tocados de
// verdade (não só 1-2) e repetição em mais de um dia. Sem isso, uma única
// missão (até 15 questões numa sentada só) já batia o mínimo antigo e
// mostrava confiança alta sem repetição nenhuma.
const MIN_QUESTOES_POR_TOPICO = 3;       // volume médio mínimo por tópico
const MIN_QUESTOES_TOTAL = 15;           // piso absoluto, mesmo com poucos tópicos
const MIN_FRACAO_TOPICOS_TOCADOS = 0.6;  // pelo menos 60% dos tópicos relevantes precisam ter sido tentados
const MIN_DIAS_COM_ESTUDO = 2;           // não confia em tudo feito numa sentada só
const FREQUENCIA_JANELA_DIAS = 14;       // janela usada pro fator de frequência

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * @param {{nota_desejada?: number}} subject
 * @param {Array<{taxa_acerto:number, num_questoes_respondidas:number}>} topicosRelevantes  tópicos com cai_na_prova=true da disciplina
 * @param {number|null} diasRestantesAteBoss  dias até a prova mais próxima da disciplina (null se não houver)
 * @param {number} diasComEstudoRecente  quantos dos últimos FREQUENCIA_JANELA_DIAS tiveram estudo registrado
 * @param {{conceito?:number, calculo?:number, interpretacao?:number, chute?:number}} [errosPorMotivo]
 *        contagem de tentativas ERRADAS do aluno nessa matéria, por motivo
 *        classificado (question_attempts.motivo_erro). Opcional — sem ela a
 *        conta fica idêntica à anterior. Erros sem classificação não entram
 *        (penalidade cheia, como sempre foi).
 * @returns {{ coberturaMedia:number, precisaoMedia:number, chanceAprovacao:number|null, temDadosSuficientes:boolean }}
 */
function questlyCalcularMetricas(subject, topicosRelevantes, diasRestantesAteBoss, diasComEstudoRecente, errosPorMotivo) {
  if (!topicosRelevantes || topicosRelevantes.length === 0) {
    return { coberturaMedia: 0, precisaoMedia: 0, chanceAprovacao: null, temDadosSuficientes: false };
  }

  const coberturas = topicosRelevantes.map(function (t) {
    return clamp((t.num_questoes_respondidas || 0) / META_QUESTOES_TOPICO, 0, 1);
  });
  const coberturaMedia = coberturas.reduce(function (a, b) { return a + b; }, 0) / topicosRelevantes.length;

  const somaQuestoes = topicosRelevantes.reduce(function (acc, t) { return acc + (t.num_questoes_respondidas || 0); }, 0);
  const precisaoMedia = somaQuestoes > 0
    ? topicosRelevantes.reduce(function (acc, t) { return acc + (t.taxa_acerto || 0) * (t.num_questoes_respondidas || 0); }, 0) / somaQuestoes
    : 0;

  const topicosTocados = topicosRelevantes.filter(function (t) { return (t.num_questoes_respondidas || 0) > 0; }).length;
  const fracaoTocados = topicosTocados / topicosRelevantes.length;
  const diasSeguro = diasComEstudoRecente || 0;

  const minimoTotal = Math.max(MIN_QUESTOES_TOTAL, topicosRelevantes.length * MIN_QUESTOES_POR_TOPICO);
  const temDadosSuficientes =
    somaQuestoes >= minimoTotal &&
    fracaoTocados >= MIN_FRACAO_TOPICOS_TOCADOS &&
    diasSeguro >= MIN_DIAS_COM_ESTUDO;

  if (!temDadosSuficientes) {
    return { coberturaMedia: coberturaMedia, precisaoMedia: precisaoMedia, chanceAprovacao: null, temDadosSuficientes: false };
  }

  // precisão ajustada pela metacognição: devolve como "crédito" a fração
  // perdoada de cada erro classificado. O crédito nunca pode exceder a
  // fração de erros reais (clamp em 1 cobre isso).
  let precisaoAjustada = precisaoMedia;
  if (errosPorMotivo && somaQuestoes > 0) {
    let credito = 0;
    Object.keys(PERDAO_POR_MOTIVO).forEach(function (motivo) {
      credito += (errosPorMotivo[motivo] || 0) * PERDAO_POR_MOTIVO[motivo];
    });
    precisaoAjustada = clamp(precisaoMedia + credito / somaQuestoes, 0, 1);
  }

  const frequenciaSegura = clamp(diasSeguro / FREQUENCIA_JANELA_DIAS, 0, 1);
  const scoreBruto = coberturaMedia * PESO_COBERTURA + precisaoAjustada * PESO_PRECISAO + frequenciaSegura * PESO_FREQUENCIA;

  const notaDesejada = (subject && subject.nota_desejada) || 8;
  const metaThreshold = META_THRESHOLD_POR_NOTA[notaDesejada] || META_THRESHOLD_POR_NOTA[8];

  const topicosPendentes = coberturas.filter(function (c) { return c < 1; }).length;
  let fatorTempo = 1;
  if (topicosPendentes > 0 && diasRestantesAteBoss != null) {
    const diasNecessarios = topicosPendentes * DIAS_POR_TOPICO_PENDENTE;
    fatorTempo = clamp(diasRestantesAteBoss / diasNecessarios, 0.3, 1);
  }

  const chanceAprovacao = Math.round(clamp(scoreBruto / metaThreshold, 0, 1) * fatorTempo * 100);

  return { coberturaMedia: coberturaMedia, precisaoMedia: precisaoMedia, chanceAprovacao: chanceAprovacao, temDadosSuficientes: true };
}
