import { NextResponse } from "next/server";
import crypto from "crypto";
import { buscarPagamentoMP } from "@/lib/plano/mercadopago";
import { ativarAssinatura } from "@/lib/plano/ativar";

// Webhook do Mercado Pago. Quando um pagamento é aprovado, o MP chama esta
// rota; nós re-consultamos o pagamento na API do MP (âncora de confiança) e,
// se aprovado, ativamos o Pro do aluno via service_role. Idempotente.
//
// Segurança em camadas:
//  1) valida a assinatura HMAC (x-signature) com MP_WEBHOOK_SECRET, quando
//     configurado;
//  2) INDEPENDENTE disso, o status vem de uma consulta autenticada à API do
//     MP — uma notificação forjada não consegue simular um "approved".
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

    // Só nos interessa notificação de pagamento; merchant_order/etc. ignoramos.
    if (!paymentId || (tipo && !tipo.includes("payment"))) {
      return NextResponse.json({ ok: true });
    }

    // .trim() pelo mesmo motivo de urlDoApp()/tokenMP() em mercadopago.ts —
    // copy-paste no painel do Vercel pode grudar um "\n" no fim do valor.
    const secret = process.env.MP_WEBHOOK_SECRET?.trim();
    if (secret && !validarAssinatura(req, paymentId, secret)) {
      return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
    }

    const pagamento = await buscarPagamentoMP(paymentId);
    if (pagamento?.status === "approved" && pagamento.externalReference) {
      const res = await ativarAssinatura(pagamento.externalReference, "Pago via Mercado Pago");
      if ("error" in res) console.error("Erro ao ativar assinatura pelo webhook:", res.error);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Responde 200 mesmo em erro nosso pra o MP não entrar em loop de reenvio;
    // o erro fica no log pra investigar.
    console.error("Erro no webhook do Mercado Pago:", e);
    return NextResponse.json({ ok: true });
  }
}
