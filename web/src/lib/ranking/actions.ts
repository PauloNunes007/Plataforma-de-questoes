"use server";

// Card público do aluno, aberto ao clicar numa linha do ranking.
// Só lê tabelas com RLS pública pra qualquer autenticado (profiles,
// subjects, historico_semanal — ver CLAUDE.md seção "RLS visibilidade")
// então funciona pra abrir o card de QUALQUER aluno, não só o próprio.
import { createClient } from "@/lib/supabase/server";
import { QUESTLY_LIGAS, QUESTLY_LIGA_INFO, questlySegundaDaSemana, type Liga } from "@/lib/questly/liga";
import { calcularDistintivos, type Distintivo } from "@/lib/ranking/badges";
import { buscarGrupoLiga, type GrupoLiga } from "@/lib/ranking/ranking-data";

export type CardUsuario = {
  nome: string;
  curso: string | null;
  semestre: number | null;
  fotoUrl: string | null;
  liga: Liga;
  ligaNome: string;
  ligaIcone: string;
  xpSemana: number;
  xpTotal: number;
  nivel: number;
  streakAtual: number;
  questoesTotal: number;
  disciplinas: string[];
  distintivos: Distintivo[];
};

export async function buscarCardUsuarioAction(userId: string): Promise<CardUsuario | null> {
  const supabase = await createClient();

  const [{ data: profile }, { data: subjects }, { data: historico }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, curso, semestre, foto_url, liga, xp_semana, xp_total, nivel, streak_atual, questoes_total")
      .eq("id", userId)
      .single(),
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

  const distintivos = calcularDistintivos({
    nivel: profile.nivel || 1,
    streakAtual: profile.streak_atual || 0,
    questoesTotal: profile.questoes_total || 0,
    numDisciplinas: disciplinas.length,
    melhorLiga,
  });

  return {
    nome: profile.nome || "Aluno(a)",
    curso: profile.curso,
    semestre: profile.semestre,
    fotoUrl: profile.foto_url,
    liga: ligaAtual,
    ligaNome: info.nome,
    ligaIcone: info.icone,
    xpSemana: profile.xp_semana || 0,
    xpTotal: profile.xp_total || 0,
    nivel: profile.nivel || 1,
    streakAtual: profile.streak_atual || 0,
    questoesTotal: profile.questoes_total || 0,
    disciplinas,
    // só os conquistados no card público — ver pedido do usuário: ninguém
    // quer ver a lista de "distintivos que os outros não têm" na cara.
    distintivos: distintivos.filter((d) => d.conquistado),
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
