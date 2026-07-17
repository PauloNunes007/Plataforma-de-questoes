// ============================================================
// Vetor de features do modelo de P(acerto) — COMPARTILHADO entre o
// replay de treino (dataset.ts) e a inferência em produção
// (inferencia.ts). A ordem do array é um CONTRATO: mudar qualquer
// posição invalida os pesos salvos em `ml_modelos` — se mudar, mude
// também VERSAO_FEATURES pra que modelos antigos sejam ignorados.
//
// Todas as features saem normalizadas em [0,1]; campos que não existem
// no momento da previsão (ex.: dificuldade da questão numa projeção de
// prova agregada por tópico) recebem um default NEUTRO documentado —
// a rede aprende a marginalizar sobre eles.
// ============================================================

import {
  QUESTLY_BKT_GUESS,
  QUESTLY_BKT_SLIP,
} from "@/lib/questly/motor-aprovacao";

export const VERSAO_FEATURES = 1;

export type ContextoFeatures = {
  maestria: number; // P(domínio) BKT do tópico, antes da resposta
  retencao: number; // R = e^(-Δt/S) no momento da previsão (0 = nunca visto)
  numRespondidasTopico: number; // volume de prática no tópico
  estabilidade: number; // meia-vida de memória (dias)
  dificuldade: string | null; // 'facil'|'medio'|'dificil' | null (neutro)
  jaRespondeuQuestao: boolean; // o aluno já viu ESTA questão antes
  taxaGlobalQuestao: number | null; // % de acerto da questão entre todos (null = sem dado)
  taxaGeralAluno: number | null; // % de acerto histórico do aluno (null = sem dado)
  diasSemEstudar: number | null; // dias desde a última atividade do aluno
  posicaoNaSessao: number | null; // nº da questão na sessão de hoje (fadiga)
};

export const NOMES_FEATURES = [
  "maestria",
  "retencao",
  "volume_topico",
  "estabilidade",
  "dif_facil",
  "dif_medio",
  "dif_dificil",
  "ja_respondeu",
  "taxa_questao",
  "taxa_aluno",
  "dias_sem_estudar",
  "posicao_sessao",
] as const;

export const NUM_FEATURES = NOMES_FEATURES.length;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function montarFeatures(ctx: ContextoFeatures): number[] {
  return [
    clamp01(ctx.maestria),
    clamp01(ctx.retencao),
    clamp01(Math.log1p(Math.max(0, ctx.numRespondidasTopico)) / Math.log1p(50)),
    clamp01(Math.log1p(Math.max(0, ctx.estabilidade)) / Math.log1p(60)),
    ctx.dificuldade === "facil" ? 1 : 0,
    ctx.dificuldade === "medio" ? 1 : 0,
    ctx.dificuldade === "dificil" ? 1 : 0,
    ctx.jaRespondeuQuestao ? 1 : 0,
    ctx.taxaGlobalQuestao == null ? 0.5 : clamp01(ctx.taxaGlobalQuestao), // neutro = 0.5
    ctx.taxaGeralAluno == null ? 0.5 : clamp01(ctx.taxaGeralAluno), // neutro = 0.5
    ctx.diasSemEstudar == null ? 0 : clamp01(ctx.diasSemEstudar / 30),
    ctx.posicaoNaSessao == null ? 0 : clamp01(Math.log1p(ctx.posicaoNaSessao) / Math.log1p(30)),
  ];
}

// ── Baseline: o que o motor ATUAL implicitamente prevê ──────────────
// P(acerto) do BKT com esquecimento: o conhecimento efetivo no momento
// é maestria × retenção (mesma quantidade de questlyForcaNaProva), e a
// resposta observada passa pelo canal slip/guess. É contra ISTO que a
// rede precisa ganhar na validação pra ser ativada — se não ganhar, o
// app continua no BKT e nada muda.
export function probAcertoBaseline(maestria: number, retencao: number): number {
  const conhecimento = clamp01(maestria) * clamp01(retencao);
  return conhecimento * (1 - QUESTLY_BKT_SLIP) + (1 - conhecimento) * QUESTLY_BKT_GUESS;
}
