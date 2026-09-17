"use client";

// Landing page pública da Expectrum (rota "/"). Estilo "fintech premium":
// superfícies de vidro, ritmo generoso, números tabulares, ícones Lucide
// (sem emoji estrutural). Mantém a paleta de marca do app. Dinâmica/
// responsiva ao usuário: cards com tilt 3D no ponteiro, mascote flutuante
// com parallax, barras do preview animadas — tudo gated por
// prefers-reduced-motion.
//
// Os números que aparecem aqui vêm do banco de verdade (page.tsx →
// carregarStatsBanco) — a landing nunca inventa contagem.
//
// A campanha dedicada à UFF (fita no topo, selo no hero, seção própria) está
// DESLIGADA desde 2026-09-16: lia como propaganda de cursinho. A UFF continua
// na página, mas só como fato do acervo — a contagem "N de provas da UFF" na
// faixa de números abaixo. Pra religar, ver lib/landing/campanha.ts.
import Link from "next/link";
import Image from "next/image";
import { type ComponentType, type ReactNode, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Check,
  Compass,
  FileText,
  Flame,
  Layers,
  Library,
  LineChart,
  Microscope,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { CAMPANHA } from "@/lib/landing/campanha";
import { arredondarPraBaixo, type StatsBanco } from "@/lib/landing/stats";
import {
  MESES_SEMESTRE,
  PARCELAS_SEMESTRAL,
  PRECO_MENSAL_CENTAVOS,
  PRECO_SEMESTRAL_CENTAVOS,
  PRECO_SEMESTRAL_MENSAL_CENTAVOS,
  RECURSOS_FREE,
  RECURSOS_PRO,
  reais,
  type ItemPlano,
} from "@/lib/plano/plano";
import { FitaCampanha, SecaoCampanha, SeloCampanhaHero } from "./campanha-uff";
import { SimuladosShowcase } from "./simulados-showcase";
import { Faq } from "./faq";

/* Link estilizado como botão — o Button do app (base-ui) não tem `asChild`,
   então aplicamos as variantes direto num <Link>/<a>. */
type BtnProps = {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
};
function BtnLink({ href, children, variant, size, className }: BtnProps) {
  const cls = `${buttonVariants({ variant, size })} ${className ?? ""}`;
  if (href.startsWith("#")) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------- motion */

function Revelar({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduzir = useReducedMotion();
  if (reduzir) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/** Card que inclina em 3D seguindo o ponteiro (desktop). No touch, fica
 *  estático — nada de depender de hover. Respeita reduced-motion. */
function TiltCard({
  children,
  className = "",
  intensidade = 6,
}: {
  children: ReactNode;
  className?: string;
  intensidade?: number;
}) {
  const reduzir = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [intensidade, -intensidade]), {
    stiffness: 220,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-intensidade, intensidade]), {
    stiffness: 220,
    damping: 18,
  });

  if (reduzir) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      whileHover={{ y: -4 }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------- conteúdo */

const NAV = [
  { label: "Simulados", href: "#simulados" },
  { label: "Método", href: "#metodo" },
  { label: "Recursos", href: "#recursos" },
  { label: "Preços", href: "#precos" },
];

const RECURSOS: {
  icon: ComponentType<{ className?: string }>;
  cor: string;
  titulo: string;
  desc: string;
}[] = [
  {
    icon: Target,
    cor: "text-questly-green",
    titulo: "A lista é sua, do seu jeito",
    desc: "Disciplina, assunto e tamanho escolhidos por você. Vinte minutos no corredor entre aulas ou três horas num sábado — a lista sai na hora, no tamanho que você pediu.",
  },
  {
    icon: FileText,
    cor: "text-questly-blue",
    titulo: "Simulados cronometrados",
    desc: "Prova de verdade, com relógio correndo e questões das provas antigas da sua universidade. No fim, boletim e revisão questão a questão.",
  },
  {
    icon: Library,
    cor: "text-questly-purple",
    titulo: "Questões de provas antigas",
    desc: "Enunciado digitado do original, fórmulas renderizadas e figuras recortadas da própria prova — com resolução passo a passo em todas.",
  },
  {
    icon: Swords,
    cor: "text-questly-orange",
    titulo: "Prova antiga inteira, como ela caiu",
    desc: "P1, P2 e P3 remontadas questão a questão, na ordem original. Você faz a prova que a sua turma fez — e vê como teria ido.",
  },
  {
    icon: CalendarClock,
    cor: "text-questly-blue",
    titulo: "Seu mês, planejado por você",
    desc: "Sessão de estudo com hora marcada, meta de questões do dia, tarefa solta e a data da prova. É a sua agenda — a gente não põe nada lá dentro sem você pedir.",
  },
  {
    icon: RefreshCcw,
    cor: "text-questly-purple",
    titulo: "Vê o que está escapando",
    desc: "A trilha marca os assuntos cuja memória já começou a cair desde a última vez que você praticou. Quando revisar continua sendo decisão sua.",
  },
  {
    icon: BrainCircuit,
    cor: "text-questly-gold",
    titulo: "Sorte não conta como saber",
    desc: "Um chute certo não infla sua nota e um erro bobo não te derruba. A gente mede domínio de verdade, tópico por tópico.",
  },
  {
    icon: Compass,
    cor: "text-questly-green",
    titulo: "A ementa inteira num mapa",
    desc: "Cada assunto da disciplina, na ordem do curso, com o que você já estudou e o quanto acertou em cada um. Entrou no meio do semestre? Marca o que já sabe e segue.",
  },
  {
    icon: LineChart,
    cor: "text-questly-red",
    titulo: "Seu desempenho, sem maquiagem",
    desc: "Acertos e erros por assunto, evolução ao longo do tempo e os tópicos onde você mais erra. Número que você conferiu, não previsão.",
  },
  {
    icon: Trophy,
    cor: "text-questly-gold",
    titulo: "Constância que vira disputa",
    desc: "Ligas semanais do bronze ao diamante, com promoção e rebaixamento. A régua é o que você produziu na semana, não quanto tempo ficou com a aba aberta.",
  },
  {
    icon: Flame,
    cor: "text-questly-orange",
    titulo: "O hábito, em números",
    desc: "Cada questão vale XP pela dificuldade e cada dia de estudo mantém a ofensiva acesa. Você vê a série crescer — e é ela que sustenta o semestre.",
  },
  {
    icon: Layers,
    cor: "text-questly-green",
    titulo: "Suas anotações, no lugar certo",
    desc: "Favorite a questão que te derrubou, escreva a sua própria resolução e volte nela na véspera — tudo guardado junto da questão.",
  },
];

const CIENCIA: {
  icon: ComponentType<{ className?: string }>;
  titulo: string;
  desc: string;
}[] = [
  {
    icon: RefreshCcw,
    titulo: "Repetição espaçada",
    desc: "Revisar no momento em que a memória começa a cair fixa muito mais do que reler tudo de véspera — e a trilha te mostra quando esse momento chegou.",
  },
  {
    icon: Layers,
    titulo: "Prática de recuperação",
    desc: "Lembrar ativamente uma resposta (não só reconhecer) é o que consolida. Por isso, aqui, tudo é questão — não vídeo.",
  },
  {
    icon: BrainCircuit,
    titulo: "Rastreamento de maestria",
    desc: "Separamos sorte de domínio real, tópico a tópico, pra saber onde você de fato está — e o que ainda precisa de trabalho.",
  },
  {
    icon: Microscope,
    titulo: "Metacognição",
    desc: "Ao errar, você diz o motivo (conceito, cálculo, interpretação, chute) — e passa a enxergar o padrão por trás dos seus erros.",
  },
];

const PASSOS: { n: string; titulo: string; desc: string }[] = [
  {
    n: "01",
    titulo: "Você escolhe o assunto",
    desc: "Disciplina, tópicos da ementa e nível. Nada de decidir por você: quem sabe o que caiu na aula de ontem é você.",
  },
  {
    n: "02",
    titulo: "A lista sai do tamanho que você pediu",
    desc: "Cinco questões entre uma aula e outra ou quarenta num domingo. Cada uma com resolução passo a passo, fórmula renderizada e a figura da prova original.",
  },
  {
    n: "03",
    titulo: "A trilha registra o que você fez",
    desc: "Cada questão respondida vai pro mapa da ementa: quanto você já cobriu de cada assunto, quanto acertou e o que a memória já começou a soltar.",
  },
  {
    n: "04",
    titulo: "O simulado mede de verdade",
    desc: "Prova cronometrada montada com provas antigas da sua universidade — ou a prova antiga inteira, na ordem original. No fim, boletim e revisão questão a questão.",
  },
  {
    n: "05",
    titulo: "O ranking mantém o ritmo",
    desc: "XP por dificuldade, ofensiva diária e ligas semanais do bronze ao diamante — uma régua a mais pra semana em que a disciplina falha sozinha.",
  },
];

/* ------------------------------------------------------------------ view */

export function LandingView({ stats }: { stats: StatsBanco }) {
  const reduzir = useReducedMotion();
  const glows = useMemo(
    () => (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-purple/15 blur-[120px]" />
        <div className="absolute top-[130%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-questly-blue/10 blur-[120px]" />
      </div>
    ),
    [],
  );

  const NUMEROS = [
    {
      valor: arredondarPraBaixo(stats.total),
      sufixo: "questões",
      legenda: "de provas antigas e listas, com resolução passo a passo",
    },
    {
      valor: arredondarPraBaixo(stats.instituicao),
      sufixo: `de provas da ${CAMPANHA.instituicao}`,
      legenda: "digitadas do original, tópico a tópico",
    },
    {
      valor: "100%",
      sufixo: "com resolução",
      legenda: "nenhuma questão entra no banco só com o gabarito",
    },
    {
      valor: "0",
      sufixo: "estimativa",
      legenda: "todo número do seu painel é registro do que você respondeu",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {glows}

      <FitaCampanha />

      {/* ---------------------------------------------------------- header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
          <Logo />
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <BtnLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Entrar
            </BtnLink>
            <BtnLink href="/login" size="sm">
              Começar grátis
              <ArrowRight />
            </BtnLink>
          </div>
        </div>

        {/* nav do mobile: rolagem horizontal em vez de esconder tudo */}
        <nav className="flex gap-1 overflow-x-auto border-t border-border/50 px-4 py-2 md:hidden [scrollbar-width:none]">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="relative mx-auto max-w-7xl px-5 pt-14 pb-20 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.span
              initial={reduzir ? undefined : { opacity: 0, y: 10 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-questly-green/30 bg-questly-green/10 px-3 py-1 text-xs font-medium text-questly-green-dark dark:text-questly-green"
            >
              <Sparkles className="size-3.5" />Prova antiga, resolvida passo a passo
            </motion.span>

            <motion.h1
              initial={reduzir ? undefined : { opacity: 0, y: 16 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Treine com a prova de verdade.{" "}
              <span className="bg-gradient-to-br from-questly-green to-questly-green-deep bg-clip-text text-transparent">
                Chegue pronto na sua.
              </span>
            </motion.h1>

            <motion.p
              initial={reduzir ? undefined : { opacity: 0, y: 16 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty"
            >
              <strong className="font-semibold text-foreground">
                Questões das provas antigas da sua universidade
              </strong>
              , com resolução passo a passo,{" "}
              <strong className="font-semibold text-foreground">simulados cronometrados</strong> e a{" "}
              <strong className="font-semibold text-foreground">ementa inteira num mapa</strong>. Você
              escolhe o assunto e o tamanho da lista — a plataforma não decide o seu dia por você,{" "}
              <em className="font-medium text-foreground not-italic">mostra</em> onde você está.
            </motion.p>

            <motion.div
              initial={reduzir ? undefined : { opacity: 0, y: 16 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <BtnLink href="/login" size="lg" className="h-12 px-6 text-[15px]">
                Criar conta grátis
                <ArrowRight />
              </BtnLink>
              <BtnLink href="#simulados" size="lg" variant="outline" className="h-12 px-6 text-[15px]">
                Ver os simulados
              </BtnLink>
            </motion.div>

            <motion.p
              initial={reduzir ? undefined : { opacity: 0 }}
              animate={reduzir ? undefined : { opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ShieldCheck className="size-4 text-questly-green" />
              Grátis pra começar · sem cartão de crédito
            </motion.p>

            <SeloCampanhaHero stats={stats} />
          </div>

          {/* preview mockup */}
          <Revelar delay={0.1}>
            <HeroPreview />
          </Revelar>
        </div>

        {/* stats strip */}
        <motion.dl
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-20 grid grid-cols-2 gap-4 border-t border-border/60 pt-10 lg:grid-cols-4"
        >
          {NUMEROS.map((s) => (
            <motion.div key={s.legenda} variants={item}>
              <dt className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="tnum text-3xl font-semibold tracking-tight sm:text-4xl">
                  {s.valor}
                </span>
                <span className="text-sm font-medium text-questly-green">{s.sufixo}</span>
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground text-pretty">{s.legenda}</dd>
            </motion.div>
          ))}
        </motion.dl>
      </section>

      {/* ------------------------------------------------------- campanha */}
      <SecaoCampanha stats={stats} />

      {/* ------------------------------------------------------ simulados */}
      <SimuladosShowcase stats={stats} />

      {/* --------------------------------------------------------- método */}
      <section id="metodo" className="relative scroll-mt-16 border-t border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <Revelar className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Como você estuda aqui
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Sem plano automático e sem cronograma imposto. Você resolve questão de prova antiga do
              assunto que quiser, e a plataforma guarda o resultado num mapa da ementa — pra você
              enxergar, a qualquer momento, o que já domina e o que ainda não encarou.
            </p>
          </Revelar>

          <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Revelar className="lg:sticky lg:top-24 lg:self-start">
              <PesoVisual />
            </Revelar>

            <motion.ol
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="relative space-y-6"
            >
              {PASSOS.map((p) => (
                <motion.li key={p.n} variants={item} className="surface flex gap-4 rounded-2xl p-5">
                  <span className="tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-green/12 text-sm font-semibold text-questly-green-dark dark:text-questly-green">
                    {p.n}
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{p.titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                      {p.desc}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- mascote band */}
      <MascoteBand />

      {/* -------------------------------------------------------- recursos */}
      <section id="recursos" className="relative scroll-mt-16 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <Revelar className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              O que você precisa pra treinar de verdade
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Cada recurso existe por um motivo pedagógico. Nada aqui é enfeite — e nada decide o
              seu dia por você.
            </p>
          </Revelar>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {RECURSOS.map((r) => {
              const Icon = r.icon;
              return (
                <motion.div key={r.titulo} variants={item}>
                  <TiltCard className="surface h-full rounded-2xl p-6 transition-shadow hover:shadow-lg">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                      <Icon className={`size-5 ${r.cor}`} />
                    </span>
                    <h3 className="mt-4 font-semibold tracking-tight">{r.titulo}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                      {r.desc}
                    </p>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------------------- ciência */}
      <section id="ciencia" className="relative scroll-mt-16 border-y border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <Revelar>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Não é achismo. É como o cérebro aprende de verdade.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                A Expectrum aplica quatro mecanismos que a ciência da aprendizagem já cansou de
                comprovar — os que fixam conteúdo pra valer, não só até você sair da sala. E somos
                honestos: é uma heurística caprichada, não mágica.
              </p>
              <BtnLink href="/login" variant="outline" className="mt-7">
                Experimentar na prática
                <ArrowRight />
              </BtnLink>
            </Revelar>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {CIENCIA.map((c) => {
                const Icon = c.icon;
                return (
                  <motion.div key={c.titulo} variants={item}>
                    <TiltCard className="surface h-full rounded-2xl p-5">
                      <Icon className="size-5 text-questly-purple" />
                      <h3 className="mt-3 font-semibold tracking-tight">{c.titulo}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                        {c.desc}
                      </p>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- preços */}
      <section id="precos" className="relative scroll-mt-16 py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Revelar className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Comece de graça. Assine quando fizer sentido.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              O plano grátis tem o banco de questões inteiro com resolução, a trilha da ementa e um
              simulado cronometrado por semana. O Pro tira o limite de simulados e abre as
              estatísticas avançadas.
            </p>
          </Revelar>

          <div className="mt-14 grid items-start gap-6 md:grid-cols-2">
            {/* grátis */}
            <Revelar>
              <div className="surface flex h-full flex-col rounded-3xl p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">Grátis</h3>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Pra sempre
                  </span>
                </div>
                {/* A frase anterior ("o método completo, sem prazo de
                    validade") deixou de ser verdade quando o grátis ganhou
                    teto diário — ver lib/plano/limites.ts. A venda honesta é
                    mais fácil de sustentar do que a correção depois. */}
                <p className="mt-1 text-sm text-muted-foreground">
                  Pra estudar todo dia, com um teto por dia.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="tnum text-4xl font-semibold tracking-tight">R$ 0</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <BtnLink href="/login" variant="outline" className="mt-6 h-11">
                  Criar conta grátis
                </BtnLink>
                <ul className="mt-7 space-y-3">
                  {RECURSOS_FREE.map((f) => (
                    <FeatureLinha key={f.texto} {...f} />
                  ))}
                </ul>
              </div>
            </Revelar>

            {/* pro */}
            <Revelar delay={0.08}>
              <div className="surface-brand relative flex h-full flex-col rounded-3xl p-8 shadow-lg">
                <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-questly-green px-3 py-1 text-xs font-semibold text-white shadow-sm dark:text-[#0c1512]">
                  <Sparkles className="size-3.5" />
                  Escolha de quem quer passar
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">Expectrum Pro</h3>
                  <TrendingUp className="size-5 text-questly-green" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  O motor completo, sem freios, pro semestre inteiro.
                </p>
                {/* Os números vêm de lib/plano/plano.ts, a mesma fonte que a
                    /pro cobra — marketing e caixa não podem discordar de preço. */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-lg font-medium text-muted-foreground">R$</span>
                  <span className="tnum text-4xl font-semibold tracking-tight">
                    {PRECO_MENSAL_CENTAVOS / 100}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menos de R$ 0,50 por dia pra não repetir uma matéria.
                </p>
                <p className="tnum mt-1 text-xs font-medium text-questly-green">
                  ou {reais(PRECO_SEMESTRAL_MENSAL_CENTAVOS)}/mês no semestral —{" "}
                  {reais(PRECO_SEMESTRAL_CENTAVOS)} pelos {MESES_SEMESTRE} meses, parcelável em até{" "}
                  {PARCELAS_SEMESTRAL}× no cartão.
                </p>
                <BtnLink href="/login" className="mt-5 h-11">
                  Quero o Pro
                  <ArrowRight />
                </BtnLink>
                <ul className="mt-7 space-y-3">
                  {RECURSOS_PRO.map((f) => (
                    <FeatureLinha key={f.texto} {...f} />
                  ))}
                </ul>
                <p className="mt-6 text-xs text-muted-foreground">
                  Sem fidelidade e sem cobrança automática: você paga só o período que escolher.
                </p>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <Faq />

      {/* ------------------------------------------------------- final CTA */}
      <section className="relative px-5 py-24">
        <Revelar className="mx-auto max-w-4xl">
          <div className="surface-brand relative overflow-hidden rounded-[2rem] px-8 py-14 text-center sm:px-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-questly-green/20 blur-[90px]"
            />
            <div className="relative flex flex-col items-center">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Pare de estudar no escuro.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground text-pretty">
                Crie a conta, escolha a primeira disciplina e veja exatamente onde você está na
                ementa. Leva menos de um minuto e não pede cartão.
              </p>
              <BtnLink href="/login" size="lg" className="mt-8 h-12 px-7 text-[15px]">
                Criar conta grátis
                <ArrowRight />
              </BtnLink>
            </div>
          </div>
        </Revelar>
      </section>

      {/* --------------------------------------------------------- footer */}
      <footer className="border-t border-border/60 py-12">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <Logo />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                Plano de estudos, simulados e questões de provas antigas pra universitário que
                precisa passar em todas as matérias do semestre.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-[13px] font-semibold">Plataforma</p>
                <div className="mt-3 flex flex-col gap-2">
                  {NAV.map((n) => (
                    <a
                      key={n.href}
                      href={n.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {n.label}
                    </a>
                  ))}
                  {/* O acervo público é a porta de entrada de quem chega pelo
                      Google; daqui ele também é alcançável por quem chegou
                      pela home — e o link interno é o que diz ao buscador que
                      aquelas páginas fazem parte deste site. */}
                  <Link
                    href="/provas/fisica-uff"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Provas de Física da UFF
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
                  <a
                    href="#faq"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Dúvidas
                  </a>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Expectrum · Estude o que importa.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------- subcomponentes */

function FeatureLinha({ texto, incluso }: ItemPlano) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
          incluso ? "bg-questly-green/15 text-questly-green" : "bg-muted text-muted-foreground/70"
        }`}
      >
        {incluso ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </span>
      <span
        className={`text-sm leading-snug ${
          incluso
            ? "text-foreground"
            : "text-muted-foreground line-through decoration-muted-foreground/40"
        }`}
      >
        {texto}
      </span>
    </li>
  );
}

/** Faixa dedicada ao mascote (capivara de terno). Imagem real, com glow atrás,
 *  flutuação suave e leve parallax que segue o ponteiro. A capivara fica — é
 *  identidade da marca —, mas a COPY ao lado dela é sóbria de propósito: o
 *  texto antigo ("estude jogando", "do jeitinho capivara") empurrava a página
 *  pro tom de cursinho gamificado que o produto não quer ter. */
function MascoteBand() {
  const reduzir = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tx = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 20 });
  const ty = useSpring(useTransform(my, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 20 });

  return (
    <section
      className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-questly-green/8 to-transparent py-20"
      onMouseMove={
        reduzir
          ? undefined
          : (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              mx.set((e.clientX - r.left) / r.width - 0.5);
              my.set((e.clientY - r.top) / r.height - 0.5);
            }
      }
      onMouseLeave={
        reduzir
          ? undefined
          : () => {
              mx.set(0);
              my.set(0);
            }
      }
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-2">
        <Revelar>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Uma questão de cada vez.{" "}
            <span className="bg-gradient-to-br from-questly-green to-questly-green-deep bg-clip-text text-transparent">
              O resto fica registrado.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Você resolve; a plataforma guarda. Cada questão respondida vira cobertura da ementa,
            acerto por assunto e histórico — de modo que o painel que você abre na véspera da prova
            já está pronto quando você chega nele.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <BtnLink href="/login" className="h-11 px-6 text-[15px]">
              Começar agora
              <ArrowRight />
            </BtnLink>
            <BtnLink href="#recursos" variant="outline" className="h-11 px-6 text-[15px]">
              Ver os recursos
            </BtnLink>
          </div>
        </Revelar>

        <div className="relative flex justify-center md:justify-end">
          {/* halo atrás do mascote */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-questly-green/25 blur-[90px] sm:h-96 sm:w-96"
          />
          <motion.div
            style={reduzir ? undefined : { x: tx, y: ty }}
            animate={reduzir ? undefined : { y: [0, -12, 0] }}
            transition={reduzir ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* moldura squircle estilo avatar fintech: gradiente de marca +
                aro sutil, o recorte esconde o corte reto do busto */}
            <div className="relative aspect-square w-[270px] overflow-hidden rounded-[38%] border border-questly-green/25 bg-gradient-to-b from-questly-green/25 via-questly-green/8 to-transparent shadow-2xl ring-1 ring-inset ring-white/15 sm:w-[360px] dark:ring-white/10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[38%] bg-[radial-gradient(circle_at_50%_30%,var(--questly-green-light),transparent_65%)] opacity-70"
              />
              <Image
                src="/mascote.png"
                alt="Mascote da Expectrum, uma capivara de terno verde"
                fill
                sizes="(max-width: 640px) 270px, 360px"
                className="scale-[1.06] object-cover object-top"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** Mockup do painel da trilha usado no hero, com barras animadas. Mostra o
 *  que a plataforma de fato entrega hoje — cobertura e acerto por assunto —
 *  em vez do "plano do dia" que ela deixou de montar. */
function HeroPreview() {
  const reduzir = useReducedMotion();
  const barras = [
    { nome: "Leis de Newton", pct: 82, cor: "bg-questly-green", tag: "24 questões · 82%" },
    { nome: "Trabalho e energia", pct: 61, cor: "bg-questly-blue", tag: "18 questões · 61%" },
    { nome: "Momento linear", pct: 22, cor: "bg-questly-purple", tag: "não estudado" },
  ];
  return (
    <TiltCard intensidade={7} className="relative">
      <div className="surface rounded-[1.75rem] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-questly-green to-questly-green-deep text-sm font-bold text-white dark:text-[#0c1512]">
              E
            </span>
            <div>
              <p className="text-sm leading-tight font-semibold">Física I · sua trilha</p>
              <p className="text-xs text-muted-foreground">7 de 12 assuntos da ementa</p>
            </div>
          </div>
          <span className="tnum flex items-center gap-1 rounded-full bg-questly-orange/12 px-2.5 py-1 text-xs font-semibold text-questly-orange-dark dark:text-questly-orange">
            <Flame className="size-3.5" />
            12 dias
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {barras.map((d) => (
            <div key={d.nome}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{d.nome}</span>
                <span className="text-muted-foreground">{d.tag}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full rounded-full ${d.cor}`}
                  initial={reduzir ? undefined : { width: 0 }}
                  whileInView={reduzir ? undefined : { width: `${d.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                  style={reduzir ? { width: `${d.pct}%` } : undefined}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-questly-orange/25 bg-questly-orange/8 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-questly-orange-dark dark:text-questly-orange">
              <Swords className="size-3.5" /> Questões feitas
            </div>
            <p className="tnum mt-1.5 text-2xl font-semibold">342</p>
            <p className="text-[11px] text-muted-foreground">nesta disciplina</p>
          </div>
          <div className="rounded-2xl border border-questly-green/25 bg-questly-green/8 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-questly-green-dark dark:text-questly-green">
              <LineChart className="size-3.5" /> Aproveitamento
            </div>
            <p className="tnum mt-1.5 text-2xl font-semibold">74%</p>
            <p className="text-[11px] text-muted-foreground">acertos até aqui</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-questly-green px-4 py-3 text-white dark:text-[#0c1512]">
          <div className="flex items-center gap-2">
            <Target className="size-4" />
            <span className="text-sm font-semibold">Montar lista · 18 questões</span>
          </div>
          <span className="tnum text-sm font-semibold">+95 XP</span>
        </div>
      </div>
    </TiltCard>
  );
}

/** Visualização da trilha na seção Método: a ementa de uma disciplina, assunto
 *  por assunto, com o que já foi estudado e o aproveitamento em cada um. É o
 *  que substituiu a grade "sua semana dividida por peso" — a plataforma não
 *  divide mais a semana de ninguém. */
function PesoVisual() {
  const assuntos = [
    { nome: "Limites e continuidade", cor: "bg-questly-green", cobertura: 100, acerto: "88%" },
    { nome: "Derivadas", cor: "bg-questly-green", cobertura: 100, acerto: "74%" },
    { nome: "Aplicações da derivada", cor: "bg-questly-blue", cobertura: 60, acerto: "52%" },
    { nome: "Integral definida", cor: "bg-questly-purple", cobertura: 20, acerto: "—" },
    { nome: "Técnicas de integração", cor: "bg-muted-foreground/30", cobertura: 0, acerto: "—" },
  ];
  return (
    <div className="surface rounded-3xl p-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-5 text-questly-green" />
        <h3 className="font-semibold tracking-tight">A ementa inteira, assunto por assunto</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        O que você já cobriu de cada tópico e quanto acertou nele. Nenhum número aqui é previsão —
        é o registro do que você respondeu.
      </p>

      <div className="mt-5 space-y-3.5">
        {assuntos.map((a) => (
          <div key={a.nome}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.cor}`} />
                <span className="truncate text-sm font-medium">{a.nome}</span>
              </div>
              <span className="tnum shrink-0 text-xs text-muted-foreground">{a.acerto}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${a.cor}`} style={{ width: `${a.cobertura}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Barra = quanto da cobertura do tópico você já fez · número = seu acerto nele.
      </p>
    </div>
  );
}
