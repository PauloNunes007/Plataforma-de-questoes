"use client";

// FAQ da landing. Além de responder o que trava a decisão, é o lugar honesto
// pra dizer o que a plataforma NÃO é — inclusive que ela não monta o seu dia
// (desde o repasse de 2026-09-16 não existe mais plano automático nenhum).
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PERGUNTAS } from "@/lib/landing/faq-dados";


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
