import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

// 404 da aplicação inteira. Sem isso o aluno cai na tela padrão do Next, em
// inglês e sem marca — a impressão imediata é "site quebrado".
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-questly-green/15 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center">
        <Logo />
        <span className="mt-10 flex size-14 items-center justify-center rounded-2xl bg-accent text-muted-foreground">
          <Compass size={26} strokeWidth={1.75} />
        </span>
        <p className="tnum mt-6 text-sm font-medium text-muted-foreground">Erro 404</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Essa página saiu da trilha
        </h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">
          O endereço não existe (ou não existe mais). Volte pro início e siga de onde parou — sua
          trilha continua lá.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className={`${buttonVariants()} h-11 px-5`}>
            Ir pro meu painel
          </Link>
          <Link href="/" className={`${buttonVariants({ variant: "outline" })} h-11 px-5`}>
            Página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
