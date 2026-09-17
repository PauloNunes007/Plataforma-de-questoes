import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarQuestoesComNotas } from "@/lib/anotacoes/dados";
import { MinhasQuestoesLista } from "@/components/questoes/minhas-questoes-lista";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Minhas anotações",
};

export default async function AnotacoesPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const itens = await carregarQuestoesComNotas(supabase, user);

  return (
    <div className="casca-media flex flex-col gap-6 py-6 lg:py-8">
      <PageHeader
        titulo="Minhas anotações"
        descricao="Questões em que você deixou alguma anotação."
        voltarHref="/questoes"
        voltarLabel="Questões"
      />
      <MinhasQuestoesLista itens={itens} agruparPorDisciplina criterioRemocao="nota" />
    </div>
  );
}
