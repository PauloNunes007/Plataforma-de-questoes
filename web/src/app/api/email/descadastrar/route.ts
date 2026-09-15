import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { descadastroValido } from "@/lib/email/descadastro";

// Descadastro da campanha. Chamado de DOIS jeitos, e por isso existem GET e POST:
//
//  · GET  — o aluno clicou no link do rodapé. Descadastra e manda pra uma
//           página que confirma o que aconteceu (e oferece o desfazer).
//  · POST — o "Cancelar inscrição" nativo do Gmail (List-Unsubscribe-Post,
//           one-click). Ninguém vê tela nenhuma: tem que responder 200 e
//           pronto. Sem esta metade, o botão do Gmail dá erro — e um botão de
//           cancelar que falha é exatamente o que empurra a pessoa pro "marcar
//           como spam", que é o resultado que a campanha inteira tenta evitar.
//
// Chega SEM sessão (o clique vem da caixa de entrada), então a autorização é a
// assinatura do próprio link — ver lib/email/descadastro.ts.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function descadastrar(userId: string, token: string): Promise<boolean> {
  if (!descadastroValido(userId, token)) return false;

  const admin = createAdminClient();

  // O aluno pode não ter linha em `profiles` (criou a conta e nunca logou — a
  // linha nasce no primeiro login). Um update aqui casaria 0 linhas em
  // silêncio e a preferência se perderia, então cria a linha com o mínimo.
  // `nome` é NOT NULL no schema base, daí o placeholder — o primeiro login
  // sobrescreve com o nome de verdade (garantirProfile só insere se faltar).
  const { data: existente } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existente) {
    const { error } = await admin.from("profiles").update({ aceita_emails: false }).eq("id", userId);
    return !error;
  }

  const { error } = await admin
    .from("profiles")
    .insert({ id: userId, nome: "Aluno(a)", aceita_emails: false });
  return !error;
}

function parametros(req: Request): { u: string; t: string } {
  const url = new URL(req.url);
  return { u: url.searchParams.get("u") ?? "", t: url.searchParams.get("t") ?? "" };
}

export async function GET(req: Request) {
  const { u, t } = parametros(req);
  const ok = await descadastrar(u, t);

  const destino = new URL("/descadastrar", req.url);
  destino.searchParams.set("estado", ok ? "ok" : "invalido");
  if (ok) {
    // Vai junto pro botão "voltar a receber" poder se autenticar do mesmo jeito.
    destino.searchParams.set("u", u);
    destino.searchParams.set("t", t);
  }
  return NextResponse.redirect(destino);
}

export async function POST(req: Request) {
  const { u, t } = parametros(req);
  const ok = await descadastrar(u, t);
  // 200 mesmo quando o token não bate: o one-click do Gmail não tem tela pra
  // mostrar erro, e um 4xx aqui só faria o cliente marcar a lista como
  // problemática. O que importa é não ter descadastrado ninguém errado.
  return NextResponse.json({ ok });
}
