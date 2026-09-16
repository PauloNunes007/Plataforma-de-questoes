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
import { questlyGerarMissoesDoDia, type Mission, type MissoesDoDiaResultado, type Subject } from "./mission-engine";
import { questlyGarantirSemanaLiga, QUESTLY_LIGA_INFO, type EstadoLiga } from "./liga";
import { carregarModeloAtivo, projetarProvaComRede } from "@/lib/ml/inferencia";
import {
  questlyMotivoTopico,
  questlyPorqueDaMissao,
  type ProgressoTopico,
  type TopicoDaMissao,
} from "./plano-do-dia";
import { ehPro } from "@/lib/plano/plano";
import { questlyModoEstudo, type ModoEstudo } from "./modo-estudo";
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
  liga: string | null;
  // vêm do mesmo `select("*")`; declaradas porque `ehPro(profile)` as lê.
  plano?: string | null;
  plano_expira_em?: string | null;
  // idem — `hero-data.ts` lê pra saber quais distintivos o aluno escolheu
  // pro card público (ver lib/ranking/badges.ts).
  distintivos_selecionados?: string[] | null;
  /** 'guiado' (padrão) | 'livre' — ver lib/questly/modo-estudo.ts e
   *  supabase_modo_estudo.sql. No modo livre a home não gera missão, não
   *  projeta prova e não mostra Boss. */
  modo_estudo?: string | null;
};

export type MissionCardData = Mission & {
  mestre: boolean;
  /** Os tópicos da missão com NOME e MOTIVO — é o que substituiu o cartão do
   *  GPS: a explicação vive dentro da própria missão (ver plano-do-dia.ts). */
  topicos: TopicoDaMissao[];
  /** Uma linha explicando por que é ISSO hoje. */
  porque: string;
};

/** Missão que o aluno empurrou pra frente (missions.adiada_para). */
export type MissaoAdiada = {
  id: string;
  subjectNome: string | null;
  para: string;
};

/** Disciplina sem missão hoje, oferecida como troca. */
export type AlternativaDoDia = {
  id: string;
  nome: string;
  naGradeDeHoje: boolean;
};

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
  missoesAdiadas: MissaoAdiada[];
  alternativasDoDia: AlternativaDoDia[];
  /** 'guiado' | 'livre'. No 'livre', missions/bossAlvo vêm vazios e a home
   *  esconde o ecossistema inteiro de trajetória. */
  modoEstudo: ModoEstudo;
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
  //
  // No modo LIVRE o motor nem roda: além de não haver onde mostrar o
  // resultado, gerar missão escreveria uma linha em `missions` todo dia pra
  // um aluno que não pediu trajetória nenhuma.
  const modoEstudo = questlyModoEstudo(profile);
  const guiado = modoEstudo === "guiado";
  const missaoResultado: MissoesDoDiaResultado = guiado
    ? await questlyGerarMissoesDoDia(supabase, user, profile, subjects)
    : { missoes: [], semMissaoHoje: false, adiadas: [], alternativas: [] };
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
  // Só existe no modo guiado: no livre não há campanha por data de prova.
  const alvo = !guiado
    ? undefined
    : subjects
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
  const [blocoTopicos, blocoBoss, missoesRange, blocoLiga, todosLogs, tarefasPorData] =
    await Promise.all([
      // (a) tópicos das missões de hoje: progresso (selo "Mestre" e o MOTIVO de
      //     cada tópico estar ali) + nome. O nome é o que permitiu tirar o
      //     cartão do GPS da home: a missão passou a dizer o assunto e o
      //     porquê dele em vez de listar ids de tópico — ver plano-do-dia.ts.
      (async (): Promise<{
        progresso: Record<string, ProgressoTopico>;
        nomes: Record<string, string>;
      }> => {
        if (topicIdsRelevantes.length === 0) return { progresso: {}, nomes: {} };
        const [{ data: progressos }, { data: topicosNomes }] = await Promise.all([
          supabase
            .from("aluno_topico_progresso")
            .select(
              "topico_id, taxa_acerto, num_questoes_respondidas, ultima_revisao, maestria, estabilidade",
            )
            .eq("user_id", user.id)
            .in("topico_id", topicIdsRelevantes),
          supabase.from("topicos").select("id, nome").in("id", topicIdsRelevantes),
        ]);
        const progresso: Record<string, ProgressoTopico> = {};
        (progressos || []).forEach((p) => {
          progresso[p.topico_id] = p as ProgressoTopico;
        });
        const nomes: Record<string, string> = {};
        (topicosNomes || []).forEach((t) => {
          nomes[t.id as string] = t.nome as string;
        });
        return { progresso, nomes };
      })(),

      // (b) projeção pra data da prova + GPS
      carregarProjecaoBoss(supabase, user, alvo, escopoProva),

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

  const progressoPorTopico = blocoTopicos.progresso;
  const nomePorTopico = blocoTopicos.nomes;
  const dataProvaAlvoMs = alvo ? new Date(alvo.boss.data_prova).getTime() : null;
  const agoraMsMissao = Date.now();

  const missionCards: MissionCardData[] = missoes.map((m) => {
    const topicIds = m.topic_ids || [];
    const mestre =
      !m.concluida && topicIds.length > 0 && topicIds.every((id) => questlyEhMestre(progressoPorTopico[id]));
    // A missão do boss-alvo é a única que pode falar em "dia da prova"; as
    // outras disciplinas não têm essa data e a frase não a inventa.
    const ehDoAlvo = Boolean(alvo && m.subject_id === alvo.subject.id);
    const provaMs = ehDoAlvo ? dataProvaAlvoMs : null;
    const topicos: TopicoDaMissao[] = topicIds.map((id) => ({
      id,
      nome: nomePorTopico[id] || "Tópico",
      motivo: questlyMotivoTopico(progressoPorTopico[id], provaMs, agoraMsMissao),
    }));
    const porque = questlyPorqueDaMissao(
      topicos,
      ehDoAlvo && alvo ? diasAte(alvo.boss.data_prova) : null,
    );
    return { ...m, mestre, topicos, porque };
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
  // No modo livre o aluno não segue prova nenhuma — as datas que por acaso
  // existam no banco (de antes de ele desligar a trajetória) não pintam o mês.
  const provasPorDia: Record<string, string> = {};
  (guiado ? subjects : []).forEach((s) => {
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
    missoesAdiadas: missaoResultado.adiadas.map((m) => ({
      id: m.id,
      subjectNome: m.subjects?.nome ?? null,
      para: String(m.adiada_para).slice(0, 10),
    })),
    alternativasDoDia: missaoResultado.alternativas,
    modoEstudo,
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
};

// Projeção pra data da prova (motor): que nota o aluno tira no dia D se nada
// mudar e quantos tópicos chegam fracos lá.
// Escopo: o que o aluno marcou que CAI NESTA prova (bosses.topico_ids) — sem
// escopo definido, fallback pra flag global cai_na_prova da ementa (menos
// preciso; o card avisa). Sempre sem os 'pulado'.
//
// Extraída de carregarDadosDashboard pra rodar como um bloco só dentro do
// Promise.all da onda 3. Por dentro ela ainda é sequencial onde precisa ser
// (os ids dos tópicos definem a query seguinte), mas o modelo de ML sobe
// junto com a lista de tópicos.
async function carregarProjecaoBoss(
  supabase: SupabaseClient,
  user: { id: string },
  alvo: { subject: Subject; boss: { data_prova: string } } | undefined,
  escopoProva: Set<string> | null,
): Promise<ProjecaoBoss> {
  const vazio: ProjecaoBoss = { notaProjetada: null, emRiscoCount: 0 };
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

  // Repasse de 2026-09-16: a contagem de questões por tópico saiu daqui junto
  // com o cartão do GPS — ela só servia pra dimensionar a rota Δnota/min. A
  // projeção da nota nunca precisou dela.
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
  const dataProvaMs = new Date(alvo.boss.data_prova).getTime();
  const agoraMs = Date.now();
  const projecao = projetarProvaComRede(modeloMl, topicosParaProjecao, dataProvaMs, agoraMs);

  return { notaProjetada: projecao.notaProjetada, emRiscoCount: projecao.emRisco.length };
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
