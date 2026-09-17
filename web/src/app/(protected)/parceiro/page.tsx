import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { buttonVariants } from "@/components/ui/button";
import { acharParceiroDaConta, carregarPainelParceiro } from "@/lib/afiliados/painel";
import { PainelParceiroView } from "@/components/afiliados/painel-parceiro";
import { DIAS_BONUS_PADRAO, FAIXAS, JANELA_MESES_PADRAO } from "@/lib/afiliados/afiliados";

export const metadata: Metadata = { title: "Parceria" };

// Nunca cachear: o parceiro abre esta tela justamente pra ver se entrou venda.
export const dynamic = "force-dynamic";

export default async function ParceiroPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null; // o layout protegido já redireciona

  const parceiro = await acharParceiroDaConta(user.id, user.email);

  // Conta que não é de parceiro cai num convite, não num 404: quem chegou aqui
  // ou é parceiro (e o vínculo por e-mail vai resolver sozinho) ou está
  // curioso — e o segundo caso é exatamente quem a gente quer recrutar.
  if (!parceiro) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <div className="surface rounded-3xl px-6 py-8 sm:px-8">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-questly-gold/15 text-questly-gold">
            <Handshake className="size-5" strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 font-heading text-[24px] leading-tight font-semibold tracking-tight">
            Sua conta ainda não é de parceiro.
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
            O programa de parceiros paga de {FAIXAS[0].percentual}% a{" "}
            {FAIXAS[FAIXAS.length - 1].percentual}% de tudo que os alunos indicados por você pagarem,
            pelos primeiros {JANELA_MESES_PADRAO} meses de conta — e quem entra pelo seu link ganha{" "}
            {DIAS_BONUS_PADRAO} dias de Pro.
          </p>
          <Link
            href="/parceria"
            className={buttonVariants({ size: "lg" }) + " mt-6 h-12 px-6 text-[15px]"}
          >
            Ver o programa
            <ArrowRight />
          </Link>
          <p className="mt-3 text-[12.5px] text-muted-foreground">
            Já combinou a parceria e o painel está vazio? Ele aparece sozinho quando a conta usar o
            mesmo e-mail do cadastro — ou é só avisar a gente.
          </p>
        </div>
      </div>
    );
  }

  const painel = await carregarPainelParceiro(parceiro);
  if (!painel) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <p className="text-[14px] text-questly-red-dark">
          Não foi possível carregar seus números agora. Tente de novo em instantes.
        </p>
      </div>
    );
  }

  return <PainelParceiroView painel={painel} />;
}
