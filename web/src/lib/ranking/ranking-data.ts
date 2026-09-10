// Orquestra os dados da tela de Ranking, mesmo espírito de
// dashboard-data.ts: uma passada de Server Component em vez de várias
// buscas no browser (o app legado fazia tudo client-side em js/ranking.js).
// A mecânica de liga em si (fila de virada de semana, zonas de
// promoção/rebaixamento) é o port fiel em lib/questly/liga.ts — aqui só
// buscamos o grupo da semana e pintamos cada linha com a MESMA função
// pura que decide a virada de verdade.
import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyGarantirSemanaLiga, questlyDestinoNaLiga, QUESTLY_LIGAS, QUESTLY_LIGA_INFO, type Liga } from "@/lib/questly/liga";
import { ehPro } from "@/lib/plano/plano";
import { createAdminClient } from "@/lib/supabase/admin";

export type RankingRow = {
  id: string;
  nome: string;
  /** Identidade pública (@handle) — o ranking mostra ele; `nome` é o
   *  fallback pra contas que ainda não escolheram um username. */
  username: string | null;
  fotoUrl: string | null;
  xpSemana: number;
  questoesSemana: number;
  destino: -1 | 0 | 1;
  ehVoce: boolean;
  /** assinante Pro — o ranking marca com aro dourado (ver components/ranking/pro-visual). */
  pro: boolean;
};

export type GrupoLiga = {
  grupo: RankingRow[];
  hint: string;
};

// ---- Ranking GLOBAL (Geral por XP total / Semana por XP da semana) ----
// Diferente da Divisão (liga da semana): aqui é o Top 100 de TODA a
// plataforma + a posição do próprio aluno mesmo fora do Top 100, igual aos
// prints da referência. `profiles` é world-readable sob RLS, então dá pra
// ranquear cross-user honestamente (mesmo princípio do "Comparativo").
export type RankingGlobalRow = {
  id: string;
  nome: string;
  username: string | null;
  fotoUrl: string | null;
  xp: number;
  nivel: number;
  liga: Liga;
  questoesTotal: number;
  streakAtual: number;
  posicao: number;
  ehVoce: boolean;
  pro: boolean;
};

export type ModoGlobal = "geral" | "semana";

export type RankingGlobal = {
  modo: ModoGlobal;
  linhas: RankingGlobalRow[];
  voce: RankingGlobalRow | null;
  posicaoVoce: number;
  foraDoTop: boolean;
  totalAlunos: number;
};

const LIMITE_TOP = 100;

export async function carregarRankingGlobal(
  supabase: SupabaseClient,
  user: { id: string },
  modo: ModoGlobal,
): Promise<RankingGlobal> {
  const coluna = modo === "geral" ? "xp_total" : "xp_semana";

  const [{ data: topRaw }, { data: meuPerfil }, { count: total }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, nome, username, foto_url, xp_total, xp_semana, nivel, liga, questoes_total, streak_atual, plano, plano_expira_em",
      )
      .order(coluna, { ascending: false })
      .limit(LIMITE_TOP),
    supabase
      .from("profiles")
      .select(
        "id, nome, username, foto_url, xp_total, xp_semana, nivel, liga, questoes_total, streak_atual, plano, plano_expira_em",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const valor = (p: { xp_total?: number; xp_semana?: number }) =>
    (modo === "geral" ? p.xp_total : p.xp_semana) || 0;

  const linhas: RankingGlobalRow[] = (topRaw || []).map((p, i) => ({
    id: p.id,
    nome: p.nome || "Aluno(a)",
    username: p.username || null,
    fotoUrl: p.foto_url,
    xp: valor(p),
    nivel: p.nivel || 1,
    liga: (p.liga as Liga) || QUESTLY_LIGAS[0],
    questoesTotal: p.questoes_total || 0,
    streakAtual: p.streak_atual || 0,
    posicao: i + 1,
    ehVoce: p.id === user.id,
    pro: ehPro(p),
  }));

  // Posição do aluno: quantos têm métrica estritamente maior (+1). Empates
  // ficam na mesma faixa — mesma convenção de ranking por competição.
  let posicaoVoce = 0;
  let voce: RankingGlobalRow | null = null;
  if (meuPerfil) {
    const meuValor = valor(meuPerfil);
    const { count: acima } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt(coluna, meuValor);
    posicaoVoce = (acima || 0) + 1;
    voce = {
      id: meuPerfil.id,
      nome: meuPerfil.nome || "Aluno(a)",
      username: meuPerfil.username || null,
      fotoUrl: meuPerfil.foto_url,
      xp: meuValor,
      nivel: meuPerfil.nivel || 1,
      liga: (meuPerfil.liga as Liga) || QUESTLY_LIGAS[0],
      questoesTotal: meuPerfil.questoes_total || 0,
      streakAtual: meuPerfil.streak_atual || 0,
      posicao: posicaoVoce,
      ehVoce: true,
      pro: ehPro(meuPerfil),
    };
  }

  return {
    modo,
    linhas,
    voce,
    posicaoVoce,
    foraDoTop: posicaoVoce > LIMITE_TOP,
    totalAlunos: total || linhas.length,
  };
}

export type DadosRanking = {
  liga: Liga;
  ligaNome: string;
  xpSemana: number;
  diasAteReset: number;
  semanaInicio: string;
  ribbon: { liga: Liga; nome: string; atual: boolean }[];
  grupo: RankingRow[];
  hint: string;
};

const MIN_GRUPO_REBAIXAMENTO = 5;

function diasAteProximaSegunda(): number {
  const hoje = new Date().getDay();
  return hoje === 0 ? 1 : 8 - hoje;
}

// Busca e pinta o grupo de uma liga específica numa semana específica —
// usado tanto pra liga ATUAL do aluno (carregamento inicial da página)
// quanto pro navegador de ligas do ranking-view (trocar de aba busca o
// grupo de outra liga via Server Action, mesmo assim sem sair do server).
export async function buscarGrupoLiga(
  supabase: SupabaseClient,
  liga: Liga,
  semanaInicio: string,
  meuId: string,
): Promise<GrupoLiga> {
  const { data: alunos } = await supabase
    .from("profiles")
    .select("id, nome, username, foto_url, xp_semana, questoes_semana, plano, plano_expira_em")
    .eq("liga", liga)
    .eq("semana_inicio", semanaInicio)
    .order("xp_semana", { ascending: false });

  const lista = alunos || [];
  const indiceLiga = QUESTLY_LIGAS.indexOf(liga);
  const xps = lista.map((a) => a.xp_semana || 0);

  const grupo: RankingRow[] = lista.map((a) => ({
    id: a.id,
    nome: a.nome || "Aluno(a)",
    username: a.username || null,
    fotoUrl: a.foto_url,
    xpSemana: a.xp_semana || 0,
    questoesSemana: a.questoes_semana || 0,
    destino: questlyDestinoNaLiga(xps, a.xp_semana || 0, indiceLiga),
    ehVoce: a.id === meuId,
    pro: ehPro(a),
  }));

  let hint: string;
  if (grupo.length === 0) {
    hint = "Ninguém nessa liga essa semana ainda.";
  } else if (grupo.length === 1) {
    hint = "Só tem um aluno nessa liga essa semana até agora.";
  } else if (grupo.length < MIN_GRUPO_REBAIXAMENTO) {
    hint = `Zona verde sobe de liga. Liga pequena essa semana: ninguém é rebaixado com menos de ${MIN_GRUPO_REBAIXAMENTO} participantes.`;
  } else {
    hint = "Zona verde sobe de liga no fim da semana · zona vermelha cai.";
  }

  return { grupo, hint };
}

export async function carregarDadosRanking(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<DadosRanking | null> {
  const estado = await questlyGarantirSemanaLiga(supabase, user, () => createAdminClient());
  if (!estado) return null;

  const { grupo, hint } = await buscarGrupoLiga(supabase, estado.liga, estado.semana_inicio, user.id);
  const info = QUESTLY_LIGA_INFO[estado.liga] || QUESTLY_LIGA_INFO.bronze;

  return {
    liga: estado.liga,
    ligaNome: info.nome,
    xpSemana: estado.xp_semana || 0,
    diasAteReset: diasAteProximaSegunda(),
    semanaInicio: estado.semana_inicio,
    ribbon: QUESTLY_LIGAS.map((l) => ({
      liga: l,
      nome: QUESTLY_LIGA_INFO[l].nome,
      atual: l === estado.liga,
    })),
    grupo,
    hint,
  };
}
