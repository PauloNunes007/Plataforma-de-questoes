import type { SupabaseClient, User } from "@supabase/supabase-js";

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

  await supabase.from("profiles").insert({ id: user.id, nome });
}

// Critério canônico de "onboarding feito" — o mesmo dos guards em
// (protected)/layout.tsx e /onboarding/page.tsx.
export async function destinoPosLogin(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("curso")
    .eq("id", userId)
    .maybeSingle();

  return profile?.curso ? "/dashboard" : "/onboarding";
}
