// ===========================================================================
// PERFIL DA BANCA — o retrato estatístico de como uma prova CAI.
//
// A tese: uma prova real é uma AMOSTRA da distribuição geradora de um
// professor. O acervo já guarda 31 provas remontadas (questions.prova_codigo,
// vw_provas_oficiais, supabase_provas_oficiais.sql), e sete delas são a MESMA
// P1 de Física 2 da UFF em semestres diferentes. Com sete amostras dá pra
// dizer como aquela prova é — e dizer com número, não com impressão.
//
// Módulo PURO (sem Supabase), na convenção de `motor-aprovacao.ts`: todo
// parâmetro calibrável é constante exportada no topo, e a função devolve
// `null` quando a amostra não sustenta a afirmação — a mesma disciplina de
// `questlyCalcularMetricas`, que se recusa a inventar porcentagem em vez de
// devolver um número baixo.
//
// O que este módulo NÃO faz, de propósito: recomendar o que estudar. Ele
// descreve a BANCA, nunca o aluno. A plataforma parou de planejar em
// 2026-09-16 e isto não reabre a porta.
// ===========================================================================
import { lerCodigoProva, type CodigoProva } from "../simulados/provas-oficiais";

// ---------------------------------------------------------------------------
// Calibragem
// ---------------------------------------------------------------------------

/** Abaixo disto o perfil não existe (devolve null). Com duas edições, "caiu nas
 *  duas" é coincidência com nome de estatística. */
export const BANCA_MIN_EDICOES = 3;

/** Meia-vida do peso de uma edição, em SEMESTRES. Uma prova de 3 semestres
 *  atrás vale metade da última. Existe porque o acervo mostra a banca mudando:
 *  na P1 de Física 2, "Potencial Elétrico" tinha 4 questões em 2022.1 e sumiu
 *  das edições seguintes — uma média simples continuaria prevendo Potencial
 *  por anos depois de o professor ter parado de cobrar. */
export const BANCA_MEIA_VIDA_SEMESTRES = 3;

/** A partir daqui a amostra é grande o bastante pra chamar de confiança alta. */
export const BANCA_EDICOES_CONFIANCA_ALTA = 6;

/** Coeficiente de variação do TAMANHO da prova acima do qual a confiança cai um
 *  degrau: se o professor aplica ora 10, ora 20 questões (o caso de Física 1 no
 *  acervo), prever "15" é média de coisas diferentes. */
export const BANCA_CV_TAMANHO_INSTAVEL = 0.15;

// ---------------------------------------------------------------------------
// Entrada / saída
// ---------------------------------------------------------------------------

/** Uma questão de prova oficial. É o recorte mínimo que o perfil usa — em
 *  produção vem de `questions` (prova_codigo + topic_id -> topicos.nome); no
 *  script de verificação vem dos JSONs de `listas_questoes/gerado/`. */
export type QuestaoDeProva = {
  /** questions.prova_codigo, ex.: "fis2-uff-2023.1-p1" */
  provaCodigo: string;
  /** nome do tópico da ementa (a chave de agregação do perfil) */
  topico: string;
  dificuldade?: string | null;
  subtopico?: string | null;
};

export type EdicaoProva = CodigoProva & {
  codigo: string;
  questoes: number;
  /** ano*2 + (semestre-1) — a régua linear que mede distância em semestres */
  periodo: number;
  peso: number;
};

export type LinhaTopicoBanca = {
  topico: string;
  /** em quantas edições este tópico apareceu */
  edicoes: number;
  /** edicoes / totalEdicoes (0..1) — "caiu em 7 de 7" */
  frequencia: number;
  /** média simples de questões por edição (inclui as edições com zero) */
  media: number;
  /** média ponderada por recência — é ela que vira previsão */
  mediaPonderada: number;
  minimo: number;
  maximo: number;
  /** quantas questões deste tópico a PRÓXIMA edição deve trazer (inteiro) */
  previstas: number;
};

export type ConfiancaBanca = "alta" | "media" | "baixa";

export type PerfilBanca = {
  /** chave do slot: "fis2-uff-p1" — curso, sigla e qual prova do semestre */
  chave: string;
  curso: string;
  sigla: string;
  /** "P1" | "P2" | "P3" */
  prova: string;
  edicoes: EdicaoProva[];
  totalEdicoes: number;
  /** tamanho previsto da próxima edição (ponderado por recência) */
  tamanhoPrevisto: number;
  topicos: LinhaTopicoBanca[];
  /** fração de cada rótulo de dificuldade, ponderada por recência (0..1) */
  dificuldade: Record<string, number>;
  /** tópicos da ementa que o acervo NUNCA viu cair neste slot. Só vem
   *  preenchido quando quem chama passa a ementa. */
  topicosAusentes: string[];
  confianca: ConfiancaBanca;
};

export type OpcoesPerfil = {
  minEdicoes?: number;
  meiaVidaSemestres?: number;
  /** nomes dos tópicos da ementa da matéria, pra calcular `topicosAusentes` */
  topicosDaEmenta?: readonly string[];
};

// ---------------------------------------------------------------------------
// Peças puras
// ---------------------------------------------------------------------------

/** Régua linear de tempo acadêmico: 2023.2 e 2024.1 são semestres VIZINHOS, e
 *  subtrair os anos diria que distam zero. */
export function periodoDe(ano: number, semestre: number): number {
  return ano * 2 + (semestre - 1);
}

/** Peso de uma edição pela distância até a mais recente (decaimento
 *  exponencial com meia-vida em semestres). A edição mais nova sempre pesa 1. */
export function pesoRecencia(
  periodo: number,
  periodoMaisRecente: number,
  meiaVidaSemestres: number = BANCA_MEIA_VIDA_SEMESTRES,
): number {
  const distancia = Math.max(0, periodoMaisRecente - periodo);
  const meiaVida = Math.max(0.5, meiaVidaSemestres);
  return Math.pow(0.5, distancia / meiaVida);
}

/** Identidade do SLOT (a "cadeira" que se repete todo semestre): curso, sigla e
 *  qual das provas do período. É o que junta a P1 de 2023.1 com a P1 de 2025.2
 *  e as separa da P2. */
export function chaveDoSlot(c: CodigoProva): string {
  return `${c.curso}-${c.sigla.toLowerCase()}-${c.prova.toLowerCase()}`;
}

/**
 * Alocação por MAIOR RESTO (Hamilton) — a mesma família de repartição que o
 * app legado já usava pra dividir minutos entre disciplinas.
 *
 * Existe porque a previsão precisa fechar: se o perfil diz que a prova tem 15
 * questões, a soma das previsões por tópico tem que ser 15. Arredondar cada
 * média separadamente dá 16 ou 14, e aí a tela mostra uma prova que não fecha.
 *
 * Desempate explícito (maior resto -> maior peso -> menor índice) porque uma
 * previsão que muda de ordem a cada recarga é a mesma classe de bug que
 * `supabase_ranking_fiel.sql` gastou uma migração consertando.
 */
export function distribuirPorMaiorResto(pesos: readonly number[], total: number): number[] {
  const n = pesos.length;
  if (n === 0 || total <= 0) return new Array(n).fill(0);
  const limpos = pesos.map((p) => (Number.isFinite(p) && p > 0 ? p : 0));
  const soma = limpos.reduce((a, b) => a + b, 0);
  if (soma <= 0) return new Array(n).fill(0);

  const exatos = limpos.map((p) => (p / soma) * total);
  const base = exatos.map((x) => Math.floor(x));
  let sobra = total - base.reduce((a, b) => a + b, 0);

  const ordem = exatos
    .map((x, i) => ({ i, resto: x - Math.floor(x), peso: limpos[i] }))
    .sort((a, b) => b.resto - a.resto || b.peso - a.peso || a.i - b.i);

  for (let k = 0; sobra > 0 && k < ordem.length; k++, sobra--) base[ordem[k].i] += 1;
  return base;
}

/** Normaliza o rótulo de dificuldade do banco. Espelha
 *  `normalizarChaveDificuldade` dos simulados; duplicado aqui de propósito pra
 *  este módulo não arrastar o módulo de simulados inteiro — se um mudar de
 *  vocabulário, mude os dois. */
export function chaveDificuldade(v: string | null | undefined): string {
  const s = String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (s.startsWith("fac")) return "facil";
  if (s.startsWith("med")) return "medio";
  if (s.startsWith("dif")) return "dificil";
  return "outra";
}

function coeficienteDeVariacao(valores: readonly number[]): number {
  if (valores.length < 2) return 0;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  if (media <= 0) return 0;
  const variancia =
    valores.reduce((a, v) => a + (v - media) * (v - media), 0) / valores.length;
  return Math.sqrt(variancia) / media;
}

// ---------------------------------------------------------------------------
// O perfil
// ---------------------------------------------------------------------------

type EdicaoBruta = {
  c: CodigoProva;
  total: number;
  porTopico: Map<string, number>;
  porDificuldade: Map<string, number>;
};

/**
 * Monta o perfil de UM slot (todas as questões passadas precisam ser do mesmo
 * curso/sigla/prova — use `perfisPorSlot` pra separar).
 *
 * Devolve `null` quando há menos de `minEdicoes` edições: um perfil com duas
 * provas não é um perfil, e a tela precisa dizer "dado insuficiente" em vez de
 * desenhar uma previsão bonita em cima de nada.
 */
export function montarPerfilBanca(
  questoes: readonly QuestaoDeProva[],
  opcoes: OpcoesPerfil = {},
): PerfilBanca | null {
  const minEdicoes = opcoes.minEdicoes ?? BANCA_MIN_EDICOES;
  const meiaVida = opcoes.meiaVidaSemestres ?? BANCA_MEIA_VIDA_SEMESTRES;

  // 1. Agrupa por edição, descartando o que não tem código de prova válido.
  const brutas = new Map<string, EdicaoBruta>();
  for (const q of questoes) {
    const c = lerCodigoProva(q.provaCodigo);
    if (!c) continue;
    const codigo = String(q.provaCodigo).trim().toLowerCase();
    let b = brutas.get(codigo);
    if (!b) {
      b = { c, total: 0, porTopico: new Map(), porDificuldade: new Map() };
      brutas.set(codigo, b);
    }
    b.total += 1;
    const topico = String(q.topico || "").trim();
    if (topico) b.porTopico.set(topico, (b.porTopico.get(topico) || 0) + 1);
    const d = chaveDificuldade(q.dificuldade);
    b.porDificuldade.set(d, (b.porDificuldade.get(d) || 0) + 1);
  }
  if (brutas.size < minEdicoes) return null;

  const primeira = [...brutas.values()][0].c;
  const periodoMaisRecente = Math.max(
    ...[...brutas.values()].map((b) => periodoDe(b.c.ano, b.c.semestre)),
  );

  const edicoes: EdicaoProva[] = [...brutas.entries()]
    .map(([codigo, b]) => {
      const periodo = periodoDe(b.c.ano, b.c.semestre);
      return {
        ...b.c,
        codigo,
        questoes: b.total,
        periodo,
        peso: pesoRecencia(periodo, periodoMaisRecente, meiaVida),
      };
    })
    .sort((a, b) => a.periodo - b.periodo);

  const somaPesos = edicoes.reduce((a, e) => a + e.peso, 0);

  // 2. Tamanho previsto da próxima edição — média PONDERADA dos tamanhos.
  const tamanhoPrevisto = Math.max(
    1,
    Math.round(edicoes.reduce((a, e) => a + e.questoes * e.peso, 0) / somaPesos),
  );

  // 3. Por tópico. A média inclui as edições em que o tópico NÃO caiu (contam
  //    como zero) — é o que diferencia "cai sempre com 5" de "caiu 5 uma vez".
  const nomes = new Set<string>();
  for (const b of brutas.values()) for (const t of b.porTopico.keys()) nomes.add(t);

  const linhas: LinhaTopicoBanca[] = [...nomes].map((topico) => {
    let soma = 0;
    let somaPonderada = 0;
    let edicoesCom = 0;
    let minimo = Number.POSITIVE_INFINITY;
    let maximo = 0;
    for (const e of edicoes) {
      const n = brutas.get(e.codigo)?.porTopico.get(topico) || 0;
      soma += n;
      somaPonderada += n * e.peso;
      if (n > 0) edicoesCom += 1;
      if (n < minimo) minimo = n;
      if (n > maximo) maximo = n;
    }
    return {
      topico,
      edicoes: edicoesCom,
      frequencia: edicoesCom / edicoes.length,
      media: soma / edicoes.length,
      mediaPonderada: somaPonderada / somaPesos,
      minimo: Number.isFinite(minimo) ? minimo : 0,
      maximo,
      previstas: 0,
    };
  });

  const alocadas = distribuirPorMaiorResto(
    linhas.map((l) => l.mediaPonderada),
    tamanhoPrevisto,
  );
  linhas.forEach((l, i) => {
    l.previstas = alocadas[i];
  });
  linhas.sort(
    (a, b) =>
      b.previstas - a.previstas ||
      b.mediaPonderada - a.mediaPonderada ||
      a.topico.localeCompare(b.topico),
  );

  // 4. Mix de dificuldade, ponderado pela mesma recência.
  const dificuldade: Record<string, number> = {};
  let totalDificuldade = 0;
  for (const e of edicoes) {
    const porDif = brutas.get(e.codigo)?.porDificuldade;
    if (!porDif) continue;
    for (const [d, n] of porDif) {
      dificuldade[d] = (dificuldade[d] || 0) + n * e.peso;
      totalDificuldade += n * e.peso;
    }
  }
  if (totalDificuldade > 0) {
    for (const d of Object.keys(dificuldade)) dificuldade[d] /= totalDificuldade;
  }

  // 5. Confiança. Duas coisas a derrubam: poucas edições e prova de tamanho
  //    instável (professor que ora aplica 10, ora 20 questões — o caso de
  //    Física 1 no acervo). Prometer precisão ali seria média de coisas
  //    diferentes com cara de previsão.
  const cv = coeficienteDeVariacao(edicoes.map((e) => e.questoes));
  let confianca: ConfiancaBanca =
    edicoes.length >= BANCA_EDICOES_CONFIANCA_ALTA
      ? "alta"
      : edicoes.length >= minEdicoes + 1
        ? "media"
        : "baixa";
  if (cv > BANCA_CV_TAMANHO_INSTAVEL) {
    confianca = confianca === "alta" ? "media" : "baixa";
  }

  const vistos = new Set(nomes);
  const topicosAusentes = (opcoes.topicosDaEmenta ?? []).filter((t) => !vistos.has(t));

  return {
    chave: chaveDoSlot(primeira),
    curso: primeira.curso,
    sigla: primeira.sigla,
    prova: primeira.prova,
    edicoes,
    totalEdicoes: edicoes.length,
    tamanhoPrevisto,
    topicos: linhas,
    dificuldade,
    topicosAusentes,
    confianca,
  };
}

/** Separa um acervo inteiro por slot (P1/P2/P3 de cada curso) e monta o perfil
 *  de cada um. Slots sem amostra suficiente simplesmente não aparecem — a
 *  ausência é a resposta honesta, não um perfil vazio. */
export function perfisPorSlot(
  questoes: readonly QuestaoDeProva[],
  opcoes: OpcoesPerfil = {},
): PerfilBanca[] {
  const porSlot = new Map<string, QuestaoDeProva[]>();
  for (const q of questoes) {
    const c = lerCodigoProva(q.provaCodigo);
    if (!c) continue;
    const k = chaveDoSlot(c);
    const lista = porSlot.get(k);
    if (lista) lista.push(q);
    else porSlot.set(k, [q]);
  }
  const saida: PerfilBanca[] = [];
  for (const lista of porSlot.values()) {
    const p = montarPerfilBanca(lista, opcoes);
    if (p) saida.push(p);
  }
  return saida.sort((a, b) => a.chave.localeCompare(b.chave));
}

/**
 * A frase que a tela usa: "~6 de A Lei de Gauss, ~5 de O Campo Elétrico e ~3 de
 * A Lei de Coulomb". Só entra tópico com previsão >= 1 — listar "0 questões de
 * Capacitores" é ruído, e a linha completa continua disponível na tabela.
 */
export function frasePerfil(perfil: PerfilBanca, maximo = 4): string {
  const partes = perfil.topicos
    .filter((t) => t.previstas > 0)
    .slice(0, maximo)
    .map((t) => `~${t.previstas} de ${t.topico}`);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}
