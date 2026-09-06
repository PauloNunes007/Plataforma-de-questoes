import type { Metadata } from "next";
import { LandingView } from "@/components/landing/landing-view";
import { CAMPANHA } from "@/lib/landing/campanha";
import { carregarStatsBanco } from "@/lib/landing/stats";

// Revalida de hora em hora: os números do banco mudam devagar (o importador é
// manual) e a landing é a página mais acessada — não faz sentido consultar o
// Supabase a cada visita.
export const revalidate = 3600;

const TITULO = CAMPANHA.ativa
  ? `Questly — Simulados e questões de provas antigas da ${CAMPANHA.instituicao}`
  : "Questly — Estude o que importa. Passe em todas as provas.";

const DESCRICAO = CAMPANHA.ativa
  ? `Questões de ${CAMPANHA.materiaLabel} da ${CAMPANHA.instituicao} catalogadas tópico a tópico: monte simulados cronometrados com questões reais de provas anteriores, com resolução passo a passo, e receba um plano de estudos por dia.`
  : "Plataforma de estudos que equilibra as disciplinas do seu semestre por urgência, ponto fraco e meta de nota — com simulados cronometrados e questões de provas antigas.";

export const metadata: Metadata = {
  // `absolute` porque o TITULO já carrega a marca — sem isso o template do
  // layout ("%s · Questly") deixaria "Questly … · Questly".
  title: { absolute: TITULO },
  description: DESCRICAO,
  keywords: [
    "simulado",
    "provas antigas",
    "questões resolvidas",
    CAMPANHA.instituicao,
    `${CAMPANHA.materiaLabel} ${CAMPANHA.instituicao}`,
    "plano de estudos",
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
