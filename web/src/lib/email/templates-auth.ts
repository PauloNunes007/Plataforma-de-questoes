// Templates dos emails de autenticação (confirmação de cadastro, recuperação
// de senha, link mágico, troca de email, convite).
//
// Regras de HTML de email — o motivo de o markup aqui parecer 2005:
//  · tabelas, não flex/grid: o Outlook renderiza com o motor do Word;
//  · estilo INLINE: o Gmail descarta <style> em boa parte dos casos;
//  · sem CSS custom properties (os tokens do app não existem aqui) — as cores
//    da marca estão fixadas nos HEX do tema claro de globals.css;
//  · sem imagem nenhuma: a maioria dos clientes bloqueia imagem por padrão, e
//    um logo quebrado num email de segurança destrói a confiança. A marca é
//    feita com tipografia e cor, que sempre chegam;
//  · fundo claro fixo: o "dark mode" de email é invertido pelo cliente sem
//    controle nosso, então cor garantida > cor adaptativa.

export type TipoAcaoEmail =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | "email_change_current"
  | "email_change_new";

const VERDE = "#0a855c";
const VERDE_ESCURO = "#05543a";
const TINTA = "#111827";
const TINTA_SUAVE = "#5b6472";
const CANVAS = "#eef1f0";
const HAIRLINE = "#e2e6e4";
const FONTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";
const FONTE_MONO = "SFMono-Regular,Menlo,Consolas,'Courier New',monospace";

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
        assunto: "Redefinir sua senha da Questly",
        titulo: "Vamos redefinir sua senha",
        intro: `${ola}recebemos um pedido para trocar a senha da sua conta. Use o código abaixo ou clique no botão.`,
        rotuloBotao: "Criar uma senha nova",
      };
    case "magiclink":
      return {
        assunto: "Seu acesso à Questly",
        titulo: "Entrar na Questly",
        intro: `${ola}use o código abaixo ou clique no botão para entrar sem senha.`,
        rotuloBotao: "Entrar agora",
      };
    case "invite":
      return {
        assunto: "Você foi convidado para a Questly",
        titulo: "Seu convite chegou",
        intro: `${ola}alguém te convidou para estudar na Questly. Aceite o convite para criar sua conta.`,
        rotuloBotao: "Aceitar convite",
      };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        assunto: "Confirme seu novo email na Questly",
        titulo: "Confirme a troca de email",
        intro: `${ola}para concluir a troca do email da sua conta, confirme com o código abaixo ou pelo botão.`,
        rotuloBotao: "Confirmar novo email",
      };
    case "signup":
    default:
      return {
        assunto: "Seu código para confirmar a conta na Questly",
        titulo: "Falta um passo para começar",
        intro: `${ola}bem-vindo(a) à Questly. Digite o código abaixo na tela de confirmação — ou clique no botão, se você abriu este email no mesmo aparelho.`,
        rotuloBotao: "Confirmar meu email",
      };
  }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const linkSeguro = escapar(link);
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

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapar(c.assunto)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${temCodigo ? `Seu c&oacute;digo &eacute; ${escapar(agruparCodigo(codigo))}.` : escapar(c.intro)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CANVAS};">
  <tr>
    <td align="center" style="padding:28px 12px 40px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 18px 0;font-family:${FONTE};font-size:19px;font-weight:800;letter-spacing:-.01em;color:${VERDE_ESCURO};">Questly</td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:34px 32px 22px 32px;font-family:${FONTE};">
                  <h1 style="margin:0 0 10px 0;font-size:23px;line-height:1.25;font-weight:800;letter-spacing:-.02em;color:${TINTA};">${escapar(c.titulo)}</h1>
                  <p style="margin:0;font-size:15px;line-height:1.6;color:${TINTA_SUAVE};">${escapar(c.intro)}</p>
                </td>
              </tr>${blocoCodigo}
              <tr>
                <td align="center" style="padding:22px 32px 4px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background-color:${VERDE};border-radius:12px;">
                        <a href="${linkSeguro}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${FONTE};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapar(c.rotuloBotao)}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 32px 30px 32px;font-family:${FONTE};">
                  <p style="margin:0 0 4px 0;font-size:12.5px;line-height:1.6;color:${TINTA_SUAVE};">Se o bot&atilde;o n&atilde;o funcionar, copie e cole este endere&ccedil;o no navegador:</p>
                  <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${linkSeguro}" target="_blank" style="color:${VERDE};text-decoration:underline;">${linkSeguro}</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:18px 12px 0 12px;font-family:${FONTE};font-size:12px;line-height:1.6;color:${TINTA_SUAVE};">Se voc&ecirc; n&atilde;o pediu este email, pode ignorar com tranquilidade &mdash; nada acontece sem algu&eacute;m usar o c&oacute;digo.</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

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
    "Questly",
  ].join("\n");

  return { assunto: c.assunto, html, texto };
}
