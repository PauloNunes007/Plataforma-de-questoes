import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";
import { FitaCampanha } from "@/components/landing/campanha-uff";
import { carregarStatsBanco } from "@/lib/landing/stats";

export const metadata: Metadata = {
  title: "Entrar ou criar conta",
  robots: { index: false, follow: true },
};

// Mesma cadência da landing: os números do banco mudam devagar.
export const revalidate = 3600;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmacao?: string }>;
}) {
  const { confirmacao } = await searchParams;
  const stats = await carregarStatsBanco();

  return (
    <div className="flex min-h-screen flex-col">
      <FitaCampanha />

      <main className="relative flex flex-1 flex-col overflow-hidden bg-background px-5 py-6">
        {/* glows na mesma linguagem visual da landing — profundidade sem poluir */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
          <div className="absolute top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-purple/15 blur-[120px]" />
          <div className="absolute top-[90%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-questly-blue/10 blur-[120px]" />
        </div>

        <Link
          href="/"
          className="relative z-10 flex w-fit items-center gap-2 rounded-xl py-1 pr-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Voltar para a página inicial"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          <Logo />
        </Link>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 py-6">
          {confirmacao === "invalida" && (
            <div className="w-full max-w-4xl rounded-2xl border border-questly-orange/40 bg-questly-orange/10 px-5 py-3.5 text-sm font-semibold text-questly-orange-dark dark:text-questly-orange">
              Esse link de confirmação é inválido ou já expirou. Entre com seu email e senha — se a
              conta ainda não estiver confirmada, a gente reenvia um link novo na hora.
            </div>
          )}
          <LoginForm stats={stats} />
        </div>
      </main>
    </div>
  );
}
