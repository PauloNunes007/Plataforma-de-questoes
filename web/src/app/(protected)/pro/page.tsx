import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buscarMinhaAssinaturaPendenteAction } from "@/lib/plano/actions";
import { ehPro } from "@/lib/plano/plano";
import { PlanosView } from "@/components/plano/planos-view";

export const metadata: Metadata = {
  title: "Questly Pro",
};

export default async function ProPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, pendente] = await Promise.all([
    supabase
      .from("profiles")
      .select("plano, plano_ciclo, plano_desde, plano_expira_em, plano_fidelidade_ate")
      .eq("id", user.id)
      .maybeSingle(),
    buscarMinhaAssinaturaPendenteAction(),
  ]);

  const jaEhPro = ehPro(profile);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6 lg:py-8">
      <PlanosView
        jaEhPro={jaEhPro}
        ciclo={profile?.plano_ciclo ?? null}
        expiraEm={jaEhPro ? (profile?.plano_expira_em ?? null) : null}
        fidelidadeAte={jaEhPro ? (profile?.plano_fidelidade_ate ?? null) : null}
        pendenteInicial={pendente}
      />
    </div>
  );
}
