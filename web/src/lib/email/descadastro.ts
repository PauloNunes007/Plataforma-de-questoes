// Link de descadastro assinado.
//
// O link do rodapé da campanha chega SEM sessão — o aluno clica direto da
// caixa de entrada. Então ele precisa se autenticar sozinho, e a única coisa
// que ele carrega é o id do usuário. Sem assinatura, qualquer pessoa que
// descobrisse um uuid poderia descadastrar outra — e uuid vaza fácil (ele
// aparece em URL de imagem do Storage, por exemplo).
//
// A assinatura é um HMAC-SHA256 truncado em 16 bytes (128 bits): forjar exige
// o segredo, e 128 bits é folgado pra um link que não dá acesso a nada além de
// uma preferência de contato reversível.
//
// SEGREDO: `EMAIL_DESCADASTRO_SECRET` se existir; senão deriva da
// SUPABASE_SERVICE_ROLE_KEY — que já é obrigatória no servidor, nunca chega ao
// browser e tem entropia de sobra. É derivação (HMAC com rótulo fixo), não uso
// direto: nada do token permite voltar à chave.

import crypto from "crypto";

const ROTULO = "questly:descadastro:v1";

function chave(): Buffer {
  const dedicado = process.env.EMAIL_DESCADASTRO_SECRET?.trim();
  if (dedicado) return Buffer.from(dedicado, "utf8");

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!service) {
    throw new Error(
      "Nem EMAIL_DESCADASTRO_SECRET nem SUPABASE_SERVICE_ROLE_KEY estão configuradas — " +
        "sem elas não é possível assinar o link de descadastro.",
    );
  }
  return crypto.createHmac("sha256", service).update(ROTULO).digest();
}

export function assinarDescadastro(userId: string): string {
  return crypto.createHmac("sha256", chave()).update(userId).digest("base64url").slice(0, 22);
}

export function descadastroValido(userId: string, token: string): boolean {
  if (!userId || !token) return false;
  const esperado = Buffer.from(assinarDescadastro(userId), "utf8");
  const recebido = Buffer.from(token, "utf8");
  if (esperado.length !== recebido.length) return false;
  return crypto.timingSafeEqual(esperado, recebido);
}

/** URL absoluta — e-mail não tem "origem" pra resolver caminho relativo. */
export function linkDescadastro(base: string, userId: string): string {
  const url = new URL("/api/email/descadastrar", base);
  url.searchParams.set("u", userId);
  url.searchParams.set("t", assinarDescadastro(userId));
  return url.toString();
}
