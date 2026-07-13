"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FileStack, Flag, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/questoes", label: "Questões", icon: FileStack },
  { href: "/admin/relatos", label: "Relatos", icon: Flag },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
];

export function AdminTabs({
  pendentes,
  assinaturasPendentes,
}: {
  pendentes?: number;
  assinaturasPendentes?: number;
}) {
  const pathname = usePathname();
  return (
    <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
      {TABS.map((tab) => {
        const ativo = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        const badge =
          tab.href === "/admin/relatos"
            ? pendentes
            : tab.href === "/admin/assinaturas"
              ? assinaturasPendentes
              : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              ativo
                ? "bg-questly-purple/12 text-questly-purple"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon size={15} strokeWidth={2} />
            {tab.label}
            {badge ? (
              <span className="tnum flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-questly-red px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
