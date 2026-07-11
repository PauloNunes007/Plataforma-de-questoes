// ============================================================
// QUESTLY — liga.js
// Ligas semanais estilo Duolingo. Não há cron no servidor (é tudo
// client-side), então a virada de semana acontece de forma
// "preguiçosa": toda vez que questlyGarantirSemanaLiga roda (no
// dashboard, na tela de ranking, e ao ganhar XP em questao.js), ela
// confere se a semana do profile já é a atual; se não for, fecha a
// semana anterior (calcula promoção/rebaixamento e zera os
// contadores) antes de continuar.
//
// A regra de promoção/rebaixamento vive inteira em
// questlyDestinoNaLiga — a tela de ranking usa a MESMA função pra
// pintar as zonas, então o que o aluno vê é exatamente o que
// acontece na virada. Fundamentos estatísticos da regra:
//
// 1. Ranking de competição com empates deterministas. Ordenar por
//    XP e usar a posição do sort é não-determinístico em empates
//    (a ordem de chegada das linhas decidiria quem sobe). Em vez
//    disso contamos quantos têm XP ESTRITAMENTE maior/menor:
//    - promoção: sobe quem tem menos de `cotaSubir` pessoas
//      estritamente acima — empatados no topo sobem juntos
//      (generoso com o aluno, e determinístico);
//    - rebaixamento: um grupo de empatados só cai se o grupo
//      INTEIRO couber na zona (count(xp <= meu) <= cotaCair) —
//      empate nunca decide sozinho quem cai (conservador: não se
//      pune sem evidência que distinga os empatados).
//
// 2. Porta de participação: promoção exige xp > 0. Zero XP é
//    ausência de evidência de engajamento — não se promove por
//    default. Inativos afundam naturalmente pro fim da fila e caem
//    quando a liga é grande o suficiente pra zona existir.
//
// 3. Proteção de amostra pequena: rebaixamento só existe com
//    n >= QUESTLY_MIN_GRUPO_REBAIXAMENTO. Numa liga de 2-4 pessoas,
//    "ficar em último" carrega pouquíssima informação (alta
//    variância da posição relativa) — punir com base nisso seria
//    decidir por ruído. Promoção continua possível (errar pra cima
//    custa pouco; errar pra baixo frustra).
//
// 4. Cotas por fração fixa (30%/30%) com round():
//    mantém o fluxo entre ligas aproximadamente estacionário
//    (entra ~30%, sai ~30%) pra população não acumular toda numa
//    liga só ao longo das semanas.
//
// Cada aluno só grava a própria linha em `profiles` (nunca a de
// outro); a regra é uma função pura e determinística dos XPs da
// semana, então todos os clientes chegam ao mesmo veredito.
// ============================================================

const QUESTLY_LIGAS = ['bronze', 'prata', 'ouro', 'platina', 'diamante'];
const QUESTLY_LIGA_INFO = {
  bronze: { nome: 'Bronze', icone: '🥉' },
  prata: { nome: 'Prata', icone: '🥈' },
  ouro: { nome: 'Ouro', icone: '🥇' },
  platina: { nome: 'Platina', icone: '💠' },
  diamante: { nome: 'Diamante', icone: '💎' },
};

const QUESTLY_FRACAO_PROMOCAO = 0.30;
const QUESTLY_FRACAO_REBAIXAMENTO = 0.30;
const QUESTLY_MIN_GRUPO_REBAIXAMENTO = 5;

// segunda-feira (00:00, hora local) da semana de `d`, como "YYYY-MM-DD" —
// é a chave que agrupa todo mundo na mesma "rodada" do ranking
function questlySegundaDaSemana(d) {
  const data = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diaSemana = data.getDay(); // 0=dom .. 6=sáb
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  data.setDate(data.getDate() + deslocamento);
  return data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
}

/**
 * Decide o destino de um aluno na virada da semana, dado o grupo da liga.
 * Função pura — também é usada pela tela de ranking pra pintar as zonas.
 *
 * @param {number[]} xps       xp_semana de TODOS do grupo (incluindo o aluno)
 * @param {number}   meuXp     xp_semana do aluno avaliado
 * @param {number}   indiceLiga posição da liga atual em QUESTLY_LIGAS
 * @returns {number} +1 promove, -1 rebaixa, 0 permanece
 */
function questlyDestinoNaLiga(xps, meuXp, indiceLiga) {
  const n = xps.length;
  if (n < 2) return 0; // sozinho não há disputa

  const ativos = xps.filter(function (x) { return x > 0; }).length;
  const cotaSubir = Math.min(ativos, Math.max(1, Math.round(n * QUESTLY_FRACAO_PROMOCAO)));
  const cotaCair = n >= QUESTLY_MIN_GRUPO_REBAIXAMENTO ? Math.round(n * QUESTLY_FRACAO_REBAIXAMENTO) : 0;

  const estritamenteAcima = xps.filter(function (x) { return x > meuXp; }).length;
  const euEAbaixo = xps.filter(function (x) { return x <= meuXp; }).length; // inclui o próprio aluno e empatados

  if (meuXp > 0 && estritamenteAcima < cotaSubir && indiceLiga < QUESTLY_LIGAS.length - 1) return 1;
  if (cotaCair > 0 && euEAbaixo <= cotaCair && indiceLiga > 0) return -1;
  return 0;
}

/**
 * Garante que profiles.semana_inicio do usuário é a semana atual. Se não
 * for (ou nunca tiver sido definida), fecha a semana anterior — calcula
 * promoção/rebaixamento com base no xp_semana de quem estava na mesma liga
 * naquela semana — e zera xp_semana/questoes_semana pra semana nova.
 * Retorna o estado atual (já correto pra semana de hoje): { liga,
 * xp_semana, questoes_semana, semana_inicio }.
 */
async function questlyGarantirSemanaLiga(user) {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('liga, xp_semana, questoes_semana, semana_inicio')
    .eq('id', user.id)
    .single();
  if (error || !profile) {
    console.error('Erro ao carregar estado da liga:', error);
    return null;
  }

  const segundaAtual = questlySegundaDaSemana(new Date());
  const ligaAtual = profile.liga || QUESTLY_LIGAS[0];

  if (profile.semana_inicio === segundaAtual) {
    return { liga: ligaAtual, xp_semana: profile.xp_semana || 0, questoes_semana: profile.questoes_semana || 0, semana_inicio: segundaAtual };
  }

  let novaLiga = ligaAtual;

  if (profile.semana_inicio) {
    // guarda o resultado da semana que está fechando antes de zerar —
    // idempotente (ignora se essa semana já tinha sido salva)
    const { error: histError } = await supabaseClient.from('historico_semanal').upsert(
      {
        user_id: user.id,
        semana_inicio: profile.semana_inicio,
        liga: ligaAtual,
        xp_semana: profile.xp_semana || 0,
        questoes_semana: profile.questoes_semana || 0,
      },
      { onConflict: 'user_id,semana_inicio', ignoreDuplicates: true }
    );
    if (histError) console.error('Erro ao guardar histórico semanal:', histError);

    novaLiga = await questlyCalcularNovaLiga(user.id, ligaAtual, profile.semana_inicio, profile.xp_semana || 0);
  }

  const { data: atualizado, error: updateError } = await supabaseClient
    .from('profiles')
    .update({ liga: novaLiga, xp_semana: 0, questoes_semana: 0, semana_inicio: segundaAtual })
    .eq('id', user.id)
    .select('liga, xp_semana, questoes_semana, semana_inicio')
    .single();

  if (updateError) {
    console.error('Erro ao virar a semana da liga:', updateError);
    return { liga: ligaAtual, xp_semana: 0, questoes_semana: 0, semana_inicio: profile.semana_inicio };
  }
  return atualizado;
}

// Junta quem ainda está com semana_inicio antigo em `profiles` (não logou
// essa semana ainda) com quem já fechou e foi pro `historico_semanal` —
// sem isso, o primeiro aluno a virar a semana "some" do grupo de quem vira
// depois, porque a linha dele em profiles já mudou de semana_inicio.
async function questlyCalcularNovaLiga(meuId, liga, semanaAnterior, meuXp) {
  const [{ data: aoVivo }, { data: historico }] = await Promise.all([
    supabaseClient.from('profiles').select('id, xp_semana').eq('liga', liga).eq('semana_inicio', semanaAnterior),
    supabaseClient.from('historico_semanal').select('user_id, xp_semana').eq('liga', liga).eq('semana_inicio', semanaAnterior),
  ]);

  const xpPorId = {};
  (aoVivo || []).forEach(function (p) { xpPorId[p.id] = p.xp_semana || 0; });
  (historico || []).forEach(function (h) { if (!(h.user_id in xpPorId)) xpPorId[h.user_id] = h.xp_semana || 0; });
  xpPorId[meuId] = meuXp; // garante que eu conto com o meu xp da semana que fechou

  const xps = Object.keys(xpPorId).map(function (id) { return xpPorId[id]; });
  const destino = questlyDestinoNaLiga(xps, meuXp, QUESTLY_LIGAS.indexOf(liga));

  if (destino > 0) return QUESTLY_LIGAS[QUESTLY_LIGAS.indexOf(liga) + 1];
  if (destino < 0) return QUESTLY_LIGAS[QUESTLY_LIGAS.indexOf(liga) - 1];
  return liga;
}
