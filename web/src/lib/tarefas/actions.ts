"use server";

import { createClient } from "@/lib/supabase/server";

// CRUD simples e owner-scoped das tarefas do calendário — sem lógica
// derivada (ao contrário de trilha/mission-engine), então o componente
// cliente atualiza o próprio estado local depois de um "ok: true" em vez
// de refetch/revalidatePath.

export async function criarTarefaAction(input: {
  nome: string;
  descricao: string | null;
  subjectId: string | null;
  data: string;
}): Promise<{ ok: boolean; id: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !input.nome.trim()) return { ok: false, id: null };

  const { data: criada, error } = await supabase
    .from("tarefas")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      data: input.data,
    })
    .select("id")
    .single();

  if (error || !criada) {
    console.error("Erro ao criar tarefa:", error);
    return { ok: false, id: null };
  }
  return { ok: true, id: criada.id as string };
}

export async function alternarTarefaAction(id: string, concluida: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("tarefas").update({ concluida }).eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao atualizar tarefa:", error);
  return { ok: !error };
}

export async function excluirTarefaAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("tarefas").delete().eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao excluir tarefa:", error);
  return { ok: !error };
}
