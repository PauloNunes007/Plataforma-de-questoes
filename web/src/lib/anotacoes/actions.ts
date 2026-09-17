"use server";

import { createClient } from "@/lib/supabase/server";
import { ANOTACOES_FREE, FAVORITOS_FREE } from "@/lib/plano/limites";
import { ehPro } from "@/lib/plano/plano";
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

  // Teto do plano grátis. Conta as notas EXISTENTES e só barra quando esta
  // seria uma NOVA — editar uma anotação que já existe nunca pode esbarrar no
  // limite, senão o aluno que chegou ao teto ficaria impedido de corrigir o
  // que ele mesmo escreveu (e apagar, que é `texto` vazio, sai antes daqui).
  const excedeu = await excedeuLimite(supabase, user.id, {
    tabela: "question_notes",
    limite: ANOTACOES_FREE,
    questionId,
  });
  if (excedeu) {
    return {
      error: `O plano grátis guarda ${ANOTACOES_FREE} anotações. Com o Pro, são ilimitadas.`,
    };
  }

  const { error } = await supabase.from("question_notes").upsert(
    { user_id: user.id, question_id: questionId, nota: texto, atualizado_em: new Date().toISOString() },
    { onConflict: "user_id,question_id" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * true = o aluno é grátis, já está no teto e a linha que ele quer criar ainda
 * não existe.
 *
 * Duas leituras (plano + contagem) em vez de uma: o `count` é head-only (não
 * traz linha) e o profile é uma linha por id — juntos custam menos que trazer
 * a lista inteira de favoritos pra contar no app, que é como isso poderia
 * degenerar numa conta com 2 mil favoritos.
 */
async function excedeuLimite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  opcoes: { tabela: "question_notes" | "question_favoritos"; limite: number; questionId: string },
): Promise<boolean> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", userId)
    .maybeSingle();
  if (ehPro(perfil)) return false;

  const { count } = await supabase
    .from(opcoes.tabela)
    .select("question_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) < opcoes.limite) return false;

  // No teto, mas esta questão já tem linha? Então não é criação — é edição.
  const { data: existente } = await supabase
    .from(opcoes.tabela)
    .select("question_id")
    .eq("user_id", userId)
    .eq("question_id", opcoes.questionId)
    .maybeSingle();
  return !existente;
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

  // Desfavoritar (acima) nunca é barrado — só FAVORITAR consome vaga.
  const excedeu = await excedeuLimite(supabase, user.id, {
    tabela: "question_favoritos",
    limite: FAVORITOS_FREE,
    questionId,
  });
  if (excedeu) {
    return {
      error: `O plano grátis guarda ${FAVORITOS_FREE} favoritos. Desmarque um, ou assine o Pro pra salvar sem limite.`,
    };
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
