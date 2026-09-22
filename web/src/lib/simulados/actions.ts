"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { atualizarStreakEDailyLog } from "@/lib/questly/economia";
import { lerPaginado } from "@/lib/supabase/paginado";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { ehPro } from "@/lib/plano/plano";
import { iniciarPraticaLivreAction } from "@/lib/disciplinas/actions";
import { nomeExibicaoInstituicao } from "@/lib/cursos/instituicao";
import { listarInstituicoes } from "@/lib/questly/contagem-questoes";
import {
  duracaoProvaOficial,
  lerCodigoProva,
  tituloProvaOficial,
} from "./provas-oficiais";
import {
  FONTE_AUTORAL,
  ROTULO_AUTORAL,
  idDaFonte,
  repartirEntreFontes,
  rotuloDasFontes,
} from "./fontes";
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
  /** de onde as questões podem sair (ids de fonte). Vazio = todas as fontes. */
  fontes?: string[];
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
  | { ok: false; erro: "limite" | "sem_questoes" | "misturado" | "invalido" };

type Candidata = {
  id: string;
  ano: number | null;
  dificuldade: string | null;
  topic_id: string | null;
  instituicao: string | null;
};

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
function sortearPuro(
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

    // maior resto (Hamilton)
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
 * Sorteio de verdade: o mesmo de `sortearPuro`, com as questões INÉDITAS na
 * frente (pedido do dono, 2026-09-16).
 *
 * A prova sai primeiro do que o aluno nunca respondeu; só quando o inédito
 * acaba é que as já vistas completam o número pedido. Isso é uma PRIORIDADE,
 * não um filtro: quem já resolveu o banco inteiro de um tópico continua
 * conseguindo montar a prova, em vez de receber "sem questões".
 *
 * A estratégia escolhida (fracos/recentes/aleatória) roda dentro de cada
 * camada, então "focar no que eu erro mais" continua valendo — ele só passa a
 * escolher entre as inéditas antes de repetir questão.
 */
function sortear(
  pool: Candidata[],
  quantidade: number,
  estrategia: EstrategiaSimulado,
  fraquezaPorTopico: Map<string, number>,
  jaVistas: Set<string>,
): Candidata[] {
  const alvo = Math.min(quantidade, pool.length);
  if (alvo <= 0) return [];
  if (jaVistas.size === 0) return sortearPuro(pool, alvo, estrategia, fraquezaPorTopico);

  const ineditas = pool.filter((q) => !jaVistas.has(q.id));
  if (ineditas.length === 0) return sortearPuro(pool, alvo, estrategia, fraquezaPorTopico);
  if (ineditas.length >= alvo) return sortearPuro(ineditas, alvo, estrategia, fraquezaPorTopico);

  const vistas = pool.filter((q) => jaVistas.has(q.id));
  const primeiras = sortearPuro(ineditas, alvo, estrategia, fraquezaPorTopico);
  return [
    ...primeiras,
    ...sortearPuro(vistas, alvo - primeiras.length, estrategia, fraquezaPorTopico),
  ];
}

/**
 * Tudo que este aluno já respondeu — as questões das missões (question_attempts)
 * mais as que caíram em simulados anteriores (que não geram attempt, porque um
 * simulado não alimenta o motor de maestria).
 *
 * Lê o histórico DELE, e não os attempts das questões do pool: o histórico de
 * um aluno é um conjunto pequeno e limitado pela própria atividade, enquanto o
 * pool pode ter mil ids e viraria cinco idas ao banco por causa do teto de
 * tamanho de URL (ver lib/supabase/paginado.ts). Falhar aqui não é fatal — o
 * sorteio só perde a preferência por inédito.
 */
async function questoesJaVistas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Set<string>> {
  const vistas = new Set<string>();
  try {
    const attempts = await lerPaginado<{ question_id: string | null }>(
      () => supabase.from("question_attempts").select("question_id").eq("user_id", userId),
      // Teto: além disso a preferência já não muda nada (o aluno viu tudo) e
      // não vale segurar a montagem da prova.
      { ordenarPor: "question_id", maxPaginas: 12 },
    );
    for (const a of attempts) if (a.question_id) vistas.add(a.question_id);

    const { data: simulados } = await supabase
      .from("simulados_aluno")
      .select("question_ids")
      .eq("user_id", userId)
      .order("criado_em", { ascending: false })
      .limit(100);
    for (const s of (simulados || []) as { question_ids: string[] | null }[]) {
      for (const qid of s.question_ids || []) vistas.add(qid);
    }
  } catch (e) {
    console.error("Não foi possível ler o histórico pra priorizar questões inéditas:", e);
  }
  return vistas;
}

/**
 * Título do simulado: precisa ser reconhecível numa lista de vinte. Como toda
 * prova é de UMA disciplina, o nome dela é o escopo; a FONTE ("UFF",
 * "Autorais", "UFF + autorais") entra na frente porque, desde que o aluno pode
 * misturar, duas provas da mesma disciplina no mesmo dia podem ser coisas bem
 * diferentes. A estratégia vira sufixo quando não é o sorteio comum.
 */
function montarTitulo(
  fonte: string | null,
  materiaNome: string | null,
  estrategia: EstrategiaSimulado,
  duracaoMin: number,
): string {
  const escopo = materiaNome || rotuloDuracao(duracaoMin);
  const sufixo =
    estrategia === "fracos" ? " · pontos fracos" : estrategia === "recentes" ? " · anos recentes" : "";
  return fonte ? `Simulado ${fonte} · ${escopo}${sufixo}` : `Simulado · ${escopo}${sufixo}`;
}

// Cria um simulado: valida o plano (free tem limite semanal, Pro é ilimitado),
// deriva a DISCIPLINA pelos tópicos (autoritativo — o cliente não declara de
// que matéria a prova é), resolve as FONTES pedidas contra o que existe de
// verdade no banco, sorteia dentro do recorte (tópicos + dificuldade + anos,
// com a estratégia escolhida) e fixa a ordem de aplicação no registro.
//
// Regra de produto (2026-09-10): um simulado = UMA disciplina. Misturar matérias
// numa prova só existe no vestibular; na graduação a prova é de uma disciplina,
// e a escolha "quais das minhas matérias entram" era a decisão que mais travava
// o aluno no montador antigo.
//
// Regra de produto (2026-09-16): a FONTE é do aluno. Antes a instituição saía
// do profile e quem não estudasse numa universidade catalogada não montava
// simulado nenhum; hoje ele escolhe as provas da própria faculdade, as de
// outra, as autorais ou uma mistura. O que continua autoritativo é a EXISTÊNCIA
// da fonte: os ids pedidos são casados contra `vw_instituicoes` e viram valores
// crus de `questions.instituicao` aqui dentro — o cliente nunca manda um filtro
// de banco, só um id de um conjunto fechado.
/**
 * Gate do plano, AUTORITATIVO no servidor: free monta um simulado por semana
 * (janela = semana da liga), Pro é ilimitado. Vale igual pro montador e pra
 * prova antiga oficial — as duas consomem uma prova da semana, porque as duas
 * são uma prova cronometrada inteira.
 */
async function dentroDoLimiteSemanal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", userId)
    .maybeSingle();
  if (ehPro(perfil)) return true;

  const segunda = questlySegundaDaSemana(new Date());
  const { count } = await supabase
    .from("simulados_aluno")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("criado_em", segunda);
  return (count ?? 0) < SIMULADO_FREE_LIMITE_SEMANA;
}

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

  if (!(await dentroDoLimiteSemanal(supabase, user.id))) return { ok: false, erro: "limite" };

  // Fontes: o id que veio do cliente só vale se existir no banco. Os valores
  // crus de `questions.instituicao` ("UFF", "UFF (1º sem.)"…) são reagrupados
  // aqui, pela MESMA regra do montador, e a fonte autoral é `instituicao null`
  // (mais o rótulo de autoria própria, ver `idDaFonte`). Nenhum id reconhecido
  // = sortear de tudo, que é o padrão permissivo da regra nova.
  const valoresPorFonte = new Map<string, string[]>();
  for (const { instituicao } of await listarInstituicoes(supabase)) {
    const bruto = (instituicao || "").trim();
    if (!bruto) continue;
    const id = idDaFonte(bruto);
    const lista = valoresPorFonte.get(id);
    if (lista) lista.push(bruto);
    else valoresPorFonte.set(id, [bruto]);
  }
  // `vw_instituicoes` não lista a linha nula, então a fonte autoral entra aqui
  // sempre: se o banco não tiver questão autoral, o sorteio devolve vazio e o
  // aluno recebe "sem_questoes" — honesto, sem opção fantasma no meio.
  if (!valoresPorFonte.has(FONTE_AUTORAL)) valoresPorFonte.set(FONTE_AUTORAL, []);

  const pedidas = [...new Set((input.fontes || []).map((f) => String(f)))].filter((f) =>
    valoresPorFonte.has(f),
  );
  const fontesAlvo = pedidas.length > 0 ? pedidas : [...valoresPorFonte.keys()];

  const nomeDaFonte = (id: string): string =>
    id === FONTE_AUTORAL ? ROTULO_AUTORAL : nomeExibicaoInstituicao(valoresPorFonte.get(id) || []) || id;

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
  //
  // Duas leituras no máximo, e não uma por fonte: as instituições cabem num
  // `in` só, e o autoral é um `is null` à parte porque NULL nunca casa num
  // `in` (juntar os dois num `.or()` exigiria escapar vírgula e parêntese dos
  // rótulos do banco — mais frágil que uma segunda ida).
  const valoresPedidos = [...new Set(fontesAlvo.flatMap((f) => valoresPorFonte.get(f) || []))];
  const querAutoral = fontesAlvo.includes(FONTE_AUTORAL);

  const colunas = "id, ano, dificuldade, topic_id, instituicao";
  // Aprofundamento (questions.desafio) fica fora de sorteio automático: é
  // conteúdo além do nível da prova e o aluno só o encontra quando pede, pelo
  // Banco de Questões. Ver supabase_questao_desafio.sql.
  const brutas: Candidata[] = [];
  if (valoresPedidos.length > 0) {
    brutas.push(
      ...(await lerPaginado<Candidata>(() =>
        supabase
          .from("questions")
          .select(colunas)
          .in("instituicao", valoresPedidos)
          .in("topic_id", input.topicIds)
          .eq("desafio", false),
      )),
    );
  }
  if (querAutoral) {
    brutas.push(
      ...(await lerPaginado<Candidata>(() =>
        supabase
          .from("questions")
          .select(colunas)
          .is("instituicao", null)
          .in("topic_id", input.topicIds)
          .eq("desafio", false),
      )),
    );
  }

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

  // Sorteio em duas camadas: primeiro QUANTAS questões cada fonte entrega
  // (parte igual, ver repartirEntreFontes — proporcional devolveria "29
  // autorais e 1 da UFF"), depois QUAIS dentro de cada fonte, pela estratégia
  // que o aluno escolheu. Com uma fonte só, a cota é a prova inteira e o
  // resultado é idêntico ao de antes desta divisão existir.
  const poolPorFonte = new Map<string, Candidata[]>();
  for (const q of pool) {
    const id = idDaFonte(q.instituicao);
    const lista = poolPorFonte.get(id);
    if (lista) lista.push(q);
    else poolPorFonte.set(id, [q]);
  }
  const cotas = repartirEntreFontes(
    new Map([...poolPorFonte].map(([id, lista]) => [id, lista.length])),
    quantidade,
  );
  const jaVistas = await questoesJaVistas(supabase, user.id);
  const escolhidas = [...poolPorFonte.entries()].flatMap(([id, lista]) =>
    sortear(lista, cotas.get(id) ?? 0, estrategia, fraqueza, jaVistas),
  );
  if (escolhidas.length === 0) return { ok: false, erro: "sem_questoes" };

  const aplicadas =
    ordem === "crescente"
      ? [...escolhidas].sort(
          (a, b) =>
            PESO_DIFICULDADE[normalizarChaveDificuldade(a.dificuldade)] - PESO_DIFICULDADE[normalizarChaveDificuldade(b.dificuldade)],
        )
      : questlyEmbaralhar(escolhidas);
  const questionIds = aplicadas.map((q) => q.id);

  // Só as fontes que de fato entregaram questão entram no rótulo — uma fonte
  // pedida que ficou com cota zero não pode aparecer no título de uma prova
  // onde ela não está.
  const contribuicao = new Map<string, number>();
  for (const q of escolhidas) {
    const id = idDaFonte(q.instituicao);
    contribuicao.set(id, (contribuicao.get(id) || 0) + 1);
  }
  const rotuloFonte = rotuloDasFontes(
    [...contribuicao.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => nomeDaFonte(id)),
  );
  const titulo = montarTitulo(rotuloFonte, materiaNome, estrategia, input.duracaoMin);

  const { data: criado, error } = await supabase
    .from("simulados_aluno")
    .insert({
      user_id: user.id,
      titulo,
      instituicao: rotuloFonte,
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

/**
 * Zera o relógio de um simulado que ainda não começou de verdade.
 *
 * Existe por causa do SIMULADO HÍBRIDO: quem escolhe imprimir cai na tela com
 * o cronômetro já correndo e gasta os primeiros minutos indo até a impressora.
 * Cobrar esse tempo da prova é cobrar pelo que não foi prova.
 *
 * As três condições são o que impede isso de virar tempo infinito: o simulado
 * é do próprio aluno, está `em_andamento` e **ainda não tem nenhuma resposta
 * marcada**. Depois da primeira marcação a prova começou e o relógio é o que
 * é. Sem respostas, reiniciar equivale a abandonar e montar outro com as
 * mesmas questões — só que sem perder o que já foi impresso.
 */
export async function reiniciarRelogioSimuladoAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: atual } = await supabase
    .from("simulados_aluno")
    .select("id, respostas, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!atual || atual.status !== "em_andamento") return { ok: false };
  if (Object.keys((atual.respostas as Record<string, string>) || {}).length > 0) return { ok: false };

  const { error } = await supabase
    .from("simulados_aluno")
    .update({ iniciado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "em_andamento");
  return { ok: !error };
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

  // A OFENSIVA ACENDE AQUI — reversão deliberada da regra antiga.
  //
  // Até 2026-09-22 o CLAUDE.md dizia que "simulado, agenda/calendário e vida
  // acadêmica não pagam XP nem acendem ofensiva". As três estavam na mesma
  // frase, mas não são a mesma coisa: marcar uma falta ou agendar um bloco não
  // é estudar (e se acendesse, seria a rota de forja mais barata do banco).
  // Um simulado é estudo — o mais difícil que a plataforma oferece —, e o
  // aluno que passava 90 minutos numa prova cronometrada terminava o dia com a
  // chama apagada.
  //
  // O que NÃO muda: o simulado continua sem pagar XP, fora do ranking e fora
  // do motor de maestria (ver o docblock de treinarTopicosDoSimuladoAction).
  // Acender a ofensiva é registro de presença, não economia.
  //
  // Só no caminho de CONCLUSÃO: abandonarSimuladoAction não acende, senão
  // "começar e sair" viraria atalho. O cliente admin é obrigatório porque as
  // colunas de streak são protegidas (supabase_seguranca_hardening.sql), e a
  // função é idempotente no dia — fechar um simulado e uma lista no mesmo dia
  // não conta duas vezes.
  await atualizarStreakEDailyLog(createAdminClient(), user.id);

  // A home lê a chama e o mapa do mês pelo cache de rota do cliente; sem
  // invalidar, o aluno voltaria do simulado e veria a ofensiva de ontem.
  revalidatePath("/dashboard");

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

// ---------------------------------------------------------------------------
// Provas antigas oficiais (supabase_provas_oficiais.sql)
// ---------------------------------------------------------------------------

export type IniciarProvaResultado =
  | { ok: true; id: string; retomada: boolean }
  | { ok: false; erro: "limite" | "sem_questoes" | "invalido" };

/**
 * Reaplica uma prova REAL: as questões que caíram nela, na ordem em que
 * caíram, com o relógio do formato original.
 *
 * Nada aqui é sorteado — é o oposto do montador. Por isso não há estratégia,
 * nem recorte, nem preferência por questão inédita: mudar qualquer uma dessas
 * coisas deixaria de ser a prova. O cliente manda só o CÓDIGO, que é casado
 * contra `vw_provas_oficiais` antes de virar filtro de banco.
 *
 * Refazer é permitido (treinar a mesma prova de novo é uso legítimo), mas uma
 * prova com o relógio já correndo é RETOMADA em vez de duplicada — senão o
 * aluno que recarrega a página perde o simulado grátis da semana.
 */
export async function iniciarProvaOficialAction(codigo: string): Promise<IniciarProvaResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "invalido" };

  const partes = lerCodigoProva(codigo);
  if (!partes) return { ok: false, erro: "invalido" };

  // Existência autoritativa: o código só vale se a view o conhece.
  const { data: prova } = await supabase
    .from("vw_provas_oficiais")
    .select("codigo, instituicao, materia_id, materia_nome, questoes")
    .eq("codigo", codigo)
    .maybeSingle();
  if (!prova) return { ok: false, erro: "invalido" };

  // Já tem esta prova aberta? Volta pra ela.
  const { data: aberta } = await supabase
    .from("simulados_aluno")
    .select("id")
    .eq("user_id", user.id)
    .eq("prova_codigo", codigo)
    .eq("status", "em_andamento")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (aberta) return { ok: true, id: aberta.id as string, retomada: true };

  if (!(await dentroDoLimiteSemanal(supabase, user.id))) return { ok: false, erro: "limite" };

  const { data: questoes } = await supabase
    .from("questions")
    .select("id, topic_id, prova_ordem")
    .eq("prova_codigo", codigo)
    .order("prova_ordem", { ascending: true });

  const linhas = (questoes || []) as unknown as {
    id: string;
    topic_id: string | null;
    prova_ordem: number | null;
  }[];
  if (linhas.length === 0) return { ok: false, erro: "sem_questoes" };

  const questionIds = linhas.map((q) => q.id);
  const topicoIds = [...new Set(linhas.map((q) => q.topic_id).filter(Boolean))] as string[];
  const duracaoMin = duracaoProvaOficial(questionIds.length);

  const { data: criado, error } = await supabase
    .from("simulados_aluno")
    .insert({
      user_id: user.id,
      titulo: tituloProvaOficial({
        codigo,
        materiaId: prova.materia_id as string,
        materiaNome: (prova.materia_nome as string) || "",
        instituicao: (prova.instituicao as string) ?? null,
        ano: partes.ano,
        semestre: partes.semestre,
        prova: partes.prova,
        sigla: partes.sigla,
        questoes: questionIds.length,
        duracaoMin,
      }),
      instituicao: partes.sigla,
      prova_codigo: codigo,
      materia_ids: prova.materia_id ? [prova.materia_id] : [],
      topico_ids: topicoIds,
      question_ids: questionIds,
      duracao_min: duracaoMin,
      qtd_questoes: questionIds.length,
      status: "em_andamento",
      respostas: {},
    })
    .select("id")
    .single();

  if (error || !criado) {
    console.error("Erro ao iniciar prova oficial:", error);
    return { ok: false, erro: "invalido" };
  }
  return { ok: true, id: criado.id as string, retomada: false };
}

/**
 * Liga/desliga a aparição do resultado no ranking daquela prova.
 *
 * Só mexe em simulado CONCLUÍDO e de prova oficial do próprio aluno: prova
 * sorteada não tem ranking (cada aluno fez um exame diferente — comparar
 * seria inventar uma disputa) e prova em andamento não tem nota pra mostrar.
 * O padrão do banco é `false`; isto aqui é o único caminho que o torna true.
 */
export async function definirVisibilidadeSimuladoAction(
  id: string,
  publico: boolean,
): Promise<{ ok: boolean; publico: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, publico: false };

  const { data, error } = await supabase
    .from("simulados_aluno")
    .update({ publico })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "concluido")
    .not("prova_codigo", "is", null)
    .select("publico")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Erro ao mudar a visibilidade do simulado:", error);
    return { ok: false, publico: false };
  }
  revalidatePath(`/simulados/${id}`);
  return { ok: true, publico: data.publico === true };
}
