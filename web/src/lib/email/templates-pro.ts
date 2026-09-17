// E-mail de BOAS-VINDAS ao Pro — disparado uma única vez, quando a conta vira
// Pro pela primeira vez (ver `estenderPro` em lib/plano/ativar.ts).
//
// Por que existe, se a tela /pro já dá as boas-vindas: porque metade dos
// alunos fecha a aba no checkout do Mercado Pago e volta pro app horas depois,
// direto no /dashboard. Esses nunca veem a tela de boas-vindas — e são
// exatamente os que mais precisam de um inventário do que compraram, porque
// vão usar o app por seis meses sem nunca abrir a página de planos de novo.
//
// É TRANSACIONAL, não campanha: é a confirmação de uma compra que a pessoa
// acabou de fazer. Por isso ignora `aceita_emails` (mesma regra do código de
// cadastro em app/api/auth/email-hook) e não leva link de descadastro — o
// descadastro existe pro relatório semanal, que é recorrente e opcional.
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
}): MensagemEmail {
  const nome = primeiroNome(input.nome);
  const saudacao = nome ? `${nome}, seu Pro está ativo` : "Seu Pro está ativo";
  const validade = input.expiraEm
    ? new Date(input.expiraEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

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
      texto: "O limite de questões por dia acabou. Maratone a véspera inteira, se for o caso.",
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
      titulo: "Relatório semanal",
      texto:
        "Toda segunda, um resumo no seu e-mail: o que você estudou, onde está fraco e quais disciplinas estão apertando. Dá pra desligar quando quiser.",
    },
  ];

  const corpo = [
    blocoTitulo(
      saudacao,
      "Pagamento confirmado. Tudo abaixo já está liberado na sua conta — não precisa fazer mais nada.",
    ),
    blocoDestaques(destaques),
    blocoBotao("Ver o que foi liberado", `${APP_URL}/pro`, "24px 32px 6px 32px"),
    blocoParagrafo(
      validade
        ? `Seu acesso vai até <b>${escapar(validade)}</b>.${
            input.ciclo === "semestral"
              ? " É o semestre inteiro: dura mais que a próxima prova, a recuperação e a final."
              : ""
          } Qualquer dúvida, é só responder este e-mail.`
        : "Qualquer dúvida, é só responder este e-mail.",
      "16px 32px 28px 32px",
    ),
  ].join("");

  const texto = [
    saudacao + ".",
    "",
    "Pagamento confirmado — tudo isto já está liberado na sua conta:",
    ...destaques.map((d) => `- ${d.titulo}: ${d.texto}`),
    "",
    validade ? `Seu acesso vai até ${validade}.` : "",
    `Acesse: ${APP_URL}/pro`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    para: input.para,
    nomePara: input.nome ?? undefined,
    assunto: "Seu Expectrum Pro está ativo",
    html: montarCasca({
      assunto: "Seu Expectrum Pro está ativo",
      preheader: "Faltas, notas, questões sem teto, simulados ilimitados e PDF — tudo liberado agora.",
      corpo,
      rodape: "Você recebeu este e-mail porque assinou o Expectrum Pro.",
    }),
    texto,
  };
}
