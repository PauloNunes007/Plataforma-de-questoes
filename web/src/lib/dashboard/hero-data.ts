import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularDistintivos, type Distintivo } from "@/lib/ranking/badges";
import { QUESTLY_LIGAS, type Liga } from "@/lib/questly/liga";
import type { NomeInsignia, TomInsignia } from "@/components/insignias/insignia";

// Dados extras pro HERO da home (redesign inspirado nos prints): posição no
// ranking geral, nº de conquistas, e acertos/erros da vida toda pro donut
// "Questões feitas". Tudo honesto: posição/percentil vêm de `profiles`
// (world-readable) e acertos/erros de `question_attempts` do PRÓPRIO aluno
// (owner-only RLS — só some o próprio).
export type HeroDados = {
  posicaoGeral: number;
  totalAlunos: number;
  conquistas: number;
  conquistasLista: { insignia: NomeInsignia; tom: TomInsignia; nome: string }[];
  /** a estante inteira (acesos + apagados) — a visão Conquistas da home mostra
   *  também o que falta, com o requisito escrito em cada card. */
  distintivos: Distintivo[];
  /** ids que o aluno escolheu pro card público (null = resumo automático,
   *  ver distintivosParaCard em lib/ranking/badges.ts). */
  distintivosSelecionados: string[] | null;
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
    distintivos_selecionados?: string[] | null;
  } | null,
): Promise<HeroDados> {
  const meuXp = profile?.xp_total || 0;
  const ligaAtual = (profile?.liga as Liga) || QUESTLY_LIGAS[0];

  const [{ count: acima }, { count: total }, { count: acertos }, { count: erros }, { data: subjects }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).gt("xp_total", meuXp),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      // A coluna é `correta` (não `acertou`) — com o nome errado o count
      // voltava null e o donut de "Questões feitas" ficava zerado pra
      // todo mundo, inclusive pra quem já tinha centenas de tentativas.
      supabase
        .from("question_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("correta", true),
      supabase
        .from("question_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("correta", false),
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
    conquistasLista: conquistados.map((d) => ({ insignia: d.insignia, tom: d.tom, nome: d.nome })),
    distintivos,
    distintivosSelecionados: profile?.distintivos_selecionados ?? null,
    acertos: ac,
    erros: er,
    totalQuestoes: tot,
    pctAcerto: tot > 0 ? Math.round((ac / tot) * 100) : 0,
  };
}
