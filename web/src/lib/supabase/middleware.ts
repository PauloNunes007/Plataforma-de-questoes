import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** O que o guard de rota precisa saber sobre quem está pedindo a página. */
export type UsuarioDaSessao = { id: string; email?: string } | null;

// Renova o cookie de sessão a cada request (Server Components não podem
// escrever cookies) e devolve o usuário atual pro chamador decidir guards
// de rota (proxy.ts).
//
// PERFORMANCE (2026-09-10): aqui rodava `auth.getUser()`, que faz uma chamada
// de REDE pro endpoint /auth/v1/user do Supabase. Como o middleware roda em
// TODO request — inclusive nos payloads RSC de cada navegação interna e nos
// prefetch que o Next dispara no hover —, era um round-trip a mais somado a
// toda troca de tela.
//
// `getClaims()` faz o mesmo trabalho de confiança sem sair da máquina: este
// projeto assina o JWT com chave assimétrica (ES256, JWKS publicado em
// /auth/v1/.well-known/jwks.json), então a assinatura é verificada
// localmente via WebCrypto — nada de aceitar o cookie no escuro. Ele continua
// chamando getSession() por dentro, que é quem renova o token expirado e
// dispara a escrita dos cookies, então a renovação de sessão segue igual. Se
// um dia o projeto voltar pra chave simétrica (HS256), a própria lib cai
// sozinha no getUser() — degrada, não quebra.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  const user: UsuarioDaSessao = sub
    ? { id: sub, email: typeof data?.claims?.email === "string" ? data.claims.email : undefined }
    : null;

  return { supabaseResponse, user };
}
