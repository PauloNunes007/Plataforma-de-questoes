"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, LogOut, ShieldAlert } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { ProBadge } from "@/components/plano/pro-ui";
import { signOutAction } from "@/lib/auth/actions";

// Topo fixo em telas < lg — a Sidebar (que leva nome/curso/Sair) fica
// escondida nesse breakpoint, então esse header segura o essencial: marca +
// um botão de avatar que abre um menu curto com essas mesmas informações.
export function MobileHeader({
  nome,
  curso,
  isAdmin,
  ehPro,
}: {
  nome: string;
  curso: string | null;
  isAdmin: boolean;
  ehPro: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:hidden">
      <Logo />

      <div className="flex items-center gap-2">
        <Link
          href="/pro"
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-questly-gold to-amber-400 px-2.5 text-[11.5px] font-semibold text-[#3a2a05] shadow-sm ring-1 ring-white/40 transition-transform active:scale-95"
        >
          <Crown size={13} strokeWidth={2.5} className="fill-current" />
          {ehPro ? "Pro" : "Seja Pro"}
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label="Conta"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-questly-green to-questly-green-deep text-[13px] font-semibold text-white dark:text-[#0c1512]"
          >
            {nome.charAt(0).toUpperCase()}
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
                  <span className="flex items-center gap-1.5 truncate text-[13.5px] font-medium">
                    <span className="truncate">{nome}</span>
                    {ehPro && <ProBadge size="sm" />}
                  </span>
                  {curso && (
                    <span className="block truncate text-xs text-muted-foreground">{curso}</span>
                  )}
                </div>
                {isAdmin && (
                  <>
                    <div className="mx-1 my-1 h-px bg-border" />
                    <Link
                      href="/admin/questoes"
                      onClick={() => setAberto(false)}
                      className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] font-medium text-questly-purple transition-colors hover:bg-muted"
                    >
                      <ShieldAlert size={15} strokeWidth={1.75} />
                      Admin de questões
                    </Link>
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
      </div>
    </header>
  );
}
