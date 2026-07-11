import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova o cookie de sessão a cada request (Server Components não podem
// escrever cookies). Guards de rota protegida entram na Etapa 2
// (Autenticação & Layouts) — este middleware, por enquanto, só mantém a
// sessão viva.
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

  // Necessário chamar getUser() (não getSession()) para o token ser
  // validado/renovado — descartamos o retorno por enquanto.
  await supabase.auth.getUser();

  return supabaseResponse;
}
