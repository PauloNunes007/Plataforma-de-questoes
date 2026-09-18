// Compartilhado entre TopNav (desktop) e MobileBottomNav (mobile) — mesma
// navegação, duas apresentações. `mobileLabel` é mais curto pra caber nas
// abas da barra inferior sem quebrar linha. Ícones: Lucide (SVG), nunca
// emoji — regra do design system (redesign 2026-07).
import {
  LayoutDashboard,
  Layers,
  Map,
  Trophy,
  Settings,
  FileText,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
};

// "Minhas matérias" (faltas + notas, 2026-09-17) — definida antes de
// NAV_ITEMS porque agora entra nela também (2026-09-18: o plano de "chega
// pelo menu da conta" deixava a aba efetivamente invisível no celular/iPad —
// o aluno via a tela só no desktop, onde a barra horizontal lista tudo).
export const MATERIAS_NAV: NavItem = {
  href: "/materias",
  label: "Matérias",
  mobileLabel: "Matérias",
  icon: GraduationCap,
};

// Barra inferior do mobile: 6 abas desde 2026-09-18 (Matérias entrou — ver
// nota acima). Ainda cabe: os rótulos continuam curtos e `flex-1` divide a
// largura igual entre eles, só aperta um pouco mais num phone estreito.
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", mobileLabel: "Início", icon: LayoutDashboard },
  { href: "/questoes", label: "Questões", mobileLabel: "Questões", icon: Layers },
  { href: "/trilha", label: "Minha trilha", mobileLabel: "Trilha", icon: Map },
  { href: "/simulados", label: "Simulados", mobileLabel: "Simulados", icon: FileText },
  { href: "/ranking", label: "Ranking", mobileLabel: "Ranking", icon: Trophy },
  MATERIAS_NAV,
] as const;

// Header horizontal do desktop (redesign inspirado nos prints do usuário).
export const TOP_NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", mobileLabel: "Início", icon: LayoutDashboard },
  { href: "/questoes", label: "Questões", mobileLabel: "Questões", icon: Layers },
  { href: "/trilha", label: "Trilha", mobileLabel: "Trilha", icon: Map },
  { href: "/simulados", label: "Simulados", mobileLabel: "Simulados", icon: FileText },
  { href: "/ranking", label: "Ranking", mobileLabel: "Ranking", icon: Trophy },
  MATERIAS_NAV,
  { href: "/configuracoes", label: "Ajustes", mobileLabel: "Ajustes", icon: Settings },
] as const;
