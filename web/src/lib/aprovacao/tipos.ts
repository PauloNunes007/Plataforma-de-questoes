// Tipos do Modo Aprovação — espelham as tabelas de
// supabase_modo_aprovacao.sql já em camelCase (mesma convenção de
// TarefaRow em lib/tarefas). O mapeamento snake→camel vive em dados.ts.
import type { TipoErro, BlocoGrade } from "./constantes";

export type Erro = {
  id: string;
  imagemUrl: string | null;
  disciplina: string;
  tema: string | null;
  banca: string | null;
  provaAno: number | null;
  provaFase: string | null;
  questaoNum: string | null;
  oQueMarquei: string | null;
  gabarito: string | null;
  tipoErro: TipoErro;
  resolucao: string | null;
  conceitoChave: string | null;
  criadoEm: string;
  refazerEm1d: string | null;
  refazerEm7d: string | null;
  refazerEm30d: string | null;
  feito1d: boolean;
  feito7d: boolean;
  feito30d: boolean;
  arquivado: boolean;
};

export type EtapaRevisao = "1d" | "7d" | "30d";

// Etapas de revisão espaçada vencidas (data <= hoje e ainda não feitas).
export function etapasPendentes(erro: Erro, hoje: string): EtapaRevisao[] {
  const pendentes: EtapaRevisao[] = [];
  if (erro.arquivado) return pendentes;
  if (!erro.feito1d && erro.refazerEm1d && erro.refazerEm1d <= hoje) pendentes.push("1d");
  if (!erro.feito7d && erro.refazerEm7d && erro.refazerEm7d <= hoje) pendentes.push("7d");
  if (!erro.feito30d && erro.refazerEm30d && erro.refazerEm30d <= hoje) pendentes.push("30d");
  return pendentes;
}

export function todasEtapasFeitas(erro: Erro): boolean {
  return erro.feito1d && erro.feito7d && erro.feito30d;
}

export type SessaoEstudo = {
  data: string;
  bloco: string;
  concluido: boolean;
};

export type CronogramaItem = {
  semana: number;
  dataInicio: string;
  disciplina: string;
  topico: string;
};

export type EscadaItem = {
  data: string;
  prova: string;
  funcao: string | null;
};

export type MetaMensal = {
  mes: number;
  ano: number;
  metaAcertosSimulado: number | null;
  metaRedacoes: number | null;
  metaObras: number | null;
  acertosAtual: number;
  redacoesAtual: number;
  obrasAtual: number;
};

export type Simulado = {
  id: string;
  data: string;
  banca: string;
  provaRef: string | null;
  acertos: Record<string, number>;
  totalQuestoes: number;
  tempoMin: number | null;
  errosPorTipo: Record<string, number> | null;
  observacoes: string | null;
};

export type Obra = {
  id: number;
  titulo: string;
  autor: string;
  banca: string;
  ordemLeitura: number | null;
  dataAlvoConclusao: string | null;
};

export type Fichamento = {
  enredo: string;
  narrador: string;
  temas: string;
  contexto: string;
  trechos: string;
};

export type ObraProgresso = {
  obraId: number;
  paginaAtual: number;
  totalPaginas: number | null;
  percentual: number;
  fichamento: Fichamento;
  concluida: boolean;
};

export type ObraComProgresso = Obra & { progresso: ObraProgresso | null };

// Bloco da grade do dia já com o estado do checkbox mesclado.
export type BlocoDoDia = BlocoGrade & { concluido: boolean };

export type DadosHoje = {
  hoje: string; // YYYY-MM-DD (TZ do servidor pinada em America/Sao_Paulo)
  diaSemana: number; // 0=dom..6=sáb
  semanaPlano: number | null; // S1..S14, null antes de 14/jul/2026
  blocos: BlocoDoDia[];
  simuladoDoDia: EscadaItem | null; // domingo: a prova designada da escada
  proximoSimulado: EscadaItem | null;
  topicosSemana: CronogramaItem[];
  revisoesPendentes: number;
  obrasConcluidas: number;
  obrasTotal: number;
  metas: MetaMensal | null;
};
