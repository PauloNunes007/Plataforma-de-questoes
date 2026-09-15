"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { ativarAssinatura } from "@/lib/plano/ativar";
import { buscarPagamentosPorReferencia, mpConfigurado } from "@/lib/plano/mercadopago";
import type { ItemImportado, Letra, QuestionPayload } from "@/lib/importar/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 20;

// Toda ação aqui é restrita a uma única conta (ver lib/admin/auth.ts) — a
// UI já bloqueia o acesso à rota /admin/questoes, mas Server Actions são
// endpoints chamáveis diretamente, então a checagem precisa ser repetida
// aqui (mesmo padrão de "sem helper compartilhado" do resto do repo, ver
// web/CLAUDE.md).
async function requireAdmin(): Promise<
  { supabase: SupabaseClient; error: null } | { supabase: null; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { supabase: null, error: "Acesso restrito." };
  }
  return { supabase, error: null };
}

export type QuestaoAdminResumo = {
  id: string;
  enunciado: string;
  dificuldade: string;
  subtopico: string | null;
  instituicao: string | null;
  ano: number | null;
  temImagem: boolean;
  materiaNome: string | null;
  topicoNome: string | null;
};

type TopicoEmbutido = { nome: string; materia_id: string; materias: { nome: string } | { nome: string }[] | null };

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function buscarQuestoesAdminAction(filtros: {
  busca: string;
  materiaId: string | null;
  topicoId: string | null;
  dificuldade: string | null;
  pagina: number;
}): Promise<{ questoes: QuestaoAdminResumo[]; total: number } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  let query = supabase
    .from("questions")
    .select(
      "id, enunciado, dificuldade, subtopico, instituicao, ano, imagem_url, alternativas_imagens, topicos!inner(nome, materia_id, materias(nome))",
      { count: "exact" },
    );

  const busca = filtros.busca.trim();
  if (busca) query = query.ilike("enunciado", `%${busca}%`);
  if (filtros.topicoId) query = query.eq("topic_id", filtros.topicoId);
  else if (filtros.materiaId) query = query.eq("topicos.materia_id", filtros.materiaId);
  if (filtros.dificuldade) query = query.eq("dificuldade", filtros.dificuldade);

  const inicio = filtros.pagina * PAGE_SIZE;
  const { data, count, error: err } = await query
    .order("enunciado", { ascending: true })
    .range(inicio, inicio + PAGE_SIZE - 1);

  if (err) return { error: err.message };

  const questoes: QuestaoAdminResumo[] = (data || []).map((q) => {
    const topico = primeiro(q.topicos as unknown as TopicoEmbutido | TopicoEmbutido[]);
    const materia = primeiro(topico?.materias ?? null);
    const altImgs = (q.alternativas_imagens || {}) as Record<string, string>;
    return {
      id: q.id,
      enunciado: q.enunciado,
      dificuldade: q.dificuldade,
      subtopico: q.subtopico,
      instituicao: q.instituicao,
      ano: q.ano,
      temImagem: !!q.imagem_url || Object.keys(altImgs).length > 0,
      materiaNome: materia?.nome ?? null,
      topicoNome: topico?.nome ?? null,
    };
  });

  return { questoes, total: count ?? 0 };
}

export async function carregarQuestaoAdminAction(
  id: string,
): Promise<{ item: ItemImportado } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { data, error: err } = await supabase
    .from("questions")
    .select(
      "id, topic_id, dificuldade, instituicao, ano, enunciado, imagem_url, alternativas, alternativas_imagens, gabarito, resolucao, subtopico, desafio, topicos(nome, materia_id, materias(nome))",
    )
    .eq("id", id)
    .maybeSingle();

  if (err) return { error: err.message };
  if (!data) return { error: "Questão não encontrada." };

  const topico = primeiro(data.topicos as unknown as TopicoEmbutido | TopicoEmbutido[]);
  const materia = primeiro(topico?.materias ?? null);

  const item: ItemImportado = {
    enunciado: data.enunciado || "",
    imagemUrl: data.imagem_url,
    dificuldade: data.dificuldade,
    dificuldadeInvalida: false,
    instituicao: data.instituicao,
    ano: data.ano,
    alternativas: (data.alternativas || {}) as Partial<Record<Letra, string>>,
    alternativasImagens: (data.alternativas_imagens || {}) as Partial<Record<Letra, string>>,
    gabarito: data.gabarito,
    resolucao: data.resolucao,
    subtopico: data.subtopico,
    desafio: data.desafio === true,
    materiaId: topico?.materia_id ?? null,
    materiaNomeOriginal: materia?.nome ?? "",
    topicoId: data.topic_id,
    topicoNomeOriginal: topico?.nome ?? "",
    imagemEnunciadoFlag: false,
    alternativasComImagemFlag: [],
    tikzCode: null,
    alternativasTikz: {},
    fonteArquivo: null,
    fontePagina: null,
    status: "pendente",
    dbId: data.id,
  };

  return { item };
}

export async function atualizarQuestaoAdminAction(
  id: string,
  payload: QuestionPayload,
): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { error: err } = await supabase.from("questions").update(payload).eq("id", id);
  if (err) return { error: err.message };
  return { ok: true };
}

export type RelatoAdmin = {
  id: string;
  questionId: string;
  enunciado: string;
  motivo: string;
  detalhe: string | null;
  status: string;
  criadoEm: string;
};

export async function listarRelatosAdminAction(
  apenasPendentes: boolean,
): Promise<{ relatos: RelatoAdmin[] } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  let query = supabase
    .from("question_reports")
    .select("id, question_id, motivo, detalhe, status, criado_em, questions(enunciado)")
    .order("criado_em", { ascending: false });
  if (apenasPendentes) query = query.eq("status", "pendente");

  const { data, error: err } = await query;
  if (err) return { error: err.message };

  const relatos: RelatoAdmin[] = (data || []).map((r) => ({
    id: r.id,
    questionId: r.question_id,
    enunciado: primeiro(r.questions as unknown as { enunciado: string } | { enunciado: string }[])?.enunciado ?? "(questão excluída)",
    motivo: r.motivo,
    detalhe: r.detalhe,
    status: r.status,
    criadoEm: r.criado_em,
  }));

  return { relatos };
}

export async function contarRelatosPendentesAction(): Promise<number> {
  const { supabase } = await requireAdmin();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("question_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  return count ?? 0;
}

export async function resolverRelatoAdminAction(id: string): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { error: err } = await supabase
    .from("question_reports")
    .update({ status: "resolvido", resolvido_em: new Date().toISOString() })
    .eq("id", id);
  if (err) return { error: err.message };
  return { ok: true };
}

// ----------------------------------------------------------------- assinaturas
// Cobrança manual: o aluno registra a intenção (lib/plano/actions.ts) e o
// admin confirma o pagamento aqui, ativando o Pro. Quando um gateway entrar,
// o webhook chama a mesma lógica de ativarAssinaturaAdminAction.

export type AssinaturaAdmin = {
  id: string;
  userId: string;
  nome: string;
  ciclo: string;
  forma: string;
  valorCentavos: number;
  status: string;
  observacao: string | null;
  criadaEm: string;
  ativadaEm: string | null;
  expiraEm: string | null;
};

export async function listarAssinaturasAdminAction(
  apenasPendentes: boolean,
): Promise<{ assinaturas: AssinaturaAdmin[] } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  let query = supabase
    .from("assinaturas")
    .select("id, user_id, ciclo, forma, valor_centavos, status, observacao, criada_em, ativada_em, expira_em")
    .order("criada_em", { ascending: false });
  if (apenasPendentes) query = query.eq("status", "pendente");

  const { data, error: err } = await query;
  if (err) return { error: err.message };

  // assinaturas.user_id aponta pra auth.users (não pra profiles), então não dá
  // pra embutir o nome direto — busca os profiles à parte e mapeia.
  const ids = Array.from(new Set((data || []).map((a) => a.user_id)));
  const nomePorId = new Map<string, string>();
  if (ids.length > 0) {
    const { data: perfis } = await supabase.from("profiles").select("id, nome").in("id", ids);
    (perfis || []).forEach((p) => nomePorId.set(p.id, p.nome || "Aluno(a)"));
  }

  const assinaturas: AssinaturaAdmin[] = (data || []).map((a) => ({
    id: a.id,
    userId: a.user_id,
    nome: nomePorId.get(a.user_id) || "Aluno(a)",
    ciclo: a.ciclo,
    forma: a.forma,
    valorCentavos: a.valor_centavos,
    status: a.status,
    observacao: a.observacao,
    criadaEm: a.criada_em,
    ativadaEm: a.ativada_em,
    expiraEm: a.expira_em,
  }));

  return { assinaturas };
}

export async function contarAssinaturasPendentesAction(): Promise<number> {
  const { supabase } = await requireAdmin();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("assinaturas")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  return count ?? 0;
}

export async function ativarAssinaturaAdminAction(
  id: string,
  observacao?: string,
): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  // Mesma lógica que o webhook do Mercado Pago usa (lib/plano/ativar.ts) —
  // escreve as colunas protegidas de `profiles` via service_role.
  //
  // ATENÇÃO: esta é a ativação MANUAL, e depois da automação do fluxo (webhook
  // + conferência na /pro) ela virou CONTINGÊNCIA, não rotina. O caminho
  // normal não passa por aqui: o aluno paga e o Pro entra sozinho. Use
  // `conferirAssinaturaAdminAction` primeiro — ela pergunta pro Mercado Pago se
  // o pagamento existe mesmo, em vez de acreditar na palavra de quem pediu.
  return ativarAssinatura(id, observacao);
}

// Conferência de UMA assinatura contra a API do Mercado Pago. É o que o admin
// deve usar antes de qualquer ativação: devolve o que o MP realmente diz e, se
// estiver aprovado, ativa na hora (mesma função idempotente do webhook).
export async function conferirAssinaturaAdminAction(
  id: string,
): Promise<
  | { estado: "ativada" }
  | { estado: "sem_pagamento" }
  | { estado: "em_andamento"; status: string }
  | { estado: "recusado"; status: string }
  | { error: string }
> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };
  if (!mpConfigurado()) return { error: "MP_ACCESS_TOKEN não está configurado neste deploy." };

  const pagamentos = await buscarPagamentosPorReferencia(id);
  if (!pagamentos) return { error: "Não foi possível falar com o Mercado Pago agora." };
  if (pagamentos.length === 0) return { estado: "sem_pagamento" };

  if (pagamentos.some((p) => p.status === "approved")) {
    const res = await ativarAssinatura(id, "Pago via Mercado Pago (conferido pelo admin)");
    if ("error" in res) return { error: res.error };
    return { estado: "ativada" };
  }

  const emAndamento = pagamentos.find((p) =>
    ["pending", "in_process", "in_mediation", "authorized"].includes(p.status),
  );
  if (emAndamento) return { estado: "em_andamento", status: emAndamento.status };
  return { estado: "recusado", status: pagamentos[0].status };
}

// Diagnóstico do gateway — sem isto, um deploy com env faltando só se manifesta
// como "todo mundo reclamando que pagou e não liberou". Não devolve segredo
// nenhum, só se cada peça está presente.
export async function diagnosticoPagamentoAction(): Promise<
  { tokenMP: boolean; segredoWebhook: boolean; urlApp: string | null; webhookUrl: string | null } | { error: string }
> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const url = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || null;
  const https = !!url && url.startsWith("https://");
  return {
    tokenMP: !!process.env.MP_ACCESS_TOKEN?.trim(),
    segredoWebhook: !!process.env.MP_WEBHOOK_SECRET?.trim(),
    urlApp: url,
    webhookUrl: https ? `${url}/api/mercadopago/webhook` : null,
  };
}

export async function revogarProAdminAction(userId: string): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { error: err } = await supabase
    .from("profiles")
    .update({
      plano: "free",
      plano_ciclo: null,
      plano_expira_em: null,
      plano_fidelidade_ate: null,
    })
    .eq("id", userId);
  if (err) return { error: err.message };
  return { ok: true };
}

// ----------------------------------------------------------------- cupons
// CRUD de cupons de Pro grátis (supabase_cupons_pro.sql). O resgate em si
// (aluno consumindo um código) mora em lib/plano/actions.ts — aqui é só a
// gestão do admin. Roda com o client normal (não service_role): a policy
// "admin gerencia cupons" já libera o e-mail admin pra tudo em `cupons`.

export type CupomAdmin = {
  id: string;
  codigo: string;
  descricao: string | null;
  diasPro: number;
  limiteUsos: number | null;
  usos: number;
  ativo: boolean;
  expiraEm: string | null;
  criadoEm: string;
};

export async function listarCuponsAdminAction(): Promise<{ cupons: CupomAdmin[] } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { data, error: err } = await supabase
    .from("cupons")
    .select("id, codigo, descricao, dias_pro, limite_usos, usos, ativo, expira_em, criado_em")
    .order("criado_em", { ascending: false });
  if (err) return { error: err.message };

  const cupons: CupomAdmin[] = (data || []).map((c) => ({
    id: c.id,
    codigo: c.codigo,
    descricao: c.descricao,
    diasPro: c.dias_pro,
    limiteUsos: c.limite_usos,
    usos: c.usos,
    ativo: c.ativo,
    expiraEm: c.expira_em,
    criadoEm: c.criado_em,
  }));
  return { cupons };
}

export async function criarCupomAdminAction(input: {
  codigo: string;
  diasPro: number;
  limiteUsos: number | null;
  expiraEm: string | null; // ISO, ou null
  descricao: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const codigo = input.codigo.trim();
  if (!codigo) return { error: "Digite um código." };
  if (!Number.isInteger(input.diasPro) || input.diasPro <= 0) {
    return { error: "Dias de Pro precisa ser um número maior que zero." };
  }
  if (input.limiteUsos !== null && (!Number.isInteger(input.limiteUsos) || input.limiteUsos <= 0)) {
    return { error: "Limite de usos precisa ser um número maior que zero (ou deixe vazio pra ilimitado)." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: err } = await supabase.from("cupons").insert({
    codigo,
    dias_pro: input.diasPro,
    limite_usos: input.limiteUsos,
    expira_em: input.expiraEm,
    descricao: input.descricao?.trim() || null,
    criado_por: user?.email ?? null,
  });
  if (err) {
    if (err.code === "23505") return { error: "Já existe um cupom com esse código." };
    return { error: err.message };
  }
  return { ok: true };
}

export async function alternarCupomAdminAction(
  id: string,
  ativo: boolean,
): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { error: err } = await supabase.from("cupons").update({ ativo }).eq("id", id);
  if (err) return { error: err.message };
  return { ok: true };
}

export async function excluirQuestaoAdminAction(id: string): Promise<{ ok: true } | { error: string }> {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error: error! };

  const { error: err } = await supabase.from("questions").delete().eq("id", id);
  if (err) {
    if (err.code === "23503") {
      return {
        error: "Essa questão já tem tentativas de resposta ou missões associadas — não é possível excluir.",
      };
    }
    return { error: err.message };
  }
  return { ok: true };
}
