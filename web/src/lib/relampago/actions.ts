"use server";

import { createClient } from "@/lib/supabase/server";
import { montarRodadaRelampago } from "@/lib/relampago/montar";

/** Monta a Rodada Relâmpago do aluno logado. Nada vem do cliente: a escolha
 *  das questões é toda do servidor, pelos dados do próprio aluno. */
export async function rodadaRelampagoAction(): Promise<{
  missaoId: string | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null, error: "Sessão expirada." };

  const { missaoId } = await montarRodadaRelampago(supabase, user.id);
  if (!missaoId) return { missaoId: null, error: "Não deu pra montar a rodada agora." };
  return { missaoId };
}
