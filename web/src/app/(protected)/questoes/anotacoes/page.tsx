import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarQuestoesComNotas } from "@/lib/anotacoes/dados";
import { MinhasQuestoesLista } from "@/components/questoes/minhas-questoes-lista";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Questly — Minhas anotações",
};

export default async function AnotacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const itens = await carregarQuestoesComNotas(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
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
