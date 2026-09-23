import type { SupabaseClient } from "@supabase/supabase-js";

import { ehPro } from "@/lib/plano/plano";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { SIMULADO_FREE_LIMITE_SEMANA } from "./constantes";

/**
 * Gate do plano, AUTORITATIVO no servidor: free monta um simulado por semana
 * (janela = semana da liga), Pro é ilimitado. Vale igual pro montador, pra
 * prova antiga oficial e pra prova prevista — as três consomem uma prova da
 * semana, porque as três são uma prova cronometrada inteira.
 *
 * Mora aqui, e não dentro de `actions.ts`, porque num arquivo `"use server"`
 * toda função exportada vira endpoint: a alternativa seria duplicar a regra
 * em `lib/banca/actions.ts`, e uma trava de plano duplicada é uma trava de
 * plano que vai divergir.
 */
export async function dentroDoLimiteSemanal(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", userId)
    .maybeSingle();
  if (ehPro(perfil)) return true;

  const segunda = questlySegundaDaSemana(new Date());
  const { count } = await supabase
    .from("simulados_aluno")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("criado_em", segunda);
  return (count ?? 0) < SIMULADO_FREE_LIMITE_SEMANA;
}
