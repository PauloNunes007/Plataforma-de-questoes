"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Loader2, Route } from "lucide-react";
import type { RotaAprovacao } from "@/lib/questly/rota-aprovacao";
import { seguirRotaAction } from "@/lib/gps/actions";

type GpsAprovacaoCardProps = {
  rota: RotaAprovacao | null;
  subjectId: string;
  subjectNome: string;
};

const MAX_PASSOS_VISIVEIS = 4;

// GPS da Aprovação: a continuação do painel do Boss — ele mostra a nota
// projetada se nada mudar; este card mostra a MELHOR forma de mudá-la
// hoje (rota Δnota/min do motor). Mesma linguagem sóbria `.surface`;
// verde = ação, como no resto do app.
export function GpsAprovacaoCard({ rota, subjectId, subjectNome }: GpsAprovacaoCardProps) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!rota || rota.passos.length === 0) return null;

  const passosVisiveis = rota.passos.slice(0, MAX_PASSOS_VISIVEIS);
  const passosOcultos = rota.passos.length - passosVisiveis.length;

  const seguirRota = async () => {
    if (carregando) return;
    setCarregando(true);
    setErro(null);
    const { missaoId } = await seguirRotaAction({
      subjectId,
      passos: rota.passos.map((p) => ({ topicoId: p.topicoId, questoes: p.questoes })),
    });
    if (missaoId) {
      router.push(`/questao?missao=${missaoId}`);
    } else {
      setErro("Não deu pra montar a rota agora. Tenta de novo?");
      setCarregando(false);
    }
  };

  return (
    <div className="surface relative overflow-hidden rounded-2xl p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full opacity-[0.07] blur-2xl dark:opacity-[0.1]"
        style={{ background: "var(--questly-green)" }}
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-questly-green">
            <Route size={13} strokeWidth={2} />
            GPS da Aprovação
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Clock size={12} strokeWidth={2} />
            <span className="tnum">~{rota.tempoTotalMin} min hoje</span>
          </span>
        </div>

        {/* Nota hoje → nota se seguir a rota */}
        <div className="mb-1 flex items-end gap-3">
          <span className="tnum font-heading text-[34px] font-semibold leading-none tracking-tight text-muted-foreground">
            {rota.notaAtual}
          </span>
          <ArrowRight size={20} strokeWidth={2} className="mb-1 text-muted-foreground/50" />
          <span className="tnum font-heading text-[34px] font-semibold leading-none tracking-tight text-questly-green">
            {rota.notaAposRota}
            <span className="text-[18px] font-medium text-muted-foreground">%</span>
          </span>
          <span className="tnum mb-0.5 rounded-full bg-questly-green-light px-2 py-0.5 text-xs font-semibold text-questly-green-dark">
            +{rota.deltaNota.toLocaleString("pt-BR")} pts
          </span>
        </div>
        <p className="mb-5 text-xs text-muted-foreground">
          nota projetada de {subjectNome} se você cumprir a rota de hoje — estimativa do motor de
          estudo, não promessa
        </p>

        {/* Passos, na ordem de maior impacto por minuto */}
        <ol className="mb-5 flex flex-col gap-2">
          {passosVisiveis.map((passo, i) => (
            <motion.li
              key={passo.topicoId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5"
            >
              <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-questly-green-light text-xs font-semibold text-questly-green-dark">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{passo.nome}</p>
                <p className="tnum text-xs text-muted-foreground">
                  {passo.questoes} {passo.questoes === 1 ? "questão" : "questões"} · ~{passo.minutos}{" "}
                  min
                </p>
              </div>
              <span className="tnum shrink-0 text-xs font-semibold text-questly-green">
                +{passo.deltaNota.toLocaleString("pt-BR")}
              </span>
            </motion.li>
          ))}
        </ol>
        {passosOcultos > 0 && (
          <p className="-mt-3 mb-4 text-xs text-muted-foreground">
            + {passosOcultos} {passosOcultos === 1 ? "outro tópico" : "outros tópicos"} na rota
            completa
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={seguirRota}
            disabled={carregando}
            className="inline-flex items-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:text-[#0c1512]"
          >
            {carregando ? (
              <Loader2 size={15} strokeWidth={2} className="animate-spin" />
            ) : (
              <Route size={15} strokeWidth={2} />
            )}
            {carregando ? "Montando missão..." : "Seguir rota"}
          </button>
          <span className="tnum text-xs text-muted-foreground">
            {rota.questoesTotal} questões · missão avulsa, não substitui a diária
          </span>
        </div>
        {erro && <p className="mt-2 text-xs text-questly-red">{erro}</p>}
      </div>
    </div>
  );
}
