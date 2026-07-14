import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import type { Pergunta } from "@/lib/questao/types";
import type { Dificuldade, PoolPerguntas } from "./types";

// Loaders da Arena de Xadrez — mesmo padrão dos *-data.ts das outras
// features: funções que recebem o SupabaseClient e não conhecem sessão.

// Quantas perguntas sortear por tier no início da partida. A partida
// raramente passa de ~25 rodadas; se o pool esgotar, o client recicla
// perguntas já vistas (com XP 0 — o cap server-side mata farm de qualquer
// jeito).
const TAMANHO_POOL: Record<Dificuldade, number> = { facil: 12, medio: 16, dificil: 12 };

// Limite free: 1 partida/dia. Conta pela criação da linha (que acontece no
// INÍCIO da partida) — abandonar/F5 não devolve o slot. TZ do servidor já
// está pinada em America/Sao_Paulo (next.config.ts), então "hoje" local é
// direto.
export async function contarPartidasHoje(supabase: SupabaseClient, userId: string): Promise<number> {
  const meiaNoiteLocal = new Date(new Date().toDateString());
  const { count } = await supabase
    .from("partidas_xadrez")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("criado_em", meiaNoiteLocal.toISOString());
  return count || 0;
}

// Monta o pool de perguntas da partida em 1 leva: resolve os tópicos do
// escopo (uma disciplina ou todas as matérias do aluno), sorteia ids por
// dificuldade e só então busca as linhas completas das escolhidas — mantém
// o payload pequeno mesmo com um banco grande.
export async function montarPoolPerguntas(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string | null,
): Promise<PoolPerguntas | null> {
  let materiaIds: string[];
  if (subjectId) {
    const { data: subject } = await supabase
      .from("subjects")
      .select("materia_id")
      .eq("id", subjectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!subject?.materia_id) return null;
    materiaIds = [subject.materia_id];
  } else {
    const { data: subjects } = await supabase.from("subjects").select("materia_id").eq("user_id", userId);
    materiaIds = (subjects || []).map((s) => s.materia_id).filter(Boolean) as string[];
    if (materiaIds.length === 0) return null;
  }

  const { data: topicos } = await supabase.from("topicos").select("id").in("materia_id", materiaIds);
  const topicoIds = (topicos || []).map((t) => t.id);
  if (topicoIds.length === 0) return null;

  const { data: candidatas } = await supabase
    .from("questions")
    .select("id, dificuldade")
    .in("topic_id", topicoIds);
  if (!candidatas || candidatas.length === 0) return null;

  const porTier: Record<Dificuldade, string[]> = { facil: [], medio: [], dificil: [] };
  candidatas.forEach((q) => {
    const d = (q.dificuldade as Dificuldade) || "medio";
    (porTier[d] || porTier.medio).push(q.id);
  });

  const escolhidos = (Object.keys(TAMANHO_POOL) as Dificuldade[]).flatMap((tier) =>
    questlyEmbaralhar(porTier[tier]).slice(0, TAMANHO_POOL[tier]),
  );
  if (escolhidos.length === 0) return null;

  const { data: completas } = await supabase.from("questions").select("*").in("id", escolhidos);
  if (!completas || completas.length === 0) return null;

  const pool: PoolPerguntas = { facil: [], medio: [], dificil: [] };
  (completas as Pergunta[]).forEach((q) => {
    const d = (q.dificuldade as Dificuldade) || "medio";
    (pool[d] || pool.medio).push(q);
  });
  // re-embaralha dentro do tier (o .in() devolve em ordem arbitrária, mas
  // não a ordem sorteada)
  (Object.keys(pool) as Dificuldade[]).forEach((tier) => {
    pool[tier] = questlyEmbaralhar(pool[tier]);
  });
  return pool;
}
