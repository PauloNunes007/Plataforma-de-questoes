export const MOTIVOS_REPORT = [
  { valor: "enunciado_faltando", rotulo: "Faltando enunciado" },
  { valor: "imagem_enunciado_faltando", rotulo: "Faltando imagem no enunciado" },
  { valor: "imagem_alternativa_faltando", rotulo: "Faltando imagem em alguma alternativa" },
  { valor: "questao_errada", rotulo: "Questão está errada / gabarito errado" },
  { valor: "latex_quebrado", rotulo: "LaTeX quebrado / não renderiza" },
  { valor: "outro", rotulo: "Outro problema" },
] as const;

export type MotivoReport = (typeof MOTIVOS_REPORT)[number]["valor"];

export function rotuloMotivoReport(motivo: string): string {
  return MOTIVOS_REPORT.find((m) => m.valor === motivo)?.rotulo ?? motivo;
}
