// E-mail de CAMPANHA — o disparo em massa pra base (reengajamento pré-lançamento).
//
// Diferença pro transacional (templates-auth.ts), além do conteúdo:
//  · leva link de descadastro obrigatório no rodapé. Reclamação de spam queima
//    a reputação do remetente na Brevo, e o remetente é o MESMO que entrega a
//    confirmação de cadastro — campanha sem opt-out arrisca derrubar o cadastro
//    de aluno novo;
//  · o texto não é fixo no código: quem dispara escreve em /admin/emails. Copy
//    de campanha é conteúdo, e conteúdo não deve exigir deploy — nem eu devo
//    inventar promessa que o produto não cumpre.
//
// A CASCA é a mesma do e-mail de código do cadastro, de propósito: o aluno
// precisa bater o olho e reconhecer que veio de nós.

import {
  VERDE,
  blocoBotao,
  blocoDestaques,
  blocoParagrafo,
  blocoTitulo,
  escapar,
  montarCasca,
} from "./casca";

export type Destaque = { titulo: string; texto: string };

export type ConteudoCampanha = {
  assunto: string;
  /** Linha que aparece na lista do Gmail ao lado do assunto. */
  preheader: string;
  titulo: string;
  intro: string;
  destaques: Destaque[];
  rotuloBotao: string;
  /** Última frase antes do botão... na verdade depois dele: o fecho pessoal. */
  fecho: string;
};

/**
 * Rascunho inicial do disparo de reengajamento. Fica aqui (e não no banco) só
 * como PONTO DE PARTIDA da tela do admin — o que sai de fato é o que estiver
 * escrito no formulário na hora de enviar.
 *
 * Regra do texto: nada aqui promete o que o app não faz hoje. Cada destaque
 * corresponde a uma tela que existe e está no ar.
 */
export const CAMPANHA_PADRAO: ConteudoCampanha = {
  assunto: "A Questly mudou muito — dá uma olhada antes do lançamento",
  preheader: "Estamos a poucos dias do lançamento oficial e quase tudo por aí está diferente.",
  titulo: "Faz tempo que você não aparece",
  intro:
    "Estamos a poucos dias do lançamento oficial da Questly — e, desde a última vez que você entrou, quase tudo por aqui mudou. Vale a pena dar uma olhada.",
  destaques: [
    {
      titulo: "Simulados com provas da sua universidade",
      texto:
        "Prova cronometrada montada com questões de provas antigas do seu curso, corrigida na hora e com revisão questão a questão.",
    },
    {
      titulo: "Um banco de questões muito maior",
      texto:
        "Milhares de questões novas, com resolução, figura e gabarito — organizadas pelo ementário da sua disciplina.",
    },
    {
      titulo: "A missão do dia ficou mais inteligente",
      texto:
        "O app calcula o que está perto de ser esquecido e o que cai na sua próxima prova, e monta o estudo do dia em cima disso.",
    },
    {
      titulo: "Ranking semanal, ofensiva e conquistas",
      texto: "Ligas que sobem e descem toda segunda, distintivos pra colecionar e um perfil público pra mostrar.",
    },
  ],
  rotuloBotao: "Ver o que mudou",
  fecho: "Se algo não funcionar ou faltar alguma coisa, é só responder este e-mail — eu leio todos.",
};

export function montarEmailCampanha(opcoes: {
  conteudo: ConteudoCampanha;
  nome: string;
  link: string;
  /** Sem isto não se dispara campanha nenhuma. Ver o comentário do topo. */
  linkDescadastro: string;
}): { assunto: string; html: string; texto: string } {
  const { conteudo: c, nome, link, linkDescadastro } = opcoes;

  const primeiroNome = nome.trim().split(/\s+/)[0] || "";
  // "Fulano, faz tempo que você não aparece" vs. "Faz tempo que você não
  // aparece" — sem nome, a frase precisa continuar começando com maiúscula.
  const titulo = primeiroNome
    ? `${primeiroNome}, ${c.titulo.charAt(0).toLowerCase()}${c.titulo.slice(1)}`
    : c.titulo;

  const rodape =
    `Voc&ecirc; recebeu este e-mail porque criou uma conta na Questly.<br />` +
    `<a href="${escapar(linkDescadastro)}" target="_blank" style="color:${VERDE};text-decoration:underline;">N&atilde;o quero mais receber novidades</a>`;

  const html = montarCasca({
    assunto: c.assunto,
    preheader: escapar(c.preheader),
    corpo:
      blocoTitulo(titulo, c.intro) +
      blocoDestaques(c.destaques) +
      blocoBotao(c.rotuloBotao, link, "24px 32px 6px 32px") +
      (c.fecho ? blocoParagrafo(escapar(c.fecho), "18px 32px 30px 32px") : ""),
    rodape,
  });

  const texto = [
    titulo,
    "",
    c.intro,
    "",
    ...c.destaques.map((d) => `• ${d.titulo}: ${d.texto}`),
    "",
    `${c.rotuloBotao}: ${link}`,
    ...(c.fecho ? ["", c.fecho] : []),
    "",
    "—",
    "Você recebeu este e-mail porque criou uma conta na Questly.",
    `Para não receber mais novidades: ${linkDescadastro}`,
  ].join("\n");

  return { assunto: c.assunto, html, texto };
}
