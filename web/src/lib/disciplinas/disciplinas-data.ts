// Dados de "Disciplinas" (prática livre): portado de js/disciplinas.js —
// o aluno monta sua própria missão avulsa (avulsa=true) escolhendo
// disciplina, tópicos, dificuldade e quantidade, em vez de esperar a
// missão gerada automaticamente pro dia.
import type { SupabaseClient } from "@supabase/supabase-js";
import { diasAte } from "@/lib/questly/shared";

type BossRow = { id: string; nome: string; data_prova: string };

export type DisciplinaPratica = {
  /** null quando o aluno não tem essa disciplina cadastrada como subject —
   *  ele está só navegando o banco de questões, sem vínculo de campanha. */
  subjectId: string | null;
  materiaId: string;
  nome: string;
  /** true = o aluno cadastrou essa disciplina no onboarding/Configurações. */
  matriculada: boolean;
  bossNome: string | null;
  diasAteProva: number | null;
};

type LinhaComQuestao = { topicos: { materia_id: string | null } | null };

// Toda matéria com pelo menos 1 questão no banco — independente do aluno ter
// escolhido essa disciplina no onboarding. Antes, Banco/Listas de Questões só
// mostravam os `subjects` do aluno, então conteúdo real (ex.: "Fundamentos de
// Cálculo e Geometria") ficava invisível pra quem nunca adicionou aquele nome
// exato como disciplina seguindo o pattern `topicos!inner`/`materias(nome)`
// já usado em lib/cursos/actions.ts e lib/admin/actions.ts.
async function contarQuestoesPorMateria(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data } = await supabase.from("questions").select("topicos!inner ( materia_id )");

  const contagem = new Map<string, number>();
  for (const row of (data || []) as unknown as LinhaComQuestao[]) {
    const mid = row.topicos?.materia_id;
    if (!mid) continue;
    contagem.set(mid, (contagem.get(mid) || 0) + 1);
  }
  return contagem;
}

export async function carregarDisciplinasPratica(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<DisciplinaPratica[]> {
  const hoje = new Date(new Date().toDateString());

  const [{ data: subjects }, { data: materias }, contagemPorMateria] = await Promise.all([
    supabase.from("subjects").select("id, nome, materia_id, bosses(id, nome, data_prova)").eq("user_id", user.id),
    supabase.from("materias").select("id, nome"),
    contarQuestoesPorMateria(supabase),
  ]);

  const subjectPorMateria = new Map<
    string,
    { id: string; nome: string; bossNome: string | null; diasAteProva: number | null }
  >();
  (subjects || []).forEach((s) => {
    if (!s.materia_id) return;
    const futuros = ((s.bosses as BossRow[]) || [])
      .filter((b) => new Date(b.data_prova) >= hoje)
      .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
    const proximoBoss = futuros[0] || null;
    subjectPorMateria.set(s.materia_id, {
      id: s.id,
      nome: s.nome,
      bossNome: proximoBoss?.nome || null,
      diasAteProva: proximoBoss ? diasAte(proximoBoss.data_prova) : null,
    });
  });

  return (materias || [])
    .filter((m) => (contagemPorMateria.get(m.id) || 0) > 0)
    .map((m) => {
      const sub = subjectPorMateria.get(m.id);
      return {
        subjectId: sub?.id ?? null,
        materiaId: m.id,
        nome: sub?.nome || m.nome,
        matriculada: Boolean(sub),
        bossNome: sub?.bossNome ?? null,
        diasAteProva: sub?.diasAteProva ?? null,
      };
    })
    .sort((a, b) => {
      if (a.matriculada !== b.matriculada) return a.matriculada ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    });
}

export type MateriaComQuestoes = { id: string; nome: string; totalQuestoes: number };

// Usado no onboarding: como o app ainda não sabe em que semestre o aluno
// está, sugerir o que JÁ tem questões prontas no banco é mais útil que só
// uma lista curada por curso (que pode incluir disciplina sem conteúdo
// ainda, ou deixar de fora conteúdo real de outro semestre).
export async function listarMateriasComQuestoes(supabase: SupabaseClient): Promise<MateriaComQuestoes[]> {
  const [{ data: materias }, contagemPorMateria] = await Promise.all([
    supabase.from("materias").select("id, nome"),
    contarQuestoesPorMateria(supabase),
  ]);

  return (materias || [])
    .map((m) => ({ id: m.id, nome: m.nome, totalQuestoes: contagemPorMateria.get(m.id) || 0 }))
    .filter((m) => m.totalQuestoes > 0)
    .sort((a, b) => b.totalQuestoes - a.totalQuestoes || a.nome.localeCompare(b.nome));
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
