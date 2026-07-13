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
          O mundo da sua campanha: cada disciplina é uma ilha com sua própria jornada serpenteante até o
          Boss. Você caminha do <b className="font-medium text-foreground">Início</b> até a prova, e o mascote
          fica no ponto onde você está. Clique num nó pra ver os detalhes — e marque o que já sabe:{" "}
          <b className="font-medium text-foreground">Já sei</b> pula o tópico sem XP, ou faça um{" "}
          <b className="font-medium text-foreground">recap</b> rápido pra provar que domina.
        </p>
      </header>

      <TrilhaView regioes={regioes} />
    </div>
  );
}
