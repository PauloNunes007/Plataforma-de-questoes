import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarDadosDashboard, carregarPerfilDashboard } from "@/lib/questly/dashboard-data";
import { carregarRetomar } from "@/lib/retomar/retomar-data";
import { carregarHeroDashboard } from "@/lib/dashboard/hero-data";
import { carregarAtalhoSimulados } from "@/lib/simulados/simulados-data";
import { carregarResumoRiscoAcademico } from "@/lib/academico/academico-data";
import { contarCaderno } from "@/lib/caderno/dados";
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
  // carregarDadosDashboard() inteiro.
  const perfil = await carregarPerfilDashboard(supabase, user.id);
  // A aba "Desempenho" NÃO entra aqui de propósito (2026-09-18). O histórico
  // dela sai do banco cru — até 8.000 tentativas em páginas sequenciais, mais
  // os lotes `.in()` de questions/topicos/materias — e segurava a home inteira
  // por uma aba que não é a inicial. Ela busca o próprio dado ao ser aberta,
  // via carregarDesempenhoAction (ver lib/dashboard/actions.ts).
  const [dados, retomar, hero, atalhoSimulados, riscoAcademico, caderno] = await Promise.all([
    carregarDadosDashboard(supabase, user, perfil),
    carregarRetomar(supabase, user.id),
    carregarHeroDashboard(supabase, user, perfil),
    carregarAtalhoSimulados(supabase, user),
    // Faltas e notas do semestre, resumidas numa linha. Entra no mesmo
    // Promise.all porque o cartão da home precisa avisar ANTES da aula — uma
    // tela que o aluno tem que lembrar de abrir não avisa nada.
    carregarResumoRiscoAcademico(supabase, user.id),
    // Dois head-counts (não traz linha) só pro badge do trilho — o aluno
    // precisa VER que tem questão esperando, senão o Caderno vira uma gaveta
    // em que ele guarda coisas e nunca mais volta.
    contarCaderno(supabase, user.id),
  ]);

  return (
    <DashboardView
      dados={dados}
      hero={hero}
      atalhoSimulados={atalhoSimulados}
      retomar={retomar}
      riscoAcademico={riscoAcademico}
      cadernoAbertos={caderno.abertos}
      userId={user.id}
    />
  );
}
