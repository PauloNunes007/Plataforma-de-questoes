import Link from "next/link";
import type { MissionCardData } from "@/lib/questly/dashboard-data";

type MissionBannerProps = {
  missions: MissionCardData[];
  semMissaoHoje: boolean;
  motivoSemMissao?: string;
};

export function MissionBanner({ missions, semMissaoHoje, motivoSemMissao }: MissionBannerProps) {
  if (semMissaoHoje || missions.length === 0) {
    return (
      <div id="missoes-do-dia" className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
        <p className="mb-1 font-heading text-base font-semibold">💤 Sem missão hoje</p>
        <p className="text-sm font-semibold text-muted-foreground">
          {motivoSemMissao || "Não foi possível gerar sua missão agora. Tente recarregar a página."}
        </p>
      </div>
    );
  }

  return (
    <div id="missoes-do-dia" className="flex flex-col gap-4">
      {missions.map((missao) => {
        const concluida = missao.concluida;
        const kicker = missao.mestre ? "🏅 Missão de Mestre" : concluida ? "⭐ Cumprida" : "🎯 Missão do dia";
        const titulo = missao.subjects?.nome || "Missão do dia";
        const desc = missao.mestre
          ? "Você já domina essa disciplina — mantenha a coroa e leve XP em 1.5x."
          : concluida
            ? "Cumprida! Quer mais uma rodada dessa disciplina? XP extra pra acelerar a campanha."
            : "Gerada com base no seu progresso e nas provas mais próximas.";
        const tempo = missao.tempo_previsto_min ? `~${missao.tempo_previsto_min} min` : "calculando...";
        const botaoTexto = concluida ? "Praticar mais" : "Começar missão";

        return (
          <div
            key={missao.id}
            className={`rounded-2xl p-6 text-white shadow-[0_4px_0_var(--questly-green-deep)] ${
              missao.mestre
                ? "bg-gradient-to-br from-questly-gold to-questly-gold-dark shadow-[0_4px_0_#B07C00]"
                : "bg-gradient-to-br from-questly-green to-questly-green-deep"
            }`}
          >
            <span className="mb-3 inline-block rounded-full bg-white/20 px-3.5 py-1.5 font-heading text-xs font-semibold uppercase tracking-wider">
              {kicker}
            </span>
            <h3 className="mb-1 font-heading text-xl font-semibold">{titulo}</h3>
            <p className="mb-5 text-sm font-semibold text-white/85">{desc}</p>
            <div className="mb-5 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-bold">
                📝 {missao.qtd_questoes ?? "-"} questões
              </span>
              <span className="rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-bold">
                ⏱️ {tempo}
              </span>
              <span className="rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-bold">
                ⚡ {missao.xp_recompensa || 0} XP
              </span>
            </div>
            <Link
              href={`/questao?missao=${missao.id}`}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-heading text-sm font-semibold text-questly-green-dark transition-transform active:translate-y-0.5"
            >
              {botaoTexto}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
