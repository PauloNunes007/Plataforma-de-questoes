"use server";

import { createClient } from "@/lib/supabase/server";

// Inscrição/desinscrição de Web Push. A inscrição é o próprio opt-in, e
// apagá-la é o opt-out — não existe flag separada, porque duas fontes pra
// mesma decisão divergem na primeira vez que o aluno revoga a permissão pelo
// navegador em vez de pelo app (ver supabase_push_notificacoes.sql).

export async function salvarInscricaoPushAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  if (!input.endpoint || !input.p256dh || !input.auth) return { ok: false };

  // Upsert por `endpoint`: o mesmo aparelho reinscrito devolve o mesmo
  // endpoint, e sem isto a tabela acumularia uma linha por vez que o aluno
  // abriu o app — todas entregando a MESMA notificação no MESMO celular.
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    // Banco sem supabase_push_notificacoes.sql: o app segue funcionando sem
    // lembrete, que é melhor do que uma tela de erro por um recurso opcional.
    if (error.code !== "42P01") console.error("Erro ao salvar inscrição de push:", error);
    return { ok: false };
  }
  return { ok: true };
}

export async function removerInscricaoPushAction(endpoint: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  return { ok: !error };
}

/** Este aluno já tem algum aparelho inscrito? É o que a tela de
 *  Configurações usa pra saber se mostra "ativar" ou "desativar". */
export async function temInscricaoPushAction(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return (count ?? 0) > 0;
}
