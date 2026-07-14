"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LogOut, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/logo";
import { NAV_ITEMS } from "@/components/nav-items";
import { ProBadge } from "@/components/plano/pro-ui";
import { CursoIcone } from "@/components/cursos/curso-icone";
import { resolverCurso, cursoReconhecido } from "@/lib/cursos/registro";
import { signOutAction } from "@/lib/auth/actions";

type SidebarProps = {
  nome: string;
  username: string | null;
  curso: string | null;
  fotoUrl: string | null;
  isAdmin: boolean;
  ehPro: boolean;
};

// Sidebar do redesign 2026-07: densidade Linear-like — itens de 36px,
// rótulos em sentence case (nada de uppercase gritado), estado ativo com
// pill sutil + barra de acento, ícones Lucide 18px.
export function Sidebar({ nome, username, curso, fotoUrl, isAdmin, ehPro }: SidebarProps) {
  const pathname = usePathname();
  const proAtivo = pathname.startsWith("/pro");

  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
      <Logo className="mb-7 px-2.5 pt-1" />

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors duration-150 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-questly-green" />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2 : 1.75}
                className={active ? "text-questly-green" : "text-muted-foreground/80 group-hover:text-sidebar-foreground"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3">
        <Link
          href="/pro"
          aria-current={proAtivo ? "page" : undefined}
          className={`group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors duration-150 ${
            proAtivo
              ? "bg-questly-gold/15 text-questly-gold"
              : "text-questly-gold/90 hover:bg-questly-gold/10 hover:text-questly-gold"
          }`}
        >
          <Crown size={18} strokeWidth={proAtivo ? 2 : 1.75} />
          {ehPro ? "Questly Pro" : "Seja Pro"}
          {ehPro && <ProBadge size="sm" className="ml-auto" />}
        </Link>
      </div>

      {isAdmin && (
        <div className="mt-3">
          <Link
            href="/admin/questoes"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            className={`group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors duration-150 ${
              pathname.startsWith("/admin")
                ? "bg-questly-purple/15 text-questly-purple"
                : "text-muted-foreground hover:bg-questly-purple/10 hover:text-questly-purple"
            }`}
          >
            <ShieldAlert size={18} strokeWidth={1.75} />
            Admin de questões
          </Link>
        </div>
      )}

      {/* Cartão de conta do rodapé (redesign 2026-07-14): foto real do
          aluno (antes só a inicial — o foto_url nem chegava aqui), nome +
          @username, e o curso resolvido pela identidade (ícone + nome
          padronizado em até 2 linhas, em vez do texto livre truncado). */}
      <SidebarConta nome={nome} username={username} curso={curso} fotoUrl={fotoUrl} ehPro={ehPro} />
    </aside>
  );
}

function SidebarConta({
  nome,
  username,
  curso,
  fotoUrl,
  ehPro,
}: {
  nome: string;
  username: string | null;
  curso: string | null;
  fotoUrl: string | null;
  ehPro: boolean;
}) {
  const identidade = resolverCurso(curso);
  const temCurso = !!curso;
  const nomeCurso = cursoReconhecido(identidade) ? identidade.nome : curso;

  return (
    <div className="mt-auto border-t border-sidebar-border pt-3">
      <div className="rounded-xl border border-sidebar-border bg-card/60 p-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-questly-green to-questly-green-deep text-[13px] font-semibold text-white dark:text-[#0c1512]">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              nome.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight">
              <span className="truncate">{nome}</span>
              {ehPro && <ProBadge size="sm" />}
            </span>
            {username && (
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                @{username}
              </span>
            )}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-questly-red"
            >
              <LogOut size={16} strokeWidth={1.75} />
            </button>
          </form>
        </div>
        {temCurso && (
          <div className="mt-2 flex items-center gap-2 border-t border-sidebar-border pt-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white"
              style={{ background: `linear-gradient(135deg, ${identidade.corA}, ${identidade.corB})` }}
            >
              <CursoIcone icone={identidade.icone} size={12} strokeWidth={2} />
            </span>
            <span className="line-clamp-2 text-[11px] font-medium leading-snug text-muted-foreground">
              {nomeCurso}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
