import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarQuestoesComNotas } from "@/lib/anotacoes/dados";
import { MinhasQuestoesLista } from "@/components/questoes/minhas-questoes-lista";

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
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Minhas anotações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Questões em que você deixou alguma anotação.</p>
      </header>
      <MinhasQuestoesLista itens={itens} agruparPorDisciplina criterioRemocao="nota" />
    </div>
  );
}
