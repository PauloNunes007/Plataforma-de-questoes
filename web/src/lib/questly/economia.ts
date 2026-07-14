import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyGarantirSemanaLiga } from "@/lib/questly/liga";

// Economia de gamificação — os writes de XP/liga/streak em `profiles`.
// Extraído de lib/questao/actions.ts pra ser reutilizado pela Arena de
// Xadrez (lib/xadrez/actions.ts) SEM virar Server Action: este arquivo não
// tem "use server" de propósito — exportar essas funções de um arquivo
// "use server" as tornaria endpoints invocáveis direto do browser.
//
// As colunas tocadas aqui são protegidas pelo trigger
// questly_proteger_colunas_profile (supabase_seguranca_hardening.sql):
// o `supabase` recebido DEVE ser o cliente admin (createAdminClient), e o
// caller DEVE ter validado a sessão/autorização antes.

export async function atualizarXpELiga(
  supabase: SupabaseClient,
  userId: string,
  acertos: number,
  erros: number,
  xpGanho: number,
) {
  const estado = await questlyGarantirSemanaLiga(supabase, { id: userId });

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_total, questoes_total")
    .eq("id", userId)
    .single();
  const novoXpTotal = (profile?.xp_total || 0) + xpGanho;
  const novoXpSemana = (estado?.xp_semana || 0) + xpGanho;
  const novasQuestoesSemana = (estado?.questoes_semana || 0) + (acertos + erros);
  const novasQuestoesTotal = (profile?.questoes_total || 0) + (acertos + erros);

  await supabase
    .from("profiles")
    .update({
      xp_total: novoXpTotal,
      xp_semana: novoXpSemana,
      questoes_semana: novasQuestoesSemana,
      questoes_total: novasQuestoesTotal,
    })
    .eq("id", userId);
}

export async function atualizarStreakEDailyLog(supabase: SupabaseClient, userId: string) {
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: logHoje } = await supabase
    .from("daily_logs")
    .select("data")
    .eq("user_id", userId)
    .eq("data", hoje)
    .maybeSingle();

  await supabase.from("daily_logs").upsert({ user_id: userId, data: hoje, estudou: true }, { onConflict: "user_id,data" });

  if (!logHoje) {
    const { data: profile } = await supabase.from("profiles").select("streak_atual").eq("id", userId).single();
    const novoStreak = (profile?.streak_atual || 0) + 1;
    await supabase.from("profiles").update({ streak_atual: novoStreak }).eq("id", userId);
  }
}
