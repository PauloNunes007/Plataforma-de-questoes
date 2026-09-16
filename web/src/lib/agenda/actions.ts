"use server";

import { createClient } from "@/lib/supabase/server";
import { carregarMesAgenda, type MesAgenda, type ProvaDia } from "./agenda-data";

// Ações do calendário dedicado (`/calendario`).
//
// A leitura de um mês vive em `agenda-data.ts` porque a página `/calendario`
// renderiza o mês corrente no servidor (sem round-trip) e só a NAVEGAÇÃO entre
// meses passa por aqui — as duas precisam da mesma regra de "quando um dia é
// dia de prova".
//
// Marcar prova escreve em `bosses`, a mesma tabela que Configurações e a
// trilha usam: um dia de prova não é um post-it do calendário, é o Boss da
// disciplina (a projeção de nota, a contagem regressiva e o cerco leem dali).
// Criar uma prova solta só pra pintar o quadradinho deixaria duas verdades
// sobre a mesma prova.

// NÃO re-exporte tipos daqui (`export type { MesAgenda } from ...`).
// Num arquivo "use server" o Turbopack transforma CADA export num binding de
// runtime, e um re-export de tipo importado NÃO é apagado: o chunk compilado
// tenta ler uma variável que o TypeScript já removeu e a avaliação do módulo
// morre com `ReferenceError: MesAgenda is not defined`. Como quem quebra é o
// MÓDULO, e não a função, TODAS as actions do chunk passam a devolver 500 —
// foi o que apagou o calendário inteiro (criar sessão/tarefa/meta ficava em
// "Salvando..." pra sempre e a seta de mês caía na tela de erro). Tipo
// compartilhado mora em `agenda-data.ts`, que todo consumidor já importa.

export async function carregarMesAgendaAction(ano: number, mes: number): Promise<MesAgenda | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return carregarMesAgenda(supabase, user, ano, mes);
}

/** `bosses` não tem `user_id`: o dono é o `subject`. Confere antes de escrever
 *  em vez de confiar só na RLS — a action é chamável direto. */
async function subjectDoAluno(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  subjectId: string,
): Promise<{ id: string; nome: string } | null> {
  const { data } = await supabase
    .from("subjects")
    .select("id, nome")
    .eq("id", subjectId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { id: string; nome: string } | null) ?? null;
}

export async function marcarProvaAction(input: {
  subjectId: string;
  nome: string;
  data: string;
}): Promise<{ prova: ProvaDia | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { prova: null, error: "Sessão expirada." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) return { prova: null, error: "Data inválida." };

  const subject = await subjectDoAluno(supabase, user.id, input.subjectId);
  if (!subject) return { prova: null, error: "Essa disciplina não é sua." };

  const nome = input.nome.trim().slice(0, 40) || "Prova";
  const { data: criado, error } = await supabase
    .from("bosses")
    .insert({ subject_id: subject.id, nome, data_prova: input.data })
    .select("id")
    .single();

  if (error || !criado) {
    console.error("Erro ao marcar prova no calendário:", error);
    return { prova: null, error: "Não foi possível marcar essa prova." };
  }

  return {
    prova: {
      bossId: criado.id as string,
      subjectId: subject.id,
      subjectNome: subject.nome,
      nome,
      data: input.data,
    },
    error: null,
  };
}

export async function desmarcarProvaAction(bossId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // `subjects!inner` + filtro no user_id: garante que o boss apagado pertence
  // a uma disciplina do próprio aluno antes do delete.
  const { data: dono } = await supabase
    .from("bosses")
    .select("id, subjects!inner(user_id)")
    .eq("id", bossId)
    .eq("subjects.user_id", user.id)
    .maybeSingle();
  if (!dono) return { error: "Prova não encontrada." };

  const { error } = await supabase.from("bosses").delete().eq("id", bossId);
  if (error) {
    console.error("Erro ao desmarcar prova:", error);
    return { error: "Não foi possível remover essa prova." };
  }
  return { error: null };
}
