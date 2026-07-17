"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirProfile, destinoPosLogin } from "@/lib/auth/perfil";

export type AuthFormState = {
  error?: string;
  success?: string;
} | null;

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
    // Sem essa distinção, quem criou conta e não confirmou o email via
    // "Email ou senha incorretos", desistia e o profile nunca nascia.
    // Já reenvia um link novo — o original pode ter expirado.
    if (error?.code === "email_not_confirmed") {
      await supabase.auth.resend({ type: "signup", email }).catch(() => {});
      return {
        error:
          "Sua conta ainda não foi confirmada. Acabamos de reenviar o link pro seu email — clique nele e tente entrar de novo.",
      };
    }
    return { error: "Email ou senha incorretos." };
  }

  await garantirProfile(supabase, data.user);

  // Onboarding é obrigatório antes de acessar a plataforma: sem curso
  // salvo, a campanha ainda não foi configurada.
  redirect(await destinoPosLogin(supabase, data.user.id));
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
