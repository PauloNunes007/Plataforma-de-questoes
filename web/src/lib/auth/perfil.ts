import type { SupabaseClient, User } from "@supabase/supabase-js";
import { concederProLancamento } from "@/lib/plano/lancamento-servidor";

// Espelha questlyGarantirProfile (js/supabase-client.js): cria a linha em
// "profiles" na primeira vez que o usuário aparece autenticado. Compartilhado
// entre o login (actions.ts) e a rota de confirmação de email
// (app/auth/confirm/route.ts) — os dois "primeiros momentos" possíveis.
export async function garantirProfile(supabase: SupabaseClient, user: User) {
  const { data: existente } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existente) return;

  const nome =
    (user.user_metadata?.nome as string | undefined) ||
    user.email?.split("@")[0] ||
    "Aluno(a)";

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, nome });
  if (error) {
    console.error("Falha ao criar o profile", user.id, error);
    return;
  }

  // A conta ACABOU de nascer — este é o único momento em que dá pra saber
  // isso sem uma tabela de controle, e é o que torna a concessão da semana
  // de lançamento idempotente: quem já tinha profile nem chega aqui (o
  // `return` lá em cima), então ninguém ganha a semana duas vezes
  // deslogando e logando de novo.
  //
  // A função decide sozinha se a janela ainda está aberta e engole os
  // próprios erros: um brinde nunca pode impedir alguém de criar conta.
  await concederProLancamento(user.id);
}

// Critério canônico de "onboarding feito" — o mesmo dos guards em
// (protected)/layout.tsx e /onboarding/page.tsx.
export async function destinoPosLogin(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("curso")
    .eq("id", userId)
    .maybeSingle();

  return profile?.curso ? "/dashboard" : "/onboarding";
}
