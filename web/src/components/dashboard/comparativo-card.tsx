import { BarChart3 } from "lucide-react";
import type { ComparativoSemana } from "@/lib/questly/dashboard-data";

// "Comparativo" (print): percentil real do aluno vs. todos por XP da semana
// (dados.semana.comparativo — honesto, `profiles` é world-readable). Estado de
// incentivo quando ainda não pontuou nesta rodada.
export function ComparativoCard({ comparativo }: { comparativo: ComparativoSemana }) {
  const temDado = comparativo.percentil != null;

  return (
    <div className="surface relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-questly-gold/10 blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={17} strokeWidth={1.9} className="text-questly-gold" />
          <h3 className="font-heading text-[15px] font-semibold tracking-tight">Comparativo</h3>
        </div>

        {temDado ? (
          <div className="flex items-center gap-3">
            {/* louros estilizados */}
            <LaurelWreath>
              <span className="tnum font-heading text-3xl font-bold leading-none text-questly-gold">
                {comparativo.percentil}%
              </span>
            </LaurelWreath>
            <p className="flex-1 text-[13px] leading-snug text-muted-foreground">
              Você está entre os{" "}
              <b className="font-semibold text-foreground">{comparativo.percentil}%</b> que mais pontuaram esta
              semana entre {comparativo.totalAlunos.toLocaleString("pt-BR")} alunos.
            </p>
          </div>
        ) : (
          <p className="text-[13px] leading-snug text-muted-foreground">
            Pontue esta semana pra ver como você se compara com os outros alunos. Toda questão conta. 💪
          </p>
        )}
      </div>
    </div>
  );
}

function LaurelWreath({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 76 76" className="absolute inset-0 h-full w-full text-questly-gold">
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
          {/* ramo esquerdo */}
          <path d="M26 64 C14 54 12 34 22 16" />
          {/* ramo direito */}
          <path d="M50 64 C62 54 64 34 54 16" />
        </g>
        <g fill="currentColor" opacity="0.85">
          {[18, 28, 38, 48].map((y, i) => (
            <g key={`l-${y}`}>
              <ellipse cx={20 - i * 1.5 + (i % 2) * 2} cy={y} rx="4" ry="2.2" transform={`rotate(-40 ${20} ${y})`} />
            </g>
          ))}
          {[18, 28, 38, 48].map((y, i) => (
            <g key={`r-${y}`}>
              <ellipse cx={56 + i * 1.5 - (i % 2) * 2} cy={y} rx="4" ry="2.2" transform={`rotate(40 ${56} ${y})`} />
            </g>
          ))}
        </g>
      </svg>
      {children}
    </div>
  );
}
