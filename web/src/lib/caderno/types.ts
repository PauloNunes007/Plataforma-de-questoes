import type { Pergunta } from "@/lib/questao/types";

/** Um item do Caderno de Erros, já montado com tudo que o cartão mostra.
 *  Ver lib/caderno/dados.ts pra de ONDE vem cada campo — a tabela
 *  `caderno_erros` guarda só a escolha de salvar. */
export type ItemCaderno = {
  questao: Pergunta & { materiaNome: string | null; topicoNome: string | null };
  /** o que o aluno marcou na tentativa que originou o item ("você marcou C") */
  respostaMarcada: string | null;
  /** conceito | calculo | interpretacao | chute — só o Pro classifica */
  motivoErro: string | null;
  /** quando a tentativa que gerou o item aconteceu (ISO) */
  erradoEm: string | null;
  /** quantas vezes o aluno já errou ESTA questão, na vida */
  vezesErrada: number;
  /** ele já acertou a questão em alguma tentativa POSTERIOR ao salvamento */
  acertouDepois: boolean;
  /** a anotação de question_notes (a mesma de /questoes/anotacoes) */
  notaTexto: string | null;
  resolvidoEm: string | null;
};

export type FiltroCaderno = "abertos" | "resolvidos" | "todos";

export type ResumoCaderno = {
  abertos: number;
  resolvidos: number;
};
