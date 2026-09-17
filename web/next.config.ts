import type { NextConfig } from "next";

// A Expectrum só tem alunos no Brasil (fuso não é configurável em nenhum
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

  experimental: {
    // NAVEGAÇÃO ENTRE ABAS (2026-09-17). O que deixava a troca de aba
    // "lerda" não era o servidor: era o Next não guardar NADA do que já
    // tinha buscado. Por padrão, `staleTimes.dynamic` é 0 — toda página
    // protegida é dinâmica (lê a sessão), então voltar pro Início 5s depois
    // refazia o round-trip inteiro e o aluno olhava pro esqueleto de novo.
    //
    // 30s é o intervalo em que ir e voltar entre abas é a MESMA sessão de
    // uso ("dei uma olhada no ranking e voltei"). Passou disso, busca de
    // novo. Toda escrita do app chama `router.refresh()`/`revalidatePath`,
    // que invalidam este cache — ou seja, responder questão, marcar tarefa
    // ou fechar simulado continuam refletindo na hora; o que o cache segura
    // é só o vaivém sem escrita nenhuma no meio.
    staleTimes: { dynamic: 30, static: 180 },

    // Prefetch do conteúdo dinâmico no hover (não só do loading.tsx). No
    // desktop, os ~200ms entre passar o mouse e clicar já bastam pro payload
    // chegar, e a troca vira instantânea. No celular não existe hover, então
    // isso não gera requisição nenhuma a mais lá.
    dynamicOnHover: true,
  },
};

export default nextConfig;
