import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularDistintivos } from "@/lib/ranking/badges";
import { QUESTLY_LIGAS, type Liga } from "@/lib/questly/liga";

// Dados extras pro HERO da home (redesign inspirado nos prints): posição no
// ranking geral, nº de conquistas, e acertos/erros da vida toda pro donut
// "Questões feitas". Tudo honesto: posição/percentil vêm de `profiles`
// (world-readable) e acertos/erros de `question_attempts` do PRÓPRIO aluno
// (owner-only RLS — só some o próprio).
export type HeroDados = {
  posicaoGeral: number;
  totalAlunos: number;
  conquistas: number;
  conquistasLista: { icone: string; nome: string }[];
  acertos: number;
  erros: number;
  totalQuestoes: number;
  pctAcerto: number;
};

export async function carregarHeroDashboard(
  supabase: SupabaseClient,
  user: { id: string },
  profile: {
    xp_total?: number | null;
    liga?: string | null;
    nivel?: number | null;
    streak_atual?: number | null;
  } | null,
): Promise<HeroDados> {
  const meuXp = profile?.xp_total || 0;
  const ligaAtual = (profile?.liga as Liga) || QUESTLY_LIGAS[0];

  const [{ count: acima }, { count: total }, { count: acertos }, { count: erros }, { data: subjects }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).gt("xp_total", meuXp),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("question_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("acertou", true),
      supabase
        .from("question_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("acertou", false),
      supabase.from("subjects").select("id").eq("user_id", user.id),
    ]);

  const ac = acertos || 0;
  const er = erros || 0;
  const tot = ac + er;

  const distintivos = calcularDistintivos({
    nivel: profile?.nivel || 1,
    streakAtual: profile?.streak_atual || 0,
    questoesTotal: tot,
    numDisciplinas: (subjects || []).length,
    melhorLiga: ligaAtual,
  });

  const conquistados = distintivos.filter((d) => d.conquistado);

  return {
    posicaoGeral: (acima || 0) + 1,
    totalAlunos: total || 1,
    conquistas: conquistados.length,
    conquistasLista: conquistados.map((d) => ({ icone: d.icone, nome: d.nome })),
    acertos: ac,
    erros: er,
    totalQuestoes: tot,
    pctAcerto: tot > 0 ? Math.round((ac / tot) * 100) : 0,
  };
}
