// Orquestra os dados da home num Server Component — uma passada no servidor
// em vez de várias buscas no browser (era assim no app legado, js/dashboard.js).
//
// **Repasse de 2026-09-16 — fim do motor de missões.** A home deixou de
// planejar o dia do aluno. Saíram daqui: a geração de missões do dia, o
// boss-alvo, a projeção de nota pro dia da prova e o modo de estudo (não há
// mais dois modos — a plataforma inteira é de prática livre). O que sobrou é
// o que a home ainda precisa responder: quem é o aluno, o que ele já fez hoje,
// como está a semana/liga e o que está marcado no calendário. A `missions`
// continua sendo lida, mas agora só como HISTÓRICO: toda missão é uma lista
// que o próprio aluno montou.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addDias,
  toISODate,
  fmtDataCurta,
  saudacaoPorHorario,
} from "./shared";
import { questlyGarantirSemanaLiga, questlySegundaDaSemana, QUESTLY_LIGA_INFO, type EstadoLiga } from "./liga";
import { ehPro } from "@/lib/plano/plano";
import { createAdminClient } from "@/lib/supabase/admin";
import { carregarTarefasIntervalo, type TarefaRow } from "@/lib/tarefas/tarefas-data";

/** O que a home precisa de uma linha de `subjects` (+ as provas marcadas no
 *  calendário, que hoje servem só pra pintar o mês). */
type SubjectRow = {
  id: string;
  nome: string;
  materia_id: string | null;
  nivel?: number | null;
  bosses?: { id: string; nome: string; data_prova: string }[] | null;
};

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
  foto_url: string | null;
  liga: string | null;
  // vêm do mesmo `select("*")`; declaradas porque `ehPro(profile)` as lê.
  plano?: string | null;
  plano_expira_em?: string | null;
  // idem — `hero-data.ts` lê pra saber quais distintivos o aluno escolheu
  // pro card público (ver lib/ranking/badges.ts).
  distintivos_selecionados?: string[] | null;
};

export type SubjectListItem = {
  id: string;
  nome: string;
  nivel: number;
};

export type CalDay = {
  dia: number;
  data: string;
  estado: "normal" | "hoje" | "prova" | "estudou";
  title?: string;
  temTarefa: boolean;
};

// O que o aluno FEZ hoje — não o que ele "deveria" ter feito. Desde o fim do
// motor de missões não existe meta diária: a home conta o trabalho real do dia
// (listas fechadas, questões respondidas, XP ganho) e não cobra um alvo que
// ninguém pediu. Derivado das linhas de `missions` de hoje, sem query extra.
export type MetasHoje = {
  listasConcluidas: number;
  questoesRespondidas: number;
  xpHoje: number;
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
  ligaEstado: (EstadoLiga & { nomeExibicao: string }) | null;
  calendar: { monthLabel: string; dowOffset: number; days: CalDay[] };
  /** A prova futura mais próxima que o aluno marcou no calendário — puro
   *  compromisso de agenda, igual a uma tarefa. Nada no app deriva plano,
   *  recomendação ou projeção de nota a partir dela. */
  proximaProva: { nome: string; data: string } | null;
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
//   onda 2  listas da semana, liga+comparativo, daily_logs e tarefas —
//           nenhuma depende da outra
//
// Duas leituras também foram FUNDIDAS em vez de paralelizadas, porque eram
// recortes de um mesmo conjunto: `missions` (resumo de hoje + XP da semana) e
// `daily_logs` (mês + recorde). O comparativo semanal, que puxava a coluna
// xp_semana de TODOS os perfis da base pra contar quantos estão na frente,
// virou dois COUNT com head:true — O(índice) em vez de O(nº de alunos).
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
      .select("*, bosses(id, nome, data_prova)")
      .eq("user_id", user.id),
  ]);
  const profile = profileResultado.data as ProfileRow | null;

  const primeiroNome = profile?.nome ? profile.nome.split(" ")[0] : "Aluno(a)";
  const greeting = `${saudacaoPorHorario()}, ${primeiroNome}`;

  const subjects = (subjectsRaw || []) as SubjectRow[];
  const hoje = new Date(new Date().toDateString());

  const subjectListItems: SubjectListItem[] = subjects.map((s) => ({
    id: s.id,
    nome: s.nome,
    nivel: s.nivel || 1,
  }));

  const subheading = subjects.length
    ? "Escolha o que praticar hoje — a plataforma não escolhe por você."
    : "Vamos configurar suas disciplinas.";

  // ---- Janelas de data (puras — nenhuma query, mas definem os recortes) ----
  //
  // A janela móvel de "dias de estudo" que existia aqui morreu com o ticker de
  // ritmo (ele era o painel do motor de missões). Sobrou a semana corrente,
  // que é o recorte de tudo que a home ainda mostra: o resumo de hoje e o XP
  // por dia da aba Semana.
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

  // Uma query só de `missions`, cobrindo a semana inteira: dela saem tanto o
  // resumo de hoje quanto o XP por dia da semana.
  const inicioMissoesStr = inicioSemanaStr;

  // ------------------------------------------------------------ onda 2
  const [missoesRange, blocoLiga, todosLogs, tarefasPorData] =
    await Promise.all([
      // (a) listas fechadas na janela do resumo de hoje + da semana (fundidas)
      supabase
        .from("missions")
        .select("data, concluida, xp_recompensa, qtd_questoes")
        .eq("user_id", user.id)
        .gte("data", inicioMissoesStr),

      // (b) liga (pode virar a semana) e, na sequência, o comparativo — que
      //     depende do xp_semana já normalizado por essa virada
      (async () => {
        const estadoLiga = await questlyGarantirSemanaLiga(supabase, user, () => createAdminClient());
        const xpSemana = estadoLiga?.xp_semana || 0;
        // `.eq("semana_inicio", ...)` nos DOIS counts: a virada de semana é
        // preguiçosa (sem cron), então quem não abriu o app desde segunda
        // ainda tem o xp_semana da semana PASSADA guardado na coluna. Sem o
        // filtro, esses pontos velhos entravam na conta e o comparativo
        // ("você está entre os X% da semana") media o aluno contra semanas
        // que já acabaram. Mesmo filtro que o ranking semanal usa.
        const semanaAtual = estadoLiga?.semana_inicio ?? questlySegundaDaSemana(new Date());
        const [{ count: totalAlunos }, { count: melhores }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("semana_inicio", semanaAtual)
            .gt("xp_semana", 0),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("semana_inicio", semanaAtual)
            .gt("xp_semana", xpSemana),
        ]);
        const total = totalAlunos || 0;
        const comparativo: ComparativoSemana =
          xpSemana > 0 && total > 0
            ? { percentil: Math.max(1, Math.round((((melhores || 0) + 1) / total) * 100)), totalAlunos: total }
            : { percentil: null, totalAlunos: total };
        return { estadoLiga, xpSemana, comparativo };
      })(),

      // (c) daily_logs inteiro: alimenta o calendário do mês E o recorde de
      //     streak — antes eram duas queries do mesmo lugar.
      supabase.from("daily_logs").select("data, estudou").eq("user_id", user.id).order("data"),

      // (d) tarefas do mês exibido
      carregarTarefasIntervalo(supabase, user, inicioMesStr, fimMesStr),
    ]);

  // ---- O que já foi feito hoje (listas fechadas, não metas) ----
  const fechadasHoje = (missoesRange.data || []).filter(
    (m) => m.concluida && String(m.data).slice(0, 10) === hojeStr,
  );
  const metasHoje: MetasHoje = {
    listasConcluidas: fechadasHoje.length,
    questoesRespondidas: fechadasHoje.reduce((acc, m) => acc + (m.qtd_questoes || 0), 0),
    xpHoje: fechadasHoje.reduce((acc, m) => acc + (m.xp_recompensa || 0), 0),
  };

  // ---- Liga ----
  const estadoLiga = blocoLiga.estadoLiga;
  const ligaEstado = estadoLiga
    ? {
        ...estadoLiga,
        nomeExibicao: QUESTLY_LIGA_INFO[estadoLiga.liga]?.nome || QUESTLY_LIGA_INFO.bronze.nome,
      }
    : null;

  // ---- daily_logs: um único conjunto, duas leituras ----
  const logs = (todosLogs.data || []) as { data: string; estudou: boolean }[];
  const estudouPorData: Record<string, boolean> = {};
  logs.forEach((l) => {
    estudouPorData[String(l.data).slice(0, 10)] = l.estudou;
  });

  // ---- Próxima prova marcada (agenda, não motor) ----
  const proximaProva =
    subjects
      .flatMap((s) => (s.bosses || []).map((b) => ({ nome: `${s.nome} — ${b.nome}`, data: String(b.data_prova).slice(0, 10) })))
      .filter((p) => p.data >= hojeStr)
      .sort((a, b) => a.data.localeCompare(b.data))[0] || null;

  // ---- Calendário do mês ----
  // Prova aqui é COMPROMISSO DE AGENDA, não entrada de motor: o aluno marca a
  // data em /calendario e ela pinta o dia. Nada no app lê essa data pra
  // recomendar, projetar nota ou montar plano — esse motor não existe mais.
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
  const metaDiariaXp = mediaDiaPontuado || 100;
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
    ligaEstado,
    calendar: { monthLabel: `${MESES_PT[mes]} ${ano}`, dowOffset, days },
    proximaProva,
    tarefasHoje,
    tarefasPorData,
    metasHoje,
    semana,
  };
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
