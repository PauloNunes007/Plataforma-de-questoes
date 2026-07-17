import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin/auth";
import { carregarObras, dataLocalISO } from "@/lib/aprovacao/dados";
import { AprovacaoTabs } from "@/components/aprovacao/aprovacao-tabs";
import { ObrasView } from "@/components/aprovacao/obras-view";

export const metadata = { title: "Obras literárias — Questly" };

export default async function ObrasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ehAdmin(user.email)) redirect("/dashboard");

  const obras = await carregarObras(supabase, user.id);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Obras literárias</h1>
          <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
            As 9 obras da Unicamp e as 5 da Fuvest, com progresso de leitura, data-alvo e fichamento que salva
            sozinho.
          </p>
        </div>
        <AprovacaoTabs />
      </header>

      <ObrasView obrasIniciais={obras} hoje={dataLocalISO()} />
    </div>
  );
}
