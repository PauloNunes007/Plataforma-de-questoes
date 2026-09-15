import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { DescadastroPainel } from "@/components/email/descadastro-painel";

export const metadata: Metadata = {
  title: "Preferências de e-mail",
  robots: { index: false, follow: false },
};

// Confirmação do descadastro. Alcançada SEM sessão, vinda do redirect de
// /api/email/descadastrar — precisa estar em PUBLIC_ROUTES (src/proxy.ts),
// senão o aluno que clicou em "não quero mais receber" cai no /login, o que
// lê como "eles estão dificultando a saída".
//
// A página não descadastra nada: quando ela abre, a rota já fez isso. Aqui só
// se confirma o que aconteceu e se oferece o desfazer.
export default async function DescadastrarPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; u?: string; t?: string }>;
}) {
  const { estado, u, t } = await searchParams;
  const ok = estado === "ok" && Boolean(u) && Boolean(t);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative flex flex-1 flex-col overflow-hidden bg-background px-5 py-6">
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
          <DescadastroPainel ok={ok} userId={u ?? ""} token={t ?? ""} />
        </div>
      </main>
    </div>
  );
}
