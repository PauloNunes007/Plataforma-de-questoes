// Tarefas pontuais que o aluno adiciona no calendário do dashboard —
// diferente de rotina_semanal (recorrente, dia-da-semana fixo), cada linha
// aqui é amarrada a uma DATA específica (ver supabase_tarefas_semanais.sql).
import type { SupabaseClient } from "@supabase/supabase-js";

export type TarefaRow = {
  id: string;
  nome: string;
  descricao: string | null;
  data: string;
  concluida: boolean;
  subjectId: string | null;
  subjectNome: string | null;
};

type TarefaQueryRow = {
  id: string;
  nome: string;
  descricao: string | null;
  data: string;
  concluida: boolean;
  subject_id: string | null;
  subjects: { nome: string } | null;
};

// Busca as tarefas do aluno num intervalo de datas (o dashboard usa o mês
// exibido no calendário, que sempre cobre a semana corrente) e agrupa por
// data — formato direto pro CalendarRailCard marcar dias com tarefa e pro
// TarefasDoDiaCard filtrar só o dia de hoje.
export async function carregarTarefasIntervalo(
  supabase: SupabaseClient,
  user: { id: string },
  inicio: string,
  fim: string,
): Promise<Record<string, TarefaRow[]>> {
  const { data } = await supabase
    .from("tarefas")
    .select("id, nome, descricao, data, concluida, subject_id, subjects(nome)")
    .eq("user_id", user.id)
    .gte("data", inicio)
    .lte("data", fim)
    .order("criado_em");

  const porData: Record<string, TarefaRow[]> = {};
  ((data || []) as unknown as TarefaQueryRow[]).forEach((t) => {
    const row: TarefaRow = {
      id: t.id,
      nome: t.nome,
      descricao: t.descricao,
      data: String(t.data).slice(0, 10),
      concluida: t.concluida,
      subjectId: t.subject_id,
      subjectNome: t.subjects?.nome || null,
    };
    (porData[row.data] ||= []).push(row);
  });
  return porData;
}
