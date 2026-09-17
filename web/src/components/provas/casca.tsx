// Casca das páginas públicas de provas antigas (/provas/*).
//
// Componente de SERVIDOR, sem framer-motion e sem estado: quem chega aqui vem
// do Google, e o que importa é o HTML sair pronto e leve — não a animação. A
// landing "/" continua sendo a página com movimento; estas são catálogo.
//
// O header repete o da landing de propósito (mesma marca, mesmo par de botões
// à direita): quem pulou a home e entrou direto na prova precisa reconhecer
// onde está e ter a mesma saída pro cadastro.
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export function CascaPublica({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/15 blur-[120px]" />
        <div className="absolute top-52 -right-32 h-[28rem] w-[28rem] rounded-full bg-questly-blue/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <Link href="/" aria-label="Página inicial da Expectrum">
            <Logo />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} hidden sm:inline-flex`}
            >
              Entrar
            </Link>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Criar conta grátis
              <ArrowRight />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">{children}</main>

      <footer className="relative border-t border-border/60 py-12">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <Logo />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                Questões de provas antigas com resolução passo a passo, simulados cronometrados e a
                ementa da sua disciplina num mapa.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-[13px] font-semibold">Acervo</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href="/provas/fisica-uff"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Provas de Física da UFF
                  </Link>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Como funciona
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold">Conta</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Criar conta
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Expectrum · Estude o que importa. As provas citadas são de
            domínio dos seus respectivos departamentos; a Expectrum cataloga e resolve.
          </p>
        </div>
      </footer>
    </div>
  );
}
