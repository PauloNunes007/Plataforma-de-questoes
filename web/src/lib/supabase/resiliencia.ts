// Diagnóstico + retentativa pra chamadas que saem pro Supabase por um
// caminho MENOS testado que o normal do app.
//
// A maioria das escritas privilegiadas daqui (XP, liga, Pro, questões) passa
// por PostgREST via service_role — código que roda toda hora e já mostrou o
// que quebra. `auth.admin.*` (API Admin do GoTrue) é outra porta: pisada só
// pelo disparo de campanha (lib/email/campanha.ts, `listUsers`), e foi
// justamente ela que um dia falhou com uma mensagem imprestável:
// "Falha ao listar contas: {"url":"https://.../auth/v1/admin/users?..."}"
//
// A causa dessa mensagem inútil: o auth-js, quando o `fetch()` rejeita com
// algo que não tem `.message`/`.msg`/`.error`/`.error_description` (um erro
// de rede cru, por exemplo — não um AuthApiError com corpo JSON), cai no
// fallback `JSON.stringify(erro)`. Se o objeto rejeitado só tem `url` como
// propriedade própria enumerável (comum em falha de fetch a nível de
// transporte), é isso que sobra. `descreverErro` amplia essa rede — puxa
// nome/status/causa além de `.message` — e `comRetentativa` cobre o caso mais
// comum desse tipo de falha (engasgo passageiro de rede entre a function da
// Vercel e o Supabase), que o supabase-js não reencaminha sozinho.

/** Tira o máximo de sinal possível de um erro de forma que NUNCA lança —
 *  mesmo que `erro` seja `null`/`undefined`/um objeto sem nada útil. */
export function descreverErro(erro: unknown): string {
  if (erro instanceof Error) {
    const partes = [erro.name, erro.message].filter(Boolean);
    // `cause` é onde undici/Node guardam o motivo real de um "fetch failed"
    // (ECONNRESET, timeout, DNS…) — sem isso a mensagem some no genérico.
    const causa = (erro as { cause?: unknown }).cause;
    if (causa) partes.push(`causa: ${descreverErro(causa)}`);
    return partes.join(" — ") || "erro sem mensagem";
  }

  if (erro && typeof erro === "object") {
    const obj = erro as Record<string, unknown>;
    const campos = ["status", "code", "name", "message", "msg", "error", "error_description", "url"]
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${k}=${String(obj[k])}`);
    if (campos.length > 0) return campos.join(" ");
    try {
      return JSON.stringify(obj);
    } catch {
      return String(obj);
    }
  }

  return String(erro);
}

/**
 * Repete uma chamada que falhou por um jeito que parece transporte (não um
 * erro de negócio — "não autorizado", "não encontrado" não devem ser
 * retentados, e a função que passar aqui já devolve esses casos como
 * `{data, error}` sem lançar, então só cai aqui exceção de verdade).
 *
 * Backoff curto de propósito: a function tem orçamento de segundos
 * (`maxDuration` da página que chama isto), e isto roda DENTRO de um loop de
 * páginas que já pode rodar várias vezes — não dá pra ser generoso.
 */
export async function comRetentativa<T>(
  chamar: () => Promise<T>,
  rotulo: string,
  tentativas = 3,
): Promise<T> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      return await chamar();
    } catch (erro) {
      ultimoErro = erro;
      console.error(`[resiliencia] ${rotulo} — tentativa ${tentativa}/${tentativas} falhou:`, descreverErro(erro));
      if (tentativa < tentativas) {
        // 300ms, 900ms — o suficiente pra um engasgo passageiro passar, sem
        // comer o orçamento da function.
        await new Promise((resolve) => setTimeout(resolve, 300 * 3 ** (tentativa - 1)));
      }
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error(descreverErro(ultimoErro));
}
