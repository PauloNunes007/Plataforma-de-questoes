// Dados de "Minha trilha": portado de js/trilha.js, mas cobrindo TODAS as
// disciplinas de uma vez (mapa da campanha) além do detalhe de uma só
// (o caminho até o Boss dela). Mesma classificação de estado por tópico
// do arquivo legado — pulado/mestre/dominado/vazio/coberto/pendente — e
// a mesma fronteira curricular (1º pendente com questões) do
// mission-engine.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  diasAte,
  questlyEhMestre,
  QUESTLY_MAESTRIA_MIN_QUESTOES,
  QUESTLY_MAESTRIA_TAXA,
  QUESTLY_RETENCAO_LIMIAR,
} from "@/lib/questly/shared";
// motor preditivo (BKT + estabilidade persistida) — as MESMAS funções puras
// que o dashboard usa; aqui só LEMOS pra iluminar os nós da trilha.
import {
  QUESTLY_FORCA_RISCO,
  questlyForcaNaProva,
  questlyProjetarProva,
  questlyRetencaoEfetiva,
} from "@/lib/questly/motor-aprovacao";
// reaproveita a constante já exportada por chance-aprovacao.ts em vez de
// duplicar o literal — mantém em sincronia com COBERTURA_TOPICO_QUESTOES
// (mission-engine.ts) e COBERTURA_TOPICO (js/trilha.js legado)
import { META_QUESTOES_TOPICO as COBERTURA_TOPICO } from "@/lib/questly/chance-aprovacao";
import { ehPro } from "@/lib/plano/plano";

// A PROJEÇÃO PRO DIA D é recurso do Pro (ver landing/plano.ts). Fica gated no
// data layer — único ponto por onde SSR e a ação de troca de região passam,
// então esconder aqui cobre a re-derivação otimista do trilha-view também.
async function alunoEhPro(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", userId)
    .maybeSingle();
  return ehPro(data);
}

export type EstadoTopico = "pulado" | "mestre" | "dominado" | "vazio" | "coberto" | "pendente";

// gap que ainda falta pra um tópico já coberto virar "Mestre"
export type RumoMestre = { faltamQuestoes: number; faltaPrecisao: number; pronto: boolean };

// projeção agregada de uma disciplina pra o dia da prova
export type ProjecaoTrilha = { notaProjetada: number | null; emRisco: number };

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
  forcaNaProva: number | null; // 0..1 — força projetada pro dia da prova
  emRiscoProva: boolean; // estudado mas chega fraco no dia D
};

export type RegiaoMapa = {
  subjectId: string;
  nome: string;
  temEmenta: boolean;
  bossNome: string | null;
  diasAteProva: number | null;
  preparoPercentual: number;
  totalTopicos: number;
  concluidos: number;
  pulados: number;
  mestres: number;
  completo: boolean;
  // resumo preditivo por região (pro selo de risco da ilha)
  notaProjetada: number | null;
  emRisco: number;
};

export type CaminhoDisciplina = {
  subjectId: string;
  subjectNome: string;
  bossId: string | null;
  bossNome: string | null;
  bossData: string | null;
  diasAteProva: number | null;
  preparoPercentual: number;
  chanceAprovacao: number | null;
  topicos: TopicoTrilha[];
  progresso: { total: number; concluidos: number; pulados: number; naFila: number; pct: number };
  projecao: ProjecaoTrilha;
};

type ProgressoRow = {
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

// Deriva as camadas inteligentes de um tópico a partir do progresso bruto.
// dataProvaMs = null quando não há Boss futuro (sem projeção pra prova).
function derivarInteligencia(
  progresso: ProgressoRow | undefined,
  estado: EstadoTopico,
  dataProvaMs: number | null,
  agoraMs: number,
): Pick<
  TopicoTrilha,
  "cobertura" | "precisao" | "retencao" | "memoriaCaindo" | "rumoMestre" | "forcaNaProva" | "emRiscoProva"
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

  // força/risco na prova: só com Boss futuro e tópico já tocado
  let forcaNaProva: number | null = null;
  let emRiscoProva = false;
  if (dataProvaMs != null && tocado) {
    forcaNaProva = questlyForcaNaProva(progresso, dataProvaMs, agoraMs);
    emRiscoProva = forcaNaProva < QUESTLY_FORCA_RISCO;
  }

  return { cobertura, precisao, retencao, memoriaCaindo, rumoMestre, forcaNaProva, emRiscoProva };
}

// Projeção agregada da disciplina pro dia da prova, no mesmo espírito do
// dashboard: média das forças dos tópicos NÃO pulados (denominador igual
// ao da chance de aprovação). Sem Boss futuro → sem nota.
function projetarDisciplina(
  progressoPorTopico: Record<string, ProgressoRow>,
  topicoIds: string[],
  estadoPorTopico: Record<string, EstadoTopico>,
  dataProvaMs: number | null,
  agoraMs: number,
): ProjecaoTrilha {
  if (dataProvaMs == null) return { notaProjetada: null, emRisco: 0 };
  const entradas = topicoIds
    .filter((id) => estadoPorTopico[id] !== "pulado")
    .map((id) => ({ id, ...(progressoPorTopico[id] || {}) }));
  const { notaProjetada, emRisco } = questlyProjetarProva(entradas, dataProvaMs, agoraMs);
  return { notaProjetada, emRisco: emRisco.length };
}

type BossRow = { id: string; nome: string; data_prova: string; preparo_percentual: number | null };

function classificarEstado(progresso: ProgressoRow | undefined, temQuestoes: boolean): EstadoTopico {
  const status = progresso?.status || "pendente";
  if (status === "pulado") return "pulado";
  if (questlyEhMestre(progresso)) return "mestre";
  if (status === "dominado") return "dominado";
  if (!temQuestoes) return "vazio";
  if ((progresso?.num_questoes_respondidas || 0) >= COBERTURA_TOPICO) return "coberto";
  return "pendente";
}

function bossMaisProximo(bosses: BossRow[] | null | undefined): BossRow | null {
  const hoje = new Date(new Date().toDateString());
  const futuros = (bosses || [])
    .filter((b) => new Date(b.data_prova) >= hoje)
    .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
  return futuros[0] || null;
}

// Mapa da campanha: uma "região" por disciplina, cada uma com seu próprio
// Boss — em vez de olhar só a prova mais próxima, o aluno vê o caminho até
// TODAS as provas de uma vez.
export async function carregarMapaTrilha(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<RegiaoMapa[]> {
  const { data: subjectsRaw } = await supabase
    .from("subjects")
    .select("id, nome, materia_id, bosses(id, nome, data_prova, preparo_percentual)")
    .eq("user_id", user.id)
    .order("nome");
  const subjects = subjectsRaw || [];
  if (subjects.length === 0) return [];

  const pro = await alunoEhPro(supabase, user.id);

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
      const [{ data: progressos }, { data: questoes }] = await Promise.all([
        supabase
          .from("aluno_topico_progresso")
          .select(
            "topico_id, status, taxa_acerto, num_questoes_respondidas, ultima_revisao, maestria, estabilidade",
          )
          .eq("user_id", user.id)
          .in("topico_id", topicoIds),
        supabase.from("questions").select("topic_id").in("topic_id", topicoIds),
      ]);
      (progressos || []).forEach((p) => (progressoPorTopico[p.topico_id] = p));
      (questoes || []).forEach((q) => (temQuestaoPorTopico[q.topic_id] = true));
    }
  }

  const agoraMs = Date.now();

  return subjects.map((s) => {
    const proximoBoss = bossMaisProximo(s.bosses as BossRow[]);
    const dataProvaMs = proximoBoss ? new Date(proximoBoss.data_prova).getTime() : null;
    const topicoIds = s.materia_id ? topicosPorMateria[s.materia_id] || [] : [];

    let concluidos = 0;
    let pulados = 0;
    let mestres = 0;
    const estadoPorTopico: Record<string, EstadoTopico> = {};
    topicoIds.forEach((id) => {
      const estado = classificarEstado(progressoPorTopico[id], Boolean(temQuestaoPorTopico[id]));
      estadoPorTopico[id] = estado;
      if (estado === "mestre") mestres++;
      if (estado === "coberto" || estado === "dominado" || estado === "mestre") concluidos++;
      if (estado === "pulado") pulados++;
    });

    const projecao = projetarDisciplina(progressoPorTopico, topicoIds, estadoPorTopico, dataProvaMs, agoraMs);

    return {
      subjectId: s.id,
      nome: s.nome,
      temEmenta: topicoIds.length > 0,
      bossNome: proximoBoss?.nome || null,
      diasAteProva: proximoBoss ? diasAte(proximoBoss.data_prova) : null,
      preparoPercentual: proximoBoss?.preparo_percentual || 0,
      totalTopicos: topicoIds.length,
      concluidos,
      pulados,
      mestres,
      completo: topicoIds.length > 0 && concluidos + pulados === topicoIds.length,
      notaProjetada: pro ? projecao.notaProjetada : null,
      emRisco: pro ? projecao.emRisco : 0,
    };
  });
}

// Detalhe de uma disciplina: a ementa em ordem curricular + o Boss no fim
// da trilha.
export async function carregarCaminhoDisciplina(
  supabase: SupabaseClient,
  user: { id: string },
  subjectId: string,
): Promise<CaminhoDisciplina | null> {
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, nome, materia_id, chance_aprovacao, bosses(id, nome, data_prova, preparo_percentual)")
    .eq("id", subjectId)
    .eq("user_id", user.id)
    .single();
  if (!subject || !subject.materia_id) return null;

  const pro = await alunoEhPro(supabase, user.id);

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
  let temQuestao: Record<string, boolean> = {};
  if (topicoIds.length > 0) {
    const [{ data: progressos }, { data: questoes }] = await Promise.all([
      supabase
        .from("aluno_topico_progresso")
        .select(
          "topico_id, status, taxa_acerto, num_questoes_respondidas, ultima_revisao, maestria, estabilidade",
        )
        .eq("user_id", user.id)
        .in("topico_id", topicoIds),
      supabase.from("questions").select("topic_id").in("topic_id", topicoIds),
    ]);
    const pp: Record<string, ProgressoRow> = {};
    (progressos || []).forEach((p) => (pp[p.topico_id] = p));
    progressoPorTopico = pp;
    const tq: Record<string, boolean> = {};
    (questoes || []).forEach((q) => (tq[q.topic_id] = true));
    temQuestao = tq;
  }

  const proximoBoss = bossMaisProximo(subject.bosses as BossRow[]);
  const dataProvaMs = proximoBoss ? new Date(proximoBoss.data_prova).getTime() : null;
  const agoraMs = Date.now();

  let fronteiraId: string | null = null;
  const estadoPorTopico: Record<string, EstadoTopico> = {};
  const topicos: TopicoTrilha[] = topicosOrdenados.map((t) => {
    const progresso = progressoPorTopico[t.id];
    const estado = classificarEstado(progresso, Boolean(temQuestao[t.id]));
    estadoPorTopico[t.id] = estado;
    if (fronteiraId === null && estado === "pendente") fronteiraId = t.id;
    return {
      id: t.id,
      nome: t.nome,
      descricao: t.descricao,
      ordem: t.ordem,
      estado,
      ehFronteira: false,
      ...derivarInteligencia(progresso, estado, dataProvaMs, agoraMs),
    };
  });
  topicos.forEach((t) => {
    if (t.id === fronteiraId) t.ehFronteira = true;
    // força/risco projetados pro dia D são recurso do Pro
    if (!pro) {
      t.forcaNaProva = null;
      t.emRiscoProva = false;
    }
  });

  const total = topicos.length;
  const concluidos = topicos.filter((t) => t.estado === "coberto" || t.estado === "dominado" || t.estado === "mestre").length;
  const pulados = topicos.filter((t) => t.estado === "pulado").length;

  const projecao = pro
    ? projetarDisciplina(progressoPorTopico, topicoIds, estadoPorTopico, dataProvaMs, agoraMs)
    : { notaProjetada: null, emRisco: 0 };

  return {
    subjectId: subject.id,
    subjectNome: subject.nome,
    bossId: proximoBoss?.id || null,
    bossNome: proximoBoss?.nome || null,
    bossData: proximoBoss?.data_prova || null,
    diasAteProva: proximoBoss ? diasAte(proximoBoss.data_prova) : null,
    preparoPercentual: proximoBoss?.preparo_percentual || 0,
    chanceAprovacao: subject.chance_aprovacao != null ? Math.round(subject.chance_aprovacao) : null,
    topicos,
    progresso: {
      total,
      concluidos,
      pulados,
      naFila: total - concluidos - pulados,
      pct: total > 0 ? Math.round(((concluidos + pulados) / total) * 100) : 0,
    },
    projecao,
  };
}
