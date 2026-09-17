"use server";

// Escrita da vida acadêmica (faltas e avaliações) — recurso do plano Pro.
//
// O GATE É AQUI, no servidor, e é `exigirPro()`: a RLS de
// supabase_vida_academica.sql é dono-only e NÃO conhece plano, de propósito
// (ver o cabeçalho da migração — quando o Pro vence, o aluno perde a
// ferramenta, nunca o dado que ele digitou). Isso significa que a única coisa
// entre um aluno grátis e escrever aqui é esta checagem: se ela sair de alguma
// action, o recurso vira grátis em silêncio.
//
// A LEITURA não passa por aqui (é `carregarVidaAcademica`, no server component)
// e também não é bloqueada por plano: quem assinou, digitou o semestre e depois
// deixou o Pro vencer continua vendo o que é dele — com a tela travada pra
// edição. O contrário seria o produto apagar dados do aluno como tática de
// venda.
import { createClient } from "@/lib/supabase/server";
import { ehPro } from "@/lib/plano/plano";

type Sessao = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

const ERRO_PRO = "Faltas e notas fazem parte do Expectrum Pro.";

async function exigirPro(): Promise<Sessao | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();
  if (!ehPro(perfil)) return { error: ERRO_PRO };

  return { supabase, userId: user.id };
}

/** `subjects` é do aluno, mas a action é chamável direto: confere o dono antes
 *  de escrever em vez de confiar só na RLS (mesmo padrão de lib/agenda). */
async function disciplinaDoAluno(s: Sessao, subjectId: string): Promise<boolean> {
  const { data } = await s.supabase
    .from("subjects")
    .select("id")
    .eq("id", subjectId)
    .eq("user_id", s.userId)
    .maybeSingle();
  return !!data;
}

function dataValida(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso);
}

/* ------------------------------------------------------ parâmetros do semestre */

export async function salvarParametrosMateriaAction(input: {
  subjectId: string;
  faltasMax: number | null;
  cargaHoraria: number | null;
  aulasPorSemana: number | null;
  mediaAprovacao: number;
}): Promise<{ ok: true } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;
  if (!(await disciplinaDoAluno(s, input.subjectId))) return { error: "Essa disciplina não é sua." };

  // Os mesmos tetos dos CHECKs da migração. Não é redundância inútil: aqui o
  // aluno recebe uma frase, lá o banco recebe a garantia — e um 23514 cru
  // subiria pra tela como "new row violates check constraint".
  const faltasMax =
    input.faltasMax == null ? null : Math.max(0, Math.min(400, Math.round(input.faltasMax)));
  const cargaHoraria =
    input.cargaHoraria == null ? null : Math.max(1, Math.min(2000, Math.round(input.cargaHoraria)));
  const aulasPorSemana =
    input.aulasPorSemana == null ? null : Math.max(1, Math.min(14, Math.round(input.aulasPorSemana)));
  const mediaAprovacao = Math.max(0, Math.min(100, Number(input.mediaAprovacao) || 6));

  const { error } = await s.supabase
    .from("subjects")
    .update({
      faltas_max: faltasMax,
      carga_horaria: cargaHoraria,
      aulas_por_semana: aulasPorSemana,
      media_aprovacao: mediaAprovacao,
    })
    .eq("id", input.subjectId)
    .eq("user_id", s.userId);

  if (error) return { error: error.message };
  return { ok: true };
}

/* ---------------------------------------------------------------- faltas */

export async function registrarFaltaAction(input: {
  subjectId: string;
  data: string;
  quantidade: number;
  justificada: boolean;
  motivo: string | null;
}): Promise<{ id: string } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;
  if (!dataValida(input.data)) return { error: "Data inválida." };
  if (!(await disciplinaDoAluno(s, input.subjectId))) return { error: "Essa disciplina não é sua." };

  const { data, error } = await s.supabase
    .from("faltas")
    .insert({
      user_id: s.userId,
      subject_id: input.subjectId,
      data: input.data,
      quantidade: Math.max(1, Math.min(12, Math.round(input.quantidade) || 1)),
      justificada: !!input.justificada,
      motivo: input.motivo?.trim() ? input.motivo.trim().slice(0, 200) : null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Não deu pra registrar a falta." };
  return { id: data.id as string };
}

export async function alternarJustificadaAction(
  faltaId: string,
  justificada: boolean,
): Promise<{ ok: true } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;

  const { error } = await s.supabase
    .from("faltas")
    .update({ justificada })
    .eq("id", faltaId)
    .eq("user_id", s.userId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function apagarFaltaAction(faltaId: string): Promise<{ ok: true } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;

  const { error } = await s.supabase.from("faltas").delete().eq("id", faltaId).eq("user_id", s.userId);
  if (error) return { error: error.message };
  return { ok: true };
}

/* ------------------------------------------------------------ avaliações */

export async function salvarAvaliacaoAction(input: {
  /** Ausente = criar. Presente = editar aquela linha. */
  id?: string;
  subjectId: string;
  nome: string;
  peso: number;
  nota: number | null;
  notaMaxima: number;
  data: string | null;
  ordem: number;
}): Promise<{ id: string } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;
  if (!(await disciplinaDoAluno(s, input.subjectId))) return { error: "Essa disciplina não é sua." };

  const nome = input.nome.trim().slice(0, 60);
  if (!nome) return { error: "Dê um nome pra avaliação (P1, trabalho…)." };

  const notaMaxima = Math.max(0.1, Math.min(1000, Number(input.notaMaxima) || 10));
  const peso = Math.max(0.1, Math.min(1000, Number(input.peso) || 1));
  // Nota acima da escala é quase sempre erro de digitação (8 na escala 0..5) —
  // e uma nota impossível envenena a média E a projeção de "quanto preciso".
  const nota =
    input.nota == null || Number.isNaN(Number(input.nota))
      ? null
      : Math.max(0, Math.min(notaMaxima, Number(input.nota)));

  const linha = {
    user_id: s.userId,
    subject_id: input.subjectId,
    nome,
    peso,
    nota,
    nota_maxima: notaMaxima,
    data: input.data && dataValida(input.data) ? input.data : null,
    ordem: Math.max(0, Math.min(999, Math.round(input.ordem) || 0)),
  };

  if (input.id) {
    const { data, error } = await s.supabase
      .from("avaliacoes")
      .update(linha)
      .eq("id", input.id)
      .eq("user_id", s.userId)
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Não deu pra salvar." };
    return { id: data.id as string };
  }

  const { data, error } = await s.supabase.from("avaliacoes").insert(linha).select("id").single();
  if (error || !data) return { error: error?.message ?? "Não deu pra salvar." };
  return { id: data.id as string };
}

export async function apagarAvaliacaoAction(id: string): Promise<{ ok: true } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;

  const { error } = await s.supabase.from("avaliacoes").delete().eq("id", id).eq("user_id", s.userId);
  if (error) return { error: error.message };
  return { ok: true };
}

/* -------------------------------------------------- preferência de e-mail */

/**
 * Liga/desliga o relatório semanal. NÃO exige Pro: quem deixou o plano vencer
 * precisa continuar podendo desligar um e-mail que recebe — prender a
 * preferência atrás do plano transformaria "cancelei a assinatura" em "não
 * consigo mais parar de receber", que é a definição de spam.
 */
export async function definirRelatorioSemanalAction(
  ligado: boolean,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ relatorio_semanal: ligado })
    .eq("id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}

/* ---------------------------------------- assistente de estrutura */

/**
 * Cria de uma vez as avaliações do semestre: N provas + M trabalhos, cada
 * grupo com seu peso.
 *
 * Existe porque cadastrar avaliação a avaliação é onde a tela perdia o aluno:
 * ele abre, vê um formulário com "peso" e "vale até", não sabe o que o
 * professor combinou em cada campo, e desiste — ficando sem a única conta que
 * ele veio buscar. Perguntar "quantas provas? quantos trabalhos?" é a forma
 * como ele já pensa no critério.
 *
 * Só funciona na disciplina AINDA SEM avaliações, e a checagem é aqui e não só
 * na UI: chamar a action direto numa disciplina já cadastrada duplicaria a
 * grade inteira e envenenaria a média sem erro nenhum.
 */
export async function criarEstruturaAvaliacoesAction(input: {
  subjectId: string;
  provas: number;
  pesoProva: number;
  trabalhos: number;
  pesoTrabalho: number;
  notaMaxima: number;
}): Promise<{ criadas: number } | { error: string }> {
  const s = await exigirPro();
  if ("error" in s) return s;
  if (!(await disciplinaDoAluno(s, input.subjectId))) return { error: "Essa disciplina não é sua." };

  const provas = Math.max(0, Math.min(12, Math.round(input.provas) || 0));
  const trabalhos = Math.max(0, Math.min(12, Math.round(input.trabalhos) || 0));
  if (provas + trabalhos === 0) return { error: "Informe ao menos uma prova ou trabalho." };

  const notaMaxima = Math.max(0.1, Math.min(1000, Number(input.notaMaxima) || 10));
  const pesoProva = Math.max(0.1, Math.min(1000, Number(input.pesoProva) || 1));
  const pesoTrabalho = Math.max(0.1, Math.min(1000, Number(input.pesoTrabalho) || 1));

  const { count } = await s.supabase
    .from("avaliacoes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", s.userId)
    .eq("subject_id", input.subjectId);
  if ((count ?? 0) > 0) {
    return { error: "Essa disciplina já tem avaliações. Edite ou apague as existentes." };
  }

  const linhas: Record<string, unknown>[] = [];
  for (let i = 1; i <= provas; i++) {
    linhas.push({
      user_id: s.userId,
      subject_id: input.subjectId,
      nome: provas === 1 ? "Prova" : `P${i}`,
      peso: pesoProva,
      nota: null,
      nota_maxima: notaMaxima,
      data: null,
      ordem: linhas.length,
    });
  }
  for (let i = 1; i <= trabalhos; i++) {
    linhas.push({
      user_id: s.userId,
      subject_id: input.subjectId,
      nome: trabalhos === 1 ? "Trabalho" : `Trabalho ${i}`,
      peso: pesoTrabalho,
      nota: null,
      nota_maxima: notaMaxima,
      data: null,
      ordem: linhas.length,
    });
  }

  const { error } = await s.supabase.from("avaliacoes").insert(linhas);
  if (error) return { error: error.message };
  return { criadas: linhas.length };
}
