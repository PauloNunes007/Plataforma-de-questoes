import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { VerificarEmailForm } from "@/components/auth/verificar-email-form";

export const metadata: Metadata = {
  title: "Confirme seu email",
  robots: { index: false, follow: false },
};

// Tela onde o aluno digita o código de 6 dígitos que chegou por email. É
// alcançada SEM sessão (a conta existe, mas ainda não está confirmada), então
// precisa estar liberada no guard de rota — ver PUBLIC_ROUTES em src/proxy.ts.
export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; enviado?: string }>;
}) {
  const { email, enviado } = await searchParams;

  // Sem email não há o que confirmar — o código é validado contra o endereço.
  if (!email) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative flex flex-1 flex-col overflow-hidden bg-background px-5 py-6">
        {/* mesma linguagem visual do /login */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
          <div className="absolute top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-purple/15 blur-[120px]" />
        </div>

        <Link
          href="/"
          className="relative z-10 flex w-fit items-center gap-2 rounded-xl py-1 pr-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Voltar para a página inicial"
        >
          <ChevronLeft size={18} strokeWidth={2} />
          <Logo />
        </Link>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-6">
          <VerificarEmailForm email={email} jaEnviado={enviado === "1"} />
        </div>
      </main>
    </div>
  );
}
