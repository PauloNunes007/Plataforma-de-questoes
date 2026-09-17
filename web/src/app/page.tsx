import type { Metadata } from "next";
import { LandingView } from "@/components/landing/landing-view";
import { CAMPANHA } from "@/lib/landing/campanha";
import { carregarStatsBanco } from "@/lib/landing/stats";

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
  return <LandingView stats={stats} />;
}
