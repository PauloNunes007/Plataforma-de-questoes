// Loaders do Modo Aprovação — mesmo padrão dos *-data.ts das outras
// features: recebem o SupabaseClient e não conhecem sessão. A TZ do
// servidor está pinada em America/Sao_Paulo (next.config.ts), então
// "hoje" local sai direto de new Date() — mas SEM toISOString(), que
// converteria pra UTC e viraria o dia às 21h.
import type { SupabaseClient } from "@supabase/supabase-js";
import { gradeDoDia, TOTAL_OBRAS } from "./constantes";
import {
  etapasPendentes,
  type CronogramaItem,
  type DadosHoje,
  type Erro,
  type EscadaItem,
  type Fichamento,
  type MetaMensal,
  type ObraComProgresso,
  type Simulado,
} from "./tipos";

export function dataLocalISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapearErro(row: any): Erro {
  return {
    id: row.id,
    imagemUrl: row.imagem_url,
    disciplina: row.disciplina,
    tema: row.tema,
    banca: row.banca,
    provaAno: row.prova_ano,
    provaFase: row.prova_fase,
    questaoNum: row.questao_num,
    oQueMarquei: row.o_que_marquei,
    gabarito: row.gabarito,
    tipoErro: row.tipo_erro,
    resolucao: row.resolucao,
    conceitoChave: row.conceito_chave,
    criadoEm: String(row.criado_em),
    refazerEm1d: row.refazer_em_1d ? String(row.refazer_em_1d).slice(0, 10) : null,
    refazerEm7d: row.refazer_em_7d ? String(row.refazer_em_7d).slice(0, 10) : null,
    refazerEm30d: row.refazer_em_30d ? String(row.refazer_em_30d).slice(0, 10) : null,
    feito1d: !!row.feito_1d,
    feito7d: !!row.feito_7d,
    feito30d: !!row.feito_30d,
    arquivado: !!row.arquivado,
  };
}

function mapearSimulado(row: any): Simulado {
  return {
    id: row.id,
    data: String(row.data).slice(0, 10),
    banca: row.banca,
    provaRef: row.prova_ref,
    acertos: (row.acertos || {}) as Record<string, number>,
    totalQuestoes: row.total_questoes,
    tempoMin: row.tempo_min,
    errosPorTipo: (row.erros_por_tipo || null) as Record<string, number> | null,
    observacoes: row.observacoes,
  };
}

function mapearMeta(row: any): MetaMensal {
  return {
    mes: row.mes,
    ano: row.ano,
    metaAcertosSimulado: row.meta_acertos_simulado,
    metaRedacoes: row.meta_redacoes,
    metaObras: row.meta_obras,
    acertosAtual: row.acertos_atual ?? 0,
    redacoesAtual: row.redacoes_atual ?? 0,
    obrasAtual: row.obras_atual ?? 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const COLUNAS_ERRO =
  "id, imagem_url, disciplina, tema, banca, prova_ano, prova_fase, questao_num, o_que_marquei, gabarito, tipo_erro, resolucao, conceito_chave, criado_em, refazer_em_1d, refazer_em_7d, refazer_em_30d, feito_1d, feito_7d, feito_30d, arquivado";

export async function carregarErros(supabase: SupabaseClient, userId: string): Promise<Erro[]> {
  const { data } = await supabase
    .from("erros")
    .select(COLUNAS_ERRO)
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });
  return (data || []).map(mapearErro);
}

export async function carregarEscada(supabase: SupabaseClient): Promise<EscadaItem[]> {
  const { data } = await supabase
    .from("escada_simulados")
    .select("data, prova, funcao")
    .order("data");
  return (data || []).map((r) => ({
    data: String(r.data).slice(0, 10),
    prova: r.prova,
    funcao: r.funcao,
  }));
}

export async function carregarSimulados(supabase: SupabaseClient, userId: string): Promise<Simulado[]> {
  const { data } = await supabase
    .from("simulados")
    .select("id, data, banca, prova_ref, acertos, total_questoes, tempo_min, erros_por_tipo, observacoes")
    .eq("user_id", userId)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });
  return (data || []).map(mapearSimulado);
}

export async function carregarObras(supabase: SupabaseClient, userId: string): Promise<ObraComProgresso[]> {
  const [{ data: obras }, { data: progresso }] = await Promise.all([
    supabase.from("obras").select("id, titulo, autor, banca, ordem_leitura, data_alvo_conclusao").order("ordem_leitura"),
    supabase
      .from("obras_progresso")
      .select(
        "obra_id, pagina_atual, total_paginas, percentual, concluida, fichamento_enredo, fichamento_narrador, fichamento_temas, fichamento_contexto, fichamento_trechos",
      )
      .eq("user_id", userId),
  ]);

  type ProgressoRow = NonNullable<typeof progresso>[number];
  const porObra = new Map<number, ProgressoRow>();
  (progresso || []).forEach((p) => porObra.set(p.obra_id as number, p));

  return (obras || []).map((o) => {
    const p = porObra.get(o.id as number);
    const fichamento: Fichamento | null = p
      ? {
          enredo: p.fichamento_enredo || "",
          narrador: p.fichamento_narrador || "",
          temas: p.fichamento_temas || "",
          contexto: p.fichamento_contexto || "",
          trechos: p.fichamento_trechos || "",
        }
      : null;
    return {
      id: o.id as number,
      titulo: o.titulo as string,
      autor: o.autor as string,
      banca: o.banca as string,
      ordemLeitura: o.ordem_leitura as number | null,
      dataAlvoConclusao: o.data_alvo_conclusao ? String(o.data_alvo_conclusao).slice(0, 10) : null,
      progresso: p
        ? {
            obraId: o.id as number,
            paginaAtual: (p.pagina_atual as number) ?? 0,
            totalPaginas: p.total_paginas as number | null,
            percentual: (p.percentual as number) ?? 0,
            fichamento: fichamento!,
            concluida: !!p.concluida,
          }
        : null,
    };
  });
}

export async function carregarMetaDoMes(
  supabase: SupabaseClient,
  userId: string,
  mes: number,
  ano: number,
): Promise<MetaMensal | null> {
  const { data } = await supabase
    .from("metas_mensais")
    .select("mes, ano, meta_acertos_simulado, meta_redacoes, meta_obras, acertos_atual, redacoes_atual, obras_atual")
    .eq("user_id", userId)
    .eq("mes", mes)
    .eq("ano", ano)
    .maybeSingle();
  return data ? mapearMeta(data) : null;
}

// Semana do plano (S1..S14): a linha do cronograma com a maior
// data_inicio <= hoje. Antes de 14/jul/2026 → null; depois de S14 o
// plano segue valendo "reta final" até a prova.
function semanaDoPlano(cronograma: CronogramaItem[], hoje: string): number | null {
  let semana: number | null = null;
  let melhorInicio = "";
  for (const c of cronograma) {
    if (c.dataInicio <= hoje && c.dataInicio >= melhorInicio) {
      melhorInicio = c.dataInicio;
      semana = c.semana;
    }
  }
  return semana;
}

export async function carregarDadosHoje(supabase: SupabaseClient, userId: string): Promise<DadosHoje> {
  const agora = new Date();
  const hoje = dataLocalISO(agora);
  const diaSemana = agora.getDay();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  const [cronogramaRes, escada, sessoesRes, errosRes, obrasRes, meta] = await Promise.all([
    supabase.from("cronograma_semanal").select("semana, data_inicio, disciplina, topico").order("semana"),
    carregarEscada(supabase),
    supabase.from("sessoes_estudo").select("bloco, concluido").eq("user_id", userId).eq("data", hoje),
    supabase
      .from("erros")
      .select(COLUNAS_ERRO)
      .eq("user_id", userId)
      .eq("arquivado", false),
    supabase.from("obras_progresso").select("obra_id, concluida").eq("user_id", userId),
    carregarMetaDoMes(supabase, userId, mes, ano),
  ]);

  const cronograma: CronogramaItem[] = (cronogramaRes.data || []).map((c) => ({
    semana: c.semana as number,
    dataInicio: String(c.data_inicio).slice(0, 10),
    disciplina: c.disciplina as string,
    topico: c.topico as string,
  }));

  const semanaPlano = semanaDoPlano(cronograma, hoje);
  const topicosSemana = semanaPlano ? cronograma.filter((c) => c.semana === semanaPlano) : [];

  const concluidoPorBloco = new Map<string, boolean>();
  (sessoesRes.data || []).forEach((s) => concluidoPorBloco.set(s.bloco as string, !!s.concluido));
  const blocos = gradeDoDia(diaSemana).map((b) => ({
    ...b,
    concluido: concluidoPorBloco.get(b.bloco) || false,
  }));

  const revisoesPendentes = (errosRes.data || [])
    .map(mapearErro)
    .filter((e) => etapasPendentes(e, hoje).length > 0).length;

  const obrasConcluidas = (obrasRes.data || []).filter((o) => o.concluida).length;

  return {
    hoje,
    diaSemana,
    semanaPlano,
    blocos,
    simuladoDoDia: escada.find((e) => e.data === hoje) || null,
    proximoSimulado: escada.find((e) => e.data > hoje) || null,
    topicosSemana,
    revisoesPendentes,
    obrasConcluidas,
    obrasTotal: TOTAL_OBRAS,
    metas: meta,
  };
}
