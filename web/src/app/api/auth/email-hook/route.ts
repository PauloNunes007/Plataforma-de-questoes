import { NextResponse } from "next/server";
import crypto from "crypto";
import { enviarEmail } from "@/lib/email/enviar";
import { montarEmailAuth, type TipoAcaoEmail } from "@/lib/email/templates-auth";

// ── Send Email Hook do Supabase Auth ────────────────────────────────────────
//
// POR QUE ESTA ROTA EXISTE
// O serviço de email embutido do Supabase manda 2 emails por HORA no projeto
// todo e só entrega pra endereços da equipe — ou seja, aluno nenhum recebia
// confirmação de cadastro. Com o hook ligado (Dashboard → Authentication →
// Hooks → Send Email), o Supabase PARA de mandar email e chama esta rota; nós
// entregamos pela Brevo e o teto vira o do plano da Brevo (300/dia no
// gratuito), configurável em Authentication → Rate Limits.
//
// O que NÃO muda: o Supabase continua sendo a fonte da verdade do token, da
// expiração, do uso único e do `email_confirmed_at`. Nós só somos o carteiro.
// Nenhum token é gerado, guardado ou validado por código nosso.
//
// ORÇAMENTO DE TEMPO: 5s pro conjunto de tentativas (o Supabase repete até 3x
// em 429/503, com 2s entre elas). Por isso o fetch da Brevo tem timeout de 4s.

export const runtime = "nodejs";
// Nada aqui pode ser pré-renderizado nem cacheado: é POST autenticado por HMAC.
export const dynamic = "force-dynamic";

type PayloadHook = {
  user?: { email?: string; user_metadata?: { nome?: string } | null } | null;
  email_data?: {
    token?: string;
    token_hash?: string;
    email_action_type?: string;
    redirect_to?: string;
    site_url?: string;
  } | null;
};

const TOLERANCIA_SEGUNDOS = 5 * 60;

/**
 * Verificação de assinatura do padrão Standard Webhooks (o que o Supabase usa
 * nos Auth Hooks). Feita à mão com node:crypto em vez de puxar a lib
 * `standardwebhooks`: são ~30 linhas, e uma dependência a menos numa rota que
 * é a porta de entrada de um endpoint público vale mais que a conveniência.
 *
 * Conteúdo assinado: `{id}.{timestamp}.{corpo cru}`
 * Header `webhook-signature`: lista separada por espaço de `v1,<base64>` —
 * mais de uma quando o segredo está em rotação.
 */
function assinaturaValida(headers: Headers, corpoCru: string, segredoBruto: string): boolean {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const assinaturas = headers.get("webhook-signature");
  if (!id || !timestamp || !assinaturas) return false;

  // Janela de tolerância: barra replay de uma captura antiga.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > TOLERANCIA_SEGUNDOS) return false;

  // No painel do Supabase o segredo aparece como `v1,whsec_<base64>`. A chave
  // real é o base64 DEPOIS do `whsec_` — decodificado, não a string.
  const semVersao = segredoBruto.replace(/^v1,/, "");
  const base64 = semVersao.replace(/^whsec_/, "");
  let chave: Buffer;
  try {
    chave = Buffer.from(base64, "base64");
  } catch {
    return false;
  }
  if (chave.length === 0) return false;

  const esperada = crypto
    .createHmac("sha256", chave)
    .update(`${id}.${timestamp}.${corpoCru}`)
    .digest();

  for (const item of assinaturas.split(" ")) {
    const [versao, valor] = item.split(",");
    if (versao !== "v1" || !valor) continue;
    const recebida = Buffer.from(valor, "base64");
    if (recebida.length !== esperada.length) continue;
    if (crypto.timingSafeEqual(recebida, esperada)) return true;
  }
  return false;
}

const TIPOS_CONHECIDOS: TipoAcaoEmail[] = [
  "signup",
  "recovery",
  "magiclink",
  "invite",
  "email_change",
  "email_change_current",
  "email_change_new",
];

function normalizarTipo(bruto: string | undefined): TipoAcaoEmail {
  const t = (bruto ?? "").toLowerCase();
  return (TIPOS_CONHECIDOS as string[]).includes(t) ? (t as TipoAcaoEmail) : "signup";
}

/**
 * O link do email aponta pra NOSSA rota /auth/confirm (que faz verifyOtp no
 * servidor), não pro /auth/v1/verify do Supabase. Diferença que importa: o
 * token_hash é verificado server-side e a sessão entra nos cookies na hora,
 * então o link funciona mesmo aberto em outro navegador/aparelho — o clássico
 * "cliquei no link do celular e caí deslogado" morre aqui.
 */
function montarLink(tipo: TipoAcaoEmail, tokenHash: string, base: string): string {
  const url = new URL("/auth/confirm", base);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", tipo === "email_change_new" ? "email_change" : tipo);
  return url.toString();
}

function baseDoApp(payload: PayloadHook): string {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configurada) return configurada.replace(/\/+$/, "");
  // Fallback: o que o próprio Supabase mandou (Site URL do projeto).
  const doPayload = payload.email_data?.site_url || payload.email_data?.redirect_to;
  if (doPayload) {
    try {
      return new URL(doPayload).origin;
    } catch {
      /* segue pro erro abaixo */
    }
  }
  return "";
}

function erro(mensagem: string, status: number) {
  // Formato que o Supabase Auth entende e propaga pro cliente.
  return NextResponse.json({ error: { http_code: status, message: mensagem } }, { status });
}

export async function POST(req: Request) {
  const segredo = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  if (!segredo) {
    console.error("[email-hook] SEND_EMAIL_HOOK_SECRET ausente — hook recusado.");
    return erro("Hook de email não configurado no servidor.", 500);
  }

  // Precisa ser o corpo CRU: qualquer reserialização muda os bytes e a
  // assinatura deixa de bater.
  const corpoCru = await req.text();

  if (!assinaturaValida(req.headers, corpoCru, segredo)) {
    return erro("Assinatura do webhook inválida.", 401);
  }

  let payload: PayloadHook;
  try {
    payload = JSON.parse(corpoCru) as PayloadHook;
  } catch {
    return erro("Corpo inválido.", 400);
  }

  const email = payload.user?.email;
  const dados = payload.email_data;
  if (!email || !dados?.token_hash) {
    return erro("Payload sem email ou token_hash.", 400);
  }

  const base = baseDoApp(payload);
  if (!base) {
    console.error("[email-hook] Sem NEXT_PUBLIC_APP_URL e sem site_url no payload.");
    return erro("URL do app não configurada no servidor.", 500);
  }

  const tipo = normalizarTipo(dados.email_action_type);
  const { assunto, html, texto } = montarEmailAuth({
    tipo,
    nome: payload.user?.user_metadata?.nome ?? "",
    codigo: dados.token ?? "",
    link: montarLink(tipo, dados.token_hash, base),
  });

  const envio = await enviarEmail({
    para: email,
    nomePara: payload.user?.user_metadata?.nome || undefined,
    assunto,
    html,
    texto,
  });

  if (!envio.ok) {
    // Falha FECHADA de propósito: melhor o aluno ver "não conseguimos enviar,
    // tente de novo" do que a tela dizer "confira seu email" sobre um email
    // que nunca vai chegar.
    console.error("[email-hook] Falha ao enviar:", envio.erro);
    return erro("Não foi possível enviar o email agora. Tente de novo em instantes.", 500);
  }

  return NextResponse.json({});
}
