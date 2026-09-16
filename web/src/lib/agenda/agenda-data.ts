// Carga de UM mês do calendário: os dias pintados, o que está marcado em cada
// um, as provas que caem no mês e quanto de cada META de questões já foi
// cumprido.
//
// Mora aqui (e não dentro de `actions.ts`) porque duas entradas precisam
// exatamente da mesma leitura: a página `/calendario`, que renderiza o mês
// corrente no servidor, e `carregarMesAgendaAction`, chamada quando o aluno
// navega pra outro mês. Duplicar isso significaria duas versões da regra de
// "quando um dia é dia de prova".
//
// Deliberadamente NÃO reusa `carregarDadosDashboard`: aquilo gera as missões
// do dia, projeta nota e calcula liga — nada disso muda por olhar setembro, e
// rodar o mission-engine a cada clique de seta seria caro e com efeito
// colateral (missão gerada).
import type { SupabaseClient } from "@supabase/supabase-js";
import { carregarTarefasIntervalo, type TarefaRow } from "@/lib/tarefas/tarefas-data";
import { emLotes } from "@/lib/supabase/paginado";
import type { CalDay } from "@/lib/questly/dashboard-data";

export const MESES_PT = [
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

/** Uma prova (boss) que cai num dia do mês exibido. */
export type ProvaDia = {
  bossId: string;
  subjectId: string;
  subjectNome: string;
  nome: string;
  data: string;
};

export type MesAgenda = {
  ano: number;
  /** 0–11, como `Date.getMonth()`. */
  mes: number;
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  tarefas: Record<string, TarefaRow[]>;
  /** data → prova daquele dia (um boss por dia; o último lido vence). */
  provas: Record<string, ProvaDia>;
  /**
   * Dias do mês com estudo registrado em `daily_logs`. Vem daqui, e não de
   * contar `days` por estado, porque HOJE tem estado "hoje" mesmo tendo
   * estudado — contar pelo estado perderia o dia corrente.
   */
  diasEstudados: number;
  /**
   * data → subjectId → questões que o aluno realmente respondeu naquele dia
   * naquela disciplina. É o PROGRESSO das metas, recontado a cada leitura em
   * vez de guardado numa coluna: um contador gravado seria um segundo lugar
   * pra mesma verdade (e o jeito óbvio de forjá-la). Só é calculado quando o
   * mês tem pelo menos uma meta — quem não usa metas não paga as queries.
   */
  questoesPorDia: Record<string, Record<string, number>>;
};

export function isoDia(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Teto de navegação: ±5 anos. Sem ele um ano digitado errado viraria uma
 *  query de intervalo gigantesco. */
export function mesValido(ano: number, mes: number): boolean {
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 0 || mes > 11) return false;
  return Math.abs(ano - new Date().getFullYear()) <= 5;
}

type SubjectComBosses = {
  id: string;
  nome: string;
  bosses: { id: string; nome: string; data_prova: string }[] | null;
};

export async function carregarMesAgenda(
  supabase: SupabaseClient,
  user: { id: string },
  ano: number,
  mes: number,
): Promise<MesAgenda | null> {
  if (!mesValido(ano, mes)) return null;

  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const inicio = isoDia(ano, mes, 1);
  const fim = isoDia(ano, mes, totalDias);

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
    supabase.from("subjects").select("id, nome, bosses(id, nome, data_prova)").eq("user_id", user.id),
    carregarTarefasIntervalo(supabase, user, inicio, fim),
  ]);

  const estudouPorData: Record<string, boolean> = {};
  ((logsRes.data || []) as { data: string; estudou: boolean }[]).forEach((l) => {
    estudouPorData[String(l.data).slice(0, 10)] = l.estudou;
  });

  const provas: Record<string, ProvaDia> = {};
  ((bossesRes.data || []) as unknown as SubjectComBosses[]).forEach((s) => {
    (s.bosses || []).forEach((b) => {
      if (!b.data_prova) return;
      const dataStr = String(b.data_prova).slice(0, 10);
      if (dataStr < inicio || dataStr > fim) return;
      provas[dataStr] = {
        bossId: b.id,
        subjectId: s.id,
        subjectNome: s.nome,
        nome: b.nome,
        data: dataStr,
      };
    });
  });

  const agora = new Date();
  const hojeStr = isoDia(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const days: CalDay[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = isoDia(ano, mes, dia);
    let estado: CalDay["estado"] = "normal";
    let title: string | undefined;
    if (dataStr === hojeStr) estado = "hoje";
    else if (provas[dataStr]) {
      estado = "prova";
      title = `${provas[dataStr].subjectNome} — ${provas[dataStr].nome}`;
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
    provas,
    diasEstudados: Object.values(estudouPorData).filter(Boolean).length,
    questoesPorDia: await contarQuestoesDoMes(supabase, user, inicio, fim, tarefas),
  };
}

/**
 * Quantas questões o aluno respondeu por (dia, disciplina) no intervalo.
 *
 * O caminho é `question_attempts.mission_id` → `missions (subject_id, data)`,
 * e não a data da própria tentativa: `missions.data` é o que o app inteiro
 * chama de "dia de estudo" (é como a ofensiva, o heatmap e as metas do dia já
 * contam), enquanto `created_at` é timestamptz e jogaria a virada da noite
 * pro dia seguinte em UTC.
 */
async function contarQuestoesDoMes(
  supabase: SupabaseClient,
  user: { id: string },
  inicio: string,
  fim: string,
  tarefas: Record<string, TarefaRow[]>,
): Promise<Record<string, Record<string, number>>> {
  const temMeta = Object.values(tarefas).some((lista) => lista.some((t) => t.tipo === "meta"));
  if (!temMeta) return {};

  const { data: missoes } = await supabase
    .from("missions")
    .select("id, subject_id, data")
    .eq("user_id", user.id)
    .gte("data", inicio)
    .lte("data", fim);

  const infoMissao = new Map<string, { subjectId: string; data: string }>();
  ((missoes || []) as { id: string; subject_id: string | null; data: string }[]).forEach((m) => {
    if (!m.subject_id) return;
    infoMissao.set(m.id, { subjectId: m.subject_id, data: String(m.data).slice(0, 10) });
  });
  if (infoMissao.size === 0) return {};

  const ids = Array.from(infoMissao.keys());
  const tentativas = await emLotes<string, { mission_id: string | null }>(ids, (lote) =>
    supabase.from("question_attempts").select("mission_id").eq("user_id", user.id).in("mission_id", lote),
  );

  const porDia: Record<string, Record<string, number>> = {};
  tentativas.forEach((t) => {
    const info = t.mission_id ? infoMissao.get(t.mission_id) : null;
    if (!info) return;
    const doDia = (porDia[info.data] ||= {});
    doDia[info.subjectId] = (doDia[info.subjectId] || 0) + 1;
  });
  return porDia;
}
