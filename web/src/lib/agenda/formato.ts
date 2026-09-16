// Formatação compartilhada entre o calendário dedicado (`/calendario`) e o
// card "Mapa de progresso" da home. Nada aqui toca o banco.
//
// As datas circulam como "YYYY-MM-DD" e são quebradas na mão (não via
// `new Date("2026-09-15")`, que o JS lê como UTC e devolve o dia anterior em
// qualquer fuso a oeste de Greenwich — o Brasil inteiro).

export const DOW_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DOW_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DOW_LETRA = ["D", "S", "T", "Q", "Q", "S", "S"];

const MESES_MINUSCULO = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function fmtDuracao(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** "2026-09-11" → "Quinta, 11 de setembro". */
export function rotuloData(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  return `${DOW_LONGO[dt.getDay()]}, ${d} de ${MESES_MINUSCULO[m - 1]}`;
}

/** "2026-09-11" → "11 de setembro" (sem o dia da semana). */
export function rotuloDataCurta(data: string): string {
  const [, m, d] = data.split("-").map(Number);
  return `${d} de ${MESES_MINUSCULO[m - 1]}`;
}

export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(a, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Dias inteiros de `de` até `para` (negativo = já passou). */
export function diasEntre(de: string, para: string): number {
  const [a1, m1, d1] = de.split("-").map(Number);
  const [a2, m2, d2] = para.split("-").map(Number);
  const ms = new Date(a2, m2 - 1, d2).getTime() - new Date(a1, m1 - 1, d1).getTime();
  return Math.round(ms / 86400000);
}
