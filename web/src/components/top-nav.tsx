"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, GraduationCap, LogOut, Settings, ShieldAlert, Timer } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TOP_NAV_ITEMS } from "@/components/nav-items";
import { ProBadge } from "@/components/plano/pro-ui";
import { CursoIcone } from "@/components/cursos/curso-icone";
import { resolverCurso, cursoReconhecido } from "@/lib/cursos/registro";
import { signOutAction } from "@/lib/auth/actions";
import { useFoco } from "@/components/foco/foco-provider";
import { FocoHojeChip } from "@/components/foco/foco-bar";

type TopNavProps = {
  nome: string;
  username: string | null;
  curso: string | null;
  fotoUrl: string | null;
  isAdmin: boolean;
  ehPro: boolean;
};

// Header HORIZONTAL (redesign 2026-09, a pedido — substitui a Sidebar
// lateral, inspirado nos prints da plataforma de referência). Barra fixa no
// topo com marca + navegação por ícones+rótulo, e um cluster à direita:
// tema, botão de Foco (timer), Pro e menu de conta. No mobile os links somem
// (a MobileBottomNav cobre), sobrando marca + Foco + conta.
export function TopNav({ nome, username, curso, fotoUrl, isAdmin, ehPro }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* fio de acento no topo — dá o toque "premium" sem pesar */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-questly-green/40 to-transparent" />
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-3 sm:px-5">
        <Link
          href="/dashboard"
          aria-label="Início"
          className="flex shrink-0 items-center rounded-xl border border-border bg-card/50 px-2.5 py-1.5 transition-colors hover:bg-card"
        >
          <Logo />
        </Link>

        {/* Navegação (desktop) — pill vibrante no ativo, com glow */}
        <nav className="ml-3 hidden min-w-0 flex-1 items-center gap-0.5 md:flex lg:ml-4 lg:gap-1">
          {TOP_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-9 items-center gap-2 rounded-full px-3 text-[13.5px] font-semibold transition-colors ${
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="topnav-active"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-questly-green via-emerald-500 to-questly-blue shadow-[0_2px_12px_-2px_var(--questly-green)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.3 : 1.85}
                    className={active ? "text-white" : "transition-transform group-hover:scale-110"}
                  />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Cluster à direita */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <FocoHojeChip className="mr-1 hidden sm:inline" />
          <ThemeToggle />
          <FocoBotao />

          <Link
            href="/pro"
            aria-label={ehPro ? "Questly Pro" : "Seja Pro"}
            title={ehPro ? "Questly Pro" : "Seja Pro"}
            className={`hidden h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-transform active:scale-95 sm:flex ${
              ehPro
                ? "bg-gradient-to-r from-questly-gold to-amber-400 text-[#3a2a05] shadow-sm ring-1 ring-white/40"
                : "text-questly-gold hover:bg-questly-gold/10"
            }`}
          >
            <Crown size={13} strokeWidth={2.5} className={ehPro ? "fill-current" : ""} />
            {ehPro ? "Pro" : "Seja Pro"}
          </Link>

          <ContaMenu
            nome={nome}
            username={username}
            curso={curso}
            fotoUrl={fotoUrl}
            isAdmin={isAdmin}
            ehPro={ehPro}
          />
        </div>
      </div>
    </header>
  );
}

function FocoBotao() {
  const foco = useFoco();
  const ativo = foco.estado === "rodando" || foco.estado === "pausado";

  return (
    <button
      type="button"
      onClick={foco.alternarBarra}
      aria-label="Foco"
      aria-pressed={foco.barraAberta || ativo}
      title="Sessão de foco"
      className={`relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all active:scale-95 ${
        ativo
          ? "bg-gradient-to-br from-questly-blue to-questly-blue-dark text-white shadow-[0_2px_10px_-2px_var(--questly-blue)]"
          : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-questly-blue"
      }`}
    >
      <Timer size={18} strokeWidth={1.9} />
      {ativo && (
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-questly-blue opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-questly-blue ring-2 ring-background" />
        </span>
      )}
    </button>
  );
}

function ContaMenu({ nome, username, curso, fotoUrl, isAdmin, ehPro }: TopNavProps) {
  const [aberto, setAberto] = useState(false);
  const identidade = resolverCurso(curso);
  const nomeCurso = cursoReconhecido(identidade) ? identidade.nome : curso;

  return (
    <div className="relative ml-0.5">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Conta"
        aria-expanded={aberto}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-questly-green to-questly-green-deep text-[13px] font-semibold text-white ring-1 ring-border transition-transform active:scale-95 dark:text-[#0c1512]"
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          nome.charAt(0).toUpperCase()
        )}
      </button>

      <AnimatePresence>
        {aberto && (
          <>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl border border-border bg-popover p-1.5 shadow-lg shadow-black/5 dark:shadow-black/30"
            >
              <div className="px-2.5 py-2">
                <span className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
                  <span className="truncate">{nome}</span>
                  {ehPro && <ProBadge size="sm" />}
                </span>
                {username && (
                  <span className="block truncate text-xs text-muted-foreground">@{username}</span>
                )}
                {curso && (
                  <span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded text-white"
                      style={{ background: `linear-gradient(135deg, ${identidade.corA}, ${identidade.corB})` }}
                    >
                      <CursoIcone icone={identidade.icone} size={10} strokeWidth={2.25} />
                    </span>
                    <span className="line-clamp-2 leading-snug">{nomeCurso}</span>
                  </span>
                )}
              </div>

              <div className="mx-1 my-1 h-px bg-border" />
              <ItemMenu href="/configuracoes" onClick={() => setAberto(false)} cor="text-foreground">
                <Settings size={15} strokeWidth={1.75} />
                Ajustes
              </ItemMenu>
              <ItemMenu href="/pro" onClick={() => setAberto(false)} cor="text-questly-gold">
                <Crown size={15} strokeWidth={1.75} />
                {ehPro ? "Questly Pro" : "Seja Pro"}
              </ItemMenu>

              {isAdmin && (
                <>
                  <div className="mx-1 my-1 h-px bg-border" />
                  <ItemMenu href="/aprovacao" onClick={() => setAberto(false)} cor="text-questly-orange">
                    <GraduationCap size={15} strokeWidth={1.75} />
                    Modo Aprovação
                  </ItemMenu>
                  <ItemMenu href="/admin/questoes" onClick={() => setAberto(false)} cor="text-questly-purple">
                    <ShieldAlert size={15} strokeWidth={1.75} />
                    Admin de questões
                  </ItemMenu>
                </>
              )}

              <div className="mx-1 my-1 h-px bg-border" />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] font-medium text-questly-red transition-colors hover:bg-muted"
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  Sair
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemMenu({
  href,
  onClick,
  cor,
  children,
}: {
  href: string;
  onClick: () => void;
  cor: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] font-medium transition-colors hover:bg-muted ${cor}`}
    >
      {children}
    </Link>
  );
}
