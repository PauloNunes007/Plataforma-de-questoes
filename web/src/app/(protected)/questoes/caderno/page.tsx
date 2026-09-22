import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarCaderno } from "@/lib/caderno/dados";
import { CadernoView } from "@/components/caderno/caderno-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Caderno de Erros",
};

export default async function CadernoPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  // "todos" e não "abertos": os filtros da tela são locais (ver CadernoView),
  // então trocar de aba não custa ida ao servidor. O caderno de um aluno é
  // curto por natureza — o grátis para em CADERNO_FREE em aberto.
  const itens = await carregarCaderno(supabase, user, "todos");

  return (
    <div className="casca-media flex flex-col gap-4 py-6 lg:py-8">
      <PageHeader
        titulo="Caderno de Erros"
        descricao="As questões que você errou e guardou pra transformar em acerto."
        voltarHref="/questoes"
        voltarLabel="Questões"
      />
      <CadernoView itens={itens} />
    </div>
  );
}
