// Portado de js/rotina-engine.js — grade semanal (em qual dia da semana o
// aluno estuda cada disciplina) e a divisão do tempo diário entre as
// disciplinas de um mesmo dia. Ver comentário original no arquivo legado
// pra fundamentação (Weighted Fair Queuing / Hamilton apportionment).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Boss, DiaSemana } from "./shared";

export type SubjectComPeso = {
  id: string;
  bosses?: Boss[] | null;
  chance_aprovacao?: number | null;
  nota_desejada?: number | null;
};

export const QUESTLY_PESO_URGENCIA = 0.45;
export const QUESTLY_PESO_FRAGILIDADE = 0.35;
export const QUESTLY_PESO_META = 0.2;
const QUESTLY_ESCALA_URGENCIA = 3;

export const QUESTLY_MIN_MINUTOS_POR_DISCIPLINA = 75;
export const QUESTLY_MAX_DISCIPLINAS_POR_DIA = 4;

export function questlyPesoDisciplina(subject: SubjectComPeso, hoje: Date): number {
  const bossesFuturos = (subject.bosses || [])
    .filter((b) => new Date(b.data_prova) >= hoje)
    .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
  const proximoBoss = bossesFuturos[0] || null;
  const diasAteProva = proximoBoss
    ? Math.max(1, Math.round((new Date(proximoBoss.data_prova).getTime() - hoje.getTime()) / 86400000))
    : 60;
  const urgencia = (1 / (diasAteProva + 3)) * QUESTLY_ESCALA_URGENCIA;

  const chance = subject.chance_aprovacao != null ? subject.chance_aprovacao / 100 : 0.5;
  const fragilidade = 1 - chance;

  const meta = (subject.nota_desejada || 6) / 10;

  return (
    urgencia * QUESTLY_PESO_URGENCIA +
    fragilidade * QUESTLY_PESO_FRAGILIDADE +
    meta * QUESTLY_PESO_META
  );
}

export function questlyDisciplinasPorDia(numDisciplinas: number, tempoDiarioMin: number): number {
  const bruto = Math.round((tempoDiarioMin || 30) / QUESTLY_MIN_MINUTOS_POR_DISCIPLINA);
  return Math.max(1, Math.min(bruto, numDisciplinas, QUESTLY_MAX_DISCIPLINAS_POR_DIA));
}

export function questlyRecomendarRotina(
  subjects: SubjectComPeso[],
  diasDisponiveis: string[],
  tempoDiarioMin: number,
): Record<string, string[]> {
  if (!subjects.length || !diasDisponiveis.length) return {};

  const hoje = new Date(new Date().toDateString());
  const pesos = subjects.map((s) => ({ id: s.id, peso: Math.max(0.001, questlyPesoDisciplina(s, hoje)) }));
  const disciplinasPorDia = questlyDisciplinasPorDia(subjects.length, tempoDiarioMin);
  const somaPesos = pesos.reduce((a, p) => a + p.peso, 0);
  const mediaPeso = somaPesos / pesos.length;

  const credito: Record<string, number> = {};
  pesos.forEach((p) => (credito[p.id] = 0));

  const rotina: Record<string, string[]> = {};
  diasDisponiveis.forEach((dia) => {
    pesos.forEach((p) => (credito[p.id] += p.peso));
    const ordenados = pesos.slice().sort((a, b) => credito[b.id] - credito[a.id]);
    const escolhidos = ordenados.slice(0, disciplinasPorDia);
    rotina[dia] = escolhidos.map((p) => p.id);
    escolhidos.forEach((p) => (credito[p.id] -= mediaPeso));
  });

  return rotina;
}

export function questlyApportionarMinutos(
  subjectsHoje: SubjectComPeso[],
  tempoDiarioMin: number,
): Record<string, number> {
  if (!subjectsHoje.length) return {};
  if (subjectsHoje.length === 1) {
    return { [subjectsHoje[0].id]: tempoDiarioMin };
  }

  const hoje = new Date(new Date().toDateString());
  const pesos = subjectsHoje.map((s) => ({ id: s.id, peso: Math.max(0.001, questlyPesoDisciplina(s, hoje)) }));
  const somaPesos = pesos.reduce((a, p) => a + p.peso, 0);

  const exatos = pesos.map((p) => ({ id: p.id, exato: (p.peso / somaPesos) * tempoDiarioMin }));
  const base = exatos.map((e) => ({ id: e.id, min: Math.floor(e.exato), resto: e.exato - Math.floor(e.exato) }));
  const atribuido = base.reduce((a, b) => a + b.min, 0);
  const falta = tempoDiarioMin - atribuido;
  base.sort((a, b) => b.resto - a.resto);
  for (let i = 0; i < falta; i++) base[i % base.length].min++;

  const resultado: Record<string, number> = {};
  base.forEach((b) => (resultado[b.id] = b.min));
  return resultado;
}

export type RotinaLinha = { subject_id: string; dia_semana: DiaSemana };

export async function questlyBuscarRotinaCompleta(
  supabase: SupabaseClient,
  userId: string,
): Promise<RotinaLinha[]> {
  const { data, error } = await supabase
    .from("rotina_semanal")
    .select("subject_id, dia_semana")
    .eq("user_id", userId);
  if (error) {
    console.error("Erro ao buscar grade semanal:", error);
    return [];
  }
  return data || [];
}

export async function questlySalvarRotina(
  supabase: SupabaseClient,
  userId: string,
  rotinaPorDia: Record<string, string[]>,
) {
  const { error: delError } = await supabase.from("rotina_semanal").delete().eq("user_id", userId);
  if (delError) {
    console.error("Erro ao limpar grade semanal:", delError);
    return { error: delError };
  }

  const linhas: { user_id: string; subject_id: string; dia_semana: string }[] = [];
  Object.keys(rotinaPorDia).forEach((dia) => {
    (rotinaPorDia[dia] || []).forEach((subjectId) => {
      linhas.push({ user_id: userId, subject_id: subjectId, dia_semana: dia });
    });
  });
  if (linhas.length === 0) return { error: null };

  const { error: insError } = await supabase.from("rotina_semanal").insert(linhas);
  if (insError) console.error("Erro ao salvar grade semanal:", insError);
  return { error: insError };
}
