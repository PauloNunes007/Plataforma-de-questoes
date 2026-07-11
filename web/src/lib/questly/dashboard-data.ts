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
  questlyEhMestre,
  questlyNormalizarDia,
  saudacaoPorHorario,
} from "./shared";
import { questlyGerarMissoesDoDia, type Mission, type Subject } from "./mission-engine";
import { questlyGarantirSemanaLiga, QUESTLY_LIGA_INFO, type EstadoLiga } from "./liga";

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
  subjectNome: string;
  bossNome: string;
  dataProva: string;
  diasAteProva: number;
  preparoPercentual: number;
  chanceAprovacao: number | null;
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
  estado: "normal" | "hoje" | "prova" | "estudou";
  title?: string;
};

export type DashboardData = {
  profile: ProfileRow | null;
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
    .select("*, bosses(id, nome, data_prova, preparo_percentual)")
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

  const bossAlvo: BossAlvo | null = alvo
    ? {
        subjectNome: alvo.subject.nome,
        bossNome: alvo.boss.nome,
        dataProva: alvo.boss.data_prova,
        diasAteProva: diasAte(alvo.boss.data_prova),
        preparoPercentual: alvo.boss.preparo_percentual || 0,
        chanceAprovacao: alvo.subject.chance_aprovacao != null ? Math.round(alvo.subject.chance_aprovacao) : null,
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
  const estadoLiga = await questlyGarantirSemanaLiga(supabase, user);
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

  const hojeCalStr = agora.toISOString().slice(0, 10);
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
    days.push({ dia, estado, title });
  }

  return {
    profile,
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
  };
}

export { XP_POR_NIVEL };
