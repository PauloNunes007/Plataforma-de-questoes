import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ConfiguracoesPanel } from "@/components/configuracoes/configuracoes-panel";
import type { SubjectComBosses } from "@/lib/configuracoes/actions";
import { listarMateriasComQuestoes } from "@/lib/disciplinas/disciplinas-data";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nome, username, username_alterado_em, curso, foto_url, dias_disponiveis",
    )
    .eq("id", user.id)
    .single();

  const [{ data: subjectsData }, materiasComQuestoes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, nome, nota_desejada, bosses(id, nome, data_prova)")
      .eq("user_id", user.id)
      .order("nome"),
    // Mesma origem das sugestões do onboarding: só matéria com questão de
    // verdade é oferecida (ver o comentário no topo de configuracoes-panel).
    listarMateriasComQuestoes(supabase),
  ]);

  return (
    <ConfiguracoesPanel
      profile={profile}
      subjectsIniciais={(subjectsData as SubjectComBosses[]) || []}
      materiasComQuestoes={materiasComQuestoes}
    />
  );
}
