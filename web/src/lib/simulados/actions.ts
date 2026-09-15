"use server";

import { createClient } from "@/lib/supabase/server";
import { lerPaginado } from "@/lib/supabase/paginado";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { ehPro } from "@/lib/plano/plano";
import { instituicoesDoAluno } from "./simulados-data";
import { iniciarPraticaLivreAction } from "@/lib/disciplinas/actions";
import { nomeExibicaoInstituicao } from "@/lib/cursos/instituicao";
import {
  SIMULADO_FREE_LIMITE_SEMANA,
  clampQuantidade,
  ehDuracaoValida,
  ehEstrategiaValida,
  ehOrdemValida,
  normalizarChaveDificuldade,
  notaSimulado,
  rotuloDuracao,
  type EstrategiaSimulado,
  type OrdemSimulado,
} from "./constantes";

export type MontarSimuladoInput = {
  /** tópicos escolhidos — TODOS de uma disciplina só (ver `misturado` abaixo) */
  topicIds: string[];
  duracaoMin: number;
  quantidade: number;
  /** vazio = todas as dificuldades */
  dificuldades?: string[];
  /** vazio = todos os anos catalogados */
  anos?: number[];
  /** como sortear dentro do recorte (ver ESTRATEGIAS_SIMULADO) */
  estrategia?: EstrategiaSimulado;
  /** ordem de aplicação das questões na prova */
  ordem?: OrdemSimulado;
};

export type MontarSimuladoResultado =
  | { ok: true; id: string }
  | { ok: false; erro: "limite" | "sem_instituicao" | "sem_questoes" | "misturado" | "invalido" };

type Candidata = { id: string; ano: number | null; dificuldade: string | null; topic_id: string | null };

const PESO_DIFICULDADE: Record<string, number> = { facil: 0, medio: 1, dificil: 2, outra: 1 };

/**
 * Sorteio dentro do recorte já filtrado. A estratégia muda QUAIS questões
 * entram, nunca de onde elas saem (instituição e tópicos continuam sendo
 * derivados no servidor).
 *
 *  - `fracos`: reparte a prova entre os tópicos proporcionalmente a
 *    (1 − aproveitamento do aluno), pelo método do maior resto — o tópico onde
 *    ele vai a 30% ganha mais questões que o de 90%, sem nenhum sumir;
 *  - `recentes`: percorre os anos do mais novo pro mais velho, embaralhando
 *    dentro de cada ano (ano sem catalogação vai pro fim);
 *  - `aleatoria`: embaralho limpo (o comportamento original).
 */
function sortear(
  pool: Candidata[],
  quantidade: number,
  estrategia: EstrategiaSimulado,
  fraquezaPorTopico: Map<string, number>,
): Candidata[] {
  const alvo = Math.min(quantidade, pool.length);
  if (alvo <= 0) return [];

  if (estrategia === "recentes") {
    const anos = [...new Set(pool.map((q) => q.ano ?? -1))].sort((a, b) => b - a);
    const saida: Candidata[] = [];
    for (const ano of anos) {
      if (saida.length >= alvo) break;
      const doAno = questlyEmbaralhar(pool.filter((q) => (q.ano ?? -1) === ano));
      saida.push(...doAno.slice(0, alvo - saida.length));
    }
    return saida;
  }

  if (estrategia === "fracos") {
    const porTopico = new Map<string, Candidata[]>();
    for (const q of pool) {
      const k = q.topic_id || "sem-topico";
      const lista = porTopico.get(k);
      if (lista) lista.push(q);
      else porTopico.set(k, [q]);
    }

    // peso = fraqueza × disponibilidade (um tópico com 2 questões no banco não
    // pode receber 15 vagas só por ser o mais fraco)
    const linhas = [...porTopico.entries()].map(([topico, questoes]) => ({
      questoes: questlyEmbaralhar(questoes),
      peso: (fraquezaPorTopico.get(topico) ?? 0.5) * Math.min(questoes.length, alvo),
    }));
    const somaPeso = linhas.reduce((s, l) => s + l.peso, 0);
    if (somaPeso <= 0) return questlyEmbaralhar(pool).slice(0, alvo);

    // maior resto (Hamilton) — o mesmo método do rotina-engine
    const exatos = linhas.map((l) => (l.peso / somaPeso) * alvo);
    const cotas = exatos.map((e, i) => Math.min(Math.floor(e), linhas[i].questoes.length));
    let sobra = alvo - cotas.reduce((a, b) => a + b, 0);
    const ordemResto = exatos
      .map((e, i) => ({ i, resto: e - Math.floor(e) }))
      .sort((a, b) => b.resto - a.resto);
    let voltas = 0;
    while (sobra > 0 && voltas < linhas.length + 1) {
      let mudou = false;
      for (const { i } of ordemResto) {
        if (sobra === 0) break;
        if (cotas[i] < linhas[i].questoes.length) {
          cotas[i] += 1;
          sobra -= 1;
          mudou = true;
        }
      }
      if (!mudou) break;
      voltas += 1;
    }
    return linhas.flatMap((l, i) => l.questoes.slice(0, cotas[i]));
  }

  return questlyEmbaralhar(pool).slice(0, alvo);
}

/**
 * Título do simulado: precisa ser reconhecível numa lista de vinte. Como toda
 * prova é de UMA disciplina, o nome dela é o escopo; a estratégia entra como
 * sufixo quando não é o sorteio comum — é o que diferencia duas provas montadas
 * no mesmo dia sobre o mesmo conteúdo.
 */
function montarTitulo(
  instituicao: string | null,
  materiaNome: string | null,
  estrategia: EstrategiaSimulado,
  duracaoMin: number,
): string {
  const escopo = materiaNome || rotuloDuracao(duracaoMin);
  const sufixo =
    estrategia === "fracos" ? " · pontos fracos" : estrategia === "recentes" ? " · anos recentes" : "";
  return instituicao ? `Simulado ${instituicao} · ${escopo}${sufixo}` : `Simulado · ${escopo}${sufixo}`;
}

// Cria um simulado: valida o plano (free tem limite semanal, Pro é ilimitado),
// deriva a instituição do aluno pelo profile e a DISCIPLINA pelos tópicos
// (ambos AUTORITATIVOS — o cliente não escolhe de que universidade sortear nem
// declara de que matéria a prova é), sorteia questões reais daquela instituição
// no recorte pedido (tópicos + dificuldade + anos, com a estratégia escolhida) e
// fixa a ordem de aplicação no registro.
//
// Regra de produto (2026-09-10): um simulado = UMA disciplina. Misturar matérias
// numa prova só existe no vestibular; na graduação a prova é de uma disciplina,
// e a escolha "quais das minhas matérias entram" era a decisão que mais travava
// o aluno no montador antigo.
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
  const estrategia: EstrategiaSimulado = ehEstrategiaValida(input.estrategia) ? input.estrategia : "aleatoria";
  const ordem: OrdemSimulado = ehOrdemValida(input.ordem) ? input.ordem : "aleatoria";
  const difsPedidas = new Set((input.dificuldades || []).map((d) => normalizarChaveDificuldade(d)));
  const anosPedidos = new Set((input.anos || []).filter((a) => Number.isFinite(a)));

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

  // Disciplina derivada dos próprios tópicos: uma só, sempre.
  const { data: tops } = await supabase
    .from("topicos")
    .select("id, materia_id, materias ( nome )")
    .in("id", input.topicIds);
  const linhasTopico = (tops || []) as unknown as {
    id: string;
    materia_id: string | null;
    materias: { nome: string | null } | null;
  }[];
  const materiaIds = [...new Set(linhasTopico.map((t) => t.materia_id).filter(Boolean))] as string[];
  if (materiaIds.length === 0) return { ok: false, erro: "invalido" };
  if (materiaIds.length > 1) return { ok: false, erro: "misturado" };
  const materiaNome = linhasTopico.find((t) => t.materias?.nome)?.materias?.nome ?? null;

  // O sorteio precisa das LINHAS (são os ids que vão pra prova), então aqui é
  // paginação de verdade, não agregado. O `.limit(5000)` anterior não fazia o
  // que parecia: o teto do PostgREST é 1000 e o .limit só consegue abaixá-lo —
  // uma disciplina grande tinha o fim do conjunto cortado e as mesmas questões
  // eram sorteadas pra todo mundo. Ver lib/supabase/paginado.ts.
  const brutas = await lerPaginado<Candidata>(() =>
    supabase
      .from("questions")
      .select("id, ano, dificuldade, topic_id")
      .in("instituicao", casadas)
      .in("topic_id", input.topicIds)
      // Aprofundamento (questions.desafio) fica fora de sorteio automático:
      // é conteúdo além do nível da prova e o aluno só o encontra quando pede,
      // pelo Banco de Questões. Ver supabase_questao_desafio.sql.
      .eq("desafio", false),
  );

  let pool = brutas;
  if (difsPedidas.size > 0) pool = pool.filter((q) => difsPedidas.has(normalizarChaveDificuldade(q.dificuldade)));
  if (anosPedidos.size > 0) pool = pool.filter((q) => q.ano != null && anosPedidos.has(q.ano));
  if (pool.length === 0) return { ok: false, erro: "sem_questoes" };

  // A fraqueza por tópico só é consultada quando a estratégia usa — uma
  // consulta a menos no caminho comum.
  const fraqueza = new Map<string, number>();
  if (estrategia === "fracos") {
    const { data: prog } = await supabase
      .from("aluno_topico_progresso")
      .select("topico_id, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", user.id)
      .in("topico_id", input.topicIds.slice(0, 1000));
    for (const l of (prog || []) as unknown as {
      topico_id: string;
      taxa_acerto: number | null;
      num_questoes_respondidas: number | null;
    }[]) {
      // sem amostra, peso neutro: não dá pra chamar de fraco o que nunca foi medido
      if ((l.num_questoes_respondidas || 0) < 3) continue;
      fraqueza.set(l.topico_id, Math.max(0.05, 1 - (l.taxa_acerto || 0)));
    }
  }

  const escolhidas = sortear(pool, quantidade, estrategia, fraqueza);
  const aplicadas =
    ordem === "crescente"
      ? [...escolhidas].sort(
          (a, b) =>
            PESO_DIFICULDADE[normalizarChaveDificuldade(a.dificuldade)] - PESO_DIFICULDADE[normalizarChaveDificuldade(b.dificuldade)],
        )
      : questlyEmbaralhar(escolhidas);
  const questionIds = aplicadas.map((q) => q.id);

  const nomeInstituicao = nomeExibicaoInstituicao(casadas);
  const titulo = montarTitulo(nomeInstituicao, materiaNome, estrategia, input.duracaoMin);

  const { data: criado, error } = await supabase
    .from("simulados_aluno")
    .insert({
      user_id: user.id,
      titulo,
      instituicao: nomeInstituicao,
      materia_ids: materiaIds,
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

// Autossalva respostas + tempo por questão enquanto a prova roda (sobrevive a
// refresh / queda de conexão). Só mexe num simulado em andamento do próprio
// aluno. `tempos` é best-effort: se vier vazio, não sobrescreve o que já existe.
export async function salvarRespostasAction(
  id: string,
  respostas: Record<string, string>,
  tempos?: Record<string, number>,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const limpos = sanearTempos(tempos);
  const { error } = await supabase
    .from("simulados_aluno")
    .update(limpos ? { respostas, tempos: limpos } : { respostas })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "em_andamento");

  // Sem supabase_simulados_analytics.sql rodado, `tempos` não existe e o
  // update inteiro falha — o que perderia as RESPOSTAS do aluno, não só a
  // telemetria. Repete sem a coluna: o simulado continua funcionando, só sem
  // o gráfico de ritmo.
  if (error && limpos && ehColunaAusente(error)) {
    await supabase
      .from("simulados_aluno")
      .update({ respostas })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "em_andamento");
  }
}

/** 42703 = undefined_column no Postgres (migração de analytics não rodada). */
function ehColunaAusente(erro: { code?: string; message?: string } | null): boolean {
  return erro?.code === "42703" || Boolean(erro?.message?.includes("tempos"));
}

// O cliente é quem cronometra cada questão (não dá pra medir isso no servidor),
// então o valor é saneado antes de entrar no banco: só número finito e positivo,
// e teto de 4h por questão pra uma aba esquecida aberta não virar um outlier que
// distorce todo o gráfico de ritmo. Nada aqui vale nota — é só telemetria.
const TETO_TEMPO_QUESTAO_SEG = 4 * 60 * 60;

function sanearTempos(tempos?: Record<string, number>): Record<string, number> | null {
  if (!tempos) return null;
  const saida: Record<string, number> = {};
  for (const [k, v] of Object.entries(tempos)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) saida[k] = Math.min(TETO_TEMPO_QUESTAO_SEG, Math.round(n));
  }
  return Object.keys(saida).length > 0 ? saida : null;
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
  tempos?: Record<string, number>,
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

  const limpos = sanearTempos(tempos);
  const base = {
    status: "concluido",
    respostas,
    acertos,
    total,
    nota,
    tempo_gasto_seg: Math.max(0, Math.round(tempoGastoSeg)),
    concluido_em: new Date().toISOString(),
  };

  const aplicar = (patch: Record<string, unknown>) =>
    supabase
      .from("simulados_aluno")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "em_andamento");

  let { error } = await aplicar(limpos ? { ...base, tempos: limpos } : base);
  // Mesma proteção do autossalvamento: sem a migração de analytics, entregar a
  // prova não pode falhar por causa de uma coluna de telemetria.
  if (error && limpos && ehColunaAusente(error)) ({ error } = await aplicar(base));

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

/**
 * "Treinar o que eu errei": transforma os tópicos onde o aluno tropeçou no
 * simulado numa missão avulsa de prática livre — o caminho mais curto entre
 * ver o resultado e fazer alguma coisa com ele.
 *
 * O simulado em si continua self-contained (não paga XP nem move o motor de
 * maestria); quem paga é a PRÁTICA que nasce daqui, e ela é uma missão avulsa
 * comum, idêntica à que sai do Banco de Questões — nenhuma regra de economia
 * nova, nenhum caminho novo pra forjar ranking.
 *
 * `subject_id` é resolvido no servidor a partir da matéria dos tópicos: se o
 * aluno cursa a disciplina, a prática fica vinculada a ela; se for uma matéria
 * que ele só descobriu no banco, vai como null (missions.subject_id é nullable
 * exatamente pra isso).
 */
export async function treinarTopicosDoSimuladoAction(input: {
  topicIds: string[];
  quantidade: number;
}): Promise<{ missaoId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null };

  const topicIds = [...new Set((input.topicIds || []).filter(Boolean))].slice(0, 12);
  if (topicIds.length === 0) return { missaoId: null };

  const { data: tops } = await supabase.from("topicos").select("materia_id").in("id", topicIds);
  const materiaIds = [...new Set((tops || []).map((t) => t.materia_id).filter(Boolean))] as string[];

  let subjectId: string | null = null;
  if (materiaIds.length > 0) {
    const { data: subj } = await supabase
      .from("subjects")
      .select("id")
      .eq("user_id", user.id)
      .in("materia_id", materiaIds)
      .limit(1)
      .maybeSingle();
    subjectId = subj?.id ?? null;
  }

  return iniciarPraticaLivreAction({
    subjectId,
    topicIds,
    dificuldades: [],
    quantidade: Math.max(1, Math.min(30, Math.round(Number(input.quantidade) || 10))),
  });
}
