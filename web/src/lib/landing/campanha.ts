// Recorte de campanha da landing pública. Fica num só lugar, editável sem
// mexer no JSX: quando o foco na UFF acabar, troque o objeto (ou ponha
// `ativa: false`) e a landing volta ao discurso geral sozinha — a fita do
// topo, a seção dedicada e o selo do hero são todos gated por `CAMPANHA.ativa`.
//
// Regra de honestidade: nada aqui inventa número. As contagens que aparecem na
// página vêm do banco em tempo real (lib/landing/stats.ts); este arquivo só
// guarda o recorte editorial (instituição, disciplina).
//
// Regra de atemporalidade (2026-09-06): NADA aqui pode citar prazo — "prova
// deste mês", "chegando", "faltam N dias". O acervo não expira e o dono não
// quer voltar pra reescrever a landing toda vez que o calendário vira. O
// argumento é o acervo em si: questões de Física da UFF, catalogadas.

export type Campanha = {
  ativa: boolean;
  /** Texto EXATO como está em profiles.universidade / questions.instituicao. */
  instituicao: string;
  /** Nome por extenso, pro reforço de reconhecimento na seção dedicada. */
  instituicaoLonga: string;
  /** Matérias em foco — usadas pra filtrar as contagens exibidas. */
  materias: string[];
  /** Rótulo curto da matéria em foco ("Física"). */
  materiaLabel: string;
  /** Selo curto da seção. Sem prazo: descreve o acervo, não o calendário. */
  selo: string;
  /** Fita do topo. */
  fita: string;
  /** Âncora da seção dedicada. */
  ancora: string;
};

export const CAMPANHA: Campanha = {
  ativa: true,
  instituicao: "UFF",
  instituicaoLonga: "Universidade Federal Fluminense",
  materias: ["Física I", "Física II"],
  materiaLabel: "Física",
  selo: "Acervo de Física da UFF",
  fita: "Questões de Física da UFF",
  ancora: "uff",
};
