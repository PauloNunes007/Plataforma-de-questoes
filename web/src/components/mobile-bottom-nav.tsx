"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav-items";

// Substitui a Sidebar em telas < lg (a maioria dos alunos usa celular —
// ver web/CLAUDE.md). Barra fixa no rodapé com blur, alvo de toque de
// ~56px por aba, `env(safe-area-inset-bottom)` pra faixa de gestos do
// iPhone. Redesign 2026-07: ícones Lucide + indicador de aba ativa.
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              active ? "text-questly-green" : "text-muted-foreground"
            }`}
          >
            {active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-questly-green" />
            )}
            <Icon size={21} strokeWidth={active ? 2 : 1.75} />
            {item.mobileLabel}
          </Link>
        );
      })}
    </nav>
  );
}
