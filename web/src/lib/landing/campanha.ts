// Recorte de campanha da landing pública. Fica num só lugar, editável sem
// mexer no JSX: a fita do topo, a seção dedicada, o selo do hero e o painel do
// /login são todos gated por `CAMPANHA.ativa`.
//
// DESLIGADA desde 2026-09-16, a pedido do dono: a landing dedicava uma fita,
// um selo no hero e uma seção inteira ao "aluno da UFF", e isso lia como
// propaganda de cursinho, não como produto. O discurso agora é o geral — uma
// plataforma de questões de provas antigas pra universitário de exatas — e a
// UFF aparece pelo que ela é, um FATO do acervo: a contagem "N de provas da
// UFF" na faixa de números, uma linha no FAQ e o reconhecimento da
// universidade no cadastro. Nada de headline dedicada.
//
// O objeto continua aqui inteiro de propósito. `instituicao`/`materias` ainda
// alimentam `lib/landing/stats.ts` (é de onde sai aquela contagem), e voltar a
// ligar uma campanha — pra esta ou pra outra universidade — é trocar `ativa`.
//
// Regra de honestidade: nada aqui inventa número. As contagens que aparecem na
// página vêm do banco em tempo real (lib/landing/stats.ts); este arquivo só
// guarda o recorte editorial (instituição, disciplina).
//
// Regra de atemporalidade (2026-09-06): NADA aqui pode citar prazo — "prova
// deste mês", "chegando", "faltam N dias". O acervo não expira e o dono não
// quer voltar pra reescrever a landing toda vez que o calendário vira.

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
  ativa: false,
  instituicao: "UFF",
  instituicaoLonga: "Universidade Federal Fluminense",
  materias: ["Física I", "Física II"],
  materiaLabel: "Física",
  selo: "Acervo de Física da UFF",
  fita: "Questões de Física da UFF",
  ancora: "uff",
};
