"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, CalendarDays, NotebookPen, Timer, type LucideIcon } from "lucide-react";

// Pill bar das páginas do Modo Aprovação (mesmo padrão do AdminTabs).
const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/aprovacao", label: "Hoje", icon: CalendarDays },
  { href: "/aprovacao/erros", label: "Caderno de Erros", icon: NotebookPen },
  { href: "/aprovacao/simulados", label: "Simulados", icon: Timer },
  { href: "/aprovacao/obras", label: "Obras", icon: BookOpenText },
];

export function AprovacaoTabs({ revisoesPendentes }: { revisoesPendentes?: number }) {
  const pathname = usePathname();
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm">
      {TABS.map((tab) => {
        const ativo = tab.href === "/aprovacao" ? pathname === "/aprovacao" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        const badge = tab.href === "/aprovacao/erros" ? revisoesPendentes : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              ativo
                ? "bg-questly-orange/12 text-questly-orange"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon size={15} strokeWidth={2} />
            {tab.label}
            {badge ? (
              <span className="tnum flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-questly-orange px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
