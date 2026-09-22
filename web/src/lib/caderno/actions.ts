"use server";

import { createClient } from "@/lib/supabase/server";
import { CADERNO_FREE } from "@/lib/plano/limites";
import { ehPro } from "@/lib/plano/plano";
import { questlyHojeISO, questlyXpDaQuestao } from "@/lib/questly/shared";
import { minutosEstimados } from "@/lib/questly/criar-lista";

// Server Actions do Caderno de Erros. Mesmo padrão do resto do repo: cada
// action refaz createClient()+auth.getUser(), e a RLS dono-only
// (supabase_caderno_erros.sql) é a linha de defesa real — nunca a UI.

/** Teto de itens EM ABERTO no plano grátis. Resolvido não ocupa vaga, e
 *  guardar uma questão que já está no caderno não é criação (ver CADERNO_FREE). */
async function vagasDisponiveis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number | null> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", userId)
    .maybeSingle();
  if (ehPro(perfil)) return null; // sem teto

  const { count } = await supabase
    .from("caderno_erros")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("resolvido_em", null);
  return Math.max(0, CADERNO_FREE - (count ?? 0));
}

export async function guardarNoCadernoAction(
  questionId: string,
  attemptId: string | null,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // Já está guardada? Então não é criação — não consome vaga e não é erro.
  // (O upsert abaixo já seria idempotente pelo índice único; esta leitura
  // existe só pra não recusar por limite algo que não cria linha nenhuma.)
  const { data: existente } = await supabase
    .from("caderno_erros")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (!existente) {
    const vagas = await vagasDisponiveis(supabase, user.id);
    if (vagas !== null && vagas <= 0) {
      return {
        error: `O plano grátis guarda ${CADERNO_FREE} questões no Caderno. Marque alguma como resolvida, ou assine o Pro pra guardar sem limite.`,
      };
    }
  }

  const { error } = await supabase.from("caderno_erros").upsert(
    { user_id: user.id, question_id: questionId, attempt_id: attemptId },
    { onConflict: "user_id,question_id", ignoreDuplicates: true },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * Guarda de uma vez todos os erros de uma lista — o gatilho da tela de
 * resultado, que é o ponto de maior conversão do fluxo (é o único momento em
 * que o aluno pensa na lista inteira).
 *
 * Os ids NÃO vêm do cliente: a action lê as tentativas erradas da própria
 * missão, conferindo antes que ela é do aluno. Mesma regra de
 * finalizarMissaoAction — "recap, avulsa e question_ids vêm daqui, NÃO do
 * cliente, pra ninguém apontar pra missão de outro".
 */
export async function guardarErrosDaListaAction(
  missaoId: string,
): Promise<{ salvos: number; barrados: number } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: missao } = await supabase
    .from("missions")
    .select("id")
    .eq("id", missaoId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!missao) return { error: "Lista não encontrada." };

  const { data: erradas } = await supabase
    .from("question_attempts")
    .select("id, question_id, created_at")
    .eq("user_id", user.id)
    .eq("mission_id", missaoId)
    .eq("correta", false)
    .order("created_at", { ascending: true });

  // Uma entrada por questão (a última tentativa errada é a que vale).
  const attemptPorQuestao = new Map<string, string>();
  (erradas || []).forEach((t) => attemptPorQuestao.set(t.question_id as string, t.id as string));
  if (attemptPorQuestao.size === 0) return { salvos: 0, barrados: 0 };

  // O que já está no caderno não consome vaga nem conta como novo.
  const { data: jaGuardadas } = await supabase
    .from("caderno_erros")
    .select("question_id")
    .eq("user_id", user.id)
    .in("question_id", Array.from(attemptPorQuestao.keys()));
  const jaTem = new Set((jaGuardadas || []).map((c) => c.question_id as string));

  const novas = Array.from(attemptPorQuestao.entries()).filter(([qid]) => !jaTem.has(qid));
  const vagas = await vagasDisponiveis(supabase, user.id);
  // Salva até encher e DEVOLVE quantas ficaram de fora: salvar 3 de 5 em
  // silêncio é pior que recusar — a tela precisa poder dizer a verdade.
  const cabem = vagas === null ? novas.length : Math.min(novas.length, vagas);
  const paraSalvar = novas.slice(0, cabem);

  if (paraSalvar.length > 0) {
    const { error } = await supabase.from("caderno_erros").upsert(
      paraSalvar.map(([question_id, attempt_id]) => ({
        user_id: user.id,
        question_id,
        attempt_id,
      })),
      { onConflict: "user_id,question_id", ignoreDuplicates: true },
    );
    if (error) return { error: error.message };
  }

  return { salvos: paraSalvar.length, barrados: novas.length - paraSalvar.length };
}

export async function removerDoCadernoAction(
  questionId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("caderno_erros")
    .delete()
    .eq("user_id", user.id)
    .eq("question_id", questionId);
  if (error) return { error: error.message };
  return { ok: true };
}

/** Marca/desmarca "já resolvi". Nunca é barrado por limite: fechar pendência
 *  é justamente o que o teto do grátis quer incentivar. */
export async function alternarResolvidoAction(
  questionId: string,
  resolvido: boolean,
): Promise<{ resolvidoEm: string | null } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const resolvidoEm = resolvido ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("caderno_erros")
    .update({ resolvido_em: resolvidoEm })
    .eq("user_id", user.id)
    .eq("question_id", questionId);
  if (error) return { error: error.message };
  return { resolvidoEm };
}

/** Teto de questões por revisão. Uma sessão de revisão é curta por
 *  definição — e o teto diário do plano grátis continua valendo por cima,
 *  no registro de cada resposta. */
const REFAZER_MAX = 20;

/**
 * Cria uma lista avulsa com as questões escolhidas no Caderno — a ação que
 * fecha o ciclo "errei → guardei → refiz".
 *
 * Não dá pra reaproveitar `criarListaDeQuestoes`: aquele helper SORTEIA por
 * tópico, e aqui as questões são exatamente estas. A forma do insert é a de
 * `aceitarDesafioAction` (lib/questao/actions.ts), com o mesmo cálculo de XP
 * e de tempo previsto de qualquer lista.
 *
 * Refazer paga o XP normal, pela via normal (registrarRespostaAction) —
 * inclusive a regra de meio XP em questão já acertada antes. O Caderno em si
 * não paga nada.
 */
export async function refazerDoCadernoAction(
  questionIds: string[],
): Promise<{ missaoId: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null, error: "Sessão expirada." };

  const pedidos = Array.from(new Set(questionIds)).slice(0, REFAZER_MAX);
  if (pedidos.length === 0) return { missaoId: null, error: "Nenhuma questão selecionada." };

  // Só entra o que está DE FATO no caderno do aluno: a lista de ids vem do
  // cliente, e sem esta conferência ela viraria um jeito de montar uma lista
  // com qualquer questão do banco por fora dos filtros do Banco de Questões.
  const { data: doCaderno } = await supabase
    .from("caderno_erros")
    .select("question_id")
    .eq("user_id", user.id)
    .in("question_id", pedidos);
  const validos = new Set((doCaderno || []).map((c) => c.question_id as string));
  const ids = pedidos.filter((id) => validos.has(id));
  if (ids.length === 0) return { missaoId: null, error: "Essas questões não estão no seu caderno." };

  const { data: questoes } = await supabase
    .from("questions")
    .select("id, topic_id, dificuldade, tempo_medio_seg")
    .in("id", ids);
  const lista = questoes || [];
  if (lista.length === 0) return { missaoId: null, error: "Questões não encontradas." };

  const topicIds = Array.from(
    new Set(lista.map((q) => q.topic_id).filter((t): t is string => !!t)),
  );

  const { data: criada, error } = await supabase
    .from("missions")
    .insert({
      user_id: user.id,
      // subject_id null: uma revisão pode cruzar disciplinas, e
      // missions.subject_id é nullable justamente pra esse caso.
      subject_id: null,
      data: questlyHojeISO(),
      topic_ids: topicIds,
      question_ids: lista.map((q) => q.id),
      qtd_questoes: lista.length,
      tempo_previsto_min: minutosEstimados(lista),
      xp_recompensa: lista.reduce((acc, q) => acc + questlyXpDaQuestao(q), 0),
      concluida: false,
      avulsa: true,
    })
    .select("id")
    .single();

  if (error || !criada) {
    console.error("Erro ao criar lista de revisão do caderno:", error);
    return { missaoId: null, error: "Não deu pra montar a lista agora." };
  }
  return { missaoId: criada.id as string };
}
