"use client";

import { useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import type { DashboardData } from "@/lib/questly/dashboard-data";
import type { HeroDados } from "@/lib/dashboard/hero-data";
import type { AtalhoSimulados } from "@/lib/simulados/simulados-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";
import { FocoHojeCard } from "./foco-hoje-card";
import { MetricasStrip } from "./metricas-strip";
import { BossSiegeMeter } from "./boss-siege-meter";
import { GpsAprovacaoCard } from "./gps-aprovacao-card";
import { CalendarRailCard } from "./right-rail";
import { TarefasDoDiaCard } from "./tarefas-do-dia-card";
import { SemanaView } from "./semana-view";
import { DashboardTabs, type AbaDashboard } from "./dashboard-tabs";
import { SimuladosCard } from "./simulados-card";

// Orquestra as abas da home.
//
// **Repasse de consolidação (2026-09-10)**: a aba "Hoje" tinha onze blocos e
// três deles repetiam número de outro ("XP de hoje" aparecia duas vezes,
// conquistas duas, ranking duas), com quatro botões verdes disputando a mesma
// dobra. O aluno abria a home e não sabia onde olhar. A estrutura agora tem
// quatro andares, do "o que eu faço agora" pro "o que posso consultar":
//
//   1. FocoHojeCard   — a ação. Funde continuar/missões/banner num cartão só;
//   2. MetricasStrip  — como estou. Funde questões feitas + comparativo + ranking;
//   3. Boss + GPS     — a prova mais próxima e onde investir os minutos;
//   4. rail           — simulados, tarefas e calendário (consulta, não ação).
//
// "Conquistas recentes" saiu da Hoje e foi pra aba Semana: é retrospecto, não
// decisão do dia.
export function DashboardView({
  dados,
  hero,
  atalhoSimulados,
  retomar,
}: {
  dados: DashboardData;
  hero: HeroDados;
  atalhoSimulados: AtalhoSimulados;
  retomar: RetomarInfo;
}) {
  const [aba, setAba] = useState<AbaDashboard>("hoje");

  const missoesPendentesIds = dados.missions.filter((m) => !m.concluida).map((m) => m.id);
  const subjectsResumo = dados.subjects.map((s) => ({ id: s.id, nome: s.nome }));
  const hojeStr = dados.calendar.days.find((d) => d.estado === "hoje")?.data || "";

  return (
    <>
      {/* A barra de abas ganhou respiro próprio (antes o espaçamento morava
          dentro do componente das abas, que não é quem decide o ritmo da
          página) e divide a linha com um atalho pra prática livre. */}
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <DashboardTabs aba={aba} onChange={setAba} />
        <Link
          href="/questoes"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold text-muted-foreground shadow-xs transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          <Library size={14} strokeWidth={2.1} />
          Banco de questões
        </Link>
      </div>

      {aba === "hoje" ? (
        <div className="flex flex-col gap-5">
          <FocoHojeCard
            retomar={retomar}
            missions={dados.missions}
            semMissaoHoje={dados.semMissaoHoje}
            motivoSemMissao={dados.motivoSemMissao}
            metas={dados.metasHoje}
          />

          <MetricasStrip hero={hero} comparativo={dados.semana.comparativo} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-5">
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

            <aside className="flex min-w-0 flex-col gap-5">
              <SimuladosCard atalho={atalhoSimulados} />
              <TarefasDoDiaCard
                tarefasIniciais={dados.tarefasHoje}
                hoje={hojeStr}
                subjects={subjectsResumo}
              />
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
        </div>
      ) : (
        <SemanaView semana={dados.semana} ehPro={dados.ehPro} hero={hero} />
      )}
    </>
  );
}
