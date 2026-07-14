"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ehPro } from "@/lib/plano/plano";
import { questlyXpDaQuestao } from "@/lib/questly/shared";
import { atualizarXpELiga } from "@/lib/questly/economia";
import { BONUS_VITORIA, XP_MAX_PARTIDA_XADREZ } from "./regras";
import { contarPartidasHoje, montarPoolPerguntas } from "./xadrez-data";
import type { CorEscolhida, CorJogador, NivelIa, PoolPerguntas, RegistroRodada, ResultadoPartida } from "./types";

// Server Actions da Arena de Xadrez. Decisões de confiança (mesma régua do
// finalizarMissaoAction):
//  - o gabarito vai pro cliente junto com a pergunta (padrão já aceito em
//    questao/page.tsx) — quem quiser trapacear a si mesmo consegue;
//  - o XP NÃO confia no cliente: é recomputado aqui a partir das rodadas
//    reportadas + dificuldade real das questões, com teto por partida, e
//    escrito via service_role (colunas protegidas por trigger).
//  - o slot free do dia é consumido pela CRIAÇÃO da linha (início da
//    partida), então refresh no meio não devolve partida grátis.

export type IniciarPartidaResultado =
  | { partidaId: string; cor: CorJogador; pool: PoolPerguntas }
  | { erro: "limite" | "sem_questoes" | "sessao" };

export async function iniciarPartidaAction(input: {
  subjectId: string | null;
  nivelIa: NivelIa;
  cor: CorEscolhida;
}): Promise<IniciarPartidaResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "sessao" };

  // partida largada no meio (F5/saiu) vira 'abandonada' — nunca fica
  // em_andamento pendurada
  await supabase
    .from("partidas_xadrez")
    .update({ status: "abandonada", finalizado_em: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "em_andamento");

  // gate freemium re-checado no servidor (Server Action é endpoint público)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();
  if (!ehPro(profile)) {
    const jaJogouHoje = await contarPartidasHoje(supabase, user.id);
    if (jaJogouHoje >= 1) return { erro: "limite" };
  }

  const pool = await montarPoolPerguntas(supabase, user.id, input.subjectId);
  if (!pool) return { erro: "sem_questoes" };

  const cor: CorJogador =
    input.cor === "aleatoria" ? (Math.random() < 0.5 ? "brancas" : "pretas") : input.cor;

  const { data: partida, error } = await supabase
    .from("partidas_xadrez")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      cor,
      nivel_ia: input.nivelIa,
      status: "em_andamento",
    })
    .select("id")
    .single();
  if (error || !partida) {
    console.error("Erro ao criar partida de xadrez:", error);
    return { erro: "sem_questoes" };
  }

  return { partidaId: partida.id as string, cor, pool };
}

export type FinalizarPartidaResultado =
  | { xpGanho: number; acertos: number; erros: number }
  | { erro: string };

export async function finalizarPartidaAction(input: {
  partidaId: string;
  resultado: ResultadoPartida;
  lances: string[];
  rodadas: RegistroRodada[];
}): Promise<FinalizarPartidaResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada." };

  // idempotência: só finaliza partida ainda em andamento — re-submeter o
  // mesmo id não paga XP duas vezes
  const { data: partida } = await supabase
    .from("partidas_xadrez")
    .select("id, nivel_ia, status")
    .eq("id", input.partidaId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!partida) return { erro: "Partida não encontrada." };
  if (partida.status !== "em_andamento") return { erro: "Partida já finalizada." };

  const acertos = input.rodadas.filter((r) => r.correta).length;
  const erros = input.rodadas.length - acertos;

  // XP recomputado no servidor: acertos deduplicados por questão (pergunta
  // reciclada não paga de novo), dificuldade vinda do banco (não do client),
  // bônus de vitória pelo nível REGISTRADO na linha, teto anti-farm.
  const idsCorretasUnicas = Array.from(
    new Set(input.rodadas.filter((r) => r.correta).map((r) => r.questionId)),
  );
  let xp = 0;
  if (idsCorretasUnicas.length > 0) {
    const { data: questoes } = await supabase
      .from("questions")
      .select("id, dificuldade")
      .in("id", idsCorretasUnicas);
    xp = (questoes || []).reduce((acc, q) => acc + questlyXpDaQuestao(q), 0);
  }
  if (input.resultado === "vitoria") {
    xp += BONUS_VITORIA[partida.nivel_ia as NivelIa] ?? 0;
  }
  const xpCapado = Math.min(xp, XP_MAX_PARTIDA_XADREZ);

  const { error: updateError } = await supabase
    .from("partidas_xadrez")
    .update({
      status: input.resultado,
      lances: input.lances,
      questoes: input.rodadas.map((r) => ({
        question_id: r.questionId,
        correta: r.correta,
        tempo_seg: r.tempoSeg,
        tier: r.tier,
      })),
      acertos,
      erros,
      xp_ganho: xpCapado,
      finalizado_em: new Date().toISOString(),
    })
    .eq("id", input.partidaId)
    .eq("status", "em_andamento");
  if (updateError) {
    console.error("Erro ao finalizar partida de xadrez:", updateError);
    return { erro: "Não foi possível salvar a partida." };
  }

  // XP/liga moram em colunas protegidas de profiles → service_role (user já
  // validado como dono acima). Maestria/taxa de acerto ficam intocadas de
  // propósito: resposta sob pressão de timer distorceria o BKT.
  if (xpCapado > 0 || input.rodadas.length > 0) {
    await atualizarXpELiga(createAdminClient(), user.id, acertos, erros, xpCapado);
  }

  return { xpGanho: xpCapado, acertos, erros };
}
