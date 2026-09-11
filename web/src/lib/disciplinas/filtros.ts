// Helpers PUROS do filtro de dificuldade do Banco de Questões (sem Supabase),
// compartilhados pelo componente de cliente e pelas Server Actions.
//
// O chip "Incluir questões de desafio" viaja dentro do MESMO array de
// dificuldades que já ia pro servidor, como o valor especial "desafio". Isso
// evita mais um parâmetro atravessando wizard → prévia → action, ao custo de
// uma separação explícita aqui. Ver supabase_questao_desafio.sql.

/** Valor sentinela do array de dificuldades: não é um nível, é um opt-in. */
export const FILTRO_DESAFIO = "desafio";

export type FiltroDificuldade = {
  /** Níveis de verdade (facil | medio | dificil); vazio = todos. */
  niveis: string[];
  /** true = o aluno pediu para incluir também o aprofundamento. */
  incluirDesafio: boolean;
};

export function separarFiltroDificuldade(valores: string[]): FiltroDificuldade {
  return {
    niveis: valores.filter((v) => v !== FILTRO_DESAFIO),
    incluirDesafio: valores.includes(FILTRO_DESAFIO),
  };
}
