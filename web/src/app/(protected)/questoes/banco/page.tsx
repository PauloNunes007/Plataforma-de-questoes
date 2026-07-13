import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { carregarDisciplinasPratica } from "@/lib/disciplinas/disciplinas-data";
import { PraticaWizard } from "@/components/disciplinas/pratica-wizard";

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
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Banco de Questões</h1>
        <p className="mt-0.5 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
          Monte sua própria prática: disciplina, tópicos, dificuldade e quantidade. Vira uma missão
          avulsa em segundo plano — não ocupa sua missão do dia, e conta XP e cobertura do Boss do
          mesmo jeito.
        </p>
      </header>

      <PraticaWizard disciplinas={disciplinas} />
    </div>
  );
}
