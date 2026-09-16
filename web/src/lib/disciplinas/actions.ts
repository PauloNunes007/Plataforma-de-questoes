"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyXpDaQuestao } from "@/lib/questly/shared";
import { criarListaDeQuestoes, minutosEstimados } from "@/lib/questly/criar-lista";
import { carregarTopicosPratica, type TopicoPratica } from "./disciplinas-data";
import { separarFiltroDificuldade } from "./filtros";

export async function buscarTopicosPraticaAction(materiaId: string): Promise<TopicoPratica[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return carregarTopicosPratica(supabase, user, materiaId);
}

export type PreviaPratica = {
  /** quantas questões existem no banco com os filtros atuais */
  total: number;
  /** quantas vão de fato ser sorteadas (respeita a quantidade escolhida) */
  selecionadas: number;
  xpEstimado: number;
  tempoEstimadoMin: number;
  /** quebra do pool por dificuldade, pra o resumo mostrar a mistura real */
  porDificuldade: { facil: number; medio: number; dificil: number };
};

// O tempo por questão (e os limites que evitam "~1 min pra 10 questões")
// mora em lib/questly/criar-lista.ts: a prévia mostrada aqui e o
// `tempo_previsto_min` gravado na missão TÊM que sair da mesma conta, e é lá
// que a lista é criada — pelo Banco de Questões e pelo bloco do calendário.

// prévia ao vivo enquanto o aluno mexe nos filtros — não cria nada ainda,
// só conta o que existe e estima XP/tempo pra decisão informada
export async function calcularPreviaPraticaAction(
  topicIds: string[],
  dificuldades: string[],
  quantidade: number | "todas",
): Promise<PreviaPratica> {
  const vazia: PreviaPratica = {
    total: 0,
    selecionadas: 0,
    xpEstimado: 0,
    tempoEstimadoMin: 0,
    porDificuldade: { facil: 0, medio: 0, dificil: 0 },
  };
  if (topicIds.length === 0) return vazia;

  const supabase = await createClient();
  const filtro = separarFiltroDificuldade(dificuldades);
  let query = supabase.from("questions").select("id, dificuldade, tempo_medio_seg").in("topic_id", topicIds);
  if (filtro.niveis.length > 0) query = query.in("dificuldade", filtro.niveis);
  // Aprofundamento só entra quando o aluno pede: é o único lugar do app em
  // que ele encontra essas questões. Ver supabase_questao_desafio.sql.
  if (!filtro.incluirDesafio) query = query.eq("desafio", false);
  const { data } = await query;
  const pool = data || [];
  const total = pool.length;
  if (total === 0) return vazia;

  const selecionadas = quantidade === "todas" ? total : Math.min(quantidade, total);

  // estimativa não-enviesada: XP médio do pool inteiro (não só uma amostra)
  // vezes quantas questões de fato vão ser sorteadas
  const xpTotalPool = pool.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0);
  const xpEstimado = Math.round((xpTotalPool / total) * selecionadas);

  // tempo: média do pool aplicada ao tanto que vai ser sorteado
  const tempoEstimadoMin = Math.max(
    1,
    Math.round((minutosEstimados(pool) / total) * selecionadas),
  );

  const porDificuldade = { facil: 0, medio: 0, dificil: 0 };
  for (const q of pool) {
    if (q.dificuldade === "facil") porDificuldade.facil += 1;
    else if (q.dificuldade === "dificil") porDificuldade.dificil += 1;
    else porDificuldade.medio += 1;
  }

  return { total, selecionadas, xpEstimado, tempoEstimadoMin, porDificuldade };
}

export async function iniciarPraticaLivreAction(input: {
  /** null quando a disciplina não é uma das do aluno (só descoberta no
   *  banco) — missions.subject_id é nullable justamente pra esse caso. */
  subjectId: string | null;
  topicIds: string[];
  dificuldades: string[];
  quantidade: number | "todas";
}): Promise<{ missaoId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  const { missaoId } = await criarListaDeQuestoes(supabase, user.id, input);
  return { missaoId };
}
