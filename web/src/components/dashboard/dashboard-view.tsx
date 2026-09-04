"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/questly/dashboard-data";
import { MissionBanner } from "./mission-banner";
import { BossSiegeMeter } from "./boss-siege-meter";
import { GpsAprovacaoCard } from "./gps-aprovacao-card";
import { CalendarRailCard } from "./right-rail";
import { TarefasDoDiaCard } from "./tarefas-do-dia-card";
import { QuestoesFeitasCard } from "./questoes-feitas-card";
import { MissoesCard } from "./missoes-card";
import { ConquistasRecentesCard } from "./conquistas-recentes-card";
import { ComparativoCard } from "./comparativo-card";
import { SemanaView } from "./semana-view";
import { DashboardTabs, type AbaDashboard } from "./dashboard-tabs";
import type { HeroDados } from "@/lib/dashboard/hero-data";

// Orquestra as abas do dashboard (redesign inspirado nos prints — ver
// plano). "Hoje" mantém tudo que já existia (MissionBanner, BossSiegeMeter,
// calendário, disciplinas) só que empurrado pra baixo de uma nova hero row
// (XP diário / Metas / Tarefas do dia); "Semana" é conteúdo novo, mais
// enxuto (só o que já existe de dado real — sem percentil/recorde
// inventado, ver semana-view.tsx).
export function DashboardView({ dados, hero }: { dados: DashboardData; hero: HeroDados }) {
  const [aba, setAba] = useState<AbaDashboard>("hoje");

  const missoesPendentesIds = dados.missions.filter((m) => !m.concluida).map((m) => m.id);
  const proximaMissao = dados.missions.find((m) => !m.concluida) || null;
  const subjectsResumo = dados.subjects.map((s) => ({ id: s.id, nome: s.nome }));
  const hojeStr = dados.calendar.days.find((d) => d.estado === "hoje")?.data || "";

  return (
    <>
      <DashboardTabs aba={aba} onChange={setAba} />

      {aba === "hoje" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Coluna principal — cards grandes estilo print */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MissoesCard
                metas={dados.metasHoje}
                semana={dados.semana}
                proximaMissaoId={proximaMissao?.id || null}
              />
              <QuestoesFeitasCard hero={hero} />
            </div>

            <ConquistasRecentesCard hero={hero} />

            <MissionBanner
              missions={dados.missions}
              semMissaoHoje={dados.semMissaoHoje}
              motivoSemMissao={dados.motivoSemMissao}
            />

            <BossSiegeMeter
              bossAlvo={dados.bossAlvo}
              hasSubjects={dados.subjects.length > 0}
              dayTicker={dados.dayTicker}
              missoesPendentesIds={missoesPendentesIds}
            />

            {dados.bossAlvo && (
              <GpsAprovacaoCard
                rota={dados.bossAlvo.rota}
                subjectId={dados.bossAlvo.subjectId}
                subjectNome={dados.bossAlvo.subjectNome}
              />
            )}
          </div>

          {/* Rail — comparativo, calendário e tarefas */}
          <aside className="flex min-w-0 flex-col gap-5">
            <ComparativoCard comparativo={dados.semana.comparativo} />
            <TarefasDoDiaCard tarefasIniciais={dados.tarefasHoje} hoje={hojeStr} subjects={subjectsResumo} />
            <CalendarRailCard
              monthLabel={dados.calendar.monthLabel}
              dowOffset={dados.calendar.dowOffset}
              days={dados.calendar.days}
              tarefas={dados.tarefasPorData}
              subjects={subjectsResumo}
              index={0}
            />
          </aside>
        </div>
      ) : (
        <SemanaView semana={dados.semana} ehPro={dados.ehPro} />
      )}
    </>
  );
}
