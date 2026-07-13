"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/questly/dashboard-data";
import { MissionBanner } from "./mission-banner";
import { BossSiegeMeter } from "./boss-siege-meter";
import { CalendarRailCard, SubjectsRailCard } from "./right-rail";
import { XpDiarioCard } from "./xp-diario-card";
import { MetasCard } from "./metas-card";
import { TarefasDoDiaCard } from "./tarefas-do-dia-card";
import { SemanaView } from "./semana-view";
import { DashboardTabs, type AbaDashboard } from "./dashboard-tabs";

// Orquestra as abas do dashboard (redesign inspirado nos prints — ver
// plano). "Hoje" mantém tudo que já existia (MissionBanner, BossSiegeMeter,
// calendário, disciplinas) só que empurrado pra baixo de uma nova hero row
// (XP diário / Metas / Tarefas do dia); "Semana" é conteúdo novo, mais
// enxuto (só o que já existe de dado real — sem percentil/recorde
// inventado, ver semana-view.tsx).
export function DashboardView({ dados }: { dados: DashboardData }) {
  const [aba, setAba] = useState<AbaDashboard>("hoje");

  const missoesPendentesIds = dados.missions.filter((m) => !m.concluida).map((m) => m.id);
  const proximaMissao = dados.missions.find((m) => !m.concluida) || null;
  const subjectsResumo = dados.subjects.map((s) => ({ id: s.id, nome: s.nome }));
  const hojeStr = dados.calendar.days.find((d) => d.estado === "hoje")?.data || "";

  return (
    <>
      <DashboardTabs aba={aba} onChange={setAba} />

      {aba === "hoje" ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <XpDiarioCard
              metas={dados.metasHoje}
              proximaMissaoId={proximaMissao?.id || null}
              proximaMissaoNome={proximaMissao?.subjects?.nome || null}
            />
            <MetasCard metas={dados.metasHoje} />
            <TarefasDoDiaCard tarefasIniciais={dados.tarefasHoje} hoje={hojeStr} subjects={subjectsResumo} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_336px]">
            <div className="flex min-w-0 flex-col gap-6">
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
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              <CalendarRailCard
                monthLabel={dados.calendar.monthLabel}
                dowOffset={dados.calendar.dowOffset}
                days={dados.calendar.days}
                tarefas={dados.tarefasPorData}
                subjects={subjectsResumo}
                index={0}
              />
              <SubjectsRailCard subjects={dados.subjects} index={1} />
            </aside>
          </div>
        </div>
      ) : (
        <SemanaView semana={dados.semana} ehPro={dados.ehPro} />
      )}
    </>
  );
}
