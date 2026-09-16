import type { SupabaseClient } from "@supabase/supabase-js";

export type RetomarInfo = {
  missaoId: string;
  subjectNome: string | null;
  respondidas: number;
  total: number;
  pct: number;
  avulsa: boolean;
  recap: boolean;
  /** O dia da lista ("YYYY-MM-DD", `missions.data`). A home usa isto pra
   *  decidir quem fica com a faixa: uma lista aberta HOJE é o que o aluno está
   *  fazendo agora e ganha do plano; uma que ficou pela metade semana passada
   *  não pode ocupar a dobra no lugar do bloco marcado pra hoje. */
  data: string;
  /** O bloco do calendário que originou essa lista, quando ela veio de um
   *  ("Revisar derivadas"). É o que faz o cartão de progresso continuar
   *  chamando o estudo pelo nome que o ALUNO deu, em vez de trocá-lo pelo
   *  nome da disciplina assim que a primeira questão é respondida. */
  planoNome: string | null;
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
  const [{ data: tentativas }, { data: blocos }] = await Promise.all([
    supabase.from("question_attempts").select("mission_id, question_id").in("mission_id", ids),
    // O bloco do calendário que virou cada uma dessas listas, se houver
    // (supabase_sessao_lista.sql). Vem na mesma onda das tentativas: são as
    // mesmas ~15 missões, e uma segunda ida ao banco depois de escolher a
    // missão custaria um round-trip serial no caminho crítico da home.
    supabase.from("tarefas").select("nome, mission_id").eq("user_id", userId).in("mission_id", ids),
  ]);

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

  const nomePorMissao = new Map<string, string>();
  for (const b of (blocos as { nome: string; mission_id: string | null }[] | null) ?? []) {
    if (b.mission_id && b.nome?.trim()) nomePorMissao.set(b.mission_id, b.nome.trim());
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
      data: String(m.data ?? "").slice(0, 10),
      planoNome: nomePorMissao.get(m.id) ?? null,
    };
  }

  return null;
}
