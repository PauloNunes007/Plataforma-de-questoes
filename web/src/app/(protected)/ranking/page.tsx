import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarDadosRanking, carregarRankingGlobal } from "@/lib/ranking/ranking-data";
import { RankingView } from "@/components/ranking/ranking-view";

export const metadata: Metadata = {
  title: "Ranking",
};

export default async function RankingPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  if (!user) return null;

  const [dados, geralInicial] = await Promise.all([
    carregarDadosRanking(supabase, user),
    carregarRankingGlobal(supabase, user, "geral"),
  ]);

  return (
    <div className="casca-media flex flex-col gap-6 py-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Ranking</h1>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          Top 100 geral e da semana, a sua divisão e a sua turma. Suba subindo de XP e terminando entre os melhores.
        </p>
      </header>

      {dados ? (
        <RankingView dados={dados} geralInicial={geralInicial} />
      ) : (
        <div className="surface p-8 text-center">
          <p className="text-[15px] font-medium">Não foi possível carregar sua liga agora.</p>
          <p className="mt-1 text-sm text-muted-foreground">Tente recarregar a página.</p>
        </div>
      )}
    </div>
  );
}
