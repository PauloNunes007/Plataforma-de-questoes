import type { Metadata } from "next";
import { CascaPublica } from "@/components/provas/casca";
import { CatalogoFisicaUff } from "@/components/provas/catalogo-fisica-uff";
import { carregarCatalogoProvas } from "@/lib/provas/catalogo";
import { APP_URL } from "@/lib/app-url";

// Hub público do acervo de provas antigas de Física da UFF.
//
// Rota PÚBLICA (ver PREFIXOS_PUBLICOS em src/proxy.ts) e indexável: é ela que
// responde a busca "prova antiga de física da UFF" e traz gente que nunca
// ouviu falar da Expectrum. Mandar esse visitante pro /login mataria o único
// motivo de a página existir.
//
// Revalida de hora em hora, como a landing: o catálogo só muda quando alguém
// importa uma prova nova, o que é manual e raro.
export const revalidate = 3600;

const TITULO = "Provas antigas de Física I e II da UFF — resolvidas e por assunto";
const DESCRICAO =
  "Acervo de provas de Física I e Física II aplicadas na UFF, digitadas do original e catalogadas tópico a tópico. Refaça a prova completa cronometrada ou monte listas só do assunto que cai, com resolução passo a passo.";

export const metadata: Metadata = {
  title: { absolute: `${TITULO} · Expectrum` },
  description: DESCRICAO,
  keywords: [
    "provas antigas UFF",
    "prova de física 1 UFF",
    "prova de física 2 UFF",
    "física I UFF",
    "física II UFF",
    "P1 física UFF",
    "P2 física UFF",
    "gabarito física UFF",
    "questões resolvidas física",
  ],
  alternates: { canonical: "/provas/fisica-uff" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: "/provas/fisica-uff",
    type: "website",
  },
};

export default async function ProvasFisicaUff() {
  const catalogo = await carregarCatalogoProvas();

  // ItemList em vez de só CollectionPage: o que o Google precisa entender aqui
  // é que a página é um ÍNDICE de N provas, cada uma com página própria — é o
  // que conecta o hub às 31 páginas de cauda longa.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITULO,
    description: DESCRICAO,
    url: `${APP_URL}/provas/fisica-uff`,
    inLanguage: "pt-BR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: catalogo.totalProvas,
      itemListElement: catalogo.grupos.flatMap((g) =>
        g.provas.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${g.materiaNome} · ${p.prova} de ${p.periodo} (UFF)`,
          url: `${APP_URL}/provas/fisica-uff/${p.slug}`,
        })),
      ),
    },
  };

  return (
    <CascaPublica>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CatalogoFisicaUff catalogo={catalogo} />
    </CascaPublica>
  );
}
