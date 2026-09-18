import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyGarantirSemanaLiga } from "@/lib/questly/liga";
import { addDias, questlyHojeISO, questlyNivelDoXp, toISODate } from "@/lib/questly/shared";

// Economia de gamificação — os writes de XP/liga/streak em `profiles`.
// Extraído de lib/questao/actions.ts pra poder ser reutilizado por outros
// fluxos SEM virar Server Action: este arquivo não tem "use server" de
// propósito — exportar essas funções de um arquivo "use server" as
// tornaria endpoints invocáveis direto do browser.
//
// As colunas tocadas aqui são protegidas pelo trigger
// questly_proteger_colunas_profile (supabase_seguranca_hardening.sql):
// o `supabase` recebido DEVE ser o cliente admin (createAdminClient), e o
// caller DEVE ter validado a sessão/autorização antes.

/**
 * Paga o XP de uma lista fechada e realinha os contadores públicos do
 * aluno (os que o ranking mostra).
 *
 * O trabalho de verdade acontece DENTRO do banco, em
 * `questly_registrar_progresso` (supabase_ranking_fiel.sql), por dois
 * motivos que o caminho antigo — SELECT, somar em JS, UPDATE — não tinha
 * como resolver:
 *
 * 1. XP somado no UPDATE é atômico. Antes, duas listas fechadas ao mesmo
 *    tempo liam o mesmo xp_total e a segunda sobrescrevia a primeira: o
 *    aluno via o XP na tela de resultado e ele não chegava no ranking.
 * 2. questoes_total/acertos_total/questoes_semana são RECOMPUTADOS de
 *    question_attempts, não incrementados. Incrementar só no fechamento
 *    perdia tudo que o aluno respondeu numa lista abandonada — e era por
 *    isso que a home (que conta as tentativas direto) e o card do ranking
 *    (que lia o contador) mostravam números diferentes pro mesmo aluno.
 *
 * `acertos`/`erros` continuam na assinatura porque o fallback abaixo
 * precisa deles; no caminho normal quem conta é o banco.
 */
export async function atualizarXpELiga(
  supabase: SupabaseClient,
  userId: string,
  acertos: number,
  erros: number,
  xpGanho: number,
) {
  // A virada de semana tem que vir ANTES: é ela que zera xp_semana e move
  // semana_inicio. Somar em cima de um xp_semana da semana passada era
  // creditar XP desta semana na liga da anterior.
  const estado = await questlyGarantirSemanaLiga(supabase, { id: userId });

  const { error } = await supabase.rpc("questly_registrar_progresso", {
    p_user_id: userId,
    p_xp: xpGanho,
    p_semana_inicio: estado?.semana_inicio ?? null,
  });
  if (!error) return;

  // Banco sem supabase_ranking_fiel.sql ainda: cai no caminho antigo pra
  // não perder o XP do aluno. Ele tem a corrida descrita acima — é um
  // paliativo até a migração rodar, não uma alternativa.
  console.error("questly_registrar_progresso indisponível, usando o caminho antigo:", error);
  await atualizarXpELigaLegado(supabase, userId, acertos, erros, xpGanho, estado);
}

async function atualizarXpELigaLegado(
  supabase: SupabaseClient,
  userId: string,
  acertos: number,
  erros: number,
  xpGanho: number,
  estado: { xp_semana?: number; questoes_semana?: number } | null,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_total, questoes_total")
    .eq("id", userId)
    .single();
  // Lida à parte porque a coluna é nova (supabase_acertos_publicos.sql):
  // num banco que ainda não rodou a migração este select falha, e não pode
  // levar junto o xp_total — que é o que de fato não pode se perder.
  const { data: perfilAcertos } = await supabase
    .from("profiles")
    .select("acertos_total")
    .eq("id", userId)
    .maybeSingle();
  const novoXpTotal = (profile?.xp_total || 0) + xpGanho;
  const novoXpSemana = (estado?.xp_semana || 0) + xpGanho;
  const novasQuestoesSemana = (estado?.questoes_semana || 0) + (acertos + erros);
  const novasQuestoesTotal = (profile?.questoes_total || 0) + (acertos + erros);
  const novosAcertosTotal = (perfilAcertos?.acertos_total || 0) + acertos;

  const { error } = await supabase
    .from("profiles")
    .update({
      xp_total: novoXpTotal,
      nivel: questlyNivelDoXp(novoXpTotal),
      xp_semana: novoXpSemana,
      questoes_semana: novasQuestoesSemana,
      questoes_total: novasQuestoesTotal,
      acertos_total: novosAcertosTotal,
    })
    .eq("id", userId);

  // Banco ainda sem supabase_acertos_publicos.sql (coluna acertos_total
  // ausente): a economia inteira não pode cair por causa da estatística
  // pública nova — repete o update sem ela.
  if (error) {
    console.error("Erro ao atualizar XP/liga (tentando sem acertos_total):", error);
    await supabase
      .from("profiles")
      .update({
        xp_total: novoXpTotal,
        nivel: questlyNivelDoXp(novoXpTotal),
        xp_semana: novoXpSemana,
        questoes_semana: novasQuestoesSemana,
        questoes_total: novasQuestoesTotal,
      })
      .eq("id", userId);
  }
}

/**
 * Realinha os contadores públicos de QUESTÃO (`questoes_total`,
 * `acertos_total`, `questoes_semana`) sem pagar XP nenhum — daí o `p_xp: 0`.
 *
 * Chamada a cada resposta registrada. Antes, esses três números só eram
 * escritos ao FECHAR uma lista: quem respondia 30 questões e saía no meio
 * ficava com 30 linhas em `question_attempts` e 0 nos contadores, então a home
 * (que conta as tentativas direto) mostrava um número e o ranking/card
 * mostravam outro, pro MESMO aluno. Como a RPC RECOMPUTA de
 * `question_attempts` em vez de incrementar, chamá-la aqui torna o contador
 * uma leitura contínua da verdade, e não um saldo que depende do aluno chegar
 * até o fim da lista.
 *
 * XP fica de fora de propósito: ele depende de combo/maestria/anti-farm do
 * instante da resposta e do placar recomputado da lista inteira — continua
 * sendo pago só no fechamento, por `atualizarXpELiga`.
 *
 * Falhar aqui é sempre não-fatal: contador atrasado não pode derrubar o
 * registro da resposta, que é o dado que de fato importa.
 */
export async function sincronizarContadoresQuestao(supabase: SupabaseClient, userId: string) {
  // A virada de semana vem antes pelo mesmo motivo de `atualizarXpELiga`: é
  // ela que define de qual segunda-feira `questoes_semana` deve contar.
  const estado = await questlyGarantirSemanaLiga(supabase, { id: userId });

  const { error } = await supabase.rpc("questly_registrar_progresso", {
    p_user_id: userId,
    p_xp: 0,
    p_semana_inicio: estado?.semana_inicio ?? null,
  });
  // Banco sem supabase_ranking_fiel.sql: os contadores voltam a só se mexer no
  // fechamento da lista (o comportamento antigo), sem quebrar a resposta.
  if (error) console.error("Não foi possível sincronizar os contadores de questão:", error);
}

export async function atualizarStreakEDailyLog(supabase: SupabaseClient, userId: string) {
  const hoje = questlyHojeISO();
  const ontem = toISODate(addDias(new Date(), -1));

  const { data: logHoje } = await supabase
    .from("daily_logs")
    .select("data")
    .eq("user_id", userId)
    .eq("data", hoje)
    .maybeSingle();

  await supabase.from("daily_logs").upsert({ user_id: userId, data: hoje, estudou: true }, { onConflict: "user_id,data" });

  // Só mexe no streak na PRIMEIRA vez que estuda hoje (missões seguintes do
  // mesmo dia não contam de novo).
  if (!logHoje) {
    // Streak = dias CONSECUTIVOS. Se ontem também teve estudo, continua a
    // sequência; se não, hoje reinicia em 1. Antes o contador só somava e nunca
    // zerava, então o "🔥 streak" na verdade era o total de dias estudados.
    const { data: logOntem } = await supabase
      .from("daily_logs")
      .select("estudou")
      .eq("user_id", userId)
      .eq("data", ontem)
      .maybeSingle();

    const { data: profile } = await supabase.from("profiles").select("streak_atual").eq("id", userId).single();
    const novoStreak = logOntem?.estudou ? (profile?.streak_atual || 0) + 1 : 1;
    await supabase.from("profiles").update({ streak_atual: novoStreak }).eq("id", userId);
  }
}
