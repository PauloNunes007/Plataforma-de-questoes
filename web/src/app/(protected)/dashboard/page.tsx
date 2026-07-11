import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosDashboard } from "@/lib/questly/dashboard-data";
import { BossSiegeMeter } from "@/components/dashboard/boss-siege-meter";
import { MissionBanner } from "@/components/dashboard/mission-banner";
import {
  BossRailCard,
  XpRailCard,
  LigaRailCard,
  StreakRailCard,
  CalendarRailCard,
  SubjectsRailCard,
} from "@/components/dashboard/right-rail";

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
  const missoesPendentesIds = dados.missions.filter((m) => !m.concluida).map((m) => m.id);

  return (
    <div className="grid grid-cols-1 gap-8 px-6 py-7 xl:grid-cols-[minmax(0,1fr)_368px] xl:px-8">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-7">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{dados.greeting} 👋</h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{dados.subheading}</p>
        </div>

        <BossSiegeMeter
          bossAlvo={dados.bossAlvo}
          hasSubjects={dados.subjects.length > 0}
          dayTicker={dados.dayTicker}
          missoesPendentesIds={missoesPendentesIds}
        />

        <MissionBanner
          missions={dados.missions}
          semMissaoHoje={dados.semMissaoHoje}
          motivoSemMissao={dados.motivoSemMissao}
        />
      </div>

      <aside className="mx-auto flex w-full max-w-[640px] flex-col gap-4 xl:mx-0 xl:max-w-none">
        <BossRailCard bossAlvo={dados.bossAlvo} index={0} />
        <XpRailCard profile={dados.profile} index={1} />
        <LigaRailCard liga={dados.ligaEstado} index={2} />
        <StreakRailCard streakAtual={dados.profile?.streak_atual || 0} heat={dados.streakHeat} index={3} />
        <CalendarRailCard
          monthLabel={dados.calendar.monthLabel}
          dowOffset={dados.calendar.dowOffset}
          days={dados.calendar.days}
          index={4}
        />
        <SubjectsRailCard subjects={dados.subjects} index={5} />
      </aside>
    </div>
  );
}
