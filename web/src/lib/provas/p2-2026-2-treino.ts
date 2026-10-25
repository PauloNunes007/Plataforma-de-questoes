// O "Treinar" da página da P2 de 2026.2: transforma uma escolha da página
// pública (versão parecida 1/2 de uma prova, ou o treino da P3) num simulado
// cronometrado do aluno — a mesma tela de /simulados/[id] de qualquer outro.
//
// Sem "use server": quem chama é a rota GET de treinar e as contagens da
// página, não o browser.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { dentroDoLimiteSemanal } from "@/lib/simulados/limite";
import type { ProvaComentada } from "./p2-2026-2";

/** Igual à prova real: 15 questões em 2 horas. */
const QTD_P3 = 15;
const DURACAO_MIN = 120;

export type ResultadoTreino =
  | { ok: true; id: string }
  | { ok: false; erro: "limite" | "sem_questoes" };

function tituloTreino(prova: ProvaComentada, tipo: "v1" | "v2" | "p3"): string {
  if (tipo === "p3") return `Rumo à P3 · ${prova.materia}`;
  return `P2 2026.2 · ${prova.materia} — versão parecida ${tipo === "v1" ? 1 : 2}`;
}

/** Ids dos tópicos da P3 (os da ementa que vêm depois da P2). */
async function topicosDaP3(supabase: SupabaseClient, prova: ProvaComentada) {
  const { data: materia } = await supabase
    .from("materias")
    .select("id")
    .eq("nome", prova.materiaBanco)
    .maybeSingle();
  if (!materia) return { materiaId: null as string | null, topicos: [] as { id: string; nome: string }[] };
  const { data: topicos } = await supabase
    .from("topicos")
    .select("id, nome")
    .eq("materia_id", materia.id)
    .in("nome", prova.topicosP3);
  return { materiaId: materia.id as string, topicos: (topicos ?? []) as { id: string; nome: string }[] };
}

/**
 * Cria (ou retoma) o simulado. Uma versão parecida é uma lista FIXA, na ordem
 * da prova; o treino da P3 sorteia 15 questões regulares dos tópicos da P3.
 *
 * Retoma em vez de duplicar quando já existe um em andamento com o mesmo
 * título — senão o aluno que clica duas vezes (ou volta pelo link do grupo)
 * gasta o simulado grátis da semana à toa. Mesma regra de
 * iniciarProvaOficialAction.
 */
export async function criarSimuladoTreino(
  supabase: SupabaseClient,
  userId: string,
  prova: ProvaComentada,
  tipo: "v1" | "v2" | "p3",
): Promise<ResultadoTreino> {
  const titulo = tituloTreino(prova, tipo);

  const { data: aberto } = await supabase
    .from("simulados_aluno")
    .select("id")
    .eq("user_id", userId)
    .eq("titulo", titulo)
    .eq("status", "em_andamento")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (aberto) return { ok: true, id: aberto.id as string };

  if (!(await dentroDoLimiteSemanal(supabase, userId))) return { ok: false, erro: "limite" };

  let questionIds: string[] = [];
  let topicoIds: string[] = [];
  let materiaId: string | null = null;

  if (tipo === "p3") {
    const p3 = await topicosDaP3(supabase, prova);
    materiaId = p3.materiaId;
    topicoIds = p3.topicos.map((t) => t.id);
    if (topicoIds.length === 0) return { ok: false, erro: "sem_questoes" };
    const { data } = await supabase
      .from("questions")
      .select("id")
      .in("topic_id", topicoIds)
      .eq("desafio", false);
    questionIds = questlyEmbaralhar((data ?? []).map((q) => q.id as string)).slice(0, QTD_P3);
  } else {
    const indice = tipo === "v1" ? 0 : 1;
    const pedidos = prova.questoes.map((q) => q.gemeas[indice]);
    // A lista foi escolhida à mão a partir de um retrato do banco: o que foi
    // apagado ou virou desafio desde então simplesmente fica de fora, e a
    // ordem da prova é preservada no que sobra.
    const { data } = await supabase
      .from("questions")
      .select("id, topic_id")
      .in("id", pedidos)
      .eq("desafio", false);
    const existentes = new Map((data ?? []).map((q) => [q.id as string, q.topic_id as string | null]));
    questionIds = pedidos.filter((id) => existentes.has(id));
    topicoIds = [...new Set(questionIds.map((id) => existentes.get(id)).filter(Boolean))] as string[];
    const { data: materia } = await supabase
      .from("materias")
      .select("id")
      .eq("nome", prova.materiaBanco)
      .maybeSingle();
    materiaId = (materia?.id as string) ?? null;
  }

  if (questionIds.length === 0) return { ok: false, erro: "sem_questoes" };

  const { data: criado, error } = await supabase
    .from("simulados_aluno")
    .insert({
      user_id: userId,
      titulo,
      instituicao: "UFF",
      materia_ids: materiaId ? [materiaId] : [],
      topico_ids: topicoIds,
      question_ids: questionIds,
      duracao_min: DURACAO_MIN,
      qtd_questoes: questionIds.length,
      status: "em_andamento",
      respostas: {},
    })
    .select("id")
    .single();

  if (error || !criado) {
    console.error("Erro ao criar simulado de treino da P2 2026.2:", error);
    return { ok: false, erro: "sem_questoes" };
  }
  return { ok: true, id: criado.id as string };
}

export type ContagemP3 = { nome: string; questoes: number };

/**
 * Quantas questões o banco tem em cada tópico da P3 — o número que a página
 * pública usa como argumento ("118 questões de Campo Magnético"). Lido ao vivo
 * via service_role (o visitante é anônimo e `questions` só libera leitura pra
 * autenticado, mesma razão de lib/provas/catalogo.ts). Falha = lista vazia, e
 * a seção mostra só os nomes.
 */
export async function contarTopicosP3(prova: ProvaComentada): Promise<ContagemP3[]> {
  try {
    const admin = createAdminClient();
    const { topicos } = await topicosDaP3(admin, prova);
    if (topicos.length === 0) return [];
    const { data } = await admin
      .from("vw_questoes_por_topico")
      .select("topic_id, total_regular")
      .in(
        "topic_id",
        topicos.map((t) => t.id),
      );
    const porId = new Map((data ?? []).map((l) => [l.topic_id as string, Number(l.total_regular) || 0]));
    return prova.topicosP3.map((nome) => {
      const topico = topicos.find((t) => t.nome === nome);
      return { nome, questoes: topico ? (porId.get(topico.id) ?? 0) : 0 };
    });
  } catch (e) {
    console.error("Falha ao contar tópicos da P3:", e);
    return [];
  }
}

/** Quantas questões do banco a matéria tem (pra frase de abertura). */
export async function contarQuestoesMateria(nome: string): Promise<number | null> {
  try {
    const admin = createAdminClient();
    const { data: materia } = await admin.from("materias").select("id").eq("nome", nome).maybeSingle();
    if (!materia) return null;
    const { data } = await admin
      .from("vw_questoes_por_topico")
      .select("total_regular")
      .eq("materia_id", materia.id);
    return (data ?? []).reduce((acc, l) => acc + (Number(l.total_regular) || 0), 0);
  } catch (e) {
    console.error("Falha ao contar questões da matéria:", e);
    return null;
  }
}
