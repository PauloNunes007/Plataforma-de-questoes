// Dados de "Minha trilha": o PANORAMA do aluno, disciplina por disciplina.
//
// **Repasse de 2026-09-16.** A trilha era o mapa até a prova: contagem
// regressiva, nota projetada pro dia D, tópicos "em risco" e o Boss no fim da
// estrada. Com o fim do motor de missões e da projeção, ela passou a
// responder UMA pergunta só, que é a que o aluno faz de verdade: *o que eu já
// estudei em cada matéria, e como eu vou nisso?* Sobraram cobertura, precisão
// e retenção (memória) por tópico — tudo derivado do que o aluno já
// respondeu, nada previsto.
//
// A classificação de estado por tópico é a mesma de sempre
// (pulado/mestre/dominado/vazio/coberto/pendente), e a "fronteira" continua
// sendo o 1º tópico pendente da ementa — agora com o sentido literal de "você
// parou aqui", não de entrada de um motor de recomendação.
import type { SupabaseClient } from "@supabase/supabase-js";
import { contagemDosTopicos } from "@/lib/questly/contagem-questoes";
import {
  questlyEhMestre,
  QUESTLY_MAESTRIA_MIN_QUESTOES,
  QUESTLY_MAESTRIA_TAXA,
  QUESTLY_RETENCAO_LIMIAR,
} from "@/lib/questly/shared";
// retenção (Ebbinghaus sobre a estabilidade persistida) — ciência de memória,
// não previsão de nota: diz o que já está escapando, com base no que o aluno
// respondeu e em quando respondeu.
import { questlyRetencaoEfetiva } from "@/lib/questly/motor-aprovacao";
// reaproveita a constante já exportada por chance-aprovacao.ts em vez de
// duplicar o literal — mantém em sincronia com COBERTURA_TOPICO (js/trilha.js)
import { META_QUESTOES_TOPICO as COBERTURA_TOPICO } from "@/lib/questly/chance-aprovacao";

export type EstadoTopico = "pulado" | "mestre" | "dominado" | "vazio" | "coberto" | "pendente";

// gap que ainda falta pra um tópico já coberto virar "Mestre"
export type RumoMestre = { faltamQuestoes: number; faltaPrecisao: number; pronto: boolean };

export type TopicoTrilha = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number | null;
  estado: EstadoTopico;
  ehFronteira: boolean;
  // ── camadas inteligentes (derivadas no server, prontas pra UI) ──────
  cobertura: number; // 0..1 — questões respondidas / meta de cobertura
  precisao: number | null; // 0..1 — taxa_acerto; null = sem dado
  retencao: number | null; // 0..1 — Ebbinghaus; null = nunca tocado
  memoriaCaindo: boolean; // tópico coberto cuja retenção caiu abaixo do limiar
  rumoMestre: RumoMestre | null; // só coberto/dominado (mestre já é o teto)
  // quantas questões do banco existem pra esse tópico — o aluno decide o
  // tamanho da prática com esse número na mão (e "vazio" fica honesto)
  questoesDisponiveis: number;
  ultimaRevisao: string | null; // ISO da última vez que praticou; null = nunca
};

export type RegiaoMapa = {
  subjectId: string;
  nome: string;
  temEmenta: boolean;
  totalTopicos: number;
  concluidos: number;
  pulados: number;
  mestres: number;
  /** tópicos já estudados cuja memória caiu abaixo do limiar (Ebbinghaus) */
  revisar: number;
  completo: boolean;
  /** média de acerto da disciplina, ponderada por volume de questões
   *  respondidas. null = o aluno ainda não respondeu nada aqui. */
  precisaoMedia: number | null;
  /** total de questões que o aluno já respondeu nessa disciplina */
  questoesRespondidas: number;
};

export type CaminhoDisciplina = {
  subjectId: string;
  subjectNome: string;
  topicos: TopicoTrilha[];
  progresso: { total: number; concluidos: number; pulados: number; naFila: number; pct: number };
  /** média de acerto da disciplina (ponderada por volume) + o volume */
  precisaoMedia: number | null;
  questoesRespondidas: number;
};

export type ProgressoRow = {
  topico_id: string;
  status?: string | null;
  taxa_acerto?: number | null;
  num_questoes_respondidas?: number | null;
  ultima_revisao?: string | null;
  maestria?: number | null;
  estabilidade?: number | null;
};

// os estados em que o aluno JÁ tocou o tópico (têm dado de memória/força)
const ESTADOS_TOCADOS = new Set<EstadoTopico>(["coberto", "dominado", "mestre"]);

// Deriva as camadas de leitura de um tópico a partir do progresso bruto.
// Tudo aqui é retrospectivo: quanto o aluno já respondeu, com que precisão e
// quanto disso a memória ainda segura hoje. Nada projeta nota pra frente.
function derivarInteligencia(
  progresso: ProgressoRow | undefined,
  estado: EstadoTopico,
  agoraMs: number,
): Pick<
  TopicoTrilha,
  "cobertura" | "precisao" | "retencao" | "memoriaCaindo" | "rumoMestre" | "ultimaRevisao"
> {
  const num = progresso?.num_questoes_respondidas || 0;
  const taxa = progresso?.taxa_acerto ?? 0;
  const tocado = ESTADOS_TOCADOS.has(estado);

  const cobertura = Math.min(1, num / COBERTURA_TOPICO);
  const precisao = num > 0 ? taxa : null;
  const retencao = tocado ? questlyRetencaoEfetiva(progresso, agoraMs) : null;
  const memoriaCaindo = retencao != null && retencao < QUESTLY_RETENCAO_LIMIAR;

  // rumo a Mestre: só faz sentido em tópicos cobertos que ainda não são Mestre
  const rumoMestre: RumoMestre | null =
    estado === "coberto" || estado === "dominado"
      ? {
          faltamQuestoes: Math.max(0, QUESTLY_MAESTRIA_MIN_QUESTOES - num),
          faltaPrecisao: Math.max(0, QUESTLY_MAESTRIA_TAXA - taxa),
          pronto: questlyEhMestre(progresso),
        }
      : null;

  return {
    cobertura,
    precisao,
    retencao,
    memoriaCaindo,
    rumoMestre,
    ultimaRevisao: progresso?.ultima_revisao ? String(progresso.ultima_revisao).slice(0, 10) : null,
  };
}

/** Precisão média da disciplina, ponderada pelo volume de cada tópico (um
 *  tópico com 40 questões pesa mais que um com 3) + o volume total. */
function resumoPrecisao(linhas: (ProgressoRow | undefined)[]): {
  precisaoMedia: number | null;
  questoesRespondidas: number;
} {
  let acertosEstimados = 0;
  let total = 0;
  linhas.forEach((p) => {
    const n = p?.num_questoes_respondidas || 0;
    if (n <= 0) return;
    total += n;
    acertosEstimados += n * (p?.taxa_acerto ?? 0);
  });
  return {
    precisaoMedia: total > 0 ? acertosEstimados / total : null,
    questoesRespondidas: total,
  };
}

/** Exportada porque a continuação do fim da lista (lib/questao/continuar.ts)
 *  precisa da MESMA definição de "tópico pendente" que desenha a trilha — duas
 *  versões da regra e o "próximo assunto" começaria a discordar do mapa. */
export function classificarEstado(progresso: ProgressoRow | undefined, temQuestoes: boolean): EstadoTopico {
  const status = progresso?.status || "pendente";
  if (status === "pulado") return "pulado";
  if (questlyEhMestre(progresso)) return "mestre";
  if (status === "dominado") return "dominado";
  if (!temQuestoes) return "vazio";
  if ((progresso?.num_questoes_respondidas || 0) >= COBERTURA_TOPICO) return "coberto";
  return "pendente";
}

// Mapa do panorama: uma "região" por disciplina, com o quanto da ementa já
// foi percorrido e como o aluno vem indo nela.
export async function carregarMapaTrilha(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<RegiaoMapa[]> {
  const { data: subjectsRaw } = await supabase
    .from("subjects")
    .select("id, nome, materia_id")
    .eq("user_id", user.id)
    .order("nome");
  const subjects = subjectsRaw || [];
  if (subjects.length === 0) return [];

  const materiaIds = Array.from(new Set(subjects.map((s) => s.materia_id).filter(Boolean))) as string[];

  const topicosPorMateria: Record<string, string[]> = {};
  const progressoPorTopico: Record<string, ProgressoRow> = {};
  const temQuestaoPorTopico: Record<string, boolean> = {};

  if (materiaIds.length > 0) {
    const { data: topicos } = await supabase.from("topicos").select("id, materia_id").in("materia_id", materiaIds);
    (topicos || []).forEach((t) => {
      (topicosPorMateria[t.materia_id] ||= []).push(t.id);
    });

    const topicoIds = (topicos || []).map((t) => t.id);
    if (topicoIds.length > 0) {
      const [{ data: progressos }, contagens] = await Promise.all([
        supabase
          .from("aluno_topico_progresso")
          .select(
            "topico_id, status, taxa_acerto, num_questoes_respondidas, ultima_revisao, maestria, estabilidade",
          )
          .eq("user_id", user.id)
          .in("topico_id", topicoIds),
        // Contagem agregada em vez de varrer `questions`: um aluno com 4
        // disciplinas já estourava as 1000 linhas do teto do PostgREST, e
        // tópicos COM questão apareciam como "sem questões" na trilha.
        contagemDosTopicos(supabase, topicoIds),
      ]);
      (progressos || []).forEach((p) => (progressoPorTopico[p.topico_id] = p));
      contagens.forEach((c, topicId) => {
        if (c.totalRegular > 0) temQuestaoPorTopico[topicId] = true;
      });
    }
  }

  const agoraMs = Date.now();

  return subjects.map((s) => {
    const topicoIds = s.materia_id ? topicosPorMateria[s.materia_id] || [] : [];

    let concluidos = 0;
    let pulados = 0;
    let mestres = 0;
    let revisar = 0;
    topicoIds.forEach((id) => {
      const estado = classificarEstado(progressoPorTopico[id], Boolean(temQuestaoPorTopico[id]));
      if (estado === "mestre") mestres++;
      if (estado === "coberto" || estado === "dominado" || estado === "mestre") concluidos++;
      if (estado === "pulado") pulados++;
      // mesma régua do nó da jornada: tópico tocado cuja retenção caiu
      if (ESTADOS_TOCADOS.has(estado)) {
        const r = questlyRetencaoEfetiva(progressoPorTopico[id], agoraMs);
        if (r != null && r < QUESTLY_RETENCAO_LIMIAR) revisar++;
      }
    });

    const resumo = resumoPrecisao(topicoIds.map((id) => progressoPorTopico[id]));

    return {
      subjectId: s.id,
      nome: s.nome,
      temEmenta: topicoIds.length > 0,
      totalTopicos: topicoIds.length,
      concluidos,
      pulados,
      mestres,
      revisar,
      completo: topicoIds.length > 0 && concluidos + pulados === topicoIds.length,
      ...resumo,
    };
  });
}

// Detalhe de uma disciplina: a ementa em ordem curricular, com o estado de
// cada tópico.
export async function carregarCaminhoDisciplina(
  supabase: SupabaseClient,
  user: { id: string },
  subjectId: string,
): Promise<CaminhoDisciplina | null> {
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, nome, materia_id")
    .eq("id", subjectId)
    .eq("user_id", user.id)
    .single();
  if (!subject || !subject.materia_id) return null;

  const { data: topicosRaw } = await supabase
    .from("topicos")
    .select("id, nome, descricao, ordem")
    .eq("materia_id", subject.materia_id);

  const topicosOrdenados = (topicosRaw || []).slice().sort((a, b) => {
    const oa = a.ordem ?? Infinity;
    const ob = b.ordem ?? Infinity;
    if (oa !== ob) return oa - ob;
    return a.nome.localeCompare(b.nome);
  });
  const topicoIds = topicosOrdenados.map((t) => t.id);

  let progressoPorTopico: Record<string, ProgressoRow> = {};
  // quantas questões existem por tópico (não só "tem/não tem") — o painel
  // mostra o número e usa ele pra oferecer o tamanho da prática
  let qtdQuestoes: Record<string, number> = {};
  if (topicoIds.length > 0) {
    const [{ data: progressos }, contagens] = await Promise.all([
      supabase
        .from("aluno_topico_progresso")
        .select(
          "topico_id, status, taxa_acerto, num_questoes_respondidas, ultima_revisao, maestria, estabilidade",
        )
        .eq("user_id", user.id)
        .in("topico_id", topicoIds),
      contagemDosTopicos(supabase, topicoIds),
    ]);
    const pp: Record<string, ProgressoRow> = {};
    (progressos || []).forEach((p) => (pp[p.topico_id] = p));
    progressoPorTopico = pp;
    const tq: Record<string, number> = {};
    contagens.forEach((c, topicId) => (tq[topicId] = c.totalRegular));
    qtdQuestoes = tq;
  }

  const agoraMs = Date.now();

  // A "fronteira" é só o 1º tópico pendente da ementa — o marcador de "você
  // parou aqui" na estrada. Não bloqueia nada: qualquer parada é praticável a
  // qualquer momento, inclusive as que vêm depois dela.
  let fronteiraId: string | null = null;
  const topicos: TopicoTrilha[] = topicosOrdenados.map((t) => {
    const progresso = progressoPorTopico[t.id];
    const estado = classificarEstado(progresso, (qtdQuestoes[t.id] || 0) > 0);
    if (fronteiraId === null && estado === "pendente") fronteiraId = t.id;
    return {
      id: t.id,
      nome: t.nome,
      descricao: t.descricao,
      ordem: t.ordem,
      estado,
      ehFronteira: false,
      questoesDisponiveis: qtdQuestoes[t.id] || 0,
      ...derivarInteligencia(progresso, estado, agoraMs),
    };
  });
  topicos.forEach((t) => {
    if (t.id === fronteiraId) t.ehFronteira = true;
  });

  const total = topicos.length;
  const concluidos = topicos.filter((t) => t.estado === "coberto" || t.estado === "dominado" || t.estado === "mestre").length;
  const pulados = topicos.filter((t) => t.estado === "pulado").length;

  return {
    subjectId: subject.id,
    subjectNome: subject.nome,
    topicos,
    progresso: {
      total,
      concluidos,
      pulados,
      naFila: total - concluidos - pulados,
      pct: total > 0 ? Math.round(((concluidos + pulados) / total) * 100) : 0,
    },
    ...resumoPrecisao(topicoIds.map((id) => progressoPorTopico[id])),
  };
}
