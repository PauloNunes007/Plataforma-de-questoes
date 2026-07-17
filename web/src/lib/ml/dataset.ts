// ============================================================
// Dataset de treino: replay cronológico de `question_attempts`.
//
// A rede prevê P(acerto) ANTES da resposta — então as features de cada
// tentativa precisam ser o estado do aluno NAQUELE momento, não o de
// hoje. Como o BKT é sequencial, dá pra reconstruir isso exatamente:
// varre-se todas as tentativas em ordem cronológica global, mantendo o
// estado (maestria/estabilidade/última revisão por aluno×tópico, taxa
// por questão, taxa por aluno) e evoluindo-o com AS MESMAS funções que
// a produção usa (questlyEvoluirEstadoTopico). Nenhuma feature enxerga
// o futuro — inclusive a taxa global da questão só conta tentativas
// anteriores à corrente (sem vazamento de rótulo).
//
// `montarExemplos` é pura (recebe arrays) — o teste sintético a reusa;
// `montarDatasetDoBanco` é o wrapper que pagina do Supabase e EXIGE um
// cliente service_role (question_attempts é RLS dono-only; treinar
// precisa do histórico de todos — por isso o treino é ação de admin).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  questlyEstadoEfetivo,
  questlyEvoluirEstadoTopico,
  questlyRetencaoDeEstado,
} from "@/lib/questly/motor-aprovacao";
import { montarFeatures, probAcertoBaseline } from "./features";

export type TentativaBruta = {
  user_id: string;
  question_id: string;
  correta: boolean;
  created_at: string;
};

export type QuestaoBruta = {
  id: string;
  topic_id: string | null;
  dificuldade: string | null;
};

export type Exemplo = {
  features: number[];
  rotulo: 0 | 1;
  baseline: number; // P(acerto) que o motor BKT atual daria — o adversário
  timestampMs: number; // pro split temporal treino/validação
};

type EstadoTopico = {
  maestria: number;
  estabilidade: number;
  ultimaRevisao: string | null;
  taxa: number;
  num: number;
};

type EstadoAluno = {
  tentativas: number;
  acertos: number;
  ultimaAtividadeMs: number | null;
  diaAtual: string;
  contagemDia: number;
  questoesVistas: Set<string>;
};

// Encolhimento (shrinkage) pra taxas com pouco volume — 0 tentativas
// devolve null (a feature usa o default neutro 0.5).
function taxaEncolhida(acertos: number, tentativas: number): number | null {
  if (tentativas === 0) return null;
  return (acertos + 2.5) / (tentativas + 5);
}

export function montarExemplos(
  tentativas: TentativaBruta[],
  questoes: QuestaoBruta[],
): Exemplo[] {
  const questaoPorId = new Map(questoes.map((q) => [q.id, q]));
  const ordenadas = [...tentativas].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const topicoEstado = new Map<string, EstadoTopico>();
  const questaoStats = new Map<string, { tentativas: number; acertos: number }>();
  const alunoEstado = new Map<string, EstadoAluno>();
  const exemplos: Exemplo[] = [];

  for (const t of ordenadas) {
    const questao = questaoPorId.get(t.question_id);
    if (!questao?.topic_id) continue; // sem tópico não há estado a acompanhar

    const agoraMs = new Date(t.created_at).getTime();
    const dia = t.created_at.slice(0, 10);

    const chaveTopico = `${t.user_id}|${questao.topic_id}`;
    let estado = topicoEstado.get(chaveTopico);
    if (!estado) {
      const semente = questlyEstadoEfetivo(null); // mesma semente de cold-start da produção
      estado = { ...semente, ultimaRevisao: null, taxa: 0, num: 0 };
      topicoEstado.set(chaveTopico, estado);
    }

    let aluno = alunoEstado.get(t.user_id);
    if (!aluno) {
      aluno = {
        tentativas: 0,
        acertos: 0,
        ultimaAtividadeMs: null,
        diaAtual: dia,
        contagemDia: 0,
        questoesVistas: new Set(),
      };
      alunoEstado.set(t.user_id, aluno);
    }
    if (aluno.diaAtual !== dia) {
      aluno.diaAtual = dia;
      aluno.contagemDia = 0;
    }

    const qs = questaoStats.get(t.question_id) ?? { tentativas: 0, acertos: 0 };

    // ── Features NO MOMENTO da tentativa (antes de evoluir nada) ──
    const retencao = estado.ultimaRevisao
      ? questlyRetencaoDeEstado(estado.estabilidade, estado.ultimaRevisao, agoraMs)
      : 0;
    const features = montarFeatures({
      maestria: estado.maestria,
      retencao,
      numRespondidasTopico: estado.num,
      estabilidade: estado.estabilidade,
      dificuldade: questao.dificuldade,
      jaRespondeuQuestao: aluno.questoesVistas.has(t.question_id),
      taxaGlobalQuestao: taxaEncolhida(qs.acertos, qs.tentativas),
      taxaGeralAluno: taxaEncolhida(aluno.acertos, aluno.tentativas),
      diasSemEstudar:
        aluno.ultimaAtividadeMs == null
          ? null
          : Math.max(0, (agoraMs - aluno.ultimaAtividadeMs) / 86_400_000),
      posicaoNaSessao: aluno.contagemDia + 1,
    });

    exemplos.push({
      features,
      rotulo: t.correta ? 1 : 0,
      baseline: probAcertoBaseline(estado.maestria, retencao),
      timestampMs: agoraMs,
    });

    // ── Evolui o estado com a MESMA função da produção ──
    const evoluido = questlyEvoluirEstadoTopico({
      maestria: estado.maestria,
      estabilidade: estado.estabilidade,
      ultimaRevisao: estado.ultimaRevisao,
      taxaAnterior: estado.taxa,
      numAnterior: estado.num,
      acertou: t.correta,
      agoraMs,
    });
    estado.maestria = evoluido.maestria;
    estado.estabilidade = evoluido.estabilidade;
    estado.taxa = (estado.taxa * estado.num + (t.correta ? 1 : 0)) / (estado.num + 1);
    estado.num += 1;
    estado.ultimaRevisao = t.created_at;

    qs.tentativas += 1;
    if (t.correta) qs.acertos += 1;
    questaoStats.set(t.question_id, qs);

    aluno.tentativas += 1;
    if (t.correta) aluno.acertos += 1;
    aluno.ultimaAtividadeMs = agoraMs;
    aluno.contagemDia += 1;
    aluno.questoesVistas.add(t.question_id);
  }

  return exemplos;
}

const PAGINA = 1000;

async function buscarTudo<T>(
  buscarPagina: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await buscarPagina(de, de + PAGINA - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    linhas.push(...data);
    if (data.length < PAGINA) break;
  }
  return linhas;
}

export async function montarDatasetDoBanco(admin: SupabaseClient): Promise<{
  exemplos: Exemplo[];
  totalTentativas: number;
}> {
  const tentativas = await buscarTudo<TentativaBruta>((de, ate) =>
    admin
      .from("question_attempts")
      .select("user_id, question_id, correta, created_at")
      .order("created_at", { ascending: true })
      .range(de, ate),
  );
  const questoes = await buscarTudo<QuestaoBruta>((de, ate) =>
    admin.from("questions").select("id, topic_id, dificuldade").range(de, ate),
  );
  return { exemplos: montarExemplos(tentativas, questoes), totalTentativas: tentativas.length };
}
