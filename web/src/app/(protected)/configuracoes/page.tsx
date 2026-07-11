import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { questlyBuscarRotinaCompleta } from "@/lib/questly/rotina-engine";
import { ConfiguracoesPanel } from "@/components/configuracoes/configuracoes-panel";
import type { SubjectComBosses } from "@/lib/configuracoes/actions";

export const metadata: Metadata = {
  title: "Questly — Configurações",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, foto_url, dias_disponiveis, tempo_diario_min")
    .eq("id", user.id)
    .single();

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, nome, nota_desejada, bosses(id, nome, data_prova)")
    .eq("user_id", user.id)
    .order("nome");

  const rotinaInicial = await questlyBuscarRotinaCompleta(supabase, user.id);

  return (
    <ConfiguracoesPanel
      profile={profile}
      subjectsIniciais={(subjectsData as SubjectComBosses[]) || []}
      rotinaInicial={rotinaInicial}
    />
  );
}
