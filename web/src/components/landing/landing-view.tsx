"use client";

// Landing page pública da Questly (rota "/"). Estilo "fintech premium":
// superfícies de vidro, ritmo generoso, números tabulares, ícones Lucide
// (sem emoji estrutural). Mantém a paleta de marca do app. Dinâmica/
// responsiva ao usuário: cards com tilt 3D no ponteiro, mascote flutuante
// com parallax, barras do preview animadas — tudo gated por
// prefers-reduced-motion.
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
  Flame,
  Layers,
  LineChart,
  Microscope,
  RefreshCcw,
  Scale,
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
  { label: "Método", href: "#metodo" },
  { label: "Recursos", href: "#recursos" },
  { label: "Ciência", href: "#ciencia" },
  { label: "Preços", href: "#precos" },
];

const STATS = [
  { valor: "1", sufixo: "plano por dia", legenda: "montado pelo motor, não por você às 23h59" },
  { valor: "∞", sufixo: "provas", legenda: "equilibradas ao mesmo tempo, sem uma comer a outra" },
  { valor: "5", sufixo: "mecânicas", legenda: "de ciência da aprendizagem trabalhando por você" },
  { valor: "0", sufixo: "achismo", legenda: "cada questão recalibra o que vem depois" },
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
    titulo: "Acordou? Já tem plano.",
    desc: "Nada de encarar o caderno sem saber por onde começar. Todo dia a Questly monta sua missão — do tamanho certo pro tempo que você tem.",
  },
  {
    icon: Swords,
    cor: "text-questly-orange",
    titulo: "Cada prova vira um chefe",
    desc: "Data marcada, barra de preparo subindo. Você vê exatamente o quanto falta pra derrotar aquela P1 — calculado pelo que cai de verdade.",
  },
  {
    icon: Scale,
    cor: "text-questly-blue",
    titulo: "Nenhuma matéria fica pra trás",
    desc: "O motor divide sua semana por peso: a prova mais próxima e o assunto mais fraco ganham mais tempo, sem nenhuma disciplina sumir do mapa.",
  },
  {
    icon: RefreshCcw,
    cor: "text-questly-purple",
    titulo: "Revisa antes de você esquecer",
    desc: "A gente sabe a hora exata em que a memória começa a cair e traz o assunto de volta — antes de virar aquele branco na hora da prova.",
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
    titulo: "Do começo ao fim da ementa",
    desc: "Seguimos a ordem certa, sem pular etapa. Entrou no meio do semestre? Marca o que já sabe e a trilha avança contigo.",
  },
  {
    icon: LineChart,
    cor: "text-questly-red",
    titulo: "Sua nota, prevista com antecedência",
    desc: "Não é só o quanto você sabe hoje: mostramos como você vai chegar no dia D — e onde vai chegar fraco a tempo de corrigir.",
  },
  {
    icon: Trophy,
    cor: "text-questly-gold",
    titulo: "Constância que vira disputa",
    desc: "Do bronze ao diamante, com promoção e rebaixamento toda semana. Estudar sozinho, no silêncio, nunca mais.",
  },
  {
    icon: Flame,
    cor: "text-questly-orange",
    titulo: "Vício do bom",
    desc: "Cada questão vale XP pela dificuldade. Manter o fogo do streak aceso vira hábito — e hábito é o que passa de ano.",
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
    desc: "Revisar no exato momento em que a memória começa a cair fixa muito mais do que reler tudo de véspera.",
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
    desc: "Ao errar, você diz o motivo (conceito, cálculo, interpretação, chute) — e o plano dos próximos dias se ajusta a isso.",
  },
];

const PASSOS: { n: string; titulo: string; desc: string }[] = [
  {
    n: "01",
    titulo: "Você cadastra suas provas e metas",
    desc: "Cada matéria do semestre, a data da prova e a nota que você quer tirar. Pronto: seu trabalho acaba aqui.",
  },
  {
    n: "02",
    titulo: "A gente pesa cada disciplina",
    desc: "Urgência da prova, seus pontos fracos e a meta de nota entram na conta. Quanto mais perto e mais frágil, mais atenção ela recebe.",
  },
  {
    n: "03",
    titulo: "Sua semana se divide sozinha",
    desc: "Um escalonador por crédito — o mesmo truque que redes e sistemas usam pra repartir recursos — distribui os dias por peso. Sem monopólio, sem ninguém esquecido.",
  },
  {
    n: "04",
    titulo: "A missão do dia aparece pronta",
    desc: "Na ordem certa da ementa, com a revisão do que está em risco vindo antes do conteúdo novo. Do tamanho exato do tempo que você tem hoje.",
  },
  {
    n: "05",
    titulo: "Você enxerga a prova antes dela chegar",
    desc: "A projeção pro dia D mostra onde você vai chegar fraco — e os próximos dias já corrigem a rota. Fim das surpresas ruins.",
  },
];

type PlanoFeature = { texto: string; incluso: boolean };

const PLANO_GRATIS: PlanoFeature[] = [
  { texto: "Até 2 disciplinas ativas por vez", incluso: true },
  { texto: "Missão do dia (até 15 questões diárias)", incluso: true },
  { texto: "Boss por prova e trilha curricular", incluso: true },
  { texto: "Streak, XP e ligas semanais", incluso: true },
  { texto: "Grade semanal automática por peso", incluso: false },
  { texto: "Projeção pro dia da prova", incluso: false },
  { texto: "Repetição espaçada + maestria (BKT)", incluso: false },
  { texto: "Autópsia do erro e estatísticas avançadas", incluso: false },
];

const PLANO_PRO: PlanoFeature[] = [
  { texto: "Disciplinas e provas ilimitadas", incluso: true },
  { texto: "Missões diárias sem teto de questões", incluso: true },
  { texto: "Grade semanal automática, equilibrada por peso", incluso: true },
  { texto: "Projeção pro dia da prova: sua nota estimada no dia D", incluso: true },
  { texto: "Repetição espaçada + maestria (BKT) por tópico", incluso: true },
  { texto: "Autópsia do erro: descubra por que errou e corrija o padrão", incluso: true },
  { texto: "Prática livre ilimitada focada nos seus pontos fracos", incluso: true },
  { texto: "Estatísticas avançadas: comparativo, percentil e recordes", incluso: true },
];

/* ------------------------------------------------------------------ view */

export function LandingView() {
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {glows}

      {/* ---------------------------------------------------------- header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
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
          <div className="flex items-center gap-2">
            <BtnLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Entrar
            </BtnLink>
            <BtnLink href="/login" size="sm">
              Começar grátis
              <ArrowRight />
            </BtnLink>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.span
              initial={reduzir ? undefined : { opacity: 0, y: 10 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-questly-green/30 bg-questly-green/10 px-3 py-1 text-xs font-medium text-questly-green-dark dark:text-questly-green"
            >
              <Sparkles className="size-3.5" />
              O copiloto da sua aprovação
            </motion.span>

            <motion.h1
              initial={reduzir ? undefined : { opacity: 0, y: 16 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Estude o que importa.{" "}
              <span className="bg-gradient-to-br from-questly-green to-questly-green-deep bg-clip-text text-transparent">
                Passe em todas as provas.
              </span>
            </motion.h1>

            <motion.p
              initial={reduzir ? undefined : { opacity: 0, y: 16 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty"
            >
              A Questly transforma o caos de um semestre cheio de matérias numa{" "}
              <strong className="font-semibold text-foreground">missão por dia</strong>. O motor
              equilibra suas disciplinas por urgência, ponto fraco e meta de nota — pra você chegar
              preparado em <em className="font-medium text-foreground not-italic">todas</em> as
              provas, não só na que está batendo na porta.
            </motion.p>

            <motion.div
              initial={reduzir ? undefined : { opacity: 0, y: 16 }}
              animate={reduzir ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <BtnLink href="/login" size="lg" className="h-11 px-6 text-[15px]">
                Criar conta grátis
                <ArrowRight />
              </BtnLink>
              <BtnLink href="#metodo" size="lg" variant="outline" className="h-11 px-6 text-[15px]">
                Ver como funciona
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
          {STATS.map((s) => (
            <motion.div key={s.legenda} variants={item}>
              <dt className="flex items-baseline gap-1.5">
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

      {/* --------------------------------------------------------- método */}
      <section id="metodo" className="relative border-t border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Revelar className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Como a gente equilibra suas matérias pra você passar em todas
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              O erro mais comum do universitário é mergulhar na prova da semana e chegar cru nas
              outras. A Questly resolve isso na origem: trata sua semana como um recurso escasso e
              divide entre tudo que você precisa passar — com justiça matemática, não no chute.
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
      <section id="recursos" className="relative py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Revelar className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Uma plataforma inteira torcendo pela sua aprovação
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Cada recurso existe por um motivo pedagógico. Aqui não tem gamificação decorativa —
              tem coisa que faz você passar.
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
      <section id="ciencia" className="relative border-y border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <Revelar>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Não é achismo. É como o cérebro aprende de verdade.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-pretty">
                A Questly aplica quatro mecanismos que a ciência da aprendizagem já cansou de
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
      <section id="precos" className="relative py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Revelar className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Comece de graça. Destrave tudo por menos que um lanche.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              O plano grátis já te faz passar numa matéria. O Pro é pra quem quer o semestre inteiro
              sob controle — e dormir tranquilo na véspera da prova.
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
                <p className="mt-1 text-sm text-muted-foreground">
                  O suficiente pra sentir o método na pele.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="tnum text-4xl font-semibold tracking-tight">R$ 0</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <BtnLink href="/login" variant="outline" className="mt-6 h-11">
                  Criar conta grátis
                </BtnLink>
                <ul className="mt-7 space-y-3">
                  {PLANO_GRATIS.map((f) => (
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
                  <h3 className="text-lg font-semibold tracking-tight">Questly Pro</h3>
                  <TrendingUp className="size-5 text-questly-green" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  O motor completo, sem freios, pro semestre inteiro.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-lg font-medium text-muted-foreground">R$</span>
                  <span className="tnum text-4xl font-semibold tracking-tight">15</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menos de R$ 0,50 por dia pra não repetir uma matéria.
                </p>
                <p className="mt-1 text-xs font-medium text-questly-green">
                  ou R$ 10/mês no semestral — R$ 60 pelos 6 meses.
                </p>
                <BtnLink href="/login" className="mt-5 h-11">
                  Quero o Pro
                  <ArrowRight />
                </BtnLink>
                <ul className="mt-7 space-y-3">
                  {PLANO_PRO.map((f) => (
                    <FeatureLinha key={f.texto} {...f} />
                  ))}
                </ul>
                <p className="mt-6 text-xs text-muted-foreground">
                  Tudo do grátis, sem os limites — e o que de fato vira o jogo na reta final.
                </p>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- final CTA */}
      <section className="relative px-5 pb-24">
        <Revelar className="mx-auto max-w-4xl">
          <div className="surface-brand relative overflow-hidden rounded-[2rem] px-8 py-14 text-center sm:px-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-questly-green/20 blur-[90px]"
            />
            <div className="relative flex flex-col items-center">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Chega de estudar no escuro.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground text-pretty">
                Cadastre suas provas e deixe a Questly montar o plano. Sua primeira missão está te
                esperando do outro lado.
              </p>
              <BtnLink href="/login" size="lg" className="mt-8 h-12 px-7 text-[15px]">
                Começar agora — é grátis
                <ArrowRight />
              </BtnLink>
            </div>
          </div>
        </Revelar>
      </section>

      {/* --------------------------------------------------------- footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Questly · Estude o que importa.
          </p>
          <div className="flex items-center gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------- subcomponentes */

function FeatureLinha({ texto, incluso }: PlanoFeature) {
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

/** Faixa dedicada ao mascote (capivara de terno) — no espírito da
 *  questly.com.br. Imagem real, com glow atrás, flutuação suave e leve
 *  parallax que segue o ponteiro. */
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
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
        <Revelar>
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Estude jogando.{" "}
            <span className="bg-gradient-to-br from-questly-green to-questly-green-deep bg-clip-text text-transparent">
              Jogue estudando.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Enquanto você foca numa questão de cada vez, a Questly cuida do plano inteiro nos
            bastidores. É pra isso que a capivara mais estudiosa do campus está aqui: pra você chegar
            na prova tranquilo — do jeitinho capivara.
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
                alt="Mascote da Questly, uma capivara de terno verde"
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

/** Mockup do painel "missão de hoje" usado no hero, com barras animadas. */
function HeroPreview() {
  const reduzir = useReducedMotion();
  const barras = [
    { nome: "Cálculo II", pct: 46, cor: "bg-questly-green", tag: "prova em 6d" },
    { nome: "Física I", pct: 32, cor: "bg-questly-blue", tag: "ponto fraco" },
    { nome: "Álgebra Linear", pct: 22, cor: "bg-questly-purple", tag: "meta 9,0" },
  ];
  return (
    <TiltCard intensidade={7} className="relative">
      <div className="surface rounded-[1.75rem] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-questly-green to-questly-green-deep text-sm font-bold text-white dark:text-[#0c1512]">
              Q
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Missão de hoje</p>
              <p className="text-xs text-muted-foreground">3 disciplinas equilibradas</p>
            </div>
          </div>
          <span className="tnum rounded-full bg-questly-orange/12 px-2.5 py-1 text-xs font-semibold text-questly-orange-dark dark:text-questly-orange">
            🔥 12 dias
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
              <Swords className="size-3.5" /> Boss: P1 de Cálculo
            </div>
            <p className="tnum mt-1.5 text-2xl font-semibold">68%</p>
            <p className="text-[11px] text-muted-foreground">preparo atual</p>
          </div>
          <div className="rounded-2xl border border-questly-green/25 bg-questly-green/8 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-questly-green-dark dark:text-questly-green">
              <LineChart className="size-3.5" /> No dia da prova
            </div>
            <p className="tnum mt-1.5 text-2xl font-semibold">~81%</p>
            <p className="text-[11px] text-muted-foreground">nota projetada</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-questly-green px-4 py-3 text-white dark:text-[#0c1512]">
          <div className="flex items-center gap-2">
            <Target className="size-4" />
            <span className="text-sm font-semibold">Começar missão · 18 questões</span>
          </div>
          <span className="tnum text-sm font-semibold">+95 XP</span>
        </div>
      </div>
    </TiltCard>
  );
}

/** Visualização didática do escalonamento por peso, na seção Método. */
function PesoVisual() {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const grade = [
    { nome: "Cálculo II", cor: "bg-questly-green", dias: [0, 1, 2, 4, 5], peso: "urgente" },
    { nome: "Física I", cor: "bg-questly-blue", dias: [0, 2, 4], peso: "ponto fraco" },
    { nome: "Álgebra", cor: "bg-questly-purple", dias: [1, 3, 5], peso: "meta alta" },
    { nome: "Química", cor: "bg-questly-orange", dias: [3, 6], peso: "prova longe" },
  ];
  return (
    <div className="surface rounded-3xl p-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-5 text-questly-green" />
        <h3 className="font-semibold tracking-tight">Sua semana, dividida por peso</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Quanto mais urgente e mais fraca a disciplina, mais dias ela ocupa — sem nunca sumir do seu
        radar.
      </p>

      <div className="mt-5 space-y-3">
        {grade.map((g) => (
          <div key={g.nome}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${g.cor}`} />
                <span className="text-sm font-medium">{g.nome}</span>
              </div>
              <span className="text-xs text-muted-foreground">{g.peso}</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {dias.map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded-md ${g.dias.includes(i) ? g.cor : "bg-muted"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {dias.map((d) => (
          <span key={d} className="text-center text-[10px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
