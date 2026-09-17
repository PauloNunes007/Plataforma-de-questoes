"use client";

import type { ProgressoPdf } from "./tipos-pdf";

// O PDF DE VERDADE — montado aqui, não entregue ao diálogo de impressão.
//
// Por que mudou. Até aqui o "exportar em PDF" era `window.print()` e a folha
// era uma página HTML com `@media print` caprichado. Três rodadas de conserto
// depois (ver web/CLAUDE.md), o caminho continuava entregando três defeitos que
// não são do nosso CSS e sim do pipeline de pré-visualização do Chrome:
//
//  1. o aluno pediu "baixar PDF" e recebeu uma IMPRESSÃO — com bandeja de
//     papel, margem do navegador e "cabeçalhos e rodapés" pra desmarcar à mão;
//  2. o arquivo saía SEM NOME sugerido (o truque do `document.title` depende do
//     navegador, da versão e de o preview ter chegado a montar);
//  3. e, em documento longo com figura, o preview falhava com "Falha ao
//     carregar documento PDF" — o arquivo salvo nascia corrompido.
//
// Os três morrem juntos quando NÓS escrevemos o PDF: `pdf.save(nome)` é um
// download comum, com nome definido por nós, de um arquivo que já está pronto e
// válido antes de o navegador encostar nele.
//
// Como é montado. Não é "fotografar a página inteira num canvas gigante e
// fatiar" — é isso que corta questão no meio da folha. Cada BLOCO marcado com
// `data-pdf` na folha (o cabeçalho, o miolo de cada questão, o cartão-resposta,
// o gabarito) vira uma imagem própria, e a paginação é feita aqui: um bloco que
// não cabe no que sobrou da página desce inteiro pra próxima. Só um bloco maior
// que a página inteira é fatiado, porque aí não há escolha.
//
// O que NÃO é rasterizado: o espaço pra resolver (é branco — `data-pdf-espaco`
// diz quantos milímetros reservar, e ele PODE partir entre páginas), os filetes
// separadores, a marca d'água e o rodapé. Tudo isso sai em vetor, o que mantém
// o arquivo pequeno e a marca nítida em qualquer zoom.

const A4 = { largura: 210, altura: 297 };
const MARGEM = { topo: 14, base: 16, esquerda: 14, direita: 14 };
const LARGURA_UTIL = A4.largura - MARGEM.esquerda - MARGEM.direita;
const LIMITE_Y = A4.altura - MARGEM.base;

/** Sobra menor que isso no fim da página não vale a pena aproveitar. */
const SOBRA_INUTIL_MM = 14;

/** Respiro do filete que separa uma questão da anterior (metade acima, metade abaixo). */
const ALTURA_SEPARADOR_MM = 7.5;

/**
 * Largura em px com que a folha é fotografada.
 *
 * FIXA, e não a largura da tela: sem isso o PDF sairia com a diagramação do
 * celular (fonte enorme, alternativas empilhadas) só porque o aluno apertou o
 * botão no telefone. 760px sobre 182mm de coluna útil é também o que faz as
 * alturas de figura da TELA (`max-h-[190px]`, `max-h-[78px]`) caírem nos ~46mm
 * e ~19mm que o papel comporta — a pré-visualização passa a ser honesta.
 */
const LARGURA_RENDER_PX = 760;

/**
 * Qualidade do JPEG de cada bloco.
 *
 * Medido, não chutado (folha de teste de 7 páginas com figura em cada questão):
 * 0.92 → 4,2 MB · 0.85 → 3,3 MB · 0.80 → 3,0 MB · 0.72 → 1,9 MB. O arquivo é
 * baixado no celular do aluno, muitas vezes no 4G da faculdade, e acima de
 * ~0.85 o ganho visível em texto preto sobre branco a 240 dpi é nenhum — o que
 * cresce é só o peso.
 */
const QUALIDADE_JPEG = 0.85;

/** Marca d'água: 6 carimbos por página, nas mesmas posições da tela. */
const POSICOES_MARCA = [
  { x: 12, y: 40 },
  { x: 112, y: 82 },
  { x: 36, y: 130 },
  { x: 122, y: 172 },
  { x: 16, y: 222 },
  { x: 104, y: 262 },
];

export async function baixarFolhaEmPdf({
  folha,
  nomeArquivo,
  email,
  onProgresso,
}: {
  folha: HTMLElement;
  nomeArquivo: string;
  email: string;
  onProgresso?: (p: ProgressoPdf) => void;
}): Promise<void> {
  // Carregadas sob demanda: juntas passam de 400 KB, e quem abre a folha só pra
  // conferir na tela não deve pagar por elas.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const blocos = Array.from(folha.querySelectorAll<HTMLElement>("[data-pdf]"));
  if (blocos.length === 0) throw new Error("Nada pra exportar nesta folha.");

  // Escala: 2.25 sobre 760px dá ~240 dpi na coluna A4 — qualidade de impressão
  // de verdade pra texto e traço. Em folha muito longa desce pra 1.8 (~190 dpi,
  // ainda legível no papel): ali o inimigo deixa de ser nitidez e passa a ser a
  // memória do celular, que estoura antes de o arquivo ficar pronto.
  const escala = blocos.length > 60 ? 1.8 : 2.25;

  const restaurarLargura = fixarLarguraDeRender(folha);
  const restaurarImagens = await inlinarImagens(folha);

  try {
    // Uma volta do laço de layout depois de mexer na largura: sem isso o
    // html2canvas fotografa a folha antes do reflow.
    await proximoQuadro();

    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    let y = MARGEM.topo;
    let paginaVazia = true;

    const novaPagina = () => {
      pdf.addPage();
      y = MARGEM.topo;
      paginaVazia = true;
    };

    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i];
      onProgresso?.({ feitos: i, total: blocos.length });

      if (bloco.dataset.pdfPagina === "nova" && !paginaVazia) novaPagina();

      const canvas = await html2canvas(bloco, {
        scale: escala,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      if (canvas.width === 0 || canvas.height === 0) continue;

      const pxPorMm = canvas.width / LARGURA_UTIL;
      const alturaMm = canvas.height / pxPorMm;

      // Filete separando uma questão da anterior. É desenhado DEPOIS de decidir
      // a página, não antes: a primeira versão desenhava e só então descobria
      // que a questão não cabia, e sobrava um traço pendurado no pé da folha
      // sem nada embaixo. Aqui ele entra na conta do que precisa caber e, se a
      // página virar, some — no topo de uma folha nova não há o que separar.
      const querSeparador = bloco.dataset.pdfSeparador === "1";
      const alturaSeparador = querSeparador && !paginaVazia ? ALTURA_SEPARADOR_MM : 0;

      // Bloco que cabe numa página inteira nunca é fatiado: desce inteiro.
      if (
        alturaMm <= LIMITE_Y - MARGEM.topo &&
        y + alturaSeparador + alturaMm > LIMITE_Y
      ) {
        novaPagina();
      }

      if (querSeparador && !paginaVazia) {
        y += ALTURA_SEPARADOR_MM / 2;
        pdf.setDrawColor(226, 230, 234);
        pdf.setLineWidth(0.2);
        pdf.line(MARGEM.esquerda, y, A4.largura - MARGEM.direita, y);
        y += ALTURA_SEPARADOR_MM / 2;
      }

      let offsetPx = 0;
      while (offsetPx < canvas.height) {
        const disponivelMm = LIMITE_Y - y;
        if (disponivelMm < SOBRA_INUTIL_MM) {
          novaPagina();
          continue;
        }
        const fatiaPx = Math.min(canvas.height - offsetPx, Math.floor(disponivelMm * pxPorMm));
        const fatia = recortar(canvas, offsetPx, fatiaPx);
        pdf.addImage(
          fatia.toDataURL("image/jpeg", QUALIDADE_JPEG),
          "JPEG",
          MARGEM.esquerda,
          y,
          LARGURA_UTIL,
          fatiaPx / pxPorMm,
          undefined,
          "FAST",
        );
        if (fatia !== canvas) descartar(fatia);
        y += fatiaPx / pxPorMm;
        paginaVazia = false;
        offsetPx += fatiaPx;
        if (offsetPx < canvas.height) novaPagina();
      }

      descartar(canvas);

      // Espaço pra resolver: branco, desenhado (não fotografado) e — ao
      // contrário do miolo — PODE partir entre páginas. Meia folha de espaço em
      // branco no fim de uma página e o resto no começo da outra não atrapalha
      // ninguém; proibir a quebra dele era o que deixava meia página vazia.
      const espaco = Number(bloco.dataset.pdfEspaco || 0);
      if (espaco > 0) {
        y += 2.5;
        pdf.setDrawColor(215, 221, 226);
        pdf.setLineWidth(0.2);
        pdf.setLineDashPattern([1.1, 1.1], 0);
        pdf.line(MARGEM.esquerda, y, A4.largura - MARGEM.direita, y);
        pdf.setLineDashPattern([], 0);
        y += 1.5;

        let restante = espaco;
        while (restante > 0) {
          const cabe = LIMITE_Y - y;
          if (cabe <= 2) {
            novaPagina();
            // O que sobrou não recomeça na folha seguinte: o aluno já tem a
            // página nova inteira pra desenvolver.
            break;
          }
          const usado = Math.min(restante, cabe);
          y += usado;
          restante -= usado;
          paginaVazia = false;
        }
      }

      y += 3;
    }

    onProgresso?.({ feitos: blocos.length, total: blocos.length });

    carimbarPaginas(pdf, email);
    pdf.save(`${nomeArquivo}.pdf`);
  } finally {
    restaurarImagens();
    restaurarLargura();
  }
}

// ---------------------------------------------------------------------------

/**
 * Marca d'água e rodapé, numa passada final por TODAS as páginas.
 *
 * Depois do conteúdo, de propósito: as fatias são JPEG opaco e cobririam a
 * marca se ela viesse antes. Em vetor, como era na folha impressa — e em
 * cinza-claro SÓLIDO, não preto translúcido: uma camada semitransparente
 * cobrindo a página obriga o leitor de PDF a achatar tudo que está embaixo.
 */
function carimbarPaginas(pdf: import("jspdf").jsPDF, email: string) {
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(223, 227, 232);
    for (const pos of POSICOES_MARCA) {
      pdf.text(email, pos.x, pos.y, { angle: 30 });
    }

    pdf.setFontSize(7);
    pdf.setTextColor(140, 147, 156);
    pdf.text(
      `Expectrum · cópia pessoal de ${email} · a redistribuição identifica esta conta`,
      A4.largura / 2,
      A4.altura - 7,
      { align: "center" },
    );
    pdf.text(`${p}/${total}`, A4.largura - MARGEM.direita, A4.altura - 7, { align: "right" });
  }
}

/**
 * Trava a folha na largura de render.
 *
 * Mexe no elemento por `style` e devolve exatamente o que estava lá — a folha
 * continua sendo a mesma que o aluno vê, só passa alguns segundos com largura
 * de A4 enquanto é fotografada.
 */
function fixarLarguraDeRender(folha: HTMLElement): () => void {
  const anterior = folha.getAttribute("style");
  folha.style.width = `${LARGURA_RENDER_PX}px`;
  folha.style.maxWidth = "none";
  folha.style.paddingLeft = "0px";
  folha.style.paddingRight = "0px";
  return () => {
    if (anterior === null) folha.removeAttribute("style");
    else folha.setAttribute("style", anterior);
  };
}

/**
 * Troca cada figura pela mesma imagem em `data:`.
 *
 * As figuras vêm do Storage do Supabase, outro domínio. Desenhar imagem de
 * outro domínio num canvas o CONTAMINA, e aí `toDataURL` lança — o PDF sairia
 * sem figura nenhuma, ou não sairia. Buscar o arquivo e embutir resolve isso na
 * origem. Se a busca falhar (rede, CORS), a URL original fica e o `useCORS` do
 * html2canvas ainda pode dar conta: é degradação, não quebra.
 */
async function inlinarImagens(raiz: HTMLElement): Promise<() => void> {
  const imagens = Array.from(raiz.querySelectorAll("img"));
  const desfazer: (() => void)[] = [];

  await Promise.all(
    imagens.map(async (img) => {
      const original = img.getAttribute("src");
      if (!original || original.startsWith("data:")) return;
      try {
        const resposta = await fetch(original, { mode: "cors", cache: "force-cache" });
        if (!resposta.ok) return;
        const blob = await resposta.blob();
        const dataUrl = await lerComoDataUrl(blob);
        img.setAttribute("src", dataUrl);
        desfazer.push(() => img.setAttribute("src", original));
        await img.decode().catch(() => undefined);
      } catch {
        // fica com a URL original
      }
    }),
  );

  return () => desfazer.forEach((f) => f());
}

function lerComoDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

function recortar(fonte: HTMLCanvasElement, topoPx: number, alturaPx: number): HTMLCanvasElement {
  if (topoPx === 0 && alturaPx === fonte.height) return fonte;
  const destino = document.createElement("canvas");
  destino.width = fonte.width;
  destino.height = alturaPx;
  const ctx = destino.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, destino.width, destino.height);
    ctx.drawImage(fonte, 0, topoPx, fonte.width, alturaPx, 0, 0, fonte.width, alturaPx);
  }
  return destino;
}

/** Canvas de 2000×5000 não some sozinho a tempo no celular. */
function descartar(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

function proximoQuadro(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
