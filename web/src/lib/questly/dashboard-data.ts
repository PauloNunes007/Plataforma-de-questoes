// Orquestra os dados do dashboard: portado de js/dashboard.js
// (iniciarDashboard + as funções carregarX), mas rodando no servidor
// (Server Component) numa passada só em vez de várias buscas no
// browser. O "medidor de cerco ao Boss" substitui a trilha de nós estilo
// Duolingo do app legado — ver decisão de design na conversa da Etapa 3
// (o usuário pediu algo mais autoral que combine com a identidade
// "Boss"/RPG da Questly em vez de replicar o path do Duolingo).
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  diasAte,
  addDias,
  toISODate,
  fmtDataCurta,
  questlyEhMestre,
  questlyNormalizarDia,
  saudacaoPorHorario,
} from "./shared";
import { questlyGerarMissoesDoDia, type Mission, type Subject } from "./mission-engine";
import { questlyGarantirSemanaLiga, QUESTLY_LIGA_INFO, type EstadoLiga } from "./liga";
import { carregarModeloAtivo, forcaTopicoComRede, projetarProvaComRede } from "@/lib/ml/inferencia";
import { questlyRotaAprovacao, type RotaAprovacao, type TopicoRota } from "./rota-aprovacao";
import { ehPro } from "@/lib/plano/plano";
import { createAdminClient } from "@/lib/supabase/admin";
import { carregarTarefasIntervalo, type TarefaRow } from "@/lib/tarefas/tarefas-data";

const XP_POR_NIVEL = 1000;
const DOW_ABREV = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export type ProfileRow = {
  nome: string | null;
  curso: string | null;
  semestre: number | null;
  xp_total: number | null;
  nivel: number | null;
  streak_atual: number | null;
  dias_disponiveis: string[] | null;
  tempo_diario_min: number | null;
  foto_url: string | null;
};

export type MissionCardData = Mission & { mestre: boolean };

export type BossAlvo = {
  subjectId: string;
  subjectNome: string;
  bossNome: string;
  dataProva: string;
  diasAteProva: number;
  preparoPercentual: number;
  chanceAprovacao: number | null;
  notaProjetada: number | null; // nota esperada na prova se nada mudar (motor)
  emRiscoCount: number; // tópicos que chegam fracos no dia D
  rota: RotaAprovacao | null; // GPS: onde investir os minutos de hoje
  // escopo da prova (bosses.topico_ids): o aluno marcou o que cai?
  // false = projeção/GPS estão assumindo a ementa inteira (menos preciso)
  escopoDefinido: boolean;
  escopoTopicos: number | null; // quantos tópicos caem, quando definido
};

export type SubjectListItem = {
  id: string;
  nome: string;
  nivel: number;
  diasBoss: number | null;
  preparo: number;
  aprovacao: number | null;
};

export type DiaTicker = {
  data: string;
  label: string;
  estado: "feito" | "perdido" | "hoje" | "bloqueado";
};

export type CalDay = {
  dia: number;
  data: string;
  estado: "normal" | "hoje" | "prova" | "estudou";
  title?: string;
  temTarefa: boolean;
};

// "Metas" do dia (card do hero da aba Hoje) — reinterpreta o "Aulas
// concluídas" do print de referência com métricas que existem de fato no
// domínio do Questly (não há conceito de aula/vídeo aqui): missões,
// questões respondidas e XP, todos derivados de dados.missions — sem
// query extra.
export type MetasHoje = {
  missoesConcluidas: number;
  missoesTotal: number;
  questoesRespondidas: number;
  questoesTotal: number;
  xpHoje: number;
  xpMetaHoje: number;
};

export type DiaSemanaResumo = {
  data: string;
  label: string;
  dataLabel: string;
  xpGanho: number;
  estudou: boolean;
  hoje: boolean;
};

// Percentil do aluno vs. todos os outros por XP da semana. Cross-user,
// mas honesto: `profiles` é legível por qualquer autenticado (RLS), então
// dá pra ranquear de verdade em vez de inventar número. `percentil` é o
// "top X%" (menor = melhor); null quando o aluno ainda não pontuou nesta
// rodada semanal (aí mostramos um estado de incentivo, não um número).
export type ComparativoSemana = {
  percentil: number | null;
  totalAlunos: number;
};

// Recorde pessoal: maior sequência de dias seguidos estudando já feita
// (derivada de daily_logs, não de um campo persistido — não há
// streak_maximo no schema, então recomputamos).
export type RecordeEstudo = {
  melhorStreak: number;
  streakAtual: number;
};

export type SemanaResumo = {
  dias: DiaSemanaResumo[];
  xpSemana: number;
  metaSemanalXp: number;
  metaDiariaXp: number;
  streakAtual: number;
  comparativo: ComparativoSemana;
  recorde: RecordeEstudo;
};

export type DashboardData = {
  profile: ProfileRow | null;
  ehPro: boolean;
  greeting: string;
  subheading: string;
  subjects: SubjectListItem[];
  missions: MissionCardData[];
  semMissaoHoje: boolean;
  todasConcluidas: boolean;
  motivoSemMissao?: string;
  bossAlvo: BossAlvo | null;
  ligaEstado: (EstadoLiga & { icone: string; nomeExibicao: string }) | null;
  streakHeat: boolean[];
  dayTicker: DiaTicker[];
  calendar: { monthLabel: string; dowOffset: number; days: CalDay[] };
  tarefasHoje: TarefaRow[];
  tarefasPorData: Record<string, TarefaRow[]>;
  metasHoje: MetasHoje;
  semana: SemanaResumo;
};

export async function carregarDadosDashboard(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<DashboardData> {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const primeiroNome = profile?.nome ? profile.nome.split(" ")[0] : "Aluno(a)";
  const greeting = `${saudacaoPorHorario()}, ${primeiroNome}`;

  const { data: subjectsRaw } = await supabase
    .from("subjects")
    .select("*, bosses(id, nome, data_prova, preparo_percentual, topico_ids)")
    .eq("user_id", user.id);
  const subjects = (subjectsRaw || []) as Subject[];

  const hoje = new Date(new Date().toDateString());

  const subjectListItems: SubjectListItem[] = subjects.map((s) => {
    const bossesFuturos = (s.bosses || [])
      .filter((b) => new Date(b.data_prova) >= hoje)
      .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
    const proximoBoss = bossesFuturos[0] || null;
    return {
      id: s.id,
      nome: s.nome,
      nivel: (s as unknown as { nivel?: number }).nivel || 1,
      diasBoss: proximoBoss ? diasAte(proximoBoss.data_prova) : null,
      preparo: proximoBoss?.preparo_percentual != null ? Math.round(proximoBoss.preparo_percentual) : 0,
      aprovacao: s.chance_aprovacao != null ? Math.round(s.chance_aprovacao) : null,
    };
  });

  const comBoss = subjects
    .map((s) => {
      const proximos = (s.bosses || []).filter((b) => new Date(b.data_prova) >= hoje);
      return {
        nome: s.nome,
        boss: proximos.sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime())[0],
      };
    })
    .filter((x): x is { nome: string; boss: NonNullable<typeof x.boss> } => Boolean(x.boss))
    .sort((a, b) => new Date(a.boss.data_prova).getTime() - new Date(b.boss.data_prova).getTime())[0];

  const subheading = !subjects.length
    ? "Vamos configurar sua primeira campanha."
    : comBoss
      ? `Sua campanha de ${comBoss.nome} está a ${diasAte(comBoss.boss.data_prova)} dias do Boss ${comBoss.boss.nome}.`
      : "Nenhuma prova marcada ainda.";

  // ---- Missões do dia (mission-engine) ----
  const missaoResultado = await questlyGerarMissoesDoDia(supabase, user, profile);
  const missoes = missaoResultado.missoes;
  const todasConcluidas = missoes.length > 0 && missoes.every((m) => m.concluida);

  // ---- Metas de hoje (card "Metas") — tudo derivado de missoes, sem query nova ----
  const missoesConcluidasHoje = missoes.filter((m) => m.concluida);
  const metasHoje: MetasHoje = {
    missoesConcluidas: missoesConcluidasHoje.length,
    missoesTotal: missoes.length,
    questoesRespondidas: missoesConcluidasHoje.reduce((acc, m) => acc + m.qtd_questoes, 0),
    questoesTotal: missoes.reduce((acc, m) => acc + m.qtd_questoes, 0),
    xpHoje: missoesConcluidasHoje.reduce((acc, m) => acc + m.xp_recompensa, 0),
    xpMetaHoje: missoes.reduce((acc, m) => acc + m.xp_recompensa, 0),
  };

  const topicIdsRelevantes = Array.from(new Set(missoes.flatMap((m) => m.topic_ids || [])));
  const progressoPorTopico: Record<string, { taxa_acerto: number; num_questoes_respondidas: number }> = {};
  if (topicIdsRelevantes.length > 0) {
    const { data: progressos } = await supabase
      .from("aluno_topico_progresso")
      .select("topico_id, taxa_acerto, num_questoes_respondidas")
      .eq("user_id", user.id)
      .in("topico_id", topicIdsRelevantes);
    (progressos || []).forEach((p) => {
      progressoPorTopico[p.topico_id] = p;
    });
  }

  const missionCards: MissionCardData[] = missoes.map((m) => {
    const topicIds = m.topic_ids || [];
    const mestre =
      !m.concluida && topicIds.length > 0 && topicIds.every((id) => questlyEhMestre(progressoPorTopico[id]));
    return { ...m, mestre };
  });

  // ---- Boss-alvo (disciplina com boss futuro mais próximo) ----
  const alvo = subjects
    .map((s) => {
      const futuros = (s.bosses || [])
        .filter((b) => new Date(b.data_prova) >= hoje)
        .sort((a, b) => new Date(a.data_prova).getTime() - new Date(b.data_prova).getTime());
      return { subject: s, boss: futuros[0] || null };
    })
    .filter((x): x is { subject: Subject; boss: NonNullable<typeof x.boss> } => Boolean(x.boss))
    .sort((a, b) => new Date(a.boss.data_prova).getTime() - new Date(b.boss.data_prova).getTime())[0];

  // Projeção pra data da prova (motor): que nota o aluno tira no dia D
  // se nada mudar, e quantos tópicos chegam fracos lá. Escopo: o que o
  // aluno marcou que CAI NESTA prova (bosses.topico_ids) — sem escopo
  // definido, fallback pra flag global cai_na_prova da ementa (menos
  // preciso; o card avisa). Sempre sem os 'pulado'.
  let notaProjetada: number | null = null;
  let emRiscoCount = 0;
  let rota: RotaAprovacao | null = null;
  const escopoProva =
    alvo?.boss.topico_ids && alvo.boss.topico_ids.length > 0 ? new Set(alvo.boss.topico_ids) : null;
  if (alvo && alvo.subject.materia_id) {
    const { data: topicosMateria } = await supabase
      .from("topicos")
      .select("id, nome, cai_na_prova")
      .eq("materia_id", alvo.subject.materia_id);
    const topicosProva = (topicosMateria || []).filter((t) =>
      escopoProva ? escopoProva.has(t.id) : t.cai_na_prova,
    );
    const idsProva = topicosProva.map((t) => t.id);
    const nomePorId: Record<string, string> = {};
    topicosProva.forEach((t) => (nomePorId[t.id] = t.nome));
    if (idsProva.length > 0) {
      const { data: progProva } = await supabase
        .from("aluno_topico_progresso")
        .select("topico_id, status, maestria, estabilidade, taxa_acerto, num_questoes_respondidas, ultima_revisao")
        .eq("user_id", user.id)
        .in("topico_id", idsProva);
      type ProgProva = {
        topico_id: string;
        status?: string | null;
        maestria?: number | null;
        estabilidade?: number | null;
        taxa_acerto?: number | null;
        num_questoes_respondidas?: number | null;
        ultima_revisao?: string | null;
      };
      const progPorId: Record<string, ProgProva> = {};
      ((progProva || []) as ProgProva[]).forEach((p) => (progPorId[p.topico_id] = p));
      const topicosParaProjecao = idsProva
        .map((id) => ({ id, ...(progPorId[id] || {}) }))
        .filter((t) => t.status !== "pulado");
      // Rede neural quando há modelo ativo (venceu o baseline na validação);
      // sem modelo, projetarProvaComRede É questlyProjetarProva — zero mudança.
      const modeloMl = await carregarModeloAtivo(supabase);
      const dataProvaMs = new Date(alvo.boss.data_prova).getTime();
      const agoraMs = Date.now();
      const projecao = projetarProvaComRede(modeloMl, topicosParaProjecao, dataProvaMs, agoraMs);
      notaProjetada = projecao.notaProjetada;
      emRiscoCount = projecao.emRisco.length;

      // ---- GPS: rota Δnota/min pros minutos de hoje ----
      // Precisa de tempo médio + nº de questões por tópico (só tópicos
      // com questão entram na rota — os demais seguem na projeção).
      const { data: questoesProva } = await supabase
        .from("questions")
        .select("topic_id, tempo_medio_seg")
        .in("topic_id", idsProva);
      const statsPorTopico: Record<string, { total: number; somaSeg: number; comDado: number }> = {};
      (questoesProva || []).forEach((q) => {
        const s = (statsPorTopico[q.topic_id] ||= { total: 0, somaSeg: 0, comDado: 0 });
        s.total += 1;
        if (q.tempo_medio_seg) {
          s.somaSeg += q.tempo_medio_seg;
          s.comDado += 1;
        }
      });

      const topicosRota: TopicoRota[] = topicosParaProjecao.map((t) => {
        const s = statsPorTopico[t.id];
        return {
          ...t,
          nome: nomePorId[t.id] || "Tópico",
          questoesDisponiveis: s?.total ?? 0,
          tempoMedioSeg: s && s.comDado > 0 ? s.somaSeg / s.comDado : null,
        };
      });

      // Orçamento = tempo diário configurado (com piso/teto sensatos);
      // é uma recomendação pro dia, não um contrato.
      const tempoRotaMin = Math.min(180, Math.max(15, profile?.tempo_diario_min || 60));
      rota = questlyRotaAprovacao({
        topicos: topicosRota,
        dataProvaMs,
        agoraMs,
        tempoDisponivelMin: tempoRotaMin,
        calcularForca: (t) => forcaTopicoComRede(modeloMl, t, dataProvaMs, agoraMs),
      });
    }
  }

  const bossAlvo: BossAlvo | null = alvo
    ? {
        subjectId: alvo.subject.id,
        subjectNome: alvo.subject.nome,
        bossNome: alvo.boss.nome,
        dataProva: alvo.boss.data_prova,
        diasAteProva: diasAte(alvo.boss.data_prova),
        preparoPercentual: alvo.boss.preparo_percentual || 0,
        chanceAprovacao: alvo.subject.chance_aprovacao != null ? Math.round(alvo.subject.chance_aprovacao) : null,
        notaProjetada,
        emRiscoCount,
        rota,
        escopoDefinido: escopoProva != null,
        escopoTopicos: escopoProva ? escopoProva.size : null,
      }
    : null;

  // ---- Ticker de dias (ritmo recente — substitui a trilha de nós) ----
  let diasSet: Set<string> | null = null;
  if (profile?.dias_disponiveis && profile.dias_disponiveis.length > 0) {
    diasSet = new Set(profile.dias_disponiveis.map(questlyNormalizarDia));
  }
  const ehDiaDeEstudo = (d: Date) => !diasSet || diasSet.has(DOW_ABREV[d.getDay()]);

  const passados: Date[] = [];
  let dCursor = addDias(hoje, -1);
  for (let guard = 0; passados.length < 4 && guard < 30; guard++) {
    if (ehDiaDeEstudo(dCursor)) passados.unshift(new Date(dCursor));
    dCursor = addDias(dCursor, -1);
  }

  const limiteFuturo = alvo ? new Date(new Date(alvo.boss.data_prova).toDateString()) : addDias(hoje, 14);
  const futuros: Date[] = [];
  dCursor = new Date(hoje);
  while (dCursor < limiteFuturo && futuros.length < 3) {
    dCursor = addDias(dCursor, 1);
    if (ehDiaDeEstudo(dCursor)) futuros.push(new Date(dCursor));
  }

  const janela = [...passados, hoje, ...futuros];
  const inicioStr = toISODate(janela[0]);
  const { data: missoesJanela } = await supabase
    .from("missions")
    .select("data, concluida")
    .eq("user_id", user.id)
    .gte("data", inicioStr);
  const cumpriuNoDia: Record<string, boolean> = {};
  (missoesJanela || []).forEach((m) => {
    if (m.concluida) cumpriuNoDia[m.data] = true;
  });

  const hojeStr = toISODate(hoje);
  const dayTicker: DiaTicker[] = janela.map((d) => {
    const dataStr = toISODate(d);
    const label = DOW_ABREV[d.getDay()];
    let estado: DiaTicker["estado"];
    if (dataStr === hojeStr) estado = "hoje";
    else if (d < hoje) estado = cumpriuNoDia[dataStr] ? "feito" : "perdido";
    else estado = "bloqueado";
    return { data: dataStr, label, estado };
  });

  // ---- Liga ----
  const estadoLiga = await questlyGarantirSemanaLiga(supabase, user, () => createAdminClient());
  const ligaEstado = estadoLiga
    ? {
        ...estadoLiga,
        icone: QUESTLY_LIGA_INFO[estadoLiga.liga]?.icone || QUESTLY_LIGA_INFO.bronze.icone,
        nomeExibicao: QUESTLY_LIGA_INFO[estadoLiga.liga]?.nome || QUESTLY_LIGA_INFO.bronze.nome,
      }
    : null;

  // ---- Streak heatmap (10 dias) ----
  const dezDiasAtras = new Date();
  dezDiasAtras.setDate(dezDiasAtras.getDate() - 9);
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("data, estudou")
    .eq("user_id", user.id)
    .gte("data", dezDiasAtras.toISOString().slice(0, 10));
  const porData: Record<string, boolean> = {};
  (logs || []).forEach((l) => {
    porData[l.data] = l.estudou;
  });
  const streakHeat: boolean[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    streakHeat.push(Boolean(porData[d.toISOString().slice(0, 10)]));
  }

  // ---- Calendário do mês ----
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dowOffset = primeiroDia.getDay();

  const provasPorDia: Record<string, string> = {};
  subjects.forEach((s) => {
    (s.bosses || []).forEach((b) => {
      if (!b.data_prova) return;
      const dataProvaStr = String(b.data_prova).slice(0, 10);
      const d = new Date(b.data_prova);
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        provasPorDia[dataProvaStr] = `${s.nome} — ${b.nome}`;
      }
    });
  });

  const inicioMesStr = primeiroDia.toISOString().slice(0, 10);
  const fimMesStr = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);
  const { data: logsMes } = await supabase
    .from("daily_logs")
    .select("data, estudou")
    .eq("user_id", user.id)
    .gte("data", inicioMesStr)
    .lte("data", fimMesStr);
  const estudadoPorDia: Record<string, boolean> = {};
  (logsMes || []).forEach((l) => {
    estudadoPorDia[l.data] = l.estudou;
  });

  // Tarefas do mês exibido — cobre tanto os dots do calendário quanto o
  // card "Tarefas do dia" (filtra hoje) e, na prática, a semana corrente
  // também (só escapa em transições de mês, aceitável pra essa feature).
  const tarefasPorData = await carregarTarefasIntervalo(supabase, user, inicioMesStr, fimMesStr);

  const hojeCalStr = agora.toISOString().slice(0, 10);
  const tarefasHoje = tarefasPorData[hojeCalStr] || [];
  const days: CalDay[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    let estado: CalDay["estado"] = "normal";
    let title: string | undefined;
    if (dataStr === hojeCalStr) estado = "hoje";
    else if (provasPorDia[dataStr]) {
      estado = "prova";
      title = provasPorDia[dataStr];
    } else if (estudadoPorDia[dataStr]) estado = "estudou";
    days.push({ dia, data: dataStr, estado, title, temTarefa: Boolean(tarefasPorData[dataStr]?.length) });
  }

  // ---- Aba "Semana": XP ganho por dia (Dom–Sáb da semana corrente) ----
  const diaSemanaHoje = hoje.getDay();
  const inicioSemanaDate = addDias(hoje, -diaSemanaHoje);
  const fimSemanaDate = addDias(inicioSemanaDate, 6);
  const inicioSemanaStr = toISODate(inicioSemanaDate);
  const fimSemanaStr = toISODate(fimSemanaDate);
  const { data: missoesSemana } = await supabase
    .from("missions")
    .select("data, concluida, xp_recompensa")
    .eq("user_id", user.id)
    .gte("data", inicioSemanaStr)
    .lte("data", fimSemanaStr);
  const xpPorDia: Record<string, number> = {};
  (missoesSemana || []).forEach((m) => {
    if (!m.concluida) return;
    xpPorDia[m.data] = (xpPorDia[m.data] || 0) + (m.xp_recompensa || 0);
  });

  const xpSemana = ligaEstado?.xp_semana || 0;

  // Meta semanal de XP — heurística transparente (não é alvo configurável):
  // XP planejado pras missões de hoje × nº de dias de estudo por semana.
  // Fallback pra média dos dias já pontuados quando hoje é descanso, e um
  // piso pra barra não ficar sem sentido no cold-start.
  const diasEstudoSemana = profile?.dias_disponiveis?.length || 7;
  const xpDiasComPonto = Object.values(xpPorDia).filter((v) => v > 0);
  const mediaDiaPontuado = xpDiasComPonto.length
    ? Math.round(xpDiasComPonto.reduce((a, b) => a + b, 0) / xpDiasComPonto.length)
    : 0;
  const metaDiariaXp = metasHoje.xpMetaHoje || mediaDiaPontuado || 100;
  const metaSemanalXp = Math.max(metaDiariaXp * diasEstudoSemana, xpSemana, 1);

  // Comparativo: percentil do aluno vs. todos por XP da semana.
  const { data: xpTodos } = await supabase.from("profiles").select("xp_semana");
  const valoresXp = (xpTodos || []).map((p) => p.xp_semana || 0).filter((v) => v > 0);
  let comparativo: ComparativoSemana = { percentil: null, totalAlunos: valoresXp.length };
  if (xpSemana > 0 && valoresXp.length > 0) {
    const melhores = valoresXp.filter((v) => v > xpSemana).length;
    comparativo = {
      percentil: Math.max(1, Math.round(((melhores + 1) / valoresXp.length) * 100)),
      totalAlunos: valoresXp.length,
    };
  }

  // Recorde: maior sequência de dias seguidos estudando (daily_logs inteiro).
  const { data: todosLogs } = await supabase
    .from("daily_logs")
    .select("data, estudou")
    .eq("user_id", user.id)
    .order("data");
  let melhorStreak = 0;
  let corrente = 0;
  let anterior: number | null = null;
  const UM_DIA_MS = 86400000;
  (todosLogs || []).forEach((l) => {
    if (!l.estudou) {
      corrente = 0;
      anterior = null;
      return;
    }
    const t = new Date(String(l.data).slice(0, 10)).getTime();
    corrente = anterior != null && t - anterior === UM_DIA_MS ? corrente + 1 : 1;
    anterior = t;
    if (corrente > melhorStreak) melhorStreak = corrente;
  });
  const streakAtual = profile?.streak_atual || 0;
  melhorStreak = Math.max(melhorStreak, streakAtual);

  const semana: SemanaResumo = {
    dias: Array.from({ length: 7 }).map((_, i) => {
      const d = addDias(inicioSemanaDate, i);
      const dataStr = toISODate(d);
      return {
        data: dataStr,
        label: DOW_ABREV[d.getDay()],
        dataLabel: fmtDataCurta(d),
        xpGanho: xpPorDia[dataStr] || 0,
        estudou: Boolean(xpPorDia[dataStr]),
        hoje: dataStr === hojeStr,
      };
    }),
    xpSemana,
    metaSemanalXp,
    metaDiariaXp,
    streakAtual,
    comparativo,
    recorde: { melhorStreak, streakAtual },
  };

  return {
    profile,
    ehPro: ehPro(profile),
    greeting,
    subheading,
    subjects: subjectListItems,
    missions: missionCards,
    semMissaoHoje: missaoResultado.semMissaoHoje,
    todasConcluidas,
    motivoSemMissao: missaoResultado.motivo,
    bossAlvo,
    ligaEstado,
    streakHeat,
    dayTicker,
    calendar: { monthLabel: `${MESES_PT[mes]} ${ano}`, dowOffset, days },
    tarefasHoje,
    tarefasPorData,
    metasHoje,
    semana,
  };
}

export { XP_POR_NIVEL };
