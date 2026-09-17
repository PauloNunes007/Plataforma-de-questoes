// Orquestra os dados da tela de Ranking, mesmo espírito de
// dashboard-data.ts: uma passada de Server Component em vez de várias
// buscas no browser (o app legado fazia tudo client-side em js/ranking.js).
// A mecânica de liga em si (fila de virada de semana, zonas de
// promoção/rebaixamento) é o port fiel em lib/questly/liga.ts — aqui só
// buscamos o grupo da semana e pintamos cada linha com a MESMA função
// pura que decide a virada de verdade.
//
// ---------------------------------------------------------------------------
// TRÊS REGRAS QUE VALEM PRA TODA CONSULTA DESTE ARQUIVO
// ---------------------------------------------------------------------------
// 1. TETO DE 100. Toda lista sai no máximo com LIMITE_TOP linhas — inclusive a
//    Divisão, que antes vinha inteira. Isso não é só enxugar a tela: sem um
//    `.limit()` explícito, o PostgREST corta em 1.000 linhas SEM AVISAR (ver
//    supabase_escala_lancamento.sql), e uma liga maior que isso ficava com um
//    pedaço invisível que ninguém tinha como notar.
//
// 2. ORDENAÇÃO DETERMINÍSTICA. `order by xp desc` sozinho deixa a ordem dos
//    empates a cargo do Postgres, e ela muda entre execuções — a tela se
//    atualiza sozinha a cada 3 min, então dois alunos com o mesmo XP ficavam
//    trocando de lugar sem nada ter acontecido. Todo `order` aqui desempata
//    por questões respondidas e, por último, por id (que nunca empata).
//
// 3. POSIÇÃO POR COMPETIÇÃO, CALCULADA UMA VEZ SÓ. Empate divide a mesma
//    posição (1, 2, 2, 4). Antes a linha da lista era numerada pelo índice do
//    array e a linha fixada de "Você" por uma contagem no banco — duas contas
//    diferentes pro mesmo aluno, que discordavam sempre que havia empate. Hoje
//    `posicao` vem pronta de `numerarPorCompeticao` e a tela só exibe.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  questlyGarantirSemanaLiga,
  questlyDestinoPorAgregado,
  questlySegundaDaSemana,
  QUESTLY_LIGAS,
  QUESTLY_LIGA_INFO,
  type Liga,
} from "@/lib/questly/liga";
import { questlyNivelDoXp } from "@/lib/questly/shared";
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
  /** posição por competição na liga (empate divide a mesma posição) */
  posicao: number;
  destino: -1 | 0 | 1;
  ehVoce: boolean;
  /** assinante Pro — o ranking marca com aro dourado (ver components/ranking/pro-visual). */
  pro: boolean;
};

export type GrupoLiga = {
  grupo: RankingRow[];
  hint: string;
  /** participantes da liga na semana — pode ser maior que grupo.length,
   *  que é o Top 100 exibido. */
  totalNaLiga: number;
  /** sua linha, mesmo quando você está fora do Top 100 exibido */
  voce: RankingRow | null;
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
  /** quantos alunos de fato pontuaram nesse recorte (não "quantas contas
   *  existem") — ver `contarParticipantes`. */
  totalAlunos: number;
  /** o aluno ainda não pontuou nesse recorte: não há posição pra mostrar,
   *  e inventar "último lugar" seria mentira. */
  semPontuacao: boolean;
};

const LIMITE_TOP = 100;

const COLUNAS_PERFIL =
  "id, nome, username, foto_url, xp_total, xp_semana, nivel, liga, questoes_total, streak_atual, semana_inicio, plano, plano_expira_em";

type PerfilBruto = {
  id: string;
  nome: string | null;
  username: string | null;
  foto_url: string | null;
  xp_total: number | null;
  xp_semana: number | null;
  nivel: number | null;
  liga: string | null;
  questoes_total: number | null;
  streak_atual: number | null;
  semana_inicio: string | null;
  plano?: string | null;
  plano_expira_em?: string | null;
};

/**
 * Posição por competição sobre uma lista JÁ ordenada: empatados dividem a
 * mesma posição e a seguinte pula (1, 2, 2, 4). É a mesma convenção que
 * `questlyDestinoNaLiga` usa pra decidir promoção — display e consequência
 * têm que sair da mesma régua, senão a tela promete uma coisa e a virada de
 * semana entrega outra.
 */
function numerarPorCompeticao<T>(itens: T[], valor: (t: T) => number): number[] {
  const posicoes: number[] = [];
  let ultimoValor: number | null = null;
  let ultimaPosicao = 0;
  itens.forEach((item, i) => {
    const v = valor(item);
    if (ultimoValor === null || v !== ultimoValor) {
      ultimaPosicao = i + 1;
      ultimoValor = v;
    }
    posicoes.push(ultimaPosicao);
  });
  return posicoes;
}

/**
 * XP da semana que CONTA de verdade.
 *
 * A virada de semana é preguiçosa (não há cron): `xp_semana` só zera quando
 * o aluno abre o app depois da segunda-feira. Quem não entrou ainda carrega
 * o XP da semana PASSADA na coluna — e o ranking semanal exibia isso como se
 * fosse desta semana, com gente no pódio por causa de pontos velhos. Aqui a
 * semana do perfil é conferida: `semana_inicio` diferente da segunda atual
 * significa zero nesta semana, sem exceção.
 */
function xpDaSemanaVigente(p: PerfilBruto, segundaAtual: string): number {
  if (String(p.semana_inicio || "").slice(0, 10) !== segundaAtual) return 0;
  return p.xp_semana || 0;
}

function paraLinhaGlobal(p: PerfilBruto, xp: number, posicao: number, meuId: string): RankingGlobalRow {
  return {
    id: p.id,
    nome: p.nome || "Aluno(a)",
    username: p.username || null,
    fotoUrl: p.foto_url,
    xp,
    // Derivado do XP em vez de lido da coluna: `profiles.nivel` nunca foi
    // escrito pelo app até supabase_ranking_fiel.sql, então num banco sem a
    // migração toda conta real aparecia no nível 1 ao lado das contas de
    // teste (que o seed semeia com nível alto). Derivar aqui faz a tela ficar
    // certa dos dois jeitos — e o dado e a exibição nunca divergem.
    nivel: questlyNivelDoXp(p.xp_total),
    liga: (p.liga as Liga) || QUESTLY_LIGAS[0],
    questoesTotal: p.questoes_total || 0,
    streakAtual: p.streak_atual || 0,
    posicao,
    ehVoce: p.id === meuId,
    pro: ehPro(p),
  };
}

export async function carregarRankingGlobal(
  supabase: SupabaseClient,
  user: { id: string },
  modo: ModoGlobal,
): Promise<RankingGlobal> {
  const segundaAtual = questlySegundaDaSemana(new Date());
  const coluna = modo === "geral" ? "xp_total" : "xp_semana";
  const desempate = modo === "geral" ? "questoes_total" : "questoes_semana";

  // O Top 100 e a contagem de participantes só olham quem PONTUOU
  // (`.gt(coluna, 0)`): uma conta recém-criada não é "o último colocado", ela
  // simplesmente ainda não entrou na disputa. Sem esse filtro, o rodapé dizia
  // "1.200 alunos" contando perfis vazios e o Top 100 se enchia de zeros
  // enquanto a base era pequena.
  let consultaTop = supabase
    .from("profiles")
    .select(COLUNAS_PERFIL)
    .gt(coluna, 0)
    .order(coluna, { ascending: false })
    .order(desempate, { ascending: false })
    .order("id", { ascending: true })
    .limit(LIMITE_TOP);
  if (modo === "semana") consultaTop = consultaTop.eq("semana_inicio", segundaAtual);

  const [{ data: topRaw }, { data: meuPerfilRaw }, totalAlunos] = await Promise.all([
    consultaTop,
    supabase.from("profiles").select(COLUNAS_PERFIL).eq("id", user.id).maybeSingle(),
    contarParticipantes(supabase, coluna, modo === "semana" ? segundaAtual : null),
  ]);

  const meuPerfil = (meuPerfilRaw as PerfilBruto | null) ?? null;
  const valor = (p: PerfilBruto) => (modo === "geral" ? p.xp_total || 0 : xpDaSemanaVigente(p, segundaAtual));

  const brutos = (topRaw || []) as PerfilBruto[];
  const posicoes = numerarPorCompeticao(brutos, valor);
  const linhas = brutos.map((p, i) => paraLinhaGlobal(p, valor(p), posicoes[i], user.id));

  const meuValor = meuPerfil ? valor(meuPerfil) : 0;
  const semPontuacao = meuValor <= 0;

  // Posição do aluno: quantos têm métrica estritamente maior (+1) — a MESMA
  // régua de `numerarPorCompeticao`, pra linha fixada e linha da lista nunca
  // discordarem. Quem ainda não pontuou não recebe posição nenhuma.
  let posicaoVoce = 0;
  if (meuPerfil && !semPontuacao) {
    const minhaLinhaNoTop = linhas.find((l) => l.id === user.id);
    if (minhaLinhaNoTop) {
      posicaoVoce = minhaLinhaNoTop.posicao;
    } else {
      let consultaAcima = supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt(coluna, meuValor);
      if (modo === "semana") consultaAcima = consultaAcima.eq("semana_inicio", segundaAtual);
      const { count: acima } = await consultaAcima;
      posicaoVoce = (acima || 0) + 1;
    }
  }

  const voce = meuPerfil ? paraLinhaGlobal(meuPerfil, meuValor, posicaoVoce, user.id) : null;

  return {
    modo,
    linhas,
    voce,
    posicaoVoce,
    foraDoTop: !semPontuacao && !linhas.some((l) => l.ehVoce),
    totalAlunos,
    semPontuacao,
  };
}

async function contarParticipantes(
  supabase: SupabaseClient,
  coluna: string,
  semanaInicio: string | null,
): Promise<number> {
  let q = supabase.from("profiles").select("id", { count: "exact", head: true }).gt(coluna, 0);
  if (semanaInicio) q = q.eq("semana_inicio", semanaInicio);
  const { count } = await q;
  return count || 0;
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
  totalNaLiga: number;
  voce: RankingRow | null;
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
//
// São três consultas de propósito: o Top 100 que a tela mostra, e dois
// COUNT (tamanho da liga e quantos pontuaram) que NÃO cabem no Top 100 mas
// são o que define as zonas de promoção/rebaixamento. Carregar a liga
// inteira só pra contar seria O(nº de alunos) e ainda bateria no teto de
// 1.000 linhas do PostgREST — ver questlyDestinoPorAgregado.
export async function buscarGrupoLiga(
  supabase: SupabaseClient,
  liga: Liga,
  semanaInicio: string,
  meuId: string,
): Promise<GrupoLiga> {
  const base = () =>
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("liga", liga).eq("semana_inicio", semanaInicio);

  const [{ data: alunos }, { count: totalNaLiga }, { count: ativos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, username, foto_url, xp_semana, questoes_semana, semana_inicio, plano, plano_expira_em")
      .eq("liga", liga)
      .eq("semana_inicio", semanaInicio)
      .order("xp_semana", { ascending: false })
      .order("questoes_semana", { ascending: false })
      .order("id", { ascending: true })
      .limit(LIMITE_TOP),
    base(),
    base().gt("xp_semana", 0),
  ]);

  const lista = alunos || [];
  const n = totalNaLiga || lista.length;
  const indiceLiga = QUESTLY_LIGAS.indexOf(liga);
  const posicoes = numerarPorCompeticao(lista, (a) => a.xp_semana || 0);

  const grupo: RankingRow[] = lista.map((a, i) => {
    const xp = a.xp_semana || 0;
    return {
      id: a.id,
      nome: a.nome || "Aluno(a)",
      username: a.username || null,
      fotoUrl: a.foto_url,
      xpSemana: xp,
      questoesSemana: a.questoes_semana || 0,
      posicao: posicoes[i],
      // `estritamenteAcima` sai da posição por competição: quem divide a
      // posição 7 tem exatamente 6 pessoas com XP maior. Vale pro Top 100
      // inteiro porque ninguém com XP maior pode estar fora dele.
      destino: questlyDestinoPorAgregado({
        n,
        ativos: ativos || 0,
        estritamenteAcima: posicoes[i] - 1,
        meuXp: xp,
        indiceLiga,
      }),
      ehVoce: a.id === meuId,
      pro: ehPro(a),
    };
  });

  // Fora do Top 100 o aluno some da lista — e some junto a única informação
  // que ele veio buscar. Uma consulta a mais traz a linha dele com a posição
  // real, pra tela poder fixá-la no topo.
  let voce = grupo.find((g) => g.ehVoce) || null;
  if (!voce) voce = await buscarMinhaLinhaNaLiga(supabase, liga, semanaInicio, meuId, n, ativos || 0, indiceLiga);

  let hint: string;
  if (n === 0) {
    hint = "Ninguém nessa liga essa semana ainda.";
  } else if (n === 1) {
    hint = "Só tem um aluno nessa liga essa semana até agora.";
  } else if (n < MIN_GRUPO_REBAIXAMENTO) {
    hint = `Zona verde sobe de liga. Liga pequena essa semana: ninguém é rebaixado com menos de ${MIN_GRUPO_REBAIXAMENTO} participantes.`;
  } else if (n > LIMITE_TOP) {
    hint = `Zona verde sobe de liga no fim da semana · zona vermelha cai. Mostrando os ${LIMITE_TOP} primeiros de ${n.toLocaleString("pt-BR")} nessa liga.`;
  } else {
    hint = "Zona verde sobe de liga no fim da semana · zona vermelha cai.";
  }

  return { grupo, hint, totalNaLiga: n, voce };
}

async function buscarMinhaLinhaNaLiga(
  supabase: SupabaseClient,
  liga: Liga,
  semanaInicio: string,
  meuId: string,
  n: number,
  ativos: number,
  indiceLiga: number,
): Promise<RankingRow | null> {
  const { data: eu } = await supabase
    .from("profiles")
    .select("id, nome, username, foto_url, xp_semana, questoes_semana, liga, semana_inicio, plano, plano_expira_em")
    .eq("id", meuId)
    .maybeSingle();
  if (!eu || eu.liga !== liga || String(eu.semana_inicio || "").slice(0, 10) !== semanaInicio) return null;

  const meuXp = eu.xp_semana || 0;
  const { count: acima } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("liga", liga)
    .eq("semana_inicio", semanaInicio)
    .gt("xp_semana", meuXp);
  const estritamenteAcima = acima || 0;

  return {
    id: eu.id,
    nome: eu.nome || "Aluno(a)",
    username: eu.username || null,
    fotoUrl: eu.foto_url,
    xpSemana: meuXp,
    questoesSemana: eu.questoes_semana || 0,
    posicao: estritamenteAcima + 1,
    destino: questlyDestinoPorAgregado({ n, ativos, estritamenteAcima, meuXp, indiceLiga }),
    ehVoce: true,
    pro: ehPro(eu),
  };
}

export async function carregarDadosRanking(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<DadosRanking | null> {
  const estado = await questlyGarantirSemanaLiga(supabase, user, () => createAdminClient());
  if (!estado) return null;

  const { grupo, hint, totalNaLiga, voce } = await buscarGrupoLiga(
    supabase,
    estado.liga,
    estado.semana_inicio,
    user.id,
  );
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
    totalNaLiga,
    voce,
  };
}
