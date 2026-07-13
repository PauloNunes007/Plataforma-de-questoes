"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Play, RotateCcw, ScrollText } from "lucide-react";
import type { TopicoPratica } from "@/lib/disciplinas/disciplinas-data";
import { iniciarPraticaLivreAction } from "@/lib/disciplinas/actions";

// Card vertical (grid horizontal de várias colunas) — pedido explícito do
// usuário pra bater com o print de referência: faixa colorida no topo,
// matéria + título + descrição, meta de questões/tentativas, CTA cheio
// embaixo. "Começar" chama a MESMA Server Action da prática livre
// (iniciarPraticaLivreAction), só escopada a um tópico e pedindo "todas"
// as questões — a lista inteira do tópico vira a missão avulsa.
const CORES: [string, string][] = [
  ["#5b7cf0", "#3a52c4"],
  ["#f0555a", "#c93338"],
  ["#3fbf78", "#279357"],
  ["#9b6ff0", "#7443d6"],
  ["#c07a3a", "#96591f"],
  ["#f0a23f", "#d67c1a"],
  ["#2fb6c9", "#1a8c9c"],
];

export function ListaTopicoCard({
  subjectId,
  disciplinaNome,
  topico,
  index,
}: {
  subjectId: string;
  disciplinaNome: string;
  topico: TopicoPratica;
  index: number;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [corA, corB] = CORES[index % CORES.length];
  const jaTentou = topico.numRespondidas > 0;

  async function comecar() {
    setCarregando(true);
    setErro(false);
    const { missaoId } = await iniciarPraticaLivreAction({
      subjectId,
      topicIds: [topico.id],
      dificuldades: [],
      quantidade: "todas",
    });
    if (missaoId) {
      router.push(`/questao?missao=${missaoId}`);
      return;
    }
    setErro(true);
    setCarregando(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="surface flex flex-col overflow-hidden p-0"
    >
      <div
        className="flex h-16 items-center px-4"
        style={{ background: `linear-gradient(135deg, ${corA}, ${corB})` }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white ring-1 ring-white/25">
          <ScrollText size={17} strokeWidth={1.9} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: corA }}>
          {disciplinaNome}
        </span>
        <h3 className="mt-0.5 line-clamp-2 text-[14.5px] font-semibold leading-snug tracking-tight">
          {topico.nome}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
          {topico.descricao || `Lista completa de ${topico.nome}.`}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10.5px] font-medium text-muted-foreground">
            <FileText size={11} strokeWidth={1.9} />
            <span className="tnum">{topico.totalQuestoes}</span> questões
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10.5px] font-medium ${
              jaTentou
                ? "bg-questly-blue/10 text-questly-blue-dark"
                : "bg-questly-red-light text-questly-red-dark"
            }`}
          >
            {jaTentou ? `${topico.numRespondidas} tentativa(s)` : "Nenhuma tentativa"}
          </span>
        </div>

        {erro && <p className="mt-2 text-[11px] font-medium text-questly-red-dark">Não deu pra começar. Tente de novo.</p>}

        <button
          type="button"
          onClick={comecar}
          disabled={carregando}
          className="mt-3.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-questly-green px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]"
        >
          {carregando ? (
            "Preparando..."
          ) : jaTentou ? (
            <>
              <RotateCcw size={14} strokeWidth={2.25} />
              Retomar lista
            </>
          ) : (
            <>
              <Play size={14} strokeWidth={2.25} />
              Começar
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
