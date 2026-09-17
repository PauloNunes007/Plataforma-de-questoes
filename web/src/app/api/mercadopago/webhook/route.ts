import { NextResponse } from "next/server";
import crypto from "crypto";
import { buscarPagamentoMP } from "@/lib/plano/mercadopago";
import { buscarCobrancaAssinaturaMP, buscarPreapprovalMP } from "@/lib/plano/preapproval";
import { creditarCobranca } from "@/lib/plano/ativar";

// Webhook do Mercado Pago. Quando um pagamento é aprovado, o MP chama esta
// rota; nós re-consultamos o pagamento na API do MP (âncora de confiança) e,
// se aprovado, ativamos o Pro do aluno via service_role. Idempotente.
//
// Segurança: a ÂNCORA é a consulta autenticada à API do MP com o nosso token.
// Ela sozinha já fecha o buraco — o MP só devolve pagamentos da nossa conta, um
// id inventado volta 404, e um id real e aprovado é... um pagamento real. Não
// existe caminho pra virar Pro sem pagar, com ou sem assinatura HMAC.
//
// Por isso a validação do `x-signature` LOGA e segue, em vez de responder 401:
// falhar fechado aqui significa que um `MP_WEBHOOK_SECRET` errado (colado torto
// no painel, rotacionado no MP e não atualizado no Vercel) faz TODO pagamento
// parar de liberar o Pro em silêncio — que é exatamente a avaria que este
// arquivo existe pra evitar. A assinatura vira sinal de anti-abuso (fica no
// log), não porteiro do dinheiro do aluno.
//
// A tela /pro também confere o pagamento por conta própria (polling +
// conferência na volta do checkout, lib/plano/actions.ts), então há dois
// caminhos independentes até a mesma ativação idempotente.
//
// **Repasse de 2026-09-16 — assinatura.** Desde que os planos recorrentes
// passaram a ser preapproval de verdade (lib/plano/preapproval.ts), o MP manda
// DOIS tipos de notificação, e antes só o primeiro era entendido:
//
//   • `payment` ................... o pagamento avulso (semestral à vista);
//   • `subscription_authorized_payment` ... a cobrança MENSAL da assinatura.
//     O id aqui é o do `authorized_payment`, não o do pagamento — sem tratar
//     este tópico, o aluno seria cobrado nos meses 2..6 e o Pro dele venceria
//     no fim do mês 1.
//
// Ambos terminam em `creditarCobranca`, que é idempotente pelo índice único em
// `assinatura_pagamentos.gateway_payment_id` — o reenvio do MP e o polling da
// tela podem chegar juntos sem creditar o mesmo mês duas vezes.
export const runtime = "nodejs";

function validarAssinatura(req: Request, dataId: string, secret: string): boolean {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature) return false;

  const partes: Record<string, string> = {};
  for (const p of xSignature.split(",")) {
    const [k, v] = p.split("=");
    if (k && v) partes[k.trim()] = v.trim();
  }
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  // Manifesto conforme a doc do MP. IDs alfanuméricos entram em minúsculo.
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const esperado = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(esperado, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const texto = await req.text();
    let corpo: Record<string, unknown> = {};
    try {
      corpo = texto ? JSON.parse(texto) : {};
    } catch {
      /* MP às vezes manda só query params */
    }

    const acao = typeof corpo.action === "string" ? corpo.action : "";
    const tipo =
      (typeof corpo.type === "string" ? corpo.type : "") ||
      acao.split(".")[0] ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      "";

    const data = corpo.data as { id?: string | number } | undefined;
    const paymentId =
      (data?.id != null ? String(data.id) : "") ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";

    // Só nos interessa pagamento (avulso) e cobrança de assinatura;
    // merchant_order/etc. ignoramos.
    const ehCobrancaAssinatura = tipo.includes("subscription_authorized_payment");
    const ehPreapproval = tipo === "subscription_preapproval" || tipo === "preapproval";
    if (!paymentId || (tipo && !tipo.includes("payment") && !ehPreapproval)) {
      return NextResponse.json({ ok: true });
    }

    // .trim() pelo mesmo motivo de urlDoApp()/tokenMP() em mercadopago.ts —
    // copy-paste no painel do Vercel pode grudar um "\n" no fim do valor.
    const secret = process.env.MP_WEBHOOK_SECRET?.trim();
    if (secret && !validarAssinatura(req, paymentId, secret)) {
      console.error(
        "Webhook MP com assinatura HMAC inválida (seguindo mesmo assim — o status vem da API do MP). Pagamento:",
        paymentId,
        "— confira se MP_WEBHOOK_SECRET bate com a assinatura secreta do painel.",
      );
    }

    // Notificação da preapproval em si (autorizada/pausada/cancelada) não
    // carrega dinheiro nenhum — quem paga o mês é a cobrança. Só logamos.
    if (ehPreapproval) {
      const pre = await buscarPreapprovalMP(paymentId);
      console.log("Webhook de assinatura MP:", paymentId, "status:", pre?.status ?? "?");
      return NextResponse.json({ ok: true });
    }

    // A cobrança mensal da assinatura: o id é o do `authorized_payment`, e é
    // ELE que vira a chave de idempotência (um por mês).
    if (ehCobrancaAssinatura) {
      const cobranca = await buscarCobrancaAssinaturaMP(paymentId);
      if (cobranca?.status === "approved" && cobranca.preapprovalId) {
        const pre = await buscarPreapprovalMP(cobranca.preapprovalId);
        if (pre?.externalReference) {
          const res = await creditarCobranca({
            assinaturaId: pre.externalReference,
            gatewayPaymentId: cobranca.id,
            observacao: "Cobrança mensal via Mercado Pago",
          });
          if ("error" in res) console.error("Erro ao creditar cobrança da assinatura:", res.error);
          else if (res.jaAplicada) console.log("Cobrança já creditada antes:", cobranca.id);
          else console.log("Mês de Pro creditado. Assinatura:", pre.externalReference);
        }
      }
      return NextResponse.json({ ok: true });
    }

    const pagamento = await buscarPagamentoMP(paymentId);
    if (pagamento?.status === "approved" && pagamento.externalReference) {
      const res = await creditarCobranca({
        assinaturaId: pagamento.externalReference,
        gatewayPaymentId: paymentId,
        observacao: "Pago via Mercado Pago",
      });
      if ("error" in res) console.error("Erro ao creditar pagamento pelo webhook:", res.error);
      else console.log("Pro liberado pelo webhook do MP. Assinatura:", pagamento.externalReference);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Responde 200 mesmo em erro nosso pra o MP não entrar em loop de reenvio;
    // o erro fica no log pra investigar.
    console.error("Erro no webhook do Mercado Pago:", e);
    return NextResponse.json({ ok: true });
  }
}
