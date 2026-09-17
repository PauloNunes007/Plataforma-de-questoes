import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { consultarParceiroAction } from "@/lib/afiliados/actions";
import { normalizarCodigoParceiro } from "@/lib/afiliados/afiliados";
import { ehPro } from "@/lib/plano/plano";
import { carregarStatsBanco } from "@/lib/landing/stats";
import { ParceiroView } from "@/components/afiliados/parceiro-view";

// Link do parceiro (/p/<codigo>) — o que ele cola na bio do Instagram e nos
// stories. Rota PÚBLICA (ver PREFIXOS_PUBLICOS em src/proxy.ts): quem toca
// veio de um story e não tem conta; mandar essa pessoa pro /login sem contexto
// joga fora a única coisa que o link tem de diferente.
//
// É primo do /convite/[codigo], com uma diferença que vale dinheiro: o convite
// entrega Pro e acaba ali; aqui a visita também carimba de quem foi a
// indicação (cookie → components/afiliados/indicacao-auto.tsx), e é esse
// carimbo que faz a comissão existir depois.
//
// Nunca cachear: a página muda conforme o parceiro esteja ativo ou não, e a
// conta que abre pode já ser Pro.
export const dynamic = "force-dynamic";

type Params = { codigo: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const parceiro = await consultarParceiroAction(codigo);

  const titulo =
    parceiro.estado === "valido"
      ? `${parceiro.diasBonus} dias de Expectrum Pro — indicação de ${parceiro.nome}`
      : "Expectrum — questões de provas antigas e simulados";

  const descricao =
    parceiro.estado === "valido"
      ? `Crie sua conta pelo link e o Pro entra no ar na hora, por ${parceiro.diasBonus} dias: simulados cronometrados com questões de provas anteriores, listas por assunto e controle de faltas e notas.`
      : "Banco de questões de provas antigas com resolução, simulados cronometrados e a ementa da sua disciplina num mapa.";

  return {
    title: { absolute: titulo },
    description: descricao,
    // O link é de campanha, não de conteúdo: não disputa índice com a landing.
    // O preview do Instagram/WhatsApp continua funcionando (o bot lê o Open
    // Graph e ignora robots).
    robots: { index: false, follow: true },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `/p/${normalizarCodigoParceiro(codigo)}`,
      type: "website",
    },
  };
}

export default async function LinkParceiroPage({ params }: { params: Promise<Params> }) {
  const { codigo } = await params;

  const [parceiro, stats] = await Promise.all([
    consultarParceiroAction(codigo),
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

  return <ParceiroView parceiro={parceiro} logado={!!user} jaEhPro={jaEhPro} stats={stats} />;
}
