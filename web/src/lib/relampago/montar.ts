// RODADA RELÂMPAGO — cinco questões, um clique, ~10 minutos.
//
// Existe pra atacar a barreira de entrada: o aluno que abre o app com pouco
// tempo e nenhuma vontade de decidir (disciplina, assuntos, dificuldade,
// quantidade) hoje fecha a aba. Aqui o app decide, e decide pelo que mais
// rende por minuto, nesta ordem de prioridade:
//   1. ERROS ANTIGOS do Caderno (até 2) — o que o aluno mesmo guardou pra
//      refazer e ainda está em aberto;
//   2. REVISÃO do que a memória está perdendo (até 2) — tópicos abaixo do
//      limiar de retenção (o mesmo diagnóstico do cartão "Revisar hoje");
//   3. INÉDITAS pro resto — dos assuntos ainda não cobertos das disciplinas
//      dele, na ordem da ementa, preferindo questão que ele nunca viu.
// Quando uma fonte não tem o que dar, as outras completam: o total é sempre
// `RELAMPAGO_QTD` (ou o que o banco tiver).
//
// Não é plano nem cobrança (o motor de missões continua removido): é uma
// porta rápida, sempre opcional. Paga XP pela via normal de
// registrarRespostaAction, como qualquer lista — a rodada em si não paga nada.
//
// Sem "use server": chamado por Server Action.
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarListaPorIds } from "@/lib/questly/criar-lista";
import { contagemDasMaterias } from "@/lib/questly/contagem-questoes";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { carregarRevisarHoje } from "@/lib/revisar/revisar-data";
import { emLotes, lerPaginado } from "@/lib/supabase/paginado";

export const RELAMPAGO_QTD = 5;
const MAX_ERROS = 2;
const MAX_REVISAO = 2;
/** Quantos assuntos "ainda não cobertos" entram no sorteio das inéditas. */
const TOPICOS_INEDITAS = 3;
/** Alinhado à cobertura de tópico da trilha: abaixo disso o assunto é novo. */
const COBERTURA_MIN = 5;

type LinhaQuestao = { id: string; topic_id: string };

async function questoesRegularesDosTopicos(
  supabase: SupabaseClient,
  topicIds: string[],
): Promise<LinhaQuestao[]> {
  if (topicIds.length === 0) return [];
  return lerPaginado<LinhaQuestao>(() =>
    supabase.from("questions").select("id, topic_id").in("topic_id", topicIds).eq("desafio", false),
  );
}

export async function montarRodadaRelampago(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ missaoId: string | null }> {
  const escolhidas: string[] = [];
  const jaEscolhida = new Set<string>();
  const adicionar = (ids: string[], limite: number) => {
    let n = 0;
    for (const id of ids) {
      if (n >= limite || escolhidas.length >= RELAMPAGO_QTD) break;
      if (jaEscolhida.has(id)) continue;
      jaEscolhida.add(id);
      escolhidas.push(id);
      n++;
    }
  };

  // 1. Erros guardados e ainda em aberto.
  const { data: caderno } = await supabase
    .from("caderno_erros")
    .select("question_id")
    .eq("user_id", userId)
    .is("resolvido_em", null)
    .limit(50);
  adicionar(
    questlyEmbaralhar((caderno ?? []).map((c) => c.question_id as string)),
    MAX_ERROS,
  );

  // 2. Revisão do que a memória está perdendo — intercalando os tópicos, do
  //    pior pro menos pior, pra a rodada cruzar assuntos em vez de martelar um.
  const revisar = await carregarRevisarHoje(supabase, userId);
  if (revisar && revisar.topicos.length > 0) {
    const doRisco = await questoesRegularesDosTopicos(
      supabase,
      revisar.topicos.map((t) => t.topicoId),
    );
    const porTopico = new Map<string, string[]>();
    for (const q of doRisco) {
      const lista = porTopico.get(q.topic_id) ?? [];
      lista.push(q.id);
      porTopico.set(q.topic_id, lista);
    }
    const listas = revisar.topicos.map((t) => questlyEmbaralhar(porTopico.get(t.topicoId) ?? []));
    const intercalado: string[] = [];
    for (let i = 0; listas.some((l) => i < l.length) && intercalado.length < 12; i++) {
      for (const l of listas) if (i < l.length) intercalado.push(l[i]);
    }
    adicionar(intercalado, MAX_REVISAO);
  }

  // 3. Inéditas (ou o que faltar) dos assuntos ainda não cobertos.
  if (escolhidas.length < RELAMPAGO_QTD) {
    const { data: subjects } = await supabase.from("subjects").select("materia_id").eq("user_id", userId);
    const materiaIds = Array.from(
      new Set((subjects ?? []).map((s) => s.materia_id as string | null).filter((m): m is string => Boolean(m))),
    );
    if (materiaIds.length > 0) {
      const contagens = (await contagemDasMaterias(supabase, materiaIds)).filter((c) => c.totalRegular > 0);
      const { data: progresso } = await supabase
        .from("aluno_topico_progresso")
        .select("topico_id, status, num_questoes_respondidas")
        .eq("user_id", userId);
      const prog = new Map(
        (progresso ?? []).map((p) => [
          p.topico_id as string,
          { status: (p.status as string) || "pendente", n: Number(p.num_questoes_respondidas) || 0 },
        ]),
      );
      const elegiveis = contagens.filter((c) => (prog.get(c.topicId)?.status ?? "pendente") !== "pulado");
      const naoCobertos = elegiveis
        .filter((c) => (prog.get(c.topicId)?.n ?? 0) < COBERTURA_MIN)
        .sort((a, b) => (a.topicoOrdem ?? 9999) - (b.topicoOrdem ?? 9999));
      const alvo = (naoCobertos.length > 0 ? naoCobertos : questlyEmbaralhar(elegiveis)).slice(
        0,
        TOPICOS_INEDITAS,
      );

      const pool = await questoesRegularesDosTopicos(
        supabase,
        alvo.map((c) => c.topicId),
      );
      const poolIds = pool.map((q) => q.id).filter((id) => !jaEscolhida.has(id));
      // Em lotes: o pool de 3 tópicos facilmente passa de 200 ids.
      const tentativas = await emLotes(poolIds, (lote) =>
        supabase.from("question_attempts").select("question_id").eq("user_id", userId).in("question_id", lote),
      );
      const vistas = new Set(tentativas.map((a) => (a as { question_id: string }).question_id));
      const ineditas = questlyEmbaralhar(poolIds.filter((id) => !vistas.has(id)));
      const repetidas = questlyEmbaralhar(poolIds.filter((id) => vistas.has(id)));
      adicionar([...ineditas, ...repetidas], RELAMPAGO_QTD);
    }
  }

  if (escolhidas.length === 0) return { missaoId: null };
  const { missaoId } = await criarListaPorIds(supabase, userId, questlyEmbaralhar(escolhidas));
  return { missaoId };
}
