import type { NextConfig } from "next";

// A Questly só tem alunos no Brasil (fuso não é configurável em nenhum
// lugar da UI), mas o servidor (Vercel) roda em UTC por padrão. Toda
// lógica de "hoje"/hora do dia (saudação, missão do dia, streak, virada
// de semana da liga) usa `new Date()` local do servidor — sem isso, esses
// cálculos ficam ~3h adiantados em produção (ex.: 22h em Brasília já
// contaria como o dia seguinte). Fixar TZ aqui, cedo o bastante pro
// processo Node inteiro (dev e cada function serverless), corrige tudo de
// uma vez em vez de reescrever cada `new Date()` espalhado pelo lib/.
process.env.TZ = "America/Sao_Paulo";

const nextConfig: NextConfig = {
  // mupdf é um pacote nativo/wasm — precisa ser resolvido em runtime pelo
  // Node, não empacotado pelo bundler do servidor (ver lib/importar/tikz-server.ts,
  // que o usa pra converter o PDF do texlive.net em SVG vetorial).
  serverExternalPackages: ["mupdf"],
  // Sem isso, abrir o dev server pelo IP da rede (pra testar no celular)
  // faz o WebSocket do HMR falhar (ERR_INVALID_HTTP_RESPONSE) e a página
  // trava com opacidade 0 antes das animações do Framer Motion rodarem —
  // só em `next dev`, não afeta o build de produção.
  allowedDevOrigins: ["192.168.1.123"],
};

export default nextConfig;
