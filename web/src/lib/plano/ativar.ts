import { createAdminClient } from "@/lib/supabase/admin";
import { adicionarMeses, cancelarAssinaturaRecorrente } from "./preapproval";
import { MESES_SEMESTRE } from "./plano";

// Ativação do Pro — a lógica compartilhada entre a confirmação manual do admin
// (lib/admin/actions.ts), a conferência da tela /pro (lib/plano/actions.ts) e o
// webhook do Mercado Pago (app/api/mercadopago/webhook/route.ts). Escreve em
// colunas protegidas de `profiles` (plano*), então roda SEMPRE via service_role
// (createAdminClient).
//
// **Repasse de 2026-09-16 — quanto tempo cada cobrança compra.**
//
// Antes, ativar concedia o CICLO inteiro: semestral = 6 meses, sempre. Como
// toda compra era um pagamento avulso (ver lib/plano/preapproval.ts), o
// resultado era que R$ 10 pagos uma vez liberavam o semestre.
//
// A regra agora é a óbvia, e vale nos três caminhos: **uma cobrança compra o
// período que ela pagou**.
//
//   • semestral à vista (R$ 60 de uma vez) ....... 6 meses
//   • qualquer recorrente (mensal ou semestral) .. 1 mês por cobrança
//   • ativação manual do admin ................... a MESMA régua (ver o
//     repasse de 2026-09-17 em `ativarAssinatura`: conceder o ciclo inteiro
//     ali reabria o furo pela porta manual)
//
// A fidelidade do semestral recorrente continua sendo 6 meses a partir da
// primeira cobrança — só que agora ela descreve um compromisso real de 6
// cobranças, e não uma frase solta no cartão de preço.
//
// Renovação (`creditarCobranca`) é idempotente pelo ÍNDICE ÚNICO em
// `assinatura_pagamentos.gateway_payment_id`, não por um filtro em JS: o
// webhook e o polling da tela chegam pelos dois lados e, sem isso, um mês
// contaria duas vezes.

/** Quanto tempo UMA cobrança dessa assinatura compra. */
function mesesPorCobranca(ciclo: string, forma: string): number {
  if (forma === "recorrente") return 1;
  return ciclo === "semestral" ? 6 : 1;
}

type AssinaturaMin = {
  id: string;
  user_id: string;
  ciclo: string;
  forma: string;
  status: string;
  /** id da preapproval no MP. null = não existe assinatura no gateway. */
  gateway_id: string | null;
};

/**
 * Estende o Pro do aluno a partir de AGORA ou do que ele já tem — o que for
 * maior. Renovar nunca pode encurtar: se o MP cobra o mês 2 três dias antes do
 * mês 1 acabar, esses três dias continuam sendo dele.
 */
async function estenderPro(
  admin: ReturnType<typeof createAdminClient>,
  ass: AssinaturaMin,
  meses: number,
  primeiraCobranca: boolean,
): Promise<{ expira: Date } | { error: string }> {
  const agora = new Date();

  const { data: profile, error: errLeitura } = await admin
    .from("profiles")
    .select("plano_desde, plano_expira_em, plano_fidelidade_ate")
    .eq("id", ass.user_id)
    .maybeSingle();
  if (errLeitura) return { error: errLeitura.message };

  const atual = profile?.plano_expira_em ? new Date(profile.plano_expira_em) : null;
  const base = atual && atual.getTime() > agora.getTime() ? atual : agora;
  const expira = adicionarMeses(base, meses);

  // A fidelidade nasce na PRIMEIRA cobrança e não se mexe depois — ela marca o
  // compromisso assumido, não a validade corrente.
  //
  // `gateway_id` na condição (2026-09-17): fidelidade só faz sentido quando
  // existe uma assinatura DE VERDADE no MP cobrando todo mês. Quando o
  // preapproval foi recusado e a compra caiu pro checkout avulso de um mês
  // (ver `criarAssinaturaAction`), não há seis cobranças a honrar — carimbar
  // "fiel até daqui a 6 meses" seria registrar um compromisso que ninguém
  // assumiu, e ele aparece na tela do aluno.
  const temAssinaturaNoGateway = Boolean(ass.gateway_id);
  const fidelidade =
    ass.ciclo === "semestral" && ass.forma === "recorrente" && temAssinaturaNoGateway
      ? profile?.plano_fidelidade_ate
        ? new Date(profile.plano_fidelidade_ate)
        : adicionarMeses(agora, 6)
      : null;

  const { error } = await admin
    .from("profiles")
    .update({
      plano: "pro",
      plano_ciclo: ass.ciclo,
      plano_desde: profile?.plano_desde ?? agora.toISOString(),
      plano_expira_em: expira.toISOString(),
      plano_fidelidade_ate: fidelidade ? fidelidade.toISOString() : null,
    })
    .eq("id", ass.user_id);
  if (error) return { error: error.message };

  const { error: errAss } = await admin
    .from("assinaturas")
    .update({
      status: "ativa",
      ...(primeiraCobranca ? { ativada_em: agora.toISOString() } : {}),
      expira_em: expira.toISOString(),
      fidelidade_ate: fidelidade ? fidelidade.toISOString() : null,
    })
    .eq("id", ass.id);
  if (errAss) return { error: errAss.message };

  return { expira };
}

async function lerAssinatura(
  admin: ReturnType<typeof createAdminClient>,
  assinaturaId: string,
): Promise<AssinaturaMin | null> {
  const { data } = await admin
    .from("assinaturas")
    .select("id, user_id, ciclo, forma, status, gateway_id")
    .eq("id", assinaturaId)
    .maybeSingle();
  return (data as AssinaturaMin | null) ?? null;
}

/**
 * Credita UMA cobrança do gateway. É o caminho de toda ativação automática,
 * primeira ou renovação.
 *
 * `gatewayPaymentId` é a chave de idempotência. A insert vem ANTES de mexer no
 * profile de propósito: se duas chamadas correrem juntas, a que perder o índice
 * único sai sem creditar nada, e o pior caso é um crédito a menos (recuperável
 * na próxima conferência) em vez de um mês de graça.
 */
export async function creditarCobranca(params: {
  assinaturaId: string;
  gatewayPaymentId: string;
  observacao?: string;
}): Promise<{ ok: true; jaAplicada: boolean } | { error: string }> {
  const admin = createAdminClient();

  const ass = await lerAssinatura(admin, params.assinaturaId);
  if (!ass) return { error: "Assinatura não encontrada." };

  const meses = mesesPorCobranca(ass.ciclo, ass.forma);

  const { error: errLog } = await admin.from("assinatura_pagamentos").insert({
    assinatura_id: ass.id,
    user_id: ass.user_id,
    gateway_payment_id: params.gatewayPaymentId,
    meses_creditados: meses,
  });
  if (errLog) {
    // 23505 = violação de unicidade: esta cobrança já virou tempo de Pro. Não
    // é erro — é exatamente o que o índice existe pra dizer.
    if (errLog.code === "23505") return { ok: true, jaAplicada: true };
    return { error: errLog.message };
  }

  // Primeira cobrança = a que sai de 'pendente'. Só ela carimba `ativada_em`.
  const res = await estenderPro(admin, ass, meses, ass.status === "pendente");
  if ("error" in res) return { error: res.error };

  // Cinto e suspensório do semestral: o `end_date` mandado ao MP deveria parar
  // a cobrança na 6ª, mas essa é uma promessa do gateway sobre um campo que
  // ele valida sozinho. Contar as cobranças creditadas é uma verdade NOSSA, e
  // o custo de ela falhar é cobrar o aluno um 7º mês que ele não contratou —
  // caro demais pra depender de um campo só. Ao fechar o semestre, cancelamos
  // a assinatura no MP.
  if (ass.ciclo === "semestral" && ass.forma === "recorrente" && ass.gateway_id) {
    const { count } = await admin
      .from("assinatura_pagamentos")
      .select("id", { count: "exact", head: true })
      .eq("assinatura_id", ass.id);
    if ((count ?? 0) >= MESES_SEMESTRE) {
      const parou = await cancelarAssinaturaRecorrente(ass.gateway_id);
      console.log(
        parou
          ? `Semestral completo (${count} cobranças) — assinatura encerrada no MP: ${ass.id}`
          : `Semestral completo mas o MP não aceitou encerrar: ${ass.id}`,
      );
      if (parou) {
        await admin.from("assinaturas").update({ status: "expirada" }).eq("id", ass.id);
      }
    }
  }

  if (params.observacao) {
    await admin
      .from("assinaturas")
      .update({ observacao: params.observacao.trim() })
      .eq("id", ass.id);
  }

  return { ok: true, jaAplicada: false };
}

/**
 * Ativação MANUAL pelo admin (contingência: gateway fora do ar, pagamento por
 * fora). Não passa por `assinatura_pagamentos` — não há cobrança de gateway pra
 * registrar — e continua idempotente por status, como antes.
 *
 * **Repasse de 2026-09-17.** Aqui morava o MESMO furo de receita, entrando pela
 * porta manual: concedia `ciclo === "semestral" ? 6 : 1` meses, então confirmar
 * à mão um pedido "semestral recorrente" (cujo `valor_centavos` é R$ 10, o de
 * UMA parcela) dava seis meses por dez reais. Agora vale a mesma régua do
 * caminho automático: uma confirmação = o que UM pagamento daquele pedido
 * compra. Pra conceder o semestre inteiro, o pedido certo é o à vista (R$ 60).
 */
export async function ativarAssinatura(
  assinaturaId: string,
  observacao?: string,
): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();

  const ass = await lerAssinatura(admin, assinaturaId);
  if (!ass) return { error: "Assinatura não encontrada." };
  if (ass.status === "ativa") return { ok: true };

  const meses = mesesPorCobranca(ass.ciclo, ass.forma);
  const res = await estenderPro(admin, ass, meses, true);
  if ("error" in res) return { error: res.error };

  await admin
    .from("assinaturas")
    .update({ observacao: observacao?.trim() || null })
    .eq("id", assinaturaId);

  return { ok: true };
}
