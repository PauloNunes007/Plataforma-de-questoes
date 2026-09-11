"use server";

import { createClient } from "@/lib/supabase/server";
import { carregarTarefasIntervalo, type TarefaRow } from "@/lib/tarefas/tarefas-data";
import type { CalDay } from "@/lib/questly/dashboard-data";

// Carga de UM mês da agenda, sob demanda.
//
// O dashboard já entrega o mês corrente dentro de carregarDadosDashboard — é o
// mês que o aluno vê ao abrir a home, e ele não deve custar um round-trip
// extra. Esta action existe só pra quando o aluno NAVEGA (seta pra frente/trás
// ou salta pra outro mês): nesse caso as três coisas que pintam um dia
// (estudou / prova / itens agendados) precisam ser relidas na janela nova.
//
// Deliberadamente NÃO reusa carregarDadosDashboard: aquilo gera missões do
// dia, projeta nota, calcula liga — nada disso muda por olhar setembro, e
// rodar o mission-engine a cada clique de seta seria caro e com efeito
// colateral (missão gerada).

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export type MesAgenda = {
  ano: number;
  mes: number;
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  tarefas: Record<string, TarefaRow[]>;
};

function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export async function carregarMesAgendaAction(ano: number, mes: number): Promise<MesAgenda | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Teto de navegação: ±5 anos. Sem ele um ano digitado errado viraria uma
  // query de intervalo gigantesco.
  const agora = new Date();
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 0 || mes > 11) return null;
  if (Math.abs(ano - agora.getFullYear()) > 5) return null;

  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const inicio = iso(ano, mes, 1);
  const fim = iso(ano, mes, totalDias);

  const [logsRes, bossesRes, tarefas] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("data, estudou")
      .eq("user_id", user.id)
      .gte("data", inicio)
      .lte("data", fim),
    // Provas do mês. Lidas pelo MESMO caminho que o dashboard usa (subjects
    // com bosses aninhados, filtrando por user_id no subject): `bosses` não
    // tem user_id próprio, e este é o acesso que a RLS já cobre.
    supabase.from("subjects").select("nome, bosses(nome, data_prova)").eq("user_id", user.id),
    carregarTarefasIntervalo(supabase, user, inicio, fim),
  ]);

  const estudouPorData: Record<string, boolean> = {};
  ((logsRes.data || []) as { data: string; estudou: boolean }[]).forEach((l) => {
    estudouPorData[String(l.data).slice(0, 10)] = l.estudou;
  });

  const provasPorDia: Record<string, string> = {};
  (
    (bossesRes.data || []) as unknown as {
      nome: string;
      bosses: { nome: string; data_prova: string }[] | null;
    }[]
  ).forEach((s) => {
    (s.bosses || []).forEach((b) => {
      if (!b.data_prova) return;
      const dataStr = String(b.data_prova).slice(0, 10);
      if (dataStr < inicio || dataStr > fim) return;
      provasPorDia[dataStr] = `${s.nome} — ${b.nome}`;
    });
  });

  const hojeStr = iso(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const days: CalDay[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = iso(ano, mes, dia);
    let estado: CalDay["estado"] = "normal";
    let title: string | undefined;
    if (dataStr === hojeStr) estado = "hoje";
    else if (provasPorDia[dataStr]) {
      estado = "prova";
      title = provasPorDia[dataStr];
    } else if (estudouPorData[dataStr]) estado = "estudou";
    days.push({ dia, data: dataStr, estado, title, temTarefa: Boolean(tarefas[dataStr]?.length) });
  }

  return {
    ano,
    mes,
    monthLabel: `${MESES_PT[mes]} ${ano}`,
    dowOffset: new Date(ano, mes, 1).getDay(),
    days,
    tarefas,
  };
}
