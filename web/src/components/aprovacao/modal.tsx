"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Modal genérico do Modo Aprovação (form de erro, fichamento de obra,
// novo simulado). Overlay clicável + Esc fecham; painel rola sozinho
// em telas baixas (formularios longos no celular).
export function ModalAprovacao({
  aberto,
  titulo,
  onFechar,
  children,
  largura = "max-w-2xl",
}: {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Fechar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 flex max-h-[92dvh] w-full ${largura} flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl`}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-heading text-[15px] font-semibold">{titulo}</h2>
              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
