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
    // 30s cobria "dei uma olhada no ranking e voltei", mas não cobre uma
    // sessão de estudo: quem responde uma lista de 20 questões leva vários
    // minutos, e ao voltar pagava o round-trip inteiro de novo em toda aba.
    // 180s é a duração de um vaivém de verdade.
    //
    // O que tornou isso seguro foi o passo que faltava (2026-09-18): a
    // afirmação de que "toda escrita chama router.refresh()/revalidatePath"
    // simplesmente NÃO era verdade — o caminho mais quente do app, fechar uma
    // lista de questões, não invalidava nada, e a home voltava mostrando o XP
    // de antes. `finalizarMissaoAction` agora revalida /dashboard, /trilha,
    // /ranking e /calendario (lib/questao/actions.ts). Sem aquela linha, subir
    // este número faria a plataforma mentir por 3 minutos.
    staleTimes: { dynamic: 180, static: 300 },

    // Prefetch do CONTEÚDO dinâmico por intenção de navegação (mouse em cima
    // no desktop, dedo encostado no celular) — não só da casca estática do
    // loading.tsx.
    //
    // ATENÇÃO: esta flag é metade do interruptor. O Next 16 só promove o
    // prefetch a `FetchStrategy.Full` quando ela E o prop
    // `unstable_dynamicOnHover` do <Link> estão ligados os dois (ver
    // next/dist/client/components/links.js, onNavigationIntent). De
    // 2026-09-17 até 2026-09-18 só esta linha existia, e por isso ela não
    // fazia absolutamente nada: quem passa o prop é components/nav-link.tsx,
    // usado pelas abas do header e da barra inferior. Ligar uma sem a outra
    // é ligar nada.
    dynamicOnHover: true,
  },
};

export default nextConfig;
