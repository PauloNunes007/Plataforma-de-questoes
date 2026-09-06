"use client";

// Seção de campanha da landing (foco de lançamento: acervo de Física da UFF).
// Editorial em lib/landing/campanha.ts, números em lib/landing/stats.ts —
// aqui só o desenho. Se CAMPANHA.ativa virar false, a landing não renderiza
// nada disto e o discurso volta ao geral.
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, CircleCheck, FileText, Landmark, Timer } from "lucide-react";
import { CAMPANHA } from "@/lib/landing/campanha";
import { arredondarPraBaixo, type StatsBanco } from "@/lib/landing/stats";
import { buttonVariants } from "@/components/ui/button";

/* Fita fina no topo da página. Não é modal, não é popup: uma linha que o
   aluno da UFF reconhece na primeira olhada e some do caminho se ele rolar. */
export function FitaCampanha() {
  if (!CAMPANHA.ativa) return null;
  return (
    <a
      href={`#${CAMPANHA.ancora}`}
      className="group relative z-50 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-questly-green-deep via-questly-green to-questly-green-deep px-4 py-2 text-center text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 dark:text-[#06140f]"
    >
      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/25">
        <Landmark className="size-3" strokeWidth={2.5} />
      </span>
      <span className="truncate">
        {CAMPANHA.fita} — direto das provas anteriores, tópico a tópico
      </span>
      <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

/* Selo compacto pro hero: prova social específica pro público-alvo, sem
   sequestrar a headline (a plataforma serve qualquer universitário). */
export function SeloCampanhaHero({ stats }: { stats: StatsBanco }) {
  if (!CAMPANHA.ativa) return null;
  return (
    <a
      href={`#${CAMPANHA.ancora}`}
      className="surface group mt-7 flex w-fit max-w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors hover:border-questly-green/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-questly-green/12 text-questly-green">
        <BadgeCheck className="size-4.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 text-[13px] leading-snug">
        <b className="font-semibold">É da {CAMPANHA.instituicao}?</b>{" "}
        <span className="text-muted-foreground">
          {arredondarPraBaixo(stats.instituicaoMateriaFoco)} questões de {CAMPANHA.materiaLabel} de
          provas anteriores esperando por você.
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

const PASSOS_UFF = [
  { n: "1", t: "Crie sua conta", d: "Leva menos de um minuto e é grátis." },
  { n: "2", t: `Digite “${CAMPANHA.instituicao}”`, d: "A gente reconhece e libera o acervo da sua universidade." },
  { n: "3", t: "Monte o simulado", d: "Escolha os tópicos que caem, ligue o cronômetro e faça." },
];

export function SecaoCampanha({ stats }: { stats: StatsBanco }) {
  const reduzir = useReducedMotion();
  if (!CAMPANHA.ativa) return null;

  const porMateria = new Map<string, { nome: string; questoes: number }[]>();
  for (const t of stats.topicosFoco) {
    const lista = porMateria.get(t.materia) ?? [];
    lista.push({ nome: t.nome, questoes: t.questoes });
    porMateria.set(t.materia, lista);
  }

  const numeros = [
    {
      valor: arredondarPraBaixo(stats.materiaFoco),
      label: `questões de ${CAMPANHA.materiaLabel}`,
      nota: "com resolução passo a passo",
    },
    {
      valor: arredondarPraBaixo(stats.instituicaoMateriaFoco),
      label: `de provas da ${CAMPANHA.instituicao}`,
      nota: "digitadas do original, não reescritas",
    },
    {
      valor: String(stats.topicosFoco.length || 24),
      label: "tópicos catalogados",
      nota: "da ementa inteira, em ordem",
    },
  ];

  return (
    <section
      id={CAMPANHA.ancora}
      className="relative scroll-mt-20 overflow-hidden border-y border-questly-green/20 bg-gradient-to-b from-questly-green/[0.07] via-background to-background py-20 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-questly-green/15 blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-questly-green px-3 py-1 text-xs font-semibold text-white dark:text-[#06140f]">
              <Landmark className="size-3.5" strokeWidth={2.5} />
              {CAMPANHA.selo}
            </span>

            <h2 className="mt-5 text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[2.6rem]">
              Aluno da {CAMPANHA.instituicao}: as questões de {CAMPANHA.materiaLabel} que caem na
              sua prova já estão aqui.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Reler o caderno não treina prova. O que separa quem passa de quem repete é ter feito
              as questões que o professor realmente cobra — e a gente já catalogou{" "}
              <strong className="font-semibold text-foreground">
                {arredondarPraBaixo(stats.instituicaoMateriaFoco)} questões de provas anteriores da{" "}
                {CAMPANHA.instituicaoLonga}
              </strong>
              , tópico por tópico, com resolução.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-3">
              {numeros.map((n, i) => (
                <motion.div
                  key={n.label}
                  initial={reduzir ? undefined : { opacity: 0, y: 14 }}
                  whileInView={reduzir ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className="surface rounded-2xl p-4"
                >
                  <dt className="tnum text-2xl font-semibold tracking-tight text-questly-green-dark sm:text-3xl dark:text-questly-green">
                    {n.valor}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-tight font-medium">{n.label}</dd>
                  <dd className="mt-1 text-[11.5px] leading-tight text-muted-foreground">{n.nota}</dd>
                </motion.div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className={`${buttonVariants({ size: "lg" })} h-12 px-6 text-[15px]`}
              >
                Montar meu simulado da {CAMPANHA.instituicao}
                <ArrowRight />
              </Link>
              <span className="text-sm text-muted-foreground">Grátis · sem cartão</span>
            </div>

            <ol className="mt-8 grid gap-3 sm:grid-cols-3">
              {PASSOS_UFF.map((p) => (
                <li key={p.n} className="flex gap-2.5">
                  <span className="tnum mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-[11px] font-bold text-questly-green-dark dark:text-questly-green">
                    {p.n}
                  </span>
                  <span className="text-[13px] leading-snug">
                    <b className="font-semibold">{p.t}</b>
                    <span className="block text-muted-foreground">{p.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* cobertura real da ementa */}
          <div className="surface rounded-3xl p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-questly-green/12 text-questly-green">
                <FileText className="size-4.5" strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">
                  O que já está no banco
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ementa de {CAMPANHA.materias.join(" e ")}, tópico a tópico
                </p>
              </div>
            </div>

            {stats.topicosFoco.length > 0 ? (
              <div className="mt-5 space-y-5">
                {[...porMateria.entries()].map(([materia, topicos]) => (
                  <div key={materia}>
                    <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <CircleCheck className="size-3.5 text-questly-green" strokeWidth={2.5} />
                      {materia}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topicos.map((t) => (
                        <span
                          key={t.nome}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11.5px] font-medium"
                        >
                          {t.nome}
                          <span className="tnum text-[10.5px] font-bold text-questly-green-dark dark:text-questly-green">
                            {t.questoes}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Ementa completa de {CAMPANHA.materias.join(" e ")} catalogada tópico a tópico.
              </p>
            )}

            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-questly-blue/25 bg-questly-blue/[0.06] p-3.5">
              <Timer className="mt-0.5 size-4 shrink-0 text-questly-blue" strokeWidth={2} />
              <p className="text-[12.5px] leading-snug text-muted-foreground">
                <b className="font-semibold text-foreground">Simulado cronometrado:</b> você escolhe
                os tópicos, a gente sorteia as questões de anos diferentes e liga o relógio. No fim,
                boletim com nota e revisão questão a questão.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
