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

// ── ESCUDO DE OFENSIVA (supabase_escudo_ofensiva.sql) ──────────────────────
//
// Um dia perdido deixa de zerar a ofensiva quando o aluno tem escudo. Ele
// ganha 1 a cada ESCUDO_A_CADA dias consecutivos e acumula no máximo
// ESCUDO_MAX.
//
// As duas travas que impedem isto de virar "ofensiva de mentira":
// escudo NUNCA se compra (nem com XP, nem com Pro — ofensiva comprada não
// mede estudo nenhum), e o consumo é VISÍVEL na home ("12 dias · 1 escudo
// usado"). Esconder faria o 12 virar afirmação falsa, e este banco já gastou
// uma migração inteira consertando número que mentia na tela.
//
// O escudo cobre o dia em que a vida aconteceu, não o mês em que o aluno
// desistiu: com teto de 2, duas semanas sumidas continuam zerando tudo.
export const ESCUDO_A_CADA = 5;
export const ESCUDO_MAX = 2;

/** Ganhou escudo AO CHEGAR neste streak? (múltiplo de ESCUDO_A_CADA) */
function ganhouEscudo(streak: number): boolean {
  return streak > 0 && streak % ESCUDO_A_CADA === 0;
}

export async function atualizarStreakEDailyLog(supabase: SupabaseClient, userId: string) {
  const hoje = questlyHojeISO();
  const ontem = toISODate(addDias(new Date(), -1));
  const anteontem = toISODate(addDias(new Date(), -2));

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
    //
    // Anteontem entra na leitura por causa do escudo: é ele que separa "faltei
    // UM dia" (cobrível) de "sumi" (não cobrível). As duas linhas saem da
    // mesma consulta.
    const { data: logsRecentes } = await supabase
      .from("daily_logs")
      .select("data, estudou")
      .eq("user_id", userId)
      .in("data", [ontem, anteontem]);

    const estudouEm = (d: string) =>
      Boolean((logsRecentes || []).find((l) => String(l.data).slice(0, 10) === d)?.estudou);
    const estudouOntem = estudouEm(ontem);
    const estudouAnteontem = estudouEm(anteontem);

    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_atual, escudos, escudo_usado_em")
      .eq("id", userId)
      .single();

    const streakAnterior = profile?.streak_atual || 0;
    // `escudos` ausente = banco sem a migração; aí o escudo simplesmente não
    // existe e a regra antiga vale inteira.
    const escudosAtuais = profile?.escudos ?? 0;

    let novoStreak: number;
    let escudos = escudosAtuais;
    let escudoUsadoEm: string | null = (profile?.escudo_usado_em as string | null) ?? null;

    if (estudouOntem) {
      novoStreak = streakAnterior + 1;
    } else if (
      // Exatamente UM dia perdido (estudou anteontem, faltou ontem), tem
      // escudo e a ofensiva valia a pena proteger.
      estudouAnteontem &&
      escudosAtuais > 0 &&
      streakAnterior > 0
    ) {
      // O escudo cobre ONTEM: a sequência segue, e hoje soma normalmente.
      novoStreak = streakAnterior + 1;
      escudos = escudosAtuais - 1;
      escudoUsadoEm = ontem;
    } else {
      novoStreak = 1;
    }

    // Ganho: ao CRUZAR o múltiplo, e nunca acima do teto. Fica depois do
    // consumo de propósito — quem gastou o último escudo hoje e bateu o
    // múltiplo no mesmo dia sai com um de novo, o que é justo: ele estudou.
    if (ganhouEscudo(novoStreak)) escudos = Math.min(ESCUDO_MAX, escudos + 1);

    const patch: Record<string, unknown> = { streak_atual: novoStreak };
    if (profile && "escudos" in profile) {
      patch.escudos = escudos;
      patch.escudo_usado_em = escudoUsadoEm;
    }

    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    // Banco sem supabase_escudo_ofensiva.sql: reescreve só o streak, que é o
    // comportamento de antes. Uma coluna que ainda não existe não pode
    // derrubar o registro do dia.
    if (error) {
      console.error("Erro ao atualizar ofensiva:", error);
      await supabase.from("profiles").update({ streak_atual: novoStreak }).eq("id", userId);
    }
  }
}
