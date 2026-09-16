// Itens da agenda do aluno — tarefas pontuais E sessões de estudo agendadas.
// Diferente de rotina_semanal (recorrente, dia-da-semana fixo, alimenta o
// mission-engine), cada linha aqui é amarrada a uma DATA específica
// (ver supabase_tarefas_semanais.sql + supabase_sessoes_agenda.sql).
//
// `tipo` separa as duas leituras que a agenda faz do mesmo registro:
//   • "tarefa" — item de lista, sem horário obrigatório;
//   • "sessao" — bloco de estudo com `hora` e `duracaoMin`, que a agenda
//     desenha na ordem do relógio e soma pra dizer quanto tempo o dia tem
//     reservado;
//   • "meta" — alvo de `metaQuestoes` questões numa disciplina naquele dia
//     (ver supabase_agenda_metas.sql). O PROGRESSO da meta não mora aqui: é
//     recontado na leitura a partir de question_attempts -> missions, em
//     lib/agenda/agenda-data.ts. Guardar um contador nesta linha criaria um
//     segundo lugar pra mesma verdade — e um jeito óbvio de forjá-la.
import type { SupabaseClient } from "@supabase/supabase-js";

export type TipoItemAgenda = "tarefa" | "sessao" | "meta";

export type TarefaRow = {
  id: string;
  nome: string;
  descricao: string | null;
  data: string;
  concluida: boolean;
  subjectId: string | null;
  subjectNome: string | null;
  tipo: TipoItemAgenda;
  /** "HH:MM" ou null (tarefa sem horário) */
  hora: string | null;
  duracaoMin: number | null;
  /** Quantas questões a meta do dia pede; null em tarefa/sessão. */
  metaQuestoes: number | null;
};

type TarefaQueryRow = {
  id: string;
  nome: string;
  descricao: string | null;
  data: string;
  concluida: boolean;
  subject_id: string | null;
  subjects: { nome: string } | null;
  tipo: string | null;
  hora: string | null;
  duracao_min: number | null;
  meta_questoes: number | null;
};

const COLUNAS =
  "id, nome, descricao, data, concluida, subject_id, subjects(nome), tipo, hora, duracao_min, meta_questoes";

/** "19:00:00" (time do Postgres) → "19:00", que é o que o <input type="time"> quer. */
export function normalizarHora(hora: string | null): string | null {
  if (!hora) return null;
  const s = String(hora).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(s) ? s : null;
}

function paraRow(t: TarefaQueryRow): TarefaRow {
  return {
    id: t.id,
    nome: t.nome,
    descricao: t.descricao,
    data: String(t.data).slice(0, 10),
    concluida: t.concluida,
    subjectId: t.subject_id,
    subjectNome: t.subjects?.nome || null,
    tipo: t.tipo === "sessao" || t.tipo === "meta" ? t.tipo : "tarefa",
    hora: normalizarHora(t.hora),
    duracaoMin: t.duracao_min ?? null,
    metaQuestoes: t.meta_questoes ?? null,
  };
}

/**
 * Ordem de leitura do dia: o que tem hora marcada vem primeiro, na ordem do
 * relógio; o que não tem (tarefa solta) desce pro fim mantendo a ordem em que
 * foi escrito. Um item sem hora no meio da manhã bagunçaria a leitura de
 * "como é o meu dia".
 */
export function ordenarDia(itens: TarefaRow[]): TarefaRow[] {
  return [...itens].sort((a, b) => {
    if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
    if (a.hora) return -1;
    if (b.hora) return 1;
    return 0;
  });
}

/** Minutos de estudo já reservados num dia (só sessões, só o que tem duração). */
export function minutosReservados(itens: TarefaRow[]): number {
  return itens.reduce((acc, t) => acc + (t.tipo === "sessao" ? t.duracaoMin || 0 : 0), 0);
}

// Busca os itens do aluno num intervalo de datas (o dashboard usa o mês
// exibido no calendário, que sempre cobre a semana corrente) e agrupa por
// data — formato direto pra agenda marcar os dias e pro TarefasDoDiaCard
// filtrar só o dia de hoje.
export async function carregarTarefasIntervalo(
  supabase: SupabaseClient,
  user: { id: string },
  inicio: string,
  fim: string,
): Promise<Record<string, TarefaRow[]>> {
  const { data } = await supabase
    .from("tarefas")
    .select(COLUNAS)
    .eq("user_id", user.id)
    .gte("data", inicio)
    .lte("data", fim)
    .order("criado_em");

  const porData: Record<string, TarefaRow[]> = {};
  ((data || []) as unknown as TarefaQueryRow[]).forEach((t) => {
    const row = paraRow(t);
    (porData[row.data] ||= []).push(row);
  });
  Object.keys(porData).forEach((d) => {
    porData[d] = ordenarDia(porData[d]);
  });
  return porData;
}
