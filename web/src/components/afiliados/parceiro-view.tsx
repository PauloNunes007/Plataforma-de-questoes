"use client";

// Tela do link de parceiro (/p/[codigo]). Quem chega aqui tocou num story há
// dois segundos e decide em mais dois se fica. A tela tem uma tarefa só: dizer
// o que a pessoa ganha, de quem veio a indicação, e sair da frente.
//
// Duas coisas acontecem em silêncio ao abrir:
//   1. o código vai pro cookie (com o instante do clique) — é o que carimba a
//      indicação quando a conta nascer, em components/afiliados/indicacao-auto;
//   2. o clique é contado, pra o parceiro ver sua taxa de conversão.
//
// O número de dias vem do cadastro do parceiro, nunca de texto digitado aqui:
// é a mesma regra de honestidade da landing e do convite.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, AtSign, BadgeCheck, Check, Clock, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import {
  registrarCliqueParceiroAction,
  type EstadoParceiro,
} from "@/lib/afiliados/actions";
import {
  COOKIE_REF,
  DIAS_COOKIE_REF,
  montarValorCookie,
} from "@/lib/afiliados/afiliados";
import { BENEFICIOS_PRO } from "@/lib/plano/plano";
import { arredondarPraBaixo, type StatsBanco } from "@/lib/landing/stats";

function guardarRef(codigo: string) {
  try {
    const seguro = location.protocol === "https:" ? "; secure" : "";
    const maxAge = DIAS_COOKIE_REF * 24 * 60 * 60;
    document.cookie =
      COOKIE_REF +
      "=" +
      encodeURIComponent(montarValorCookie(codigo)) +
      "; path=/; max-age=" +
      maxAge +
      "; samesite=lax" +
      seguro;
  } catch {
    // Cookie bloqueado: a pessoa entra normalmente e ganha o plano grátis. O
    // que se perde é a atribuição — e é melhor perder a comissão do que a
    // conta.
  }
}

export function ParceiroView({
  parceiro,
  logado,
  jaEhPro,
  stats,
}: {
  parceiro: EstadoParceiro;
  logado: boolean;
  jaEhPro: boolean;
  stats: StatsBanco;
}) {
  const reduzir = useReducedMotion();
  const jaContou = useRef(false);
  const valido = parceiro.estado === "valido";
  const codigo = parceiro.codigo;

  useEffect(() => {
    if (!valido || jaContou.current) return;
    jaContou.current = true;
    guardarRef(codigo);
    // Falha calada: clique é métrica, não dinheiro (ver a action).
    void registrarCliqueParceiroAction(codigo);
  }, [valido, codigo]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-5 py-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-gold/12 blur-[120px]" />
      </div>

      <Link
        href="/"
        className="relative z-10 flex w-fit items-center gap-2 rounded-xl py-1 pr-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Logo />
      </Link>

      <main className="relative z-10 flex flex-1 items-center justify-center py-8">
        <motion.div
          initial={reduzir ? undefined : { opacity: 0, y: 14 }}
          animate={reduzir ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          {parceiro.estado === "valido" ? (
            <Convite
              nome={parceiro.nome}
              instagram={parceiro.instagram}
              diasBonus={parceiro.diasBonus}
              logado={logado}
              jaEhPro={jaEhPro}
              stats={stats}
            />
          ) : (
            <LinkInvalido logado={logado} />
          )}
        </motion.div>
      </main>
    </div>
  );
}

function Convite({
  nome,
  instagram,
  diasBonus,
  logado,
  jaEhPro,
  stats,
}: {
  nome: string;
  instagram: string | null;
  diasBonus: number;
  logado: boolean;
  jaEhPro: boolean;
  stats: StatsBanco;
}) {
  return (
    <div className="surface rounded-3xl px-6 py-7 sm:px-8 sm:py-9">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-questly-gold/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-questly-gold uppercase">
        <Sparkles className="size-3.5" strokeWidth={2.4} />
        Indicação de {instagram ? `@${instagram}` : nome}
      </span>

      <h1 className="mt-4 font-heading text-[26px] leading-tight font-semibold tracking-tight text-balance sm:text-[30px]">
        <span className="tnum">{diasBonus}</span> dias de Expectrum Pro, liberados na hora.
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-pretty text-muted-foreground">
        Você chegou pelo link de {instagram ? `@${instagram}` : nome}. Crie sua conta e o Pro entra
        no ar na hora — sem cartão, sem cobrança no fim dos {diasBonus} dias.
      </p>

      <ul className="mt-6 flex flex-col gap-2.5">
        {BENEFICIOS_PRO.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
            <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-questly-green-dark dark:text-questly-green">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {jaEhPro ? (
        <p className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
          Sua conta já está no Pro — este link libera o bônus apenas para contas novas.
        </p>
      ) : null}

      <Link
        href={logado ? "/dashboard" : "/login"}
        className={buttonVariants({ size: "lg" }) + " mt-6 h-12 w-full px-6 text-[15px]"}
      >
        {logado ? "Ir pro meu painel" : "Criar minha conta grátis"}
        <ArrowRight />
      </Link>

      {!logado ? (
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          O bônus fica guardado neste navegador — o Pro é liberado sozinho assim que a conta estiver
          pronta.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" strokeWidth={2} />
          {diasBonus} dias a partir do cadastro
        </span>
        {stats.aoVivo ? (
          <span className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5" strokeWidth={2} />
            {arredondarPraBaixo(stats.total)} questões catalogadas
          </span>
        ) : null}
        {instagram ? (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 underline-offset-2 hover:text-foreground hover:underline"
          >
            <AtSign className="size-3.5" strokeWidth={2} />@{instagram}
          </a>
        ) : null}
      </div>
    </div>
  );
}

// Código errado, link cortado no meio da bio, parceiro que saiu do programa:
// os três terminam aqui. A porta normal continua aberta — quem veio querendo
// estudar não pode bater num beco.
function LinkInvalido({ logado }: { logado: boolean }) {
  return (
    <div className="surface rounded-3xl px-6 py-7 sm:px-8 sm:py-9">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        Link indisponível
      </span>
      <h1 className="mt-4 font-heading text-[26px] leading-tight font-semibold tracking-tight">
        Este link não vale mais.
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-pretty text-muted-foreground">
        Confira se ele veio completo — um pedaço a menos e o código muda. De qualquer forma, a
        Expectrum continua de portas abertas: o plano grátis tem o banco de questões com resolução,
        a trilha da ementa e um simulado cronometrado por semana.
      </p>
      <Link
        href={logado ? "/dashboard" : "/login"}
        className={buttonVariants({ size: "lg" }) + " mt-6 h-12 w-full px-6 text-[15px]"}
      >
        {logado ? "Ir pro meu painel" : "Criar conta grátis"}
        <ArrowRight />
      </Link>
      <Link
        href="/"
        className="mt-3 block text-center text-[12.5px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Conhecer a plataforma
      </Link>
    </div>
  );
}
