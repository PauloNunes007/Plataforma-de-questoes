// "Revisar hoje" — o que a memória do aluno está perdendo AGORA.
//
// O motor de aprovação já calcula isto a cada resposta: `estabilidade` (a
// meia-vida da memória daquele tópico, em dias) e `ultima_revisao` dão a
// retenção de hoje por Ebbinghaus, R = e^(-Δt/S). Até aqui esse número só
// aparecia num selo dentro de /trilha — tela que o aluno abre de vez em
// quando —, e o sinal mais acionável que a plataforma produz morria lá.
//
// POR QUE ISTO NÃO É O MOTOR DE MISSÕES DE VOLTA
// ----------------------------------------------
// O motor removido em 2026-09-16 MONTAVA O DIA: escolhia disciplinas, repartia
// minutos, empilhava quatro matérias e aparecia querendo ou não. Aqui não há
// plano, orçamento de tempo, nem ordem do dia — há um FATO sobre o aluno
// ("três tópicos seus estão abaixo de 60% de retenção") e um botão opcional.
// É a mesma informação que o selo da trilha já dá, na tela que ele de fato
// abre. Informar não é prescrever.
//
// E é por ser um fato que isto funciona como gatilho diário sem inventar
// cobrança: o conteúdo muda sozinho todo dia porque a memória decai sozinha
// todo dia. Nada aqui é meta, e quando não há nada caindo o cartão não
// aparece — um cartão que se preenche à força vira ruído e o aluno para de
// olhar.
import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyRetencaoEfetiva } from "@/lib/questly/motor-aprovacao";
import { QUESTLY_RETENCAO_LIMIAR } from "@/lib/questly/shared";
import { contagemDasMaterias } from "@/lib/questly/contagem-questoes";
import { emLotes } from "@/lib/supabase/paginado";

/** Quantos tópicos cabem no cartão. Acima disso a lista vira parede e a
 *  mensagem ("dá pra resolver hoje") deixa de ser verdade. */
export const REVISAR_MAX_TOPICOS = 3;

/** Tamanho da lista que o botão monta. Curta de propósito: a revisão tem que
 *  caber no intervalo entre duas aulas, senão não acontece. */
export const REVISAR_QTD_POR_TOPICO = 4;
export const REVISAR_QTD_MAX = 15;

export type TopicoEmRisco = {
  topicoId: string;
  nome: string;
  materiaNome: string;
  /** 0..1 — quanto da memória daquele tópico sobrou hoje. */
  retencao: number;
  /** Dias desde o último toque, pro cartão poder dizer "há 12 dias". */
  diasSemTocar: number;
  questoesDisponiveis: number;
};

export type RevisarHoje = {
  topicos: TopicoEmRisco[];
  /** Quantos tópicos estão em risco no total (pode ser > topicos.length). */
  totalEmRisco: number;
  /** Quantas questões o botão vai montar. */
  quantidade: number;
};

/**
 * Os tópicos do aluno cuja retenção caiu abaixo do limiar, do pior pro menos
 * pior.
 *
 * Só entram tópicos das disciplinas DELE (não o banco inteiro), com questão
 * disponível no acervo e que ele já tocou — retenção de conteúdo nunca
 * estudado não existe, e oferecer "revisão" do que nunca foi visto seria
 * mentira. `pulado` fica de fora: o aluno já disse que sabe.
 */
export async function carregarRevisarHoje(
  supabase: SupabaseClient,
  userId: string,
): Promise<RevisarHoje | null> {
  // 1. As disciplinas do aluno → as matérias que importam.
  const { data: subjects } = await supabase
    .from("subjects")
    .select("materia_id")
    .eq("user_id", userId);
  const materiaIds = Array.from(
    new Set(
      (subjects || [])
        .map((s) => s.materia_id as string | null)
        .filter((m): m is string => Boolean(m)),
    ),
  );
  if (materiaIds.length === 0) return null;

  // 2. O progresso do aluno — só linhas já tocadas (ultima_revisao existe).
  //    É o conjunto que pode ter retenção, e costuma ser pequeno.
  const { data: progressos } = await supabase
    .from("aluno_topico_progresso")
    .select(
      "topico_id, status, taxa_acerto, num_questoes_respondidas, maestria, estabilidade, ultima_revisao",
    )
    .eq("user_id", userId)
    .not("ultima_revisao", "is", null);
  if (!progressos || progressos.length === 0) return null;

  const candidatos = progressos.filter((p) => (p.status || "pendente") !== "pulado");
  if (candidatos.length === 0) return null;

  // 3. Nome/matéria dos tópicos tocados. Em lotes: uma lista de ids vira
  //    querystring e ~400 uuids já estoura (ver lib/supabase/paginado.ts).
  const topicoIds = candidatos.map((p) => p.topico_id as string);
  const topicos = await emLotes(topicoIds, (lote) =>
    supabase.from("topicos").select("id, nome, materia_id").in("id", lote),
  );
  const topicoPorId = new Map(
    topicos.map((t) => [t.id as string, t as { id: string; nome: string; materia_id: string }]),
  );

  // 4. Quantas questões (regulares) cada tópico tem — pela view agregada, não
  //    varrendo `questions`.
  const contagens = await contagemDasMaterias(supabase, materiaIds);
  const contagemPorTopico = new Map(contagens.map((c) => [c.topicId, c]));

  const agoraMs = Date.now();
  const emRisco: TopicoEmRisco[] = [];

  for (const p of candidatos) {
    const topico = topicoPorId.get(p.topico_id as string);
    if (!topico) continue;
    // Tópico de matéria que o aluno não cursa mais não é pendência dele.
    if (!materiaIds.includes(topico.materia_id)) continue;

    const contagem = contagemPorTopico.get(topico.id);
    if (!contagem || contagem.totalRegular === 0) continue;

    const retencao = questlyRetencaoEfetiva(p, agoraMs);
    if (retencao === null || retencao >= QUESTLY_RETENCAO_LIMIAR) continue;

    emRisco.push({
      topicoId: topico.id,
      nome: topico.nome || "Tópico",
      materiaNome: contagem.materiaNome,
      retencao,
      diasSemTocar: Math.max(
        0,
        Math.round((agoraMs - new Date(p.ultima_revisao as string).getTime()) / 86400000),
      ),
      questoesDisponiveis: contagem.totalRegular,
    });
  }

  if (emRisco.length === 0) return null;

  // Pior primeiro: quem está mais perto de virar conteúdo novo de novo.
  emRisco.sort((a, b) => a.retencao - b.retencao);
  const escolhidos = emRisco.slice(0, REVISAR_MAX_TOPICOS);

  const quantidade = Math.min(
    REVISAR_QTD_MAX,
    escolhidos.reduce(
      (acc, t) => acc + Math.min(REVISAR_QTD_POR_TOPICO, t.questoesDisponiveis),
      0,
    ),
  );

  return { topicos: escolhidos, totalEmRisco: emRisco.length, quantidade };
}
