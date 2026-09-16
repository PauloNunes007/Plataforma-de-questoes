// Itens da agenda do aluno — tarefas pontuais E sessões de estudo agendadas.
// Diferente de rotina_semanal (recorrente, dia-da-semana fixo, sobra do motor
// de missões que não existe mais), cada linha aqui é amarrada a uma DATA específica
// (ver supabase_tarefas_semanais.sql + supabase_sessoes_agenda.sql).
//
// `tipo` separa DUAS marcações (eram três — ver abaixo):
//   • "tarefa" — afazer solto: entregar uma lista, falar com o professor.
//     Não tem disciplina obrigatória, hora nem alvo, e não vira lista de
//     questões;
//   • "sessao" — o BLOCO DE ESTUDO de uma disciplina. Pode ter `hora` e
//     `duracaoMin` (quando o aluno marca o horário), pode ter `metaQuestoes`
//     (quando ele prefere medir em questões) e pode ter os dois.
//
// **"meta" é o MESMO bloco, escrito por uma versão anterior do app.** Sessão e
// meta eram dois botões que respondiam à mesma pergunta — "vou estudar tal
// matéria hoje" — e só divergiam na unidade (minutos ou questões); o aluno
// tinha que escolher entre dois formulários quase idênticos antes de escrever
// a mesma coisa. Hoje existe um só ("Estudo"), que grava `tipo='sessao'`. As
// linhas antigas continuam válidas e são desenhadas do mesmo jeito: quem
// pergunta "isto é estudo?" usa `ehEstudo`, não `tipo === "sessao"`.
//
// O PROGRESSO da meta não mora aqui: é recontado na leitura a partir de
// question_attempts -> missions, em lib/agenda/agenda-data.ts. Guardar um
// contador nesta linha criaria um segundo lugar pra mesma verdade — e um
// jeito óbvio de forjá-la.
//
// `missionId` (supabase_sessao_lista.sql) é o elo com a EXECUÇÃO: a lista de
// questões que nasceu deste bloco. É o que deixa a home oferecer "Começar" no
// próprio plano, manter o nome que o aluno deu ao bloco enquanto ele resolve,
// e riscar o bloco quando a lista fecha.
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
  /** Quantas questões o bloco pede; null quando ele é medido só em tempo. */
  metaQuestoes: number | null;
  /** A lista de questões que já nasceu deste bloco, se o aluno começou. */
  missionId: string | null;
};

/** Este item é um bloco de estudo (e não um afazer solto)? Inclui as linhas
 *  antigas gravadas como "meta" — ver o comentário do topo. */
export function ehEstudo(t: { tipo: TipoItemAgenda }): boolean {
  return t.tipo === "sessao" || t.tipo === "meta";
}

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
  mission_id: string | null;
};

const COLUNAS =
  "id, nome, descricao, data, concluida, subject_id, subjects(nome), tipo, hora, duracao_min, meta_questoes, mission_id";

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
    missionId: t.mission_id ?? null,
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

/** Minutos de estudo já reservados num dia. Soma `duracaoMin` de qualquer
 *  item porque só bloco de estudo chega a ter duração — filtrar por `tipo`
 *  aqui seria uma condição que nunca muda o resultado. */
export function minutosReservados(itens: TarefaRow[]): number {
  return itens.reduce((acc, t) => acc + (t.duracaoMin || 0), 0);
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
  // Loga o erro em vez de só descartar: um SELECT quebrado aqui (coluna
  // faltando por uma migração que não rodou, RLS mudada, etc.) antes falhava
  // em silêncio — o calendário simplesmente aparecia vazio, sem pista
  // nenhuma no log de por quê (foi exatamente o que aconteceu quando
  // supabase_agenda_metas.sql rodou fora de ordem e `meta_questoes` ficou
  // faltando: todo insert falhava barulhento no console, mas essa leitura
  // falhava calada).
  const { data, error } = await supabase
    .from("tarefas")
    .select(COLUNAS)
    .eq("user_id", user.id)
    .gte("data", inicio)
    .lte("data", fim)
    .order("criado_em");
  if (error) console.error("Erro ao carregar tarefas do intervalo:", error);

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
