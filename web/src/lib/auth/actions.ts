"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  success?: string;
} | null;

// Espelha questlyGarantirProfile (js/supabase-client.js): cria a linha em
// "profiles" na primeira vez que o usuário aparece autenticado — cobre o
// caso de confirmação de email, onde o cadastro não tem sessão ainda.
async function garantirProfile(supabase: SupabaseClient, user: User) {
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

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Preencha email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    return { error: "Email ou senha incorretos." };
  }

  await garantirProfile(supabase, data.user);

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome || !email || !senha) {
    return { error: "Preencha todos os campos." };
  }
  if (senha.length < 8) {
    return { error: "A senha precisa ter no mínimo 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) {
    return { error: error.message || "Não foi possível criar a conta." };
  }

  // Confirmação de email ligada no projeto: sem sessão ainda, o profile só
  // é criado no primeiro login de verdade (garantirProfile em signInAction).
  if (!data.session) {
    return {
      success:
        "Conta criada! Verifique seu email para confirmar antes de entrar.",
    };
  }

  if (data.user) {
    await supabase.from("profiles").insert({ id: data.user.id, nome });
  }

  // conta nova ainda não tem disciplinas/metas configuradas
  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
