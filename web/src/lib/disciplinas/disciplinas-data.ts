// Dados de "Disciplinas" (prática livre): portado de js/disciplinas.js —
// o aluno monta sua própria missão avulsa (avulsa=true) escolhendo
// disciplina, tópicos, dificuldade e quantidade, em vez de esperar a
// missão gerada automaticamente pro dia.
import type { SupabaseClient } from "@supabase/supabase-js";
import { diasAte } from "@/lib/questly/shared";

type BossRow = { id: string; nome: string; data_prova: string };

export type DisciplinaPratica = {
  subjectId: string;
  nome: string;
  materiaId: string | null;
  bossNome: string | null;
  diasAteProva: number | null;
};

export async function carregarDisciplinasPratica(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<DisciplinaPratica[]> {
  const { data } = await supabase
    .from("subjects")
    .select("id, nome, materia_id, bosses(id, nome, data_prova)")
    .eq("user_id", user.id)
    .order("nome");

  const hoje = new Date(new Date().toDateString());

  return (data || []).map((s) => {
    const futuros = ((s.bosses as BossRow[]) || [])
      .filter((b) => new Date(b.data_prova) >= hoje)
      .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
    const proximoBoss = futuros[0] || null;
    return {
      subjectId: s.id,
      nome: s.nome,
      materiaId: s.materia_id,
      bossNome: proximoBoss?.nome || null,
      diasAteProva: proximoBoss ? diasAte(proximoBoss.data_prova) : null,
    };
  });
}

export type TopicoPratica = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number | null;
  totalQuestoes: number;
  taxaAcerto: number | null; // null = ainda sem dados do aluno nesse tópico
  numRespondidas: number;
};

// só topicos com pelo menos uma questão fazem sentido pra escolher — os
// sem banco ainda ficam de fora do seletor (poluiriam sem servir pra nada)
export async function carregarTopicosPratica(
  supabase: SupabaseClient,
  user: { id: string },
  materiaId: string,
): Promise<TopicoPratica[]> {
  const { data: topicos } = await supabase
    .from("topicos")
    .select("id, nome, descricao, ordem")
    .eq("materia_id", materiaId);
  if (!topicos || topicos.length === 0) return [];

  const topicoIds = topicos.map((t) => t.id);
  const [{ data: questoes }, { data: progressos }] = await Promise.all([
    supabase.from("questions").select("topic_id").in("topic_id", topicoIds),
    supabase
      .from("aluno_topico_progresso")
      .select("topico_id, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", user.id)
      .in("topico_id", topicoIds),
  ]);

  const countPorTopico: Record<string, number> = {};
  (questoes || []).forEach((q) => {
    countPorTopico[q.topic_id] = (countPorTopico[q.topic_id] || 0) + 1;
  });
  const progPorTopico: Record<string, { taxa_acerto: number; num_questoes_respondidas: number }> = {};
  (progressos || []).forEach((p) => {
    progPorTopico[p.topico_id] = p;
  });

  return topicos
    .map((t) => {
      const p = progPorTopico[t.id];
      return {
        id: t.id,
        nome: t.nome,
        descricao: t.descricao,
        ordem: t.ordem,
        totalQuestoes: countPorTopico[t.id] || 0,
        taxaAcerto: p && p.num_questoes_respondidas > 0 ? p.taxa_acerto : null,
        numRespondidas: p?.num_questoes_respondidas || 0,
      };
    })
    .filter((t) => t.totalQuestoes > 0)
    .sort((a, b) => {
      const oa = a.ordem ?? Infinity;
      const ob = b.ordem ?? Infinity;
      if (oa !== ob) return oa - ob;
      return a.nome.localeCompare(b.nome);
    });
}
