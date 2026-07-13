"use client";

import { useRouter } from "next/navigation";
import { Calendar, CalendarDays, Map } from "lucide-react";

export type AbaDashboard = "hoje" | "semana";

// Barra de abas Hoje/Semana/Jornada do redesign do dashboard. "Jornada"
// não troca de aba — navega pra /trilha, que já é o conceito de jornada
// no app (sem duplicar UI, ver plano).
export function DashboardTabs({ aba, onChange }: { aba: AbaDashboard; onChange: (aba: AbaDashboard) => void }) {
  const router = useRouter();

  const abas: { id: AbaDashboard | "jornada"; rotulo: string; icone: React.ReactNode }[] = [
    { id: "hoje", rotulo: "Hoje", icone: <Calendar size={14} strokeWidth={2} /> },
    { id: "semana", rotulo: "Semana", icone: <CalendarDays size={14} strokeWidth={2} /> },
    { id: "jornada", rotulo: "Jornada", icone: <Map size={14} strokeWidth={2} /> },
  ];

  return (
    <div className="mb-6 inline-flex rounded-xl bg-muted p-1">
      {abas.map((a) => {
        const ativo = a.id === aba;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => (a.id === "jornada" ? router.push("/trilha") : onChange(a.id))}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              ativo ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a.icone}
            {a.rotulo}
          </button>
        );
      })}
    </div>
  );
}
