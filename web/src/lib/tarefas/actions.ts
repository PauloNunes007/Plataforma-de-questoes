"use server";

import { createClient } from "@/lib/supabase/server";
import type { TipoItemAgenda } from "./tarefas-data";

// CRUD simples e owner-scoped dos itens da agenda — sem lógica derivada (ao
// contrário de trilha/mission-engine), então o componente cliente atualiza o
// próprio estado local depois de um "ok: true" em vez de refetch/revalidatePath.
//
// Agendar um bloco NÃO gera missão, XP nem ofensiva: é o plano do aluno, e
// misturar plano com conquista abriria caminho pra inflar o ranking marcando
// sessões que nunca aconteceram.

/** Só aceita "HH:MM" (o que o <input type="time"> emite); o resto vira null. */
function horaValida(hora: string | null | undefined): string | null {
  if (!hora) return null;
  return /^\d{2}:\d{2}$/.test(hora) ? hora : null;
}

/** Espelha o CHECK do banco (1..600) pra devolver erro amigável antes do 400. */
function duracaoValida(min: number | null | undefined): number | null {
  if (min == null || !Number.isFinite(min)) return null;
  const n = Math.round(min);
  return n > 0 && n <= 600 ? n : null;
}

/** Espelha o CHECK de `meta_questoes` (1..500) — ver supabase_agenda_metas.sql. */
function metaValida(qtd: number | null | undefined): number | null {
  if (qtd == null || !Number.isFinite(qtd)) return null;
  const n = Math.round(qtd);
  return n > 0 && n <= 500 ? n : null;
}

export type NovoItemAgenda = {
  nome: string;
  descricao: string | null;
  subjectId: string | null;
  data: string;
  tipo?: TipoItemAgenda;
  hora?: string | null;
  duracaoMin?: number | null;
  metaQuestoes?: number | null;
};

export async function criarTarefaAction(
  input: NovoItemAgenda,
): Promise<{ ok: boolean; id: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !input.nome.trim()) return { ok: false, id: null };

  const tipo: TipoItemAgenda =
    input.tipo === "sessao" || input.tipo === "meta" ? input.tipo : "tarefa";
  const hora = horaValida(input.hora);
  // Duração só faz sentido num bloco de estudo — numa tarefa de lista ela não
  // seria mostrada em lugar nenhum e só sujaria a linha.
  const duracao = tipo === "sessao" ? duracaoValida(input.duracaoMin) : null;
  const meta = tipo === "meta" ? metaValida(input.metaQuestoes) : null;
  // Uma meta sem número não é meta — recusa antes do insert em vez de gravar
  // uma linha que o calendário não saberia desenhar.
  if (tipo === "meta" && (meta === null || !input.subjectId)) return { ok: false, id: null };

  const { data: criada, error } = await supabase
    .from("tarefas")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      data: input.data,
      tipo,
      hora,
      duracao_min: duracao,
      meta_questoes: meta,
    })
    .select("id")
    .single();

  if (error || !criada) {
    console.error("Erro ao criar item da agenda:", error);
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

/**
 * Move um item pra outra data — é o que faz o arrastar-e-soltar da agenda e o
 * botão "adiar pra amanhã" funcionarem sem recriar a linha (recriar perderia
 * o `concluida` e a ordem de criação).
 */
export async function moverTarefaAction(id: string, data: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false };

  const { error } = await supabase.from("tarefas").update({ data }).eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao mover item da agenda:", error);
  return { ok: !error };
}
