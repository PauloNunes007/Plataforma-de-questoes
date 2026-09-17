import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CascaPublica } from "@/components/provas/casca";
import { ProvaDetalhe } from "@/components/provas/prova-detalhe";
import { carregarCatalogoProvas, carregarProvaPublica } from "@/lib/provas/catalogo";
import { APP_URL } from "@/lib/app-url";

// Uma página por prova antiga. É aqui que mora o tráfego de busca: ninguém
// procura "plataforma de questões de física", mas muita gente procura "p2 de
// física 2 uff 2024". Cada página responde uma dessas buscas e devolve o
// leitor pro catálogo e pras provas irmãs.
//
// Uma prova de 2023 não muda: cache longo, e todas são pré-geradas no build.
export const revalidate = 86400;

// `dynamicParams = false` é o que faz uma URL inventada devolver 404 DE
// VERDADE. Com ele ligado (o padrão), quem pedisse /provas/fisica-uff/qualquer
// -coisa recebia a página "Prova não encontrada" com status 200 — um soft 404,
// e justo na rota que só existe pra ser indexada: o Google passaria a listar
// uma página de erro por slug inventado. Aqui o roteador recusa antes de
// chegar no nosso código, e só os slugs de `generateStaticParams` existem.
//
// O preço: uma prova importada depois do build só aparece no deploy seguinte.
// É aceitável porque importar prova já é operação manual e rara — mas é bom
// saber que o passo existe.
export const dynamicParams = false;

type Params = { prova: string };

/** Pré-gera as provas do acervo. Se o banco não responder no build, a lista
 *  volta vazia e cada página é gerada sob demanda (dynamicParams é o padrão) —
 *  o build nunca quebra por causa disto. */
export async function generateStaticParams(): Promise<Params[]> {
  const catalogo = await carregarCatalogoProvas();
  return catalogo.grupos.flatMap((g) => g.provas.map((p) => ({ prova: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { prova: slug } = await params;
  const dados = await carregarProvaPublica(slug);
  if (!dados) return { title: "Prova não encontrada" };

  const { prova, topicos } = dados;
  // O título é exatamente como o aluno escreve a busca — disciplina, prova,
  // período e sigla, nessa ordem.
  const titulo = `${prova.materiaNome} UFF — ${prova.prova} de ${prova.periodo} (${prova.questoes} questões resolvidas)`;
  const assuntos = topicos.slice(0, 4).map((t) => t.nome).join(", ");
  const descricao = `A ${prova.prova} de ${prova.periodo} de ${prova.materiaNome} da UFF, completa e digitada do original: ${prova.questoes} questões com resolução passo a passo${assuntos ? `, cobrindo ${assuntos}` : ""}. Refaça cronometrada ou treine só o assunto que cai.`;

  return {
    title: { absolute: `${titulo} · Expectrum` },
    description: descricao,
    alternates: { canonical: `/provas/fisica-uff/${slug}` },
    openGraph: {
      title: titulo,
      description: descricao,
      url: `/provas/fisica-uff/${slug}`,
      type: "article",
    },
  };
}

export default async function PaginaProva({ params }: { params: Promise<Params> }) {
  const { prova: slug } = await params;
  const [dados, catalogo] = await Promise.all([
    carregarProvaPublica(slug),
    carregarCatalogoProvas(),
  ]);

  // Slug fora do formato ou prova fora do acervo: 404 é a verdade nos dois
  // casos, e evita que uma URL inventada vire página indexável vazia.
  if (!dados) notFound();

  const irmas = catalogo.grupos
    .find((g) => g.materiaNome === dados.prova.materiaNome)
    ?.provas.filter((p) => p.codigo !== dados.prova.codigo)
    .slice(0, 6) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: `${dados.prova.materiaNome} UFF — ${dados.prova.prova} de ${dados.prova.periodo}`,
    url: `${APP_URL}/provas/fisica-uff/${slug}`,
    inLanguage: "pt-BR",
    educationalLevel: "Ensino superior",
    numberOfQuestions: dados.prova.questoes,
    about: dados.topicos.map((t) => ({ "@type": "Thing", name: t.nome })),
    isPartOf: {
      "@type": "CollectionPage",
      name: "Provas antigas de Física I e II da UFF",
      url: `${APP_URL}/provas/fisica-uff`,
    },
  };

  return (
    <CascaPublica>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProvaDetalhe dados={dados} irmas={irmas} />
    </CascaPublica>
  );
}
