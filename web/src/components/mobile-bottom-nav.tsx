"use client";

import { NAV_ITEMS, type NavItem } from "@/components/nav-items";
import { NavLink, NavProgresso, useAbaAtiva } from "@/components/nav-link";

// Substitui a Sidebar em telas < lg (a maioria dos alunos usa celular —
// ver web/CLAUDE.md). Barra fixa no rodapé com blur, alvo de toque de
// ~56px por aba, `env(safe-area-inset-bottom)` pra faixa de gestos do
// iPhone. Redesign 2026-07: ícones Lucide + indicador de aba ativa.
//
// 2026-09-17: o estado ativo passou a ser OTIMISTA (ver nav-link.tsx). No
// celular isso pesa mais que no desktop — sem hover não existe prefetch, e a
// rede móvel é onde o intervalo entre o toque e a tela nova é mais longo. A
// aba acende no toque; o fio por baixo do rótulo é o que diz que ainda está
// carregando.
export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/85 backdrop-blur-xl lg:hidden print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => (
        <AbaMobile key={item.href} item={item} />
      ))}
    </nav>
  );
}

function AbaMobile({ item }: { item: NavItem }) {
  const active = useAbaAtiva(item.href);
  const Icon = item.icon;

  return (
    <NavLink
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
        active ? "text-questly-green" : "text-muted-foreground"
      }`}
    >
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-questly-green" />}
      <Icon size={21} strokeWidth={active ? 2 : 1.75} />
      {item.mobileLabel}
      <NavProgresso className="text-questly-green" />
    </NavLink>
  );
}
