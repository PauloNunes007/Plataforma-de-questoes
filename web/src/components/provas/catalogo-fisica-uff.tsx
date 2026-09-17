// Página pública do acervo de provas antigas de Física I e II da UFF.
//
// É a isca de distribuição: em vez de anunciar a plataforma num grupo de
// alunos, a plataforma aparece quando alguém procura pela prova. Por isso a
// página entrega valor ANTES do cadastro (o catálogo inteiro, os assuntos que
// cada prova cobra, uma questão de amostra) e cobra depois — o que fica atrás
// do login é a RESPOSTA: gabarito, resolução passo a passo e o relógio.
//
// Servidor, sem framer-motion: HTML pronto pro crawler e pra 3G de corredor.
//
// Honestidade: todo número visível vem de `lib/provas/catalogo.ts`, que lê o
// banco. Nada de contagem digitada na mão.
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CircleCheck,
  FileText,
  Layers,
  ListChecks,
  Lock,
  Printer,
  Timer,
  Trophy,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { CatalogoProvas } from "@/lib/provas/catalogo";
import {
  PRECO_MENSAL_CENTAVOS,
  PRECO_SEMESTRAL_MENSAL_CENTAVOS,
  reais,
} from "@/lib/plano/plano";
import { QUESTOES_DIA_FREE, SIMULADO_FREE_LIMITE_SEMANA } from "@/lib/plano/limites";

const RECURSOS = [
  {
    icone: FileText,
    titulo: "Refazer a prova inteira, na ordem original",
    texto:
      "Não é um simulado sorteado que parece a prova: é a prova. As questões na sequência em que o professor aplicou, com o relógio ligado no tempo da aplicação.",
  },
  {
    icone: BookOpenCheck,
    titulo: "Resolução passo a passo, não só o gabarito",
    texto:
      "Saber que a resposta é a letra C não ensina nada. Cada questão do acervo tem o caminho até ela — a montagem, a conta e onde costuma escapar.",
  },
  {
    icone: ListChecks,
    titulo: "Lista só do assunto que cai na sua P2",
    texto:
      "Toda questão é catalogada pelo tópico da ementa. Dá pra pedir 20 questões só de Lei de Gauss, atravessando dez provas de anos diferentes, sem abrir dez PDFs.",
  },
  {
    icone: Layers,
    titulo: "Simulado misto de vários anos",
    texto:
      "Escolhe os tópicos, o tamanho e o tempo; a plataforma sorteia entre todas as provas do acervo e monta um exame novo. No fim, boletim com nota e revisão questão a questão.",
  },
  {
    icone: Trophy,
    titulo: "Ranking por prova",
    texto:
      "Prova oficial é a única comparação justa que existe: mesmas questões, mesma ordem, mesmo tempo. Entrar no ranking é opcional — nasce desligado.",
  },
  {
    icone: Printer,
    titulo: "Imprimir pra resolver no papel",
    texto:
      "Exporta a lista ou a prova em PDF, com ou sem gabarito no fim, no formato de folha de prova. Física se aprende rabiscando.",
  },
];

const PASSOS = [
  { n: "1", t: "Crie a conta", d: "Leva menos de um minuto, é grátis e não pede cartão." },
  { n: "2", t: "Escolha a prova", d: "P1, P2 ou P3 do semestre que você quiser treinar." },
  { n: "3", t: "Faça e confira", d: "Responde, entrega e vê a resolução de cada uma que errou." },
];

const FAQ = [
  {
    p: "De onde vêm essas provas?",
    r: "São provas realmente aplicadas nas disciplinas de Física I e Física II da UFF, transcritas questão a questão a partir do original — enunciado, alternativas e as figuras recortadas da própria prova. Uma prova só entra no catálogo quando TODAS as questões dela estão no banco: transcrição pela metade continua sendo questão avulsa no acervo, mas não é oferecida como a prova completa.",
  },
  {
    p: "Tem gabarito e resolução?",
    r: "Tem, das duas coisas, e a resolução é a parte que importa. É o que fica atrás do cadastro: nesta página você vê a prova, os assuntos que ela cobra e uma questão de amostra; a resposta comentada aparece quando você entra.",
  },
  {
    p: "Preciso pagar?",
    r: `Não pra começar. O plano grátis dá ${QUESTOES_DIA_FREE} questões por dia com resolução, listas montadas por você e ${SIMULADO_FREE_LIMITE_SEMANA} simulado cronometrado por semana — o suficiente pra atravessar uma véspera de prova. O Pro tira os tetos, libera exportar em PDF e abre as estatísticas.`,
  },
  {
    p: "Meu professor é outro. Ainda serve?",
    r: "Serve, e é justamente por isso que o catálogo é grande. Ementa de Física I e II é a mesma no departamento; o que muda entre turmas é o recorte e o peso. Por isso tudo aqui é filtrável por tópico: se o seu professor não cobra corpo rígido, você monta a lista sem corpo rígido.",
  },
  {
    p: "Isso é oficial da UFF?",
    r: "Não. A Expectrum não tem vínculo com a universidade e não fala por nenhum departamento. É um acervo organizado por alunos, com o material que já circula entre alunos — a diferença é que aqui ele está catalogado, resolvido e pesquisável.",
  },
];

export function CatalogoFisicaUff({ catalogo }: { catalogo: CatalogoProvas }) {
  const { grupos, totalProvas, totalQuestoes, anoMin, anoMax } = catalogo;
  const periodo = anoMin && anoMax ? (anoMin === anoMax ? `${anoMin}` : `${anoMin}–${anoMax}`) : null;

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-12 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-questly-green/30 bg-questly-green/10 px-3 py-1 text-xs font-semibold text-questly-green-dark dark:text-questly-green">
          <FileText className="size-3.5" strokeWidth={2.5} />
          Acervo UFF · Física I e Física II
        </span>

        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-[3.25rem]">
          Provas antigas de Física I e II da UFF — resolvidas, tópico a tópico.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
          {totalProvas > 0 ? (
            <>
              <strong className="font-semibold text-foreground">
                {totalProvas} provas completas
              </strong>{" "}
              e <strong className="font-semibold text-foreground">{totalQuestoes} questões</strong>
              {periodo ? ` de ${periodo}` : ""}, digitadas do original e catalogadas pelo assunto que
              cada uma cobra. Dá pra refazer a prova inteira cronometrada ou puxar só as questões do
              tópico que vai cair.
            </>
          ) : (
            <>
              Provas de Física I e II aplicadas na UFF, digitadas do original e catalogadas pelo
              assunto que cada uma cobra — pra refazer a prova inteira cronometrada ou puxar só as
              questões do tópico que vai cair.
            </>
          )}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/login" className={`${buttonVariants({ size: "lg" })} h-12 px-6 text-[15px]`}>
            Criar conta e começar
            <ArrowRight />
          </Link>
          <a
            href="#catalogo"
            className={`${buttonVariants({ variant: "outline", size: "lg" })} h-12 px-6 text-[15px]`}
          >
            Ver as provas
          </a>
          <span className="text-sm text-muted-foreground">Grátis · sem cartão</span>
        </div>

        {totalProvas > 0 && (
          <dl className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: String(totalProvas), l: "provas completas", n: "P1, P2 e P3" },
              { v: String(totalQuestoes), l: "questões", n: "com resolução" },
              { v: periodo ?? "—", l: "anos no acervo", n: "e crescendo" },
              { v: String(grupos.length), l: "disciplinas", n: grupos.map((g) => g.materiaNome).join(" e ") },
            ].map((n) => (
              <div key={n.l} className="surface rounded-2xl p-4">
                <dt className="tnum text-2xl font-semibold tracking-tight text-questly-green-dark sm:text-3xl dark:text-questly-green">
                  {n.v}
                </dt>
                <dd className="mt-1 text-[13px] leading-tight font-medium">{n.l}</dd>
                <dd className="mt-0.5 text-[11.5px] leading-tight text-muted-foreground">{n.n}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* ------------------------------------------------------- catálogo */}
      <section id="catalogo" className="scroll-mt-20 border-y border-border/60 bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            O catálogo completo
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground text-pretty">
            Clique numa prova pra ver quantas questões ela tem, quais assuntos cobra e uma questão de
            amostra — antes de criar conta.
          </p>

          {grupos.length === 0 ? (
            <p className="surface mt-8 rounded-2xl p-6 text-sm text-muted-foreground">
              O catálogo não respondeu agora. Recarregue em instantes — as provas continuam no
              acervo, é a listagem que falhou.
            </p>
          ) : (
            <div className="mt-10 space-y-12">
              {grupos.map((g) => (
                <div key={g.materiaNome}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-xl font-semibold tracking-tight">{g.materiaNome}</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="tnum font-medium text-foreground">{g.provas.length}</span>{" "}
                      provas ·{" "}
                      <span className="tnum font-medium text-foreground">{g.questoes}</span> questões
                    </p>
                  </div>

                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.provas.map((p) => (
                      <li key={p.codigo}>
                        <Link
                          href={`/provas/fisica-uff/${p.slug}`}
                          className="surface group flex h-full items-center gap-3 rounded-2xl p-4 transition-colors hover:border-questly-green/40"
                        >
                          <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-questly-green/12 text-questly-green-dark dark:text-questly-green">
                            <span className="text-[13px] leading-none font-bold">{p.prova}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] leading-tight font-semibold">
                              {g.materiaNome} · {p.prova} de {p.periodo}
                            </span>
                            <span className="tnum mt-1 block text-[12.5px] text-muted-foreground">
                              {p.questoes} questões · {p.duracaoMin} min sugeridos
                            </span>
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------- o que dá pra fazer */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          O que dá pra fazer com elas aqui
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground text-pretty">
          Um PDF de prova antiga você já tem — provavelmente num grupo de WhatsApp, sem gabarito e
          sem saber de que assunto é cada questão. O que muda aqui é o que dá pra fazer com ele.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="surface rounded-2xl p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-questly-green/12 text-questly-green">
                <r.icone className="size-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[15px] leading-snug font-semibold">{r.titulo}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground text-pretty">
                {r.texto}
              </p>
            </div>
          ))}
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {PASSOS.map((p) => (
            <li key={p.n} className="flex gap-3">
              <span className="tnum mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-[12px] font-bold text-questly-green-dark dark:text-questly-green">
                {p.n}
              </span>
              <span className="text-sm leading-snug">
                <b className="font-semibold">{p.t}</b>
                <span className="mt-0.5 block text-muted-foreground">{p.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ----------------------------------------------------------- preço */}
      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Quanto custa
          </h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="surface rounded-3xl p-6">
              <p className="text-sm font-semibold text-muted-foreground">Grátis</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">R$ 0</p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  `${QUESTOES_DIA_FREE} questões por dia, com resolução passo a passo`,
                  "Acesso ao acervo inteiro de provas antigas",
                  "Listas montadas por você: disciplina, assunto e tamanho",
                  `${SIMULADO_FREE_LIMITE_SEMANA} simulado cronometrado por semana`,
                  "Trilha da ementa, streak, XP e ligas",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CircleCheck
                      className="mt-0.5 size-4 shrink-0 text-questly-green"
                      strokeWidth={2.5}
                    />
                    <span className="text-pretty">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface rounded-3xl border-questly-green/40 p-6">
              <p className="text-sm font-semibold text-questly-green-dark dark:text-questly-green">
                Pro
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight">
                  {reais(PRECO_MENSAL_CENTAVOS)}
                </span>
                <span className="text-sm text-muted-foreground">
                  por mês · ou {reais(PRECO_SEMESTRAL_MENSAL_CENTAVOS)}/mês no semestral
                </span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "Questões ilimitadas — sem teto diário",
                  "Simulados cronometrados ilimitados",
                  "Exportar provas e listas em PDF pra imprimir",
                  "Autópsia do erro: por que você errou, não só que errou",
                  "Controle de faltas e calculadora de nota da próxima prova",
                  "Relatório semanal por e-mail e estatísticas avançadas",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CircleCheck
                      className="mt-0.5 size-4 shrink-0 text-questly-green"
                      strokeWidth={2.5}
                    />
                    <span className="text-pretty">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                Cancelamento pela própria tela, a qualquer momento. Sete dias para arrependimento com
                devolução integral, como manda o Código de Defesa do Consumidor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Perguntas
        </h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.p} className="surface group rounded-2xl p-5 [&[open]>summary]:mb-3">
              <summary className="cursor-pointer list-none text-[15px] font-semibold marker:content-none">
                {f.p}
              </summary>
              <p className="text-[14px] leading-relaxed text-muted-foreground text-pretty">{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ cta final */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="surface relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-questly-green/15 blur-[100px]"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-questly-green/12 px-3 py-1 text-xs font-semibold text-questly-green-dark dark:text-questly-green">
              <Lock className="size-3.5" strokeWidth={2.5} />
              A resolução está do outro lado do cadastro
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              A prova que vai cair já foi aplicada antes.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-pretty">
              Faça as questões que o seu departamento realmente cobra, com o gabarito comentado do
              lado. Criar conta leva menos de um minuto.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className={`${buttonVariants({ size: "lg" })} h-12 px-7 text-[15px]`}
              >
                Criar conta grátis
                <ArrowRight />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Timer className="size-4" strokeWidth={2} />
                Sem cartão, sem cobrança automática
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
