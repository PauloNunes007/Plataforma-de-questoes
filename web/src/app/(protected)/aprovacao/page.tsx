import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin/auth";
import { carregarDadosHoje } from "@/lib/aprovacao/dados";
import { AprovacaoTabs } from "@/components/aprovacao/aprovacao-tabs";
import { HojeView } from "@/components/aprovacao/hoje-view";

export const metadata = { title: "Modo Aprovação — Questly" };

export default async function AprovacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Feature de conta única (ver supabase_modo_aprovacao.sql).
  if (!ehAdmin(user.email)) redirect("/dashboard");

  const dados = await carregarDadosHoje(supabase, user.id);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Modo Aprovação</h1>
          <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
            Sua central de preparação pra Unicamp e Fuvest 2026: grade do dia, caderno de erros, escada de
            simulados e as obras literárias.
          </p>
        </div>
        <AprovacaoTabs revisoesPendentes={dados.revisoesPendentes} />
      </header>

      <HojeView dados={dados} />
    </div>
  );
}
