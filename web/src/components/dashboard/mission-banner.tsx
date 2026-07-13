import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Moon,
  Target,
  Zap,
} from "lucide-react";
import type { MissionCardData } from "@/lib/questly/dashboard-data";

type MissionBannerProps = {
  missions: MissionCardData[];
  semMissaoHoje: boolean;
  motivoSemMissao?: string;
};

// Card de missão do dia — protagonista do dashboard no redesign 2026-07.
// Sai o gradiente verde chapado estilo Duolingo; entra uma superfície
// com borda-gradiente sutil (surface-brand / surface-gold pra Mestre) e
// UMA ação primária clara por card.
export function MissionBanner({ missions, semMissaoHoje, motivoSemMissao }: MissionBannerProps) {
  if (semMissaoHoje || missions.length === 0) {
    return (
      <div
        id="missoes-do-dia"
        className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center"
      >
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Moon size={18} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="mb-1 text-[15px] font-medium">Sem missão hoje</p>
        <p className="max-w-[360px] text-sm text-muted-foreground">
          {motivoSemMissao || "Não foi possível gerar sua missão agora. Tente recarregar a página."}
        </p>
      </div>
    );
  }

  return (
    <div id="missoes-do-dia" className="flex flex-col gap-4">
      {missions.map((missao) => {
        const concluida = missao.concluida;
        const mestre = missao.mestre;
        const titulo = missao.subjects?.nome || "Missão do dia";
        const tempo = missao.tempo_previsto_min ? `~${missao.tempo_previsto_min} min` : "—";

        return (
          <div
            key={missao.id}
            className={`${mestre ? "surface-gold" : concluida ? "surface" : "surface-brand"} rounded-2xl p-5 sm:p-6`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  mestre
                    ? "text-questly-gold"
                    : concluida
                      ? "text-questly-green"
                      : "text-questly-green"
                }`}
              >
                {mestre ? (
                  <>
                    <Crown size={13} strokeWidth={2} />
                    Missão de Mestre
                  </>
                ) : concluida ? (
                  <>
                    <CheckCircle2 size={13} strokeWidth={2} />
                    Missão cumprida
                  </>
                ) : (
                  <>
                    <Target size={13} strokeWidth={2} />
                    Missão de hoje
                  </>
                )}
              </span>
              {mestre && (
                <span className="rounded-full bg-questly-gold-light px-2.5 py-1 text-[11px] font-semibold text-questly-gold-dark">
                  XP em 1.5×
                </span>
              )}
            </div>

            <h3 className="mb-1 font-heading text-lg font-semibold tracking-tight">{titulo}</h3>
            <p className="mb-4 max-w-[440px] text-sm leading-relaxed text-muted-foreground">
              {mestre
                ? "Você já domina essa disciplina — mantenha a coroa e leve XP em 1.5×."
                : concluida
                  ? "Quer mais uma rodada? XP extra acelera a campanha."
                  : "Gerada a partir do seu progresso e das provas mais próximas."}
            </p>

            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} strokeWidth={1.75} />
                <span className="tnum">{missao.qtd_questoes ?? "–"}</span> questões
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.75} />
                <span className="tnum">{tempo}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap size={14} strokeWidth={1.75} />
                <span className="tnum">{missao.xp_recompensa || 0}</span> XP
              </span>
            </div>

            <Link
              href={`/questao?missao=${missao.id}`}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                concluida
                  ? "border border-border bg-transparent text-foreground hover:bg-muted"
                  : mestre
                    ? "bg-questly-gold text-white shadow-sm hover:brightness-105 dark:text-[#221c05]"
                    : "bg-questly-green text-white shadow-sm hover:brightness-105 dark:text-[#0c1512]"
              }`}
            >
              {concluida ? "Praticar mais" : "Começar missão"}
              <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
