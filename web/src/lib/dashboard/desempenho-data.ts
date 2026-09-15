import type { SupabaseClient } from "@supabase/supabase-js";
import { LOTE_IN } from "@/lib/supabase/paginado";

// Dados da aba "Desempenho" da home: acertabilidade por área (radar),
// evolução dia a dia e os tópicos que o aluno mais erra.
//
// O payload é DELIBERADAMENTE agregado no servidor por (dia, tópico) em vez
// de mandar a lista crua de tentativas: um aluno com 1.600 questões viraria
// ~150KB no payload RSC de TODA carga da home. Agregado, o mesmo histórico
// cabe em algumas centenas de linhas (um aluno toca 2–3 tópicos por dia), e
// o cliente ainda consegue recortar qualquer período — que é o que o filtro
// Total/7/30/60/90 dias precisa.
//
// Tudo aqui é do PRÓPRIO aluno (question_attempts é RLS dono-only).

/** Uma linha = um tópico num dia. `n` questões respondidas, `a` acertos. */
export type BucketDesempenho = {
  /** YYYY-MM-DD (data local do aluno, já normalizada) */
  d: string;
  /** índice em `topicos` */
  t: number;
  n: number;
  a: number;
};

export type DesempenhoDados = {
  buckets: BucketDesempenho[];
  /** nomes dos tópicos, indexados por `BucketDesempenho.t` */
  topicos: string[];
  /** índice da matéria de cada tópico (mesmo índice do array `topicos`) */
  topicoMateria: number[];
  /** nomes das matérias */
  materias: string[];
  /** o histórico foi cortado no teto (aluno com mais de LIMITE tentativas) */
  truncado: boolean;
};

export const DESEMPENHO_VAZIO: DesempenhoDados = {
  buckets: [],
  topicos: [],
  topicoMateria: [],
  materias: [],
  truncado: false,
};

// Teto do histórico lido. Acima disso o recorte mais recente já descreve o
// aluno melhor do que a cauda antiga — e o aviso de truncado aparece na UI.
const LIMITE_TENTATIVAS = 8000;
// LOTE_IN vem de lib/supabase/paginado.ts: o valor local era 400, acima do
// teto real de URL do gateway (~330 uuids) — cada lote falhava e o mapa de
// tópico/matéria da aba Desempenho saía vazio em conta com histórico grande.

type Tentativa = { question_id: string; correta: boolean | null; created_at: string };

export async function carregarDesempenho(
  supabase: SupabaseClient,
  userId: string,
): Promise<DesempenhoDados> {
  const { data: tentativasRaw } = await supabase
    .from("question_attempts")
    .select("question_id, correta, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(LIMITE_TENTATIVAS + 1);

  const tentativas = (tentativasRaw as Tentativa[] | null) ?? [];
  if (tentativas.length === 0) return DESEMPENHO_VAZIO;

  const truncado = tentativas.length > LIMITE_TENTATIVAS;
  const usadas = truncado ? tentativas.slice(0, LIMITE_TENTATIVAS) : tentativas;

  // questão → tópico
  const idsQuestoes = Array.from(new Set(usadas.map((t) => t.question_id).filter(Boolean)));
  const topicoPorQuestao = new Map<string, string>();
  for (let i = 0; i < idsQuestoes.length; i += LOTE_IN) {
    const { data } = await supabase
      .from("questions")
      .select("id, topic_id")
      .in("id", idsQuestoes.slice(i, i + LOTE_IN));
    for (const q of (data as { id: string; topic_id: string | null }[] | null) ?? []) {
      if (q.topic_id) topicoPorQuestao.set(q.id, q.topic_id);
    }
  }

  // tópico → nome + matéria
  const idsTopicos = Array.from(new Set(topicoPorQuestao.values()));
  const infoTopico = new Map<string, { nome: string; materiaId: string | null }>();
  for (let i = 0; i < idsTopicos.length; i += LOTE_IN) {
    const { data } = await supabase
      .from("topicos")
      .select("id, nome, materia_id")
      .in("id", idsTopicos.slice(i, i + LOTE_IN));
    for (const t of (data as { id: string; nome: string; materia_id: string | null }[] | null) ?? []) {
      infoTopico.set(t.id, { nome: t.nome, materiaId: t.materia_id });
    }
  }

  const idsMaterias = Array.from(
    new Set(Array.from(infoTopico.values()).map((t) => t.materiaId).filter(Boolean) as string[]),
  );
  const nomeMateria = new Map<string, string>();
  for (let i = 0; i < idsMaterias.length; i += LOTE_IN) {
    const { data } = await supabase
      .from("materias")
      .select("id, nome")
      .in("id", idsMaterias.slice(i, i + LOTE_IN));
    for (const m of (data as { id: string; nome: string }[] | null) ?? []) {
      nomeMateria.set(m.id, m.nome);
    }
  }

  // Dicionários (índices estáveis) + agregação por (dia, tópico).
  const materias: string[] = [];
  const indiceMateria = new Map<string, number>();
  const topicos: string[] = [];
  const topicoMateria: number[] = [];
  const indiceTopico = new Map<string, number>();

  function idxMateria(id: string | null): number {
    const nome = (id && nomeMateria.get(id)) || "Outros";
    const chave = id || "__sem__";
    let i = indiceMateria.get(chave);
    if (i === undefined) {
      i = materias.length;
      materias.push(nome);
      indiceMateria.set(chave, i);
    }
    return i;
  }

  function idxTopico(id: string): number {
    let i = indiceTopico.get(id);
    if (i === undefined) {
      const info = infoTopico.get(id);
      i = topicos.length;
      topicos.push(info?.nome || "Tópico");
      topicoMateria.push(idxMateria(info?.materiaId ?? null));
      indiceTopico.set(id, i);
    }
    return i;
  }

  const porChave = new Map<string, BucketDesempenho>();
  for (const t of usadas) {
    const topicoId = topicoPorQuestao.get(t.question_id);
    if (!topicoId) continue; // questão apagada do banco: não inventa bucket
    const dia = String(t.created_at).slice(0, 10);
    const ti = idxTopico(topicoId);
    const chave = `${dia}|${ti}`;
    let b = porChave.get(chave);
    if (!b) {
      b = { d: dia, t: ti, n: 0, a: 0 };
      porChave.set(chave, b);
    }
    b.n += 1;
    if (t.correta) b.a += 1;
  }

  const buckets = Array.from(porChave.values()).sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : 0));

  return { buckets, topicos, topicoMateria, materias, truncado };
}
