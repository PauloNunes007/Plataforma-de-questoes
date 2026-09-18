// As perguntas da FAQ da landing, fora do componente de propósito.
//
// Elas são lidas por DOIS consumidores: o acordeão da landing
// (components/landing/faq.tsx) e o JSON-LD `FAQPage` que a própria landing
// publica no <head> (app/page.tsx). É o que faz o Google poder mostrar as
// respostas direto no resultado da busca — e, mais importante, é o que
// garante que a resposta indexada seja a MESMA que está na tela. Duas cópias
// do mesmo texto viram, na primeira edição, uma promessa no Google que a
// página não cumpre.
import { CAMPANHA } from "./campanha";

export type PerguntaFaq = { p: string; r: string };

export const PERGUNTAS: PerguntaFaq[] = [
  {
    p: "As questões são de provas antigas de verdade?",
    r: `São. Cada questão guarda de qual instituição e de que ano ela veio, digitada do original — enunciado, alternativas e as figuras recortadas da própria prova, não redesenhadas. O acervo de provas anteriores da ${CAMPANHA.instituicao} é o maior hoje, e no cadastro a gente confirma na hora quantas questões temos da sua universidade antes de liberar o montador de simulados com elas.`,
  },
  {
    p: "E se a minha universidade não estiver no banco?",
    r: "A plataforma funciona igual: a trilha da ementa, o banco de questões geral (com resolução passo a passo), as anotações e o ranking valem pra qualquer curso. O que fica indisponível é só o simulado com provas antigas da sua instituição — e a gente diz isso na sua cara, sem enrolar, em vez de fingir que tem.",
  },
  {
    p: "Quanto tempo por dia eu preciso?",
    r: "O que você tiver. Você monta a lista do tamanho que couber — 5 questões no corredor entre aulas ou 40 num sábado. A Expectrum não tem cota diária nem cobra presença: o que ela guarda é o que você já fez, pra você enxergar onde está.",
  },
  {
    p: "Preciso pagar pra usar?",
    r: "Não. O plano grátis tem o banco de questões inteiro com resolução, listas sem limite, disciplinas ilimitadas, a trilha da ementa, anotações, streak, ligas e um simulado cronometrado por semana. O Pro tira o limite de simulados e abre a autópsia do erro e as estatísticas avançadas, por R$ 15/mês ou R$ 10/mês no semestral.",
  },
  {
    p: "A Expectrum monta um cronograma pra mim?",
    r: "Não, e isso é decisão de produto, não falta. A gente já tentou: o motor empilhava quatro matérias diferentes no mesmo dia e virava uma lista que ninguém executa. Quem sabe o que caiu na aula de ontem e o que a prova de sexta cobra é você. A Expectrum te dá as questões, o mapa da ementa com o seu aproveitamento e o simulado — a ordem é sua. Se quiser planejar, o calendário é seu: sessão, meta de questões, tarefa e a data da prova, tudo marcado por você.",
  },
  {
    p: "Isso substitui a aula e o livro?",
    r: "Não, e não quer. A Expectrum é onde você pratica, revisa na hora certa e descobre o que ainda não sabe. Teoria você vê com seu professor e seu livro — aqui é o treino que transforma teoria em nota.",
  },
];
