"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { ehPro } from "@/lib/plano/plano";
import { instituicoesDoAluno } from "./simulados-data";
import { iniciarPraticaLivreAction } from "@/lib/disciplinas/actions";
import { nomeExibicaoInstituicao } from "@/lib/cursos/instituicao";
import {
  SIMULADO_FREE_LIMITE_SEMANA,
  clampQuantidade,
  ehDuracaoValida,
  notaSimulado,
} from "./constantes";

export type MontarSimuladoInput = {
  topicIds: string[];
  materiaIds: string[];
  /** só pro título (cosmético) — o servidor não confia nisso pro sorteio */
  materiaNomes: string[];
  duracaoMin: number;
  quantidade: number;
};

export type MontarSimuladoResultado =
  | { ok: true; id: string }
  | { ok: false; erro: "limite" | "sem_instituicao" | "sem_questoes" | "invalido" };

// Cria um simulado: valida o plano (free tem limite semanal, Pro é ilimitado),
// deriva a instituição do aluno pelo profile (AUTORITATIVO — o cliente não
// escolhe de que universidade sortear), sorteia questões reais daquela
// instituição nos tópicos pedidos (anos aleatórios saem de graça do embaralho)
// e fixa a ordem no registro.
export async function montarSimuladoAction(input: MontarSimuladoInput): Promise<MontarSimuladoResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "invalido" };

  if (!ehDuracaoValida(input.duracaoMin) || input.topicIds.length === 0) {
    return { ok: false, erro: "invalido" };
  }
  const quantidade = clampQuantidade(input.quantidade);

  const { data: perfil } = await supabase
    .from("profiles")
    .select("universidade, plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  // Gate do plano free — checagem autoritativa no servidor.
  if (!ehPro(perfil)) {
    const segunda = questlySegundaDaSemana(new Date());
    const { count } = await supabase
      .from("simulados_aluno")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("criado_em", segunda);
    if ((count ?? 0) >= SIMULADO_FREE_LIMITE_SEMANA) return { ok: false, erro: "limite" };
  }

  const casadas = await instituicoesDoAluno(supabase, perfil?.universidade ?? null);
  if (casadas.length === 0) return { ok: false, erro: "sem_instituicao" };

  const { data: candidatas } = await supabase
    .from("questions")
    .select("id")
    .in("instituicao", casadas)
    .in("topic_id", input.topicIds)
    .limit(5000);
  if (!candidatas || candidatas.length === 0) return { ok: false, erro: "sem_questoes" };

  const escolhidas = questlyEmbaralhar(candidatas).slice(0, Math.min(quantidade, candidatas.length));
  const questionIds = escolhidas.map((q) => q.id);

  const nomeInstituicao = nomeExibicaoInstituicao(casadas);
  const materiaNomes = (input.materiaNomes || []).filter(Boolean);
  const titulo =
    materiaNomes.length === 1
      ? `Simulado ${nomeInstituicao} · ${materiaNomes[0]}`
      : `Simulado ${nomeInstituicao}`;

  const { data: criado, error } = await supabase
    .from("simulados_aluno")
    .insert({
      user_id: user.id,
      titulo,
      instituicao: nomeInstituicao,
      materia_ids: input.materiaIds,
      topico_ids: input.topicIds,
      question_ids: questionIds,
      duracao_min: input.duracaoMin,
      qtd_questoes: questionIds.length,
      status: "em_andamento",
      respostas: {},
    })
    .select("id")
    .single();

  if (error || !criado) {
    console.error("Erro ao montar simulado:", error);
    return { ok: false, erro: "invalido" };
  }
  return { ok: true, id: criado.id as string };
}

// Autossalva respostas + tempo por questão enquanto a prova roda (sobrevive a
// refresh / queda de conexão). Só mexe num simulado em andamento do próprio
// aluno. `tempos` é best-effort: se vier vazio, não sobrescreve o que já existe.
export async function salvarRespostasAction(
  id: string,
  respostas: Record<string, string>,
  tempos?: Record<string, number>,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const limpos = sanearTempos(tempos);
  const { error } = await supabase
    .from("simulados_aluno")
    .update(limpos ? { respostas, tempos: limpos } : { respostas })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "em_andamento");

  // Sem supabase_simulados_analytics.sql rodado, `tempos` não existe e o
  // update inteiro falha — o que perderia as RESPOSTAS do aluno, não só a
  // telemetria. Repete sem a coluna: o simulado continua funcionando, só sem
  // o gráfico de ritmo.
  if (error && limpos && ehColunaAusente(error)) {
    await supabase
      .from("simulados_aluno")
      .update({ respostas })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "em_andamento");
  }
}

/** 42703 = undefined_column no Postgres (migração de analytics não rodada). */
function ehColunaAusente(erro: { code?: string; message?: string } | null): boolean {
  return erro?.code === "42703" || Boolean(erro?.message?.includes("tempos"));
}

// O cliente é quem cronometra cada questão (não dá pra medir isso no servidor),
// então o valor é saneado antes de entrar no banco: só número finito e positivo,
// e teto de 4h por questão pra uma aba esquecida aberta não virar um outlier que
// distorce todo o gráfico de ritmo. Nada aqui vale nota — é só telemetria.
const TETO_TEMPO_QUESTAO_SEG = 4 * 60 * 60;

function sanearTempos(tempos?: Record<string, number>): Record<string, number> | null {
  if (!tempos) return null;
  const saida: Record<string, number> = {};
  for (const [k, v] of Object.entries(tempos)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) saida[k] = Math.min(TETO_TEMPO_QUESTAO_SEG, Math.round(n));
  }
  return Object.keys(saida).length > 0 ? saida : null;
}

export type FinalizarSimuladoResultado =
  | { ok: true; acertos: number; total: number; nota: number }
  | { ok: false };

// Encerra e CORRIGE no servidor (recomputa acertos/nota pelos gabaritos — nunca
// confia na contagem do cliente). Idempotente: se já concluído, devolve o que
// está salvo em vez de recorrigir.
export async function finalizarSimuladoAction(
  id: string,
  respostas: Record<string, string>,
  tempoGastoSeg: number,
  tempos?: Record<string, number>,
): Promise<FinalizarSimuladoResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: s } = await supabase
    .from("simulados_aluno")
    .select("question_ids, status, acertos, total, nota")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!s) return { ok: false };

  if (s.status === "concluido") {
    return { ok: true, acertos: s.acertos ?? 0, total: s.total ?? 0, nota: Number(s.nota ?? 0) };
  }

  const ids: string[] = s.question_ids || [];
  const total = ids.length;
  const { data: gabs } = await supabase.from("questions").select("id, gabarito").in("id", ids);
  const gabaritoPorId = new Map((gabs || []).map((q) => [q.id as string, q.gabarito as string]));

  let acertos = 0;
  for (const qid of ids) {
    const marcada = respostas[qid];
    if (marcada && gabaritoPorId.get(qid) === marcada) acertos += 1;
  }
  const nota = notaSimulado(acertos, total);

  const limpos = sanearTempos(tempos);
  const base = {
    status: "concluido",
    respostas,
    acertos,
    total,
    nota,
    tempo_gasto_seg: Math.max(0, Math.round(tempoGastoSeg)),
    concluido_em: new Date().toISOString(),
  };

  const aplicar = (patch: Record<string, unknown>) =>
    supabase
      .from("simulados_aluno")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "em_andamento");

  let { error } = await aplicar(limpos ? { ...base, tempos: limpos } : base);
  // Mesma proteção do autossalvamento: sem a migração de analytics, entregar a
  // prova não pode falhar por causa de uma coluna de telemetria.
  if (error && limpos && ehColunaAusente(error)) ({ error } = await aplicar(base));

  if (error) {
    console.error("Erro ao finalizar simulado:", error);
    return { ok: false };
  }
  return { ok: true, acertos, total, nota };
}

// Descarta um simulado em andamento (o aluno saiu sem terminar).
export async function abandonarSimuladoAction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("simulados_aluno")
    .update({ status: "abandonado" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "em_andamento");
}

/**
 * "Treinar o que eu errei": transforma os tópicos onde o aluno tropeçou no
 * simulado numa missão avulsa de prática livre — o caminho mais curto entre
 * ver o resultado e fazer alguma coisa com ele.
 *
 * O simulado em si continua self-contained (não paga XP nem move o motor de
 * maestria); quem paga é a PRÁTICA que nasce daqui, e ela é uma missão avulsa
 * comum, idêntica à que sai do Banco de Questões — nenhuma regra de economia
 * nova, nenhum caminho novo pra forjar ranking.
 *
 * `subject_id` é resolvido no servidor a partir da matéria dos tópicos: se o
 * aluno cursa a disciplina, a prática fica vinculada a ela; se for uma matéria
 * que ele só descobriu no banco, vai como null (missions.subject_id é nullable
 * exatamente pra isso).
 */
export async function treinarTopicosDoSimuladoAction(input: {
  topicIds: string[];
  quantidade: number;
}): Promise<{ missaoId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  const topicIds = [...new Set((input.topicIds || []).filter(Boolean))].slice(0, 12);
  if (topicIds.length === 0) return { missaoId: null };

  const { data: tops } = await supabase.from("topicos").select("materia_id").in("id", topicIds);
  const materiaIds = [...new Set((tops || []).map((t) => t.materia_id).filter(Boolean))] as string[];

  let subjectId: string | null = null;
  if (materiaIds.length > 0) {
    const { data: subj } = await supabase
      .from("subjects")
      .select("id")
      .eq("user_id", user.id)
      .in("materia_id", materiaIds)
      .limit(1)
      .maybeSingle();
    subjectId = subj?.id ?? null;
  }

  return iniciarPraticaLivreAction({
    subjectId,
    topicIds,
    dificuldades: [],
    quantidade: Math.max(1, Math.min(30, Math.round(Number(input.quantidade) || 10))),
  });
}
