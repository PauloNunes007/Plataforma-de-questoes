import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarProvasPrevistas } from "@/lib/banca/banca-data";
import { ProvasPrevistas } from "@/components/simulados/provas-previstas";

export const metadata: Metadata = {
  title: "Prova prevista",
};

export const dynamic = "force-dynamic";

// A PROVA PREVISTA — o Gêmeo da Banca (web/src/lib/banca/).
//
// Duas coisas na mesma tela, nesta ordem: o retrato medido de como aquela
// prova cai, e só depois o botão que monta um simulado com essa composição.
// A ordem é a tese — o valor é entender a prova; o simulado é a consequência.
export default async function ProvaPrevistaPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const provas = await carregarProvasPrevistas(supabase, user);

  return (
    <div className="casca-leitura flex flex-col gap-5 py-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/simulados"
          className="inline-flex w-fit items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Simulados
        </Link>
        <h1 className="text-[20px] font-semibold tracking-tight">Prova prevista</h1>
        <p className="max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
          Uma prova é uma amostra do jeito de um professor. Lendo todas as edições anteriores da
          mesma prova, dá pra dizer com número como a próxima deve ser — e montar uma igual pra
          treinar.
        </p>
      </header>

      <ProvasPrevistas provas={provas} />
    </div>
  );
}
