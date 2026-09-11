"use client";

import { useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import type { DashboardData } from "@/lib/questly/dashboard-data";
import type { HeroDados } from "@/lib/dashboard/hero-data";
import type { DesempenhoDados } from "@/lib/dashboard/desempenho-data";
import type { AtalhoSimulados } from "@/lib/simulados/simulados-data";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";
import { QUESTLY_LIGA_INFO, QUESTLY_LIGAS, type Liga } from "@/lib/questly/liga";
import { buscarCardUsuarioAction, type CardUsuario } from "@/lib/ranking/actions";
import { StudentCardModal } from "@/components/ranking/student-card-modal";
import { XP_POR_NIVEL } from "@/lib/questly/dashboard-data";
import { PerfilBar } from "./perfil-bar";
import { HomeRail, type VisaoHome } from "./home-rail";
import { AcaoCard } from "./acao-card";
import { MissoesCard } from "./missoes-card";
import { QuestoesFeitasCard } from "./questoes-feitas-card";
import { BossSiegeMeter } from "./boss-siege-meter";
import { GpsAprovacaoCard } from "./gps-aprovacao-card";
import { AgendaCard } from "./agenda-card";
import { TarefasDoDiaCard } from "./tarefas-do-dia-card";
import { SimuladosCard } from "./simulados-card";
import { DesempenhoView } from "./desempenho-view";
import { ConquistasView } from "./conquistas-view";

// Orquestra a home inteira.
//
// **Repasse de 2026-09-11.** A estrutura anterior empilhava tudo numa coluna
// só e o aluno abria a tela sem saber onde olhar. Agora a home tem uma faixa
// de identidade fixa no topo (PerfilBar: quem sou, nível, ranking, conquistas,
// streak) e um TRILHO lateral que troca a visão do miolo:
//
//   • Global      — a ação do dia, em quatro faixas de prioridade decrescente:
//                   (1) continuar de onde parou; (2) as duas COISAS PRA FAZER
//                   agora, lado a lado e do mesmo tamanho — a missão do dia à
//                   esquerda, e à direita o simulado com o anel de questões
//                   feitas embaixo dele (é o que preenche a sobra de altura da
//                   coluna); (3) o diagnóstico (cerco ao boss + GPS) com o
//                   "marcado para hoje" na coluna estreita ao lado; (4) a
//                   Agenda, em largura inteira.
//   • Desempenho  — a análise: KPIs, radar por área, curva de evolução,
//                   tópicos mais errados e a tira da semana.
//   • Conquistas  — a estante de brasões, acesos e apagados.
//
// A carta do aluno (o card TCG do ranking) abre POR CIMA da home, a partir do
// botão do trilho ou do bloco de perfil — sem trocar de página.
export function DashboardView({
  dados,
  hero,
  desempenho,
  atalhoSimulados,
  retomar,
  userId,
}: {
  dados: DashboardData;
  hero: HeroDados;
  desempenho: DesempenhoDados;
  atalhoSimulados: AtalhoSimulados;
  retomar: RetomarInfo;
  userId: string;
}) {
  const [visao, setVisao] = useState<VisaoHome>("global");
  const [card, setCard] = useState<CardUsuario | null>(null);
  const [carregandoCard, setCarregandoCard] = useState(false);

  const liga: Liga = (dados.profile?.liga as Liga) || QUESTLY_LIGAS[0];
  const ligaNome = (QUESTLY_LIGA_INFO[liga] || QUESTLY_LIGA_INFO.bronze).nome;

  const missoesPendentesIds = dados.missions.filter((m) => !m.concluida).map((m) => m.id);
  const subjectsResumo = dados.subjects.map((s) => ({ id: s.id, nome: s.nome }));
  const hojeStr = dados.calendar.days.find((d) => d.estado === "hoje")?.data || "";

  async function abrirCarta() {
    setCarregandoCard(true);
    const resultado = await buscarCardUsuarioAction(userId);
    setCard(resultado);
    setCarregandoCard(false);
  }

  function fecharCarta() {
    setCard(null);
    setCarregandoCard(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PerfilBar
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
        hero={hero}
        pro={dados.ehPro}
        onAbrirCarta={abrirCarta}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <div className="lg:sticky lg:top-[70px]">
          <HomeRail visao={visao} onVisao={setVisao} onAbrirCarta={abrirCarta} />
        </div>

        <div className="min-w-0 flex-1">
          {visao === "global" && (
            <div className="flex flex-col gap-4">
              <div className="mb-0.5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-[17px] font-semibold tracking-tight">Seu dia</h2>
                <Link
                  href="/questoes"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold text-muted-foreground shadow-xs transition-colors hover:border-questly-green/45 hover:text-foreground"
                >
                  <Library size={14} strokeWidth={2.1} />
                  Banco de questões
                </Link>
              </div>

              <AcaoCard
                retomar={retomar}
                missions={dados.missions}
                semMissaoHoje={dados.semMissaoHoje}
                motivoSemMissao={dados.motivoSemMissao}
                metas={dados.metasHoje}
              />

              {/* As duas coisas que o aluno PODE FAZER agora, com o mesmo
                  peso visual. Antes o simulado morava no rail estreito, abaixo
                  da dobra — quem nunca tinha feito um nem descobria que
                  existia. Ao lado da missão do dia ele ganha destaque sem
                  competir com ela: missão é o hábito, simulado é o teste.

                  A missão do dia é ALTA (uma linha por disciplina, mais as
                  quatro metas) e o atalho de simulado é BAIXO — sobretudo no
                  estado "prova em andamento", que é só um título e um botão.
                  Isso deixava meia coluna de vazio à direita. O anel de
                  questões feitas desceu pra cá e fecha esse buraco: ele estica
                  até o pé da coluna (`h-full` lá dentro) e a leitura empilha
                  bem — o simulado é a prova de agora, o anel é o histórico
                  que ela vai mexer. */}
              <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <MissoesCard missions={dados.missions} metas={dados.metasHoje} />
                <div className="flex min-w-0 flex-col gap-4">
                  <SimuladosCard atalho={atalhoSimulados} />
                  <QuestoesFeitasCard hero={hero} />
                </div>
              </div>

              {/* Diagnóstico à esquerda (largo, porque é leitura); o que está
                  marcado pra hoje à direita, numa coluna estreita. */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col gap-4">
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

                <aside className="flex min-w-0 flex-col gap-4">
                  <TarefasDoDiaCard
                    tarefasIniciais={dados.tarefasHoje}
                    hoje={hojeStr}
                    subjects={subjectsResumo}
                  />
                </aside>
              </div>

              {/* A agenda fecha a visão em largura inteira: planejar a semana
                  é a única coisa aqui que precisa de espaço horizontal (sete
                  colunas de dia com texto legível dentro). */}
              <AgendaCard
                monthLabel={dados.calendar.monthLabel}
                dowOffset={dados.calendar.dowOffset}
                days={dados.calendar.days}
                tarefas={dados.tarefasPorData}
                subjects={subjectsResumo}
                hoje={hojeStr}
              />
            </div>
          )}

          {visao === "desempenho" && (
            <DesempenhoView dados={desempenho} semana={dados.semana} ehPro={dados.ehPro} />
          )}

          {visao === "conquistas" && (
            <ConquistasView distintivos={hero.distintivos} selecionadosIniciais={hero.distintivosSelecionados} />
          )}
        </div>
      </div>

      <StudentCardModal card={card} loading={carregandoCard} onClose={fecharCarta} />
    </div>
  );
}
