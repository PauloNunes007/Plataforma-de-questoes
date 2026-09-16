import type { SupabaseClient } from "@supabase/supabase-js";

export type RetomarInfo = {
  missaoId: string;
  subjectNome: string | null;
  respondidas: number;
  total: number;
  pct: number;
  avulsa: boolean;
  recap: boolean;
} | null;

type MissaoLinha = {
  id: string;
  question_ids: string[] | null;
  qtd_questoes: number | null;
  subject_id: string | null;
  avulsa: boolean | null;
  recap_topico_id: string | null;
  data: string | null;
  subjects: { nome: string } | { nome: string }[] | null;
};

// "Continuar de onde parou": acha a missão MAIS RECENTE que o aluno começou
// (tem ≥1 questão respondida) mas ainda não concluiu, e devolve o progresso.
// Retorna null quando não há nada em andamento — nesse caso a UI não mostra o
// card. Sem schema novo: lê `missions` (incompletas) + conta respostas
// distintas em `question_attempts`.
export async function carregarRetomar(
  supabase: SupabaseClient,
  userId: string,
): Promise<RetomarInfo> {
  const { data: missoesRaw } = await supabase
    .from("missions")
    .select("id, question_ids, qtd_questoes, subject_id, avulsa, recap_topico_id, data, subjects(nome)")
    .eq("user_id", userId)
    .eq("concluida", false)
    // O filtro `adiada_para is null` saiu com o motor de missões: adiar era
    // uma ação da missão do dia, que não existe mais. Uma lista que ficou
    // pela metade é exatamente "de onde você parou", inclusive as que foram
    // empurradas pra frente na época em que dava pra adiar.
    .order("data", { ascending: false })
    .limit(15);

  const missoes = (missoesRaw as MissaoLinha[] | null) ?? [];
  if (missoes.length === 0) return null;

  const ids = missoes.map((m) => m.id);
  const { data: tentativas } = await supabase
    .from("question_attempts")
    .select("mission_id, question_id")
    .in("mission_id", ids);

  // respondidas distintas por missão
  const respondidasPorMissao = new Map<string, Set<string>>();
  for (const t of (tentativas as { mission_id: string; question_id: string }[] | null) ?? []) {
    if (!t.mission_id) continue;
    let set = respondidasPorMissao.get(t.mission_id);
    if (!set) {
      set = new Set();
      respondidasPorMissao.set(t.mission_id, set);
    }
    if (t.question_id) set.add(t.question_id);
  }

  // missoes já vem por `data` desc → a primeira parcialmente feita é a mais recente.
  for (const m of missoes) {
    const total = m.question_ids?.length || m.qtd_questoes || 0;
    if (total <= 0) continue;
    const respondidas = respondidasPorMissao.get(m.id)?.size || 0;
    if (respondidas <= 0 || respondidas >= total) continue;

    const subj = Array.isArray(m.subjects) ? m.subjects[0] : m.subjects;
    return {
      missaoId: m.id,
      subjectNome: subj?.nome ?? null,
      respondidas,
      total,
      pct: Math.round((respondidas / total) * 100),
      avulsa: !!m.avulsa,
      recap: !!m.recap_topico_id,
    };
  }

  return null;
}
