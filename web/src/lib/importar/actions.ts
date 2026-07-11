"use server";

import { createClient } from "@/lib/supabase/server";
import type { Materia, QuestionPayload, Topico } from "./types";

export async function carregarDadosImportadorAction(): Promise<{
  materias: Materia[];
  topicos: Topico[];
  enunciadosExistentes: string[];
}> {
  const supabase = await createClient();
  const [{ data: materias }, { data: topicos }, { data: questoes }] = await Promise.all([
    supabase.from("materias").select("id, nome").order("nome"),
    supabase
      .from("topicos")
      .select("id, materia_id, nome, ordem")
      .order("ordem", { ascending: true, nullsFirst: false })
      .order("nome"),
    supabase.from("questions").select("enunciado"),
  ]);

  const enunciadosExistentes = (questoes || []).map((q) =>
    (q.enunciado || "").toLowerCase().replace(/\s+/g, " ").trim(),
  );

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

  const { data, error } = await supabase.from("questions").insert(payload).select("id").single();
  if (error || !data) return { error: error?.message || "Não foi possível salvar essa questão." };
  return { id: data.id };
}

export async function uploadImagemQuestaoAction(formData: FormData): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const file = formData.get("file") as File | null;
  const pastaPrefixo = String(formData.get("pastaPrefixo") || "img");
  if (!file) return { error: "Nenhum arquivo enviado." };

  const nomeArquivo = `${pastaPrefixo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from("questoes").upload(nomeArquivo, file, { contentType: "image/jpeg" });
  if (error) {
    console.error("Erro ao enviar imagem:", error);
    return { error: "Falha ao enviar. Tente de novo." };
  }

  const { data: pub } = supabase.storage.from("questoes").getPublicUrl(nomeArquivo);
  return { url: pub.publicUrl };
}
