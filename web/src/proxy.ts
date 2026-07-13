import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/", "/login"];

// Guarda de rota (equivalente ao antigo questlyExigirLogin de
// js/supabase-client.js, mas no servidor): sem sessão, qualquer rota fora
// de PUBLIC_ROUTES redireciona pro login; com sessão, /login redireciona
// pro dashboard.
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rotas /api fazem a própria autorização (ex.: o webhook do Mercado Pago é
  // chamado sem sessão pelo gateway; a rota do TikZ checa admin por dentro).
  // Não podem cair no redirect pro /login — o MP receberia um 307 e nunca
  // processaria a confirmação de pagamento.
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
