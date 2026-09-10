"use server";

// Card público do aluno, aberto ao clicar numa linha do ranking.
// Só lê tabelas com RLS pública pra qualquer autenticado (profiles,
// subjects, historico_semanal — ver CLAUDE.md seção "RLS visibilidade")
// então funciona pra abrir o card de QUALQUER aluno, não só o próprio.
import { createClient } from "@/lib/supabase/server";
import { QUESTLY_LIGAS, QUESTLY_LIGA_INFO, questlySegundaDaSemana, type Liga } from "@/lib/questly/liga";
import { calcularDistintivos, type Distintivo } from "@/lib/ranking/badges";
import { ehPro } from "@/lib/plano/plano";
import {
  buscarGrupoLiga,
  carregarRankingGlobal,
  type GrupoLiga,
  type ModoGlobal,
  type RankingGlobal,
} from "@/lib/ranking/ranking-data";

// Amostra mínima pra exibir acertabilidade no card público.
const MIN_QUESTOES_ACERTABILIDADE = 10;

export type CardUsuario = {
  nome: string;
  /** @handle público — o card mostra ele quando existe (nome é fallback). */
  username: string | null;
  curso: string | null;
  semestre: number | null;
  fotoUrl: string | null;
  liga: Liga;
  ligaNome: string;
  xpSemana: number;
  xpTotal: number;
  nivel: number;
  streakAtual: number;
  questoesTotal: number;
  /** acertos vitalícios (profiles.acertos_total) */
  acertosTotal: number;
  /** acertabilidade em %, null enquanto o aluno não respondeu nada */
  pctAcerto: number | null;
  disciplinas: string[];
  distintivos: Distintivo[];
  /** assinante Pro: o card ganha acabamento próprio (moldura prismática,
   *  holo sempre ligado e a faixa "Edição Pro") — ver student-card-modal. */
  pro: boolean;
  /** a liga mais alta que a pessoa já alcançou, do histórico semanal */
  melhorLigaNome: string;
  /** só no card Pro: dias seguidos no recorde pessoal de streak não existem
   *  como coluna, então o "auge" é a melhor liga + o XP total. */
  xpMedioPorQuestao: number | null;
};

export async function buscarCardUsuarioAction(userId: string): Promise<CardUsuario | null> {
  const supabase = await createClient();

  const [{ data: profile }, { data: perfilAcertos }, { data: subjects }, { data: historico }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "nome, username, curso, semestre, foto_url, liga, xp_semana, xp_total, nivel, streak_atual, questoes_total, plano, plano_expira_em",
      )
      .eq("id", userId)
      .single(),
    // acertos_total é coluna nova (supabase_acertos_publicos.sql) — lida
    // separada pra que um banco sem a migração ainda renderize o card,
    // só sem a linha de acertabilidade.
    supabase.from("profiles").select("acertos_total").eq("id", userId).maybeSingle(),
    supabase.from("subjects").select("nome").eq("user_id", userId).order("nome"),
    supabase.from("historico_semanal").select("liga").eq("user_id", userId),
  ]);

  if (!profile) return null;

  const ligaAtual: Liga = profile.liga || QUESTLY_LIGAS[0];
  const indicePorLiga = (l: string) => Math.max(0, QUESTLY_LIGAS.indexOf(l as Liga));
  const melhorIndice = (historico || []).reduce((max, h) => Math.max(max, indicePorLiga(h.liga)), indicePorLiga(ligaAtual));
  const melhorLiga = QUESTLY_LIGAS[melhorIndice];

  const disciplinas = (subjects || []).map((s) => s.nome);
  const info = QUESTLY_LIGA_INFO[ligaAtual] || QUESTLY_LIGA_INFO.bronze;

  const questoesTotal = profile.questoes_total || 0;
  const acertosTotal = (perfilAcertos as { acertos_total?: number } | null)?.acertos_total ?? null;

  const distintivos = calcularDistintivos({
    nivel: profile.nivel || 1,
    streakAtual: profile.streak_atual || 0,
    questoesTotal: profile.questoes_total || 0,
    numDisciplinas: disciplinas.length,
    melhorLiga,
  });

  return {
    nome: profile.nome || "Aluno(a)",
    username: profile.username || null,
    curso: profile.curso,
    semestre: profile.semestre,
    fotoUrl: profile.foto_url,
    liga: ligaAtual,
    ligaNome: info.nome,
    xpSemana: profile.xp_semana || 0,
    xpTotal: profile.xp_total || 0,
    nivel: profile.nivel || 1,
    streakAtual: profile.streak_atual || 0,
    questoesTotal: profile.questoes_total || 0,
    acertosTotal: acertosTotal ?? 0,
    // Só mostra a acertabilidade com amostra mínima: 1 acerto em 1 questão
    // vira "100%" e isso é ruído, não conquista.
    pctAcerto:
      acertosTotal != null && questoesTotal >= MIN_QUESTOES_ACERTABILIDADE
        ? Math.round((acertosTotal / questoesTotal) * 100)
        : null,
    disciplinas,
    // só os conquistados no card público — ver pedido do usuário: ninguém
    // quer ver a lista de "distintivos que os outros não têm" na cara.
    distintivos: distintivos.filter((d) => d.conquistado),
    pro: ehPro(profile),
    melhorLigaNome: (QUESTLY_LIGA_INFO[melhorLiga] || QUESTLY_LIGA_INFO.bronze).nome,
    xpMedioPorQuestao:
      questoesTotal > 0 ? Math.round(((profile.xp_total || 0) / questoesTotal) * 10) / 10 : null,
  };
}

// Navegador de ligas do ranking: troca de aba busca o grupo de OUTRA
// liga sem recarregar a página. semana_inicio é recalculada aqui (não
// confiamos no que o client manda) porque é a mesma pra todo mundo.
export async function buscarRankingLigaAction(liga: Liga): Promise<GrupoLiga> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { grupo: [], hint: "" };

  const semanaInicio = questlySegundaDaSemana(new Date());
  return buscarGrupoLiga(supabase, liga, semanaInicio, user.id);
}

// Ranking global (Geral/Semana): troca de aba busca sem recarregar a página.
export async function buscarRankingGlobalAction(modo: ModoGlobal): Promise<RankingGlobal | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return carregarRankingGlobal(supabase, user, modo);
}
