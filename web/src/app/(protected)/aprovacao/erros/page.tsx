import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin/auth";
import { carregarErros, dataLocalISO } from "@/lib/aprovacao/dados";
import { etapasPendentes } from "@/lib/aprovacao/tipos";
import { AprovacaoTabs } from "@/components/aprovacao/aprovacao-tabs";
import { ErrosView } from "@/components/aprovacao/erros-view";

export const metadata = { title: "Caderno de Erros — Questly" };

export default async function ErrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ehAdmin(user.email)) redirect("/dashboard");

  const hoje = dataLocalISO();
  const erros = await carregarErros(supabase, user.id);
  const pendentes = erros.filter((e) => etapasPendentes(e, hoje).length > 0).length;

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Caderno de Erros</h1>
          <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
            Toda questão errada vira uma entrada aqui — com print, gabarito e o porquê do erro. A revisão
            espaçada agenda o refazer em 1, 7 e 30 dias.
          </p>
        </div>
        <AprovacaoTabs revisoesPendentes={pendentes} />
      </header>

      <ErrosView errosIniciais={erros} hoje={hoje} />
    </div>
  );
}
