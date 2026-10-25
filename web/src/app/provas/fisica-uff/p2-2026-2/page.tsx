import type { Metadata } from "next";
import { CascaPublica } from "@/components/provas/casca";
import { P2Comentada, type ExtrasProva } from "@/components/provas/p2-comentada";
import { PROVAS_P2_2026_2, ROTA_P2_2026_2 } from "@/lib/provas/p2-2026-2";
import { contarQuestoesMateria, contarTopicosP3 } from "@/lib/provas/p2-2026-2-treino";

// Gabarito comentado da P2 de 2026.2 de Física I e Física 2 da UFF — a página
// que vai pro grupo da turma antes da P3. Pasta estática, então tem precedência
// sobre a rota dinâmica irmã [prova] (que só conhece as provas do acervo).
//
// A prova é conteúdo estático; o que vem do banco são só as contagens (quantas
// questões existem pra P3). A página é dinâmica por causa do `?treino=` de
// erro, e as contagens são quatro leituras agregadas baratas.

const TITULO = "Gabarito comentado da P2 de Física I e Física 2 da UFF (2026.2)";
const DESCRICAO =
  "A P2 de 17/10/2026 de Física I e Física Teórica 2 da UFF resolvida questão por questão, com o erro de cada alternativa errada explicado — e duas provas parecidas pra treinar antes da P3.";

export const metadata: Metadata = {
  title: { absolute: `${TITULO} · Expectrum` },
  description: DESCRICAO,
  alternates: { canonical: ROTA_P2_2026_2 },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: ROTA_P2_2026_2,
    type: "article",
  },
};

export default async function PaginaP2Comentada({
  searchParams,
}: {
  searchParams: Promise<{ treino?: string }>;
}) {
  const { treino } = await searchParams;

  const extras: ExtrasProva[] = await Promise.all(
    PROVAS_P2_2026_2.map(async (p) => {
      const [totalBanco, p3] = await Promise.all([
        contarQuestoesMateria(p.materiaBanco),
        contarTopicosP3(p),
      ]);
      return { chave: p.chave, totalBanco, p3 };
    }),
  );

  return (
    <CascaPublica>
      <P2Comentada
        provas={PROVAS_P2_2026_2}
        extras={extras}
        treinoIndisponivel={treino === "indisponivel"}
      />
    </CascaPublica>
  );
}
