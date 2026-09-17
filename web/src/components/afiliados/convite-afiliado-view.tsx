"use client";

// Tela de AVALIAÇÃO DA PARCERIA (/convite/AFILIADO).
//
// Quem abre isto não é aluno: é o dono de um perfil que recebeu uma proposta
// de parceria e está decidindo se coloca o link na bio. A pergunta dele não é
// "isso me ajuda a estudar?", é "eu indicaria isso pro meu público sem passar
// vergonha?". Então a tela não vende o Pro — ela abre a porta: um dia com tudo
// destravado pra ele andar por dentro, e só depois o que a parceria paga.
//
// A ordem é deliberada: PRODUTO primeiro, DINHEIRO depois. Uma proposta que
// começa por "ganhe 40%" é indistinguível de um esquema qualquer que aparece
// na DM; uma que começa por "olha o que seu público vai receber" é uma
// conversa entre gente que faz coisa. O percentual continua na tela — só não é
// a primeira coisa.
//
// Mecanicamente é o MESMO cupom de sempre (`resgatarCupomAction`), com o
// código semeado por supabase_afiliados.sql. Nada de novo no caminho do plano:
// tela diferente, motor idêntico.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck,
  Check,
  FileText,
  Handshake,
  Loader2,
  Timer,
  Trophy,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { resgatarCupomAction, type EstadoConvite } from "@/lib/plano/actions";
import { COOKIE_CONVITE } from "@/lib/plano/plano";
import { FAIXAS, JANELA_MESES_PADRAO } from "@/lib/afiliados/afiliados";
import { arredondarPraBaixo, type StatsBanco } from "@/lib/landing/stats";

// 7 dias: o convite de avaliação sobrevive a "vou ver isso com calma no fim de
// semana" sem virar fantasma num navegador compartilhado meses depois.
const DIAS_COOKIE = 7;

function guardarConvite(codigo: string) {
  try {
    const seguro = location.protocol === "https:" ? "; secure" : "";
    document.cookie =
      COOKIE_CONVITE +
      "=" +
      encodeURIComponent(codigo) +
      "; path=/; max-age=" +
      DIAS_COOKIE * 24 * 60 * 60 +
      "; samesite=lax" +
      seguro;
  } catch {
    // Cookie bloqueado: o resgate manual em /pro ("Tenho um cupom") continua
    // valendo — o link só automatiza esse caminho.
  }
}

const PASSEIO: { icone: typeof BookOpenCheck; titulo: string; texto: string }[] = [
  {
    icone: BookOpenCheck,
    titulo: "Questões de provas antigas, por assunto",
    texto:
      "Catalogadas tópico a tópico da ementa, com resolução passo a passo. O aluno monta a lista do que ele precisa hoje, não uma lista genérica.",
  },
  {
    icone: Timer,
    titulo: "Simulados cronometrados",
    texto:
      "Inclusive as provas oficiais remontadas na íntegra — mesma ordem, mesmas questões, com tempo correndo e correção no fim.",
  },
  {
    icone: CalendarCheck,
    titulo: "Faltas e notas do semestre",
    texto:
      "Quantas faltas ainda cabem em cada disciplina e quanto ele precisa tirar na próxima prova pra passar. É a conta que todo mundo faz no caderno.",
  },
  {
    icone: Trophy,
    titulo: "Ofensiva, XP e ligas semanais",
    texto:
      "A parte que faz voltar amanhã. O ranking é entre alunos de verdade, com card público e distintivos.",
  },
  {
    icone: FileText,
    titulo: "Lista pronta em PDF",
    texto: "Pra imprimir e resolver no papel, com ou sem gabarito — do jeito que muita gente estuda.",
  },
];

export function ConviteAfiliadoView({
  convite,
  logado,
  jaEhPro,
  stats,
}: {
  convite: EstadoConvite;
  logado: boolean;
  jaEhPro: boolean;
  stats: StatsBanco;
}) {
  const reduzir = useReducedMotion();
  const router = useRouter();
  const valido = convite.estado === "valido";
  const dias = convite.estado === "valido" || convite.estado === "ja_usado" ? convite.diasPro : 1;

  const [resgatando, setResgatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [liberado, setLiberado] = useState(convite.estado === "ja_usado");

  useEffect(() => {
    if (valido) guardarConvite(convite.codigo);
  }, [valido, convite.codigo]);

  async function ativar() {
    setErro(null);
    setResgatando(true);
    const res = await resgatarCupomAction(convite.codigo);
    setResgatando(false);
    if ("error" in res) return setErro(res.error);
    setLiberado(true);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
        <div className="absolute top-80 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-gold/12 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 py-6 pb-20">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-xl py-1 pr-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Logo />
        </Link>

        <motion.div
          initial={reduzir ? undefined : { opacity: 0, y: 14 }}
          animate={reduzir ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* ---------------------------------------------------- abertura */}
          <header className="mt-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-questly-gold/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-questly-gold uppercase">
              <Handshake className="size-3.5" strokeWidth={2.4} />
              Convite de parceria
            </span>
            <h1 className="mt-4 font-heading text-[28px] leading-[1.1] font-semibold tracking-tight text-balance sm:text-[36px]">
              Antes de indicar, veja por dentro.
            </h1>
            <p className="mt-3.5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
              Este link libera <strong className="text-foreground">{dias} dia de Pro completo</strong>{" "}
              na sua conta — tudo destravado, sem cartão e sem cobrança no fim. Ande pela plataforma
              como um aluno seu andaria e depois decida se ela merece um espaço no seu perfil.
            </p>

            {liberado ? (
              <div className="surface mt-6 rounded-2xl px-5 py-4">
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  <BadgeCheck
                    className="size-4.5 text-questly-green-dark dark:text-questly-green"
                    strokeWidth={2.2}
                  />
                  Pro liberado na sua conta.
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Comece pelo banco de questões e monte um simulado de uma prova antiga — é o que o
                  seu público mais usa.
                </p>
                <Link
                  href="/dashboard"
                  className={buttonVariants({ size: "lg" }) + " mt-4 h-12 w-full px-6 text-[15px]"}
                >
                  Entrar na plataforma
                  <ArrowRight />
                </Link>
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {jaEhPro ? (
                  <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
                    Sua conta já está no Pro — é só entrar e olhar à vontade.
                  </p>
                ) : null}

                {logado ? (
                  <button
                    type="button"
                    onClick={ativar}
                    disabled={resgatando || !valido}
                    className={
                      buttonVariants({ size: "lg" }) +
                      " h-12 w-full px-6 text-[15px] disabled:pointer-events-none disabled:opacity-60"
                    }
                  >
                    {resgatando ? <Loader2 className="size-4 animate-spin" /> : null}
                    Liberar meu acesso de {dias} dia
                    {resgatando ? null : <ArrowRight />}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className={buttonVariants({ size: "lg" }) + " h-12 w-full px-6 text-[15px]"}
                  >
                    Criar conta e liberar o acesso
                    <ArrowRight />
                  </Link>
                )}

                {erro ? <p className="text-[12.5px] text-questly-red-dark">{erro}</p> : null}

                <p className="text-center text-[12px] text-muted-foreground">
                  {logado
                    ? "Sem cartão. O acesso entra no ar na hora."
                    : "Sem cartão. O acesso é liberado sozinho assim que a conta estiver pronta."}
                </p>
              </div>
            )}

            {stats.aoVivo ? (
              <p className="mt-5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <BadgeCheck className="size-3.5" strokeWidth={2} />
                {arredondarPraBaixo(stats.total)} questões catalogadas até agora
              </p>
            ) : null}
          </header>

          {/* ----------------------------------------------- o que vai ver */}
          <section className="mt-12">
            <h2 className="font-heading text-[20px] leading-tight font-semibold tracking-tight">
              O que você vai encontrar lá dentro
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {PASSEIO.map((p) => {
                const Icone = p.icone;
                return (
                  <div key={p.titulo} className="surface flex gap-3.5 rounded-2xl px-5 py-4">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-questly-green/15 text-questly-green-dark dark:text-questly-green">
                      <Icone className="size-4.5" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-semibold">{p.titulo}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {p.texto}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ------------------------------------------------- a parceria */}
          <section className="mt-12">
            <div className="surface rounded-3xl px-6 py-7 sm:px-8">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-questly-green/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-questly-green-dark uppercase dark:text-questly-green">
                <Handshake className="size-3.5" strokeWidth={2.4} />E se você topar
              </span>
              <h2 className="mt-4 font-heading text-[22px] leading-tight font-semibold tracking-tight text-balance">
                Você ganha de {FAIXAS[0].percentual}% a {FAIXAS[FAIXAS.length - 1].percentual}% de
                tudo que seu público pagar.
              </h2>
              <ul className="mt-5 flex flex-col gap-2.5">
                {[
                  "Um link só seu — sem cupom, sem desconto, só a indicação registrada em seu nome",
                  `Comissão em toda compra daquele aluno pelos primeiros ${JANELA_MESES_PADRAO} meses, incluindo renovações`,
                  `A faixa sobe com o volume do mês e vale pro mês inteiro, inclusive pras vendas que já entraram`,
                  "Pix todo mês, com um painel seu mostrando clique, conta criada e venda por venda",
                  "Sem exclusividade, sem meta mínima e sem custo nenhum pra entrar",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                    <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-questly-green-dark dark:text-questly-green">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/parceria"
                className={buttonVariants({ size: "lg" }) + " mt-6 h-12 w-full px-6 text-[15px]"}
              >
                Ver a proposta completa
                <ArrowRight />
              </Link>
              <p className="mt-3 text-center text-[12px] text-muted-foreground">
                Regras inteiras, tabela de comissão e simulação de quanto rende um mês.
              </p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
