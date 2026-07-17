import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { garantirProfile, destinoPosLogin } from "@/lib/auth/perfil";

// Confirmação de email server-side (padrão @supabase/ssr): o template de
// email do Supabase deve apontar pra cá —
//
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
//
// (Dashboard → Authentication → Email Templates → "Confirm signup".)
// Antes, o link usava {{ .ConfirmationURL }}: o Supabase confirmava e
// redirecionava pra Site URL com o token no #hash — que nenhuma página lia.
// O aluno caía na landing deslogado, com cara de bug. Aqui o token é
// verificado no servidor, a sessão entra nos cookies, o profile nasce na
// hora e o aluno cai direto no onboarding (obrigatório pra conta nova).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "email";
  const code = searchParams.get("code");

  const supabase = await createClient();
  const destino = request.nextUrl.clone();
  destino.search = "";

  let confirmou = false;
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    confirmou = !error;
  } else if (code) {
    // Fallback pro fluxo PKCE (template antigo com {{ .ConfirmationURL }}
    // redirecionando com ?code=) — só funciona no mesmo navegador do cadastro.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmou = !error;
  }

  if (!confirmou) {
    destino.pathname = "/login";
    destino.searchParams.set("confirmacao", "invalida");
    return NextResponse.redirect(destino);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    destino.pathname = "/login";
    destino.searchParams.set("confirmacao", "invalida");
    return NextResponse.redirect(destino);
  }

  await garantirProfile(supabase, user);
  destino.pathname = await destinoPosLogin(supabase, user.id);
  return NextResponse.redirect(destino);
}
