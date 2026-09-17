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

/**
 * Cinza da marca d'água.
 *
 * Mais claro que o da versão anterior (223,227,232). Ela deixou de disputar
 * espaço com o texto — mora no branco, agora — e uma marca que mora no branco
 * pode ser discreta sem deixar de ser legível: sobre papel, contra fundo limpo,
 * este cinza ainda se lê e ainda sobrevive a uma fotocópia.
 */
const COR_MARCA: [number, number, number] = [232, 236, 240];

/** Vão mínimo pra caber a marca sem ficar espremida. */
const VAO_MINIMO_MM = 34;

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
}): Promise<{ blob: Blob; nome: string }> {
  // Carregadas sob demanda: juntas passam de 400 KB, e quem abre a folha só pra
  // conferir na tela não deve pagar por elas.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const blocos = Array.from(folha.querySelectorAll<HTMLElement>("[data-pdf]"));
  if (blocos.length === 0) throw new Error("Nada pra exportar nesta folha.");

  // Escala: 2.25 sobre 760px dá ~240 dpi na coluna A4 — qualidade de impressão
  // de verdade pra texto e traço. Desce pra 1.8 (~190 dpi, ainda legível no
  // papel) em folha muito longa OU em aparelho de pouca memória: ali o inimigo
  // deixa de ser nitidez e passa a ser o arquivo não ficar pronto. Meio PDF não
  // vale mais nitidez que um PDF inteiro.
  const escala = blocos.length > 60 || poucaMemoria() ? 1.8 : 2.25;

  const restaurarLargura = fixarLarguraDeRender(folha);
  const restaurarImagens = await inlinarImagens(folha);

  try {
    // Uma volta do laço de layout depois de mexer na largura: sem isso o
    // html2canvas fotografa a folha antes do reflow.
    await proximoQuadro();

    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    let y = MARGEM.topo;
    let paginaVazia = true;

    // ONDE HÁ TEXTO EM CADA PÁGINA.
    //
    // Guardado enquanto a folha é montada porque é aqui — e só aqui — que se
    // sabe. A marca d'água é carimbada no fim, e sem este mapa ela caía em cima
    // do enunciado: seis posições fixas em porcentagem não têm como saber que na
    // terceira delas, naquela página, tem uma equação. Com o mapa, ela procura
    // o branco (ver `faixasLivres`).
    let pagina = 1;
    const ocupado = new Map<number, [number, number][]>();
    const marcarOcupado = (de: number, ate: number) => {
      const faixas = ocupado.get(pagina) ?? [];
      faixas.push([de, ate]);
      ocupado.set(pagina, faixas);
    };

    const novaPagina = () => {
      pdf.addPage();
      pagina += 1;
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
        marcarOcupado(y, y + fatiaPx / pxPorMm);
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

    carimbarPaginas(pdf, email, ocupado);

    // Devolve o arquivo em vez de salvá-lo. Quem entrega é a tela — ver
    // `entregarPdf` em folha-impressao.tsx: no celular, um `save()` disparado
    // depois de segundos de `await` já saiu do gesto do aluno, e o navegador
    // engole o download sem erro nenhum ("fica montando e depois nada
    // acontece"). Com o arquivo em mãos, a tela pode oferecer um botão de
    // verdade pra ele tocar.
    return { blob: pdf.output("blob") as Blob, nome: `${nomeArquivo}.pdf` };
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
 * marca se ela viesse antes. Em vetor — e em cinza-claro SÓLIDO, não preto
 * translúcido: uma camada semitransparente cobrindo a página obriga o leitor de
 * PDF a achatar tudo que está embaixo num bitmap.
 *
 * A MARCA PROCURA O BRANCO. A versão anterior carimbava seis posições fixas em
 * porcentagem da página, e o dono reclamou com razão: caía em cima do enunciado
 * e ficava feio. Posição fixa não tem como saber onde há texto — mas o gerador
 * sabe, porque foi ele quem colocou cada imagem na página (`ocupado`). Aqui a
 * marca é posta no MAIOR vão livre de cada folha, que numa lista com espaço pra
 * resolver é justamente o espaço em branco da conta. Sem vão que sirva (folha
 * de gabarito, prova compacta), ela vai pra margem lateral, deitada — onde
 * nunca houve texto.
 *
 * Isso não afrouxa a atribuição: o rodapé com o e-mail continua em toda página,
 * e basta UMA marca sobreviver a um recorte pra amarrar a cópia à conta.
 */
function carimbarPaginas(
  pdf: import("jspdf").jsPDF,
  email: string,
  ocupado: Map<number, [number, number][]>,
) {
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...COR_MARCA);

    const vaos = faixasLivres(ocupado.get(p) ?? []);
    if (vaos.length > 0) {
      pdf.setFontSize(10);
      for (const vao of vaos.slice(0, 2)) {
        const meio = (vao[0] + vao[1]) / 2;
        pdf.text(email, MARGEM.esquerda + 14, meio + 14, { angle: 26 });
      }
    } else {
      // Margem lateral, deitada: a faixa que o texto nunca ocupa.
      pdf.setFontSize(8);
      pdf.text(email, 6.5, A4.altura / 2 + 28, { angle: 90 });
    }

    pdf.setFontSize(7);
    pdf.setTextColor(150, 157, 166);
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
 * Os vãos em branco de uma página, do maior pro menor.
 *
 * Só devolve vão que comporte a marca com folga (`VAO_MINIMO_MM`): enfiá-la num
 * respiro de 8mm entre duas questões é a mesma feiura de antes, com outro nome.
 */
function faixasLivres(ocupadas: [number, number][]): [number, number][] {
  const ordenadas = [...ocupadas].sort((a, b) => a[0] - b[0]);
  const vaos: [number, number][] = [];
  let cursor = MARGEM.topo;
  for (const [de, ate] of ordenadas) {
    if (de - cursor >= VAO_MINIMO_MM) vaos.push([cursor, de]);
    cursor = Math.max(cursor, ate);
  }
  if (LIMITE_Y - cursor >= VAO_MINIMO_MM) vaos.push([cursor, LIMITE_Y]);
  return vaos.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
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

/**
 * Aparelho apertado de memória.
 *
 * `deviceMemory` é uma dica grosseira (arredondada, e nem todo navegador a
 * expõe) — e serve exatamente pra isso: na dúvida, não é informada e a gente
 * segue no padrão. Quando ELA diz 4 GB ou menos, é um celular de entrada, e ali
 * cada canvas a mais é uma chance de o navegador matar a aba no meio.
 */
function poucaMemoria(): boolean {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof mem === "number" && mem > 0 && mem <= 4;
}

function proximoQuadro(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
