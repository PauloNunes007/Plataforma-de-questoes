// Assinatura recorrente no Mercado Pago (`/preapproval`) — a metade de
// aplicação do conserto de 2026-09-16.
//
// O que estava errado: TODO plano saía por `/checkout/preferences`
// (lib/plano/mercadopago.ts), que é pagamento AVULSO. O "Pro Semestral, R$ 10
// por mês com fidelidade de 6 meses" virava, no gateway, uma cobrança única de
// R$ 10 — e `ativarAssinatura` liberava o semestre inteiro em cima dela. O
// compromisso de seis meses existia só no texto do cartão de preço.
//
// Os dois produtos do MP e quem usa cada um:
//
//   • `/checkout/preferences` — uma cobrança. Cartão, Pix, boleto. É o certo
//     pro "semestral à vista" (R$ 60 de uma vez) e segue em mercadopago.ts.
//   • `/preapproval` — assinatura. O aluno autoriza um CARTÃO DE CRÉDITO e o
//     MP cobra sozinho todo mês. É o certo pras opções `forma: 'recorrente'`,
//     e é o que este arquivo faz.
//
// `end_date` é o que transforma "cobra pra sempre" em "cobra 6 vezes": o MP
// para quando a data passa. No mensal não há `end_date` — cobra até cancelar.
//
// Consequência de produto que a tela precisa dizer em voz alta: preapproval
// não aceita Pix. Quem quer Pix tem o semestral à vista.
import type { OpcaoPlano } from "./plano";
import { MESES_SEMESTRE } from "./plano";

const MP_API = "https://api.mercadopago.com";

function tokenMP(): string | undefined {
  return process.env.MP_ACCESS_TOKEN?.trim() || undefined;
}

function urlDoApp(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * A venda recorrente está ligada nesta instalação?
 *
 * **Desligado por padrão, e de propósito.** O preapproval só funciona com
 * Assinaturas aprovado na conta do Mercado Pago, e a recusa dele só aparecia
 * no CLIQUE — tarde demais, com o aluno já a caminho do checkout. Resultado:
 * a tela tinha que parar a compra num aviso ("renovação automática
 * indisponível") e pedir um segundo clique por um produto diferente. Perder
 * venda no caixa é pior que não anunciar renovação automática.
 *
 * Com o flag, a pergunta é respondida ANTES de a página renderizar: a /pro
 * desenha o cartão certo desde o início e o clique é sempre um redirect
 * limpo. Pra religar: `MP_RECORRENTE=1` no ambiente, com o site publicado em
 * https (o MP recusa `back_url` que não seja https pública) e Assinaturas
 * habilitado na conta. Confira com uma conta compradora DIFERENTE da
 * vendedora — o MP proíbe assinar de si mesmo.
 */
export function recorrenteHabilitado(): boolean {
  if (process.env.MP_RECORRENTE?.trim() !== "1") return false;
  return urlDoApp().startsWith("https://");
}

/** Soma meses sem estourar o fim do mês (31/01 + 1 mês = 28/02, não 03/03). */
export function adicionarMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  const dia = d.getDate();
  d.setMonth(d.getMonth() + meses);
  if (d.getDate() < dia) d.setDate(0);
  return d;
}

/**
 * Abre a assinatura no MP e devolve o link de autorização.
 *
 * `start_date` fica alguns minutos à frente de propósito: o MP recusa
 * preapproval que começa no passado, e a diferença de relógio entre o nosso
 * servidor e o deles é suficiente pra derrubar a criação.
 */
export async function criarAssinaturaRecorrente(params: {
  assinaturaId: string;
  opcao: OpcaoPlano;
  userEmail?: string | null;
}): Promise<{ url: string; preapprovalId: string } | { error: string }> {
  const token = tokenMP();
  if (!token) return { error: "Gateway de pagamento não configurado." };
  // O MP exige o e-mail do pagador pra abrir uma assinatura; sem ele a chamada
  // volta 400 e o aluno veria só um erro genérico.
  if (!params.userEmail) return { error: "Sua conta precisa de um e-mail pra assinar." };

  const base = urlDoApp();
  // `back_url` é OBRIGATÓRIA na preapproval e precisa ser https pública — o MP
  // recusa a criação inteira em http/localhost. A preferência avulsa não sofre
  // disso (lá o guard de https é só pro auto_return/notification_url), então em
  // desenvolvimento o plano à vista funciona e o recorrente não. Sem esta
  // checagem o aluno/dono recebia um "não foi possível" genérico pra uma causa
  // que é pura configuração.
  if (!base.startsWith("https://")) {
    console.error(
      "Preapproval exige NEXT_PUBLIC_APP_URL em https público (recebido:",
      base,
      "). Em desenvolvimento use o plano à vista, ou um túnel https.",
    );
    return {
      error:
        "A assinatura recorrente exige o site publicado em https. Em desenvolvimento, use o plano semestral à vista.",
    };
  }

  const inicio = new Date(Date.now() + 5 * 60 * 1000);
  // Semestral: 6 cobranças, via end_date. Mensal: sem fim, até cancelar.
  const fim =
    params.opcao.ciclo === "semestral" ? adicionarMeses(inicio, MESES_SEMESTRE) : null;

  const body: Record<string, unknown> = {
    reason: `Expectrum ${params.opcao.titulo}`,
    external_reference: params.assinaturaId,
    payer_email: params.userEmail,
    back_url: `${base}/pro?status=sucesso`,
    status: "pending",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: params.opcao.precoCentavos / 100,
      currency_id: "BRL",
      start_date: inicio.toISOString(),
      ...(fim ? { end_date: fim.toISOString() } : {}),
    },
  };

  try {
    const res = await fetch(`${MP_API}/preapproval`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const corpo = await res.text();
      console.error("Erro ao criar preapproval MP:", res.status, corpo);
      return { error: explicarRecusa(corpo) };
    }
    const data = (await res.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    };
    const url = data.init_point || data.sandbox_init_point;
    if (!url || !data.id) return { error: "Resposta inesperada do gateway." };
    return { url, preapprovalId: String(data.id) };
  } catch (e) {
    console.error("Falha de rede ao criar preapproval MP:", e);
    return { error: "Não foi possível iniciar a assinatura agora." };
  }
}

/**
 * Traduz a recusa do MP em algo acionável. As três primeiras são as que
 * derrubam um preapproval na prática, e as três são de CONFIGURAÇÃO — sem esta
 * tradução viram todas o mesmo "não foi possível", que não diz a ninguém o que
 * arrumar.
 *
 * O corpo cru fica no log; aqui só sai a versão curta pro aluno.
 */
function explicarRecusa(corpo: string): string {
  const texto = corpo.toLowerCase();
  if (texto.includes("same user") || texto.includes("mesmo usuário")) {
    // Clássico ao testar com a própria conta: o MP proíbe alguém assinar de si
    // mesmo. Some com uma conta de teste (comprador) diferente da do vendedor.
    return "Esta conta é a mesma que recebe o pagamento — o Mercado Pago não permite assinar de si mesmo. Use outra conta pra testar.";
  }
  if (texto.includes("invalid") && texto.includes("back_url")) {
    return "A URL de retorno configurada não é aceita pelo Mercado Pago.";
  }
  if (texto.includes("unauthorized") || texto.includes("invalid_token") || texto.includes("403")) {
    return "As credenciais do Mercado Pago foram recusadas. Confira o MP_ACCESS_TOKEN.";
  }
  return "O Mercado Pago não aceitou abrir a assinatura agora. Tente de novo em instantes.";
}

export type PreapprovalMP = {
  id: string;
  /** 'pending' | 'authorized' | 'paused' | 'cancelled' */
  status: string;
  externalReference: string | null;
};

export async function buscarPreapprovalMP(preapprovalId: string): Promise<PreapprovalMP | null> {
  const token = tokenMP();
  if (!token) return null;
  try {
    const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Erro ao buscar preapproval MP:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      id?: string;
      status?: string;
      external_reference?: string | null;
    };
    return {
      id: String(data.id ?? preapprovalId),
      status: data.status ?? "",
      externalReference: data.external_reference ?? null,
    };
  } catch (e) {
    console.error("Falha de rede ao buscar preapproval MP:", e);
    return null;
  }
}

/**
 * Uma COBRANÇA da assinatura (`authorized_payment`). O webhook de assinatura
 * (`topic=subscription_authorized_payment`) manda o id deste objeto, não o do
 * pagamento nem o da preapproval — por isso ele precisa de busca própria.
 *
 * `id` é a chave de idempotência que vai pra `assinatura_pagamentos`: é o
 * identificador estável da cobrança do mês.
 */
export type CobrancaAssinaturaMP = {
  id: string;
  /** status do PAGAMENTO por trás da cobrança ('approved', 'rejected'…). */
  status: string;
  preapprovalId: string | null;
  paymentId: string | null;
};

export async function buscarCobrancaAssinaturaMP(
  authorizedPaymentId: string,
): Promise<CobrancaAssinaturaMP | null> {
  const token = tokenMP();
  if (!token) return null;
  try {
    const res = await fetch(`${MP_API}/authorized_payments/${authorizedPaymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Erro ao buscar cobrança de assinatura MP:", res.status);
      return null;
    }
    const data = (await res.json()) as {
      id?: string | number;
      status?: string;
      preapproval_id?: string;
      payment?: { id?: string | number; status?: string };
    };
    return {
      id: String(data.id ?? authorizedPaymentId),
      status: data.payment?.status ?? data.status ?? "",
      preapprovalId: data.preapproval_id ?? null,
      paymentId: data.payment?.id != null ? String(data.payment.id) : null,
    };
  } catch (e) {
    console.error("Falha de rede ao buscar cobrança de assinatura MP:", e);
    return null;
  }
}

/** Para de cobrar o aluno. Usado quando ele cancela a renovação. */
export async function cancelarAssinaturaRecorrente(preapprovalId: string): Promise<boolean> {
  const token = tokenMP();
  if (!token) return false;
  try {
    const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) console.error("Erro ao cancelar preapproval MP:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("Falha de rede ao cancelar preapproval MP:", e);
    return false;
  }
}
