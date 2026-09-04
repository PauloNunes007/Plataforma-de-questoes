"use server";

import { createClient } from "@/lib/supabase/server";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { ehPro } from "@/lib/plano/plano";
import { instituicoesDoAluno } from "./simulados-data";
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

  const nomeInstituicao = casadas.sort((a, b) => b.length - a.length)[0];
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

// Autossalva as respostas parciais enquanto a prova roda (sobrevive a refresh /
// queda de conexão). Só mexe num simulado em andamento do próprio aluno.
export async function salvarRespostasAction(id: string, respostas: Record<string, string>): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("simulados_aluno")
    .update({ respostas })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "em_andamento");
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

  const { error } = await supabase
    .from("simulados_aluno")
    .update({
      status: "concluido",
      respostas,
      acertos,
      total,
      nota,
      tempo_gasto_seg: Math.max(0, Math.round(tempoGastoSeg)),
      concluido_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "em_andamento");

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
