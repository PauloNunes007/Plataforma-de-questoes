import type { MetadataRoute } from "next";

// O manifest que torna a Expectrum instalável.
//
// Duas coisas dependem dele, e a segunda é a que importa pra retenção:
//
//  1. o app ganha ícone na tela inicial do celular — um gatilho diário
//     passivo que não custa notificação nenhuma. Quem instalou abre mais, e
//     abrir é a metade difícil do hábito;
//  2. no iOS (16.4+), Web Push **só funciona em PWA instalado**. Sem este
//     arquivo, metade da base fica fora do lembrete de ofensiva por uma
//     limitação de plataforma, não por escolha.
//
// `display: standalone` tira a barra do navegador: a tela de questão vira uma
// tela de app, o que importa numa prova cronometrada. `start_url` aponta pro
// dashboard, e não pra raiz, porque a raiz é a landing de marketing — quem
// instalou já é aluno e cair numa página de venda seria um passo a mais toda
// vez.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expectrum — questões e provas",
    short_name: "Expectrum",
    description:
      "Banco de questões, simulados de provas antigas e acompanhamento do seu semestre.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#055f38",
    lang: "pt-BR",
    categories: ["education"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // `maskable` é o que evita o ícone aparecer dentro de um quadrado branco
      // no Android — a marca já é um quadrado cheio de cor, então serve nas
      // duas funções sem uma arte separada.
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
