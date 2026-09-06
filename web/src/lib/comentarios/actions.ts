"use server";

import { createClient } from "@/lib/supabase/server";

// Discussão pública por questão (ver supabase_comentarios_questoes.sql).
// Mesmo padrão de lib/anotacoes/actions.ts: createClient()+auth.getUser() a
// cada chamada, RLS é a defesa real. Autoria (nome/username/foto) vem de
// profiles numa 2ª query, pois não há FK direto pra embedding.
//
// Threads: uma camada — comentário raiz (parent_id null) + respostas.
// Curtidas: linha por (user, comentário), contagem derivada.

export type Comentario = {
  id: string;
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  autorId: string;
  autorNome: string | null;
  autorUsername: string | null;
  autorFoto: string | null;
  meu: boolean;
  curtidas: number;
  euCurti: boolean;
  parentId: string | null;
  respostas: Comentario[];
};

const MAX = 2000;

type LinhaComentario = {
  id: string;
  texto: string;
  criado_em: string;
  editado_em: string | null;
  user_id: string;
  parent_id: string | null;
};

export async function carregarComentariosAction(
  questionId: string,
): Promise<{ comentarios: Comentario[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: linhas, error } = await supabase
    .from("question_comments")
    .select("id, texto, criado_em, editado_em, user_id, parent_id")
    .eq("question_id", questionId)
    .order("criado_em", { ascending: true });
  if (error) return { error: error.message };

  const rows = (linhas || []) as LinhaComentario[];
  if (rows.length === 0) return { comentarios: [] };

  const autoresIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const comentarioIds = rows.map((r) => r.id);

  const [{ data: profs }, { data: curtidas }] = await Promise.all([
    supabase.from("profiles").select("id, nome, username, foto_url").in("id", autoresIds),
    supabase.from("question_comment_likes").select("comment_id, user_id").in("comment_id", comentarioIds),
  ]);

  const perfis: Record<string, { nome: string | null; username: string | null; foto_url: string | null }> = {};
  (profs || []).forEach((p) => {
    perfis[p.id] = { nome: p.nome, username: p.username, foto_url: p.foto_url };
  });

  const contagem: Record<string, number> = {};
  const meusLikes = new Set<string>();
  (curtidas || []).forEach((l) => {
    contagem[l.comment_id] = (contagem[l.comment_id] ?? 0) + 1;
    if (l.user_id === user.id) meusLikes.add(l.comment_id);
  });

  const montar = (r: LinhaComentario): Comentario => ({
    id: r.id,
    texto: r.texto,
    criadoEm: r.criado_em,
    editadoEm: r.editado_em,
    autorId: r.user_id,
    autorNome: perfis[r.user_id]?.nome ?? null,
    autorUsername: perfis[r.user_id]?.username ?? null,
    autorFoto: perfis[r.user_id]?.foto_url ?? null,
    meu: r.user_id === user.id,
    curtidas: contagem[r.id] ?? 0,
    euCurti: meusLikes.has(r.id),
    parentId: r.parent_id,
    respostas: [],
  });

  const porId = new Map<string, Comentario>();
  const raizes: Comentario[] = [];
  rows.forEach((r) => porId.set(r.id, montar(r)));
  rows.forEach((r) => {
    const c = porId.get(r.id)!;
    if (r.parent_id && porId.has(r.parent_id)) {
      porId.get(r.parent_id)!.respostas.push(c);
    } else {
      raizes.push(c);
    }
  });

  // Raízes: mais recentes primeiro. Respostas: cronológicas (já estão asc).
  raizes.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  return { comentarios: raizes };
}

export async function criarComentarioAction(
  questionId: string,
  texto: string,
  parentId: string | null = null,
): Promise<{ comentario: Comentario } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const limpo = texto.trim().slice(0, MAX);
  if (!limpo) return { error: "Escreva algo antes de enviar." };

  const { data: inserido, error } = await supabase
    .from("question_comments")
    .insert({ user_id: user.id, question_id: questionId, texto: limpo, parent_id: parentId })
    .select("id, texto, criado_em, editado_em, user_id, parent_id")
    .single();
  if (error || !inserido) return { error: error?.message ?? "Não foi possível comentar." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, username, foto_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    comentario: {
      id: inserido.id,
      texto: inserido.texto,
      criadoEm: inserido.criado_em,
      editadoEm: inserido.editado_em,
      autorId: user.id,
      autorNome: perfil?.nome ?? null,
      autorUsername: perfil?.username ?? null,
      autorFoto: perfil?.foto_url ?? null,
      meu: true,
      curtidas: 0,
      euCurti: false,
      parentId: inserido.parent_id,
      respostas: [],
    },
  };
}

export async function editarComentarioAction(
  id: string,
  texto: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const limpo = texto.trim().slice(0, MAX);
  if (!limpo) return { error: "O comentário não pode ficar vazio." };

  const { error } = await supabase
    .from("question_comments")
    .update({ texto: limpo, editado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function excluirComentarioAction(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // RLS decide: o dono apaga o seu, o admin apaga qualquer um.
  const { error } = await supabase.from("question_comments").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function alternarCurtidaAction(
  commentId: string,
): Promise<{ curtido: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: existente } = await supabase
    .from("question_comment_likes")
    .select("comment_id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("question_comment_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);
    if (error) return { error: error.message };
    return { curtido: false };
  }

  const { error } = await supabase
    .from("question_comment_likes")
    .insert({ user_id: user.id, comment_id: commentId });
  if (error) return { error: error.message };
  return { curtido: true };
}
