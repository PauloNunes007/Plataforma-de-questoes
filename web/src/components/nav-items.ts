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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", mobileLabel: "Início", icon: LayoutDashboard },
  { href: "/questoes", label: "Questões", mobileLabel: "Questões", icon: Layers },
  { href: "/trilha", label: "Minha trilha", mobileLabel: "Trilha", icon: Map },
  { href: "/ranking", label: "Ranking", mobileLabel: "Ranking", icon: Trophy },
  { href: "/configuracoes", label: "Ajustes", mobileLabel: "Ajustes", icon: Settings },
] as const;
