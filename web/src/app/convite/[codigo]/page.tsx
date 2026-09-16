import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { consultarConviteAction } from "@/lib/plano/actions";
import { ehPro, normalizarCodigoCupom } from "@/lib/plano/plano";
import { carregarStatsBanco } from "@/lib/landing/stats";
import { ConviteView } from "@/components/plano/convite-view";

// Link de convite — a porta de entrada dos primeiros testadores, colada num
// grupo/conversa de WhatsApp. É rota PÚBLICA (ver PUBLIC_ROUTES em src/proxy.ts):
// quem clica ainda não tem conta, e mandar essa pessoa pro /login sem contexto
// nenhum jogaria fora justamente o que o convite tem de diferente.
//
// O código NÃO é segredo (viaja na URL, passa pelo WhatsApp, pode ser
// reencaminhado) — quem limita o alcance é o `limite_usos` do cupom e o índice
// único (cupom_id, user_id), não a obscuridade do link.
//
// Nunca cachear: a tela mostra quantas vagas sobraram e se a conta atual já
// resgatou — as duas coisas mudam a cada resgate.
export const dynamic = "force-dynamic";

type Params = { codigo: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const convite = await consultarConviteAction(codigo);
  const dias = convite.estado === "valido" || convite.estado === "ja_usado" ? convite.diasPro : null;

  // Regra de honestidade da landing vale aqui também: o número de dias sai do
  // cupom no banco, não de texto digitado à mão. Sem cupom válido, o card do
  // link não promete nada.
  const titulo = dias
    ? `Você foi convidado pra testar a Questly — ${dias} dias de Pro`
    : "Convite pra testar a Questly";
  const descricao = dias
    ? `Crie sua conta e o Pro é liberado na hora, por ${dias} dias: simulados cronometrados ilimitados, projeção da sua nota pro dia da prova e autópsia do erro.`
    : "Plataforma de estudos com questões de provas anteriores, simulados cronometrados e plano de estudos por dia.";

  return {
    title: { absolute: titulo },
    description: descricao,
    // Convite é pessoal: não entra no índice do Google. O preview do WhatsApp
    // continua funcionando — o bot dele lê o Open Graph e ignora robots.
    robots: { index: false, follow: false },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `/convite/${normalizarCodigoCupom(codigo)}`,
      type: "website",
    },
  };
}

export default async function ConvitePage({ params }: { params: Promise<Params> }) {
  const { codigo } = await params;

  const [convite, stats] = await Promise.all([
    consultarConviteAction(codigo),
    carregarStatsBanco(),
  ]);

  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  let jaEhPro = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plano, plano_expira_em")
      .eq("id", user.id)
      .maybeSingle();
    jaEhPro = ehPro(profile);
  }

  return <ConviteView convite={convite} logado={!!user} jaEhPro={jaEhPro} stats={stats} />;
}
