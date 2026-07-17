import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarDisciplinasPratica } from "@/lib/disciplinas/disciplinas-data";
import { PraticaWizard } from "@/components/disciplinas/pratica-wizard";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Questly — Banco de Questões",
};

export default async function BancoDeQuestoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const disciplinas = await carregarDisciplinasPratica(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo="Banco de Questões"
        descricao="Monte sua prática em 3 passos: disciplina, tópicos e dificuldade. Conta XP normalmente e não ocupa sua missão do dia."
        voltarHref="/questoes"
        voltarLabel="Questões"
      />

      <PraticaWizard disciplinas={disciplinas} />
    </div>
  );
}
