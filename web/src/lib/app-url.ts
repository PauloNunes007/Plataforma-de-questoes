// A URL pública do app, num lugar só.
//
// Existia copiada em quatro arquivos (layout, robots, sitemap, linkConvite) e
// foi isso que quebrou o preview de link: o fallback apontava pro domínio sem
// `www`, mas a Vercel serve o site no `www` e responde 308 no apex. O
// `og:image` virava um redirect — e crawler de rede social costuma descartar
// imagem que não responde 200 direto, então o WhatsApp caía no preview
// pequeno com um recorte quadrado do cartão.
//
// Se o host canônico mudar, muda aqui (e na env var da Vercel), não em quatro
// lugares. `NEXT_PUBLIC_APP_URL` continua mandando quando está definida.
//
// A NORMALIZAÇÃO ABAIXO (2026-09-18) existe porque o mesmo bug voltou por
// outra porta: a env var da Vercel estava valendo `https://expectrum.com.br`
// (apex), e o fallback certo aqui nunca chegava a ser usado. Em produção isso
// significava `<link rel="canonical">`, `og:url`, `og:image` e as 34 URLs do
// sitemap.xml TODAS apontando pro apex, que responde 308 pro www — ou seja, o
// Google recebia um sitemap inteiro de redirects e uma canônica que não é a
// página que ele acabou de baixar. Um host canônico não pode depender de
// alguém ter digitado o `www.` numa caixa de texto do painel: aqui a regra
// fica no código, e a env var só escolhe o DOMÍNIO, não o subdomínio.
const HOST_CANONICO = "www.expectrum.com.br";
const PADRAO = `https://${HOST_CANONICO}`;

function canonicalizar(bruta: string | undefined): string {
  if (!bruta) return PADRAO;
  try {
    const url = new URL(bruta.trim());
    // Apex do nosso domínio → www. Qualquer outro host (preview da Vercel,
    // localhost, um domínio novo) passa intocado: a regra é sobre ESTE
    // domínio, não sobre todo mundo.
    if (url.hostname === "expectrum.com.br") url.hostname = HOST_CANONICO;
    // `origin` derruba caminho, querystring e barra final de uma vez — todo
    // chamador daqui concatena `/algo`, e `.../ ` + `/algo` vira `//algo`.
    return url.origin;
  } catch {
    return PADRAO;
  }
}

export const APP_URL = canonicalizar(process.env.NEXT_PUBLIC_APP_URL);
