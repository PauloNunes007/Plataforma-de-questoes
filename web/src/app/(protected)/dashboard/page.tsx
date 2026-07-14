import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosDashboard, XP_POR_NIVEL } from "@/lib/questly/dashboard-data";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { CursoIdentidadeBadge } from "@/components/dashboard/curso-identidade-badge";

export const metadata: Metadata = {
  title: "Questly — Dashboard",
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

  return (
    <div className="mx-auto w-full max-w-[1128px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">{dados.greeting}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{dados.subheading}</p>
        </div>
        <CursoIdentidadeBadge curso={dados.profile?.curso ?? null} />
      </header>

      <div className="mb-6">
        <StatStrip
          streakAtual={dados.profile?.streak_atual || 0}
          streakHeat={dados.streakHeat}
          xpTotal={dados.profile?.xp_total || 0}
          nivel={dados.profile?.nivel || 1}
          xpPorNivel={XP_POR_NIVEL}
          liga={dados.ligaEstado}
        />
      </div>

      <DashboardView dados={dados} />
    </div>
  );
}
