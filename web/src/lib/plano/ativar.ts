import { createAdminClient } from "@/lib/supabase/admin";

// Ativação do Pro — a lógica compartilhada entre a confirmação manual do admin
// (lib/admin/actions.ts) e o webhook do Mercado Pago
// (app/api/mercadopago/webhook/route.ts). Escreve em colunas protegidas de
// `profiles` (plano*), então roda SEMPRE via service_role (createAdminClient).
// É idempotente: reprocessar uma assinatura já ativa é no-op (o webhook do MP
// pode chegar mais de uma vez).

function adicionarMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + meses);
  return d;
}

export async function ativarAssinatura(
  assinaturaId: string,
  observacao?: string,
): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();

  const { data: ass, error } = await admin
    .from("assinaturas")
    .select("id, user_id, ciclo, forma, status")
    .eq("id", assinaturaId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!ass) return { error: "Assinatura não encontrada." };
  if (ass.status === "ativa") return { ok: true }; // idempotente

  const agora = new Date();
  // Ativar concede o período inteiro: mensal = 1 mês, semestral = 6 meses. A
  // fidelidade (compromisso de 6 meses) só existe no semestral recorrente.
  const meses = ass.ciclo === "semestral" ? 6 : 1;
  const expira = adicionarMeses(agora, meses);
  const fidelidade =
    ass.ciclo === "semestral" && ass.forma === "recorrente" ? adicionarMeses(agora, 6) : null;

  const { error: errProfile } = await admin
    .from("profiles")
    .update({
      plano: "pro",
      plano_ciclo: ass.ciclo,
      plano_desde: agora.toISOString(),
      plano_expira_em: expira.toISOString(),
      plano_fidelidade_ate: fidelidade ? fidelidade.toISOString() : null,
    })
    .eq("id", ass.user_id);
  if (errProfile) return { error: errProfile.message };

  const { error: errAss } = await admin
    .from("assinaturas")
    .update({
      status: "ativa",
      ativada_em: agora.toISOString(),
      expira_em: expira.toISOString(),
      fidelidade_ate: fidelidade ? fidelidade.toISOString() : null,
      observacao: observacao?.trim() || null,
    })
    .eq("id", assinaturaId);
  if (errAss) return { error: errAss.message };

  return { ok: true };
}
