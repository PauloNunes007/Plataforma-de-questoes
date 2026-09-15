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
import { contagemDosTopicos } from "@/lib/questly/contagem-questoes";

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
  liga: string | null;
  // vêm do mesmo `select("*")`; declaradas porque `ehPro(profile)` as lê.
  plano?: string | null;
  plano_expira_em?: string | null;
  // idem — `hero-data.ts` lê pra saber quais distintivos o aluno escolheu
  // pro card público (ver lib/ranking/badges.ts).
  distintivos_selecionados?: string[] | null;
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
  ligaEstado: (EstadoLiga & { nomeExibicao: string }) | null;
  streakHeat: boolean[];
  dayTicker: DiaTicker[];
  calendar: { monthLabel: string; dowOffset: number; days: CalDay[] };
  tarefasHoje: TarefaRow[];
  tarefasPorData: Record<string, TarefaRow[]>;
  metasHoje: MetasHoje;
  semana: SemanaResumo;
};
// PERFORMANCE (repasse 2026-09-10): esta função já foi uma escada de ~16
// `await` em série — cada um um round-trip até o Supabase. Somando o layout
// e as outras cargas da página, voltar pra home depois de uma questão levava
// segundos, e o custo crescia com o nº de disciplinas. A lógica não mudou:
// o que mudou é que só existem TRÊS ondas de espera, e dentro de cada uma
// tudo que é independente sobe junto:
//
//   onda 1  perfil + disciplinas
//   onda 2  missões do dia (precisa do perfil pra saber o orçamento do dia)
//   onda 3  progresso, projeção do Boss, missões da janela, liga+comparativo,
//           daily_logs e tarefas — nenhuma depende da outra
//
// Três leituras também foram FUNDIDAS em vez de paralelizadas, porque eram
// recortes de um mesmo conjunto: `missions` (ticker + semana), `daily_logs`
// (heatmap + mês + recorde) e o comparativo semanal, que puxava a coluna
// xp_semana de TODOS os perfis da base pra contar quantos estão na frente —
// agora são dois COUNT com head:true, O(índice) em vez de O(nº de alunos).
export async function carregarDadosDashboard(
  supabase: SupabaseClient,
  user: { id: string },
  /** Perfil já lido pela página (o hero da home precisa dele também). Sem
   *  isso, o `page.tsx` teria que esperar o dashboard inteiro terminar antes
   *  de começar o hero — ver o comentário na home. */
  profilePrefetch?: ProfileRow | null,
): Promise<DashboardData> {
  // ------------------------------------------------------------ onda 1
  const [profileResultado, { data: subjectsRaw }] = await Promise.all([
    profilePrefetch !== undefined
      ? Promise.resolve({ data: profilePrefetch })
      : supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("subjects")
      .select("*, bosses(id, nome, data_prova, preparo_percentual, topico_ids)")
      .eq("user_id", user.id),
  ]);
  const profile = profileResultado.data as ProfileRow | null;

  const primeiroNome = profile?.nome ? profile.nome.split(" ")[0] : "Aluno(a)";
  const greeting = `${saudacaoPorHorario()}, ${primeiroNome}`;

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

  // ------------------------------------------------------------ onda 2
  // Missões do dia (mission-engine) — recebe as disciplinas já lidas acima
  // em vez de repetir a mesma query.
  const missaoResultado = await questlyGerarMissoesDoDia(supabase, user, profile, subjects);
  const missoes = missaoResultado.missoes;
  const todasConcluidas = missoes.length > 0 && missoes.every((m) => m.concluida);

  // ---- Metas de hoje — tudo derivado de missoes, sem query nova ----
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

  const escopoProva =
    alvo?.boss.topico_ids && alvo.boss.topico_ids.length > 0 ? new Set(alvo.boss.topico_ids) : null;

  // ---- Janelas de data (puras — nenhuma query, mas definem os recortes) ----
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
  const inicioJanelaStr = toISODate(janela[0]);
  const hojeStr = toISODate(hoje);

  const diaSemanaHoje = hoje.getDay();
  const inicioSemanaDate = addDias(hoje, -diaSemanaHoje);
  const fimSemanaDate = addDias(inicioSemanaDate, 6);
  const inicioSemanaStr = toISODate(inicioSemanaDate);
  const fimSemanaStr = toISODate(fimSemanaDate);

  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dowOffset = primeiroDia.getDay();
  const inicioMesStr = toISODate(primeiroDia);
  const fimMesStr = toISODate(new Date(ano, mes + 1, 0));

  // `missions` era lida duas vezes (ticker de dias e XP da semana). Uma query
  // só, cobrindo a mais antiga das duas janelas, e o recorte fica em memória.
  const inicioMissoesStr = inicioJanelaStr < inicioSemanaStr ? inicioJanelaStr : inicioSemanaStr;

  // ------------------------------------------------------------ onda 3
  const [progressoPorTopico, blocoBoss, missoesRange, blocoLiga, todosLogs, tarefasPorData] =
    await Promise.all([
      // (a) progresso nos tópicos das missões de hoje — pro selo "Mestre"
      (async (): Promise<Record<string, { taxa_acerto: number; num_questoes_respondidas: number }>> => {
        if (topicIdsRelevantes.length === 0) return {};
        const { data: progressos } = await supabase
          .from("aluno_topico_progresso")
          .select("topico_id, taxa_acerto, num_questoes_respondidas")
          .eq("user_id", user.id)
          .in("topico_id", topicIdsRelevantes);
        const mapa: Record<string, { taxa_acerto: number; num_questoes_respondidas: number }> = {};
        (progressos || []).forEach((p) => {
          mapa[p.topico_id] = p;
        });
        return mapa;
      })(),

      // (b) projeção pra data da prova + GPS
      carregarProjecaoBoss(supabase, user, profile, alvo, escopoProva),

      // (c) missões da janela do ticker + da semana (fundidas)
      supabase
        .from("missions")
        .select("data, concluida, xp_recompensa")
        .eq("user_id", user.id)
        .gte("data", inicioMissoesStr),

      // (d) liga (pode virar a semana) e, na sequência, o comparativo — que
      //     depende do xp_semana já normalizado por essa virada
      (async () => {
        const estadoLiga = await questlyGarantirSemanaLiga(supabase, user, () => createAdminClient());
        const xpSemana = estadoLiga?.xp_semana || 0;
        const [{ count: totalAlunos }, { count: melhores }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).gt("xp_semana", 0),
          supabase.from("profiles").select("id", { count: "exact", head: true }).gt("xp_semana", xpSemana),
        ]);
        const total = totalAlunos || 0;
        const comparativo: ComparativoSemana =
          xpSemana > 0 && total > 0
            ? { percentil: Math.max(1, Math.round((((melhores || 0) + 1) / total) * 100)), totalAlunos: total }
            : { percentil: null, totalAlunos: total };
        return { estadoLiga, xpSemana, comparativo };
      })(),

      // (e) daily_logs inteiro: alimenta o heatmap de 10 dias, o calendário do
      //     mês E o recorde de streak — antes eram três queries do mesmo lugar.
      supabase.from("daily_logs").select("data, estudou").eq("user_id", user.id).order("data"),

      // (f) tarefas do mês exibido
      carregarTarefasIntervalo(supabase, user, inicioMesStr, fimMesStr),
    ]);

  const missionCards: MissionCardData[] = missoes.map((m) => {
    const topicIds = m.topic_ids || [];
    const mestre =
      !m.concluida && topicIds.length > 0 && topicIds.every((id) => questlyEhMestre(progressoPorTopico[id]));
    return { ...m, mestre };
  });

  const bossAlvo: BossAlvo | null = alvo
    ? {
        subjectId: alvo.subject.id,
        subjectNome: alvo.subject.nome,
        bossNome: alvo.boss.nome,
        dataProva: alvo.boss.data_prova,
        diasAteProva: diasAte(alvo.boss.data_prova),
        preparoPercentual: alvo.boss.preparo_percentual || 0,
        chanceAprovacao: alvo.subject.chance_aprovacao != null ? Math.round(alvo.subject.chance_aprovacao) : null,
        notaProjetada: blocoBoss.notaProjetada,
        emRiscoCount: blocoBoss.emRiscoCount,
        rota: blocoBoss.rota,
        escopoDefinido: escopoProva != null,
        escopoTopicos: escopoProva ? escopoProva.size : null,
      }
    : null;

  // ---- Ticker de dias (ritmo recente — substitui a trilha de nós) ----
  const cumpriuNoDia: Record<string, boolean> = {};
  (missoesRange.data || []).forEach((m) => {
    if (m.concluida) cumpriuNoDia[String(m.data).slice(0, 10)] = true;
  });

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
  const estadoLiga = blocoLiga.estadoLiga;
  const ligaEstado = estadoLiga
    ? {
        ...estadoLiga,
        nomeExibicao: QUESTLY_LIGA_INFO[estadoLiga.liga]?.nome || QUESTLY_LIGA_INFO.bronze.nome,
      }
    : null;

  // ---- daily_logs: um único conjunto, três leituras ----
  const logs = (todosLogs.data || []) as { data: string; estudou: boolean }[];
  const estudouPorData: Record<string, boolean> = {};
  logs.forEach((l) => {
    estudouPorData[String(l.data).slice(0, 10)] = l.estudou;
  });

  const streakHeat: boolean[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    streakHeat.push(Boolean(estudouPorData[toISODate(d)]));
  }

  // ---- Calendário do mês ----
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

  const hojeCalStr = toISODate(agora);
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
    } else if (estudouPorData[dataStr]) estado = "estudou";
    days.push({ dia, data: dataStr, estado, title, temTarefa: Boolean(tarefasPorData[dataStr]?.length) });
  }

  // ---- Aba "Semana": XP ganho por dia (Dom–Sáb da semana corrente) ----
  const xpPorDia: Record<string, number> = {};
  (missoesRange.data || []).forEach((m) => {
    if (!m.concluida) return;
    const dataStr = String(m.data).slice(0, 10);
    if (dataStr < inicioSemanaStr || dataStr > fimSemanaStr) return;
    xpPorDia[dataStr] = (xpPorDia[dataStr] || 0) + (m.xp_recompensa || 0);
  });

  const xpSemana = blocoLiga.xpSemana;

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

  // Recorde: maior sequência de dias seguidos estudando (mesmo daily_logs).
  let melhorStreak = 0;
  let corrente = 0;
  let anterior: number | null = null;
  const UM_DIA_MS = 86400000;
  logs.forEach((l) => {
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
    comparativo: blocoLiga.comparativo,
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

type ProjecaoBoss = {
  notaProjetada: number | null;
  emRiscoCount: number;
  rota: RotaAprovacao | null;
};

// Projeção pra data da prova (motor): que nota o aluno tira no dia D se nada
// mudar, quantos tópicos chegam fracos lá, e onde investir os minutos de hoje.
// Escopo: o que o aluno marcou que CAI NESTA prova (bosses.topico_ids) — sem
// escopo definido, fallback pra flag global cai_na_prova da ementa (menos
// preciso; o card avisa). Sempre sem os 'pulado'.
//
// Extraída de carregarDadosDashboard pra rodar como um bloco só dentro do
// Promise.all da onda 3. Por dentro ela ainda é sequencial onde precisa ser
// (os ids dos tópicos definem as duas queries seguintes), mas o modelo de ML
// sobe junto com a lista de tópicos, e progresso + questões sobem juntos.
async function carregarProjecaoBoss(
  supabase: SupabaseClient,
  user: { id: string },
  profile: ProfileRow | null,
  alvo: { subject: Subject; boss: { data_prova: string } } | undefined,
  escopoProva: Set<string> | null,
): Promise<ProjecaoBoss> {
  const vazio: ProjecaoBoss = { notaProjetada: null, emRiscoCount: 0, rota: null };
  if (!alvo || !alvo.subject.materia_id) return vazio;

  const [{ data: topicosMateria }, modeloMl] = await Promise.all([
    supabase.from("topicos").select("id, nome, cai_na_prova").eq("materia_id", alvo.subject.materia_id),
    carregarModeloAtivo(supabase),
  ]);

  const topicosProva = (topicosMateria || []).filter((t) =>
    escopoProva ? escopoProva.has(t.id) : t.cai_na_prova,
  );
  const idsProva = topicosProva.map((t) => t.id);
  if (idsProva.length === 0) return vazio;

  const nomePorId: Record<string, string> = {};
  topicosProva.forEach((t) => (nomePorId[t.id] = t.nome));

  // Precisa do progresso do aluno E do tempo médio/nº de questões por tópico;
  // as duas leituras saem dos mesmos ids.
  const [{ data: progProva }, contagensProva] = await Promise.all([
    supabase
      .from("aluno_topico_progresso")
      .select("topico_id, status, maestria, estabilidade, taxa_acerto, num_questoes_respondidas, ultima_revisao")
      .eq("user_id", user.id)
      .in("topico_id", idsProva),
    // Mesmo recorte do mission-engine: a estimativa de tempo/volume da prova
    // fala do que o aluno vai praticar, e aprofundamento não é sorteado.
    // A view já entrega o total e a média de tempo por tópico — antes isso
    // baixava uma linha por questão da matéria só pra tirar dois números, e
    // batia no teto de 1000 do PostgREST em matéria grande.
    contagemDosTopicos(supabase, idsProva),
  ]);

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
  const dataProvaMs = new Date(alvo.boss.data_prova).getTime();
  const agoraMs = Date.now();
  const projecao = projetarProvaComRede(modeloMl, topicosParaProjecao, dataProvaMs, agoraMs);

  // ---- GPS: rota Δnota/min pros minutos de hoje ----
  // Só tópicos com questão entram na rota — os demais seguem na projeção.
  const topicosRota: TopicoRota[] = topicosParaProjecao.map((t) => {
    const c = contagensProva.get(t.id);
    return {
      ...t,
      nome: nomePorId[t.id] || "Tópico",
      questoesDisponiveis: c?.totalRegular ?? 0,
      tempoMedioSeg: c?.tempoMedioSeg ?? null,
    };
  });

  // Orçamento = tempo diário configurado (com piso/teto sensatos);
  // é uma recomendação pro dia, não um contrato.
  const tempoRotaMin = Math.min(180, Math.max(15, profile?.tempo_diario_min || 60));
  const rota = questlyRotaAprovacao({
    topicos: topicosRota,
    dataProvaMs,
    agoraMs,
    tempoDisponivelMin: tempoRotaMin,
    calcularForca: (t) => forcaTopicoComRede(modeloMl, t, dataProvaMs, agoraMs),
  });

  return { notaProjetada: projecao.notaProjetada, emRiscoCount: projecao.emRisco.length, rota };
}

/** Leitura única do perfil, compartilhada pela home entre o hero e o
 *  carregamento do dashboard (que a recebe via `profilePrefetch`). */
export async function carregarPerfilDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return (data as ProfileRow | null) ?? null;
}

export { XP_POR_NIVEL };
