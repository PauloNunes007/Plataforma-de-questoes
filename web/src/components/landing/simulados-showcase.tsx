"use client";

// Seção "Simulados + Banco de questões" da landing. É a prova concreta do que
// a plataforma entrega hoje (não promessa de roadmap): prova cronometrada com
// questões reais da universidade do aluno e um banco catalogado por tópico.
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpenCheck,
  CircleCheck,
  CircleDot,
  Highlighter,
  ListChecks,
  Sigma,
  Star,
  Timer,
} from "lucide-react";
import { arredondarPraBaixo, type StatsBanco } from "@/lib/landing/stats";

const ETAPAS = [
  {
    icon: ListChecks,
    titulo: "Você escolhe o escopo",
    desc: "Matérias, tópicos que caem, quantas questões e quanto tempo tem — 1h, 2h ou 3h.",
  },
  {
    icon: Timer,
    titulo: "O relógio corre de verdade",
    desc: "Questões sorteadas de anos diferentes, cronômetro que não pausa e continua de onde parou se você atualizar a página.",
  },
  {
    icon: BookOpenCheck,
    titulo: "Boletim e revisão no fim",
    desc: "Nota, acertos e tempo gasto — e depois a revisão questão a questão, com a resolução ao lado do que você marcou.",
  },
];

const BANCO = [
  { icon: Sigma, texto: "Fórmulas renderizadas de verdade (LaTeX), não imagem borrada de PDF" },
  { icon: CircleDot, texto: "Figuras recortadas da prova original — o mesmo desenho que você viu na folha" },
  { icon: Highlighter, texto: "Resolução passo a passo em toda questão, não só o gabarito" },
  { icon: Star, texto: "Favorite, anote a sua própria solução e volte nela quando quiser" },
];

export function SimuladosShowcase({ stats }: { stats: StatsBanco }) {
  const reduzir = useReducedMotion();

  return (
    <section id="simulados" className="relative scroll-mt-16 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Simule a prova antes da prova
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Nada mede seu preparo como sentar duas horas com questões que já caíram na sua
            universidade. É o recurso que mais muda nota na reta final — e ele está aqui, montado
            por você em três toques.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {ETAPAS.map((e, i) => {
            const Icon = e.icon;
            return (
              <motion.div
                key={e.titulo}
                initial={reduzir ? undefined : { opacity: 0, y: 18 }}
                whileInView={reduzir ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="surface relative overflow-hidden rounded-2xl p-6"
              >
                <span className="tnum absolute top-5 right-5 text-[42px] leading-none font-semibold text-foreground/[0.045]">
                  {i + 1}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-questly-blue/10">
                  <Icon className="size-5 text-questly-blue" strokeWidth={1.9} />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight">{e.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {e.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* banco de questões */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface rounded-3xl p-7 sm:p-8">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Um banco de questões que dá gosto de estudar
            </h3>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground text-pretty">
              São {arredondarPraBaixo(stats.total)} questões catalogadas por disciplina, tópico e
              dificuldade — de provas antigas e de listas — cada uma no seu lugar exato da ementa.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {BANCO.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.texto} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-questly-green/12">
                      <Icon className="size-3.5 text-questly-green" strokeWidth={2} />
                    </span>
                    <span className="text-[13.5px] leading-snug text-muted-foreground text-pretty">
                      {b.texto}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <BoletimMock />
        </div>
      </div>
    </section>
  );
}

/** Mock do boletim de um simulado — mostra o formato do resultado sem
 *  inventar depoimento nem print de aluno real. */
function BoletimMock() {
  const linhas = [
    { nome: "Cinemática em Duas Dimensões", acertos: 6, total: 7 },
    { nome: "Dinâmica do Movimento Retilíneo", acertos: 4, total: 6 },
    { nome: "Impulso e Momento Linear", acertos: 2, total: 5 },
    { nome: "Energia e Trabalho", acertos: 4, total: 4 },
  ];
  return (
    <div className="surface flex flex-col rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold">Boletim do simulado</p>
          <p className="text-xs text-muted-foreground">20 questões · 2h00 · 4 tópicos</p>
        </div>
        <div className="text-right">
          <p className="tnum text-3xl leading-none font-semibold text-questly-green-dark dark:text-questly-green">
            8,0
          </p>
          <p className="text-[10.5px] text-muted-foreground">sua nota</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {linhas.map((l) => {
          const pct = Math.round((l.acertos / l.total) * 100);
          const fraco = pct < 60;
          return (
            <div key={l.nome}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium">{l.nome}</span>
                <span className="tnum shrink-0 text-muted-foreground">
                  {l.acertos}/{l.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${fraco ? "bg-questly-red" : "bg-questly-green"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-questly-orange/[0.08] p-3.5">
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-questly-orange" strokeWidth={2} />
        <p className="text-[12px] leading-snug text-muted-foreground">
          <b className="font-semibold text-foreground">Você vê onde perdeu ponto</b> e revisa questão
          a questão: o que marcou, o gabarito e a resolução, lado a lado.
        </p>
      </div>
    </div>
  );
}
