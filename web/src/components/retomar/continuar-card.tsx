import Link from "next/link";
import { Play } from "lucide-react";
import type { RetomarInfo } from "@/lib/retomar/retomar-data";

// Card "Continuar de onde parou" (inspirado no "Continuar estudando" da print):
// retoma a missão em andamento com barra de progresso. Renderiza nada quando
// não há missão parcial. Server component — só um Link, sem estado.
export function ContinuarCard({ info }: { info: RetomarInfo }) {
  if (!info) return null;

  const rotulo = info.recap
    ? "Recap em andamento"
    : info.avulsa
      ? "Lista em andamento"
      : "Missão do dia em andamento";
  const titulo = info.subjectNome || (info.avulsa ? "Prática livre" : "Sua missão");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-questly-purple via-indigo-500 to-questly-blue p-5 text-white shadow-lg shadow-questly-purple/20 sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Play size={20} strokeWidth={2.2} fill="currentColor" className="translate-x-0.5" />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {rotulo}
            </span>
            <h3 className="truncate font-heading text-[17px] font-semibold leading-tight">
              {titulo}
            </h3>
            <p className="tnum mt-0.5 text-[12.5px] text-white/80">
              {info.respondidas} de {info.total} questões · {info.pct}% concluído
            </p>
          </div>
        </div>

        <Link
          href={`/questao?missao=${info.missaoId}`}
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-questly-purple shadow-sm transition-transform hover:brightness-105 active:scale-95"
        >
          <Play size={15} strokeWidth={2.5} fill="currentColor" />
          Continuar estudando
        </Link>
      </div>

      {/* Barra de progresso */}
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${Math.max(4, info.pct)}%` }}
        />
      </div>
    </div>
  );
}
