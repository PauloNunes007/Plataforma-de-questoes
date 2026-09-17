import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/app-url";
import { carregarCatalogoProvas } from "@/lib/provas/catalogo";

// O acervo público de provas antigas entra aqui uma URL por prova: são elas
// que respondem a busca de cauda longa ("p2 de física 2 uff 2024") e o
// sitemap é o que garante que o Google as descubra sem depender de alguém
// linkar cada uma. Se o catálogo não responder, o sitemap sai só com as
// páginas fixas em vez de falhar.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();
  const catalogo = await carregarCatalogoProvas();

  const provas: MetadataRoute.Sitemap = catalogo.grupos.flatMap((g) =>
    g.provas.map((p) => ({
      url: `${APP_URL}/provas/fisica-uff/${p.slug}`,
      lastModified: agora,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  );

  return [
    { url: APP_URL, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    {
      url: `${APP_URL}/provas/fisica-uff`,
      lastModified: agora,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...provas,
    { url: `${APP_URL}/login`, lastModified: agora, changeFrequency: "monthly", priority: 0.5 },
  ];
}
