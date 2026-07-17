// ============================================================
// Treino + avaliação honesta da rede de P(acerto).
//
// Regras de honestidade (não relaxar sem pensar):
//  1. Split TEMPORAL 80/20 — valida-se no futuro, nunca em tentativas
//     misturadas no tempo (senão a métrica mente por vazamento).
//  2. A rede compete contra o baseline BKT (o que o motor atual já
//     prevê de graça). Só vira `ativo` se ganhar em log-loss na
//     validação por uma margem mínima E houver dados suficientes.
//  3. Toda rodada é gravada em `ml_modelos` com as métricas completas
//     (inclusive as do baseline) — dá pra auditar por que um modelo
//     foi ou não ativado.
// Se o gate reprovar, o app segue no BKT — o aluno nunca vê um número
// vindo de um modelo pior que o atual.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { montarDatasetDoBanco, type Exemplo } from "./dataset";
import { NUM_FEATURES, VERSAO_FEATURES } from "./features";
import { perdaLogLoss, preverRede, treinarRede, type RedeSerializada } from "./rede";

export const MIN_EXEMPLOS_PARA_ATIVAR = 500;
export const MIN_VALIDACAO = 100;
export const MARGEM_LOG_LOSS = 0.002; // ganho mínimo sobre o baseline pra ativar

const ARQUITETURA = [NUM_FEATURES, 16, 8, 1];

export type FaixaCalibracao = { faixa: string; previsto: number; observado: number; n: number };

export type MetricasModelo = {
  exemplosTotal: number;
  exemplosTreino: number;
  exemplosValidacao: number;
  epocas: number;
  logLoss: number;
  brier: number;
  auc: number | null;
  baselineLogLoss: number;
  baselineBrier: number;
  baselineAuc: number | null;
  taxaAcertoValidacao: number;
  calibracao: FaixaCalibracao[];
};

export type ResultadoTreinoCompleto = {
  rede: RedeSerializada | null; // null = dados insuficientes até pra treinar
  metricas: MetricasModelo | null;
  venceuBaseline: boolean;
  motivo: string; // explicação legível do veredito (vai pro admin)
};

function brier(previsoes: number[], rotulos: number[]): number {
  let soma = 0;
  for (let i = 0; i < previsoes.length; i++) soma += (previsoes[i] - rotulos[i]) ** 2;
  return soma / Math.max(1, previsoes.length);
}

// AUC via estatística de Mann–Whitney com ranks médios para empates.
function auc(previsoes: number[], rotulos: number[]): number | null {
  const nPos = rotulos.filter((r) => r === 1).length;
  const nNeg = rotulos.length - nPos;
  if (nPos === 0 || nNeg === 0) return null;
  const ordenado = previsoes.map((p, i) => ({ p, r: rotulos[i] })).sort((a, b) => a.p - b.p);
  let somaRanksPos = 0;
  let i = 0;
  while (i < ordenado.length) {
    let j = i;
    while (j + 1 < ordenado.length && ordenado[j + 1].p === ordenado[i].p) j++;
    const rankMedio = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) if (ordenado[k].r === 1) somaRanksPos += rankMedio;
    i = j + 1;
  }
  return (somaRanksPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

function calibracao(previsoes: number[], rotulos: number[]): FaixaCalibracao[] {
  const faixas: FaixaCalibracao[] = [];
  for (let f = 0; f < 10; f++) {
    const de = f / 10;
    const ate = (f + 1) / 10;
    let n = 0;
    let somaPrev = 0;
    let somaObs = 0;
    for (let i = 0; i < previsoes.length; i++) {
      if (previsoes[i] >= de && (previsoes[i] < ate || (f === 9 && previsoes[i] <= 1))) {
        n++;
        somaPrev += previsoes[i];
        somaObs += rotulos[i];
      }
    }
    if (n > 0) {
      faixas.push({
        faixa: `${Math.round(de * 100)}–${Math.round(ate * 100)}%`,
        previsto: somaPrev / n,
        observado: somaObs / n,
        n,
      });
    }
  }
  return faixas;
}

// Pura — o teste sintético chama isto direto com exemplos gerados.
export function treinarEAvaliar(exemplos: Exemplo[], seed = 42): ResultadoTreinoCompleto {
  if (exemplos.length < 50) {
    return {
      rede: null,
      metricas: null,
      venceuBaseline: false,
      motivo: `Só ${exemplos.length} tentativas com tópico no banco — mínimo de 50 pra sequer treinar. O app segue 100% no BKT.`,
    };
  }

  const ordenados = [...exemplos].sort((a, b) => a.timestampMs - b.timestampMs);
  const corte = Math.floor(ordenados.length * 0.8);
  const treino = ordenados.slice(0, corte);
  const validacao = ordenados.slice(corte);

  const resultado = treinarRede(
    treino.map((e) => e.features),
    treino.map((e) => e.rotulo),
    validacao.map((e) => e.features),
    validacao.map((e) => e.rotulo),
    ARQUITETURA,
    { seed },
  );

  const prevVal = validacao.map((e) => preverRede(resultado.rede, e.features));
  const baseVal = validacao.map((e) => e.baseline);
  const rotVal = validacao.map((e) => e.rotulo);

  const metricas: MetricasModelo = {
    exemplosTotal: ordenados.length,
    exemplosTreino: treino.length,
    exemplosValidacao: validacao.length,
    epocas: resultado.epocasRodadas,
    logLoss: perdaLogLoss(prevVal, rotVal),
    brier: brier(prevVal, rotVal),
    auc: auc(prevVal, rotVal),
    baselineLogLoss: perdaLogLoss(baseVal, rotVal),
    baselineBrier: brier(baseVal, rotVal),
    baselineAuc: auc(baseVal, rotVal),
    taxaAcertoValidacao: rotVal.reduce<number>((a, b) => a + b, 0) / Math.max(1, rotVal.length),
    calibracao: calibracao(prevVal, rotVal),
  };

  let venceu = false;
  let motivo: string;
  const ganho = metricas.baselineLogLoss - metricas.logLoss;
  if (ordenados.length < MIN_EXEMPLOS_PARA_ATIVAR || validacao.length < MIN_VALIDACAO) {
    motivo = `Treinou, mas com ${ordenados.length} exemplos (validação ${validacao.length}) ainda não há volume pra confiar (mínimos: ${MIN_EXEMPLOS_PARA_ATIVAR}/${MIN_VALIDACAO}). Ganho de log-loss medido: ${ganho.toFixed(4)}. O app segue no BKT.`;
  } else if (ganho < MARGEM_LOG_LOSS) {
    motivo = `A rede NÃO superou o baseline BKT na validação temporal (log-loss ${metricas.logLoss.toFixed(4)} vs ${metricas.baselineLogLoss.toFixed(4)}). Isso é o resultado honesto esperado com pouco dado — o app segue no BKT até uma rodada futura ganhar.`;
  } else {
    venceu = true;
    motivo = `Rede ativada: venceu o baseline BKT na validação temporal (log-loss ${metricas.logLoss.toFixed(4)} vs ${metricas.baselineLogLoss.toFixed(4)}, ganho ${ganho.toFixed(4)}; AUC ${metricas.auc?.toFixed(3) ?? "—"} vs ${metricas.baselineAuc?.toFixed(3) ?? "—"}).`;
  }

  return { rede: resultado.rede, metricas, venceuBaseline: venceu, motivo };
}

// Wrapper com Supabase: monta o dataset real, treina e grava a rodada.
// `admin` DEVE ser o cliente service_role (createAdminClient) — tanto pra
// ler question_attempts de todos quanto pra escrever em ml_modelos.
export async function treinarESalvar(admin: SupabaseClient, seed = 42) {
  const { exemplos, totalTentativas } = await montarDatasetDoBanco(admin);
  const resultado = treinarEAvaliar(exemplos, seed);

  if (resultado.venceuBaseline) {
    // Um único modelo ativo por vez.
    await admin.from("ml_modelos").update({ ativo: false }).eq("ativo", true);
  }
  const { error } = await admin.from("ml_modelos").insert({
    versao_features: VERSAO_FEATURES,
    pesos: resultado.rede,
    metricas: resultado.metricas,
    venceu_baseline: resultado.venceuBaseline,
    ativo: resultado.venceuBaseline,
    num_exemplos: resultado.metricas?.exemplosTotal ?? exemplos.length,
    motivo: resultado.motivo,
  });
  if (error) throw new Error(`Falha ao salvar o modelo: ${error.message}`);

  return { ...resultado, totalTentativas };
}
