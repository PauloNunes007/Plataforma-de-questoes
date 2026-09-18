// E-mail de BOAS-VINDAS ao Pro — disparado sempre que uma conta VIRA Pro, seja
// pagando, seja por cupom (ver `enviarBoasVindasPro` em lib/plano/boas-vindas).
//
// Por que existe, se a tela /pro já dá as boas-vindas: porque metade dos
// alunos fecha a aba no checkout do Mercado Pago e volta pro app horas depois,
// direto no /dashboard. Esses nunca veem a tela de boas-vindas — e são
// exatamente os que mais precisam de um inventário do que compraram, porque
// vão usar o app por seis meses sem nunca abrir a página de planos de novo.
// Quem entra por cupom cai no mesmo buraco, e ainda mais fundo: costuma chegar
// por um link de convite, sem nunca ter visto a lista de benefícios.
//
// **Repasse de 2026-09-17.** O texto era escrito só pro caminho pago — abria
// com "Pagamento confirmado" e assinava "porque assinou o Expectrum Pro",
// inclusive pra quem tinha resgatado um cupom e não pagou nada. Agora o
// e-mail sabe DE ONDE veio o Pro (`origem`) e se é a primeira vez ou uma
// volta (`retorno`); o inventário de benefícios é o mesmo nos quatro casos,
// porque ele é o motivo do e-mail existir.
//
// É TRANSACIONAL, não campanha: é a confirmação de algo que a pessoa acabou de
// fazer. Por isso ignora `aceita_emails` (mesma regra do código de cadastro em
// app/api/auth/email-hook) e não leva link de descadastro — o descadastro
// existe pro relatório semanal, que é recorrente e opcional.
//
// A casca é a mesma de todos os outros (lib/email/casca.ts): o aluno precisa
// reconhecer o remetente de bate-pronto, ou o e-mail vira suspeita.

import { APP_URL } from "@/lib/app-url";
import {
  blocoBotao,
  blocoDestaques,
  blocoParagrafo,
  blocoTitulo,
  escapar,
  montarCasca,
} from "./casca";
import type { MensagemEmail } from "./enviar";

/**
 * Como esta conta virou Pro. Muda o agradecimento, nunca os benefícios.
 *
 * `lancamento` é a semana de Pro liberada pra base inteira e pra quem se
 * cadastrar durante a janela (ver lib/plano/lancamento.ts). Ela precisa de um
 * texto próprio por uma razão que não é de estilo: é o único caso em que o
 * aluno não pediu nada. Quem paga sabe que comprou; quem resgata cupom sabe
 * que digitou um código; quem ganha a semana só vê a conta mudar sozinha — e
 * se este e-mail não disser, com data, que o acesso é temporário e por que
 * ele apareceu, a pessoa vai descobrir os dois no dia em que o Pro sumir.
 */
export type OrigemPro = "pago" | "cupom" | "lancamento";

function primeiroNome(nome: string | null | undefined): string {
  const limpo = (nome ?? "").trim();
  if (!limpo) return "";
  return limpo.split(/\s+/)[0];
}

export function montarEmailBoasVindasPro(input: {
  para: string;
  nome: string | null;
  ciclo: string | null;
  expiraEm: string | null;
  origem: OrigemPro;
  /** Já foi Pro em algum momento e está voltando (não é a primeira vez). */
  retorno: boolean;
}): MensagemEmail {
  const nome = primeiroNome(input.nome);
  const pago = input.origem === "pago";
  const lancamento = input.origem === "lancamento";
  const validade = input.expiraEm
    ? new Date(input.expiraEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const saudacao = lancamento
    ? nome
      ? `${nome}, sua conta virou Pro`
      : "Sua conta virou Pro"
    : input.retorno
      ? nome
        ? `${nome}, seu Pro está de volta`
        : "Seu Pro está de volta"
      : nome
        ? `Bem-vindo ao Pro, ${nome}`
        : "Bem-vindo ao Expectrum Pro";

  // O agradecimento é a primeira coisa que a pessoa lê, e ele precisa ser
  // verdade: quem usou cupom não "confirmou um pagamento", e dizer que sim
  // estraga a confiança justamente em quem acabou de chegar.
  const intro = lancamento
    ? "Sem pegadinha e sem precisar fazer nada: estamos lançando o Expectrum e liberamos o plano Pro na sua conta por 7 dias. Tudo o que está abaixo já está funcionando pra você agora — o selo Pro dourado que apareceu no seu perfil é ele."
    : pago
      ? input.retorno
        ? "Obrigado por voltar — pagamento confirmado. Tudo abaixo está liberado de novo na sua conta, e não precisa fazer mais nada."
        : "Obrigado por assinar. É aluno pagante que mantém o Expectrum de pé. Tudo abaixo já está liberado na sua conta — não precisa fazer mais nada."
      : input.retorno
        ? "Seu cupom foi aplicado e tudo abaixo voltou a ficar liberado. Obrigado por continuar com a gente."
        : "Seu cupom foi aplicado. Obrigado por experimentar o Pro — tudo abaixo já está liberado na sua conta, sem pagar nada e sem precisar fazer mais nada.";

  // Cada destaque corresponde a uma tela que existe e tem gate real (a regra
  // de lib/plano/plano.ts vale aqui também — e-mail é onde a promessa vazia
  // custa mais caro, porque fica guardada na caixa de entrada).
  const destaques = [
    {
      titulo: "Controle de faltas",
      texto:
        "Diga quantas faltas cada disciplina permite, registre as suas e saiba a qualquer momento quantas ainda cabem — antes de perder o semestre por frequência.",
    },
    {
      titulo: "Calculadora de notas",
      texto:
        "Cadastre P1, P2 e trabalhos com os pesos certos e veja exatamente quanto precisa tirar no que falta pra passar.",
    },
    {
      titulo: "Questões sem teto diário",
      texto:
        "O limite de questões por dia acabou. Maratone a véspera inteira, se for o caso.",
    },
    {
      titulo: "Simulados ilimitados e PDF",
      texto:
        "Prova cronometrada quantas vezes quiser, inclusive provas antigas da sua universidade — e agora dá pra exportar lista e simulado em PDF pra imprimir.",
    },
    {
      titulo: "Autópsia do erro e estatísticas",
      texto:
        "Em cada erro, o porquê; e no seu painel, percentil, comparativo e recordes que o plano grátis não mostra.",
    },
    {
      titulo: "Favoritos e anotações sem limite",
      texto:
        "Guarde quantas questões quiser e escreva o que precisar em cada uma — o teto do plano grátis não vale mais pra você.",
    },
    {
      titulo: "Relatório semanal",
      texto:
        "Toda segunda, um resumo no seu e-mail: o que você estudou, onde está fraco e quais disciplinas estão apertando. Dá pra desligar quando quiser.",
    },
  ];

  const notaSemestral =
    pago && input.ciclo === "semestral"
      ? " É o semestre inteiro: dura mais que a próxima prova, a recuperação e a final."
      : "";

  // A data em NEGRITO e a palavra "até" são obrigatórias no caso do
  // lançamento: é a única linha do e-mail que impede o mal-entendido caro —
  // achar que a plataforma ficou grátis. Anunciar o desconto junto é o que
  // transforma o fim do prazo em oferta, em vez de em perda.
  const fecho = lancamento
    ? validade
      ? `A semana Pro vale até <b>${escapar(validade)}</b>. Depois disso sua conta volta pro plano grátis sozinha — não cobramos nada e não pedimos cartão em lugar nenhum. Quem quiser continuar no Pro vai receber uma condição de lançamento antes de o prazo acabar.`
      : "Depois da semana sua conta volta pro plano grátis sozinha — não cobramos nada e não pedimos cartão em lugar nenhum."
    : validade
      ? `Seu acesso vai até <b>${escapar(validade)}</b>.${notaSemestral} Qualquer dúvida, é só responder este e-mail.`
      : "Qualquer dúvida, é só responder este e-mail.";

  const assunto = lancamento
    ? "Liberamos o Pro na sua conta por 7 dias"
    : input.retorno
      ? "Seu Expectrum Pro está de volta"
      : "Bem-vindo ao Expectrum Pro";

  const corpo = [
    blocoTitulo(saudacao, intro),
    blocoDestaques(destaques),
    blocoBotao(
      "Ver o que foi liberado",
      `${APP_URL}/pro`,
      "24px 32px 6px 32px",
    ),
    blocoParagrafo(fecho, "16px 32px 28px 32px"),
  ].join("");

  const texto = [
    saudacao + ".",
    "",
    intro,
    "",
    "Tudo isto já está liberado na sua conta:",
    ...destaques.map((d) => `- ${d.titulo}: ${d.texto}`),
    "",
    validade
      ? lancamento
        ? `A semana Pro vale até ${validade}. Depois disso sua conta volta pro plano grátis sozinha — sem cobrança e sem cartão.`
        : `Seu acesso vai até ${validade}.`
      : "",
    `Acesse: ${APP_URL}/pro`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    para: input.para,
    nomePara: input.nome ?? undefined,
    assunto,
    html: montarCasca({
      assunto,
      preheader: lancamento
        ? "7 dias de Pro liberados na sua conta, sem cobrança e sem cartão."
        : "Faltas, notas, questões sem teto, simulados ilimitados e PDF — tudo liberado agora.",
      corpo,
      rodape: lancamento
        ? "Você recebeu este e-mail porque tem conta na Expectrum e o Pro foi liberado nela no lançamento."
        : pago
          ? "Você recebeu este e-mail porque assinou o Expectrum Pro."
          : "Você recebeu este e-mail porque um cupom liberou o Expectrum Pro na sua conta.",
    }),
    texto,
  };
}
