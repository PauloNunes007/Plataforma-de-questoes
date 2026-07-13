// Distintivos do card público do aluno (tela de Ranking). Não é uma
// tabela nova no banco — cada distintivo é derivado de campos que já
// existem em "profiles" (públicos por RLS) + contagem de disciplinas,
// então continua igual pra qualquer aluno olhando o card de outro sem
// depender de tabelas owner-only (question_attempts, aluno_topico_progresso).
import { QUESTLY_LIGAS, type Liga } from "@/lib/questly/liga";

export type Distintivo = {
  id: string;
  icone: string;
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
  icone: string;
  nome: string;
  descricao: string;
  atingiu: (ctx: DistintivoContexto) => boolean;
}[] = [
  { id: "streak-3", icone: "🔥", nome: "Chama viva", descricao: "3 dias seguidos estudando", atingiu: (c) => c.streakAtual >= 3 },
  { id: "streak-7", icone: "🔥🔥", nome: "Semana de fogo", descricao: "7 dias seguidos estudando", atingiu: (c) => c.streakAtual >= 7 },
  { id: "streak-30", icone: "🌋", nome: "Streak lendário", descricao: "30 dias seguidos estudando", atingiu: (c) => c.streakAtual >= 30 },
  { id: "questoes-50", icone: "🎯", nome: "Primeiras 50", descricao: "50 questões respondidas", atingiu: (c) => c.questoesTotal >= 50 },
  { id: "questoes-250", icone: "📈", nome: "Maratonista", descricao: "250 questões respondidas", atingiu: (c) => c.questoesTotal >= 250 },
  { id: "questoes-1000", icone: "🏔️", nome: "Veterano", descricao: "1000 questões respondidas", atingiu: (c) => c.questoesTotal >= 1000 },
  { id: "nivel-5", icone: "⭐", nome: "Nível 5", descricao: "Alcançou o nível 5", atingiu: (c) => c.nivel >= 5 },
  { id: "nivel-10", icone: "🌟", nome: "Nível 10", descricao: "Alcançou o nível 10", atingiu: (c) => c.nivel >= 10 },
  { id: "nivel-20", icone: "💫", nome: "Nível 20", descricao: "Alcançou o nível 20", atingiu: (c) => c.nivel >= 20 },
  { id: "multidisciplinar", icone: "🧠", nome: "Multidisciplinar", descricao: "3 ou mais disciplinas ativas", atingiu: (c) => c.numDisciplinas >= 3 },
  { id: "liga-ouro", icone: "🥇", nome: "Liga Ouro", descricao: "Chegou à liga Ouro", atingiu: (c) => indiceLiga(c.melhorLiga) >= indiceLiga("ouro") },
  { id: "liga-diamante", icone: "💎", nome: "Liga Diamante", descricao: "Chegou à liga Diamante", atingiu: (c) => indiceLiga(c.melhorLiga) >= indiceLiga("diamante") },
];

export function calcularDistintivos(ctx: DistintivoContexto): Distintivo[] {
  return DEFINICOES.map((d) => ({
    id: d.id,
    icone: d.icone,
    nome: d.nome,
    descricao: d.descricao,
    conquistado: d.atingiu(ctx),
  }));
}
