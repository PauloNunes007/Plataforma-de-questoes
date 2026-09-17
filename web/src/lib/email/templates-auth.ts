// Templates dos emails de autenticação (confirmação de cadastro, recuperação
// de senha, link mágico, troca de email, convite).
//
// A casca (documento, marca, cartão branco, rodapé) e as regras de HTML de
// email moram em `casca.ts` — este arquivo é só o CONTEÚDO de cada tipo. O
// e-mail de campanha (templates-campanha.ts) usa a mesma casca de propósito:
// o aluno precisa reconhecer que veio de nós.

import {
  FONTE,
  FONTE_MONO,
  VERDE_ESCURO,
  blocoBotao,
  blocoLinkAlternativo,
  blocoTitulo,
  escapar,
  montarCasca,
} from "./casca";

export type TipoAcaoEmail =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | "email_change_current"
  | "email_change_new";

type Conteudo = {
  assunto: string;
  titulo: string;
  /** Frase que explica por que o email chegou. */
  intro: string;
  rotuloBotao: string;
};

function conteudoPara(tipo: TipoAcaoEmail, nome: string): Conteudo {
  const primeiroNome = nome.split(" ")[0] || "";
  const ola = primeiroNome ? `${primeiroNome}, ` : "";

  switch (tipo) {
    case "recovery":
      return {
        assunto: "Redefinir sua senha da Expectrum",
        titulo: "Vamos redefinir sua senha",
        intro: `${ola}recebemos um pedido para trocar a senha da sua conta. Use o código abaixo ou clique no botão.`,
        rotuloBotao: "Criar uma senha nova",
      };
    case "magiclink":
      return {
        assunto: "Seu acesso à Expectrum",
        titulo: "Entrar na Expectrum",
        intro: `${ola}use o código abaixo ou clique no botão para entrar sem senha.`,
        rotuloBotao: "Entrar agora",
      };
    case "invite":
      return {
        assunto: "Você foi convidado para a Expectrum",
        titulo: "Seu convite chegou",
        intro: `${ola}alguém te convidou para estudar na Expectrum. Aceite o convite para criar sua conta.`,
        rotuloBotao: "Aceitar convite",
      };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        assunto: "Confirme seu novo email na Expectrum",
        titulo: "Confirme a troca de email",
        intro: `${ola}para concluir a troca do email da sua conta, confirme com o código abaixo ou pelo botão.`,
        rotuloBotao: "Confirmar novo email",
      };
    case "signup":
    default:
      return {
        assunto: "Seu código para confirmar a conta na Expectrum",
        titulo: "Falta um passo para começar",
        intro: `${ola}bem-vindo(a) à Expectrum. Digite o código abaixo na tela de confirmação — ou clique no botão, se você abriu este email no mesmo aparelho.`,
        rotuloBotao: "Confirmar meu email",
      };
  }
}

/** "483920" -> "483 920": o olho copia em dois blocos sem trocar dígito. */
function agruparCodigo(codigo: string): string {
  if (codigo.length !== 6) return codigo;
  return `${codigo.slice(0, 3)} ${codigo.slice(3)}`;
}

export function montarEmailAuth(opcoes: {
  tipo: TipoAcaoEmail;
  nome: string;
  codigo: string;
  link: string;
}): { assunto: string; html: string; texto: string } {
  const { tipo, nome, codigo, link } = opcoes;
  const c = conteudoPara(tipo, nome);
  const temCodigo = Boolean(codigo);

  const blocoCodigo = temCodigo
    ? `
              <tr>
                <td style="padding:0 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="background-color:#e4f5ed;border:1px solid #c4e6d7;border-radius:14px;padding:20px 16px;">
                        <div style="margin:0 0 6px 0;font-family:${FONTE};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${VERDE_ESCURO};">Seu c&oacute;digo</div>
                        <div style="font-family:${FONTE_MONO};font-size:36px;line-height:1.1;font-weight:700;letter-spacing:.14em;color:${VERDE_ESCURO};">${escapar(agruparCodigo(codigo))}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : "";

  const html = montarCasca({
    assunto: c.assunto,
    preheader: temCodigo
      ? `Seu c&oacute;digo &eacute; ${escapar(agruparCodigo(codigo))}.`
      : escapar(c.intro),
    corpo: blocoTitulo(c.titulo, c.intro) + blocoCodigo + blocoBotao(c.rotuloBotao, link) + blocoLinkAlternativo(link),
    rodape:
      "Se voc&ecirc; n&atilde;o pediu este email, pode ignorar com tranquilidade &mdash; nada acontece sem algu&eacute;m usar o c&oacute;digo.",
  });

  const texto = [
    c.titulo,
    "",
    c.intro,
    "",
    ...(temCodigo ? [`Seu código: ${agruparCodigo(codigo)}`, ""] : []),
    `${c.rotuloBotao}: ${link}`,
    "",
    "Se você não pediu este email, pode ignorar — nada acontece sem alguém usar o código.",
    "",
    "Expectrum",
  ].join("\n");

  return { assunto: c.assunto, html, texto };
}
