// A CASCA visual dos e-mails da Questly — o molde do e-mail de código de
// cadastro, extraído pra que campanha e transacional nunca divirjam.
//
// Antes isto morava inteiro dentro de templates-auth.ts. Saiu pra cá quando
// apareceu o segundo tipo de e-mail (campanha): duas cópias do mesmo cabeçalho
// envelhecem em direções diferentes, e o aluno percebe — um e-mail que não
// parece com o que ele já recebeu da gente é um e-mail que parece golpe.
//
// Regras de HTML de e-mail — o motivo de o markup aqui parecer 2005:
//  · tabelas, não flex/grid: o Outlook renderiza com o motor do Word;
//  · estilo INLINE: o Gmail descarta <style> em boa parte dos casos;
//  · sem CSS custom properties (os tokens do app não existem aqui) — as cores
//    da marca estão fixadas nos HEX do tema claro de globals.css;
//  · sem imagem nenhuma: a maioria dos clientes bloqueia imagem por padrão, e
//    um logo quebrado destrói a confiança. A marca é feita com tipografia e
//    cor, que sempre chegam;
//  · fundo claro fixo: o "dark mode" de e-mail é invertido pelo cliente sem
//    controle nosso, então cor garantida > cor adaptativa.

export const VERDE = "#0a855c";
export const VERDE_ESCURO = "#05543a";
export const TINTA = "#111827";
export const TINTA_SUAVE = "#5b6472";
export const CANVAS = "#eef1f0";
export const HAIRLINE = "#e2e6e4";
export const FONTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";
export const FONTE_MONO = "SFMono-Regular,Menlo,Consolas,'Courier New',monospace";

export function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Título + frase de abertura. É sempre a primeira linha dentro do cartão. */
export function blocoTitulo(titulo: string, intro: string): string {
  return `
              <tr>
                <td style="padding:34px 32px 22px 32px;font-family:${FONTE};">
                  <h1 style="margin:0 0 10px 0;font-size:23px;line-height:1.25;font-weight:800;letter-spacing:-.02em;color:${TINTA};">${escapar(titulo)}</h1>
                  <p style="margin:0;font-size:15px;line-height:1.6;color:${TINTA_SUAVE};">${escapar(intro)}</p>
                </td>
              </tr>`;
}

/** Botão principal. Tabela de uma célula porque o Outlook ignora padding em <a>. */
export function blocoBotao(rotulo: string, link: string, padding = "22px 32px 4px 32px"): string {
  return `
              <tr>
                <td align="center" style="padding:${padding};">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background-color:${VERDE};border-radius:12px;">
                        <a href="${escapar(link)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${FONTE};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapar(rotulo)}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

/** O endereço cru, pra quando o clique no botão não funciona (webmail antigo). */
export function blocoLinkAlternativo(link: string, padding = "22px 32px 30px 32px"): string {
  const seguro = escapar(link);
  return `
              <tr>
                <td style="padding:${padding};font-family:${FONTE};">
                  <p style="margin:0 0 4px 0;font-size:12.5px;line-height:1.6;color:${TINTA_SUAVE};">Se o bot&atilde;o n&atilde;o funcionar, copie e cole este endere&ccedil;o no navegador:</p>
                  <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${seguro}" target="_blank" style="color:${VERDE};text-decoration:underline;">${seguro}</a></p>
                </td>
              </tr>`;
}

/** Parágrafo solto dentro do cartão. `html` entra CRU — escape antes de passar. */
export function blocoParagrafo(html: string, padding = "0 32px 22px 32px"): string {
  return `
              <tr>
                <td style="padding:${padding};font-family:${FONTE};">
                  <p style="margin:0;font-size:15px;line-height:1.6;color:${TINTA_SUAVE};">${html}</p>
                </td>
              </tr>`;
}

/**
 * Lista de destaques. Cada item é uma linha com um marcador verde e um par
 * título/descrição — o formato que sobrou depois de descartar bullet com emoji
 * (vira quadradinho no Outlook) e <ul> (margem imprevisível entre clientes).
 * Tabela por item porque é o único jeito de alinhar marcador e texto sem
 * depender de `display` nenhum.
 */
export function blocoDestaques(itens: { titulo: string; texto: string }[]): string {
  if (itens.length === 0) return "";
  const linhas = itens
    .map((item, i) => {
      const topo = i === 0 ? "0" : "14px";
      return `
                    <tr>
                      <td valign="top" width="24" style="padding:${topo} 0 0 0;font-family:${FONTE};font-size:14.5px;line-height:1.45;font-weight:800;color:${VERDE};">&bull;</td>
                      <td valign="top" style="padding:${topo} 0 0 0;font-family:${FONTE};">
                        <div style="font-size:14.5px;line-height:1.45;font-weight:700;color:${TINTA};">${escapar(item.titulo)}</div>
                        <div style="margin-top:2px;font-size:14px;line-height:1.55;color:${TINTA_SUAVE};">${escapar(item.texto)}</div>
                      </td>
                    </tr>`;
    })
    .join("");

  return `
              <tr>
                <td style="padding:0 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e4f5ed;border:1px solid #c4e6d7;border-radius:14px;">
                    <tr>
                      <td style="padding:20px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${linhas}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

/**
 * Monta o documento inteiro em volta das linhas do cartão.
 *
 * `preheader` é o trecho que Gmail/Apple Mail mostram na lista, ao lado do
 * assunto, antes de abrir. Sem ele o cliente inventa um — normalmente pegando
 * "Questly" e o começo do título, o que desperdiça a única linha de venda que
 * existe na caixa de entrada.
 *
 * `corpo` e `rodape` entram CRUS: são montados pelos blocos acima, que já
 * escapam o que vem de fora.
 */
export function montarCasca(o: {
  assunto: string;
  preheader: string;
  corpo: string;
  rodape: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapar(o.assunto)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${o.preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CANVAS};">
  <tr>
    <td align="center" style="padding:28px 12px 40px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 18px 0;font-family:${FONTE};font-size:19px;font-weight:800;letter-spacing:-.01em;color:${VERDE_ESCURO};">Questly</td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${o.corpo}
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:18px 12px 0 12px;font-family:${FONTE};font-size:12px;line-height:1.6;color:${TINTA_SUAVE};">${o.rodape}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
