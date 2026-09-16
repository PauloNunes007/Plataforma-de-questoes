import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarCatalogoProvas, carregarStatusPlano } from "@/lib/simulados/simulados-data";
import { PageHeader } from "@/components/page-header";
import { ProvasOficiais } from "@/components/simulados/provas-oficiais";

export const metadata: Metadata = {
  title: "Provas antigas",
};

export default async function ProvasAntigasPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const [catalogo, status] = await Promise.all([
    carregarCatalogoProvas(supabase, user),
    carregarStatusPlano(supabase, user),
  ]);

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo="Provas antigas"
        descricao="As provas que caíram de verdade, na ordem original e com o relógio correndo."
        voltarHref="/simulados"
        voltarLabel="Simulados"
      />
      <div className="mt-5">
        <ProvasOficiais catalogo={catalogo} status={status} />
      </div>
    </div>
  );
}
