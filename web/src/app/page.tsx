import type { Metadata } from "next";
import { LandingView } from "@/components/landing/landing-view";

export const metadata: Metadata = {
  title: "Questly — Estude o que importa. Passe em todas as provas.",
  description:
    "Plataforma gamificada de estudos que equilibra as disciplinas do seu semestre por urgência, ponto fraco e meta de nota — pra você chegar preparado em todas as provas.",
};

export default function Home() {
  return <LandingView />;
}
