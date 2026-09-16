// Portado de js/supabase-client.js — helpers puros compartilhados entre
// liga, trilha e a UI do dashboard. Mantém os
// mesmos nomes/constantes do app legado (ver CLAUDE.md, seção "Learning
// science") para as duas versões não dessincronizarem.

export const QUESTLY_DIAS_SEMANA = [
  "dom",
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sab",
] as const; // índice = Date.getDay()

export type DiaSemana = (typeof QUESTLY_DIAS_SEMANA)[number];

// Uma linha de `missions`. Desde o repasse de 2026-09-16 TODA missão é
// avulsa: o motor que gerava uma missão por dia foi removido, e o que sobra
// são as listas que o próprio aluno monta (Banco de Questões, prática de um
// tópico da trilha, revisão relâmpago, desafio de recuperação). A tabela
// continua sendo a unidade de trabalho de `/questao` — é ela que guarda quais
// questões estão na lista e quanto XP ela vale.
export type Mission = {
  id: string;
  user_id: string;
  subject_id: string | null;
  data: string;
  topic_ids: string[];
  question_ids: string[];
  qtd_questoes: number;
  tempo_previsto_min: number | null;
  xp_recompensa: number;
  concluida: boolean;
  avulsa: boolean;
  subjects?: { nome: string } | null;
};

// Plural em pt-BR sem gambiarra de concatenar sufixo. Colar `"ões"` no fim de
// "questão" produzia o famoso "86 questãoões" da tela do Banco de Questões:
// em português o plural troca a terminação, não acrescenta.
export function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/** "1 questão" / "86 questões" — já com o número formatado em pt-BR. */
export function contagemQuestoes(n: number): string {
  return `${n.toLocaleString("pt-BR")} ${plural(n, "questão", "questões")}`;
}

export function questlyNormalizarDia(d: string): string {
  return d
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .slice(0, 3);
}

// XP por questão, ponderado pela dificuldade (inspirado em teoria de
// resposta ao item: acertar uma questão difícil é mais evidência de
// domínio — e mais esforço — que acertar uma fácil, então vale mais).
export const QUESTLY_XP_POR_DIFICULDADE: Record<string, number> = {
  facil: 3,
  medio: 5,
  dificil: 8,
};

export function questlyXpDaQuestao(q: { dificuldade?: string | null } | null | undefined) {
  return (q?.dificuldade && QUESTLY_XP_POR_DIFICULDADE[q.dificuldade]) || 5;
}

// XP de participação (errou, mas tentou). Zero XP por erro pune justamente
// o comportamento que a gente quer: encarar questão difícil. Aqui o erro
// paga uma fração pequena do acerto — o suficiente pra sessão nunca render
// nada, mas longe de competir com acertar (um acerto vale ~5x um erro).
//
// Só vale na PRIMEIRA vez que o aluno encara aquela questão: repetir uma
// questão já tentada errando de novo paga 0, senão vira farm de ranking.
export const QUESTLY_XP_ERRO_FRACAO = 0.2;

export function questlyXpDoErro(q: { dificuldade?: string | null } | null | undefined) {
  return Math.max(1, Math.round(questlyXpDaQuestao(q) * QUESTLY_XP_ERRO_FRACAO));
}

// Combo: acertos SEGUIDOS dentro da mesma sessão valem progressivamente
// mais. É reforço de razão variável em cima de um comportamento real
// (manter precisão em sequência é mais difícil que acertar uma isolada),
// não XP de graça — errar zera o combo na hora.
export const QUESTLY_COMBO_DEGRAUS: { seguidos: number; mult: number; rotulo: string }[] = [
  { seguidos: 3, mult: 1.15, rotulo: "Em ritmo" },
  { seguidos: 5, mult: 1.3, rotulo: "Embalado" },
  { seguidos: 8, mult: 1.5, rotulo: "Em chamas" },
  { seguidos: 12, mult: 1.75, rotulo: "Imparável" },
];

/** Multiplicador do combo. `seguidos` JÁ inclui a resposta atual. */
export function questlyMultiplicadorCombo(seguidos: number): number {
  let mult = 1;
  for (const d of QUESTLY_COMBO_DEGRAUS) {
    if (seguidos >= d.seguidos) mult = d.mult;
  }
  return mult;
}

/** Degrau de combo atingido EXATAMENTE agora (pra celebrar uma vez só). */
export function questlyDegrauCombo(seguidos: number) {
  return QUESTLY_COMBO_DEGRAUS.find((d) => d.seguidos === seguidos) ?? null;
}

export type EntradaXpResposta = {
  dificuldade?: string | null;
  correta: boolean;
  /** já acertou essa questão em OUTRA missão (anti-farming: paga metade) */
  jaAcertouAntes: boolean;
  /** já tentou essa questão antes (erro repetido não paga consolação) */
  jaTentouAntes: boolean;
  /** o tópico já era Mestre no início da missão (bônus 1.5x) */
  topicoMestre: boolean;
  /** acertos seguidos INCLUINDO esta resposta (0 quando errou) */
  acertosSeguidos: number;
};

// FONTE ÚNICA da regra de XP por resposta. O cliente usa pra mostrar o
// ganho na hora e o servidor usa pra recomputar o placar de forma
// autoritativa (lib/questao/actions.ts) — as duas pontas TÊM que sair do
// mesmo lugar, senão o número que anima na tela não é o que entra no
// ranking.
export function questlyXpDaResposta(e: EntradaXpResposta): number {
  if (!e.correta) return e.jaTentouAntes ? 0 : questlyXpDoErro(e);

  let xp = questlyXpDaQuestao(e);
  if (e.jaAcertouAntes) xp = Math.max(1, Math.round(xp / 2));
  if (e.topicoMestre) xp = Math.round(xp * QUESTLY_MAESTRIA_MULT_XP);
  return Math.max(1, Math.round(xp * questlyMultiplicadorCombo(e.acertosSeguidos)));
}

// Mastery learning: "Mestre" num tópico com taxa_acerto >= 90% e volume
// mínimo de 20 questões respondidas.
export const QUESTLY_MAESTRIA_TAXA = 0.9;
export const QUESTLY_MAESTRIA_MIN_QUESTOES = 20;
export const QUESTLY_MAESTRIA_MULT_XP = 1.5;

export type ProgressoTopico = {
  taxa_acerto?: number | null;
  num_questoes_respondidas?: number | null;
  ultima_revisao?: string | null;
};

export function questlyEhMestre(progresso: ProgressoTopico | null | undefined) {
  if (!progresso) return false;
  return (
    (progresso.num_questoes_respondidas || 0) >= QUESTLY_MAESTRIA_MIN_QUESTOES &&
    (progresso.taxa_acerto || 0) >= QUESTLY_MAESTRIA_TAXA
  );
}

// Revisão espaçada (Ebbinghaus): retenção estimada R = e^(-t/S), onde t =
// dias desde a última revisão e S = "estabilidade" da memória em dias,
// que cresce com volume x precisão no tópico.
export const QUESTLY_ESTABILIDADE_BASE_DIAS = 2;
export const QUESTLY_RETENCAO_LIMIAR = 0.6;

export function questlyEstabilidadeDias(progresso: ProgressoTopico | null | undefined) {
  const num = progresso?.num_questoes_respondidas || 0;
  const taxa = progresso?.taxa_acerto || 0;
  return QUESTLY_ESTABILIDADE_BASE_DIAS + num * taxa * 0.8;
}

export function questlyRetencaoTopico(
  progresso: ProgressoTopico | null | undefined,
  agoraMs: number,
): number | null {
  if (!progresso || !progresso.ultima_revisao) return null;
  const dias = Math.max(
    0,
    (agoraMs - new Date(progresso.ultima_revisao).getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.exp(-dias / questlyEstabilidadeDias(progresso));
}

export function questlyEmbaralhar<T>(arr: T[]): T[] {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function saudacaoPorHorario(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function diasAte(dataStr: string): number {
  const hoje = new Date(new Date().toDateString());
  const alvo = new Date(dataStr);
  return Math.max(0, Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
}

export function addDias(d: Date, n: number): Date {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + n);
  return copia;
}

export function toISODate(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// Data de HOJE (YYYY-MM-DD) no fuso LOCAL do dispositivo. Não use
// new Date().toISOString().slice(0,10): isso devolve a data em UTC e, à noite
// no Brasil (UTC-3), já rolou pro dia seguinte — então daily_log, lista do dia
// e heatmap caíam no dia errado, e discordavam do dia da semana escolhido pela
// grade (que usa Date.getDay(), local). Toda "data de hoje" persistida/comparada
// no app passa por aqui.
export function questlyHojeISO(): string {
  return toISODate(new Date());
}

export function fmtDataCurta(d: Date): string {
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}
