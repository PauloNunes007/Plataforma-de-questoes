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
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.expectrum.com.br";
