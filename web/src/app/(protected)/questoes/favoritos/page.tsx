import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarFavoritos } from "@/lib/anotacoes/dados";
import { MinhasQuestoesLista } from "@/components/questoes/minhas-questoes-lista";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default async function FavoritosPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const itens = await carregarFavoritos(supabase, user);

  return (
    <div className="casca-media flex flex-col gap-6 py-6 lg:py-8">
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
