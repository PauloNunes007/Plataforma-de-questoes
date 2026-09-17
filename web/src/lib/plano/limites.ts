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

/* ------------------------------------------ o teto que o PRO também tem */

// Exportar em PDF é o único recurso que tira conteúdo de DENTRO do app: a
// folha impressa continua valendo depois que a assinatura vence. Por isso ele
// é o único lugar onde o Pro — que em todo o resto é "sem limite" — carrega
// um teto, e a tela diz isso com todas as letras em vez de esconder.
//
// A conta que o teto precisa vencer é esta: banco com ~2.600 questões, plano
// mensal a R$ 15 e direito de arrependimento de 7 dias (CDC art. 49, que não
// é opcional). Sem teto, o caminho ótimo pra quem quer o banco não é assinar
// — é assinar, baixar tudo num fim de semana e pedir o dinheiro de volta.
//
// O que é cobrado é DOCUMENTO DIFERENTE, não geração de arquivo: reimprimir a
// mesma lista na mesma semana não custa nada (ver supabase_cota_pdf.sql). Isso
// separa os dois usos com precisão — o aluno ajusta espaçamento e gabarito da
// mesma lista quatro vezes antes de imprimir, enquanto extrair o banco exige
// abrir um documento novo por tópico.

/** Documentos diferentes que um Pro exporta por semana.
 *  Gate: lib/imprimir/cota.ts, chamado nas três rotas /imprimir/*. */
export const PDF_SEMANA_PRO = 12;

/**
 * Documentos diferentes por mês (30 dias corridos).
 *
 * Menor que 4 × o semanal, e de propósito: o mês é o teto que importa, porque
 * o abuso que isto existe pra conter cabe todo dentro de UM ciclo de cobrança.
 * A folga semanal permite a semana de véspera de prova em que o aluno imprime
 * tudo de uma vez; o teto mensal é o que impede que essa semana se repita
 * quatro vezes seguidas.
 */
export const PDF_MES_PRO = 20;

/**
 * Questões que o servidor manda em UM arquivo.
 *
 * É o gate mais duro dos três, porque não depende de contagem nenhuma: a
 * página simplesmente não envia mais que isto ao browser. Sem ele, os tetos
 * acima contariam documentos enquanto uma lista de tópico com 200 questões
 * saía inteira em cada um.
 *
 * 60 = SIMULADO_QTD_MAX, o maior simulado que o montador deixa criar — então
 * nenhuma prova é cortada por este corte. Para uma lista de estudo o número é
 * folgado: o padrão da folha é 10 questões (PADRAO_QUESTOES_FOLHA).
 */
export const PDF_QUESTOES_MAX = 60;

/** A partir de quantas restantes a folha avisa que a cota está acabando. */
export const PDF_AVISO_RESTANTE = 3;

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
  /** Exportação em PDF tem teto NOS DOIS planos — no grátis ela nem existe. */
  pdfSemana: number;
  pdfMes: number;
};

export function limitesDoPlano(perfil: PlanoDoProfile | null | undefined): LimitesDoPlano {
  if (ehPro(perfil)) {
    return {
      pro: true,
      questoesDia: null,
      simuladosSemana: null,
      favoritos: null,
      anotacoes: null,
      pdfSemana: PDF_SEMANA_PRO,
      pdfMes: PDF_MES_PRO,
    };
  }
  return {
    pro: false,
    questoesDia: QUESTOES_DIA_FREE,
    simuladosSemana: SIMULADO_FREE_LIMITE_SEMANA,
    favoritos: FAVORITOS_FREE,
    anotacoes: ANOTACOES_FREE,
    // Zero, não "menos": exportar PDF é recurso de Pro, ponto.
    pdfSemana: 0,
    pdfMes: 0,
  };
}
