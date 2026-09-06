"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";

// Fronteira de erro da aplicação. Substitui o overlay cru do Next por uma tela
// com marca, linguagem do app e duas saídas reais (tentar de novo / voltar).
// `digest` é o id do erro no servidor — mostrado em fonte mono pro aluno poder
// citar no relato, sem vazar stack trace.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[questly] erro não tratado:", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-questly-orange/15 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center">
        <Logo />
        <span className="mt-10 flex size-14 items-center justify-center rounded-2xl bg-questly-orange/12 text-questly-orange">
          <TriangleAlert size={26} strokeWidth={1.75} />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Algo quebrou do nosso lado
        </h1>
        <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">
          Não foi você. Tente de novo — na maioria das vezes é coisa passageira. Se insistir, seu
          progresso está salvo e você pode voltar pelo painel.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} className="h-11 cursor-pointer px-5">
            <RefreshCcw />
            Tentar de novo
          </Button>
          <Link href="/dashboard" className={`${buttonVariants({ variant: "outline" })} h-11 px-5`}>
            Voltar pro painel
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 font-mono text-[11px] text-muted-foreground">código: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
