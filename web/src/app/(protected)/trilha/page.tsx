import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarMapaTrilha } from "@/lib/trilha/trilha-data";
import { TrilhaView } from "@/components/trilha/trilha-view";

export const metadata: Metadata = {
  title: "Questly — Minha trilha",
};

export default async function TrilhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const regioes = await carregarMapaTrilha(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Minha trilha</h1>
        <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
          Toque numa disciplina pra abrir a jornada dela até a prova. Cada parada é um tópico da
          ementa — toque numa parada pra ver detalhes, praticar ou marcar o que você já sabe.
        </p>
      </header>

      <TrilhaView regioes={regioes} />
    </div>
  );
}
