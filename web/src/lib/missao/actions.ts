"use server";

// Controle manual da missão do dia — repasse de 2026-09-16.
//
// O motor continua recomendando, mas deixou de ter a última palavra: o aluno
// pode trocar a disciplina de hoje, adiar o dia, mudar o tamanho da missão e
// escolher outro tópico. Nenhuma dessas ações inventa XP nem mexe em streak —
// elas só reescrevem o PLANO (topic_ids/question_ids/qtd_questoes/
// tempo_previsto_min/xp_recompensa da linha de `missions`).
//
// Duas invariantes valem pra todas as ações daqui:
//
//  1. **Questão já respondida nunca sai da missão.** `recomputarPlacarMissao`
//     (lib/questao/actions.ts) só pontua o que está em `question_ids`; tirar
//     dali uma questão já respondida apagaria XP que o aluno ganhou. Por isso
//     toda remontagem começa pelas respondidas, na ordem original.
//  2. **Missão concluída é histórico.** Nenhuma ação toca numa missão com
//     `concluida = true` — reabrir o passado abriria caminho pra refazer a
//     mesma missão e cobrar XP de novo.
//
// Tipos e constantes ficam em ./tipos.ts: um módulo "use server" só pode
// exportar funções async.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  questlyBuscarCandidatas,
  questlyEscolherQuestoes,
  questlyGerarMissaoParaSubject,
  questlyResumoMissao,
  QUESTLY_MAX_QUESTOES_MISSAO,
  type CandidataQuestao,
} from "@/lib/questly/mission-engine";
import { contagemDosTopicos } from "@/lib/questly/contagem-questoes";
import {
  QUESTLY_DIAS_SEMANA,
  addDias,
  questlyEmbaralhar,
  questlyHojeISO,
  questlyNormalizarDia,
  toISODate,
} from "@/lib/questly/shared";
import type { ResultadoMissao, TopicoOpcao } from "./tipos";

const MAX_TOPICOS_ESCOLHIDOS = 2;

type MissaoEditavel = {
  id: string;
  user_id: string;
  subject_id: string;
  data: string;
  topic_ids: string[] | null;
  question_ids: string[] | null;
  concluida: boolean;
  avulsa: boolean;
  adiada_para: string | null;
};

type SupabaseServidor = Awaited<ReturnType<typeof createClient>>;

async function carregarMissaoDoAluno(missaoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, missao: null, erro: "Sessão expirada. Entre de novo." };

  const { data: missao } = await supabase
    .from("missions")
    .select("id, user_id, subject_id, data, topic_ids, question_ids, concluida, avulsa, adiada_para")
    .eq("id", missaoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!missao) return { supabase, user, missao: null, erro: "Missão não encontrada." };
  if ((missao as MissaoEditavel).concluida) {
    return { supabase, user, missao: null, erro: "Essa missão já foi concluída — ela é histórico agora." };
  }
  return { supabase, user, missao: missao as MissaoEditavel, erro: null };
}

/** Próximo dia marcado como disponível na rotina (ou amanhã, quando o aluno
 *  não configurou dias). Nunca devolve hoje: adiar é sair do dia de hoje. */
function proximoDiaDeEstudo(diasDisponiveis: string[] | null | undefined): string {
  const marcados = new Set((diasDisponiveis || []).map(questlyNormalizarDia));
  const hoje = new Date(new Date().toDateString());
  for (let i = 1; i <= 7; i++) {
    const d = addDias(hoje, i);
    if (marcados.size === 0 || marcados.has(QUESTLY_DIAS_SEMANA[d.getDay()])) return toISODate(d);
  }
  return toISODate(addDias(hoje, 1));
}

/** Ids já respondidos nesta missão, na ordem em que a missão os lista. */
async function questoesJaRespondidas(
  supabase: SupabaseServidor,
  userId: string,
  missao: MissaoEditavel,
): Promise<string[]> {
  const { data: tentativas } = await supabase
    .from("question_attempts")
    .select("question_id")
    .eq("user_id", userId)
    .eq("mission_id", missao.id);

  const respondidas = new Set((tentativas || []).map((t) => t.question_id as string));
  const ordem = Array.isArray(missao.question_ids) ? missao.question_ids : [];
  const naOrdem = ordem.filter((id) => respondidas.has(id));
  // Respondida fora de `question_ids` (missão antiga sem a coluna) entra depois.
  naOrdem.forEach((id) => respondidas.delete(id));
  return [...naOrdem, ...respondidas];
}

/** Remonta topic_ids/question_ids/qtd/tempo/XP de uma missão em andamento,
 *  preservando o que já foi respondido. É o coração das três edições. */
async function remontarMissao(
  supabase: SupabaseServidor,
  userId: string,
  missao: MissaoEditavel,
  opcoes: { topicIds?: string[]; qtdAlvo?: number },
): Promise<ResultadoMissao> {
  const topicIds = (
    opcoes.topicIds && opcoes.topicIds.length > 0 ? opcoes.topicIds : missao.topic_ids || []
  ).slice(0, MAX_TOPICOS_ESCOLHIDOS);

  if (topicIds.length === 0) return { error: "Escolha pelo menos um tópico." };

  const jaRespondidas = await questoesJaRespondidas(supabase, userId, missao);
  const candidatas = await questlyBuscarCandidatas(supabase, topicIds);

  if (candidatas.length === 0 && jaRespondidas.length === 0) {
    return { error: "Esse tópico ainda não tem questões cadastradas." };
  }

  // O alvo nunca fica abaixo do que já foi respondido: a missão não encolhe
  // pra baixo do trabalho já feito.
  const alvoBruto = opcoes.qtdAlvo ?? (missao.question_ids?.length || candidatas.length);
  const alvo = Math.min(
    QUESTLY_MAX_QUESTOES_MISSAO,
    Math.max(jaRespondidas.length, 1, Math.round(alvoBruto)),
  );

  const respondidasSet = new Set(jaRespondidas);
  const disponiveis = questlyEmbaralhar(candidatas.filter((q) => !respondidasSet.has(q.id)));
  const faltam = Math.max(0, alvo - jaRespondidas.length);
  const novas = faltam > 0 ? questlyEscolherQuestoes(disponiveis, { qtdAlvo: faltam }) : [];

  // As já respondidas entram no resumo (tempo/XP) com os dados reais delas.
  const linhasRespondidas: CandidataQuestao[] = [];
  if (jaRespondidas.length > 0) {
    const { data: antigas } = await supabase
      .from("questions")
      .select("id, topic_id, tempo_medio_seg, dificuldade")
      .in("id", jaRespondidas);
    const porId = new Map(((antigas || []) as CandidataQuestao[]).map((q) => [q.id, q]));
    jaRespondidas.forEach((id) => {
      const linha = porId.get(id);
      if (linha) linhasRespondidas.push(linha);
    });
  }

  const finais = [...linhasRespondidas, ...novas];
  if (finais.length === 0) return { error: "Não consegui montar a missão com esse tópico." };

  const { questionIds, qtdQuestoes, tempoPrevistoMin, xpRecompensa } = questlyResumoMissao(finais);

  // topic_ids passa a refletir o que a missão de fato contém (inclui o tópico
  // de uma questão já respondida que não está mais entre os escolhidos).
  const topicosFinais = Array.from(
    new Set([...topicIds, ...finais.map((q) => q.topic_id)]),
  ).filter(Boolean);

  const { error } = await supabase
    .from("missions")
    .update({
      topic_ids: topicosFinais,
      question_ids: questionIds,
      qtd_questoes: qtdQuestoes,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: xpRecompensa,
    })
    .eq("id", missao.id)
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao remontar missão:", error);
    return { error: "Não consegui salvar a alteração agora." };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

/** "Hoje eu quero N questões". */
export async function ajustarTamanhoMissaoAction(
  missaoId: string,
  qtdQuestoes: number,
): Promise<ResultadoMissao> {
  const { supabase, user, missao, erro } = await carregarMissaoDoAluno(missaoId);
  if (erro || !missao || !user) return { error: erro };

  const alvo = Math.max(1, Math.min(QUESTLY_MAX_QUESTOES_MISSAO, Math.round(qtdQuestoes)));
  return remontarMissao(supabase, user.id, missao, { qtdAlvo: alvo });
}

/** "Não é esse assunto que eu preciso hoje" — troca/remove tópicos da missão. */
export async function ajustarTopicosMissaoAction(
  missaoId: string,
  topicIds: string[],
): Promise<ResultadoMissao> {
  const { supabase, user, missao, erro } = await carregarMissaoDoAluno(missaoId);
  if (erro || !missao || !user) return { error: erro };

  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    return { error: "Escolha pelo menos um tópico." };
  }
  return remontarMissao(supabase, user.id, missao, { topicIds });
}

/** "Hoje não vai dar" — empurra a missão pro próximo dia de estudo.
 *
 *  A linha CONTINUA com `data` = hoje (é o que segura o índice único do dia e
 *  impede o motor de regerar a mesma missão na próxima carga da home); quem
 *  diz que ela não é mais pendência é `adiada_para`. No dia apontado, o motor
 *  traz a disciplina de volta mesmo fora da grade semanal. */
export async function adiarMissaoAction(
  missaoId: string,
): Promise<{ error: string | null; para?: string }> {
  const { supabase, user, missao, erro } = await carregarMissaoDoAluno(missaoId);
  if (erro || !missao || !user) return { error: erro };

  const { data: profile } = await supabase
    .from("profiles")
    .select("dias_disponiveis")
    .eq("id", user.id)
    .maybeSingle();

  const para = proximoDiaDeEstudo(profile?.dias_disponiveis);

  const { error } = await supabase
    .from("missions")
    .update({ adiada_para: para })
    .eq("id", missao.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao adiar missão:", error);
    return { error: "Não consegui adiar a missão agora." };
  }

  revalidatePath("/dashboard");
  return { error: null, para };
}

/** "Hoje eu quero estudar outra matéria." A missão atual é adiada (não
 *  apagada — `question_attempts.mission_id` aponta pra ela) e uma nova é
 *  gerada pra disciplina escolhida, com o orçamento de tempo do dia. */
export async function trocarDisciplinaDoDiaAction(
  missaoId: string | null,
  novoSubjectId: string,
): Promise<ResultadoMissao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre de novo." };

  const [{ data: profile }, { data: subject }] = await Promise.all([
    supabase.from("profiles").select("dias_disponiveis, tempo_diario_min").eq("id", user.id).maybeSingle(),
    supabase
      .from("subjects")
      .select("*, bosses(id, nome, data_prova, preparo_percentual)")
      .eq("id", novoSubjectId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!subject) return { error: "Disciplina não encontrada." };

  const hojeStr = questlyHojeISO();

  // Já existe missão de hoje pra essa disciplina? Então não há troca a fazer
  // (e o índice único ux_missions_dia recusaria uma segunda).
  const { data: jaExiste } = await supabase
    .from("missions")
    .select("id, adiada_para")
    .eq("user_id", user.id)
    .eq("subject_id", novoSubjectId)
    .eq("data", hojeStr)
    .eq("avulsa", false)
    .maybeSingle();

  if (jaExiste) {
    if (jaExiste.adiada_para) {
      // Voltar pra uma disciplina adiada hoje = desfazer o adiamento.
      const { error } = await supabase
        .from("missions")
        .update({ adiada_para: null })
        .eq("id", jaExiste.id)
        .eq("user_id", user.id);
      if (error) return { error: "Não consegui retomar essa missão." };
      revalidatePath("/dashboard");
      return { error: null };
    }
    return { error: "Você já tem uma missão de hoje nessa disciplina." };
  }

  const nova = await questlyGerarMissaoParaSubject(
    supabase,
    user,
    profile,
    subject,
    profile?.tempo_diario_min || 30,
  );

  if ("semMissaoHoje" in nova) return { error: nova.motivo };

  // Só depois que a nova existe é que a antiga sai do dia — se a geração
  // falhar, o aluno não fica sem missão nenhuma.
  if (missaoId) {
    const para = proximoDiaDeEstudo(profile?.dias_disponiveis);
    await supabase
      .from("missions")
      .update({ adiada_para: para })
      .eq("id", missaoId)
      .eq("user_id", user.id)
      .eq("concluida", false);
  }

  revalidatePath("/dashboard");
  return { error: null };
}

/** Ementa da disciplina da missão, pro aluno escolher outro assunto. Só
 *  tópicos COM questão sorteável aparecem — oferecer um tópico vazio seria
 *  oferecer uma missão que não pode existir. */
export async function carregarTopicosDaMissaoAction(missaoId: string): Promise<TopicoOpcao[]> {
  const { supabase, user, missao } = await carregarMissaoDoAluno(missaoId);
  if (!missao || !user) return [];

  const { data: subject } = await supabase
    .from("subjects")
    .select("materia_id")
    .eq("id", missao.subject_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subject?.materia_id) return [];

  const { data: topicos } = await supabase
    .from("topicos")
    .select("id, nome, ordem")
    .eq("materia_id", subject.materia_id);

  const ids = (topicos || []).map((t) => t.id as string);
  if (ids.length === 0) return [];

  const [contagens, { data: progressos }] = await Promise.all([
    contagemDosTopicos(supabase, ids),
    supabase
      .from("aluno_topico_progresso")
      .select("topico_id, status")
      .eq("user_id", user.id)
      .in("topico_id", ids),
  ]);

  const statusPorTopico = new Map(
    (progressos || []).map((p) => [p.topico_id as string, (p.status as string) || "pendente"]),
  );
  const selecionados = new Set(missao.topic_ids || []);

  return (topicos || [])
    .map((t) => ({
      id: t.id as string,
      nome: t.nome as string,
      ordem: (t.ordem as number | null) ?? null,
      questoes: contagens.get(t.id as string)?.totalRegular ?? 0,
      selecionado: selecionados.has(t.id as string),
      status: statusPorTopico.get(t.id as string) || "pendente",
    }))
    .filter((t) => t.questoes > 0)
    .sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity));
}
