import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { APP_URL } from "@/lib/app-url";
import "katex/dist/katex.min.css";
import "./globals.css";

// Redesign 2026-07: Fredoka/Nunito (arredondadas, tom lúdico) deram lugar a
// Geist — tipografia neutra e refinada, adequada a leitura longa e à
// identidade "SaaS premium" pedida pro público universitário.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Expectrum — Estude o que importa",
    // Cada página define o próprio título; o sufixo mantém a marca visível na
    // aba e no histórico sem cada page.tsx repetir "— Expectrum".
    template: "%s · Expectrum",
  },
  description:
    "Plano de estudos diário, simulados cronometrados e questões de provas antigas pra universitário passar em todas as matérias do semestre.",
  applicationName: "Expectrum",
  authors: [{ name: "Expectrum" }],
  robots: { index: true, follow: true },
  // Verificação do Google Search Console. Sem estar verificado lá, não há como
  // ENVIAR o sitemap nem pedir indexação — e um domínio novo, sem nenhum link
  // externo apontando pra ele, pode ficar meses sem ser descoberto sozinho.
  // (Em 2026-09-18 o site não tinha uma única página no índice.)
  //
  // Vem de env var porque o token é por propriedade do Search Console: quem
  // criar a propriedade cola o valor em NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // na Vercel. Sem a var, a tag simplesmente não sai — verificar por registro
  // DNS TXT no domínio funciona igual e dispensa isto.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    siteName: "Expectrum",
    locale: "pt_BR",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Expectrum", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
