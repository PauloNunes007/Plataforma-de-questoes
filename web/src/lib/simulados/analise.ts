// Análise pura de simulados (sem Supabase — o caller busca, isto só calcula).
// Alimenta tanto o resultado de UM simulado quanto o desempenho agregado de
// TODOS eles, então tudo aqui trabalha em cima de uma linha por questão
// aplicada (`QuestaoAnalisada`) — a mesma unidade nos dois casos.
//
// Regra de honestidade herdada de chance-aprovacao.ts: nada de número
// fabricado. Grupo com amostra pequena não vira "ponto fraco", tempo ausente
// não vira zero — a UI mostra "sem dado" em vez de inventar.

export type StatusQuestao = "acerto" | "erro" | "branco";

export const DIFICULDADES = ["facil", "medio", "dificil"] as const;
export type Dificuldade = (typeof DIFICULDADES)[number];

export const ROTULO_DIFICULDADE: Record<Dificuldade, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

/** Amostra mínima pra um grupo (matéria/tópico) poder ser chamado de forte ou fraco. */
export const MIN_AMOSTRA_GRUPO = 3;
/** Abaixo disso, um erro cheira a pressa/chute (usado só quando há tempo registrado). */
export const LIMIAR_PRESSA_SEG = 30;
/** Acerto que custou mais que isto × o tempo médio da questão = "custou caro". */
export const FATOR_LENTIDAO = 1.6;
/** Fronteiras de leitura do aproveitamento — mesmas cores de status do app. */
export const PCT_BOM = 70;
export const PCT_ATENCAO = 50;

export type QuestaoAnalisada = {
  id: string;
  /** posição na prova (1-based) — é assim que o aluno se refere à questão */
  numero: number;
  status: StatusQuestao;
  marcada: string | null;
  gabarito: string;
  materiaId: string | null;
  materia: string;
  topicoId: string | null;
  topico: string;
  subtopico: string | null;
  dificuldade: Dificuldade | null;
  ano: number | null;
  /** segundos gastos de fato (null = simulado sem registro de tempo) */
  tempoSeg: number | null;
  /** referência da questão no banco (tempo_medio_seg), quando existe */
  tempoMedioSeg: number | null;
};

export type GrupoDesempenho = {
  chave: string;
  rotulo: string;
  /** contexto do agrupamento (a matéria do tópico, por ex.) */
  sub?: string;
  acertos: number;
  erros: number;
  brancos: number;
  total: number;
  /** aproveitamento 0..100 (acertos / total; branco conta como não-acerto) */
  pct: number;
  /** soma dos tempos conhecidos, em segundos; null se nenhum registro */
  tempoSeg: number | null;
};

export function normalizarDificuldade(v: string | null | undefined): Dificuldade | null {
  if (!v) return null;
  const s = v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (s.startsWith("fac")) return "facil";
  if (s.startsWith("med")) return "medio";
  if (s.startsWith("dif")) return "dificil";
  return null;
}

/** Bom / atenção / crítico conforme o aproveitamento — status, não identidade. */
export function tomDoPct(pct: number): "bom" | "atencao" | "critico" {
  if (pct >= PCT_BOM) return "bom";
  if (pct >= PCT_ATENCAO) return "atencao";
  return "critico";
}

function grupoVazio(chave: string, rotulo: string, sub?: string): GrupoDesempenho {
  return { chave, rotulo, sub, acertos: 0, erros: 0, brancos: 0, total: 0, pct: 0, tempoSeg: null };
}

/**
 * Agrupa questões por uma chave qualquer. `ordem` decide a apresentação:
 * "pior" (pior aproveitamento primeiro — o padrão, porque a pergunta que a tela
 * responde é "onde eu preciso melhorar?") ou "volume".
 */
export function agruparQuestoes(
  questoes: QuestaoAnalisada[],
  chaveDe: (q: QuestaoAnalisada) => { chave: string; rotulo: string; sub?: string } | null,
  ordem: "pior" | "volume" = "pior",
): GrupoDesempenho[] {
  const mapa = new Map<string, GrupoDesempenho>();
  for (const q of questoes) {
    const k = chaveDe(q);
    if (!k) continue;
    let g = mapa.get(k.chave);
    if (!g) {
      g = grupoVazio(k.chave, k.rotulo, k.sub);
      mapa.set(k.chave, g);
    }
    g.total += 1;
    if (q.status === "acerto") g.acertos += 1;
    else if (q.status === "erro") g.erros += 1;
    else g.brancos += 1;
    if (q.tempoSeg != null) g.tempoSeg = (g.tempoSeg ?? 0) + q.tempoSeg;
  }
  const lista = [...mapa.values()];
  for (const g of lista) g.pct = g.total > 0 ? Math.round((g.acertos / g.total) * 100) : 0;
  lista.sort((a, b) =>
    ordem === "volume"
      ? b.total - a.total || a.rotulo.localeCompare(b.rotulo)
      : a.pct - b.pct || b.total - a.total,
  );
  return lista;
}

export function porMateria(questoes: QuestaoAnalisada[], ordem: "pior" | "volume" = "pior") {
  return agruparQuestoes(questoes, (q) => ({ chave: q.materiaId || q.materia, rotulo: q.materia }), ordem);
}

export function porTopico(questoes: QuestaoAnalisada[], ordem: "pior" | "volume" = "pior") {
  return agruparQuestoes(
    questoes,
    (q) => ({ chave: q.topicoId || q.topico, rotulo: q.topico, sub: q.materia }),
    ordem,
  );
}

/** Dificuldade sempre em ordem fácil→difícil (escala ordenada, não ranking). */
export function porDificuldade(questoes: QuestaoAnalisada[]): GrupoDesempenho[] {
  const grupos = agruparQuestoes(questoes, (q) =>
    q.dificuldade ? { chave: q.dificuldade, rotulo: ROTULO_DIFICULDADE[q.dificuldade] } : null,
  );
  const posicao = (k: string) => DIFICULDADES.indexOf(k as Dificuldade);
  return grupos.sort((a, b) => posicao(a.chave) - posicao(b.chave));
}

export type ResumoTempo = {
  /** houve registro de tempo em pelo menos uma questão */
  temDados: boolean;
  totalSeg: number;
  medioSeg: number;
  /** questão mais demorada (número + segundos) */
  maisLenta: { numero: number; seg: number } | null;
  /** erros resolvidos em menos de LIMIAR_PRESSA_SEG — cheiro de chute/pressa */
  errosApressados: number;
  /** acertos que custaram muito mais que a referência da questão */
  acertosCaros: number;
};

export function resumirTempo(questoes: QuestaoAnalisada[]): ResumoTempo {
  const comTempo = questoes.filter((q) => q.tempoSeg != null && q.tempoSeg > 0);
  if (comTempo.length === 0) {
    return { temDados: false, totalSeg: 0, medioSeg: 0, maisLenta: null, errosApressados: 0, acertosCaros: 0 };
  }
  const totalSeg = comTempo.reduce((s, q) => s + (q.tempoSeg || 0), 0);
  const maisLentaQ = comTempo.reduce((a, b) => ((b.tempoSeg || 0) > (a.tempoSeg || 0) ? b : a));
  const errosApressados = comTempo.filter(
    (q) => q.status === "erro" && (q.tempoSeg || 0) < LIMIAR_PRESSA_SEG,
  ).length;
  const acertosCaros = comTempo.filter(
    (q) => q.status === "acerto" && q.tempoMedioSeg != null && (q.tempoSeg || 0) > q.tempoMedioSeg * FATOR_LENTIDAO,
  ).length;
  return {
    temDados: true,
    totalSeg,
    medioSeg: Math.round(totalSeg / comTempo.length),
    maisLenta: { numero: maisLentaQ.numero, seg: Math.round(maisLentaQ.tempoSeg || 0) },
    errosApressados,
    acertosCaros,
  };
}

export type Diagnostico = {
  /** melhor tópico com amostra suficiente */
  forte: GrupoDesempenho | null;
  /** pior tópico com amostra suficiente — é aqui que o estudo rende mais */
  fraco: GrupoDesempenho | null;
  /** tópicos abaixo da linha de atenção (prioridade máxima) */
  criticos: GrupoDesempenho[];
  tempo: ResumoTempo;
  /** frases curtas prontas pra UI (já filtradas: só entra o que tem dado) */
  observacoes: string[];
};

export function diagnosticar(questoes: QuestaoAnalisada[]): Diagnostico {
  const topicos = porTopico(questoes).filter((g) => g.total >= MIN_AMOSTRA_GRUPO);
  const fraco = topicos.length > 0 ? topicos[0] : null;
  const forte = topicos.length > 1 ? topicos[topicos.length - 1] : null;
  const criticos = topicos.filter((g) => g.pct < PCT_ATENCAO);
  const tempo = resumirTempo(questoes);

  const observacoes: string[] = [];
  const brancos = questoes.filter((q) => q.status === "branco").length;
  if (brancos > 0) {
    observacoes.push(
      `${brancos} ${brancos === 1 ? "questão ficou" : "questões ficaram"} em branco — numa prova real elas valem zero igual a um erro, então compensa sempre marcar alguma coisa.`,
    );
  }
  if (tempo.temDados && tempo.errosApressados >= 2) {
    observacoes.push(
      `${tempo.errosApressados} erros saíram em menos de ${LIMIAR_PRESSA_SEG}s. Ler o enunciado inteiro antes de marcar já recupera parte disso.`,
    );
  }
  if (tempo.temDados && tempo.acertosCaros >= 2) {
    observacoes.push(
      `${tempo.acertosCaros} questões você acertou gastando bem mais tempo que a média — é conteúdo que você sabe, mas ainda não automatizou.`,
    );
  }
  if (forte && forte.pct >= PCT_BOM) {
    observacoes.push(
      `${forte.rotulo} está sólido (${forte.acertos}/${forte.total}). Dá pra tirar o pé daí e investir onde dói.`,
    );
  }
  return { forte, fraco, criticos, tempo, observacoes };
}

// ---------------------------------------------------------------------------
// Agregado — a leitura de "todos os simulados que eu já fiz"
// ---------------------------------------------------------------------------

export type SimuladoAnalisado = {
  id: string;
  titulo: string;
  criadoEm: string;
  nota: number;
  acertos: number;
  total: number;
  tempoGastoSeg: number | null;
  duracaoMin: number;
  questoes: QuestaoAnalisada[];
};

export type TendenciaMateria = {
  chave: string;
  rotulo: string;
  /** aproveitamento na metade mais antiga vs. na mais recente */
  antes: number;
  depois: number;
  delta: number;
  total: number;
};

export type DesempenhoGeral = {
  /** do mais antigo pro mais recente (ordem de leitura dos gráficos) */
  simulados: SimuladoAnalisado[];
  questoes: QuestaoAnalisada[];
  totalSimulados: number;
  totalQuestoes: number;
  notaMedia: number;
  melhorNota: number;
  ultimaNota: number | null;
  /** variação da nota entre o primeiro e o último simulado (null com <2) */
  deltaNota: number | null;
  tempoTotalSeg: number;
  materias: GrupoDesempenho[];
  topicos: GrupoDesempenho[];
  dificuldades: GrupoDesempenho[];
  /** tópicos com amostra e aproveitamento suficientes pra virar "domínio" */
  fortes: GrupoDesempenho[];
  /** tópicos onde o estudo rende mais agora */
  aMelhorar: GrupoDesempenho[];
  tendencias: TendenciaMateria[];
  tempo: ResumoTempo;
};

/** Amostra mínima no agregado (dá pra exigir mais que num simulado só). */
export const MIN_AMOSTRA_AGREGADO = 4;

function media(ns: number[]): number {
  if (ns.length === 0) return 0;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

/** `simulados` chega do mais recente pro mais antigo (ordem do histórico). */
export function analisarHistorico(simulados: SimuladoAnalisado[]): DesempenhoGeral {
  const cronologico = [...simulados].reverse();
  const questoes = cronologico.flatMap((s) => s.questoes);
  const notas = cronologico.map((s) => s.nota);

  const materias = porMateria(questoes);
  const topicos = porTopico(questoes);
  const comAmostra = topicos.filter((g) => g.total >= MIN_AMOSTRA_AGREGADO);

  // Tendência por matéria: metade antiga vs. metade recente dos simulados.
  // Só faz sentido com ≥2 simulados e amostra dos dois lados.
  const tendencias: TendenciaMateria[] = [];
  if (cronologico.length >= 2) {
    const corte = Math.floor(cronologico.length / 2);
    const antesQ = cronologico.slice(0, corte).flatMap((s) => s.questoes);
    const depoisQ = cronologico.slice(corte).flatMap((s) => s.questoes);
    const mapaAntes = new Map(porMateria(antesQ).map((g) => [g.chave, g]));
    const mapaDepois = new Map(porMateria(depoisQ).map((g) => [g.chave, g]));
    for (const m of materias) {
      const a = mapaAntes.get(m.chave);
      const d = mapaDepois.get(m.chave);
      if (!a || !d || a.total < MIN_AMOSTRA_GRUPO || d.total < MIN_AMOSTRA_GRUPO) continue;
      tendencias.push({
        chave: m.chave,
        rotulo: m.rotulo,
        antes: a.pct,
        depois: d.pct,
        delta: d.pct - a.pct,
        total: m.total,
      });
    }
    tendencias.sort((x, y) => y.delta - x.delta);
  }

  return {
    simulados: cronologico,
    questoes,
    totalSimulados: cronologico.length,
    totalQuestoes: questoes.length,
    notaMedia: Math.round(media(notas) * 10) / 10,
    melhorNota: notas.length > 0 ? Math.max(...notas) : 0,
    ultimaNota: notas.length > 0 ? notas[notas.length - 1] : null,
    deltaNota: notas.length >= 2 ? Math.round((notas[notas.length - 1] - notas[0]) * 10) / 10 : null,
    tempoTotalSeg: cronologico.reduce((s, x) => s + (x.tempoGastoSeg || 0), 0),
    materias,
    topicos,
    dificuldades: porDificuldade(questoes),
    fortes: comAmostra
      .filter((g) => g.pct >= PCT_BOM)
      .slice()
      .reverse()
      .slice(0, 5),
    aMelhorar: comAmostra.filter((g) => g.pct < PCT_BOM).slice(0, 5),
    tendencias,
    tempo: resumirTempo(questoes),
  };
}

// ---------------------------------------------------------------------------
// Formatação compartilhada
// ---------------------------------------------------------------------------

export function fmtSegundos(seg: number | null | undefined): string {
  if (seg == null) return "—";
  const s = Math.max(0, Math.round(seg));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

export function fmtSegundosPreciso(seg: number | null | undefined): string {
  if (seg == null) return "—";
  const s = Math.max(0, Math.round(seg));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, "0")}s`;
}

export function fmtDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ---------------------------------------------------------------------------
// Montagem — de linhas cruas do banco pra unidade de análise
// ---------------------------------------------------------------------------

export type ContextoTopico = { topico: string; materia: string; materiaId: string | null };

export type QuestaoCrua = {
  id: string;
  topic_id: string | null;
  gabarito: string;
  dificuldade: string | null;
  ano: number | null;
  subtopico: string | null;
  tempo_medio_seg: number | null;
};

/**
 * Transforma questões + respostas + tempos numa linha por questão — a unidade
 * que o resto deste módulo consome. Serve pro resultado de um simulado e pro
 * agregado. `questoes` já vem na ordem de aplicação (o número da questão é a
 * posição nessa lista, que é como o aluno se refere a ela).
 */
export function montarQuestoesAnalisadas(
  questoes: QuestaoCrua[],
  respostas: Record<string, string>,
  contexto: Record<string, ContextoTopico>,
  tempos: Record<string, number>,
): QuestaoAnalisada[] {
  return questoes.map((q, i) => {
    const marcada = respostas[q.id] || null;
    const ctx = (q.topic_id && contexto[q.topic_id]) || null;
    return {
      id: q.id,
      numero: i + 1,
      status: !marcada ? "branco" : marcada === q.gabarito ? "acerto" : "erro",
      marcada,
      gabarito: q.gabarito,
      materiaId: ctx?.materiaId ?? null,
      materia: ctx?.materia || "Geral",
      topicoId: q.topic_id,
      topico: ctx?.topico || "Sem tópico",
      subtopico: q.subtopico,
      dificuldade: normalizarDificuldade(q.dificuldade),
      ano: q.ano,
      tempoSeg: tempos[q.id] ?? null,
      tempoMedioSeg: q.tempo_medio_seg,
    };
  });
}
