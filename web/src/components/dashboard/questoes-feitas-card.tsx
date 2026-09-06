import { CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { Insignia } from "@/components/insignias/insignia";
import type { HeroDados } from "@/lib/dashboard/hero-data";

// Card "Questões feitas" — donut de acertos/erros da vida toda (releitura do
// print). Server component: SVG estático, sem estado. Dados owner-only
// (question_attempts do próprio aluno), já somados em hero-data.
export function QuestoesFeitasCard({ hero }: { hero: HeroDados }) {
  const { acertos, erros, totalQuestoes, pctAcerto } = hero;
  const pctErro = totalQuestoes > 0 ? 100 - pctAcerto : 0;

  const R = 52;
  const C = 2 * Math.PI * R;
  const dashAcerto = (pctAcerto / 100) * C;

  return (
    <div className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList size={17} strokeWidth={1.9} className="text-questly-green" />
        <h3 className="font-heading text-[15px] font-semibold tracking-tight">Questões feitas</h3>
      </div>

      {totalQuestoes === 0 ? (
        <div className="flex flex-col items-center gap-2.5 py-5 text-center">
          <Insignia nome="alvo" tom="esmeralda" size={46} apagada />
          <p className="max-w-[34ch] text-sm text-muted-foreground">
            Você ainda não respondeu questões. Cumpra uma missão pra começar a preencher isto.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div className="relative h-[132px] w-[132px] shrink-0">
            <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
              <circle cx="66" cy="66" r={R} fill="none" stroke="var(--questly-red)" strokeWidth="14" />
              <circle
                cx="66"
                cy="66"
                r={R}
                fill="none"
                stroke="var(--questly-green)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${dashAcerto} ${C - dashAcerto}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="tnum font-heading text-2xl font-bold leading-none">
                {totalQuestoes.toLocaleString("pt-BR")}
              </span>
              <span className="mt-1 max-w-[70px] text-[10px] leading-tight text-muted-foreground">
                questões respondidas
              </span>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <LinhaLegenda
              icone={<CheckCircle2 size={15} className="text-questly-green" strokeWidth={2.2} />}
              rotulo="Acertos"
              valor={acertos}
              pct={pctAcerto}
              corPct="bg-questly-green-light text-questly-green-dark"
            />
            <LinhaLegenda
              icone={<XCircle size={15} className="text-questly-red" strokeWidth={2.2} />}
              rotulo="Erros"
              valor={erros}
              pct={pctErro}
              corPct="bg-questly-red-light text-questly-red-dark"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LinhaLegenda({
  icone,
  rotulo,
  valor,
  pct,
  corPct,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: number;
  pct: number;
  corPct: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icone}
      <div className="min-w-0 flex-1">
        <span className="block text-[12px] text-muted-foreground">{rotulo}</span>
        <span className="tnum text-[17px] font-bold leading-tight">{valor.toLocaleString("pt-BR")}</span>
      </div>
      <span className={`tnum shrink-0 rounded-md px-2 py-0.5 text-[12px] font-bold ${corPct}`}>{pct}%</span>
    </div>
  );
}
