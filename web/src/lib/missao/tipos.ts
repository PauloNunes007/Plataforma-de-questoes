// Tipos e limites do controle manual da missão do dia.
//
// Vive FORA de actions.ts de propósito: um módulo "use server" só pode
// exportar funções async — exportar um tipo (ou uma constante) dali derruba
// TODAS as Server Actions do chunk em runtime, com build e tsc passando
// (ver a nota "use_server_reexport_tipo" na memória do projeto).

/** Um tópico da ementa da disciplina, como opção de troca na missão. */
export type TopicoOpcao = {
  id: string;
  nome: string;
  ordem: number | null;
  questoes: number;
  selecionado: boolean;
  status: string;
};

/** Tamanhos oferecidos no ajuste rápido ("hoje eu quero N questões").
 *  O teto real é QUESTLY_MAX_QUESTOES_MISSAO, do mission-engine. */
export const TAMANHOS_MISSAO = [5, 10, 15, 20, 30] as const;

export type ResultadoMissao = { error: string | null };
