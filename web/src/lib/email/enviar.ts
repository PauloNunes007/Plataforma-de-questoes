// Camada de ENTREGA de email transacional.
//
// Por que existe: o serviço de email embutido do Supabase manda no máximo
// 2 emails por HORA no projeto inteiro e — pior — só entrega pros endereços
// da equipe do projeto. Em produção, com aluno de verdade se cadastrando,
// isso significa "ninguém recebe nada". Aqui o envio sai do Supabase e passa
// a ser nosso (ver app/api/auth/email-hook/route.ts).
//
// Provedor: Brevo (ex-Sendinblue) — 300 emails/dia no plano gratuito, sem
// cartão. Tudo que é específico dele mora NESTE arquivo: para trocar por
// Resend/SES/Postmark amanhã basta reescrever `entregarViaBrevo`, porque o
// resto do app só conhece `enviarEmail`.

export type MensagemEmail = {
  para: string;
  nomePara?: string;
  assunto: string;
  html: string;
  /** Fallback em texto puro. Nunca omita: email só-HTML pontua como spam. */
  texto: string;
};

export type ResultadoEnvio = { ok: true } | { ok: false; erro: string };

// O hook do Supabase tem orçamento de 5s pro conjunto de tentativas. Se a API
// do provedor engasgar, é melhor devolver erro (o aluno vê "tente de novo")
// do que estourar o tempo e o Supabase reportar timeout genérico.
const TIMEOUT_MS = 4000;

/** `.trim()` porque copiar/colar no painel do Vercel gruda "\n" no fim. */
function env(nome: string): string | undefined {
  const v = process.env[nome]?.trim();
  return v ? v : undefined;
}

export function remetenteConfigurado(): { email: string; nome: string } | null {
  const email = env("EMAIL_REMETENTE");
  if (!email) return null;
  return { email, nome: env("EMAIL_REMETENTE_NOME") ?? "Questly" };
}

export async function enviarEmail(msg: MensagemEmail): Promise<ResultadoEnvio> {
  const apiKey = env("BREVO_API_KEY");
  const remetente = remetenteConfigurado();

  if (!apiKey || !remetente) {
    return {
      ok: false,
      erro:
        "Envio de email não configurado no servidor (BREVO_API_KEY / EMAIL_REMETENTE). " +
        "Veja web/PUBLICAR.md.",
    };
  }

  return entregarViaBrevo(apiKey, remetente, msg);
}

async function entregarViaBrevo(
  apiKey: string,
  remetente: { email: string; nome: string },
  msg: MensagemEmail,
): Promise<ResultadoEnvio> {
  try {
    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: remetente.nome, email: remetente.email },
        to: [{ email: msg.para, ...(msg.nomePara ? { name: msg.nomePara } : {}) }],
        subject: msg.assunto,
        htmlContent: msg.html,
        textContent: msg.texto,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resposta.ok) {
      // A Brevo devolve {code, message} — o `code` é o que diz se o problema
      // é chave inválida, remetente não verificado ou cota do dia estourada.
      const corpo = await resposta.text().catch(() => "");
      return { ok: false, erro: `Brevo respondeu ${resposta.status}: ${corpo.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    return { ok: false, erro: `Falha ao chamar a Brevo: ${erro}` };
  }
}
