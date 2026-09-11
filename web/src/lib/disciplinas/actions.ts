"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar, questlyHojeISO, questlyXpDaQuestao } from "@/lib/questly/shared";
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

// Tempo por questão: `tempo_medio_seg` é uma média móvel alimentada pelas
// respostas reais (ver CLAUDE.md) e no começo da vida de uma questão ela pode
// vir absurda — um aluno que abandonou a aba grava 40min, quem chutou grava 4s.
// A faixa abaixo evita os dois extremos virarem "~1 min pra 10 questões", que
// era o que a tela do Banco mostrava.
const SEG_PADRAO_QUESTAO = 150; // 2min30 — prior pra questão ainda sem dado
const SEG_MIN_QUESTAO = 40;
const SEG_MAX_QUESTAO = 900;

function segundosDaQuestao(q: { tempo_medio_seg?: number | null }): number | null {
  const bruto = q.tempo_medio_seg;
  if (!bruto || bruto <= 0) return null;
  return Math.min(SEG_MAX_QUESTAO, Math.max(SEG_MIN_QUESTAO, bruto));
}

// Minutos previstos pra um conjunto de questões: usa o dado real de quem tem,
// e a média das que têm (ou o prior) pras que ainda não têm.
function minutosEstimados(questoes: { tempo_medio_seg?: number | null }[]): number {
  if (questoes.length === 0) return 0;
  const reais = questoes.map(segundosDaQuestao).filter((s): s is number => s != null);
  const media = reais.length > 0 ? reais.reduce((a, s) => a + s, 0) / reais.length : SEG_PADRAO_QUESTAO;
  const totalSeg = reais.reduce((a, s) => a + s, 0) + (questoes.length - reais.length) * media;
  return Math.max(1, Math.round(totalSeg / 60));
}

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
  if (!user || input.topicIds.length === 0) return { missaoId: null };

  const filtro = separarFiltroDificuldade(input.dificuldades);
  let query = supabase
    .from("questions")
    .select("id, tempo_medio_seg, dificuldade")
    .in("topic_id", input.topicIds);
  if (filtro.niveis.length > 0) query = query.in("dificuldade", filtro.niveis);
  if (!filtro.incluirDesafio) query = query.eq("desafio", false);
  const { data: candidatas } = await query;
  if (!candidatas || candidatas.length === 0) return { missaoId: null };

  const embaralhadas = questlyEmbaralhar(candidatas);
  const qtdQuestoes = input.quantidade === "todas" ? embaralhadas.length : Math.min(input.quantidade, embaralhadas.length);
  const escolhidas = embaralhadas.slice(0, qtdQuestoes);
  const questionIds = escolhidas.map((q) => q.id);

  // mesma conta da prévia, pra o tempo mostrado antes de começar bater com o
  // que a missão avulsa grava (e sem os extremos de tempo_medio_seg)
  const tempoPrevistoMin = minutosEstimados(escolhidas);

  const { data: missaoCriada, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      data: questlyHojeISO(),
      topic_ids: input.topicIds,
      question_ids: questionIds,
      qtd_questoes: qtdQuestoes,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: escolhidas.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
    })
    .select("id")
    .single();

  if (error || !missaoCriada) {
    console.error("Erro ao criar missão avulsa:", error);
    return { missaoId: null };
  }
  return { missaoId: missaoCriada.id as string };
}
