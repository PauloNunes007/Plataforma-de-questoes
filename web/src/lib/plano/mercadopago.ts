// Integração Mercado Pago via API HTTP direta (sem SDK — evita dependência e
// problemas de versão). Só roda no servidor: usa MP_ACCESS_TOKEN, que é
// secreto. O aluno paga no checkout hospedado do Mercado Pago (cartão de
// crédito, Pix, etc.); o dinheiro cai na sua conta MP e NENHUM dado seu
// aparece pro pagante. A confirmação chega pelo webhook.
//
// Este arquivo cuida do pagamento AVULSO (`/checkout/preferences`): uma
// cobrança, aceita Pix. A assinatura recorrente — em que o MP cobra o cartão
// todo mês sozinho — é outro produto do gateway e mora em `./preapproval.ts`.
// Até 2026-09-16 os planos recorrentes também saíam por aqui, e o "R$ 10/mês
// por 6 meses" era cobrado uma única vez de R$ 10.
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
        title: `Expectrum ${params.opcao.titulo}`,
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
    statement_descriptor: "QUESTLY",
    // auto_return e notification_url só são aceitos com URL https pública: em
    // localhost o MP rejeita a preferência inteira (e o aluno veria "não foi
    // possível iniciar o pagamento" em vez do checkout). Em dev o webhook não
    // teria como chegar de qualquer jeito — quem cobre é a conferência da
    // tela /pro, que pergunta o status direto pra API do MP.
    ...(ehHttps
      ? { auto_return: "approved", notification_url: `${base}/api/mercadopago/webhook` }
      : {}),
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
): Promise<{ status: string; statusDetail: string | null; externalReference: string | null } | null> {
  const token = tokenMP();
  if (!token) return null;
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Erro ao buscar pagamento MP:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      status?: string;
      status_detail?: string;
      external_reference?: string | null;
      metadata?: { assinatura_id?: string };
    };
    return {
      status: data.status ?? "",
      statusDetail: data.status_detail ?? null,
      externalReference: data.external_reference ?? data.metadata?.assinatura_id ?? null,
    };
  } catch (e) {
    console.error("Falha de rede ao buscar pagamento MP:", e);
    return null;
  }
}

// Busca pagamentos pelo `external_reference` (= id da assinatura). Essa é a
// peça que torna o fluxo automático SEM depender do webhook chegar: quando o
// aluno volta do checkout (ou enquanto a tela /pro faz polling), perguntamos
// direto ao Mercado Pago "existe pagamento aprovado pra essa assinatura?".
// O webhook continua sendo o caminho rápido; isto é a rede de segurança pra
// quando ele atrasa, é bloqueado, ou o segredo/URL estão desconfigurados.
export type PagamentoMP = {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
};

export async function buscarPagamentosPorReferencia(
  assinaturaId: string,
): Promise<PagamentoMP[] | null> {
  const token = tokenMP();
  if (!token) return null;
  try {
    const url = new URL(`${MP_API}/v1/payments/search`);
    url.searchParams.set("external_reference", assinaturaId);
    url.searchParams.set("sort", "date_created");
    url.searchParams.set("criteria", "desc");
    url.searchParams.set("limit", "10");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Erro ao buscar pagamentos por referência no MP:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      results?: Array<{
        id?: number | string;
        status?: string;
        status_detail?: string;
        external_reference?: string | null;
      }>;
    };
    return (data.results || []).map((p) => ({
      id: String(p.id ?? ""),
      status: p.status ?? "",
      statusDetail: p.status_detail ?? null,
      externalReference: p.external_reference ?? null,
    }));
  } catch (e) {
    console.error("Falha de rede ao buscar pagamentos por referência no MP:", e);
    return null;
  }
}
