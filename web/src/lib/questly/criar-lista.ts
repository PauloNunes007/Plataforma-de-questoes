// Criação de uma LISTA DE QUESTÕES (uma linha de `missions` com `avulsa=true`)
// e a estimativa de tempo que acompanha essa decisão.
//
// Mora fora de `lib/disciplinas/actions.ts` porque agora existem DOIS caminhos
// que criam exatamente a mesma coisa e não podem divergir:
//   • o Banco de Questões, onde o aluno escolhe disciplina, assuntos,
//     dificuldade e quantidade na hora;
//   • o bloco de estudo do calendário, onde ele já escolheu a disciplina
//     (e talvez um alvo de questões) dias antes, e só clica em "Começar".
//
// Duplicar o insert significaria duas versões da regra de sorteio, de XP e de
// tempo previsto — e foi justamente o tempo previsto que já tinha divergido
// uma vez entre a prévia e a missão gravada.
//
// Sem "use server": este módulo é chamado POR Server Actions, e não é pra
// virar um endpoint invocável do browser.
import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyEmbaralhar, questlyHojeISO, questlyXpDaQuestao } from "@/lib/questly/shared";
import { separarFiltroDificuldade } from "@/lib/disciplinas/filtros";
import { lerPaginado } from "@/lib/supabase/paginado";

// Tempo por questão: `tempo_medio_seg` é uma média móvel alimentada pelas
// respostas reais (ver CLAUDE.md) e no começo da vida de uma questão ela pode
// vir absurda — um aluno que abandonou a aba grava 40min, quem chutou grava 4s.
// A faixa abaixo evita os dois extremos virarem "~1 min pra 10 questões", que
// era o que a tela do Banco mostrava.
export const SEG_PADRAO_QUESTAO = 150; // 2min30 — prior pra questão ainda sem dado
const SEG_MIN_QUESTAO = 40;
const SEG_MAX_QUESTAO = 900;

export type QuestaoParaLista = { id: string; dificuldade?: string | null; tempo_medio_seg?: number | null };

export function segundosDaQuestao(q: { tempo_medio_seg?: number | null }): number | null {
  const bruto = q.tempo_medio_seg;
  if (!bruto || bruto <= 0) return null;
  return Math.min(SEG_MAX_QUESTAO, Math.max(SEG_MIN_QUESTAO, bruto));
}

/** Minutos previstos pra um conjunto de questões: usa o dado real de quem tem,
 *  e a média das que têm (ou o prior) pras que ainda não têm. */
export function minutosEstimados(questoes: { tempo_medio_seg?: number | null }[]): number {
  if (questoes.length === 0) return 0;
  const reais = questoes.map(segundosDaQuestao).filter((s): s is number => s != null);
  const media = reais.length > 0 ? reais.reduce((a, s) => a + s, 0) / reais.length : SEG_PADRAO_QUESTAO;
  const totalSeg = reais.reduce((a, s) => a + s, 0) + (questoes.length - reais.length) * media;
  return Math.max(1, Math.round(totalSeg / 60));
}

/** O contrário de `minutosEstimados`: quantas questões cabem num bloco de N
 *  minutos, dado o tempo médio por questão do assunto. É o que traduz "50min
 *  de Cálculo II" numa lista de tamanho real — sem isso, um bloco com hora
 *  marcada e sem alvo de questões não teria como virar lista. `mediaSeg` null
 *  (assunto sem nenhuma medida ainda) cai no prior. */
export function questoesQueCabem(minutos: number, mediaSeg: number | null): number {
  const media = mediaSeg && mediaSeg > 0 ? mediaSeg : SEG_PADRAO_QUESTAO;
  return Math.max(1, Math.round((minutos * 60) / media));
}

export type NovaLista = {
  /** null quando a disciplina não é uma das do aluno (só descoberta no
   *  banco) — missions.subject_id é nullable justamente pra esse caso. */
  subjectId: string | null;
  topicIds: string[];
  /** vazio = todas as dificuldades; o valor especial "desafio" é opt-in. */
  dificuldades: string[];
  quantidade: number | "todas";
  /** Marca a lista como recap de um tópico (trilha). */
  recapTopicoId?: string | null;
  /**
   * Questões a DESPRIORIZAR no sorteio — as que o aluno acabou de responder,
   * quando esta lista é a continuação de outra ("mais 10 do mesmo assunto").
   *
   * Despriorizar, não excluir: num tópico com 12 questões, excluir as 10 que
   * acabaram de sair devolveria uma lista de 2 (ou nenhuma). Elas vão pro fim
   * da fila e só entram se não houver com que preencher — repetir é chato,
   * mas "não há mais nada aqui" logo depois de um clique em "mais 10" é pior.
   */
  despriorizarIds?: string[];
};

/**
 * Sorteia as questões e grava a missão avulsa. Devolve o id ou null — quem
 * chama decide o que dizer ao aluno.
 */
export async function criarListaDeQuestoes(
  supabase: SupabaseClient,
  userId: string,
  input: NovaLista,
): Promise<{ missaoId: string | null; total: number }> {
  if (input.topicIds.length === 0) return { missaoId: null, total: 0 };

  const filtro = separarFiltroDificuldade(input.dificuldades);
  // Paginado, não `await query` direto: o teto do PostgREST é 1000 linhas e um
  // `.limit()` maior só consegue ABAIXÁ-LO (ver lib/supabase/paginado.ts). Uma
  // disciplina que passe de 1000 questões teria a cauda do conjunto cortada em
  // silêncio — as questões além da linha 1000 nunca seriam sorteadas, e
  // "todas" pararia em 1000 sem ninguém avisar. Mesma correção que o sorteio
  // do simulado já tinha (lib/simulados/actions.ts).
  const candidatas = await lerPaginado<QuestaoParaLista>(() => {
    let query = supabase
      .from("questions")
      .select("id, tempo_medio_seg, dificuldade")
      .in("topic_id", input.topicIds);
    if (filtro.niveis.length > 0) query = query.in("dificuldade", filtro.niveis);
    // Aprofundamento só entra quando o aluno pede: é o único lugar do app em
    // que ele encontra essas questões. Ver supabase_questao_desafio.sql.
    if (!filtro.incluirDesafio) query = query.eq("desafio", false);
    return query;
  });
  if (candidatas.length === 0) return { missaoId: null, total: 0 };

  // Embaralha primeiro (o sorteio continua sendo sorteio) e só então empurra
  // pro fim as que o aluno acabou de ver — a ordem relativa dentro de cada
  // grupo segue aleatória.
  const despriorizar = new Set(input.despriorizarIds ?? []);
  const sorteadas = questlyEmbaralhar(candidatas);
  const embaralhadas =
    despriorizar.size === 0
      ? sorteadas
      : [
          ...sorteadas.filter((q) => !despriorizar.has(q.id)),
          ...sorteadas.filter((q) => despriorizar.has(q.id)),
        ];
  const qtdQuestoes =
    input.quantidade === "todas"
      ? embaralhadas.length
      : Math.min(input.quantidade, embaralhadas.length);
  const escolhidas = embaralhadas.slice(0, qtdQuestoes);

  const { data: criada, error } = await supabase
    .from("missions")
    .insert({
      user_id: userId,
      subject_id: input.subjectId,
      data: questlyHojeISO(),
      topic_ids: input.topicIds,
      question_ids: escolhidas.map((q) => q.id),
      qtd_questoes: qtdQuestoes,
      // mesma conta da prévia, pra o tempo mostrado antes de começar bater com
      // o que a missão avulsa grava (e sem os extremos de tempo_medio_seg)
      tempo_previsto_min: minutosEstimados(escolhidas),
      xp_recompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
      recap_topico_id: input.recapTopicoId ?? null,
    })
    .select("id")
    .single();

  if (error || !criada) {
    console.error("Erro ao criar lista de questões:", error);
    return { missaoId: null, total: candidatas.length };
  }
  return { missaoId: criada.id as string, total: candidatas.length };
}
