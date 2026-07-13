// Portado de js/liga.js — ligas semanais estilo Duolingo (a mecânica, não
// o visual). Sem cron no servidor: a virada de semana é "preguiçosa" —
// questlyGarantirSemanaLiga fecha a semana anterior (promoção/rebaixamento
// + zera contadores) na primeira vez que roda depois da virada. Ver
// cabeçalho do arquivo legado pra fundamentação estatística completa.
import type { SupabaseClient } from "@supabase/supabase-js";

export const QUESTLY_LIGAS = ["bronze", "prata", "ouro", "platina", "diamante"] as const;
export type Liga = (typeof QUESTLY_LIGAS)[number];

export const QUESTLY_LIGA_INFO: Record<Liga, { nome: string; icone: string }> = {
  bronze: { nome: "Bronze", icone: "🥉" },
  prata: { nome: "Prata", icone: "🥈" },
  ouro: { nome: "Ouro", icone: "🥇" },
  platina: { nome: "Platina", icone: "💠" },
  diamante: { nome: "Diamante", icone: "💎" },
};

const QUESTLY_FRACAO_PROMOCAO = 0.3;
const QUESTLY_FRACAO_REBAIXAMENTO = 0.3;
const QUESTLY_MIN_GRUPO_REBAIXAMENTO = 5;

export function questlySegundaDaSemana(d: Date): string {
  const data = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diaSemana = data.getDay();
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  data.setDate(data.getDate() + deslocamento);
  return (
    data.getFullYear() +
    "-" +
    String(data.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(data.getDate()).padStart(2, "0")
  );
}

export function questlyDestinoNaLiga(xps: number[], meuXp: number, indiceLiga: number): -1 | 0 | 1 {
  const n = xps.length;
  if (n < 2) return 0;

  const ativos = xps.filter((x) => x > 0).length;
  const cotaSubir = Math.min(ativos, Math.max(1, Math.round(n * QUESTLY_FRACAO_PROMOCAO)));
  const cotaCair = n >= QUESTLY_MIN_GRUPO_REBAIXAMENTO ? Math.round(n * QUESTLY_FRACAO_REBAIXAMENTO) : 0;

  const estritamenteAcima = xps.filter((x) => x > meuXp).length;
  const euEAbaixo = xps.filter((x) => x <= meuXp).length;

  if (meuXp > 0 && estritamenteAcima < cotaSubir && indiceLiga < QUESTLY_LIGAS.length - 1) return 1;
  if (cotaCair > 0 && euEAbaixo <= cotaCair && indiceLiga > 0) return -1;
  return 0;
}

export type EstadoLiga = {
  liga: Liga;
  xp_semana: number;
  questoes_semana: number;
  semana_inicio: string;
};

export async function questlyGarantirSemanaLiga(
  supabase: SupabaseClient,
  user: { id: string },
  // As colunas de liga (liga/xp_semana/semana_inicio) em `profiles` são
  // protegidas por trigger (supabase_seguranca_hardening.sql) — a virada de
  // semana precisa escrever via service_role. Esse factory é chamado SÓ quando
  // há virada, então as leituras normais (mesma semana) não constroem o
  // cliente admin nem exigem a chave service_role.
  obterClienteEscrita?: () => SupabaseClient,
): Promise<EstadoLiga | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("liga, xp_semana, questoes_semana, semana_inicio")
    .eq("id", user.id)
    .single();
  if (error || !profile) {
    console.error("Erro ao carregar estado da liga:", error);
    return null;
  }

  const segundaAtual = questlySegundaDaSemana(new Date());
  const ligaAtual: Liga = profile.liga || QUESTLY_LIGAS[0];

  if (profile.semana_inicio === segundaAtual) {
    return {
      liga: ligaAtual,
      xp_semana: profile.xp_semana || 0,
      questoes_semana: profile.questoes_semana || 0,
      semana_inicio: segundaAtual,
    };
  }

  let novaLiga = ligaAtual;

  if (profile.semana_inicio) {
    const { error: histError } = await supabase.from("historico_semanal").upsert(
      {
        user_id: user.id,
        semana_inicio: profile.semana_inicio,
        liga: ligaAtual,
        xp_semana: profile.xp_semana || 0,
        questoes_semana: profile.questoes_semana || 0,
      },
      { onConflict: "user_id,semana_inicio", ignoreDuplicates: true },
    );
    if (histError) console.error("Erro ao guardar histórico semanal:", histError);

    novaLiga = await questlyCalcularNovaLiga(
      supabase,
      user.id,
      ligaAtual,
      profile.semana_inicio,
      profile.xp_semana || 0,
    );
  }

  const escrita = obterClienteEscrita ? obterClienteEscrita() : supabase;
  const { data: atualizado, error: updateError } = await escrita
    .from("profiles")
    .update({ liga: novaLiga, xp_semana: 0, questoes_semana: 0, semana_inicio: segundaAtual })
    .eq("id", user.id)
    .select("liga, xp_semana, questoes_semana, semana_inicio")
    .single();

  if (updateError) {
    console.error("Erro ao virar a semana da liga:", updateError);
    return { liga: ligaAtual, xp_semana: 0, questoes_semana: 0, semana_inicio: profile.semana_inicio };
  }
  return atualizado;
}

async function questlyCalcularNovaLiga(
  supabase: SupabaseClient,
  meuId: string,
  liga: Liga,
  semanaAnterior: string,
  meuXp: number,
): Promise<Liga> {
  const [{ data: aoVivo }, { data: historico }] = await Promise.all([
    supabase.from("profiles").select("id, xp_semana").eq("liga", liga).eq("semana_inicio", semanaAnterior),
    supabase
      .from("historico_semanal")
      .select("user_id, xp_semana")
      .eq("liga", liga)
      .eq("semana_inicio", semanaAnterior),
  ]);

  const xpPorId: Record<string, number> = {};
  (aoVivo || []).forEach((p) => (xpPorId[p.id] = p.xp_semana || 0));
  (historico || []).forEach((h) => {
    if (!(h.user_id in xpPorId)) xpPorId[h.user_id] = h.xp_semana || 0;
  });
  xpPorId[meuId] = meuXp;

  const xps = Object.values(xpPorId);
  const destino = questlyDestinoNaLiga(xps, meuXp, QUESTLY_LIGAS.indexOf(liga));

  if (destino > 0) return QUESTLY_LIGAS[QUESTLY_LIGAS.indexOf(liga) + 1];
  if (destino < 0) return QUESTLY_LIGAS[QUESTLY_LIGAS.indexOf(liga) - 1];
  return liga;
}
