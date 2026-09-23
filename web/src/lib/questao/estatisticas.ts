// Estatísticas PÚBLICAS de uma questão: quanto da plataforma acerta e onde as
// respostas caem. Aqui só o TIPO e a MATEMÁTICA (função pura, sem Supabase,
// mesmo padrão de `lib/questly/chance-aprovacao.ts`); quem busca o dado é
// `carregarEstatisticasQuestaoAction` em `lib/questao/actions.ts`.
//
// A fonte é `vw_distribuicao_respostas` (supabase_estatisticas_questao.sql),
// uma view AGREGADA — o app nunca vê tentativa de aluno nenhum, só contagem por
// letra. `question_attempts` tem RLS dono-only, então contar no cliente daria a
// estatística de UMA pessoa disfarçada de estatística da plataforma.
//
// POR QUE O DADO É BUSCADO SOB DEMANDA, E NÃO JUNTO COM A LISTA
//
//  1. SPOILER. A distribuição diz qual letra a maioria marcou. Se viesse com a
//     página, estaria no HTML antes de o aluno responder — "68% marcaram a B" é
//     a resposta de graça. O painel só existe DEPOIS de confirmar;
//  2. CUSTO. Uma lista tem até 40 questões; carregar as 40 pra que ele talvez
//     abra uma seria pagar 40 agregações por lista.
//
// Nada disso é escrita: não paga XP, não acende ofensiva, não entra no ranking.

/** Piso de amostra pra desenhar o gráfico. Abaixo disso a "distribuição" é
 *  quase um histórico individual (com 2 respostas, uma barra de 50% descreve
 *  uma pessoa) e não informa nada — a tela diz isso em vez de desenhar. Régua
 *  de produto, então vive aqui e não na view. */
export const EST_MIN_AMOSTRA = 8;

export type FatiaAlternativa = {
  letra: string;
  total: number;
  /** fração de 0..1 sobre o total de respostas */
  fracao: number;
  correta: boolean;
};

export type EstatisticasQuestao = {
  /** respostas contabilizadas (a soma das fatias) */
  amostra: number;
  /** fração 0..1 de quem marcou o gabarito. null = amostra insuficiente */
  taxaAcerto: number | null;
  /** uma fatia por alternativa da questão, em ordem alfabética. Vazio =
   *  amostra insuficiente (a tela mostra o estado vazio, não um gráfico) */
  fatias: FatiaAlternativa[];
  /** a alternativa errada mais marcada — o distrator que mais pega gente.
   *  null quando ninguém errou ou a amostra é insuficiente. */
  pegadinha: FatiaAlternativa | null;
  /** tempo médio gasto na questão, em segundos. null = ainda sem estimativa */
  tempoMedioSeg: number | null;
  /** true = tem dado, mas ainda abaixo de EST_MIN_AMOSTRA */
  amostraInsuficiente: boolean;
};

export const ESTATISTICAS_VAZIAS: EstatisticasQuestao = {
  amostra: 0,
  taxaAcerto: null,
  fatias: [],
  pegadinha: null,
  tempoMedioSeg: null,
  amostraInsuficiente: false,
};

/**
 * Monta as estatísticas a partir das linhas cruas da view.
 *
 * @param linhas       uma por letra marcada, como a view devolve
 * @param gabarito     `questions.gabarito`
 * @param letrasQuestao as letras que a questão OFERECE hoje
 */
export function resumirDistribuicao({
  linhas,
  gabarito,
  letrasQuestao,
  tempoMedioSeg,
}: {
  linhas: { letra: string | null; total: number | string | null }[];
  gabarito: string | null;
  letrasQuestao: string[];
  tempoMedioSeg: number | null;
}): EstatisticasQuestao {
  const alvo = String(gabarito || "").toLowerCase();

  const contagem = new Map<string, number>();
  for (const l of linhas) {
    const letra = String(l.letra || "")
      .trim()
      .toLowerCase();
    if (!letra) continue;
    contagem.set(letra, (contagem.get(letra) ?? 0) + Number(l.total || 0));
  }

  // As letras vêm das ALTERNATIVAS da questão, não da view: uma alternativa que
  // ninguém marcou tem que aparecer com 0 (a ausência é informação), e uma
  // letra gravada que a questão não oferece mais — gabarito reeditado, dado
  // sujo — não pode inventar uma sexta barra.
  const daQuestao = letrasQuestao.map((l) => l.trim().toLowerCase()).filter(Boolean);
  const escopo = (daQuestao.length ? daQuestao : Array.from(contagem.keys())).sort();

  const amostra = escopo.reduce((soma, l) => soma + (contagem.get(l) ?? 0), 0);

  if (amostra < EST_MIN_AMOSTRA) {
    return {
      ...ESTATISTICAS_VAZIAS,
      amostra,
      tempoMedioSeg,
      amostraInsuficiente: amostra > 0,
    };
  }

  const fatias: FatiaAlternativa[] = escopo.map((letra) => {
    const total = contagem.get(letra) ?? 0;
    return { letra, total, fracao: total / amostra, correta: letra === alvo };
  });

  const erradas = fatias.filter((f) => !f.correta && f.total > 0);

  return {
    amostra,
    // A taxa de acerto SAI DA MESMA SOMA das barras, de propósito: ler o
    // percentual de `questions.acertos_total` e as barras da view faria o anel
    // discordar do gráfico ao lado dele — dois lugares pra mesma verdade, a
    // classe de bug que supabase_ranking_fiel.sql gastou uma migração inteira
    // consertando.
    taxaAcerto: (contagem.get(alvo) ?? 0) / amostra,
    fatias,
    pegadinha: erradas.length
      ? erradas.reduce((a, b) => (b.total > a.total ? b : a))
      : null,
    tempoMedioSeg,
    amostraInsuficiente: false,
  };
}
