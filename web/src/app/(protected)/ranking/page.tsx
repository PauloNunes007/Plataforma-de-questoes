import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosRanking } from "@/lib/ranking/ranking-data";
import { RankingView } from "@/components/ranking/ranking-view";

export const metadata: Metadata = {
  title: "Questly — Ranking",
};

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dados = await carregarDadosRanking(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Ranking</h1>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          Sua liga da semana. Suba de liga terminando entre os melhores, sem cair pros últimos.
        </p>
      </header>

      {dados ? (
        <RankingView dados={dados} />
      ) : (
        <div className="surface p-8 text-center">
          <p className="text-[15px] font-medium">Não foi possível carregar sua liga agora.</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente recarregar a página.</p>
        </div>
      )}
    </div>
  );
}
