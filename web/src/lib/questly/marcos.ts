import type { NomeInsignia, TomInsignia } from "@/components/insignias/insignia";

// Marcos do dia — a celebração que aparece quando o aluno cruza um volume
// de questões respondidas HOJE (10, 15, 25, ...). É reconhecimento, não
// economia: marco NÃO paga XP nem entra em ranking algum, justamente pra
// não criar incentivo a responder qualquer coisa só pra bater o número.
// O que ele faz é dar nome ao esforço no momento exato em que ele
// acontece, que é quando a sessão costuma ser abandonada.
export type MarcoDiario = {
  /** nº de questões do dia que dispara o marco */
  questoes: number;
  titulo: string;
  mensagem: string;
  insignia: NomeInsignia;
  tom: TomInsignia;
};

export const QUESTLY_MARCOS_DIARIOS: MarcoDiario[] = [
  {
    questoes: 10,
    titulo: "10 questões hoje",
    mensagem: "Aquecimento encerrado. A partir daqui cada questão vira repertório.",
    insignia: "broto",
    tom: "esmeralda",
  },
  {
    questoes: 15,
    titulo: "15 questões hoje",
    mensagem: "Você já passou do ponto onde a maioria das sessões termina.",
    insignia: "ascensao",
    tom: "prata",
  },
  {
    questoes: 25,
    titulo: "25 questões hoje",
    mensagem: "Volume de dia sério. É exatamente esse tipo de sessão que aparece na nota.",
    insignia: "alvo",
    tom: "ouro",
  },
  {
    questoes: 40,
    titulo: "40 questões hoje",
    mensagem: "Resistência de prova longa. Poucos alunos sustentam isso num dia só.",
    insignia: "cume",
    tom: "platina",
  },
  {
    questoes: 60,
    titulo: "60 questões hoje",
    mensagem: "Isso é dia de simulado. Segure a qualidade no mesmo nível do volume.",
    insignia: "cometa",
    tom: "diamante",
  },
  {
    questoes: 100,
    titulo: "100 questões hoje",
    mensagem: "Cem em um único dia. Guarde a data: é o tipo de dia que decide uma aprovação.",
    insignia: "coroa",
    tom: "ouro",
  },
];

/**
 * Marco atingido EXATAMENTE agora. `questoesHoje` é a contagem já
 * incluindo a resposta recém-registrada, então o marco só dispara na
 * questão que cruza o número — nunca nas seguintes.
 */
export function questlyMarcoAtingido(questoesHoje: number): MarcoDiario | null {
  return QUESTLY_MARCOS_DIARIOS.find((m) => m.questoes === questoesHoje) ?? null;
}

/** Próximo marco ainda não batido — usado pra mostrar "faltam N". */
export function questlyProximoMarco(questoesHoje: number): MarcoDiario | null {
  return QUESTLY_MARCOS_DIARIOS.find((m) => m.questoes > questoesHoje) ?? null;
}
