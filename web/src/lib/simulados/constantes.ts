// Constantes puras do módulo de Simulados. Simulado = prova cronometrada
// montada pelo aluno com questões reais da própria universidade (ex.: UFF),
// de anos aleatórios. Ver supabase_simulados.sql e web/CLAUDE.md.

// Durações oferecidas no montador (o aluno escolhe). 2h é o padrão — o formato
// clássico de uma prova de graduação, como pedido. As faixas curtas (30/45min)
// existem porque nem todo simulado é prova inteira: revisar um tópico contra o
// relógio é o uso mais frequente no meio do semestre.
export const SIMULADO_DURACOES_MIN = [30, 45, 60, 90, 120, 180, 240] as const;

// O montador simples (2026-09-10) oferece só estas quatro — sete opções de
// relógio era escolha demais pra uma decisão que o aluno quase nunca quer
// tomar. O servidor continua aceitando qualquer valor de SIMULADO_DURACOES_MIN.
export const SIMULADO_DURACOES_SUGERIDAS = [30, 60, 90, 120] as const;

// Quantidades sugeridas de questões (o aluno pode digitar outra até o teto).
export const SIMULADO_QUANTIDADES = [10, 15, 20, 30] as const;
export const SIMULADO_QTD_PADRAO = 20;
export const SIMULADO_QTD_MAX = 60;
export const SIMULADO_QTD_MIN = 5;

// Plano: free monta um número limitado de simulados por semana; Pro é ilimitado.
// A checagem é AUTORITATIVA no servidor (montarSimuladoAction) e a UI só
// espelha. Janela = semana da liga (segunda-feira local, questlySegundaDaSemana).
export const SIMULADO_FREE_LIMITE_SEMANA = 1;

// ---------------------------------------------------------------------------
// Regras da prova (o "como" do sorteio) — tudo isto é validado de novo no
// servidor; a UI só oferece as opções.
// ---------------------------------------------------------------------------

/** Chave de dificuldade usada no montador. "outra" = questão sem rótulo no banco. */
export const DIFICULDADES_SIMULADO = ["facil", "medio", "dificil"] as const;
export type DificuldadeSimulado = (typeof DIFICULDADES_SIMULADO)[number];

/**
 * Como as questões são sorteadas dentro do recorte escolhido.
 *  - `aleatoria`: sorteio limpo, anos misturados (o comportamento original);
 *  - `fracos`: pondera pelos tópicos onde o aluno vai pior (aproveitamento
 *    baixo em `aluno_topico_progresso`) — mais questões de onde dói;
 *  - `recentes`: prioriza os anos mais recentes, pro aluno treinar o estilo
 *    atual da banca.
 */
export const ESTRATEGIAS_SIMULADO = ["aleatoria", "fracos", "recentes"] as const;
export type EstrategiaSimulado = (typeof ESTRATEGIAS_SIMULADO)[number];

/** Ordem em que as questões aparecem na prova (fixada na criação). */
export const ORDENS_SIMULADO = ["aleatoria", "crescente"] as const;
export type OrdemSimulado = (typeof ORDENS_SIMULADO)[number];

// ---------------------------------------------------------------------------
// Índice de disponibilidade (puro) — o que faz a prévia do montador responder
// AO VIVO, sem uma ida ao servidor por clique. Fica aqui, e não em
// simulados-data.ts, porque o montador é um componente de cliente: importar do
// módulo de dados arrastaria o SupabaseClient pro bundle.
// ---------------------------------------------------------------------------

/** Chave de dificuldade no índice ("outra" = questão sem rótulo no banco). */
export type ChaveDificuldade = DificuldadeSimulado | "outra";

export const CHAVES_DIFICULDADE: readonly ChaveDificuldade[] = [...DIFICULDADES_SIMULADO, "outra"];

export const ROTULO_DIFICULDADE_SIMULADO: Record<ChaveDificuldade, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  outra: "Sem rótulo",
};

/** dificuldade → ano ("0" = ano desconhecido) → nº de questões. */
export type GradeTopico = Record<ChaveDificuldade, Record<string, number>>;

export function gradeVazia(): GradeTopico {
  return { facil: {}, medio: {}, dificil: {}, outra: {} };
}

export function normalizarChaveDificuldade(v: string | null | undefined): ChaveDificuldade {
  const s = (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (s.startsWith("fac")) return "facil";
  if (s.startsWith("med")) return "medio";
  if (s.startsWith("dif")) return "dificil";
  return "outra";
}

/**
 * Quantas questões um tópico oferece dado o recorte. Lista vazia = "todas"
 * daquela dimensão (é assim que o montador representa "sem filtro", em vez de
 * marcar tudo e ter que manter sincronia).
 */
export function contarNaGrade(
  grade: GradeTopico,
  dificuldades: readonly ChaveDificuldade[],
  anos: readonly number[],
): number {
  const difs = dificuldades.length > 0 ? dificuldades : CHAVES_DIFICULDADE;
  let total = 0;
  for (const d of difs) {
    const porAno = grade[d];
    if (!porAno) continue;
    if (anos.length === 0) {
      for (const n of Object.values(porAno)) total += n;
    } else {
      for (const a of anos) total += porAno[String(a)] || 0;
    }
  }
  return total;
}

export function clampQuantidade(qtd: number): number {
  if (!Number.isFinite(qtd)) return SIMULADO_QTD_PADRAO;
  return Math.max(SIMULADO_QTD_MIN, Math.min(SIMULADO_QTD_MAX, Math.round(qtd)));
}

export function ehDuracaoValida(min: number): boolean {
  return (SIMULADO_DURACOES_MIN as readonly number[]).includes(min);
}

export function ehEstrategiaValida(v: unknown): v is EstrategiaSimulado {
  return (ESTRATEGIAS_SIMULADO as readonly string[]).includes(String(v));
}

export function ehOrdemValida(v: unknown): v is OrdemSimulado {
  return (ORDENS_SIMULADO as readonly string[]).includes(String(v));
}

/**
 * Tempo de prova sugerido pelo tamanho dela: ~3min por questão (o ritmo de uma
 * prova de graduação), arredondado pra opção mais próxima entre as sugeridas.
 * Existe pra o aluno não precisar decidir duas coisas — ele escolhe quantas
 * questões quer e o relógio se ajusta sozinho, mas segue editável.
 */
export function duracaoSugerida(quantidade: number): number {
  const alvo = Math.max(1, quantidade) * 3;
  return SIMULADO_DURACOES_SUGERIDAS.reduce((melhor, min) =>
    Math.abs(min - alvo) < Math.abs(melhor - alvo) ? min : melhor,
  );
}

/** Rótulo curto de duração ("2h", "90min") — usado no montador e nos resumos. */
export function rotuloDuracao(min: number): string {
  if (min % 60 === 0) return `${min / 60}h`;
  if (min > 60) return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
  return `${min}min`;
}

// Nota 0..10 a partir de acertos/total (1 casa decimal), como boletim de prova.
export function notaSimulado(acertos: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((acertos / total) * 100) / 10;
}
