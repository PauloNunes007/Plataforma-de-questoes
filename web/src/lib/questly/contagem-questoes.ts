// Contagem de questões por tópico / por instituição, lida das views de
// supabase_escala_lancamento.sql.
//
// Antes, cada tela que precisava saber "quantas questões existem aqui" fazia
// `from("questions").select("topic_id").in(...)` e contava no JS. Isso trazia
// milhares de linhas pra produzir um punhado de números — e, pior, batia no
// teto de 1000 linhas do PostgREST e devolvia contagem ERRADA em silêncio
// (ver lib/supabase/paginado.ts). As views devolvem o agregado pronto: ~74
// linhas no lugar de 2.583.
//
// Tudo aqui é conteúdo compartilhado (nada por aluno), então não há filtro de
// user_id — a RLS de `questions` já governa quem enxerga o conteúdo, e as
// views só expõem contagem do que o aluno autenticado já podia ler.
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerPaginado } from "@/lib/supabase/paginado";

export type ContagemTopico = {
  topicId: string;
  topicoNome: string;
  topicoOrdem: number | null;
  materiaId: string;
  materiaNome: string;
  /** Todas as questões do tópico, aprofundamento incluído. */
  total: number;
  /** Só o que entra em sorteio automático (exclui questions.desafio). */
  totalRegular: number;
  /** Tempo médio por questão do tópico, em segundos — null quando nenhuma
   *  questão regular tem estimativa ainda (tempo desconhecido ≠ zero). */
  tempoMedioSeg: number | null;
};

type LinhaTopico = {
  topic_id: string;
  topico_nome: string | null;
  topico_ordem: number | null;
  materia_id: string;
  materia_nome: string | null;
  total: number;
  total_regular: number;
  tempo_soma_seg: number | null;
  tempo_amostra: number | null;
};

const COLUNAS_TOPICO =
  "topic_id, topico_nome, topico_ordem, materia_id, materia_nome, total, total_regular, tempo_soma_seg, tempo_amostra";

function paraContagem(l: LinhaTopico): ContagemTopico {
  const amostra = Number(l.tempo_amostra) || 0;
  return {
    topicId: l.topic_id,
    topicoNome: l.topico_nome || "Tópico",
    topicoOrdem: l.topico_ordem,
    materiaId: l.materia_id,
    materiaNome: l.materia_nome || "Disciplina",
    total: Number(l.total) || 0,
    totalRegular: Number(l.total_regular) || 0,
    tempoMedioSeg: amostra > 0 ? (Number(l.tempo_soma_seg) || 0) / amostra : null,
  };
}

/** Contagem de TODOS os tópicos com pelo menos uma questão. */
export async function contagemPorTopico(supabase: SupabaseClient): Promise<ContagemTopico[]> {
  const linhas = await lerPaginado<LinhaTopico>(
    () => supabase.from("vw_questoes_por_topico").select(COLUNAS_TOPICO),
    { ordenarPor: "topic_id" },
  );
  return linhas.map(paraContagem);
}

/** Idem, recortado a um conjunto de tópicos (trilha, missão, prática livre). */
export async function contagemDosTopicos(
  supabase: SupabaseClient,
  topicIds: string[],
): Promise<Map<string, ContagemTopico>> {
  if (topicIds.length === 0) return new Map();
  const linhas = await lerPaginado<LinhaTopico>(
    () => supabase.from("vw_questoes_por_topico").select(COLUNAS_TOPICO).in("topic_id", topicIds),
    { ordenarPor: "topic_id" },
  );
  return new Map(linhas.map((l) => [l.topic_id, paraContagem(l)]));
}

/** Idem, recortado às matérias (caminho da trilha, que parte da disciplina). */
export async function contagemDasMaterias(
  supabase: SupabaseClient,
  materiaIds: string[],
): Promise<ContagemTopico[]> {
  if (materiaIds.length === 0) return [];
  const linhas = await lerPaginado<LinhaTopico>(
    () => supabase.from("vw_questoes_por_topico").select(COLUNAS_TOPICO).in("materia_id", materiaIds),
    { ordenarPor: "topic_id" },
  );
  return linhas.map(paraContagem);
}

/** Quantas questões (regulares) cada MATÉRIA tem — soma dos seus tópicos. */
export async function contagemPorMateria(supabase: SupabaseClient): Promise<Map<string, number>> {
  const porMateria = new Map<string, number>();
  for (const t of await contagemPorTopico(supabase)) {
    porMateria.set(t.materiaId, (porMateria.get(t.materiaId) || 0) + t.total);
  }
  return porMateria;
}

// -------------------------------------------------------------- instituição

export type ContagemInstituicao = {
  /** null = questão autoral (feita pela equipe, sem prova de origem). Desde
   *  supabase_simulados_fontes.sql a view devolve essas linhas também — antes
   *  ela filtrava `instituicao is not null` e o autoral era invisível aqui. */
  instituicao: string | null;
  topicId: string;
  topicoNome: string;
  topicoOrdem: number | null;
  materiaId: string;
  materiaNome: string;
  dificuldade: string | null;
  ano: number | null;
  total: number;
  totalRegular: number;
};

// Não herda de LinhaTopico de propósito: a view por instituição não tem as
// colunas de tempo médio (quem agrega por tópico não precisa delas), e
// herdar faria o tipo prometer campos que o select não pede.
type LinhaInstituicao = {
  instituicao: string | null;
  topic_id: string;
  topico_nome: string | null;
  topico_ordem: number | null;
  materia_id: string;
  materia_nome: string | null;
  dificuldade: string | null;
  ano: number | null;
  total: number;
  total_regular: number;
};

function paraContagemInstituicao(l: LinhaInstituicao): ContagemInstituicao {
  return {
    instituicao: l.instituicao,
    topicId: l.topic_id,
    topicoNome: l.topico_nome || "Tópico",
    topicoOrdem: l.topico_ordem,
    materiaId: l.materia_id,
    materiaNome: l.materia_nome || "Disciplina",
    dificuldade: l.dificuldade,
    ano: l.ano,
    total: Number(l.total) || 0,
    totalRegular: Number(l.total_regular) || 0,
  };
}

const COLUNAS_INST =
  "instituicao, topic_id, topico_nome, topico_ordem, materia_id, materia_nome, dificuldade, ano, total, total_regular";

/** Valores distintos de `questions.instituicao`, com contagem. 8 linhas hoje. */
export async function listarInstituicoes(
  supabase: SupabaseClient,
): Promise<{ instituicao: string; total: number }[]> {
  const linhas = await lerPaginado<{ instituicao: string; total: number }>(
    () => supabase.from("vw_instituicoes").select("instituicao, total"),
    { ordenarPor: "instituicao" },
  );
  return linhas.map((l) => ({ instituicao: l.instituicao, total: Number(l.total) || 0 }));
}

/** Grade instituição × tópico × dificuldade × ano, recortada às instituições
 *  que casam com a universidade do aluno. */
export async function contagemPorInstituicao(
  supabase: SupabaseClient,
  instituicoes: string[],
): Promise<ContagemInstituicao[]> {
  if (instituicoes.length === 0) return [];
  const linhas = await lerPaginado<LinhaInstituicao>(
    () => supabase.from("vw_questoes_por_instituicao").select(COLUNAS_INST).in("instituicao", instituicoes),
    { ordenarPor: "topic_id" },
  );
  return linhas.map(paraContagemInstituicao);
}

/** A grade inteira, sem recorte — a landing pública e o montador de simulados
 *  (que desde 2026-09-16 oferece TODAS as fontes, não só a universidade do
 *  aluno). Inclui as linhas autorais (`instituicao = null`). */
export async function contagemInstituicaoCompleta(
  supabase: SupabaseClient,
): Promise<ContagemInstituicao[]> {
  const linhas = await lerPaginado<LinhaInstituicao>(
    () => supabase.from("vw_questoes_por_instituicao").select(COLUNAS_INST),
    { ordenarPor: "topic_id" },
  );
  return linhas.map(paraContagemInstituicao);
}
