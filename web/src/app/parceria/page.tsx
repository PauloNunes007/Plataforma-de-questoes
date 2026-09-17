import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Gift,
  Megaphone,
  Link2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import {
  DIAS_BONUS_PADRAO,
  DIA_REPASSE,
  FAIXAS,
  JANELA_MESES_PADRAO,
  REGRAS_PROGRAMA,
  simular,
  TAXA_GATEWAY_PCT,
} from "@/lib/afiliados/afiliados";
import {
  PRECO_MENSAL_CENTAVOS,
  PRECO_SEMESTRAL_CENTAVOS,
  reais,
} from "@/lib/plano/plano";
import { carregarStatsBanco, arredondarPraBaixo } from "@/lib/landing/stats";

// Página pública do programa de parceiros. Ela É a proposta comercial: não há
// PDF assinado no meio do caminho, então o que está escrito aqui é o que vale
// — e é por isso que TODO número desta tela sai de lib/afiliados/afiliados.ts
// (faixas, janela, piso de repasse) e de lib/plano/plano.ts (preços). Um "30%"
// digitado à mão aqui vira, no dia em que a tabela mudar, uma promessa que a
// plataforma não cumpre — o pior tipo de erro possível numa página que serve
// de contrato.
//
// Pra quem ela é escrita: um perfil de Instagram que fala com universitários e
// nunca ouviu falar em programa de afiliados. Daí a ordem — primeiro quanto
// dá pra ganhar, depois por que o público dele aceita o link, e só então as
// regras. Quem lê está decidindo se responde a mensagem, não estudando um
// contrato.
export const revalidate = 3600;

const TITULO = "Programa de parceiros da Expectrum — ganhe até 40% por indicação";
const DESCRICAO = `Indique a Expectrum pro seu público: seus seguidores ganham ${DIAS_BONUS_PADRAO} dias de Pro e você recebe de ${FAIXAS[0].percentual}% a ${FAIXAS[FAIXAS.length - 1].percentual}% de tudo que eles pagarem, por ${JANELA_MESES_PADRAO} meses.`;

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: "/parceria" },
  openGraph: { title: TITULO, description: DESCRICAO, url: "/parceria", type: "website" },
};

const SIMULACAO = simular([5, 10, 25, 50]);

const PASSOS: { icone: typeof Link2; titulo: string; texto: string }[] = [
  {
    icone: Link2,
    titulo: "Você recebe um link só seu",
    texto:
      "expectrum.com.br/p/SEUCODIGO. Vai na bio, no story, na descrição do vídeo — onde seu público já está.",
  },
  {
    icone: Gift,
    titulo: `Quem clica ganha ${DIAS_BONUS_PADRAO} dias de Pro`,
    texto:
      "Na hora, sem cartão e sem pegadinha. Você não está pedindo um favor ao seu público: está dando um presente que custa caro pra ele conseguir de outro jeito.",
  },
  {
    icone: TrendingUp,
    titulo: "Toda compra dele é sua comissão",
    texto: `A primeira e cada renovação, pelos primeiros ${JANELA_MESES_PADRAO} meses da conta. Um aluno que assina o semestral duas vezes te paga duas vezes.`,
  },
  {
    icone: Wallet,
    titulo: "Pix todo mês",
    texto: `O mês fecha no último dia e o dinheiro cai até o dia ${DIA_REPASSE} do mês seguinte. Você acompanha tudo, venda por venda, num painel seu.`,
  },
];

export default async function ParceriaPage() {
  const stats = await carregarStatsBanco();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
        <div className="absolute top-72 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-gold/12 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-6 pb-20">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 rounded-xl py-1 pr-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Logo />
          </Link>
          <Link
            href="/parceiro"
            className="text-[12.5px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Já sou parceiro
          </Link>
        </div>

        {/* ------------------------------------------------------- topo */}
        <header className="mt-10 sm:mt-14">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-questly-gold/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-questly-gold uppercase">
            <Megaphone className="size-3.5" strokeWidth={2.4} />
            Programa de parceiros
          </span>
          <h1 className="mt-4 font-heading text-[30px] leading-[1.08] font-semibold tracking-tight text-balance sm:text-[42px]">
            Seu público já estuda. Ganhe até{" "}
            <span className="text-questly-green-dark dark:text-questly-green">
              {FAIXAS[FAIXAS.length - 1].percentual}%
            </span>{" "}
            por indicar onde.
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-pretty text-muted-foreground">
            A Expectrum é uma plataforma de estudos pra universitário:{" "}
            {stats.aoVivo ? `${arredondarPraBaixo(stats.total)} questões ` : "questões "}
            de provas antigas catalogadas por assunto, com resolução, simulados cronometrados e o
            controle de faltas e notas do semestre. Você indica pelo seu link, seu seguidor ganha{" "}
            {DIAS_BONUS_PADRAO} dias de Pro, e toda compra dele nos próximos {JANELA_MESES_PADRAO}{" "}
            meses paga comissão pra você.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="mailto:contato@expectrum.com.br?subject=Quero%20ser%20parceiro%20da%20Expectrum"
              className={buttonVariants({ size: "lg" }) + " h-12 px-6 text-[15px]"}
            >
              Quero ser parceiro
              <ArrowRight />
            </a>
            <span className="text-[12.5px] text-muted-foreground">
              Resposta em até 1 dia útil · sem exclusividade · sem meta mínima
            </span>
          </div>
        </header>

        {/* ---------------------------------------------------- faixas */}
        <section className="mt-14">
          <h2 className="font-heading text-[22px] leading-tight font-semibold tracking-tight">
            Quanto maior o mês, maior a sua fatia
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            A faixa é recalculada todo mês e vale para o mês <strong>inteiro</strong> — quando você
            passa de {FAIXAS[1].min} vendas, as anteriores também sobem de percentual. Venda conta a
            primeira compra e cada renovação dos alunos que você trouxe.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Faixa</th>
                  <th className="px-4 py-3 font-semibold">Vendas no mês</th>
                  <th className="px-4 py-3 text-right font-semibold">Sua comissão</th>
                </tr>
              </thead>
              <tbody>
                {FAIXAS.map((f, i) => {
                  const proxima = FAIXAS[i + 1];
                  return (
                    <tr key={f.nome} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{f.nome}</td>
                      <td className="tnum px-4 py-3 text-muted-foreground">
                        {proxima ? `${f.min || 1} a ${proxima.min - 1}` : `${f.min} ou mais`}
                      </td>
                      <td className="tnum px-4 py-3 text-right text-[15px] font-bold text-questly-green-dark dark:text-questly-green">
                        {f.percentual}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[12px] text-muted-foreground">
            Percentual sobre o valor líquido recebido (preço pago menos a taxa do meio de pagamento,
            estimada em {TAXA_GATEWAY_PCT}%). Nada mais é descontado.
          </p>
        </section>

        {/* ------------------------------------------------- simulação */}
        <section className="mt-12">
          <h2 className="font-heading text-[22px] leading-tight font-semibold tracking-tight">
            Na prática, num mês
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Os dois planos da plataforma custam {reais(PRECO_MENSAL_CENTAVOS)} (mensal) e{" "}
            {reais(PRECO_SEMESTRAL_CENTAVOS)} (semestral — o mais escolhido, porque cobre o semestre
            inteiro). Abaixo, quanto entra pra você conforme o que seu público comprar.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Vendas no mês</th>
                  <th className="px-4 py-3 font-semibold">Faixa</th>
                  <th className="px-4 py-3 text-right font-semibold">Se todas semestrais</th>
                  <th className="px-4 py-3 text-right font-semibold">Se todas mensais</th>
                </tr>
              </thead>
              <tbody>
                {SIMULACAO.map((l) => (
                  <tr key={l.vendas} className="border-t border-border">
                    <td className="tnum px-4 py-3 font-semibold">{l.vendas}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.faixa.nome} · {l.faixa.percentual}%
                    </td>
                    <td className="tnum px-4 py-3 text-right text-[15px] font-bold text-questly-green-dark dark:text-questly-green">
                      {reais(l.semestralCentavos)}
                    </td>
                    <td className="tnum px-4 py-3 text-right text-muted-foreground">
                      {reais(l.mensalCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[12px] text-muted-foreground">
            Simulação, não promessa: quanto você vende depende do seu público. O que está fixo é o
            percentual — e ele é o mesmo para todo mundo.
          </p>
        </section>

        {/* -------------------------------------------- como funciona */}
        <section className="mt-12">
          <h2 className="font-heading text-[22px] leading-tight font-semibold tracking-tight">
            Como funciona
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PASSOS.map((p, i) => {
              const Icone = p.icone;
              return (
                <div key={p.titulo} className="surface rounded-2xl px-5 py-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-questly-green/15 text-questly-green-dark dark:text-questly-green">
                      <Icone className="size-4" strokeWidth={2.2} />
                    </span>
                    <span className="tnum text-[11px] font-bold text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold">{p.titulo}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {p.texto}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------- por que o público aceita */}
        <section className="mt-12">
          <div className="surface rounded-3xl px-6 py-7 sm:px-8">
            <h2 className="font-heading text-[22px] leading-tight font-semibold tracking-tight">
              Por que seu público aceita
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Ninguém quer queimar a audiência com link de venda. Por isso o que o seu link entrega
              não é um desconto — é <strong>{DIAS_BONUS_PADRAO} dias de Pro completo, de graça</strong>.
              Seu seguidor não precisa gastar nada pra sentir que valeu a pena ter clicado, e o
              plano grátis continua existindo depois.
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                "Sem pedir cartão de crédito em nenhum momento do bônus",
                "Sem cobrança automática quando o bônus acabar",
                "O plano grátis segue funcionando: banco de questões, trilha da ementa e um simulado por semana",
                "Você não precisa produzir nada: o link já vem com página, texto e preview prontos",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                  <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-questly-green-dark dark:text-questly-green">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ----------------------------------------------------- regras */}
        <section className="mt-12">
          <h2 className="font-heading text-[22px] leading-tight font-semibold tracking-tight">
            As regras, inteiras
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            É o programa todo — não há anexo, letra miúda nem cláusula que aparece depois.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {REGRAS_PROGRAMA.map((r) => (
              <div key={r.titulo} className="rounded-2xl border border-border px-5 py-4">
                <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
                  <BadgeCheck
                    className="size-4 shrink-0 text-questly-green-dark dark:text-questly-green"
                    strokeWidth={2.2}
                  />
                  {r.titulo}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {r.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- CTA */}
        <section className="mt-12">
          <div className="surface rounded-3xl px-6 py-8 text-center sm:px-8">
            <h2 className="font-heading text-[24px] leading-tight font-semibold tracking-tight text-balance">
              Manda uma mensagem e seu link sai hoje.
            </h2>
            <p className="mx-auto mt-2.5 max-w-lg text-[14px] leading-relaxed text-pretty text-muted-foreground">
              Diz o nome do perfil, o @ e o curso/universidade do seu público. A gente cria o código,
              te manda o link e libera seu painel — dá pra começar no mesmo dia.
            </p>
            <a
              href="mailto:contato@expectrum.com.br?subject=Quero%20ser%20parceiro%20da%20Expectrum"
              className={buttonVariants({ size: "lg" }) + " mt-6 h-12 px-7 text-[15px]"}
            >
              Falar com a Expectrum
              <ArrowRight />
            </a>
            <p className="mt-3 text-[12px] text-muted-foreground">contato@expectrum.com.br</p>
          </div>
        </section>
      </div>
    </div>
  );
}
