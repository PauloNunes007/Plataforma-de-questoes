import type { NextConfig } from "next";

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
