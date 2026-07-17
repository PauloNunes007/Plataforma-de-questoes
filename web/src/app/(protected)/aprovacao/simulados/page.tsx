import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin/auth";
import { carregarEscada, carregarSimulados, dataLocalISO } from "@/lib/aprovacao/dados";
import { AprovacaoTabs } from "@/components/aprovacao/aprovacao-tabs";
import { SimuladosView } from "@/components/aprovacao/simulados-view";

export const metadata = { title: "Simulados — Questly" };

export default async function SimuladosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ehAdmin(user.email)) redirect("/dashboard");

  const [simulados, escada] = await Promise.all([
    carregarSimulados(supabase, user.id),
    carregarEscada(supabase),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Simulados</h1>
          <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
            Um domingo, uma prova: registre os acertos por disciplina de cada simulado da escada e acompanhe a
            evolução até o dia D.
          </p>
        </div>
        <AprovacaoTabs />
      </header>

      <SimuladosView simuladosIniciais={simulados} escada={escada} hoje={dataLocalISO()} />
    </div>
  );
}
