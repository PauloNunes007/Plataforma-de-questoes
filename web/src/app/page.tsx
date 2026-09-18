import type { Metadata } from "next";
import { LandingView } from "@/components/landing/landing-view";
import { CAMPANHA } from "@/lib/landing/campanha";
import { carregarStatsBanco } from "@/lib/landing/stats";
import { PERGUNTAS } from "@/lib/landing/faq-dados";
import { APP_URL } from "@/lib/app-url";

// Revalida de hora em hora: os números do banco mudam devagar (o importador é
// manual) e a landing é a página mais acessada — não faz sentido consultar o
// Supabase a cada visita.
export const revalidate = 3600;

const TITULO = CAMPANHA.ativa
  ? `Expectrum — Simulados e questões de provas antigas da ${CAMPANHA.instituicao}`
  : "Expectrum — Treine com a prova de verdade. Chegue pronto na sua.";

const DESCRICAO = CAMPANHA.ativa
  ? `Questões de ${CAMPANHA.materiaLabel} da ${CAMPANHA.instituicao} catalogadas tópico a tópico: monte listas e simulados cronometrados com questões reais de provas anteriores, com resolução passo a passo, e acompanhe seu aproveitamento assunto por assunto.`
  : "Banco de questões de provas antigas com resolução passo a passo, simulados cronometrados e a ementa da sua disciplina num mapa — você escolhe o que praticar.";

export const metadata: Metadata = {
  // `absolute` porque o TITULO já carrega a marca — sem isso o template do
  // layout ("%s · Expectrum") deixaria "Expectrum … · Expectrum".
  title: { absolute: TITULO },
  description: DESCRICAO,
  keywords: [
    "simulado",
    "provas antigas",
    "questões resolvidas",
    CAMPANHA.instituicao,
    `${CAMPANHA.materiaLabel} ${CAMPANHA.instituicao}`,
    "banco de questões",
    "universitário",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: "/",
    type: "website",
  },
};

export default async function Home() {
  const stats = await carregarStatsBanco();

  // DADOS ESTRUTURADOS (2026-09-18). As páginas de prova já publicavam os
  // seus (CollectionPage/ItemList); a landing, que é a raiz do site, não
  // publicava nenhum — o Google tinha que adivinhar o nome da marca, o site
  // oficial e do que a página trata a partir do texto solto.
  //
  // São três coisas num grafo só, porque são três afirmações diferentes:
  //   • WebSite      — este domínio é o site da Expectrum (é o que permite o
  //                    nome da marca aparecer no lugar da URL no resultado);
  //   • Organization — quem publica;
  //   • FAQPage      — as perguntas da própria landing, lidas do MESMO módulo
  //                    que o acordeão renderiza (lib/landing/faq-dados.ts),
  //                    nunca de uma segunda cópia. É o formato que o Google
  //                    pode abrir direto na página de resultados.
  //
  // Nada aqui é promessa de posição: dado estruturado não sobe ranking, ele
  // deixa o resultado mais informativo pra quem já chegou nele.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#site`,
        url: APP_URL,
        name: "Expectrum",
        inLanguage: "pt-BR",
        description: DESCRICAO,
        publisher: { "@id": `${APP_URL}/#org` },
      },
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#org`,
        name: "Expectrum",
        url: APP_URL,
        logo: `${APP_URL}/icon.svg`,
        description:
          "Plataforma de estudo para universitários: banco de questões de provas antigas com resolução, simulados cronometrados e acompanhamento por tópico da ementa.",
      },
      {
        "@type": "FAQPage",
        "@id": `${APP_URL}/#faq`,
        mainEntity: PERGUNTAS.map((q) => ({
          "@type": "Question",
          name: q.p,
          acceptedAnswer: { "@type": "Answer", text: q.r },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // O JSON é montado aqui a partir de constantes nossas — não há entrada
        // de usuário nenhuma neste objeto.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingView stats={stats} />
    </>
  );
}
