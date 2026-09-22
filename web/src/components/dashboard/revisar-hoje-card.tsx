"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit } from "lucide-react";
import type { RevisarHoje } from "@/lib/revisar/revisar-data";
import { revisarAgoraAction } from "@/lib/revisar/actions";
import { hrefQuestao } from "@/lib/questao/navegacao";

// "Revisar hoje" — o motor de memória saindo da /trilha e chegando na home.
//
// A plataforma já calcula, a cada resposta, a meia-vida da memória de cada
// tópico (aluno_topico_progresso.estabilidade) e portanto sabe todo dia o que
// está escorregando. Esse sinal só aparecia num selo dentro da trilha.
//
// É um FATO, não uma meta: o cartão não aparece quando não há nada caindo, e
// não existe "você deveria" em lugar nenhum. É a diferença entre o espelho que
// sobreviveu ao fim do motor de missões e a cobrança que saiu com ele.
//
// Client component porque o botão monta uma lista e navega; o diagnóstico em
// si vem pronto do servidor.
export function RevisarHojeCard({ revisar }: { revisar: RevisarHoje }) {
  const router = useRouter();
  const [montando, setMontando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function revisarAgora() {
    if (montando) return;
    setMontando(true);
    setErro(null);
    const r = await revisarAgoraAction();
    if (!r.missaoId) {
      setMontando(false);
      setErro(r.error || "Não deu pra montar a revisão agora.");
      return;
    }
    router.push(hrefQuestao(r.missaoId, "/dashboard"));
  }

  const n = revisar.topicos.length;
  const extras = revisar.totalEmRisco - n;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface flex flex-col border-questly-orange/35 p-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-questly-orange/12 text-questly-orange-dark">
          <BrainCircuit size={14} strokeWidth={2.2} />
        </span>
        <h3 className="text-[13.5px] font-semibold tracking-tight">Revisar hoje</h3>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
        {n === 1 ? "Um assunto seu está" : `${n} assuntos seus estão`} saindo da
        memória. Rever agora custa muito menos do que reaprender depois.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {revisar.topicos.map((t) => (
          <li key={t.topicoId} className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
              {t.nome}
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                {t.materiaNome}
              </span>
            </span>
            {/* O número é o da memória, não o de acerto: acertabilidade é dado
                privado e não volta pra vitrine por uma porta lateral. */}
            <span className="tnum shrink-0 text-[11.5px] font-semibold text-questly-orange-dark">
              {Math.round(t.retencao * 100)}%
            </span>
          </li>
        ))}
      </ul>

      {extras > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          e mais {extras} {extras === 1 ? "assunto" : "assuntos"} na trilha.
        </p>
      )}

      <button
        type="button"
        onClick={revisarAgora}
        disabled={montando}
        // `-dark` e não o laranja cheio: branco sobre #d97706 dá ~3,1:1 e
        // reprova em AA. O tom aprofundado foi aferido em 5,02:1 (ver o bloco
        // de marca em globals.css), e no escuro ele vira claro — daí o texto
        // quase preto do `dark:`.
        className="mt-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-orange-dark px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#1a0f02]"
      >
        {montando ? "Montando..." : `Revisar ${revisar.quantidade} questões`}
        {!montando && <ArrowRight size={14} strokeWidth={2.2} />}
      </button>

      {erro && <p className="mt-2 text-[12px] text-questly-red-dark">{erro}</p>}
    </motion.div>
  );
}
