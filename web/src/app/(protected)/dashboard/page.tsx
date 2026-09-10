import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosDashboard, XP_POR_NIVEL } from "@/lib/questly/dashboard-data";
import { carregarRetomar } from "@/lib/retomar/retomar-data";
import { carregarHeroDashboard } from "@/lib/dashboard/hero-data";
import { carregarAtalhoSimulados } from "@/lib/simulados/simulados-data";
import { QUESTLY_LIGA_INFO, QUESTLY_LIGAS, type Liga } from "@/lib/questly/liga";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Início",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts + (protected)/layout.tsx já garantem sessão; isso aqui não
  // deveria disparar, mas o TypeScript exige o narrowing.
  if (!user) return null;

  const dados = await carregarDadosDashboard(supabase, user);
  const [retomar, hero, atalhoSimulados] = await Promise.all([
    carregarRetomar(supabase, user.id),
    carregarHeroDashboard(supabase, user, dados.profile),
    carregarAtalhoSimulados(supabase, user),
  ]);

  const liga: Liga = (dados.profile?.liga as Liga) || QUESTLY_LIGAS[0];
  const ligaNome = (QUESTLY_LIGA_INFO[liga] || QUESTLY_LIGA_INFO.bronze).nome;

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <HeroBanner
        nome={dados.profile?.nome || dados.greeting}
        fotoUrl={dados.profile?.foto_url ?? null}
        curso={dados.profile?.curso ?? null}
        liga={liga}
        ligaNome={ligaNome}
        nivel={dados.profile?.nivel || 1}
        xpTotal={dados.profile?.xp_total || 0}
        xpPorNivel={XP_POR_NIVEL}
        streakAtual={dados.profile?.streak_atual || 0}
        recordeStreak={dados.semana.recorde.melhorStreak}
        pro={dados.ehPro}
      />

      {/* `retomar` entra no FocoHojeCard (dentro do DashboardView) em vez de
          um cartão próprio: "continuar de onde parou" e "sua missão de hoje"
          eram dois cartões grandes lado a lado dizendo a mesma coisa. */}
      <DashboardView
        dados={dados}
        hero={hero}
        atalhoSimulados={atalhoSimulados}
        retomar={retomar}
      />
    </div>
  );
}
