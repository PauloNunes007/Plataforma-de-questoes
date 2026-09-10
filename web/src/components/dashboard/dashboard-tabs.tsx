"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, CalendarDays, Map } from "lucide-react";

export type AbaDashboard = "hoje" | "semana";

// Barra de abas Hoje/Semana/Jornada do dashboard. "Jornada" não troca de aba —
// navega pra /trilha, que já é o conceito de jornada no app (sem duplicar UI).
//
// O indicador ativo é uma pílula que DESLIZA entre as abas (layoutId), em vez
// de aparecer/sumir: o movimento carrega a relação entre origem e destino, que
// é justamente o que uma troca de aba significa. Some com prefers-reduced-motion.
// Os alvos de toque foram de ~30px pra 40px de altura — abaixo disso, no
// celular, a troca de aba errava com o polegar.
export function DashboardTabs({
  aba,
  onChange,
}: {
  aba: AbaDashboard;
  onChange: (aba: AbaDashboard) => void;
}) {
  const router = useRouter();
  const semMovimento = useReducedMotion();

  const abas: { id: AbaDashboard | "jornada"; rotulo: string; icone: React.ReactNode }[] = [
    { id: "hoje", rotulo: "Hoje", icone: <Calendar size={14} strokeWidth={2.1} /> },
    { id: "semana", rotulo: "Semana", icone: <CalendarDays size={14} strokeWidth={2.1} /> },
    { id: "jornada", rotulo: "Jornada", icone: <Map size={14} strokeWidth={2.1} /> },
  ];

  return (
    <div
      role="tablist"
      aria-label="Visões da home"
      className="inline-flex rounded-2xl border border-border bg-muted/70 p-1 shadow-xs"
    >
      {abas.map((a) => {
        const ativo = a.id === aba;
        return (
          <button
            key={a.id}
            type="button"
            role={a.id === "jornada" ? undefined : "tab"}
            aria-selected={a.id === "jornada" ? undefined : ativo}
            onClick={() => (a.id === "jornada" ? router.push("/trilha") : onChange(a.id))}
            className={`relative inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold transition-colors ${
              ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ativo && (
              <motion.span
                layoutId={semMovimento ? undefined : "aba-ativa"}
                aria-hidden
                className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border"
                transition={{ type: "spring", stiffness: 460, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {a.icone}
              {a.rotulo}
            </span>
          </button>
        );
      })}
    </div>
  );
}
