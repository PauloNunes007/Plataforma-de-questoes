// Recortes puros sobre os buckets de `desempenho-data.ts`. Sem Supabase, sem
// React: o servidor manda o histórico agregado uma vez e o filtro de período
// é só aritmética aqui.
//
// Regra de honestidade (mesma de chance-aprovacao.ts): uma área com amostra
// minúscula NÃO vira "melhor área" nem "ponto de atenção" — 1 acerto em 1
// questão é ruído, não desempenho. Quem não alcança `MIN_AMOSTRA_AREA` volta
// como `null` e a UI diz o que falta.

import type { BucketDesempenho, DesempenhoDados } from "./desempenho-data";

export const PERIODOS = [
  { id: "total", rotulo: "Total", dias: null },
  { id: "7", rotulo: "7 dias", dias: 7 },
  { id: "30", rotulo: "30 dias", dias: 30 },
  { id: "60", rotulo: "60 dias", dias: 60 },
  { id: "90", rotulo: "90 dias", dias: 90 },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]["id"];

/** Amostra mínima pra uma matéria entrar no radar e disputar melhor/pior. */
export const MIN_AMOSTRA_AREA = 5;
/** Amostra mínima pra um dia virar ponto na curva de evolução. */
export const MIN_AMOSTRA_DIA = 1;

export type AreaDesempenho = { nome: string; total: number; acertos: number; pct: number };
export type PontoDia = {
  data: string;
  rotulo: string;
  questoes: number;
  acertos: number;
  /** taxa ACUMULADA no período até este dia (a linha do print) */
  pctAcumulado: number;
  /** taxa só daquele dia */
  pctDia: number;
};
export type TopicoErro = {
  nome: string;
  materia: string;
  erros: number;
  total: number;
  pctAcerto: number;
};

export type RecorteDesempenho = {
  total: number;
  acertos: number;
  erros: number;
  pctAcerto: number | null;
  areas: AreaDesempenho[];
  melhorArea: AreaDesempenho | null;
  piorArea: AreaDesempenho | null;
  dias: PontoDia[];
  topicosErrados: TopicoErro[];
  diasAtivos: number;
};

function dataLimite(dias: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (dias - 1));
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function rotuloDia(data: string): string {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}

export function recortar(dados: DesempenhoDados, periodo: PeriodoId): RecorteDesempenho {
  const def = PERIODOS.find((p) => p.id === periodo) ?? PERIODOS[0];
  const corte = def.dias ? dataLimite(def.dias) : null;
  const buckets: BucketDesempenho[] = corte
    ? dados.buckets.filter((b) => b.d >= corte)
    : dados.buckets;

  let total = 0;
  let acertos = 0;

  const porMateria = new Map<number, { total: number; acertos: number }>();
  const porTopico = new Map<number, { total: number; acertos: number }>();
  const porDia = new Map<string, { total: number; acertos: number }>();

  for (const b of buckets) {
    total += b.n;
    acertos += b.a;

    const mi = dados.topicoMateria[b.t] ?? 0;
    const m = porMateria.get(mi) ?? { total: 0, acertos: 0 };
    m.total += b.n;
    m.acertos += b.a;
    porMateria.set(mi, m);

    const t = porTopico.get(b.t) ?? { total: 0, acertos: 0 };
    t.total += b.n;
    t.acertos += b.a;
    porTopico.set(b.t, t);

    const d = porDia.get(b.d) ?? { total: 0, acertos: 0 };
    d.total += b.n;
    d.acertos += b.a;
    porDia.set(b.d, d);
  }

  const areas: AreaDesempenho[] = Array.from(porMateria.entries())
    .map(([i, v]) => ({
      nome: dados.materias[i] ?? "Outros",
      total: v.total,
      acertos: v.acertos,
      pct: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const comAmostra = areas.filter((a) => a.total >= MIN_AMOSTRA_AREA);
  const ordenadas = [...comAmostra].sort((a, b) => b.pct - a.pct || b.total - a.total);

  const dias: PontoDia[] = [];
  let acumTotal = 0;
  let acumAcertos = 0;
  for (const data of Array.from(porDia.keys()).sort()) {
    const v = porDia.get(data)!;
    if (v.total < MIN_AMOSTRA_DIA) continue;
    acumTotal += v.total;
    acumAcertos += v.acertos;
    dias.push({
      data,
      rotulo: rotuloDia(data),
      questoes: v.total,
      acertos: v.acertos,
      pctAcumulado: Math.round((acumAcertos / acumTotal) * 100),
      pctDia: Math.round((v.acertos / v.total) * 100),
    });
  }

  const topicosErrados: TopicoErro[] = Array.from(porTopico.entries())
    .map(([i, v]) => ({
      nome: dados.topicos[i] ?? "Tópico",
      materia: dados.materias[dados.topicoMateria[i] ?? 0] ?? "Outros",
      erros: v.total - v.acertos,
      total: v.total,
      pctAcerto: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
    }))
    .filter((t) => t.erros > 0)
    .sort((a, b) => b.erros - a.erros || a.pctAcerto - b.pctAcerto)
    .slice(0, 6);

  return {
    total,
    acertos,
    erros: total - acertos,
    pctAcerto: total > 0 ? Math.round((acertos / total) * 100) : null,
    areas: areas.slice(0, 8), // radar acima de 8 eixos vira ilegível (regra da skill)
    melhorArea: ordenadas[0] ?? null,
    piorArea: ordenadas.length > 1 ? ordenadas[ordenadas.length - 1] : null,
    dias,
    topicosErrados,
    diasAtivos: porDia.size,
  };
}
