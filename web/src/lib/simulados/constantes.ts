// Constantes puras do módulo de Simulados. Simulado = prova cronometrada
// montada pelo aluno com questões reais da própria universidade (ex.: UFF),
// de anos aleatórios. Ver supabase_simulados.sql e web/CLAUDE.md.

// Durações oferecidas no montador (o aluno escolhe). 2h é o padrão — o formato
// clássico de uma prova de graduação, como pedido.
export const SIMULADO_DURACOES_MIN = [60, 120, 180] as const;
export const SIMULADO_DURACAO_PADRAO_MIN = 120;

// Quantidades sugeridas de questões (o aluno pode digitar outra até o teto).
export const SIMULADO_QUANTIDADES = [10, 20, 30, 45] as const;
export const SIMULADO_QTD_PADRAO = 20;
export const SIMULADO_QTD_MAX = 60;
export const SIMULADO_QTD_MIN = 5;

// Plano: free monta um número limitado de simulados por semana; Pro é ilimitado.
// A checagem é AUTORITATIVA no servidor (montarSimuladoAction) e a UI só
// espelha. Janela = semana da liga (segunda-feira local, questlySegundaDaSemana).
export const SIMULADO_FREE_LIMITE_SEMANA = 1;

export function clampQuantidade(qtd: number): number {
  if (!Number.isFinite(qtd)) return SIMULADO_QTD_PADRAO;
  return Math.max(SIMULADO_QTD_MIN, Math.min(SIMULADO_QTD_MAX, Math.round(qtd)));
}

export function ehDuracaoValida(min: number): boolean {
  return (SIMULADO_DURACOES_MIN as readonly number[]).includes(min);
}

// Nota 0..10 a partir de acertos/total (1 casa decimal), como boletim de prova.
export function notaSimulado(acertos: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((acertos / total) * 100) / 10;
}
