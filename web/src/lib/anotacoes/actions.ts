"use server";

import { createClient } from "@/lib/supabase/server";
import type { MotivoReport } from "./types";

// Portado do mesmo padrão de lib/*/actions.ts do resto do repo (ver
// web/CLAUDE.md): Server Action refaz o createClient()+auth.getUser() a
// cada chamada, RLS (owner-only, ver supabase_anotacoes_favoritos_relatos.sql)
// é a linha de defesa real.

export async function salvarNotaAction(questionId: string, nota: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const texto = nota.trim();
  if (!texto) {
    const { error } = await supabase
      .from("question_notes")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    if (error) return { error: error.message };
    return { ok: true };
  }

  const { error } = await supabase.from("question_notes").upsert(
    { user_id: user.id, question_id: questionId, nota: texto, atualizado_em: new Date().toISOString() },
    { onConflict: "user_id,question_id" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

export async function alternarFavoritoAction(questionId: string): Promise<{ favoritado: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: existente } = await supabase
    .from("question_favoritos")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("question_favoritos")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    if (error) return { error: error.message };
    return { favoritado: false };
  }

  const { error } = await supabase.from("question_favoritos").insert({ user_id: user.id, question_id: questionId });
  if (error) return { error: error.message };
  return { favoritado: true };
}

export async function reportarQuestaoAction(
  questionId: string,
  motivo: MotivoReport,
  detalhe: string | null,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase.from("question_reports").insert({
    user_id: user.id,
    question_id: questionId,
    motivo,
    detalhe: detalhe && detalhe.trim() ? detalhe.trim() : null,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
