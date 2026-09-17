import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarVidaAcademica } from "@/lib/academico/academico-data";
import { ehPro } from "@/lib/plano/plano";
import { PageHeader } from "@/components/page-header";
import { MateriasView } from "@/components/academico/materias-view";

export const metadata: Metadata = {
  title: "Minhas matérias",
};

// Nunca cachear: faltas e notas mudam por ação do próprio aluno na tela, e o
// componente se atualiza por `router.refresh()` (ver materias-view.tsx).
export const dynamic = "force-dynamic";

export default async function MateriasPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const [materias, { data: perfil }] = await Promise.all([
    carregarVidaAcademica(supabase, user.id),
    supabase
      .from("profiles")
      .select("plano, plano_expira_em, relatorio_semanal")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="casca-media flex flex-col gap-6 py-6 lg:py-8">
      <PageHeader
        titulo="Minhas matérias"
        descricao="Quantas faltas ainda cabem e quanto você precisa tirar pra passar — por disciplina, sem conta de cabeça."
      />
      <MateriasView
        materias={materias}
        ehPro={ehPro(perfil)}
        relatorioSemanal={perfil?.relatorio_semanal !== false}
      />
    </div>
  );
}
