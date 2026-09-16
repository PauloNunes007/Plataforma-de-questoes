import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarOpcoesSimulado, carregarStatusPlano } from "@/lib/simulados/simulados-data";
import { PageHeader } from "@/components/page-header";
import { MontadorSimulado } from "@/components/simulados/montador-simulado";

export const metadata: Metadata = {
  title: "Montar simulado",
};

export default async function MontarSimuladoPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const [opcoes, status] = await Promise.all([
    carregarOpcoesSimulado(supabase, user),
    carregarStatusPlano(supabase, user),
  ]);

  // Dois motivos pra não montar, e nenhum deles é mais a universidade do aluno
  // (2026-09-16): free que já bateu o limite da semana, ou banco sem questão
  // nenhuma. A lista trata os dois estados.
  if (opcoes.materias.length === 0 || !status.podeMontar) {
    redirect("/simulados");
  }

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo="Montar simulado"
        descricao="Escolha a disciplina, de onde saem as questões e os tópicos que caem."
        voltarHref="/simulados"
        voltarLabel="Simulados"
      />
      <div className="mt-5">
        <MontadorSimulado opcoes={opcoes} />
      </div>
    </div>
  );
}
