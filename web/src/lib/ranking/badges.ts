// Distintivos do card público do aluno (tela de Ranking). Não é uma
// tabela nova no banco — cada distintivo é derivado de campos que já
// existem em "profiles" (públicos por RLS) + contagem de disciplinas,
// então continua igual pra qualquer aluno olhando o card de outro sem
// depender de tabelas owner-only (question_attempts, aluno_topico_progresso).
import { QUESTLY_LIGAS, type Liga } from "@/lib/questly/liga";
import type { NomeInsignia, TomInsignia } from "@/components/insignias/insignia";

export type Distintivo = {
  id: string;
  /** Motivo do brasão (components/insignias) — nunca emoji: ver o cabeçalho de insignia.tsx. */
  insignia: NomeInsignia;
  /** Metal/pedra do brasão. Sobe de material conforme a conquista fica rara. */
  tom: TomInsignia;
  nome: string;
  descricao: string;
  conquistado: boolean;
};

export type DistintivoContexto = {
  nivel: number;
  streakAtual: number;
  questoesTotal: number;
  numDisciplinas: number;
  melhorLiga: Liga;
};

function indiceLiga(liga: Liga): number {
  return QUESTLY_LIGAS.indexOf(liga);
}

const DEFINICOES: {
  id: string;
  insignia: NomeInsignia;
  tom: TomInsignia;
  nome: string;
  descricao: string;
  atingiu: (ctx: DistintivoContexto) => boolean;
}[] = [
  { id: "streak-3", insignia: "chama", tom: "bronze", nome: "Chama viva", descricao: "3 dias seguidos estudando", atingiu: (c) => c.streakAtual >= 3 },
  { id: "streak-7", insignia: "chama-dupla", tom: "rubi", nome: "Semana de fogo", descricao: "7 dias seguidos estudando", atingiu: (c) => c.streakAtual >= 7 },
  { id: "streak-30", insignia: "chama-coroada", tom: "rubi", nome: "Streak lendário", descricao: "30 dias seguidos estudando", atingiu: (c) => c.streakAtual >= 30 },
  { id: "questoes-50", insignia: "alvo", tom: "esmeralda", nome: "Primeiras 50", descricao: "50 questões respondidas", atingiu: (c) => c.questoesTotal >= 50 },
  { id: "questoes-250", insignia: "ascensao", tom: "esmeralda", nome: "Maratonista", descricao: "250 questões respondidas", atingiu: (c) => c.questoesTotal >= 250 },
  { id: "questoes-1000", insignia: "cume", tom: "platina", nome: "Veterano", descricao: "1000 questões respondidas", atingiu: (c) => c.questoesTotal >= 1000 },
  { id: "nivel-5", insignia: "estrela", tom: "prata", nome: "Nível 5", descricao: "Alcançou o nível 5", atingiu: (c) => c.nivel >= 5 },
  { id: "nivel-10", insignia: "estrela-dupla", tom: "ouro", nome: "Nível 10", descricao: "Alcançou o nível 10", atingiu: (c) => c.nivel >= 10 },
  { id: "nivel-20", insignia: "cometa", tom: "diamante", nome: "Nível 20", descricao: "Alcançou o nível 20", atingiu: (c) => c.nivel >= 20 },
  { id: "multidisciplinar", insignia: "constelacao", tom: "platina", nome: "Multidisciplinar", descricao: "3 ou mais disciplinas ativas", atingiu: (c) => c.numDisciplinas >= 3 },
  { id: "liga-ouro", insignia: "coroa", tom: "ouro", nome: "Liga Ouro", descricao: "Chegou à liga Ouro", atingiu: (c) => indiceLiga(c.melhorLiga) >= indiceLiga("ouro") },
  { id: "liga-diamante", insignia: "gema", tom: "diamante", nome: "Liga Diamante", descricao: "Chegou à liga Diamante", atingiu: (c) => indiceLiga(c.melhorLiga) >= indiceLiga("diamante") },
];

export function calcularDistintivos(ctx: DistintivoContexto): Distintivo[] {
  return DEFINICOES.map((d) => ({
    id: d.id,
    insignia: d.insignia,
    tom: d.tom,
    nome: d.nome,
    descricao: d.descricao,
    conquistado: d.atingiu(ctx),
  }));
}

// Vagas fixas do card público (student-card-modal): antes o card crescia
// com cada distintivo novo do aluno (flex-wrap sem limite) e virava uma
// carta cada vez mais alta e desproporcional. Agora o card SEMPRE reserva
// este número de vagas — o aluno escolhe o que entra (ver
// `profiles.distintivos_selecionados`, supabase_distintivos_selecionados.sql);
// sem escolha própria, a vaga cai pro fallback abaixo.
export const MAX_DISTINTIVOS_CARD = 5;

// Ids válidos pra validar a escolha do aluno no servidor (nunca confiar no
// array que o cliente manda).
export const IDS_DISTINTIVOS = DEFINICOES.map((d) => d.id);

// Escolhe os distintivos que aparecem no card público: os IDs que o aluno
// selecionou, na ordem escolhida, restritos aos que ele de fato conquistou
// (a conquista pode ter sido perdida, ou o id ser de uma definição
// removida), até MAX_DISTINTIVOS_CARD. Sem seleção própria (null/vazio) ou
// se nada da seleção sobreviveu à validação, cai no mesmo resumo automático
// que a linha do ranking usa (`distintivosResumo`), só com mais vagas.
export function distintivosParaCard(
  distintivos: Distintivo[],
  selecionados: string[] | null | undefined,
): Distintivo[] {
  const conquistadosPorId = new Map(distintivos.filter((d) => d.conquistado).map((d) => [d.id, d]));
  if (selecionados && selecionados.length > 0) {
    const escolhidos = selecionados
      .map((id) => conquistadosPorId.get(id))
      .filter((d): d is Distintivo => Boolean(d))
      .slice(0, MAX_DISTINTIVOS_CARD);
    if (escolhidos.length > 0) return escolhidos;
  }
  // distintivosResumo pede um DistintivoContexto pra recalcular "atingiu" —
  // aqui já temos os `Distintivo` prontos, então aplica a mesma
  // ORDEM_CATEGORIA (mais impressionante por categoria) direto sobre o que
  // já está conquistado, sem recomputar nada.
  const porCategoria = new Map<string, Distintivo>();
  for (const [id, d] of conquistadosPorId) {
    porCategoria.set(id.split("-")[0], d);
  }
  return ORDEM_CATEGORIA.map((c) => porCategoria.get(c))
    .filter((d): d is Distintivo => Boolean(d))
    .slice(0, MAX_DISTINTIVOS_CARD);
}

// Resumo p/ linhas de lista (coluna "Conquistas" do ranking): em vez das
// 12 definições completas, mostra só o distintivo mais alto de cada
// categoria (streak-3/7/30 vira só o de streak mais alto conquistado),
// mais impressionante primeiro, limitado a `limite` brasões — do
// contrário uma linha de tabela vira uma parede de insígnias.
const ORDEM_CATEGORIA = ["liga", "questoes", "nivel", "streak", "multidisciplinar"];

export function distintivosResumo(ctx: DistintivoContexto, limite = 3): Distintivo[] {
  const porCategoria = new Map<string, Distintivo>();
  for (const d of DEFINICOES) {
    if (!d.atingiu(ctx)) continue;
    const categoria = d.id.split("-")[0];
    porCategoria.set(categoria, { id: d.id, insignia: d.insignia, tom: d.tom, nome: d.nome, descricao: d.descricao, conquistado: true });
  }
  return ORDEM_CATEGORIA.map((c) => porCategoria.get(c))
    .filter((d): d is Distintivo => Boolean(d))
    .slice(0, limite);
}
