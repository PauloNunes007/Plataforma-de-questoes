"use client";

// Selo de identidade do curso no topo do dashboard — o app "reage" ao curso
// exato do aluno (padrão fintech "Trust & Authority": credencial com acento
// próprio). Resolve o texto livre `profiles.curso` via lib/cursos/registro.
import { motion, useReducedMotion } from "framer-motion";
import { resolverCurso, cursoReconhecido } from "@/lib/cursos/registro";
import { CursoIcone } from "@/components/cursos/curso-icone";

export function CursoIdentidadeBadge({ curso }: { curso: string | null }) {
  const identidade = resolverCurso(curso);
  const reconhecido = cursoReconhecido(identidade);
  const reduzir = useReducedMotion();

  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-sm sm:w-auto sm:max-w-[360px]"
      style={
        reconhecido
          ? { borderColor: `${identidade.corA}55`, background: `linear-gradient(90deg, ${identidade.corA}12, transparent 70%)` }
          : undefined
      }
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-inset ring-white/20"
        style={{ background: `radial-gradient(circle at 50% 35%, ${identidade.corA}, ${identidade.corB})` }}
      >
        <CursoIcone icone={identidade.icone} size={22} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-heading text-[15px] font-semibold leading-tight">
            {identidade.nome}
          </span>
          {reconhecido && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: identidade.corA }}
            >
              Seu curso
            </span>
          )}
        </div>
        <p className="truncate text-xs font-medium text-muted-foreground">{identidade.tagline}</p>
      </div>
    </motion.div>
  );
}
