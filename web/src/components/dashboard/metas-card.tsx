"use client";

import { CheckCircle2, FileText, Zap } from "lucide-react";
import type { MetasHoje } from "@/lib/questly/dashboard-data";

function scrollParaMissoes() {
  document.getElementById("missoes-do-dia")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

// Reinterpreta o card "Metas" de referência (que tinha "Aulas concluídas" —
// conceito que não existe no Questly, não há vídeo-aula aqui) com métricas
// reais do domínio: tudo vem de dados.metasHoje, derivado das missões do
// dia sem nenhuma query nova. Sem edição de meta nesta rodada — os alvos
// são o que as missões geradas hoje já preveem.
export function MetasCard({ metas }: { metas: MetasHoje }) {
  const linhas = [
    {
      icone: <CheckCircle2 size={15} strokeWidth={1.9} className="text-questly-green" />,
      iconeBg: "bg-questly-green-light",
      rotulo: "Missões concluídas",
      atual: metas.missoesConcluidas,
      meta: metas.missoesTotal,
      corBarra: "bg-questly-green",
    },
    {
      icone: <FileText size={15} strokeWidth={1.9} className="text-questly-blue" />,
      iconeBg: "bg-questly-blue/10",
      rotulo: "Questões respondidas",
      atual: metas.questoesRespondidas,
      meta: metas.questoesTotal,
      corBarra: "bg-questly-blue",
    },
    {
      icone: <Zap size={15} strokeWidth={1.9} className="text-questly-purple" />,
      iconeBg: "bg-questly-purple/10",
      rotulo: "XP diário",
      atual: metas.xpHoje,
      meta: metas.xpMetaHoje,
      corBarra: "bg-questly-purple",
    },
  ];

  return (
    <div className="surface p-5">
      <span className="mb-4 block text-[13.5px] font-semibold tracking-tight">Metas</span>
      <div className="flex flex-col gap-4">
        {linhas.map((l) => {
          const pct = l.meta > 0 ? Math.min(100, Math.round((l.atual / l.meta) * 100)) : 0;
          return (
            <button
              key={l.rotulo}
              type="button"
              onClick={scrollParaMissoes}
              disabled={l.meta === 0}
              className="group flex items-center gap-3 text-left disabled:cursor-default"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${l.iconeBg}`}>
                {l.icone}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium text-muted-foreground">{l.rotulo}</span>
                  <span className="tnum shrink-0 text-[11.5px] font-semibold">
                    {l.atual}/{l.meta || 0}
                  </span>
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className={`block h-full rounded-full transition-[width] duration-700 ${l.corBarra}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
