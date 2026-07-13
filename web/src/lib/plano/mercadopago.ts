// Integração Mercado Pago via API HTTP direta (sem SDK — evita dependência e
// problemas de versão). Só roda no servidor: usa MP_ACCESS_TOKEN, que é
// secreto. O aluno paga no checkout hospedado do Mercado Pago (cartão de
// crédito, Pix, etc.); o dinheiro cai na sua conta MP e NENHUM dado seu
// aparece pro pagante. A confirmação chega pelo webhook.
import type { OpcaoPlano } from "./plano";

const MP_API = "https://api.mercadopago.com";

// process.env às vezes chega com espaço/quebra de linha sobrando (copy-paste
// no painel do Vercel) — .trim() em toda leitura evita um "\n" virar parte da
// URL/token e quebrar a validação de formato do gateway.
function tokenMP(): string | undefined {
  return process.env.MP_ACCESS_TOKEN?.trim() || undefined;
}

export function mpConfigurado(): boolean {
  return !!tokenMP();
}

function urlDoApp(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}

// Cria uma preferência de Checkout Pro e devolve o link pro qual redirecionar o
// aluno. `external_reference` = id da assinatura, pra o webhook casar de volta.
export async function criarPreferenciaCheckout(params: {
  assinaturaId: string;
  opcao: OpcaoPlano;
  userEmail?: string | null;
}): Promise<{ url: string } | { error: string }> {
  const token = tokenMP();
  if (!token) return { error: "Gateway de pagamento não configurado." };

  const base = urlDoApp();
  const ehHttps = base.startsWith("https://");

  const body: Record<string, unknown> = {
    items: [
      {
        id: params.opcao.id,
        title: `Questly ${params.opcao.titulo}`,
        description: params.opcao.observacao,
        quantity: 1,
        currency_id: "BRL",
        unit_price: params.opcao.precoCentavos / 100,
      },
    ],
    external_reference: params.assinaturaId,
    metadata: { assinatura_id: params.assinaturaId },
    back_urls: {
      success: `${base}/pro?status=sucesso`,
      pending: `${base}/pro?status=pendente`,
      failure: `${base}/pro?status=falha`,
    },
    notification_url: `${base}/api/mercadopago/webhook`,
    statement_descriptor: "QUESTLY",
    // auto_return só é aceito com back_urls https (falha em localhost).
    ...(ehHttps ? { auto_return: "approved" } : {}),
  };
  if (params.userEmail) body.payer = { email: params.userEmail };

  try {
    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(
        "Erro ao criar preferência MP:",
        res.status,
        await res.text(),
        "— back_urls enviadas:",
        (body as { back_urls: unknown }).back_urls,
      );
      return { error: "Não foi possível iniciar o pagamento agora." };
    }
    const data = (await res.json()) as { init_point?: string; sandbox_init_point?: string };
    const url = data.init_point || data.sandbox_init_point;
    if (!url) return { error: "Resposta inesperada do gateway." };
    return { url };
  } catch (e) {
    console.error("Falha de rede ao criar preferência MP:", e);
    return { error: "Não foi possível iniciar o pagamento agora." };
  }
}

// Consulta um pagamento no Mercado Pago. Essa é a âncora de confiança do
// webhook: mesmo que alguém forje uma notificação, o status vem daqui, da API
// do MP autenticada com o NOSSO token — não dá pra falsificar um "approved".
export async function buscarPagamentoMP(
  paymentId: string,
): Promise<{ status: string; externalReference: string | null } | null> {
  const token = tokenMP();
  if (!token) return null;
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error("Erro ao buscar pagamento MP:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      status?: string;
      external_reference?: string | null;
      metadata?: { assinatura_id?: string };
    };
    return {
      status: data.status ?? "",
      externalReference: data.external_reference ?? data.metadata?.assinatura_id ?? null,
    };
  } catch (e) {
    console.error("Falha de rede ao buscar pagamento MP:", e);
    return null;
  }
}
