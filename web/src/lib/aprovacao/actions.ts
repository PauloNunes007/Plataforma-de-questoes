"use server";

import { createClient } from "@/lib/supabase/server";
import { ehAdmin } from "@/lib/admin/auth";
import { dataLocalISO, mapearErro } from "./dados";
import type { Erro, EtapaRevisao, Fichamento, Simulado } from "./tipos";
import type { TipoErro } from "./constantes";

// Server Actions do Modo Aprovação. CRUD dono-scoped (RLS já filtra,
// mas o .eq("user_id") explícito segue a convenção de lib/tarefas) —
// os componentes clientes atualizam estado local num "ok: true" em vez
// de refetch/revalidatePath.

function addDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const data = new Date(y, m - 1, d + dias);
  return dataLocalISO(data);
}

// Feature de conta única: além do RLS por e-mail (ver
// supabase_modo_aprovacao.sql), cada action re-checa a conta aqui —
// Server Actions são endpoints diretamente chamáveis, então o redirect
// da página não basta (mesmo padrão de lib/admin/actions.ts).
async function usuarioAprovacao(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && ehAdmin(user.email) ? user : null;
}

// ------------------------------------------------------------------
// Caderno de erros
// ------------------------------------------------------------------

export async function uploadImagemErroAction(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { error: "Sessão expirada." };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Nenhum arquivo enviado." };

  // O cliente já comprime pra JPEG (comprimirImagem, o mesmo do importador).
  const nome = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from("erros-imagens")
    .upload(nome, file, { contentType: "image/jpeg" });
  if (error) {
    console.error("Erro ao enviar print:", error);
    return { error: "Falha ao enviar a imagem. Tente de novo." };
  }
  const { data: pub } = supabase.storage.from("erros-imagens").getPublicUrl(nome);
  return { url: pub.publicUrl };
}

export type ErroInput = {
  id?: string | null; // presente = edição
  imagemUrl: string | null;
  disciplina: string;
  tema: string | null;
  banca: string | null;
  provaAno: number | null;
  provaFase: string | null;
  questaoNum: string | null;
  oQueMarquei: string | null;
  gabarito: string | null;
  tipoErro: TipoErro;
  resolucao: string | null;
  conceitoChave: string | null;
};

export async function salvarErroAction(input: ErroInput): Promise<{ ok: boolean; erro: Erro | null }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user || !input.disciplina || !input.tipoErro) return { ok: false, erro: null };

  const campos = {
    imagem_url: input.imagemUrl,
    disciplina: input.disciplina,
    tema: input.tema?.trim() || null,
    banca: input.banca,
    prova_ano: input.provaAno,
    prova_fase: input.provaFase,
    questao_num: input.questaoNum?.trim() || null,
    o_que_marquei: input.oQueMarquei?.trim() || null,
    gabarito: input.gabarito?.trim() || null,
    tipo_erro: input.tipoErro,
    resolucao: input.resolucao?.trim() || null,
    conceito_chave: input.conceitoChave?.trim() || null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("erros")
      .update(campos)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      console.error("Erro ao atualizar erro:", error);
      return { ok: false, erro: null };
    }
    return { ok: true, erro: mapearErro(data) };
  }

  // Novo erro: agenda a revisão espaçada em criado + 1/7/30 dias.
  const hoje = dataLocalISO();
  const { data, error } = await supabase
    .from("erros")
    .insert({
      user_id: user.id,
      ...campos,
      refazer_em_1d: addDias(hoje, 1),
      refazer_em_7d: addDias(hoje, 7),
      refazer_em_30d: addDias(hoje, 30),
    })
    .select()
    .single();
  if (error) {
    console.error("Erro ao criar erro:", error);
    return { ok: false, erro: null };
  }
  return { ok: true, erro: mapearErro(data) };
}

export async function marcarRefeitoAction(
  id: string,
  etapa: EtapaRevisao,
  valor: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const coluna = etapa === "1d" ? "feito_1d" : etapa === "7d" ? "feito_7d" : "feito_30d";
  const { error } = await supabase
    .from("erros")
    .update({ [coluna]: valor })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) console.error("Erro ao marcar refeito:", error);
  return { ok: !error };
}

export async function arquivarErroAction(id: string, arquivado: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("erros")
    .update({ arquivado })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) console.error("Erro ao arquivar erro:", error);
  return { ok: !error };
}

export async function excluirErroAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase.from("erros").delete().eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao excluir erro:", error);
  return { ok: !error };
}

// ------------------------------------------------------------------
// Grade do dia (sessoes_estudo) + metas mensais
// ------------------------------------------------------------------

async function upsertMetaAtual(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  mes: number,
  ano: number,
  campo: "acertos_atual" | "redacoes_atual" | "obras_atual",
  valor: number,
): Promise<void> {
  const { error } = await supabase
    .from("metas_mensais")
    .upsert(
      { user_id: userId, mes, ano, [campo]: valor },
      { onConflict: "user_id,mes,ano" },
    );
  if (error) console.error("Erro ao atualizar meta mensal:", error);
}

export async function alternarBlocoAction(input: {
  data: string;
  bloco: string;
  disciplina: string;
  tipo: string;
  concluido: boolean;
  minutos?: number | null;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase.from("sessoes_estudo").upsert(
    {
      user_id: user.id,
      data: input.data,
      bloco: input.bloco,
      disciplina: input.disciplina,
      tipo: input.tipo,
      minutos: input.minutos ?? null,
      concluido: input.concluido,
    },
    { onConflict: "user_id,data,bloco" },
  );
  if (error) {
    console.error("Erro ao salvar bloco de estudo:", error);
    return { ok: false };
  }

  // Bloco de redação alimenta a meta do mês: recontagem idempotente das
  // sessões de redação concluídas no mês do bloco (não incrementa às cegas).
  if (input.tipo === "redacao") {
    const [ano, mes] = input.data.split("-").map(Number);
    const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const fim = addDias(dataLocalISO(new Date(ano, mes, 0)), 0);
    const { count } = await supabase
      .from("sessoes_estudo")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tipo", "redacao")
      .eq("concluido", true)
      .gte("data", inicio)
      .lte("data", fim);
    await upsertMetaAtual(supabase, user.id, mes, ano, "redacoes_atual", count || 0);
  }
  return { ok: true };
}

export async function salvarMetasAction(input: {
  mes: number;
  ano: number;
  metaAcertosSimulado: number | null;
  metaRedacoes: number | null;
  metaObras: number | null;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase.from("metas_mensais").upsert(
    {
      user_id: user.id,
      mes: input.mes,
      ano: input.ano,
      meta_acertos_simulado: input.metaAcertosSimulado,
      meta_redacoes: input.metaRedacoes,
      meta_obras: input.metaObras,
    },
    { onConflict: "user_id,mes,ano" },
  );
  if (error) console.error("Erro ao salvar metas:", error);
  return { ok: !error };
}

// ------------------------------------------------------------------
// Simulados
// ------------------------------------------------------------------

export async function salvarSimuladoAction(input: {
  data: string;
  banca: string;
  provaRef: string | null;
  acertos: Record<string, number>;
  tempoMin: number | null;
  errosPorTipo: Record<string, number> | null;
  observacoes: string | null;
}): Promise<{ ok: boolean; simulado: Simulado | null }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user || !input.banca || !input.data) return { ok: false, simulado: null };

  // Só disciplinas preenchidas entram no JSON; o total é a soma.
  const acertos: Record<string, number> = {};
  Object.entries(input.acertos).forEach(([disc, qtd]) => {
    const n = Number(qtd);
    if (Number.isFinite(n) && n > 0) acertos[disc] = n;
  });
  const total = Object.values(acertos).reduce((s, n) => s + n, 0);

  const { data, error } = await supabase
    .from("simulados")
    .insert({
      user_id: user.id,
      data: input.data,
      banca: input.banca,
      prova_ref: input.provaRef?.trim() || null,
      acertos,
      total_questoes: total,
      tempo_min: input.tempoMin,
      erros_por_tipo: input.errosPorTipo,
      observacoes: input.observacoes?.trim() || null,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("Erro ao salvar simulado:", error);
    return { ok: false, simulado: null };
  }

  // metas_mensais.acertos_atual guarda o MELHOR simulado do mês.
  const [ano, mes] = input.data.split("-").map(Number);
  const { data: doMes } = await supabase
    .from("simulados")
    .select("total_questoes")
    .eq("user_id", user.id)
    .gte("data", `${ano}-${String(mes).padStart(2, "0")}-01`)
    .lte("data", dataLocalISO(new Date(ano, mes, 0)));
  const melhor = Math.max(...(doMes || []).map((s) => s.total_questoes as number), total);
  await upsertMetaAtual(supabase, user.id, mes, ano, "acertos_atual", melhor);

  return {
    ok: true,
    simulado: {
      id: data.id as string,
      data: String(data.data).slice(0, 10),
      banca: data.banca as string,
      provaRef: data.prova_ref as string | null,
      acertos,
      totalQuestoes: total,
      tempoMin: data.tempo_min as number | null,
      errosPorTipo: (data.erros_por_tipo || null) as Record<string, number> | null,
      observacoes: data.observacoes as string | null,
    },
  };
}

export async function excluirSimuladoAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase.from("simulados").delete().eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao excluir simulado:", error);
  return { ok: !error };
}

// ------------------------------------------------------------------
// Obras
// ------------------------------------------------------------------

export async function salvarProgressoObraAction(input: {
  obraId: number;
  paginaAtual: number;
  totalPaginas: number | null;
}): Promise<{ ok: boolean; percentual: number; concluida: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false, percentual: 0, concluida: false };

  const total = input.totalPaginas && input.totalPaginas > 0 ? input.totalPaginas : null;
  const pagina = Math.max(0, input.paginaAtual || 0);
  const percentual = total ? Math.min(100, Math.round((pagina / total) * 100)) : 0;
  const concluida = percentual >= 100;

  const { error } = await supabase.from("obras_progresso").upsert(
    {
      user_id: user.id,
      obra_id: input.obraId,
      pagina_atual: pagina,
      total_paginas: total,
      percentual,
      concluida,
      concluida_em: concluida ? new Date().toISOString() : null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "user_id,obra_id" },
  );
  if (error) {
    console.error("Erro ao salvar progresso da obra:", error);
    return { ok: false, percentual: 0, concluida: false };
  }

  // Recontagem idempotente das obras concluídas → meta do mês corrente.
  const agora = new Date();
  const { count } = await supabase
    .from("obras_progresso")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("concluida", true);
  await upsertMetaAtual(
    supabase,
    user.id,
    agora.getMonth() + 1,
    agora.getFullYear(),
    "obras_atual",
    count || 0,
  );

  return { ok: true, percentual, concluida };
}

export async function salvarFichamentoAction(input: {
  obraId: number;
  fichamento: Fichamento;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };

  const { error } = await supabase.from("obras_progresso").upsert(
    {
      user_id: user.id,
      obra_id: input.obraId,
      fichamento_enredo: input.fichamento.enredo || null,
      fichamento_narrador: input.fichamento.narrador || null,
      fichamento_temas: input.fichamento.temas || null,
      fichamento_contexto: input.fichamento.contexto || null,
      fichamento_trechos: input.fichamento.trechos || null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "user_id,obra_id" },
  );
  if (error) console.error("Erro ao salvar fichamento:", error);
  return { ok: !error };
}

// Usado pelo card de metas pra edição manual do contador de redações
// (nem toda redação vem de um bloco da grade).
export async function ajustarMetaAtualAction(input: {
  mes: number;
  ano: number;
  campo: "redacoes_atual";
  valor: number;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const user = await usuarioAprovacao(supabase);
  if (!user) return { ok: false };
  await upsertMetaAtual(supabase, user.id, input.mes, input.ano, input.campo, Math.max(0, input.valor));
  return { ok: true };
}
