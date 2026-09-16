import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarDadosDashboard, carregarPerfilDashboard } from "@/lib/questly/dashboard-data";
import { carregarRetomar } from "@/lib/retomar/retomar-data";
import { carregarHeroDashboard } from "@/lib/dashboard/hero-data";
import { carregarDesempenho } from "@/lib/dashboard/desempenho-data";
import { carregarAtalhoSimulados } from "@/lib/simulados/simulados-data";
import { questlySugerirSimulado } from "@/lib/questly/plano-do-dia";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Início",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  // proxy.ts + (protected)/layout.tsx já garantem sessão; isso aqui não
  // deveria disparar, mas o TypeScript exige o narrowing.
  if (!user) return null;

  // O hero depende só do perfil, não do dashboard inteiro — lendo o perfil
  // aqui, uma vez, as cargas rodam de fato em paralelo. Antes, `hero`
  // estava dentro de um Promise.all que só COMEÇAVA depois de
  // carregarDadosDashboard() inteiro (missões, projeção, liga, calendário).
  const perfil = await carregarPerfilDashboard(supabase, user.id);
  const [dados, retomar, hero, atalhoSimulados, desempenho] = await Promise.all([
    carregarDadosDashboard(supabase, user, perfil),
    carregarRetomar(supabase, user.id),
    carregarHeroDashboard(supabase, user, perfil),
    carregarAtalhoSimulados(supabase, user),
    // Histórico agregado da aba Desempenho. Entra no mesmo Promise.all: a aba
    // não é a inicial, mas a carga é leve (agregada por dia/tópico no
    // servidor) e assim trocar de visão é instantâneo, sem spinner.
    carregarDesempenho(supabase, user.id),
  ]);

  // "Distribuir listas E simulados de forma inteligente" (repasse 2026-09-16).
  // A regra vive em lib/questly/plano-do-dia.ts — aqui só se junta o que ela
  // precisa saber.
  const ultimaNota = atalhoSimulados.notas[atalhoSimulados.notas.length - 1];
  const sugestaoSimulado = questlySugerirSimulado(
    dados.modoEstudo === "guiado" && dados.bossAlvo
      ? {
          subjectNome: dados.bossAlvo.subjectNome,
          diasAteProva: dados.bossAlvo.diasAteProva,
          temSimuladoEmAndamento: Boolean(atalhoSimulados.emAndamento),
          ultimoSimuladoISO: ultimaNota?.criadoEm ?? null,
        }
      : null,
  );

  return (
    <DashboardView
      dados={dados}
      hero={hero}
      desempenho={desempenho}
      atalhoSimulados={atalhoSimulados}
      retomar={retomar}
      userId={user.id}
      sugestaoSimulado={sugestaoSimulado}
    />
  );
}
