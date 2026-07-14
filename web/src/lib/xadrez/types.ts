import type { Pergunta } from "@/lib/questao/types";

// Arena de Xadrez — o aluno nunca move peça: a qualidade da resposta na
// questão da rodada define a qualidade do lance que o engine joga por ele.
// Tipos compartilhados entre client (arena) e servidor (actions).

export type NivelIa = "facil" | "medio" | "dificil";
export type CorJogador = "brancas" | "pretas";
export type CorEscolhida = CorJogador | "aleatoria";
export type Dificuldade = "facil" | "medio" | "dificil";
export type ResultadoPartida = "vitoria" | "derrota" | "empate";

// Tier da resposta → qualidade do lance jogado pelo aluno (ver regras.ts).
export type TierResposta = "brilhante" | "bom" | "fraco" | "timeout";

export type RegistroRodada = {
  questionId: string;
  correta: boolean;
  tempoSeg: number;
  tier: TierResposta;
};

// Pool de perguntas sorteado up-front no iniciar (1 round-trip) — a
// dificuldade da rodada sobe com o andar da partida (dificuldadeDaRodada).
export type PoolPerguntas = Record<Dificuldade, Pergunta[]>;
