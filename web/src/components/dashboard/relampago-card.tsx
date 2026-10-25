"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { rodadaRelampagoAction } from "@/lib/relampago/actions";
import { hrefQuestao } from "@/lib/questao/navegacao";

// Rodada Relâmpago: cinco questões, um clique, sem decidir nada. O app escolhe
// pelo que mais rende (erro guardado, memória escapando, assunto novo) — ver
// lib/relampago/montar.ts. Sempre opcional, nunca uma meta.
export function RelampagoCard() {
  const router = useRouter();
  const [montando, setMontando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comecar() {
    if (montando) return;
    setMontando(true);
    setErro(null);
    const r = await rodadaRelampagoAction();
    if (!r.missaoId) {
      setMontando(false);
      setErro(r.error || "Não deu pra montar a rodada agora.");
      return;
    }
    router.push(hrefQuestao(r.missaoId, "/dashboard"));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface flex flex-wrap items-center justify-between gap-3 border-questly-orange/35 p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-orange/12 text-questly-orange-dark">
          <Zap size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold tracking-tight">Rodada Relâmpago</h3>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            5 questões, ~10 min. Sem escolher nada: misturamos um erro antigo, uma revisão e conteúdo novo.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={comecar}
        disabled={montando}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-orange-dark px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#1a0f02]"
      >
        {montando ? "Montando..." : "Começar"}
        {!montando && <ArrowRight size={14} strokeWidth={2.2} />}
      </button>
      {erro && <p className="w-full text-[12px] text-questly-red-dark">{erro}</p>}
    </motion.div>
  );
}
