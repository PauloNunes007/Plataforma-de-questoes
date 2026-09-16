import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// /verificar-email é alcançada por quem JÁ criou a conta mas ainda não
// confirmou o email — ou seja, sem sessão. Fora desta lista, o guard mandaria
// o aluno pro /login e o cadastro nunca se completaria.
//
// /descadastrar é o mesmo caso, por outro motivo: o clique vem da caixa de
// entrada, sem sessão. Mandar quem pediu pra sair da lista pro /login lê como
// "estão dificultando a saída" — e a alternativa que a pessoa tem na mão é o
// botão de spam, que queima o remetente que entrega a confirmação de cadastro.
const PUBLIC_ROUTES = ["/", "/login", "/verificar-email", "/descadastrar"];

// /convite/[codigo] é o link mandado pros primeiros testadores (WhatsApp).
// Quem clica ainda NÃO tem conta — é o ponto todo. Prefixo, não igualdade,
// porque o código vai no caminho. O cupom em si continua protegido pelo
// limite de usos e pelo índice único (cupom_id, user_id), não por sessão.
const PREFIXOS_PUBLICOS = ["/convite/"];

// Arquivos de metadado gerados pelo App Router (robots.txt, sitemap.xml,
// ícones e o card de preview do link). São pedidos SEM sessão — por crawler do
// Google e pelo bot do WhatsApp/Instagram quando alguém cola o link num grupo.
// Sem esta isenção eles levam 307 pro /login: o site fica fora do índice e o
// link compartilhado aparece sem imagem nem título. Prefixo, não igualdade,
// porque o Next serve a imagem com querystring/hash de versão.
const ARQUIVOS_PUBLICOS = [
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/twitter-image",
  "/icon",
  "/apple-icon",
  "/manifest.webmanifest",
];

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

  // /auth/confirm é alcançado pelo link do email SEM sessão ainda — é ele
  // quem cria a sessão. Redirecionar pro /login aqui mataria a confirmação.
  if (pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PREFIXOS_PUBLICOS.some((p) => pathname.startsWith(p)) ||
    ARQUIVOS_PUBLICOS.some((p) => pathname.startsWith(p));

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
