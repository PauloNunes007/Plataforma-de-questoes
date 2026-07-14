"use client";

// Selo de identidade do curso no topo do dashboard. Redesign 2026-07-14:
// virou um chip discreto estilo fintech — ícone com o gradiente do curso
// + kicker "Curso" + nome resolvido, sem a tagline nem o selo "Seu curso"
// (o usuário achou os textos de acompanhamento excessivos). A resolução
// do texto livre `profiles.curso` continua em lib/cursos/registro.
import { motion, useReducedMotion } from "framer-motion";
import { resolverCurso, cursoReconhecido } from "@/lib/cursos/registro";
import { CursoIcone } from "@/components/cursos/curso-icone";

export function CursoIdentidadeBadge({ curso }: { curso: string | null }) {
  const identidade = resolverCurso(curso);
  const reconhecido = cursoReconhecido(identidade);
  const reduzir = useReducedMotion();

  // Sem curso informado, não inventa chip — o header fica só com a saudação.
  if (!curso) return null;

  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex max-w-full items-center gap-2.5 self-start rounded-full border border-border bg-card py-1.5 pl-1.5 pr-4 shadow-sm sm:self-auto"
      style={reconhecido ? { borderColor: `${identidade.corA}40` } : undefined}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ring-1 ring-inset ring-white/20"
        style={{ background: `radial-gradient(circle at 50% 35%, ${identidade.corA}, ${identidade.corB})` }}
      >
        <CursoIcone icone={identidade.icone} size={16} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="kicker block text-[9.5px] leading-none">Curso</span>
        <span className="mt-0.5 block truncate text-[13px] font-semibold leading-tight">
          {reconhecido ? identidade.nome : curso}
        </span>
      </span>
    </motion.div>
  );
}
