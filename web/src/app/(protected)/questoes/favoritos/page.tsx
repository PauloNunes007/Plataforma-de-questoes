import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarFavoritos } from "@/lib/anotacoes/dados";
import { MinhasQuestoesLista } from "@/components/questoes/minhas-questoes-lista";

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
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Questões favoritas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Organizadas por disciplina e tópico.</p>
      </header>
      <MinhasQuestoesLista itens={itens} agruparPorDisciplina criterioRemocao="favorito" />
    </div>
  );
}
