"use server";

// Card público do aluno, aberto ao clicar numa linha do ranking.
// Só lê tabelas com RLS pública pra qualquer autenticado (profiles,
// subjects, historico_semanal — ver CLAUDE.md seção "RLS visibilidade")
// então funciona pra abrir o card de QUALQUER aluno, não só o próprio.
import { createClient } from "@/lib/supabase/server";
import { QUESTLY_LIGAS, QUESTLY_LIGA_INFO, questlySegundaDaSemana, type Liga } from "@/lib/questly/liga";
import { calcularDistintivos, distintivosParaCard, IDS_DISTINTIVOS, MAX_DISTINTIVOS_CARD, type Distintivo } from "@/lib/ranking/badges";
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
  /** vagas fixas do card (ver MAX_DISTINTIVOS_CARD) — o que o aluno
   *  escolheu mostrar, ou o resumo automático sem escolha própria. */
  distintivos: Distintivo[];
  /** total de distintivos conquistados de verdade (sem o corte de vagas),
   *  pro contador do card — "N" não pode parecer o teto de 5. */
  totalDistintivosConquistados: number;
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
        "nome, username, curso, semestre, foto_url, liga, xp_semana, xp_total, nivel, streak_atual, questoes_total, plano, plano_expira_em, distintivos_selecionados",
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
    // Vagas fixas (MAX_DISTINTIVOS_CARD): o que o próprio aluno escolheu
    // mostrar, restrito ao que ele de fato conquistou; sem escolha, o
    // resumo automático de sempre — nunca a lista inteira de conquistados
    // (era o que fazia o card crescer sem limite a cada brasão novo).
    distintivos: distintivosParaCard(distintivos, profile.distintivos_selecionados),
    totalDistintivosConquistados: distintivos.filter((d) => d.conquistado).length,
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

// Escolha do aluno de QUAIS distintivos (dos que ele já conquistou) aparecem
// no card público — visão "Conquistas" da home. Nunca confia no array que o
// cliente manda: recomputa a conquista do próprio aluno aqui e descarta
// qualquer id que não seja uma conquista real ou que não exista mais,
// depois corta pra MAX_DISTINTIVOS_CARD. `distintivos_selecionados` não é
// coluna protegida pelo trigger de segurança (não é plano/XP/liga/streak),
// então o UPDATE dono-only comum de "profiles" já alcança.
export async function salvarDistintivosCardAction(ids: string[]): Promise<{ ok: boolean; salvos: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, salvos: [] };

  const [{ data: profile }, { data: subjects }, { data: historico }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nivel, streak_atual, questoes_total, liga")
      .eq("id", user.id)
      .single(),
    supabase.from("subjects").select("id").eq("user_id", user.id),
    supabase.from("historico_semanal").select("liga").eq("user_id", user.id),
  ]);
  if (!profile) return { ok: false, salvos: [] };

  const ligaAtual: Liga = profile.liga || QUESTLY_LIGAS[0];
  const indicePorLiga = (l: string) => Math.max(0, QUESTLY_LIGAS.indexOf(l as Liga));
  const melhorIndice = (historico || []).reduce((max, h) => Math.max(max, indicePorLiga(h.liga)), indicePorLiga(ligaAtual));

  const distintivos = calcularDistintivos({
    nivel: profile.nivel || 1,
    streakAtual: profile.streak_atual || 0,
    questoesTotal: profile.questoes_total || 0,
    numDisciplinas: (subjects || []).length,
    melhorLiga: QUESTLY_LIGAS[melhorIndice],
  });
  const conquistadosValidos = new Set(distintivos.filter((d) => d.conquistado).map((d) => d.id));

  const validos = new Set(IDS_DISTINTIVOS);
  const salvos = Array.from(new Set(ids))
    .filter((id) => validos.has(id) && conquistadosValidos.has(id))
    .slice(0, MAX_DISTINTIVOS_CARD);

  const { error } = await supabase
    .from("profiles")
    .update({ distintivos_selecionados: salvos.length > 0 ? salvos : null })
    .eq("id", user.id);

  return { ok: !error, salvos };
}
