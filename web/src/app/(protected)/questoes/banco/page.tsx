import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarDisciplinasPratica } from "@/lib/disciplinas/disciplinas-data";
import { PraticaWizard } from "@/components/disciplinas/pratica-wizard";
import { PageHeader } from "@/components/page-header";
import { SeloPrivado } from "@/components/questao/selo-privado";

export const metadata: Metadata = {
  title: "Banco de Questões",
};

export default async function BancoDeQuestoesPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  if (!user) return null;

  const disciplinas = await carregarDisciplinasPratica(supabase, user);

  return (
    <div className="casca flex flex-col gap-6 py-6 lg:py-8">
      <PageHeader
        titulo="Banco de Questões"
        descricao="Monte sua prática em 3 passos: disciplina, tópicos e dificuldade. Conta XP e entra na sua trilha normalmente."
        voltarHref="/questoes"
        voltarLabel="Questões"
      />

      {/* O medo mora ANTES do primeiro clique: é aqui que o aluno decide se
          encara uma lista difícil ou se escolhe algo em que já sabe que vai
          bem. Ver components/questao/selo-privado.tsx. */}
      <div className="-mt-3">
        <SeloPrivado texto="Erre à vontade: ninguém vê sua taxa de acerto." />
      </div>

      <PraticaWizard disciplinas={disciplinas} />
    </div>
  );
}
