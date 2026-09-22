// O que oferecer ao aluno no SEGUNDO seguinte ao fim de uma lista.
//
// Até aqui, a tela de resultado tinha um CTA primário só: voltar. O aluno
// terminava 10 questões no melhor estado possível — placar na tela, combo
// fresco, tópico recém-mexido — e a única coisa que o produto oferecia era a
// saída. Este módulo existe pra que o fim de uma lista seja um começo.
//
// As três continuações são ranqueadas pelo que a lista que ACABOU revelou, e
// nenhuma delas planeja o dia de ninguém: são portas, não roteiro. Quem não
// quiser nenhuma continua tendo o botão de voltar, no mesmo lugar de sempre.
//
// Sem "use server": é chamado POR Server Actions (lib/questao/actions.ts) e
// não é pra virar endpoint.
import type { SupabaseClient } from "@supabase/supabase-js";
import { contagemDasMaterias } from "@/lib/questly/contagem-questoes";
import { classificarEstado, type ProgressoRow } from "@/lib/trilha/trilha-data";
import {
  questlyMarcoBloqueadoPeloPlano,
  questlyProximoMarco,
} from "@/lib/questly/marcos";

/** Tamanho de uma continuação "mais do mesmo". O piso evita a lista de 1
 *  questão (um recap de 3 não deve gerar continuação de 3); o teto mantém a
 *  continuação curta — ela é um convite, não um turno inteiro. */
const CONTINUAR_MIN = 5;
const CONTINUAR_MAX = 20;
const CONTINUAR_PADRAO = 10;

export function tamanhoDaContinuacao(qtdAnterior: number | null | undefined): number {
  const base = qtdAnterior && qtdAnterior > 0 ? qtdAnterior : CONTINUAR_PADRAO;
  return Math.min(CONTINUAR_MAX, Math.max(CONTINUAR_MIN, base));
}

export type Continuacoes = {
  /** "Mais 10 de Cálculo II" — mesmos assuntos, um toque. */
  mais: { quantidade: number; disciplina: string | null } | null;
  /** Quantas questões desta lista foram erradas. 0 = não oferece refazer. */
  erros: number;
  /** O próximo assunto pendente da ementa, quando a lista tinha disciplina.
   *  `subjectId` viaja junto porque a ação que monta a lista precisa dele pra
   *  reconferir que o tópico é mesmo dessa disciplina. */
  proximoTopico: { subjectId: string; topicoId: string; nome: string } | null;
  /** O empurrão do marco do dia: "faltam 5 pro marco de 25". */
  marco: { faltam: number; titulo: string } | null;
  /** Existe marco acima do teto do plano — o gancho honesto de Pro. */
  marcoBloqueado: { titulo: string; questoes: number } | null;
};

export const CONTINUACOES_VAZIAS: Continuacoes = {
  mais: null,
  erros: 0,
  proximoTopico: null,
  marco: null,
  marcoBloqueado: null,
};

type MissaoEncerrada = {
  id: string;
  subject_id: string | null;
  topic_ids: string[] | null;
  qtd_questoes: number | null;
};

/**
 * O próximo assunto da ementa depois do que o aluno acabou de praticar.
 *
 * Usa a MESMA definição de "pendente" que desenha a trilha
 * (`classificarEstado`) — duas versões da regra e este botão começaria a
 * discordar do mapa que o aluno vê em /trilha. Exclui os tópicos da lista que
 * acabou: apontar de volta pro assunto recém-praticado não é "próximo".
 *
 * Oferecer o próximo capítulo não é planejar o dia: o aluno continua livre pra
 * ignorar, e nada aqui decide por ele o que estudar amanhã.
 */
async function acharProximoTopico(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  topicosJaFeitos: string[],
): Promise<{ subjectId: string; topicoId: string; nome: string } | null> {
  const { data: subject } = await supabase
    .from("subjects")
    .select("materia_id")
    .eq("id", subjectId)
    .eq("user_id", userId)
    .maybeSingle();
  const materiaId = subject?.materia_id as string | undefined;
  if (!materiaId) return null;

  const { data: topicos } = await supabase
    .from("topicos")
    .select("id, nome, ordem")
    .eq("materia_id", materiaId);
  if (!topicos || topicos.length === 0) return null;

  const [{ data: progressos }, contagens] = await Promise.all([
    supabase
      .from("aluno_topico_progresso")
      .select("topico_id, status, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", userId)
      .in(
        "topico_id",
        topicos.map((t) => t.id as string),
      ),
    contagemDasMaterias(supabase, [materiaId]),
  ]);

  const progressoPorTopico = new Map<string, ProgressoRow>(
    (progressos || []).map((p) => [p.topico_id as string, p as ProgressoRow]),
  );
  const regularesPorTopico = new Map(
    contagens.map((c) => [c.topicId, c.totalRegular]),
  );
  const jaFeitos = new Set(topicosJaFeitos);

  // Sem `ordem` vai pro fim, como em toda a ementa do app (um tópico órfão não
  // pode se passar pelo começo do conteúdo).
  const ordenados = [...topicos].sort(
    (a, b) =>
      ((a.ordem as number | null) ?? 9999) - ((b.ordem as number | null) ?? 9999),
  );

  for (const t of ordenados) {
    const id = t.id as string;
    if (jaFeitos.has(id)) continue;
    const regulares = regularesPorTopico.get(id) || 0;
    if (regulares === 0) continue; // tópico sem questão não é oferta
    const estado = classificarEstado(progressoPorTopico.get(id), true);
    if (estado === "pendente")
      return { subjectId, topicoId: id, nome: (t.nome as string) || "Próximo assunto" };
  }
  return null;
}

/**
 * Monta as continuações da tela de resultado.
 *
 * Roda no fechamento da lista e viaja junto do placar, em vez de virar uma
 * chamada nova quando a tela monta: a tela de resultado é o fim de uma onda,
 * não o começo de outra (ver a regra das "ondas" no CLAUDE.md de web/).
 *
 * `erros` vem do placar recomputado no servidor, nunca da contagem do cliente.
 */
export async function calcularContinuacoes(
  supabase: SupabaseClient,
  userId: string,
  missao: MissaoEncerrada,
  erros: number,
  questoesHoje: number,
  tetoDoDia: number | null,
  disciplinaNome: string | null,
): Promise<Continuacoes> {
  const topicIds = (Array.isArray(missao.topic_ids) ? missao.topic_ids : []) as string[];

  const proximoTopico = missao.subject_id
    ? await acharProximoTopico(supabase, userId, missao.subject_id, topicIds)
    : null;

  const proximoMarco = questlyProximoMarco(questoesHoje, tetoDoDia);
  const bloqueado = questlyMarcoBloqueadoPeloPlano(questoesHoje, tetoDoDia);

  return {
    mais:
      topicIds.length > 0
        ? {
            quantidade: tamanhoDaContinuacao(missao.qtd_questoes),
            disciplina: disciplinaNome,
          }
        : null,
    erros,
    proximoTopico,
    marco: proximoMarco
      ? { faltam: proximoMarco.questoes - questoesHoje, titulo: proximoMarco.titulo }
      : null,
    marcoBloqueado: bloqueado
      ? { titulo: bloqueado.titulo, questoes: bloqueado.questoes }
      : null,
  };
}
