"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { contagemDasMaterias } from "@/lib/questly/contagem-questoes";
import { criarListaDeQuestoes, questoesQueCabem, SEG_PADRAO_QUESTAO } from "@/lib/questly/criar-lista";
import type { TipoItemAgenda } from "./tarefas-data";

// CRUD simples e owner-scoped dos itens da agenda — sem lógica derivada (ao
// contrário da trilha), então o componente cliente atualiza o próprio estado
// local depois de um "ok: true", e é por isso que a TELA de quem fez a
// alteração continua certa sem refetch.
//
// O que faltava (2026-09-18) era a OUTRA tela: home e calendário mostram os
// mesmos itens, e quem marca uma tarefa na home e vai pro calendário chega
// numa cópia guardada no cache de rota do cliente, com a tarefa ainda aberta.
// Com `staleTimes.dynamic` em 30s isso durava pouco; agora são 180s
// (next.config.ts), então `marcarAgendaSuja` invalida as duas de uma vez.
// Barato: invalidar não busca nada, só marca como vencido.
//
// Agendar um bloco NÃO gera missão, XP nem ofensiva: é o plano do aluno, e
// misturar plano com conquista abriria caminho pra inflar o ranking marcando
// sessões que nunca aconteceram.

/** As duas telas que desenham os itens da agenda. Toda escrita aqui passa por
 *  isto — inclusive a que falha no meio, porque o estado do banco depois de um
 *  erro parcial é justamente o que não se pode continuar servindo de cache. */
function marcarAgendaSuja() {
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
}

/** Só aceita "HH:MM" (o que o <input type="time"> emite); o resto vira null. */
function horaValida(hora: string | null | undefined): string | null {
  if (!hora) return null;
  return /^\d{2}:\d{2}$/.test(hora) ? hora : null;
}

/** Espelha o CHECK do banco (1..600) pra devolver erro amigável antes do 400. */
function duracaoValida(min: number | null | undefined): number | null {
  if (min == null || !Number.isFinite(min)) return null;
  const n = Math.round(min);
  return n > 0 && n <= 600 ? n : null;
}

/** Teto de assuntos num bloco. Não é regra de negócio, é sanidade: o campo
 *  vira querystring no sorteio (ver lib/supabase/paginado.ts) e ninguém marca
 *  um bloco com 200 assuntos. */
const MAX_TOPICOS_BLOCO = 60;

/** Só uuid, sem repetição, com teto. O array vem do cliente e vira filtro de
 *  query; lixo aqui é lixo no `.in()`. */
function topicosValidos(ids: string[] | null | undefined): string[] {
  if (!Array.isArray(ids)) return [];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return Array.from(new Set(ids.filter((id) => typeof id === "string" && uuid.test(id)))).slice(
    0,
    MAX_TOPICOS_BLOCO,
  );
}

/** Espelha o CHECK de `meta_questoes` (1..500) — ver supabase_agenda_consolidado.sql. */
function metaValida(qtd: number | null | undefined): number | null {
  if (qtd == null || !Number.isFinite(qtd)) return null;
  const n = Math.round(qtd);
  return n > 0 && n <= 500 ? n : null;
}

export type NovoItemAgenda = {
  nome: string;
  descricao: string | null;
  subjectId: string | null;
  data: string;
  tipo?: TipoItemAgenda;
  hora?: string | null;
  duracaoMin?: number | null;
  metaQuestoes?: number | null;
  /** Os assuntos do bloco de estudo. Ignorado em tarefa solta. */
  topicoIds?: string[];
};

export async function criarTarefaAction(
  input: NovoItemAgenda,
): Promise<{ ok: boolean; id: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !input.nome.trim()) return { ok: false, id: null };

  // "meta" ainda é aceito pra não quebrar chamada antiga, mas o app só grava
  // "sessao" ou "tarefa": bloco de estudo e afazer solto (ver tarefas-data.ts).
  const tipo: TipoItemAgenda =
    input.tipo === "sessao" || input.tipo === "meta" ? input.tipo : "tarefa";
  const estudo = tipo !== "tarefa";
  const hora = horaValida(input.hora);
  // Hora, duração e alvo de questões só fazem sentido num bloco de estudo —
  // numa tarefa de lista não seriam mostrados em lugar nenhum e só sujariam a
  // linha. O bloco pode ter os três, um ou nenhum: são formas de dizer o
  // tamanho do estudo, não tipos diferentes de marcação.
  const duracao = estudo ? duracaoValida(input.duracaoMin) : null;
  const meta = estudo ? metaValida(input.metaQuestoes) : null;
  // Os assuntos são O QUE o bloco vai estudar. Aceita vazio (o formulário é
  // que exige pelo menos um) pra não quebrar uma chamada antiga, e nesse caso
  // o "Começar" cai na disciplina inteira, como era antes.
  const topicos = estudo ? topicosValidos(input.topicoIds) : [];
  // O bloco de estudo é sempre DE uma disciplina: é ela que diz de onde as
  // questões saem quando o aluno clica em "Começar", e é ela que o progresso
  // do dia conta. Sem disciplina, o que ele quer marcar é uma tarefa.
  if (estudo && !input.subjectId) return { ok: false, id: null };

  const { data: criada, error } = await supabase
    .from("tarefas")
    .insert({
      user_id: user.id,
      subject_id: input.subjectId,
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      data: input.data,
      tipo,
      hora: estudo ? hora : null,
      duracao_min: duracao,
      meta_questoes: meta,
      topico_ids: topicos.length > 0 ? topicos : null,
    })
    .select("id")
    .single();

  marcarAgendaSuja();
  if (error || !criada) {
    console.error("Erro ao criar item da agenda:", error);
    return { ok: false, id: null };
  }
  return { ok: true, id: criada.id as string };
}

export async function alternarTarefaAction(id: string, concluida: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("tarefas").update({ concluida }).eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao atualizar tarefa:", error);
  marcarAgendaSuja();
  return { ok: !error };
}

export async function excluirTarefaAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("tarefas").delete().eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao excluir tarefa:", error);
  marcarAgendaSuja();
  return { ok: !error };
}

/**
 * Move um item pra outra data — é o que faz o arrastar-e-soltar da agenda e o
 * botão "adiar pra amanhã" funcionarem sem recriar a linha (recriar perderia
 * o `concluida` e a ordem de criação).
 */
export async function moverTarefaAction(id: string, data: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false };

  const { error } = await supabase.from("tarefas").update({ data }).eq("id", id).eq("user_id", user.id);
  if (error) console.error("Erro ao mover item da agenda:", error);
  marcarAgendaSuja();
  return { ok: !error };
}

// ---------------------------------------------------------------------------
// Do plano pra execução
// ---------------------------------------------------------------------------
// O elo que faltava. Até aqui, marcar "Estudar Cálculo II, quarta, 19h" e
// DE FATO estudar eram duas coisas sem ligação nenhuma: na quarta o aluno
// tinha que ir ao Banco de Questões e remontar na mão a decisão que já tinha
// tomado dias antes — a plataforma sabia do plano e fingia que não.
//
// Esta action é o "Começar" do bloco: ela sorteia as questões da disciplina
// marcada, cria a lista (a mesma linha de `missions` que o Banco cria — não
// existe um segundo tipo de lista) e grava `tarefas.mission_id`, que é o que
// mantém o NOME do bloco no cartão de progresso da home e o que permite
// riscá-lo quando a lista fecha.
//
// Continua valendo que agendar não paga XP nem acende a ofensiva: a missão só
// nasce quando o aluno clica. O que muda é que o clique dele vira UM clique,
// e não seis.
const QTD_PADRAO_BLOCO = 10;
/** Teto pro tamanho DERIVADO da duração. Um alvo digitado pelo aluno é
 *  respeitado como está (o CHECK do banco já o limita em 500); é a conta
 *  automática que não pode transformar "2h de Física" em 48 questões. */
const QTD_MAX_DERIVADA = 30;

export async function iniciarEstudoPlanejadoAction(
  tarefaId: string,
): Promise<{ missaoId: string | null; erro: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null, erro: "Sessão expirada." };

  const { data: item } = await supabase
    .from("tarefas")
    .select("id, tipo, subject_id, duracao_min, meta_questoes, topico_ids, mission_id")
    .eq("id", tarefaId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return { missaoId: null, erro: "Esse item não é seu." };

  // Já começou: devolve a MESMA lista em vez de sortear outra. Sem isso, um
  // duplo clique (ou abrir a home em duas abas) criaria duas listas pro mesmo
  // bloco e o aluno perderia o progresso de vista na que ficou órfã.
  if (item.mission_id) return { missaoId: item.mission_id as string, erro: null };
  if (item.tipo === "tarefa") return { missaoId: null, erro: "Esse item não é um bloco de estudo." };
  if (!item.subject_id) return { missaoId: null, erro: "Esse bloco não tem disciplina." };

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, materia_id")
    .eq("id", item.subject_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!subject?.materia_id) return { missaoId: null, erro: "Disciplina não encontrada." };

  // Todo assunto da matéria que tem questão regular no banco — a base contra a
  // qual a escolha do aluno é validada.
  const daMateria = (await contagemDasMaterias(supabase, [subject.materia_id as string])).filter(
    (t) => t.totalRegular > 0,
  );
  if (daMateria.length === 0) {
    return { missaoId: null, erro: "Ainda não há questões dessa disciplina no banco." };
  }

  // O QUE o bloco vai estudar são os assuntos que o aluno escolheu ao marcá-lo.
  // A interseção com a matéria não é zelo decorativo: o array vem do cliente e
  // vira filtro de `.in()`, então um id de outra disciplina montaria uma lista
  // que não tem nada a ver com o bloco.
  //
  // Bloco SEM assunto é sempre um bloco criado antes de `topico_ids` existir:
  // pra ele vale o comportamento antigo (a disciplina inteira), porque recusar
  // seria quebrar um compromisso que o aluno marcou de boa-fé.
  const escolhidos = new Set((item.topico_ids as string[] | null) ?? []);
  const doBloco = escolhidos.size > 0 ? daMateria.filter((t) => escolhidos.has(t.topicId)) : [];
  const topicos = doBloco.length > 0 ? doBloco : daMateria;
  if (escolhidos.size > 0 && doBloco.length === 0) {
    console.error("Bloco com assuntos que não são da matéria; sorteando a disciplina inteira:", tarefaId);
  }

  const quantidade = tamanhoDoBloco(item.meta_questoes, item.duracao_min, topicos);

  const { missaoId } = await criarListaDeQuestoes(supabase, user.id, {
    subjectId: subject.id as string,
    topicIds: topicos.map((t) => t.topicId),
    dificuldades: [],
    quantidade,
  });
  if (!missaoId) return { missaoId: null, erro: "Não foi possível montar a lista." };

  // O elo. Falhar aqui não invalida a lista — ela existe e funciona; o que se
  // perde é o bloco saber que ela é dele. Por isso o erro é logado e a lista
  // é entregue mesmo assim, em vez de sumir com o trabalho já criado.
  const { error } = await supabase
    .from("tarefas")
    .update({ mission_id: missaoId })
    .eq("id", tarefaId)
    .eq("user_id", user.id);
  if (error) console.error("Erro ao ligar o bloco de estudo à lista:", error);

  // O bloco passou a ter lista: a home precisa mostrar "continuar" em vez de
  // "começar" quando o aluno voltar pra cá.
  marcarAgendaSuja();
  return { missaoId, erro: null };
}

/** O tamanho da lista que o bloco pede, na ordem em que o aluno foi explícito:
 *  o alvo de questões que ele digitou, senão o que cabe na duração marcada,
 *  senão um padrão curto. */
function tamanhoDoBloco(
  metaQuestoes: number | null,
  duracaoMin: number | null,
  topicos: { totalRegular: number; tempoMedioSeg: number | null }[],
): number {
  const meta = metaValida(metaQuestoes);
  if (meta) return meta;
  if (duracaoMin && duracaoMin > 0) {
    // Média ponderada por volume: um assunto com 200 questões pesa mais na
    // média do tempo da disciplina do que um com 6.
    const totalQ = topicos.reduce((a, t) => a + t.totalRegular, 0);
    const somaSeg = topicos.reduce(
      (a, t) => a + (t.tempoMedioSeg ?? SEG_PADRAO_QUESTAO) * t.totalRegular,
      0,
    );
    const media = totalQ > 0 ? somaSeg / totalQ : SEG_PADRAO_QUESTAO;
    return Math.min(QTD_MAX_DERIVADA, questoesQueCabem(duracaoMin, media));
  }
  return QTD_PADRAO_BLOCO;
}
