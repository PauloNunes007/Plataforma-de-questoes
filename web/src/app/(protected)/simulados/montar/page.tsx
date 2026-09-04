import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarOpcoesSimulado, carregarStatusPlano } from "@/lib/simulados/simulados-data";
import { PageHeader } from "@/components/page-header";
import { MontadorSimulado } from "@/components/simulados/montador-simulado";

export const metadata: Metadata = {
  title: "Questly — Montar simulado",
};

export default async function MontarSimuladoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [opcoes, status] = await Promise.all([
    carregarOpcoesSimulado(supabase, user),
    carregarStatusPlano(supabase, user),
  ]);

  // Sem provas da universidade catalogadas, ou free que já bateu o limite da
  // semana: a página de lista trata os dois estados (honesto / gate). Aqui só
  // montamos quando de fato dá.
  if (!opcoes.reconhecida || !status.podeMontar) {
    redirect("/simulados");
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo="Montar simulado"
        descricao={`Questões reais de ${opcoes.nomeInstituicao}, de anos variados, no seu recorte de conteúdo.`}
        voltarHref="/simulados"
        voltarLabel="Simulados"
      />
      <div className="mt-5">
        <MontadorSimulado opcoes={opcoes} />
      </div>
    </div>
  );
}
