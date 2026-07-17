"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, NotebookPen } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ModalAprovacao } from "./modal";
import { ErroForm } from "./erro-form";

// Botão flutuante "+ Erro rápido" — montado no (protected)/layout.tsx,
// aparece em todas as páginas logadas: errou uma questão estudando em
// qualquer lugar do app, registra no Caderno de Erros sem sair da página.
// Fica acima da MobileBottomNav no mobile (bottom-20) e escondido dentro
// de /questao pra não atrapalhar a resolução de missão.
export function BotaoErroRapido() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [salvo, setSalvo] = useState(false);

  if (pathname.startsWith("/questao")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Registrar erro rápido no Caderno de Erros"
        className="fixed bottom-20 right-4 z-40 flex h-12 cursor-pointer items-center gap-2 rounded-full bg-questly-orange px-4 text-sm font-semibold text-white shadow-lg shadow-questly-orange/25 transition-all hover:brightness-105 active:scale-95 lg:bottom-6 lg:right-6"
      >
        <NotebookPen size={17} strokeWidth={2.1} />
        <span className="hidden sm:inline">Erro rápido</span>
      </button>

      <ModalAprovacao aberto={aberto} titulo="Registrar erro" onFechar={() => setAberto(false)}>
        <ErroForm
          onSalvo={() => {
            setAberto(false);
            setSalvo(true);
            window.setTimeout(() => setSalvo(false), 2600);
          }}
          onCancelar={() => setAberto(false)}
        />
      </ModalAprovacao>

      <AnimatePresence>
        {salvo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-36 right-4 z-40 flex items-center gap-2 rounded-xl border border-questly-green/30 bg-card px-4 py-2.5 text-sm font-semibold text-questly-green shadow-lg lg:bottom-20 lg:right-6"
          >
            <CheckCircle2 size={16} strokeWidth={2.25} />
            Erro salvo no caderno
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
