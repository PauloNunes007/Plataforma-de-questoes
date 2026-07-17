// ============================================================
// Inferência da rede em produção — SEMPRE com fallback pro BKT.
//
// `carregarModeloAtivo` busca o único modelo `ativo` de `ml_modelos`
// (só existe um; um modelo só fica ativo se venceu o baseline na
// validação temporal — ver treinar.ts). Sem modelo ativo, ou com
// versão de features incompatível, tudo cai em questlyProjetarProva —
// o comportamento atual do app, sem regressão possível.
//
// A rede prevê P(acerto de uma questão), que inclui o piso de chute
// (~pG). A UI de projeção fala em "força" (escala do BKT, m×R), então
// invertemos o canal slip/guess pra voltar à escala de conhecimento:
//   conhecimento = (p − pG) / (1 − pS − pG)
// — assim QUESTLY_FORCA_RISCO e todos os limiares existentes seguem
// válidos com ou sem rede.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  QUESTLY_BKT_GUESS,
  QUESTLY_BKT_SLIP,
  QUESTLY_ESTABILIDADE_INICIAL,
  QUESTLY_FORCA_RISCO,
  questlyEstadoEfetivo,
  questlyForcaNaProva,
  questlyProjetarProva,
  type ProgressoBruto,
} from "@/lib/questly/motor-aprovacao";
import { montarFeatures, VERSAO_FEATURES } from "./features";
import { preverRede, type RedeSerializada } from "./rede";

export type ModeloAtivo = { rede: RedeSerializada; criadoEm: string };

export async function carregarModeloAtivo(supabase: SupabaseClient): Promise<ModeloAtivo | null> {
  const { data } = await supabase
    .from("ml_modelos")
    .select("pesos, versao_features, criado_em")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.pesos || data.versao_features !== VERSAO_FEATURES) return null;
  return { rede: data.pesos as RedeSerializada, criadoEm: data.criado_em as string };
}

function probParaForca(p: number): number {
  const conhecimento = (p - QUESTLY_BKT_GUESS) / (1 - QUESTLY_BKT_SLIP - QUESTLY_BKT_GUESS);
  return Math.min(1, Math.max(0, conhecimento));
}

// Força de UM tópico projetada pro dia da prova, na régua que estiver
// valendo: BKT puro sem modelo, rede quando há modelo ativo. É o átomo
// de projetarProvaComRede e também a régua injetada na rota Δnota/min
// (lib/questly/rota-aprovacao.ts) — a rota precisa enxergar exatamente
// a mesma força da nota exibida, senão prometeria ganhos noutra escala.
export function forcaTopicoComRede(
  modelo: ModeloAtivo | null,
  t: ProgressoBruto & { id: string },
  dataProvaMs: number,
  agoraMs: number,
): number {
  if (!modelo) return questlyForcaNaProva(t, dataProvaMs, agoraMs);

  // Nunca estudado chega a zero — lacuna, não prior (paridade com o motor).
  if (!t.ultima_revisao) return 0;
  const alvoMs = Math.max(dataProvaMs, agoraMs);
  const { maestria, estabilidade } = questlyEstadoEfetivo(t);
  const dias = Math.max(0, (alvoMs - new Date(t.ultima_revisao).getTime()) / 86_400_000);
  const retencaoNaProva = Math.exp(-dias / Math.max(QUESTLY_ESTABILIDADE_INICIAL, estabilidade));
  const p = preverRede(
    modelo.rede,
    montarFeatures({
      maestria,
      retencao: retencaoNaProva,
      numRespondidasTopico: t.num_questoes_respondidas ?? 0,
      estabilidade,
      dificuldade: null, // projeção agregada: marginaliza sobre a dificuldade
      jaRespondeuQuestao: false, // dia de prova = questões inéditas
      taxaGlobalQuestao: null,
      taxaGeralAluno: null,
      diasSemEstudar: null,
      posicaoNaSessao: null,
    }),
  );
  return probParaForca(p);
}

// Mesmo contrato de questlyProjetarProva — com `modelo` null é LITERALMENTE
// questlyProjetarProva. Com modelo, a força de cada tópico vem da rede
// avaliada com a retenção projetada pro dia da prova e features de
// questão neutras (a projeção é agregada por tópico, não por questão).
export function projetarProvaComRede(
  modelo: ModeloAtivo | null,
  topicos: Array<ProgressoBruto & { id: string }>,
  dataProvaMs: number,
  agoraMs: number,
): ReturnType<typeof questlyProjetarProva> & { usouRede: boolean } {
  if (!modelo) {
    return { ...questlyProjetarProva(topicos, dataProvaMs, agoraMs), usouRede: false };
  }

  if (topicos.length === 0) {
    return { notaProjetada: null, forcaMedia: 0, emRisco: [], porTopico: [], usouRede: true };
  }

  const porTopico = topicos.map((t) => ({
    id: t.id,
    forca: forcaTopicoComRede(modelo, t, dataProvaMs, agoraMs),
  }));

  const forcaMedia = porTopico.reduce((acc, x) => acc + x.forca, 0) / porTopico.length;
  const emRisco = porTopico.filter((x) => x.forca < QUESTLY_FORCA_RISCO).map((x) => x.id);
  return { notaProjetada: Math.round(forcaMedia * 100), forcaMedia, emRisco, porTopico, usouRede: true };
}
