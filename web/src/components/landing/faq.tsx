"use client";

// FAQ da landing. Além de responder o que trava a decisão, é o lugar honesto
// pra dizer o que a plataforma NÃO é — inclusive que ela não monta o seu dia
// (desde o repasse de 2026-09-16 não existe mais plano automático nenhum).
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CAMPANHA } from "@/lib/landing/campanha";

const PERGUNTAS: { p: string; r: string }[] = [
  {
    p: "As questões são de provas antigas de verdade?",
    r: `São. Cada questão guarda de qual instituição e de que ano ela veio, digitada do original — enunciado, alternativas e as figuras recortadas da própria prova, não redesenhadas. O acervo de provas anteriores da ${CAMPANHA.instituicao} é o maior hoje, e no cadastro a gente confirma na hora quantas questões temos da sua universidade antes de liberar o montador de simulados com elas.`,
  },
  {
    p: "E se a minha universidade não estiver no banco?",
    r: "A plataforma funciona igual: a trilha da ementa, o banco de questões geral (com resolução passo a passo), as anotações e o ranking valem pra qualquer curso. O que fica indisponível é só o simulado com provas antigas da sua instituição — e a gente diz isso na sua cara, sem enrolar, em vez de fingir que tem.",
  },
  {
    p: "Quanto tempo por dia eu preciso?",
    r: "O que você tiver. Você monta a lista do tamanho que couber — 5 questões no corredor entre aulas ou 40 num sábado. A Expectrum não tem cota diária nem cobra presença: o que ela guarda é o que você já fez, pra você enxergar onde está.",
  },
  {
    p: "Preciso pagar pra usar?",
    r: "Não. O plano grátis tem o banco de questões inteiro com resolução, listas sem limite, disciplinas ilimitadas, a trilha da ementa, anotações, streak, ligas e um simulado cronometrado por semana. O Pro tira o limite de simulados e abre a autópsia do erro e as estatísticas avançadas, por R$ 15/mês ou R$ 10/mês no semestral.",
  },
  {
    p: "A Expectrum monta um cronograma pra mim?",
    r: "Não, e isso é decisão de produto, não falta. A gente já tentou: o motor empilhava quatro matérias diferentes no mesmo dia e virava uma lista que ninguém executa. Quem sabe o que caiu na aula de ontem e o que a prova de sexta cobra é você. A Expectrum te dá as questões, o mapa da ementa com o seu aproveitamento e o simulado — a ordem é sua. Se quiser planejar, o calendário é seu: sessão, meta de questões, tarefa e a data da prova, tudo marcado por você.",
  },
  {
    p: "Isso substitui a aula e o livro?",
    r: "Não, e não quer. A Expectrum é onde você pratica, revisa na hora certa e descobre o que ainda não sabe. Teoria você vê com seu professor e seu livro — aqui é o treino que transforma teoria em nota.",
  },
];

export function Faq() {
  const [aberta, setAberta] = useState<number | null>(0);
  const reduzir = useReducedMotion();

  return (
    <section id="faq" className="relative scroll-mt-16 border-t border-border/60 py-24">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Perguntas que todo mundo faz
        </h2>

        <div className="mt-12 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {PERGUNTAS.map((q, i) => {
            const ativa = aberta === i;
            return (
              <div key={q.p}>
                <button
                  type="button"
                  onClick={() => setAberta(ativa ? null : i)}
                  aria-expanded={ativa}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6"
                >
                  <span className="text-[15px] font-medium text-pretty">{q.p}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${ativa ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {ativa && (
                    <motion.div
                      initial={reduzir ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduzir ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground text-pretty sm:px-6">
                        {q.r}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
