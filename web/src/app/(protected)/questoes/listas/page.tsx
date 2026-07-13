import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { carregarDisciplinasPratica } from "@/lib/disciplinas/disciplinas-data";
import { DisciplinaNavegarGrid } from "@/components/questoes/disciplina-navegar-grid";

export const metadata: Metadata = {
  title: "Questly — Listas de Questões",
};

export default async function ListasDeQuestoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const disciplinas = await carregarDisciplinasPratica(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Listas de Questões</h1>
        <p className="mt-0.5 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
          Escolha uma disciplina pra ver seus tópicos como listas prontas de questões.
        </p>
      </header>

      {disciplinas.length === 0 ? (
        <div className="surface flex flex-col items-center px-6 py-10 text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <BookOpen size={18} strokeWidth={1.75} className="text-muted-foreground" />
          </span>
          <p className="mb-1 text-[15px] font-medium">Você ainda não tem disciplinas</p>
          <p className="mb-5 max-w-[360px] text-sm text-muted-foreground">
            Configure suas disciplinas pra começar a praticar.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            Configurar agora
          </Link>
        </div>
      ) : (
        <DisciplinaNavegarGrid disciplinas={disciplinas} />
      )}
    </div>
  );
}
