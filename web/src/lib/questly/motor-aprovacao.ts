// ============================================================
// Motor de Aprovação — núcleo de evolução de estado (lado da ESCRITA).
//
// Ao contrário de shared.ts (que DERIVA retenção/estabilidade de
// taxa_acerto em tempo de leitura), aqui maestria e estabilidade são
// ESTADO PERSISTIDO em aluno_topico_progresso.{maestria,estabilidade}
// (ver supabase_motor_maestria.sql), atualizado a cada tentativa:
//   - maestria  via Bayesian Knowledge Tracing (BKT), sequencial;
//   - estabilidade cresce por revisão bem espaçada (efeito de espaçamento).
//
// Funções puras (sem Supabase) — o adaptador em lib/questao/actions.ts
// lê a linha atual, chama questlyEvoluirEstadoTopico e faz o upsert.
// A fase de PLANEJAMENTO (gerarPlanoDoDia) virá num passo seguinte e
// vai LER estas colunas; este arquivo cuida só de mantê-las corretas.
// ============================================================

// ── Bayesian Knowledge Tracing ──────────────────────────────────────
// pS = slip (erra sabendo), pG = guess (acerta chutando; ~1/5
// alternativas + acerto parcial), pT = transição (praticar ensina).
export const QUESTLY_BKT_SLIP = 0.1;
export const QUESTLY_BKT_GUESS = 0.22;
export const QUESTLY_BKT_TRANSICAO = 0.14;

// ── Estabilidade de memória (dias) ──────────────────────────────────
export const QUESTLY_ESTABILIDADE_INICIAL = 1.5; // = piso do backfill SQL
export const QUESTLY_GANHO_ESTAB_POR_REVISAO = 4; // dias somados numa revisão bem espaçada
export const QUESTLY_PENALIDADE_ESTAB_ERRO = 0.6; // multiplica S ao errar

// ── Sementes de cold-start (PARIDADE com o backfill do SQL) ─────────
// Uma linha sem maestria/estabilidade persistidas (primeira resposta do
// tópico, ou conta anterior à migração) é semeada a partir de
// taxa_acerto/num — os MESMOS números do backfill, pra rows novas e
// migradas se comportarem igual.
const MAESTRIA_PRIOR = 0.3;
const MAESTRIA_SHRINK_K = 5;

export function questlyMaestriaSemente(taxa: number, num: number): number {
  const m = (taxa * num + MAESTRIA_PRIOR * MAESTRIA_SHRINK_K) / (num + MAESTRIA_SHRINK_K);
  return Math.min(1, Math.max(0, m));
}

export function questlyEstabilidadeSemente(taxa: number, num: number): number {
  return Math.max(QUESTLY_ESTABILIDADE_INICIAL, QUESTLY_ESTABILIDADE_INICIAL + num * taxa * 0.3);
}

// ── Passo de maestria (BKT) ─────────────────────────────────────────
// Bayes (evidência) seguido da transição de aprendizado. Sempre em [0,1].
export function questlyAtualizarMaestria(maestria: number, acertou: boolean): number {
  const pS = QUESTLY_BKT_SLIP;
  const pG = QUESTLY_BKT_GUESS;
  const pT = QUESTLY_BKT_TRANSICAO;
  const posterior = acertou
    ? (maestria * (1 - pS)) / (maestria * (1 - pS) + (1 - maestria) * pG)
    : (maestria * pS) / (maestria * pS + (1 - maestria) * (1 - pG));
  return posterior + (1 - posterior) * pT;
}

// ── Retenção a partir do estado PERSISTIDO (não deriva de taxa) ─────
// R = e^(-Δt/S). Sem ultima_revisao (conteúdo nunca tocado) → 0.
export function questlyRetencaoDeEstado(
  estabilidade: number,
  ultimaRevisao: string | null,
  agoraMs: number,
): number {
  if (!ultimaRevisao) return 0;
  const dias = Math.max(0, (agoraMs - new Date(ultimaRevisao).getTime()) / 86_400_000);
  return Math.exp(-dias / Math.max(QUESTLY_ESTABILIDADE_INICIAL, estabilidade));
}

// ── Passo de estabilidade (efeito de espaçamento, ADITIVO) ──────────
// Ganho ∝ (1 - R): revisar quando a memória já caiu (recuperação difícil)
// constrói mais memória; revisar recém-revisado (R≈1) quase não soma —
// é o que impede inflação ao moer várias questões na mesma sentada.
// Errar corta a estabilidade (a memória não estava firme).
export function questlyAtualizarEstabilidade(
  estabilidade: number,
  acertou: boolean,
  retencaoNoMomento: number,
): number {
  if (!acertou) {
    return Math.max(QUESTLY_ESTABILIDADE_INICIAL, estabilidade * QUESTLY_PENALIDADE_ESTAB_ERRO);
  }
  return estabilidade + QUESTLY_GANHO_ESTAB_POR_REVISAO * (1 - retencaoNoMomento);
}

// ── LADO DA LEITURA: estado efetivo (persistido OU semeado) ─────────
// O motor de missões consome estes helpers em vez de re-derivar S de
// taxa_acerto. Uma linha com maestria/estabilidade persistidas usa o
// valor real; uma sem (nunca respondida) cai na MESMA semente que a
// escrita usaria — leitura e escrita enxergam o mesmo estado.
export type ProgressoBruto = {
  maestria?: number | null;
  estabilidade?: number | null;
  taxa_acerto?: number | null;
  num_questoes_respondidas?: number | null;
  ultima_revisao?: string | null;
};

export function questlyEstadoEfetivo(
  p: ProgressoBruto | null | undefined,
): { maestria: number; estabilidade: number } {
  const taxa = p?.taxa_acerto ?? 0;
  const num = p?.num_questoes_respondidas ?? 0;
  return {
    maestria: p?.maestria ?? questlyMaestriaSemente(taxa, num),
    estabilidade: p?.estabilidade ?? questlyEstabilidadeSemente(taxa, num),
  };
}

// Retenção do tópico HOJE a partir do estado efetivo. null = nunca
// tocado (sem ultima_revisao) — o chamador decide como tratar "sem dado".
export function questlyRetencaoEfetiva(
  p: ProgressoBruto | null | undefined,
  agoraMs: number,
): number | null {
  if (!p?.ultima_revisao) return null;
  return questlyRetencaoDeEstado(questlyEstadoEfetivo(p).estabilidade, p.ultima_revisao, agoraMs);
}

// ── PROJEÇÃO PRA DATA DA PROVA (o preditivo) ────────────────────────
// Não mede onde o aluno está HOJE — projeta onde ele ESTARÁ no dia da
// prova, aplicando esquecimento do último toque até a data da prova:
//   forcaNaProva = maestria × e^(-Δt_até_prova / S)
// É isso que permite sinalizar uma falha ANTES da prova: um tópico com
// maestria alta mas revisado há muito chega fraco no dia D.
export const QUESTLY_FORCA_RISCO = 0.5; // força projetada abaixo disto = "em risco"

export function questlyForcaNaProva(
  p: ProgressoBruto | null | undefined,
  dataProvaMs: number,
  agoraMs: number,
): number {
  // Nunca estudado (sem ultima_revisao) chega a zero — lacuna, não prior.
  if (!p?.ultima_revisao) return 0;
  const { maestria, estabilidade } = questlyEstadoEfetivo(p);
  // Nunca projetar pro passado (prova já vencida → usa hoje).
  const alvoMs = Math.max(dataProvaMs, agoraMs);
  const dias = Math.max(0, (alvoMs - new Date(p.ultima_revisao).getTime()) / 86_400_000);
  const retencaoNaProva = Math.exp(-dias / Math.max(QUESTLY_ESTABILIDADE_INICIAL, estabilidade));
  return maestria * retencaoNaProva;
}

// Projeção agregada da prova. topicos já deve vir SEM os 'pulado'
// (autodeclarados) — igual ao denominador da chance de aprovação.
// notaProjetada = média das forças × 100. emRisco = ids abaixo do limiar.
export function questlyProjetarProva(
  topicos: Array<ProgressoBruto & { id: string }>,
  dataProvaMs: number,
  agoraMs: number,
): {
  notaProjetada: number | null;
  forcaMedia: number;
  emRisco: string[];
  porTopico: Array<{ id: string; forca: number }>;
} {
  if (topicos.length === 0) {
    return { notaProjetada: null, forcaMedia: 0, emRisco: [], porTopico: [] };
  }
  const porTopico = topicos.map((t) => ({ id: t.id, forca: questlyForcaNaProva(t, dataProvaMs, agoraMs) }));
  const forcaMedia = porTopico.reduce((acc, x) => acc + x.forca, 0) / porTopico.length;
  const emRisco = porTopico.filter((x) => x.forca < QUESTLY_FORCA_RISCO).map((x) => x.id);
  return { notaProjetada: Math.round(forcaMedia * 100), forcaMedia, emRisco, porTopico };
}

// ── ADAPTADOR PURO: evolui o estado do tópico após uma resposta ─────
// Recebe a linha atual (campos podem ser null em cold-start) + o
// resultado da questão; devolve os novos {maestria, estabilidade} já
// prontos pro upsert. taxaAnterior/numAnterior são o estado ANTES desta
// resposta (usados só pra semear quando maestria/estabilidade são null).
export function questlyEvoluirEstadoTopico(input: {
  maestria: number | null;
  estabilidade: number | null;
  ultimaRevisao: string | null;
  taxaAnterior: number;
  numAnterior: number;
  acertou: boolean;
  agoraMs: number;
}): { maestria: number; estabilidade: number } {
  const maestriaBase =
    input.maestria ?? questlyMaestriaSemente(input.taxaAnterior, input.numAnterior);
  const estabilidadeBase =
    input.estabilidade ?? questlyEstabilidadeSemente(input.taxaAnterior, input.numAnterior);

  const retencaoAgora = questlyRetencaoDeEstado(
    estabilidadeBase,
    input.ultimaRevisao,
    input.agoraMs,
  );

  return {
    maestria: questlyAtualizarMaestria(maestriaBase, input.acertou),
    estabilidade: questlyAtualizarEstabilidade(estabilidadeBase, input.acertou, retencaoAgora),
  };
}
