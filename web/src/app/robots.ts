import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://questly.com.br";

// Só a landing e o login são públicos; tudo atrás de /(protected) exige sessão
// e não deve ser rastreado (o proxy já redireciona, mas o Disallow evita que o
// Google gaste rastreio e indexe URLs de redirect).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard",
        "/questao",
        "/questoes",
        "/simulados",
        "/trilha",
        "/ranking",
        "/configuracoes",
        "/onboarding",
        "/importar",
        "/admin",
        "/aprovacao",
        "/pro",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
