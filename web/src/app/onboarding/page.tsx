import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarMateriasComQuestoes } from "@/lib/disciplinas/disciplinas-data";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Questly — Configure sua campanha",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cinto e suspensório: o proxy.ts já barra quem não tem sessão.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, curso")
    .eq("id", user.id)
    .maybeSingle();

  // Campanha já configurada → não repete o onboarding (o layout protegido
  // faz o redirect inverso pra cá enquanto o curso não existe).
  if (profile?.curso) {
    redirect("/dashboard");
  }

  // O app ainda não sabe em que semestre o aluno está — em vez de só uma
  // lista curada por curso (que pode não ter conteúdo real ainda), sugere
  // o que já tem questões prontas no banco, pra ele escolher livremente.
  const materiasComQuestoes = await listarMateriasComQuestoes(supabase);

  return <OnboardingWizard nomeInicial={profile?.nome ?? ""} materiasComQuestoes={materiasComQuestoes} />;
}
