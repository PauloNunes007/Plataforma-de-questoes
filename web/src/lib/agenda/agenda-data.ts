// Carga de UM mês do calendário: os dias pintados, o que está marcado em cada
// um, as provas que caem no mês e quanto de cada META de questões já foi
// cumprido.
//
// Mora aqui (e não dentro de `actions.ts`) porque duas entradas precisam
// exatamente da mesma leitura: a página `/calendario`, que renderiza o mês
// corrente no servidor, e `carregarMesAgendaAction`, chamada quando o aluno
// navega pra outro mês. Duplicar isso significaria duas versões da regra de
// "quando um dia é dia de prova".
//
// Deliberadamente NÃO reusa `carregarDadosDashboard`: aquilo gera as missões
// do dia, projeta nota e calcula liga — nada disso muda por olhar setembro, e
// recarregar a home inteira a cada clique de seta seria caro e traria dados
// que o calendário não usa.
import type { SupabaseClient } from "@supabase/supabase-js";
import { carregarTarefasIntervalo, type TarefaRow } from "@/lib/tarefas/tarefas-data";
import { emLotes } from "@/lib/supabase/paginado";
import type { CalDay } from "@/lib/questly/dashboard-data";

export const MESES_PT = [
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

/** Uma prova (boss) que cai num dia do mês exibido. */
export type ProvaDia = {
  bossId: string;
  subjectId: string;
  subjectNome: string;
  nome: string;
  data: string;
};

/** Um simulado que o aluno fez naquele dia. */
export type SimuladoDia = {
  id: string;
  titulo: string;
  status: "em_andamento" | "concluido" | "abandonado";
  acertos: number | null;
  total: number | null;
  nota: number | null;
  tempoGastoSeg: number | null;
};

/** Uma lista de questões daquele dia (Banco de Questões, prática de tópico,
 *  recap ou desafio de recuperação). */
export type MissaoDia = {
  id: string;
  subjectNome: string | null;
  avulsa: boolean;
  concluida: boolean;
  /** questões que a missão tem; `respondidas` é quanto o aluno de fato fez */
  alvo: number;
  respondidas: number;
  acertos: number;
  xp: number;
};

/**
 * O que o aluno REALMENTE fez num dia — o contraponto de `tarefas`, que é o
 * que ele planejou. Tudo aqui é recontado na leitura, pelos mesmos caminhos
 * que o resto do app usa; nada é um contador gravado.
 */
export type HistoricoDia = {
  missoes: MissaoDia[];
  simulados: SimuladoDia[];
  /** questões respondidas no dia (as que passaram por uma missão) */
  questoes: number;
  acertos: number;
  /** XP das missões concluídas do dia */
  xp: number;
};

export type MesAgenda = {
  ano: number;
  /** 0–11, como `Date.getMonth()`. */
  mes: number;
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  tarefas: Record<string, TarefaRow[]>;
  /** data → prova daquele dia (um boss por dia; o último lido vence). */
  provas: Record<string, ProvaDia>;
  /**
   * Dias do mês com estudo registrado em `daily_logs`. Vem daqui, e não de
   * contar `days` por estado, porque HOJE tem estado "hoje" mesmo tendo
   * estudado — contar pelo estado perderia o dia corrente.
   */
  diasEstudados: number;
  /**
   * data → subjectId → questões que o aluno realmente respondeu naquele dia
   * naquela disciplina. É o PROGRESSO das metas, recontado a cada leitura em
   * vez de guardado numa coluna: um contador gravado seria um segundo lugar
   * pra mesma verdade (e o jeito óbvio de forjá-la).
   */
  questoesPorDia: Record<string, Record<string, number>>;
  /** data → o que aconteceu naquele dia (missões, simulados, acerto). */
  historico: Record<string, HistoricoDia>;
};

export function isoDia(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Teto de navegação: ±5 anos. Sem ele um ano digitado errado viraria uma
 *  query de intervalo gigantesco. */
export function mesValido(ano: number, mes: number): boolean {
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 0 || mes > 11) return false;
  return Math.abs(ano - new Date().getFullYear()) <= 5;
}

type SubjectComBosses = {
  id: string;
  nome: string;
  bosses: { id: string; nome: string; data_prova: string }[] | null;
};

export async function carregarMesAgenda(
  supabase: SupabaseClient,
  user: { id: string },
  ano: number,
  mes: number,
): Promise<MesAgenda | null> {
  if (!mesValido(ano, mes)) return null;

  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const inicio = isoDia(ano, mes, 1);
  const fim = isoDia(ano, mes, totalDias);

  // `simulados_aluno` não tem coluna de dia: só timestamps. A janela é aberta
  // um dia pra cada lado porque o filtro é comparado no fuso do BANCO (UTC) e
  // o dia exibido é o do ALUNO — quem termina uma prova às 22h de 30/09 é
  // 01/10 em UTC. Quem decide a que dia cada linha pertence é o `diaLocal`
  // lá embaixo, com o fuso do servidor (pinado em America/Sao_Paulo).
  const janelaIni = new Date(ano, mes, 0).toISOString();
  const janelaFim = new Date(ano, mes + 1, 2).toISOString();

  const [logsRes, bossesRes, tarefas, missoesRes, simuladosRes] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("data, estudou")
      .eq("user_id", user.id)
      .gte("data", inicio)
      .lte("data", fim),
    // Provas do mês. Lidas pelo MESMO caminho que o dashboard usa (subjects
    // com bosses aninhados, filtrando por user_id no subject): `bosses` não
    // tem user_id próprio, e este é o acesso que a RLS já cobre.
    supabase.from("subjects").select("id, nome, bosses(id, nome, data_prova)").eq("user_id", user.id),
    carregarTarefasIntervalo(supabase, user, inicio, fim),
    supabase
      .from("missions")
      .select("id, subject_id, data, qtd_questoes, xp_recompensa, concluida, avulsa, subjects(nome)")
      .eq("user_id", user.id)
      .gte("data", inicio)
      .lte("data", fim),
    supabase
      .from("simulados_aluno")
      .select("id, titulo, status, acertos, total, nota, tempo_gasto_seg, iniciado_em, concluido_em, criado_em")
      .eq("user_id", user.id)
      .gte("criado_em", janelaIni)
      .lt("criado_em", janelaFim),
  ]);

  const estudouPorData: Record<string, boolean> = {};
  ((logsRes.data || []) as { data: string; estudou: boolean }[]).forEach((l) => {
    estudouPorData[String(l.data).slice(0, 10)] = l.estudou;
  });

  const provas: Record<string, ProvaDia> = {};
  ((bossesRes.data || []) as unknown as SubjectComBosses[]).forEach((s) => {
    (s.bosses || []).forEach((b) => {
      if (!b.data_prova) return;
      const dataStr = String(b.data_prova).slice(0, 10);
      if (dataStr < inicio || dataStr > fim) return;
      provas[dataStr] = {
        bossId: b.id,
        subjectId: s.id,
        subjectNome: s.nome,
        nome: b.nome,
        data: dataStr,
      };
    });
  });

  const atividade = await montarAtividade(
    supabase,
    user,
    (missoesRes.data || []) as unknown as MissaoLinha[],
    (simuladosRes.data || []) as unknown as SimuladoLinha[],
    inicio,
    fim,
  );

  const agora = new Date();
  const hojeStr = isoDia(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const days: CalDay[] = [];
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = isoDia(ano, mes, dia);
    let estado: CalDay["estado"] = "normal";
    let title: string | undefined;
    if (dataStr === hojeStr) estado = "hoje";
    else if (provas[dataStr]) {
      estado = "prova";
      title = `${provas[dataStr].subjectNome} — ${provas[dataStr].nome}`;
    } else if (estudouPorData[dataStr]) estado = "estudou";
    days.push({ dia, data: dataStr, estado, title, temTarefa: Boolean(tarefas[dataStr]?.length) });
  }

  return {
    ano,
    mes,
    monthLabel: `${MESES_PT[mes]} ${ano}`,
    dowOffset: new Date(ano, mes, 1).getDay(),
    days,
    tarefas,
    provas,
    diasEstudados: Object.values(estudouPorData).filter(Boolean).length,
    questoesPorDia: atividade.questoesPorDia,
    historico: atividade.historico,
  };
}

type MissaoLinha = {
  id: string;
  subject_id: string | null;
  data: string;
  qtd_questoes: number | null;
  xp_recompensa: number | null;
  concluida: boolean | null;
  avulsa: boolean | null;
  subjects: { nome: string } | null;
};

type SimuladoLinha = {
  id: string;
  titulo: string | null;
  status: SimuladoDia["status"] | null;
  acertos: number | null;
  total: number | null;
  nota: number | null;
  tempo_gasto_seg: number | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  criado_em: string;
};

/** Timestamp → dia do aluno. O fuso do processo é fixado em America/Sao_Paulo
 *  (`next.config.ts`), então a meia-noite local aqui é a mesma que a dele. */
function diaLocal(ts: string): string {
  const d = new Date(ts);
  return isoDia(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * O que aconteceu em cada dia do intervalo: missões, simulados e as questões
 * respondidas — estas últimas por (dia, disciplina) também, que é o PROGRESSO
 * das metas.
 *
 * As duas saídas vêm da mesma varredura de propósito: o progresso da meta e o
 * "5 de 8 questões nessa missão" são recortes da MESMA leitura de
 * `question_attempts`, e separá-los significaria puxar as tentativas do mês
 * duas vezes.
 *
 * O caminho é `question_attempts.mission_id` → `missions (subject_id, data)`,
 * e não a data da própria tentativa: `missions.data` é o que o app inteiro
 * chama de "dia de estudo" (é como a ofensiva, o heatmap e as metas do dia já
 * contam), enquanto `created_at` é timestamptz e jogaria a virada da noite
 * pro dia seguinte em UTC. O simulado é a exceção — ele não gera missão nem
 * tentativa (é self-contained de propósito), então só resta o timestamp dele.
 */
async function montarAtividade(
  supabase: SupabaseClient,
  user: { id: string },
  missoes: MissaoLinha[],
  simulados: SimuladoLinha[],
  inicio: string,
  fim: string,
): Promise<{
  questoesPorDia: Record<string, Record<string, number>>;
  historico: Record<string, HistoricoDia>;
}> {
  const historico: Record<string, HistoricoDia> = {};
  const doDia = (data: string): HistoricoDia =>
    (historico[data] ||= { missoes: [], simulados: [], questoes: 0, acertos: 0, xp: 0 });

  const infoMissao = new Map<string, { subjectId: string | null; data: string; item: MissaoDia }>();
  missoes.forEach((m) => {
    const data = String(m.data).slice(0, 10);
    const item: MissaoDia = {
      id: m.id,
      subjectNome: m.subjects?.nome ?? null,
      avulsa: Boolean(m.avulsa),
      concluida: Boolean(m.concluida),
      alvo: m.qtd_questoes ?? 0,
      respondidas: 0,
      acertos: 0,
      // XP só entra quando a missão fechou: é quando o app de fato paga.
      xp: m.concluida ? (m.xp_recompensa ?? 0) : 0,
    };
    infoMissao.set(m.id, { subjectId: m.subject_id, data, item });
    doDia(data).missoes.push(item);
  });

  const questoesPorDia: Record<string, Record<string, number>> = {};
  if (infoMissao.size > 0) {
    const tentativas = await emLotes<string, { mission_id: string | null; correta: boolean | null }>(
      Array.from(infoMissao.keys()),
      (lote) =>
        supabase
          .from("question_attempts")
          .select("mission_id, correta")
          .eq("user_id", user.id)
          .in("mission_id", lote),
    );

    tentativas.forEach((t) => {
      const info = t.mission_id ? infoMissao.get(t.mission_id) : null;
      if (!info) return;
      const dia = doDia(info.data);
      info.item.respondidas += 1;
      dia.questoes += 1;
      if (t.correta) {
        info.item.acertos += 1;
        dia.acertos += 1;
      }
      if (info.subjectId) {
        const porSubject = (questoesPorDia[info.data] ||= {});
        porSubject[info.subjectId] = (porSubject[info.subjectId] || 0) + 1;
      }
    });
  }

  simulados.forEach((s) => {
    const data = diaLocal(s.concluido_em || s.iniciado_em || s.criado_em);
    if (data < inicio || data > fim) return;
    doDia(data).simulados.push({
      id: s.id,
      titulo: s.titulo?.trim() || "Simulado",
      status: s.status ?? "em_andamento",
      acertos: s.acertos,
      total: s.total,
      nota: s.nota,
      tempoGastoSeg: s.tempo_gasto_seg,
    });
  });

  Object.values(historico).forEach((h) => {
    h.xp = h.missoes.reduce((soma, m) => soma + m.xp, 0);
  });

  return { questoesPorDia, historico };
}
