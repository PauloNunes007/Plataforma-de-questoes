"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizarTextoDup } from "./logic";
import type { Materia, QuestionPayload, Topico } from "./types";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// O PostgREST corta TODA resposta em 1000 linhas (max-rows do Supabase), mesmo
// sem .limit() — e o banco de questões já passou desse teto. Um
// `select("enunciado")` direto trazia só as 1000 primeiras, o que deixava a
// checagem de duplicata cega justamente pras questões inseridas mais
// recentemente: reimportar um pacote recém-adicionado passava batido e
// duplicava. Daí a paginação por .range(), ordenada por id pra ser estável
// entre as páginas. Mesma paginação que os scripts em
// listas_questoes/gerado/scripts/ já fazem.
const PAGINA_ENUNCIADOS = 1000;

async function buscarTodosEnunciados(supabase: SupabaseServer): Promise<string[]> {
  const todos: string[] = [];
  for (let inicio = 0; ; inicio += PAGINA_ENUNCIADOS) {
    const { data, error } = await supabase
      .from("questions")
      .select("enunciado")
      .order("id")
      .range(inicio, inicio + PAGINA_ENUNCIADOS - 1);
    if (error) {
      console.error("Erro ao carregar enunciados existentes:", error);
      break;
    }
    if (!data || data.length === 0) break;
    todos.push(...data.map((q) => q.enunciado || ""));
    if (data.length < PAGINA_ENUNCIADOS) break;
  }
  return todos;
}

export async function carregarDadosImportadorAction(): Promise<{
  materias: Materia[];
  topicos: Topico[];
  enunciadosExistentes: string[];
}> {
  const supabase = await createClient();
  const [{ data: materias }, { data: topicos }, enunciados] = await Promise.all([
    supabase.from("materias").select("id, nome").order("nome"),
    supabase
      .from("topicos")
      .select("id, materia_id, nome, ordem")
      .order("ordem", { ascending: true, nullsFirst: false })
      .order("nome"),
    buscarTodosEnunciados(supabase),
  ]);

  const enunciadosExistentes = enunciados.map(normalizarTextoDup);

  return { materias: materias || [], topicos: topicos || [], enunciadosExistentes };
}

// Insere UM lote (o cliente faz o chunking em TAMANHO_LOTE_AUTO e chama
// isso em loop, pra poder mostrar progresso real barra-a-barra — ver
// importarAutomaticamente() no componente).
export async function importarLoteAction(
  payloads: QuestionPayload[],
): Promise<{ ids: string[] } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("questions").insert(payloads).select("id");
  if (error) {
    console.error("Erro na importação automática:", error);
    return { error: error.message };
  }
  return { ids: (data || []).map((row) => row.id) };
}

export async function aprovarItemAction(
  payload: QuestionPayload,
  dbId: string | null,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();

  if (dbId) {
    const { error } = await supabase.from("questions").update(payload).eq("id", dbId);
    if (error) return { error: error.message };
    return { id: dbId };
  }

  // Checagem de exata igualdade server-side, além da checagem (exata + por
  // similaridade) já feita no cliente antes de chamar essa action — Server
  // Actions são chamáveis diretamente, então a checagem de UI sozinha não
  // impede uma requisição direta de inserir a mesma questão duas vezes.
  const chaveDup = normalizarTextoDup(payload.enunciado);
  if (chaveDup) {
    const existentes = await buscarTodosEnunciados(supabase);
    const jaExiste = existentes.some((e) => normalizarTextoDup(e) === chaveDup);
    if (jaExiste) {
      return { error: "Já existe uma questão com esse enunciado no banco. Edite o enunciado se for uma questão diferente." };
    }
  }

  const { data, error } = await supabase.from("questions").insert(payload).select("id").single();
  if (error || !data) return { error: error?.message || "Não foi possível salvar essa questão." };
  return { id: data.id };
}

export async function uploadImagemQuestaoAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const file = formData.get("file") as File | null;
  const pastaPrefixo = String(formData.get("pastaPrefixo") || "img");
  if (!file) return { error: "Nenhum arquivo enviado." };

  // "svg" existe pra figuras vetoriais (fotos/prints usam "jpg"). As figuras
  // de tikz_code são compiladas e salvas direto pelo backend (tikz-server.ts),
  // não passam por aqui.
  const tipo = formData.get("tipo") === "svg" ? "svg" : "jpg";
  const contentType = tipo === "svg" ? "image/svg+xml" : "image/jpeg";

  const nomeArquivo = `${pastaPrefixo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${tipo}`;
  const { error } = await supabase.storage.from("questoes").upload(nomeArquivo, file, { contentType });
  if (error) {
    console.error("Erro ao enviar imagem:", error);
    return { error: "Falha ao enviar. Tente de novo." };
  }

  const { data: pub } = supabase.storage.from("questoes").getPublicUrl(nomeArquivo);
  return { url: pub.publicUrl };
}
