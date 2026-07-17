"use server";

// Treinar a rede lê question_attempts de TODOS os alunos (RLS dono-only)
// e escreve em ml_modelos (sem policy de escrita) — ambos exigem
// service_role, então a ação é restrita ao admin, com re-checagem
// server-side (Server Actions são endpoints chamáveis diretamente).

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { treinarESalvar, type MetricasModelo } from "./treinar";

export type ResultadoTreinoAction =
  | { ok: true; motivo: string; venceuBaseline: boolean; metricas: MetricasModelo | null; totalTentativas: number }
  | { ok: false; motivo: string };

export async function treinarRedeAction(): Promise<ResultadoTreinoAction> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return { ok: false, motivo: "Sem permissão." };

  try {
    const resultado = await treinarESalvar(createAdminClient());
    return {
      ok: true,
      motivo: resultado.motivo,
      venceuBaseline: resultado.venceuBaseline,
      metricas: resultado.metricas,
      totalTentativas: resultado.totalTentativas,
    };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "Falha inesperada no treino." };
  }
}
