import type { SupabaseClient } from "@supabase/supabase-js";

import { lerPaginado } from "@/lib/supabase/paginado";

/**
 * Tudo que este aluno já respondeu — as questões das missões (question_attempts)
 * mais as que caíram em simulados anteriores (que não geram attempt, porque um
 * simulado não alimenta o motor de maestria).
 *
 * Lê o histórico DELE, e não os attempts das questões do pool: o histórico de
 * um aluno é um conjunto pequeno e limitado pela própria atividade, enquanto o
 * pool pode ter mil ids e viraria cinco idas ao banco por causa do teto de
 * tamanho de URL (ver lib/supabase/paginado.ts). Falhar aqui não é fatal — o
 * sorteio só perde a preferência por inédito.
 */
export async function questoesJaVistas(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const vistas = new Set<string>();
  try {
    const attempts = await lerPaginado<{ question_id: string | null }>(
      () => supabase.from("question_attempts").select("question_id").eq("user_id", userId),
      // Teto: além disso a preferência já não muda nada (o aluno viu tudo) e
      // não vale segurar a montagem da prova.
      { ordenarPor: "question_id", maxPaginas: 12 },
    );
    for (const a of attempts) if (a.question_id) vistas.add(a.question_id);

    const { data: simulados } = await supabase
      .from("simulados_aluno")
      .select("question_ids")
      .eq("user_id", userId)
      .order("criado_em", { ascending: false })
      .limit(100);
    for (const s of (simulados || []) as { question_ids: string[] | null }[]) {
      for (const qid of s.question_ids || []) vistas.add(qid);
    }
  } catch (e) {
    console.error("Não foi possível ler o histórico pra priorizar questões inéditas:", e);
  }
  return vistas;
}

