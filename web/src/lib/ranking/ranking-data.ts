// Orquestra os dados da tela de Ranking, mesmo espírito de
// dashboard-data.ts: uma passada de Server Component em vez de várias
// buscas no browser (o app legado fazia tudo client-side em js/ranking.js).
// A mecânica de liga em si (fila de virada de semana, zonas de
// promoção/rebaixamento) é o port fiel em lib/questly/liga.ts — aqui só
// buscamos o grupo da semana e pintamos cada linha com a MESMA função
// pura que decide a virada de verdade.
import type { SupabaseClient } from "@supabase/supabase-js";
import { questlyGarantirSemanaLiga, questlyDestinoNaLiga, QUESTLY_LIGAS, QUESTLY_LIGA_INFO, type Liga } from "@/lib/questly/liga";
import { createAdminClient } from "@/lib/supabase/admin";

export type RankingRow = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  xpSemana: number;
  questoesSemana: number;
  destino: -1 | 0 | 1;
  ehVoce: boolean;
};

export type GrupoLiga = {
  grupo: RankingRow[];
  hint: string;
};

export type DadosRanking = {
  liga: Liga;
  ligaNome: string;
  ligaIcone: string;
  xpSemana: number;
  diasAteReset: number;
  semanaInicio: string;
  ribbon: { liga: Liga; nome: string; icone: string; atual: boolean }[];
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
    .select("id, nome, foto_url, xp_semana, questoes_semana")
    .eq("liga", liga)
    .eq("semana_inicio", semanaInicio)
    .order("xp_semana", { ascending: false });

  const lista = alunos || [];
  const indiceLiga = QUESTLY_LIGAS.indexOf(liga);
  const xps = lista.map((a) => a.xp_semana || 0);

  const grupo: RankingRow[] = lista.map((a) => ({
    id: a.id,
    nome: a.nome || "Aluno(a)",
    fotoUrl: a.foto_url,
    xpSemana: a.xp_semana || 0,
    questoesSemana: a.questoes_semana || 0,
    destino: questlyDestinoNaLiga(xps, a.xp_semana || 0, indiceLiga),
    ehVoce: a.id === meuId,
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
    ligaIcone: info.icone,
    xpSemana: estado.xp_semana || 0,
    diasAteReset: diasAteProximaSegunda(),
    semanaInicio: estado.semana_inicio,
    ribbon: QUESTLY_LIGAS.map((l) => ({
      liga: l,
      nome: QUESTLY_LIGA_INFO[l].nome,
      icone: QUESTLY_LIGA_INFO[l].icone,
      atual: l === estado.liga,
    })),
    grupo,
    hint,
  };
}
