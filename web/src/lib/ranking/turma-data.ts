// "Minha turma" — o ranking dos colegas que fazem a MESMA prova.
//
// O ranking global põe o aluno de Cálculo II da UFF para competir com gente de
// outra universidade e outra ementa. Quem move um universitário de exatas é a
// comparação com os 60 que vão sentar na mesma P1 — e esse recorte já era
// derivável sem tabela nova: `profiles.universidade` e `subjects.materia_id`
// existem e são legíveis por qualquer autenticado sob RLS (é o que já faz o
// ranking cross-user e a carta pública funcionarem).
//
// REGRAS HERDADAS, SEM EXCEÇÃO
// ----------------------------
//  • ordena por XP (esforço), NUNCA por acertabilidade — que é dado privado
//    desde supabase_ranking_privado.sql e não volta pra vitrine por uma porta
//    lateral;
//  • posição por competição (empate divide a mesma colocação), a mesma régua
//    de ranking-data.ts;
//  • massa crítica: abaixo de TURMA_MINIMA a turma não é exibida. Um ranking
//    de duas pessoas não é competição, é constrangimento.
//
// LIMITE DE ESCALA, ASSUMIDO
// --------------------------
// A turma é montada em duas etapas (quem cursa a matéria → quem desses é da
// minha universidade) porque não existe índice cruzando as duas tabelas. Isso
// é barato na escala atual e deixa de ser quando uma matéria passar de alguns
// milhares de matrículas; o caminho then é uma view agregada, como
// vw_questoes_por_topico fez com a contagem de questões.
import type { SupabaseClient } from "@supabase/supabase-js";
import { questlySegundaDaSemana } from "@/lib/questly/liga";
import { ehPro } from "@/lib/plano/plano";
import { emLotes, lerPaginado } from "@/lib/supabase/paginado";

/** Abaixo disto não existe turma — ver o cabeçalho. */
export const TURMA_MINIMA = 5;

const LIMITE_TURMA = 100;

export type TurmaRow = {
  id: string;
  nome: string;
  username: string | null;
  fotoUrl: string | null;
  xpSemana: number;
  questoesSemana: number;
  posicao: number;
  ehVoce: boolean;
  pro: boolean;
};

export type DisciplinaDaTurma = {
  materiaId: string;
  nome: string;
};

export type RankingTurma = {
  /** null = o aluno não tem universidade no perfil, e aí não há turma. */
  universidade: string | null;
  disciplinas: DisciplinaDaTurma[];
  materiaSelecionada: string | null;
  materiaNome: string | null;
  linhas: TurmaRow[];
  /** total de colegas no recorte (pode passar do Top 100 exibido) */
  total: number;
  voce: TurmaRow | null;
  /** o recorte existe mas não bateu a massa crítica */
  poucaGente: boolean;
};

type PerfilTurma = {
  id: string;
  nome: string | null;
  username: string | null;
  foto_url: string | null;
  xp_semana: number | null;
  questoes_semana: number | null;
  semana_inicio: string | null;
  plano: string | null;
  plano_expira_em: string | null;
};

const COLUNAS = "id, nome, username, foto_url, xp_semana, questoes_semana, semana_inicio, plano, plano_expira_em";

/** Posição por competição: empate divide a mesma colocação (1, 2, 2, 4).
 *  Mesma convenção de ranking-data.ts — display e consequência saem da mesma
 *  régua em todo o app. */
function numerarPorCompeticao<T>(itens: T[], valor: (t: T) => number): number[] {
  const saida: number[] = [];
  let ultimoValor: number | null = null;
  let ultimaPosicao = 0;
  itens.forEach((item, i) => {
    const v = valor(item);
    if (ultimoValor === null || v !== ultimoValor) {
      ultimaPosicao = i + 1;
      ultimoValor = v;
    }
    saida.push(ultimaPosicao);
  });
  return saida;
}

/**
 * XP da semana VIGENTE.
 *
 * A virada de semana é preguiçosa (não há cron): quem não abriu o app desde
 * segunda ainda carrega na coluna o xp_semana da semana PASSADA. Contar isso
 * como desta semana colocaria o campeão da semana anterior no topo desta —
 * mesmo cuidado de `xpDaSemanaVigente` em ranking-data.ts.
 */
function xpVigente(p: PerfilTurma, segundaAtual: string): number {
  return p.semana_inicio === segundaAtual ? p.xp_semana || 0 : 0;
}

function questoesVigentes(p: PerfilTurma, segundaAtual: string): number {
  return p.semana_inicio === segundaAtual ? p.questoes_semana || 0 : 0;
}

function paraLinha(
  p: PerfilTurma,
  segundaAtual: string,
  posicao: number,
  meuId: string,
): TurmaRow {
  return {
    id: p.id,
    nome: p.nome || "Aluno",
    username: p.username,
    fotoUrl: p.foto_url,
    xpSemana: xpVigente(p, segundaAtual),
    questoesSemana: questoesVigentes(p, segundaAtual),
    posicao,
    ehVoce: p.id === meuId,
    pro: ehPro(p),
  };
}

/**
 * Monta a turma do aluno numa disciplina.
 *
 * `materiaId` null = escolhe a primeira das disciplinas dele (ordem
 * alfabética), pra tela abrir com algo em vez de um seletor vazio.
 */
export async function carregarRankingTurma(
  supabase: SupabaseClient,
  user: { id: string },
  materiaId?: string | null,
): Promise<RankingTurma> {
  const vazio: RankingTurma = {
    universidade: null,
    disciplinas: [],
    materiaSelecionada: null,
    materiaNome: null,
    linhas: [],
    total: 0,
    voce: null,
    poucaGente: false,
  };

  const { data: meuPerfil } = await supabase
    .from("profiles")
    .select("universidade")
    .eq("id", user.id)
    .maybeSingle();
  const universidade = (meuPerfil?.universidade as string | null) || null;
  if (!universidade) return vazio;

  // As disciplinas do aluno, com nome — é o que alimenta o seletor.
  const { data: meusSubjects } = await supabase
    .from("subjects")
    .select("materia_id, materias(nome)")
    .eq("user_id", user.id);

  const disciplinas: DisciplinaDaTurma[] = [];
  for (const s of meusSubjects || []) {
    const id = s.materia_id as string | null;
    if (!id || disciplinas.some((d) => d.materiaId === id)) continue;
    const m = s.materias as { nome?: string } | { nome?: string }[] | null;
    const nome = Array.isArray(m) ? m[0]?.nome : m?.nome;
    disciplinas.push({ materiaId: id, nome: nome || "Disciplina" });
  }
  disciplinas.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  if (disciplinas.length === 0) return { ...vazio, universidade };

  const escolhida =
    disciplinas.find((d) => d.materiaId === materiaId) ?? disciplinas[0];

  // Etapa 1: quem cursa essa matéria. Paginado porque o teto silencioso do
  // PostgREST são 1.000 linhas (ver lib/supabase/paginado.ts) e uma matéria
  // popular passa disso sem avisar.
  const matriculas = await lerPaginado<{ user_id: string }>(
    () => supabase.from("subjects").select("user_id").eq("materia_id", escolhida.materiaId),
    { ordenarPor: "user_id" },
  );
  const colegasIds = Array.from(new Set(matriculas.map((m) => m.user_id)));
  if (colegasIds.length === 0)
    return { ...vazio, universidade, disciplinas, materiaSelecionada: escolhida.materiaId, materiaNome: escolhida.nome };

  // Etapa 2: desses, quem é da minha universidade. Em lotes: uma lista de ids
  // vira querystring e ~400 uuids já estoura a requisição.
  const perfis = await emLotes(colegasIds, (lote) =>
    supabase.from("profiles").select(COLUNAS).in("id", lote).eq("universidade", universidade),
  );

  const segundaAtual = questlySegundaDaSemana(new Date());
  const brutos = (perfis as PerfilTurma[]).slice();

  // Ordena por esforço da semana, com o mesmo desempate determinístico do
  // resto do ranking (questões, depois id — que nunca empata). Sem o
  // desempate, a ordem dos empatados mudaria a cada recarga.
  brutos.sort((a, b) => {
    const dx = xpVigente(b, segundaAtual) - xpVigente(a, segundaAtual);
    if (dx !== 0) return dx;
    const dq = questoesVigentes(b, segundaAtual) - questoesVigentes(a, segundaAtual);
    if (dq !== 0) return dq;
    return a.id.localeCompare(b.id);
  });

  const total = brutos.length;
  const posicoes = numerarPorCompeticao(brutos, (p) => xpVigente(p, segundaAtual));
  const linhas = brutos
    .slice(0, LIMITE_TURMA)
    .map((p, i) => paraLinha(p, segundaAtual, posicoes[i], user.id));

  const meuIndice = brutos.findIndex((p) => p.id === user.id);
  const voce =
    meuIndice >= 0
      ? paraLinha(brutos[meuIndice], segundaAtual, posicoes[meuIndice], user.id)
      : null;

  return {
    universidade,
    disciplinas,
    materiaSelecionada: escolhida.materiaId,
    materiaNome: escolhida.nome,
    linhas,
    total,
    voce,
    poucaGente: total < TURMA_MINIMA,
  };
}

/** Quantos alunos estão na turma padrão do aluno — o número que a home usa
 *  pra decidir se vale mostrar a linha "você é o Nº de M". */
export function resumoDaTurma(turma: RankingTurma | null): {
  posicao: number;
  total: number;
  materia: string;
} | null {
  if (!turma || turma.poucaGente || !turma.voce || !turma.materiaNome) return null;
  return { posicao: turma.voce.posicao, total: turma.total, materia: turma.materiaNome };
}
