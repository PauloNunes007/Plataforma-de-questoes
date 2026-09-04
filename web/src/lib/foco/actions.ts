"use server";

import { createClient } from "@/lib/supabase/server";

// Grava uma sessão de foco concluída (o timer do header). Self-contained:
// não mexe em XP/liga/streak nem no motor de maestria — é só tempo de relógio
// (ver supabase_sessoes_foco.sql). O cliente manda a data LOCAL dele.
//
// Degrada com elegância se a migração ainda não foi rodada: um erro de
// "relation does not exist" (42P01) é engolido (retorna ok:false, totalSeg:0)
// pra que o timer continue funcionando na tela mesmo sem persistência — mesmo
// padrão de fallback de tentativas_total no registrarRespostaAction.
export async function registrarSessaoFocoAction(input: {
  objetivo: string | null;
  segundos: number;
  modo: "cronometro" | "timer";
  data: string;
}): Promise<{ ok: boolean; totalSeg: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const segundos = Math.max(0, Math.round(input.segundos));
  // Ignora sessões insignificantes (< 20s) — geralmente um "play/stop" sem querer.
  if (!user || segundos < 20) return { ok: false, totalSeg: 0 };

  const { error } = await supabase.from("sessoes_foco").insert({
    user_id: user.id,
    data: input.data,
    objetivo: input.objetivo?.trim() || null,
    segundos,
    modo: input.modo,
  });

  if (error) {
    if (error.code !== "42P01") console.error("Erro ao gravar sessão de foco:", error);
    return { ok: false, totalSeg: 0 };
  }

  const totalSeg = await somarFocoDoDia(supabase, user.id, input.data);
  return { ok: true, totalSeg };
}

async function somarFocoDoDia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: string,
): Promise<number> {
  const { data: linhas, error } = await supabase
    .from("sessoes_foco")
    .select("segundos")
    .eq("user_id", userId)
    .eq("data", data);
  if (error || !linhas) return 0;
  return linhas.reduce((acc, l) => acc + (l.segundos as number), 0);
}
