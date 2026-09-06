import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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

// URL pública do app — base pras URLs absolutas de canonical/OpenGraph. Sem
// isso o Next avisa no build e os previews de link (WhatsApp/Instagram, por
// onde a divulgação começa) saem sem título/imagem.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://questly.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Questly — Estude o que importa",
    // Cada página define o próprio título; o sufixo mantém a marca visível na
    // aba e no histórico sem cada page.tsx repetir "— Questly".
    template: "%s · Questly",
  },
  description:
    "Plano de estudos diário, simulados cronometrados e questões de provas antigas pra universitário passar em todas as matérias do semestre.",
  applicationName: "Questly",
  authors: [{ name: "Questly" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Questly",
    locale: "pt_BR",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Questly", statusBarStyle: "default" },
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
