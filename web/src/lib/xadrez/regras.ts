import type { Dificuldade, NivelIa, TierResposta } from "./types";

// Regras da Arena de Xadrez — helpers PUROS (sem Supabase, sem DOM),
// compartilhados entre o client (loop da partida) e o servidor (cap de XP
// no finalizar). Mesma postura dos módulos lib/questly/*.

// Teto de XP por partida (anti-farm) — na casa de uma missão diária cheia.
export const XP_MAX_PARTIDA_XADREZ = 60;

// Bônus por vencer a máquina, escalado pela força dela.
export const BONUS_VITORIA: Record<NivelIa, number> = {
  facil: 10,
  medio: 15,
  dificil: 20,
};

// Força da IA adversária (Skill Level + profundidade UCI do Stockfish).
// O grading dos lances do ALUNO roda sempre em força máxima (ver engine.ts) —
// só a resposta da máquina é enfraquecida.
export const NIVEIS_IA: Record<NivelIa, { skill: number; depth: number; rotulo: string; descricao: string }> = {
  facil: { skill: 2, depth: 5, rotulo: "Fácil", descricao: "A máquina vacila — bom pra aprender o ritmo." },
  medio: { skill: 8, depth: 8, rotulo: "Médio", descricao: "Joga sólido, mas deixa brechas." },
  dificil: { skill: 15, depth: 12, rotulo: "Difícil", descricao: "Quase sem erros — cada questão importa." },
};

// Timer da rodada: tempo médio real da questão, com piso/teto pra ser
// "curto porém razoável" independente do dado do banco.
export const TEMPO_MIN_SEG = 20;
export const TEMPO_MAX_SEG = 90;
export const TEMPO_PADRAO_SEG = 45;

export function tempoDaPergunta(tempoMedioSeg: number | null | undefined): number {
  const base = tempoMedioSeg || TEMPO_PADRAO_SEG;
  return Math.min(TEMPO_MAX_SEG, Math.max(TEMPO_MIN_SEG, Math.round(base)));
}

// A dificuldade da questão acompanha a fase da partida (fullmove number):
// abertura = fácil, meio-jogo = médio, final = difícil.
export function dificuldadeDaRodada(fullmoveNumber: number): Dificuldade {
  if (fullmoveNumber <= 6) return "facil";
  if (fullmoveNumber <= 14) return "medio";
  return "dificil";
}

// Resposta correta em até metade do tempo = lance brilhante.
export function tierDaResposta(correta: boolean, tempoSeg: number, tempoTotalSeg: number, expirou: boolean): TierResposta {
  if (expirou) return "timeout";
  if (!correta) return "fraco";
  return tempoSeg <= tempoTotalSeg / 2 ? "brilhante" : "bom";
}

// Mapeia o tier pra um índice no ranking de lances do MultiPV (0 = melhor).
// Com poucos lances legais os intervalos colapsam sozinhos via clamp.
export function escolherIndicePorTier(tier: TierResposta, numLances: number): number {
  if (numLances <= 1) return 0;
  switch (tier) {
    case "brilhante":
      return 0;
    case "bom":
      return Math.floor(Math.random() * Math.min(3, numLances));
    case "fraco": {
      const inicioMetadeRuim = Math.floor(numLances / 2);
      return inicioMetadeRuim + Math.floor(Math.random() * (numLances - inicioMetadeRuim));
    }
    case "timeout":
      return numLances - 1;
  }
}

export const ROTULO_TIER: Record<TierResposta, string> = {
  brilhante: "Lance brilhante!",
  bom: "Bom lance",
  fraco: "Lance fraco",
  timeout: "Tempo esgotado",
};
