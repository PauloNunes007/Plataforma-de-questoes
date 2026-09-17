import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarMapaTrilha } from "@/lib/trilha/trilha-data";
import { TrilhaView } from "@/components/trilha/trilha-view";

export const metadata: Metadata = {
  title: "Minha trilha",
};

export default async function TrilhaPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  if (!user) return null;

  const regioes = await carregarMapaTrilha(supabase, user);

  return (
    <div className="casca flex flex-col gap-6 py-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Minha trilha</h1>
        <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
          O panorama do que você já estudou. Toque numa disciplina pra abrir a ementa dela: cada
          parada é um tópico, com quantas questões você já fez ali e qual foi seu aproveitamento.
        </p>
      </header>

      <TrilhaView regioes={regioes} />
    </div>
  );
}
