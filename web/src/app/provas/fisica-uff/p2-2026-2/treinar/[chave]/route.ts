import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { lerChaveTreino, ROTA_P2_2026_2 } from "@/lib/provas/p2-2026-2";
import { criarSimuladoTreino } from "@/lib/provas/p2-2026-2-treino";
import { COOKIE_DESTINO, DESTINO_MAX_IDADE_SEG } from "@/lib/provas/destino";

// O botão "Treinar" da página pública da P2 2026.2. É uma rota, e não uma
// Server Action, porque quem clica na maioria das vezes NÃO tem conta: ela
// precisa ser alcançável sem sessão (mora sob /provas/, que o proxy libera),
// guardar a intenção e mandar pro cadastro. Com sessão e onboarding feito,
// cria o simulado e entra direto nele.
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chave: string }> },
) {
  const { chave } = await params;
  const pedido = lerChaveTreino(chave);
  const voltar = new URL(ROTA_P2_2026_2, request.url);
  if (!pedido) return NextResponse.redirect(voltar);

  const aqui = `${ROTA_P2_2026_2}/treinar/${chave}`;
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  // Sem conta, ou com conta sem onboarding: guarda o destino e segue pro
  // passo que falta. Depois do cadastro, `destinoPosLogin` e o fim do
  // onboarding trazem o aluno de volta pra cá.
  const lembrarEIr = (destino: string) => {
    const resp = NextResponse.redirect(new URL(destino, request.url));
    resp.cookies.set(COOKIE_DESTINO, aqui, {
      path: "/",
      maxAge: DESTINO_MAX_IDADE_SEG,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return resp;
  };

  if (!user) return lembrarEIr("/login?modo=criar");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("curso")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil?.curso) return lembrarEIr("/onboarding");

  const resultado = await criarSimuladoTreino(supabase, user.id, pedido.prova, pedido.tipo);

  const destino = resultado.ok
    ? `/simulados/${resultado.id}`
    : resultado.erro === "limite"
      ? "/simulados"
      : `${ROTA_P2_2026_2}?treino=indisponivel`;

  const resp = NextResponse.redirect(new URL(destino, request.url));
  resp.cookies.delete(COOKIE_DESTINO);
  return resp;
}
