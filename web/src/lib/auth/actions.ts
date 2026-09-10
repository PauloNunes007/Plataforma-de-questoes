"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirProfile, destinoPosLogin } from "@/lib/auth/perfil";

export type AuthFormState = {
  error?: string;
  success?: string;
} | null;

/** Rota da tela onde o aluno digita o código de 6 dígitos. */
function rotaVerificacao(email: string, extras?: Record<string, string>): string {
  const params = new URLSearchParams({ email, ...extras });
  return `/verificar-email?${params.toString()}`;
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
    // Sem essa distinção, quem criou conta e não confirmou o email via
    // "Email ou senha incorretos", desistia e o profile nunca nascia.
    // Manda pra tela de verificação já com um código novo na caixa — o
    // original pode ter expirado.
    if (error?.code === "email_not_confirmed") {
      const { error: erroReenvio } = await supabase.auth.resend({ type: "signup", email });
      redirect(rotaVerificacao(email, erroReenvio ? {} : { enviado: "1" }));
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
    // O envio do email passa pelo nosso hook (app/api/auth/email-hook). Se a
    // Brevo falhar, o Supabase devolve erro no signUp — vale uma mensagem que
    // não pareça culpa do aluno.
    if (error.code === "unexpected_failure" || /email/i.test(error.message)) {
      return {
        error:
          "Não conseguimos enviar o email de confirmação agora. Tente de novo em alguns instantes.",
      };
    }
    return { error: error.message || "Não foi possível criar a conta." };
  }

  // Confirmação de email ligada no projeto: sem sessão ainda, o profile só
  // nasce quando o código/link é validado (garantirProfile na verificação).
  if (!data.session) {
    redirect(rotaVerificacao(email, { enviado: "1" }));
  }

  if (data.user) {
    await supabase.from("profiles").insert({ id: data.user.id, nome });
  }

  // conta nova ainda não tem disciplinas/metas configuradas
  redirect("/onboarding");
}

export type VerificacaoState = {
  error?: string;
  success?: string;
} | null;

/**
 * Confirma a conta pelo código de 6 dígitos que chegou por email.
 *
 * O token é do Supabase (gerado, expirado e invalidado por ele) — aqui só
 * repassamos. Em caso de sucesso a sessão entra nos cookies, o profile nasce
 * e o aluno cai no onboarding.
 */
export async function verificarCodigoAction(
  _prevState: VerificacaoState,
  formData: FormData,
): Promise<VerificacaoState> {
  const email = String(formData.get("email") ?? "").trim();
  const codigo = String(formData.get("codigo") ?? "").replace(/\D/g, "");

  if (!email) {
    return { error: "Faltou o email. Volte e entre com email e senha." };
  }
  if (codigo.length < 6) {
    return { error: "Digite os 6 dígitos do código." };
  }

  const supabase = await createClient();

  // `signup` é o tipo do código de confirmação de cadastro. O fallback pra
  // `email` cobre o caso de a conta já existir e o código ter vindo de um
  // reenvio tratado como OTP de acesso — os dois consultam o mesmo token, e
  // errar o tipo devolve "Token has expired or is invalid", que confundiria
  // o aluno com um código perfeitamente válido na mão.
  let { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "signup" });
  if (error) {
    ({ error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" }));
  }

  if (error) {
    if (error.code === "otp_expired" || /expired/i.test(error.message)) {
      return { error: "Esse código expirou. Peça um novo abaixo." };
    }
    if (error.status === 429 || error.code === "over_request_rate_limit") {
      return { error: "Muitas tentativas seguidas. Espere um minuto e tente de novo." };
    }
    return { error: "Código incorreto. Confira os 6 dígitos do email." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não foi possível abrir sua sessão. Tente entrar com email e senha." };
  }

  await garantirProfile(supabase, user);
  redirect(await destinoPosLogin(supabase, user.id));
}

/** Reenvia o código de confirmação. O Supabase impõe ~60s entre pedidos. */
export async function reenviarCodigoAction(
  _prevState: VerificacaoState,
  formData: FormData,
): Promise<VerificacaoState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Faltou o email. Volte e entre com email e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    if (error.status === 429 || /security purposes|rate limit/i.test(error.message)) {
      return { error: "Calma aí — espere um minuto antes de pedir outro código." };
    }
    return { error: "Não conseguimos reenviar agora. Tente de novo em instantes." };
  }

  return { success: "Código novo enviado. Confira sua caixa de entrada." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
