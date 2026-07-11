"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { signOutAction } from "@/lib/auth/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: "🏠" },
  { href: "/disciplinas", label: "Disciplinas", icon: "📚" },
  { href: "/trilha", label: "Minha trilha", icon: "🧭" },
  { href: "/ranking", label: "Ranking", icon: "🏆" },
  { href: "/configuracoes", label: "Ajustes", icon: "⚙️" },
];

type SidebarProps = {
  nome: string;
  curso: string | null;
};

export function Sidebar({ nome, curso }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col border-r border-border bg-card px-4 py-5">
      <Logo className="mb-6 px-3 pt-1.5" />

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 font-heading text-sm font-semibold tracking-wide uppercase transition-colors ${
                active
                  ? "border-questly-blue-light bg-questly-blue-light text-questly-blue-dark"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl text-lg">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-questly-green to-[#57D96F] font-heading text-base font-bold text-white shadow-[0_2px_0_var(--questly-green-dark)]">
          {nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <b className="block truncate text-sm font-extrabold">{nome}</b>
          {curso && (
            <span className="block truncate text-xs font-bold text-muted-foreground">
              {curso}
            </span>
          )}
        </div>
      </div>

      <form action={signOutAction} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-muted-foreground hover:bg-muted"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
