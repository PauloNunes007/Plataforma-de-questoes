// Os LIMITES do plano grátis — fonte da verdade única.
//
// **Repasse de 2026-09-17 — o plano grátis estava largo demais.**
//
// Até aqui o grátis entregava o produto inteiro menos quatro coisas
// (simulado além do 1º da semana, autópsia do erro, estatísticas avançadas e o
// selo do ranking). Quem estudava 300 questões por semana e quem pagava R$ 15
// recebiam essencialmente a mesma plataforma — e o segundo grupo é o que paga
// o servidor, o banco de questões e a conta do gateway.
//
// A régua escolhida (e a razão de cada número):
//
//   • 30 questões/dia — o teto fica ACIMA de um dia de estudo honesto (uma
//     lista de 20, ou duas de 15) e ABAIXO da maratona de véspera de prova.
//     Quem bate nele é exatamente quem tira mais valor do produto, que é quem
//     deve pagar. Quem só quer conferir o gabarito de uma lista nunca o vê;
//   • 1 simulado/semana — inalterado, e continua morando em
//     lib/simulados/constantes.ts (importado aqui, nunca redigitado: dois
//     lugares com o mesmo teto divergem no primeiro ajuste de preço);
//   • 15 favoritos e 10 anotações — biblioteca pessoal é o recurso que o aluno
//     ACUMULA; a versão grátis é uma amostra funcional, não um arquivo do
//     semestre inteiro;
//   • faltas, notas, relatório semanal e exportar PDF — recursos novos, Pro
//     desde o primeiro dia (ver supabase_vida_academica.sql).
//
// REGRA DE OURO (a mesma de lib/plano/plano.ts): todo limite anunciado tem que
// existir NO SERVIDOR. Um limite que só a UI respeita não é um limite — é um
// pedido educado que qualquer Server Action chamada direto ignora. Por isso
// cada constante daqui tem um ponto de checagem citado abaixo dela.

import type { PlanoDoProfile } from "./plano";
import { ehPro } from "./plano";
import { SIMULADO_FREE_LIMITE_SEMANA } from "@/lib/simulados/constantes";

// Re-exportado pra que quem precisa dos limites do plano encontre TODOS num
// lugar só — sem virar uma segunda definição (o valor continua nascendo em
// lib/simulados/constantes.ts).
export { SIMULADO_FREE_LIMITE_SEMANA };

/** Questões que o plano grátis responde por dia. Gate: lib/questao/actions.ts
 *  (`registrarRespostaAction` — conta ANTES de inserir a tentativa). */
export const QUESTOES_DIA_FREE = 30;

/** Favoritos guardados no grátis. Gate: lib/anotacoes/actions.ts. */
export const FAVORITOS_FREE = 15;

/** Anotações de questão no grátis. Gate: lib/anotacoes/actions.ts. */
export const ANOTACOES_FREE = 10;

/**
 * Quanto falta do teto diário.
 *
 * `null` = sem teto (Pro). O `null` é deliberado no lugar de `Infinity`: quem
 * lê tem que decidir o que mostrar pra "ilimitado", e `Infinity` viaja mal por
 * JSON entre Server e Client Component (vira `null` no meio do caminho, o que
 * daria "0 restantes" pra um assinante).
 */
export function restanteDoDia(perfil: PlanoDoProfile | null | undefined, respondidasHoje: number): number | null {
  if (ehPro(perfil)) return null;
  return Math.max(0, QUESTOES_DIA_FREE - Math.max(0, respondidasHoje));
}

/** A partir de quantas restantes a tela avisa "seu limite está acabando". */
export const AVISO_RESTANTE = 10;

export type LimitesDoPlano = {
  pro: boolean;
  questoesDia: number | null;
  simuladosSemana: number | null;
  favoritos: number | null;
  anotacoes: number | null;
};

export function limitesDoPlano(perfil: PlanoDoProfile | null | undefined): LimitesDoPlano {
  if (ehPro(perfil)) {
    return { pro: true, questoesDia: null, simuladosSemana: null, favoritos: null, anotacoes: null };
  }
  return {
    pro: false,
    questoesDia: QUESTOES_DIA_FREE,
    simuladosSemana: SIMULADO_FREE_LIMITE_SEMANA,
    favoritos: FAVORITOS_FREE,
    anotacoes: ANOTACOES_FREE,
  };
}
