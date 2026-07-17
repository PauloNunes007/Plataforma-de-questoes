// ============================================================
// GPS da Aprovação — a ROTA Δnota/min (lado do PLANEJAMENTO).
//
// O motor de aprovação (motor-aprovacao.ts) responde "que nota o
// aluno tira no dia da prova se nada mudar". Este módulo responde a
// pergunta seguinte: "onde investir os próximos minutos pra essa
// nota subir mais rápido?".
//
// Como: simula, questão a questão, o efeito ESPERADO de praticar um
// tópico hoje usando EXATAMENTE as mesmas funções de evolução que a
// produção aplica a cada resposta real (questlyAtualizarMaestria /
// questlyAtualizarEstabilidade, ponderadas pela probabilidade de
// acerto do próprio BKT) e reprojeta a força pro dia da prova. A
// rota é montada por ganho marginal: a cada passo, a questão que
// mais sobe a nota projetada POR MINUTO ganha o minuto — o guloso
// natural quando cada questão extra num mesmo tópico rende menos
// que a anterior (retornos decrescentes do BKT + espaçamento).
//
// Paridade com a produção (importante pra rota não prometer o que o
// motor não entrega): a 1ª questão simulada de um tópico usa a
// retenção REAL do momento (é ela que ganha o bônus de espaçamento);
// as seguintes veem R≈1 (ultima_revisao acabou de ser estampada) e
// quase não somam estabilidade — igual a registrarRespostaAction
// rodando 1× por questão na mesma sentada.
//
// Funções puras (sem Supabase). A projeção de força é injetada por
// callback pra rota enxergar a MESMA régua da nota exibida — BKT puro
// ou rede neural, conforme o que o dashboard estiver usando.
// ============================================================

import {
  questlyAtualizarEstabilidade,
  questlyAtualizarMaestria,
  questlyEstadoEfetivo,
  questlyForcaNaProva,
  questlyRetencaoDeEstado,
  QUESTLY_BKT_GUESS,
  QUESTLY_BKT_SLIP,
  type ProgressoBruto,
} from "./motor-aprovacao";

// Mesmo fallback do mission-engine (convenção do repo: heurísticas
// pequenas são duplicadas por arquivo, não compartilhadas).
const TEMPO_MEDIO_POR_QUESTAO_MIN = 3;

// Teto de questões simuladas por tópico num único dia — além disso o
// ganho do BKT já saturou e a recomendação viraria "moa 40 questões
// do mesmo assunto", que não é como a rota deve se comportar.
const MAX_QUESTOES_POR_TOPICO = 15;

// Ganho de nota (em pontos de 0–100) abaixo do qual uma questão extra
// não entra na rota — evita passos de ruído numérico.
const GANHO_MINIMO_POR_QUESTAO = 0.01;

export type TopicoRota = ProgressoBruto & {
  id: string;
  nome: string;
  /** média de tempo_medio_seg das questões do tópico (null = sem dado) */
  tempoMedioSeg: number | null;
  /** quantas questões o banco tem pra este tópico (0 = não praticável) */
  questoesDisponiveis: number;
};

export type PassoRota = {
  topicoId: string;
  nome: string;
  questoes: number;
  minutos: number;
  /** quanto este passo sozinho sobe a nota projetada (pontos 0–100) */
  deltaNota: number;
  forcaAntes: number;
  forcaDepois: number;
};

export type RotaAprovacao = {
  /** nota projetada pro dia da prova HOJE, na mesma régua da exibida */
  notaAtual: number;
  /** nota projetada se o aluno cumprir a rota inteira hoje */
  notaAposRota: number;
  deltaNota: number;
  tempoTotalMin: number;
  questoesTotal: number;
  /** ordenados por prioridade (ordem em que o guloso escolheu) */
  passos: PassoRota[];
};

type CalcularForca = (t: ProgressoBruto & { id: string }) => number;

// Estado simulado de um tópico ao longo do guloso.
type EstadoSim = {
  topico: TopicoRota;
  maestria: number;
  estabilidade: number;
  ultimaRevisao: string | null;
  num: number;
  tempoQuestaoMin: number;
  questoesSimuladas: number;
  forcaAtual: number;
};

function comoProgresso(e: EstadoSim): ProgressoBruto & { id: string } {
  return {
    id: e.topico.id,
    maestria: e.maestria,
    estabilidade: e.estabilidade,
    ultima_revisao: e.ultimaRevisao,
    num_questoes_respondidas: e.num,
    taxa_acerto: e.topico.taxa_acerto,
  };
}

// Evolução ESPERADA de uma resposta: pondera o passo de acerto e o de
// erro pela probabilidade de acerto que o próprio BKT atribui —
// determinística, sem sorteio, então a rota é estável entre reloads.
//
// Exceção deliberada à paridade: a estabilidade recebe só o GANHO
// esperado (pAcerto × bônus de espaçamento), nunca o corte do ramo de
// erro. Em valor esperado o corte domina numa mesma sentada (acertos
// com R≈1 somam ~0, erros multiplicam por 0.6), e a simulação
// concluiria que praticar DERRUBA a nota projetada — um artefato dos
// parâmetros não calibrados do motor (ver web/CLAUDE.md), não uma
// predição. A rota fica levemente otimista e monotônica: mais estudo
// nunca piora a nota, só satura.
function evoluirEsperado(e: EstadoSim, agoraMs: number): void {
  const pAcerto =
    e.maestria * (1 - QUESTLY_BKT_SLIP) + (1 - e.maestria) * QUESTLY_BKT_GUESS;
  const retencaoNoMomento = questlyRetencaoDeEstado(e.estabilidade, e.ultimaRevisao, agoraMs);

  e.maestria =
    pAcerto * questlyAtualizarMaestria(e.maestria, true) +
    (1 - pAcerto) * questlyAtualizarMaestria(e.maestria, false);
  const ganhoSeAcerta =
    questlyAtualizarEstabilidade(e.estabilidade, true, retencaoNoMomento) - e.estabilidade;
  e.estabilidade += pAcerto * Math.max(0, ganhoSeAcerta);
  e.ultimaRevisao = new Date(agoraMs).toISOString();
  e.num += 1;
  e.questoesSimuladas += 1;
}

export function questlyRotaAprovacao(input: {
  topicos: TopicoRota[];
  dataProvaMs: number;
  agoraMs: number;
  tempoDisponivelMin: number;
  /** régua de força — default BKT puro; injete a da rede quando ativa */
  calcularForca?: CalcularForca;
}): RotaAprovacao | null {
  const { topicos, dataProvaMs, agoraMs, tempoDisponivelMin } = input;
  if (topicos.length === 0 || tempoDisponivelMin <= 0) return null;

  const calcularForca: CalcularForca =
    input.calcularForca ?? ((t) => questlyForcaNaProva(t, dataProvaMs, agoraMs));

  // A nota projetada é a média sobre TODOS os tópicos da prova (mesmo
  // denominador de questlyProjetarProva) — 1 ponto de força num tópico
  // vale 100/n pontos de nota.
  const pontosPorForca = 100 / topicos.length;

  const estados: EstadoSim[] = topicos.map((t) => {
    const { maestria, estabilidade } = questlyEstadoEfetivo(t);
    return {
      topico: t,
      maestria,
      estabilidade,
      ultimaRevisao: t.ultima_revisao ?? null,
      num: t.num_questoes_respondidas ?? 0,
      tempoQuestaoMin: (t.tempoMedioSeg || TEMPO_MEDIO_POR_QUESTAO_MIN * 60) / 60,
      questoesSimuladas: 0,
      forcaAtual: 0,
    };
  });
  estados.forEach((e) => {
    e.forcaAtual = calcularForca(comoProgresso(e));
  });

  const notaAtualPts = estados.reduce((acc, e) => acc + e.forcaAtual, 0) * pontosPorForca;

  // Guloso por ganho marginal: a cada iteração, avalia pra cada tópico
  // o Δnota de UMA questão a mais e dá o minuto pra melhor razão
  // Δnota/min. Estados evoluem só quando escolhidos.
  let tempoRestante = tempoDisponivelMin;
  const ordemEscolha: string[] = [];
  const porTopico = new Map<string, PassoRota>();

  for (let guarda = 0; guarda < 500; guarda++) {
    let melhor: { estado: EstadoSim; deltaNota: number; proximo: EstadoSim } | null = null;

    for (const e of estados) {
      if (e.topico.questoesDisponiveis <= 0) continue;
      if (e.questoesSimuladas >= Math.min(e.topico.questoesDisponiveis, MAX_QUESTOES_POR_TOPICO))
        continue;
      if (e.tempoQuestaoMin > tempoRestante) continue;

      // simula 1 questão numa cópia rasa do estado
      const tentativa: EstadoSim = { ...e };
      evoluirEsperado(tentativa, agoraMs);
      const forcaNova = calcularForca(comoProgresso(tentativa));
      const deltaNota = (forcaNova - e.forcaAtual) * pontosPorForca;
      if (deltaNota < GANHO_MINIMO_POR_QUESTAO) continue;

      const razao = deltaNota / e.tempoQuestaoMin;
      const razaoMelhor = melhor ? melhor.deltaNota / melhor.estado.tempoQuestaoMin : -1;
      if (!melhor || razao > razaoMelhor) {
        tentativa.forcaAtual = forcaNova;
        melhor = { estado: e, deltaNota, proximo: tentativa };
      }
    }

    if (!melhor) break;

    // commita a questão escolhida no estado real
    Object.assign(melhor.estado, melhor.proximo);
    tempoRestante -= melhor.estado.tempoQuestaoMin;

    const id = melhor.estado.topico.id;
    const passo = porTopico.get(id);
    if (passo) {
      passo.questoes += 1;
      passo.deltaNota += melhor.deltaNota;
      passo.forcaDepois = melhor.estado.forcaAtual;
    } else {
      ordemEscolha.push(id);
      porTopico.set(id, {
        topicoId: id,
        nome: melhor.estado.topico.nome,
        questoes: 1,
        minutos: 0,
        deltaNota: melhor.deltaNota,
        forcaAntes: melhor.estado.forcaAtual, // será corrigido abaixo
        forcaDepois: melhor.estado.forcaAtual,
      });
    }
  }

  if (porTopico.size === 0) return null;

  // forcaAntes correta = força inicial (antes de qualquer simulação)
  const forcaInicialPorId = new Map<string, number>();
  topicos.forEach((t) => {
    forcaInicialPorId.set(t.id, calcularForca({ ...t, id: t.id }));
  });

  const passos: PassoRota[] = ordemEscolha.map((id) => {
    const p = porTopico.get(id)!;
    const estado = estados.find((e) => e.topico.id === id)!;
    return {
      ...p,
      forcaAntes: forcaInicialPorId.get(id) ?? 0,
      forcaDepois: estado.forcaAtual,
      minutos: Math.max(1, Math.round(p.questoes * estado.tempoQuestaoMin)),
      deltaNota: Math.round(p.deltaNota * 10) / 10,
    };
  });

  const notaAposRotaPts = estados.reduce((acc, e) => acc + e.forcaAtual, 0) * pontosPorForca;

  return {
    notaAtual: Math.round(notaAtualPts),
    notaAposRota: Math.round(notaAposRotaPts),
    deltaNota: Math.round((notaAposRotaPts - notaAtualPts) * 10) / 10,
    tempoTotalMin: passos.reduce((acc, p) => acc + p.minutos, 0),
    questoesTotal: passos.reduce((acc, p) => acc + p.questoes, 0),
    passos,
  };
}
