import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyHojeISO } from "@/lib/questly/shared";

// Soma o tempo de foco de HOJE (segundos), pra semear o provider no
// (protected)/layout e pra home mostrar "tempo estudado hoje". Tolerante à
// migração ausente: qualquer erro (incl. 42P01 relation-not-exist) vira 0.
export async function carregarFocoHojeSeg(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const hoje = questlyHojeISO();
  const { data, error } = await supabase
    .from("sessoes_foco")
    .select("segundos")
    .eq("user_id", userId)
    .eq("data", hoje);
  if (error || !data) return 0;
  return data.reduce((acc, l) => acc + (l.segundos as number), 0);
}
