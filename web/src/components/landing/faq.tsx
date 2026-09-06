"use client";

// FAQ da landing. Além de responder o que trava a decisão, é o lugar honesto
// pra dizer o que a plataforma NÃO é — o mesmo padrão de franqueza do resto do
// app (chance de aprovação e projeção são heurísticas, não promessa).
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CAMPANHA } from "@/lib/landing/campanha";

const PERGUNTAS: { p: string; r: string }[] = [
  {
    p: `Sou da ${CAMPANHA.instituicao}. As questões são das provas da minha universidade mesmo?`,
    r: `São. Cada questão guarda de qual instituição e de que ano ela veio, digitada do original — enunciado, alternativas e as figuras recortadas da própria prova. Ao dizer que você é da ${CAMPANHA.instituicao} no cadastro, a gente confirma na hora quantas questões temos da sua universidade e libera o montador de simulados com elas.`,
  },
  {
    p: "E se a minha universidade não estiver no banco?",
    r: "A plataforma funciona igual: o plano diário, a trilha da ementa, a revisão espaçada e as questões do banco geral valem pra qualquer curso. O que fica indisponível é só o simulado com provas antigas da sua instituição — e a gente diz isso na sua cara, sem enrolar, em vez de fingir que tem.",
  },
  {
    p: "Quanto tempo por dia eu preciso?",
    r: "O que você tiver. Você diz quantos minutos tem e a missão do dia é montada exatamente desse tamanho — 20 minutos no corredor entre aulas ou 3 horas num sábado. O motor divide esse tempo entre as suas disciplinas por urgência da prova e ponto fraco, então nenhum dia é desperdiçado na matéria errada.",
  },
  {
    p: "Preciso pagar pra usar?",
    r: "Não. O plano grátis dá conta de uma matéria: missão do dia, boss por prova, trilha da ementa, streak e ligas. O Pro tira os limites (disciplinas ilimitadas, missões sem teto, simulados ilimitados, projeção pro dia da prova e repetição espaçada completa) por R$ 15/mês, ou R$ 10/mês no semestral.",
  },
  {
    p: "Essa “nota projetada” é confiança ou chute?",
    r: "É uma estimativa, e a gente fala isso em toda tela onde ela aparece. O modelo combina o quanto você domina cada tópico (separando sorte de domínio real) com o quanto disso você ainda vai lembrar no dia da prova. Serve pra apontar onde você vai chegar fraco a tempo de corrigir — não é uma promessa de nota, e nunca vamos vender como se fosse.",
  },
  {
    p: "Isso substitui a aula e o livro?",
    r: "Não, e não quer. A Questly é onde você pratica, revisa na hora certa e descobre o que ainda não sabe. Teoria você vê com seu professor e seu livro — aqui é o treino que transforma teoria em nota.",
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
