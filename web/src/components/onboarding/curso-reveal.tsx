"use client";

// Reação imediata ao curso digitado no passo 1 do onboarding: assim que o texto
// casa com uma identidade conhecida (lib/cursos/registro), aparece um cartão
// temático confirmando o curso — o aluno sente o app "respondendo" a ele.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cursoReconhecido, type CursoIdentidade } from "@/lib/cursos/registro";
import { CursoIcone } from "@/components/cursos/curso-icone";

export function CursoReveal({ identidade, temTexto }: { identidade: CursoIdentidade; temTexto: boolean }) {
  const reduzir = useReducedMotion();
  const reconhecido = cursoReconhecido(identidade);

  return (
    <AnimatePresence mode="wait">
      {reconhecido ? (
        <motion.div
          key={identidade.id}
          initial={reduzir ? false : { opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 flex items-center gap-3 rounded-2xl border p-3.5"
          style={{ borderColor: `${identidade.corA}66`, background: `linear-gradient(100deg, ${identidade.corA}14, transparent 75%)` }}
          aria-live="polite"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-inset ring-white/20"
            style={{ background: `radial-gradient(circle at 50% 35%, ${identidade.corA}, ${identidade.corB})` }}
          >
            <CursoIcone icone={identidade.icone} size={24} strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Check size={14} strokeWidth={3} style={{ color: identidade.corB }} className="shrink-0" />
              <span className="truncate font-heading text-[15px] font-semibold leading-tight">
                {identidade.nome}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{identidade.tagline}</p>
          </div>
        </motion.div>
      ) : (
        temTexto && (
          <motion.p
            key="generico"
            initial={reduzir ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-xs font-medium text-muted-foreground"
          >
            Vamos tratar como <b className="font-semibold text-foreground">Ciências Exatas</b> — dá pra
            refinar tudo depois.
          </motion.p>
        )
      )}
    </AnimatePresence>
  );
}
