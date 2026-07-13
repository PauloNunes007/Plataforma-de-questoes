// Loaders (não "use server", chamados direto de Server Components — mesmo
// padrão de lib/disciplinas/disciplinas-data.ts) pras telas "Favoritos" e
// "Minhas anotações" em /questoes.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pergunta } from "@/lib/questao/types";

export type QuestaoComContexto = Pergunta & {
  materiaNome: string | null;
  topicoNome: string | null;
};

export type ItemFavoritoOuAnotado = {
  questao: QuestaoComContexto;
  notaTexto: string | null;
  favoritado: boolean;
};

type TopicoEmbutido = { nome: string; materias: { nome: string } | { nome: string }[] | null };

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

async function montarItens(
  supabase: SupabaseClient,
  userId: string,
  questionIds: string[],
): Promise<Map<string, QuestaoComContexto>> {
  if (questionIds.length === 0) return new Map();

  const { data: questoes } = await supabase
    .from("questions")
    .select("*, topicos(nome, materias(nome))")
    .in("id", questionIds);

  const mapa = new Map<string, QuestaoComContexto>();
  (questoes || []).forEach((q) => {
    const topico = primeiro(q.topicos as unknown as TopicoEmbutido | TopicoEmbutido[]);
    const materia = primeiro(topico?.materias ?? null);
    mapa.set(q.id, { ...(q as Pergunta), materiaNome: materia?.nome ?? null, topicoNome: topico?.nome ?? null });
  });
  return mapa;
}

export async function carregarFavoritos(supabase: SupabaseClient, user: { id: string }): Promise<ItemFavoritoOuAnotado[]> {
  const { data: favoritos } = await supabase
    .from("question_favoritos")
    .select("question_id, criado_em")
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });

  const ids = (favoritos || []).map((f) => f.question_id as string);
  if (ids.length === 0) return [];

  const [questoesPorId, { data: notas }] = await Promise.all([
    montarItens(supabase, user.id, ids),
    supabase.from("question_notes").select("question_id, nota").eq("user_id", user.id).in("question_id", ids),
  ]);
  const notaPorId: Record<string, string> = {};
  (notas || []).forEach((n) => (notaPorId[n.question_id] = n.nota));

  return ids
    .map((id) => questoesPorId.get(id))
    .filter((q): q is QuestaoComContexto => !!q)
    .map((questao) => ({ questao, notaTexto: notaPorId[questao.id] ?? null, favoritado: true }));
}

export async function carregarQuestoesComNotas(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<ItemFavoritoOuAnotado[]> {
  const { data: notas } = await supabase
    .from("question_notes")
    .select("question_id, nota, atualizado_em")
    .eq("user_id", user.id)
    .order("atualizado_em", { ascending: false });

  const ids = (notas || []).map((n) => n.question_id as string);
  if (ids.length === 0) return [];

  const [questoesPorId, { data: favoritos }] = await Promise.all([
    montarItens(supabase, user.id, ids),
    supabase.from("question_favoritos").select("question_id").eq("user_id", user.id).in("question_id", ids),
  ]);
  const favoritoSet = new Set((favoritos || []).map((f) => f.question_id as string));
  const notaPorId: Record<string, string> = {};
  (notas || []).forEach((n) => (notaPorId[n.question_id] = n.nota));

  return ids
    .map((id) => questoesPorId.get(id))
    .filter((q): q is QuestaoComContexto => !!q)
    .map((questao) => ({
      questao,
      notaTexto: notaPorId[questao.id] ?? null,
      favoritado: favoritoSet.has(questao.id),
    }));
}
