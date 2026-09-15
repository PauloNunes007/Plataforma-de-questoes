"use server";

// Ações do ALUNO sobre o próprio plano: registra/cancela a intenção de assinar
// (uma linha 'pendente' em `assinaturas`), manda pro checkout do Mercado Pago e
// — o ponto importante — CONFERE o pagamento contra a API do MP pra liberar o
// Pro sozinho, sem admin nenhum no meio (`conferirPagamentoAction`).
//
// Há três caminhos que levam à MESMA ativação idempotente (lib/plano/ativar.ts):
//   1) webhook do MP (app/api/mercadopago/webhook) — o mais rápido;
//   2) volta do checkout / polling da tela /pro — `conferirPagamentoAction`,
//      que pergunta o status direto pro MP e não depende do webhook chegar;
//   3) confirmação manual do admin (lib/admin/actions.ts) — hoje só pra
//      contingência (gateway fora do ar, pagamento por fora).
import { createClient } from "@/lib/supabase/server";
import { acharOpcao, ehPro } from "@/lib/plano/plano";
import {
  buscarPagamentoMP,
  buscarPagamentosPorReferencia,
  criarPreferenciaCheckout,
  mpConfigurado,
} from "@/lib/plano/mercadopago";
import { ativarAssinatura } from "@/lib/plano/ativar";

export type AssinaturaPendente = {
  id: string;
  ciclo: string;
  forma: string;
  valorCentavos: number;
  status: string;
  criadaEm: string;
};

export async function buscarMinhaAssinaturaPendenteAction(): Promise<AssinaturaPendente | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("assinaturas")
    .select("id, ciclo, forma, valor_centavos, status, criada_em")
    .eq("user_id", user.id)
    .eq("status", "pendente")
    .order("criada_em", { ascending: false })
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    ciclo: data.ciclo,
    forma: data.forma,
    valorCentavos: data.valor_centavos,
    status: data.status,
    criadaEm: data.criada_em,
  };
}

export async function criarAssinaturaAction(
  opcaoId: string,
): Promise<{ checkoutUrl: string } | { assinatura: AssinaturaPendente } | { error: string }> {
  const opcao = acharOpcao(opcaoId);
  if (!opcao) return { error: "Plano inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login pra assinar." };

  // Uma pendente por vez (índice parcial). Se o aluno tinha outra pendente
  // (ex.: trocou de plano), cancela antes — a RLS só deixa o dono fazer
  // pendente→cancelada (supabase_seguranca_hardening.sql).
  await supabase
    .from("assinaturas")
    .update({ status: "cancelada" })
    .eq("user_id", user.id)
    .eq("status", "pendente");

  const { data, error } = await supabase
    .from("assinaturas")
    .insert({
      user_id: user.id,
      ciclo: opcao.ciclo,
      forma: opcao.forma,
      valor_centavos: opcao.precoCentavos,
      status: "pendente",
    })
    .select("id, ciclo, forma, valor_centavos, status, criada_em")
    .single();

  if (error) return { error: error.message };

  // Com gateway configurado, manda pro checkout hospedado do Mercado Pago
  // (cartão/Pix, sem expor dado nenhum seu). Sem token, cai no fluxo manual —
  // registra a intenção e o admin confirma em /admin/assinaturas.
  if (mpConfigurado()) {
    const pref = await criarPreferenciaCheckout({
      assinaturaId: data.id,
      opcao,
      userEmail: user.email,
    });
    if ("url" in pref) return { checkoutUrl: pref.url };
    // Falhou criar a preferência: mantém a pendente e cai no fallback manual.
  }

  return {
    assinatura: {
      id: data.id,
      ciclo: data.ciclo,
      forma: data.forma,
      valorCentavos: data.valor_centavos,
      status: data.status,
      criadaEm: data.criada_em,
    },
  };
}

export async function cancelarAssinaturaPendenteAction(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // RLS já garante que o aluno só mexe na própria linha; o eq extra é cinto e
  // suspensório e limita ao registro certo.
  const { error } = await supabase
    .from("assinaturas")
    .update({ status: "cancelada" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pendente");

  if (error) return { error: error.message };
  return { ok: true };
}

// ------------------------------------------------------- conferência do MP
// Estados possíveis ao perguntar pro Mercado Pago "e aí, esse pagamento saiu?".
// `indisponivel` = sem MP_ACCESS_TOKEN (fluxo manual do admin).
export type EstadoPagamento =
  | "ativo"
  | "processando"
  | "recusado"
  | "sem_pendencia"
  | "indisponivel";

export type ConferenciaPagamento = {
  estado: EstadoPagamento;
  detalhe?: string;
};

// Status do MP que ainda podem virar "approved" — enquanto estiver num
// destes, a tela continua esperando (Pix leva segundos, cartão em análise
// pode levar minutos).
const STATUS_EM_ANDAMENTO = new Set([
  "pending",
  "in_process",
  "in_mediation",
  "authorized",
]);

function motivoRecusa(statusDetail: string | null): string {
  switch (statusDetail) {
    case "cc_rejected_insufficient_amount":
      return "Saldo/limite insuficiente no cartão.";
    case "cc_rejected_bad_filled_security_code":
      return "Código de segurança incorreto.";
    case "cc_rejected_bad_filled_date":
      return "Data de validade incorreta.";
    case "cc_rejected_bad_filled_other":
      return "Algum dado do cartão saiu errado.";
    case "cc_rejected_call_for_authorize":
      return "O banco pediu que você autorize a compra antes.";
    case "cc_rejected_high_risk":
      return "O emissor recusou a compra por segurança.";
    case "cc_rejected_max_attempts":
      return "Muitas tentativas com esse cartão.";
    case "expired":
      return "O prazo do pagamento expirou.";
    default:
      return "O pagamento não foi concluído.";
  }
}

// Pergunta pro Mercado Pago o status do pagamento do aluno e, se estiver
// aprovado, ATIVA o Pro na hora (mesma função idempotente do webhook).
//
// `paymentId` vem da volta do checkout (`/pro?payment_id=...`); sem ele,
// procuramos por `external_reference` = id da assinatura pendente — é assim
// que o polling da tela funciona mesmo quando o aluno fecha o checkout e volta
// pelo menu.
//
// Segurança: a assinatura sempre é lida pelo client do ALUNO com
// `.eq("user_id", user.id)` (a RLS é dona-só de qualquer jeito), então nunca dá
// pra ativar o Pro de outra conta passando um payment_id alheio.
export async function conferirPagamentoAction(
  paymentId?: string,
): Promise<ConferenciaPagamento> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { estado: "sem_pendencia" };

  // Já é Pro (o webhook chegou primeiro, ou é uma renovação): nada a fazer.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();
  if (ehPro(profile)) return { estado: "ativo" };

  if (!mpConfigurado()) return { estado: "indisponivel" };

  // 1) Caminho da volta do checkout: temos o id do pagamento na URL.
  if (paymentId) {
    const pag = await buscarPagamentoMP(paymentId);
    if (pag?.externalReference) {
      const { data: minha } = await supabase
        .from("assinaturas")
        .select("id, status")
        .eq("id", pag.externalReference)
        .eq("user_id", user.id)
        .maybeSingle();
      if (minha) {
        if (pag.status === "approved") {
          const res = await ativarAssinatura(minha.id, "Pago via Mercado Pago");
          if ("error" in res) {
            console.error("Erro ao ativar assinatura na volta do checkout:", res.error);
            return { estado: "processando" };
          }
          return { estado: "ativo" };
        }
        if (STATUS_EM_ANDAMENTO.has(pag.status)) return { estado: "processando" };
        return { estado: "recusado", detalhe: motivoRecusa(pag.statusDetail) };
      }
    }
  }

  // 2) Caminho do polling: procura pagamentos da assinatura pendente do aluno.
  const { data: pendentes } = await supabase
    .from("assinaturas")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pendente")
    .order("criada_em", { ascending: false })
    .limit(1);

  const assinaturaId = pendentes?.[0]?.id;
  if (!assinaturaId) return { estado: "sem_pendencia" };

  const pagamentos = await buscarPagamentosPorReferencia(assinaturaId);
  if (!pagamentos) return { estado: "processando" };

  if (pagamentos.some((p) => p.status === "approved")) {
    const res = await ativarAssinatura(assinaturaId, "Pago via Mercado Pago");
    if ("error" in res) {
      console.error("Erro ao ativar assinatura no polling:", res.error);
      return { estado: "processando" };
    }
    return { estado: "ativo" };
  }

  if (pagamentos.some((p) => STATUS_EM_ANDAMENTO.has(p.status))) {
    return { estado: "processando" };
  }

  // Só recusa/cancelamento: o aluno pode tentar de novo. Não cancelamos a
  // linha pendente aqui — `criarAssinaturaAction` já limpa antes de criar a
  // próxima, e manter a linha preserva o histórico da tentativa.
  const recusado = pagamentos.find(
    (p) => p.status === "rejected" || p.status === "cancelled",
  );
  if (recusado) return { estado: "recusado", detalhe: motivoRecusa(recusado.statusDetail) };

  // Nenhum pagamento ainda: o aluno abriu o checkout e não terminou.
  return { estado: "processando" };
}
