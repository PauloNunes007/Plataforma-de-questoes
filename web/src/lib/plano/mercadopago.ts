// Integração Mercado Pago via API HTTP direta (sem SDK — evita dependência e
// problemas de versão). Só roda no servidor: usa MP_ACCESS_TOKEN, que é
// secreto. O aluno paga no checkout hospedado do Mercado Pago (cartão de
// crédito, Pix, etc.); o dinheiro cai na sua conta MP e NENHUM dado seu
// aparece pro pagante. A confirmação chega pelo webhook.
//
// Este arquivo cuida do pagamento AVULSO (`/checkout/preferences`): uma
// cobrança, aceita Pix, boleto e cartão parcelado. Desde 2026-09-17 ele é a
// porta de TODA venda (ver o repasse no topo de ./plano.ts) — o semestral
// entrega o "R$ 10/mês" por parcelamento em vez de assinatura, e o recorrente
// de verdade (`./preapproval.ts`) só volta à tela com `MP_RECORRENTE=1`.
import type { MetodosPagamento, OpcaoPlano } from "./plano";

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

// Meios de pagamento que ESTA conta vendedora aceita. É o que permite a /pro
// dizer "Pix" só quando Pix existe de verdade no checkout — ver o repasse em
// ./plano.ts (`MetodosPagamento`).
//
// Cache de processo com TTL: a resposta muda quando o dono mexe no painel do
// MP (cadastra uma chave Pix, por exemplo), o que é raro, e sem cache isto
// viraria uma chamada de rede em CADA render da /pro. 10 minutos é curto o
// bastante pra uma mudança no painel aparecer sozinha e longo o bastante pra
// não pesar.
const METODOS_CACHE_MS = 10 * 60 * 1000;
let metodosCache: { valor: MetodosPagamento; expira: number } | null = null;

export async function metodosPagamentoMP(): Promise<MetodosPagamento | null> {
  const token = tokenMP();
  if (!token) return null;
  if (metodosCache && metodosCache.expira > Date.now()) return metodosCache.valor;

  try {
    const res = await fetch(`${MP_API}/v1/payment_methods`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Erro ao listar meios de pagamento do MP:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as Array<{
      id?: string;
      payment_type_id?: string;
      status?: string;
    }>;
    const ativos = (Array.isArray(data) ? data : []).filter((m) => m.status === "active");
    const temTipo = (tipo: string) => ativos.some((m) => m.payment_type_id === tipo);
    const valor: MetodosPagamento = {
      // Pix é um `bank_transfer` específico — checar o tipo pegaria também
      // outras transferências, que não são o que a tela promete.
      pix: ativos.some((m) => m.id === "pix"),
      boleto: temTipo("ticket"),
      credito: temTipo("credit_card"),
      debito: temTipo("debit_card"),
    };
    metodosCache = { valor, expira: Date.now() + METODOS_CACHE_MS };
    return valor;
  } catch (e) {
    console.error("Falha de rede ao listar meios de pagamento do MP:", e);
    return null;
  }
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

  const meses = params.opcao.mesesCreditados;

  const body: Record<string, unknown> = {
    items: [
      {
        id: params.opcao.id,
        title: `Expectrum ${params.opcao.titulo}`,
        description: `${meses} ${meses === 1 ? "mês" : "meses"} de acesso Pro`,
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
    // Teto de parcelas no cartão. É por aqui que o semestral entrega o
    // "R$ 10/mês" que o cartão de preço anuncia, sem depender do preapproval:
    // o valor cheio é autorizado no cartão de uma vez e o aluno paga em até
    // 6×. `installments` só LIMITA o número de parcelas — não torna o
    // parcelamento sem juros, que é configuração da conta vendedora no painel
    // do MP (por isso a UI não promete "sem juros").
    //
    // Não mandamos `default_installments`: pré-selecionar 6× faria o aluno ver
    // um total com juros já escolhido por nós, se a conta não tiver campanha
    // sem juros ligada. Quem escolhe a parcela é ele, na tela do MP.
    payment_methods: { installments: params.opcao.parcelasMax },
    statement_descriptor: "EXPECTRUM",
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

// ------------------------------------------------------------- reembolso
// Devolver o dinheiro de UMA cobrança. É a metade que faltava pra vender
// assinatura no Brasil: o direito de arrependimento (CDC art. 49, 7 dias
// corridos para compra pela internet) não depende de motivo nem da nossa
// concordância, e a devolução tem que ser do valor integral e imediata. Um
// botão que "abre um chamado" não cumpre isso — este cumpre.
//
// `POST /v1/payments/{id}/refunds` com corpo vazio devolve o total. O parcial
// existe na API (mandando `amount`) e deliberadamente não é usado: o
// arrependimento é integral por lei, e o cancelamento de renovação não devolve
// nada — não sobra caso pro meio-termo.
//
// A idempotência aqui é do lado do MP: um segundo refund do mesmo pagamento
// volta 4xx, e quem chama (lib/plano/actions.ts) já marcou a assinatura como
// 'reembolsada' antes de um segundo clique chegar.
export async function reembolsarPagamentoMP(
  paymentId: string,
): Promise<{ ok: true; centavos: number | null } | { error: string }> {
  const token = tokenMP();
  if (!token) return { error: "Gateway de pagamento não configurado." };

  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Exigido pelo MP em POST de refund; sem ele a chamada volta 400.
        "X-Idempotency-Key": `refund-${paymentId}`,
      },
      body: "{}",
      cache: "no-store",
    });

    const texto = await res.text();
    if (!res.ok) {
      console.error("Erro ao reembolsar pagamento no MP:", res.status, texto);
      return { error: "O Mercado Pago não aceitou o estorno agora." };
    }

    const data = JSON.parse(texto || "{}") as { amount?: number; status?: string };
    return { ok: true, centavos: typeof data.amount === "number" ? Math.round(data.amount * 100) : null };
  } catch (e) {
    console.error("Falha de rede ao reembolsar pagamento no MP:", e);
    return { error: "Não foi possível falar com o Mercado Pago agora." };
  }
}
