// Portado de js/supabase-client.js — helpers puros compartilhados entre
// mission-engine, rotina-engine, liga e a UI do dashboard. Mantém os
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

// Formato mínimo de um boss (prova) usado por rotina-engine/mission-engine
// pra calcular peso/urgência — os dois módulos enxergam o mesmo shape, daí
// viver aqui em vez de duplicado com campos diferentes em cada um.
export type Boss = {
  id: string;
  nome: string;
  data_prova: string;
  preparo_percentual?: number | null;
  // escopo da prova (supabase_prova_topicos.sql): quais tópicos caem NESTA
  // prova. null/vazio = não definido → projeções usam todos os cai_na_prova.
  topico_ids?: string[] | null;
};

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

export function fmtDataCurta(d: Date): string {
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}
