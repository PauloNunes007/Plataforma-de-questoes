// Compartilhado entre Sidebar (desktop) e MobileBottomNav (mobile) — mesma
// navegação, duas apresentações. `mobileLabel` é mais curto pra caber nas 5
// abas da barra inferior sem quebrar linha. Ícones: Lucide (SVG), nunca
// emoji — regra do design system (redesign 2026-07).
import {
  LayoutDashboard,
  Layers,
  Map,
  Trophy,
  Settings,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
};

// Barra inferior do mobile: continua travada em 5 abas, mas Simulados
// substituiu Ajustes (2026-09) — Simulados pedia dois toques (hub /questoes →
// card) e o aluno não achava; Ajustes não repete porque continua a um toque
// no avatar (ContaMenu, dentro de TopNav), visível em qualquer largura.
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", mobileLabel: "Início", icon: LayoutDashboard },
  { href: "/questoes", label: "Questões", mobileLabel: "Questões", icon: Layers },
  { href: "/trilha", label: "Minha trilha", mobileLabel: "Trilha", icon: Map },
  { href: "/simulados", label: "Simulados", mobileLabel: "Simulados", icon: FileText },
  { href: "/ranking", label: "Ranking", mobileLabel: "Ranking", icon: Trophy },
] as const;

// Header horizontal do desktop (redesign inspirado nos prints do usuário).
export const TOP_NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", mobileLabel: "Início", icon: LayoutDashboard },
  { href: "/questoes", label: "Questões", mobileLabel: "Questões", icon: Layers },
  { href: "/trilha", label: "Trilha", mobileLabel: "Trilha", icon: Map },
  { href: "/simulados", label: "Simulados", mobileLabel: "Simulados", icon: FileText },
  { href: "/ranking", label: "Ranking", mobileLabel: "Ranking", icon: Trophy },
  { href: "/configuracoes", label: "Ajustes", mobileLabel: "Ajustes", icon: Settings },
] as const;
