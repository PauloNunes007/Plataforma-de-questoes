import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarFavoritos } from "@/lib/anotacoes/dados";
import { MinhasQuestoesLista } from "@/components/questoes/minhas-questoes-lista";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Questly — Favoritos",
};

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const itens = await carregarFavoritos(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo="Questões favoritas"
        descricao="Organizadas por disciplina e tópico."
        voltarHref="/questoes"
        voltarLabel="Questões"
      />
      <MinhasQuestoesLista itens={itens} agruparPorDisciplina criterioRemocao="favorito" />
    </div>
  );
}
