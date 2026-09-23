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
// separadores e o rodapé. Tudo isso sai em vetor, o que mantém o arquivo
// pequeno e o traço nítido em qualquer zoom.
//
// A MARCA D'ÁGUA, essa, sai nas DUAS naturezas de propósito — ver
// `carimbarNoCanvas` e `carimbarPaginas` logo abaixo.

const A4 = { largura: 210, altura: 297 };
const MARGEM = { topo: 14, base: 16, esquerda: 14, direita: 14 };
const LARGURA_UTIL = A4.largura - MARGEM.esquerda - MARGEM.direita;
const LIMITE_Y = A4.altura - MARGEM.base;

/** Sobra menor que isso no fim da página não vale a pena aproveitar. */
const SOBRA_INUTIL_MM = 14;

/** Respiro do filete que separa uma questão da anterior (metade acima, metade abaixo). */
const ALTURA_SEPARADOR_MM = 7.5;

/**
 * DUAS COLUNAS — o molde da prova impressa de faculdade.
 *
 * Um bloco marcado com `data-pdf-coluna="1"` é desenhado com metade da largura
 * útil e flui: enche a coluna da esquerda, passa pra da direita, e só então
 * vira a página. Bloco SEM o atributo continua exatamente como antes (largura
 * inteira), então nada do que já existia muda de comportamento.
 *
 * A gola (o vão entre as colunas) é o que impede a última palavra de uma linha
 * da esquerda de encostar na primeira da direita.
 */
const GOLA_COLUNA_MM = 7;
const LARGURA_COLUNA = (LARGURA_UTIL - GOLA_COLUNA_MM) / 2;

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
 * Cinza da marca d'água VETORIAL (a que mora no branco da folha).
 *
 * Mais claro que o da versão anterior (223,227,232). Ela deixou de disputar
 * espaço com o texto — mora no branco, agora — e uma marca que mora no branco
 * pode ser discreta sem deixar de ser legível: sobre papel, contra fundo limpo,
 * este cinza ainda se lê e ainda sobrevive a uma fotocópia.
 */
const COR_MARCA: [number, number, number] = [232, 236, 240];

/** Vão mínimo pra caber a marca sem ficar espremida. */
const VAO_MINIMO_MM = 34;

/**
 * Vão grande o bastante pra comportar DUAS marcas sem uma encostar na outra —
 * é o caso do espaço pra resolver, que sozinho ocupa meia folha.
 */
const VAO_DUPLO_MM = 95;

/**
 * A MARCA QUE NÃO SAI: cinza do carimbo RASTERIZADO.
 *
 * Desenhado dentro do bitmap de cada bloco, com blend `darken` — o pixel final
 * é o mais escuro entre o conteúdo e este cinza, então o texto preto continua
 * preto (legibilidade intacta) e só o branco em volta ganha o tom. Não existe
 * objeto de texto pra selecionar, nem camada pra apagar: quem quiser tirar a
 * marca tem que repintar a página inteira à mão, pixel a pixel, e o que sobra
 * não é mais a nossa folha.
 *
 * Um pouco mais escuro que o COR_MARCA vetorial (228,234,240 contra 232,236,
 * 240) porque este convive com texto em volta e precisa se sustentar depois do
 * JPEG; ainda assim é ~9% de cinza — a leitura não muda.
 */
const COR_MARCA_RASTER = "rgb(228, 234, 240)";

/** Grade do carimbo rasterizado: passo, altura de letra e inclinação. */
const RASTER_PASSO_X_MM = 62;
const RASTER_PASSO_Y_MM = 26;
const RASTER_ALTURA_MM = 2.5;
const RASTER_ANGULO_GRAUS = -26;

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

    // Estado do modo de duas colunas (ver GOLA_COLUNA_MM). `topoColunas` é a
    // altura em que a região de colunas começa NESTA página: a coluna da
    // direita recomeça ali, e não no topo da margem, senão ela subiria por
    // cima do cabeçalho na primeira página.
    let emModoColuna = false;
    let coluna = 0; // 0 = esquerda, 1 = direita
    let topoColunas = MARGEM.topo;

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
      coluna = 0;
      topoColunas = MARGEM.topo;
    };

    for (let i = 0; i < blocos.length; i++) {
      const bloco = blocos[i];
      onProgresso?.({ feitos: i, total: blocos.length });

      // Entrada e saída do modo de duas colunas. Um bloco de largura inteira
      // depois de blocos em coluna começa página nova: encaixá-lo ao lado de
      // meia coluna já preenchida daria uma folha que ninguém lê na ordem
      // certa.
      const emColuna = bloco.dataset.pdfColuna === "1";
      if (emColuna && !emModoColuna) {
        emModoColuna = true;
        topoColunas = y;
        coluna = 0;
      } else if (!emColuna && emModoColuna) {
        emModoColuna = false;
        if (!paginaVazia || coluna === 1) novaPagina();
      }

      if (bloco.dataset.pdfPagina === "nova" && !paginaVazia) novaPagina();

      const canvas = await html2canvas(bloco, {
        scale: escala,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      if (canvas.width === 0 || canvas.height === 0) continue;

      const larguraAlvo = emColuna ? LARGURA_COLUNA : LARGURA_UTIL;
      const xDoBloco = () =>
        MARGEM.esquerda + (emColuna && coluna === 1 ? LARGURA_COLUNA + GOLA_COLUNA_MM : 0);
      const pxPorMm = canvas.width / larguraAlvo;
      const alturaMm = canvas.height / pxPorMm;

      // "Avançar" é a próxima coluna quando há uma, e a próxima página quando
      // não há. É o único lugar em que as duas coisas se confundem.
      const avancar = () => {
        if (emColuna && coluna === 0) {
          coluna = 1;
          y = topoColunas;
          paginaVazia = true;
        } else {
          novaPagina();
        }
      };

      // Filete separando uma questão da anterior. É desenhado DEPOIS de decidir
      // a página, não antes: a primeira versão desenhava e só então descobria
      // que a questão não cabia, e sobrava um traço pendurado no pé da folha
      // sem nada embaixo. Aqui ele entra na conta do que precisa caber e, se a
      // página virar, some — no topo de uma folha nova não há o que separar.
      const querSeparador = bloco.dataset.pdfSeparador === "1";
      const alturaSeparador = querSeparador && !paginaVazia ? ALTURA_SEPARADOR_MM : 0;

      // Bloco que cabe numa coluna (ou numa página, fora do modo de colunas)
      // nunca é fatiado: desce inteiro.
      const alturaDisponivelCheia = LIMITE_Y - (emColuna ? topoColunas : MARGEM.topo);
      if (alturaMm <= alturaDisponivelCheia && y + alturaSeparador + alturaMm > LIMITE_Y) {
        avancar();
      }

      if (querSeparador && !paginaVazia) {
        y += ALTURA_SEPARADOR_MM / 2;
        pdf.setDrawColor(226, 230, 234);
        pdf.setLineWidth(0.2);
        pdf.line(MARGEM.esquerda, y, A4.largura - MARGEM.direita, y);
        y += ALTURA_SEPARADOR_MM / 2;
      }

      // Carimbo dentro do bitmap, AGORA — depois da decisão de página, porque é
      // só aqui que `y` (a fase da grade) é definitiva, e antes do fatiamento,
      // porque uma fatia já é o pixel final que entra no PDF.
      carimbarNoCanvas(canvas, email, pxPorMm, y);

      let offsetPx = 0;
      while (offsetPx < canvas.height) {
        const disponivelMm = LIMITE_Y - y;
        if (disponivelMm < SOBRA_INUTIL_MM) {
          avancar();
          continue;
        }
        const fatiaPx = Math.min(canvas.height - offsetPx, Math.floor(disponivelMm * pxPorMm));
        const fatia = recortar(canvas, offsetPx, fatiaPx);
        pdf.addImage(
          fatia.toDataURL("image/jpeg", QUALIDADE_JPEG),
          "JPEG",
          xDoBloco(),
          y,
          larguraAlvo,
          fatiaPx / pxPorMm,
          undefined,
          "FAST",
        );
        if (fatia !== canvas) descartar(fatia);
        marcarOcupado(y, y + fatiaPx / pxPorMm);
        y += fatiaPx / pxPorMm;
        paginaVazia = false;
        offsetPx += fatiaPx;
        if (offsetPx < canvas.height) avancar();
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

    // Metadados do arquivo: a camada mais fácil de apagar das três, e por isso
    // a última da lista — mas é de graça, e é o que aparece em "Propriedades"
    // de qualquer leitor sem ninguém precisar procurar.
    pdf.setProperties({
      title: nomeArquivo,
      subject: `Cópia pessoal de ${email}`,
      author: "Expectrum",
      keywords: `expectrum, ${email}`,
      creator: "Expectrum",
    });

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
 * Carimbo RASTERIZADO — a marca que sobrevive ao editor de PDF.
 *
 * Por que existe. A marca vetorial de `carimbarPaginas` é bonita e nítida, e
 * some com dois cliques: num PDF, texto vetorial é um OBJETO, e qualquer editor
 * (ou um `qpdf`/`mutool` de linha de comando) apaga objeto. Quem ia repassar o
 * arquivo pro grupo da turma nunca precisou de mais que isso. Aqui a marca
 * entra nos PIXELS do bloco, antes de ele virar JPEG: não há objeto pra
 * selecionar, não há camada pra esconder, e o `-` do texto do enunciado e o `-`
 * da marca são a mesma coisa pro arquivo.
 *
 * Por que não atrapalha ler. O blend é `darken`: o pixel final é o mais ESCURO
 * entre o que já estava lá e o cinza da marca. Onde há texto preto, o preto
 * ganha e nada muda; onde há branco, entra um cinza de ~9%. Fotocópia e leitura
 * na tela seguem iguais — é o mesmo princípio do papel timbrado.
 *
 * `darken` (e `multiply`, a segunda opção) são universais em navegador atual;
 * se nenhum dos dois pegar, a função DESISTE em vez de cair no `source-over`
 * padrão, que pintaria tarjas cinzas opacas por cima do enunciado. Marca a
 * menos é aceitável; folha ilegível não é.
 */
function carimbarNoCanvas(
  canvas: HTMLCanvasElement,
  email: string,
  pxPorMm: number,
  faseMm: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  try {
    ctx.globalCompositeOperation = "darken";
    if (ctx.globalCompositeOperation !== "darken") {
      ctx.globalCompositeOperation = "multiply";
      if (ctx.globalCompositeOperation !== "multiply") return;
    }

    ctx.fillStyle = COR_MARCA_RASTER;
    // 1.34 ≈ corpo da fonte / altura de caixa-alta: a constante é declarada em
    // milímetros de letra visível, não em "px de font-size".
    ctx.font = `${RASTER_ALTURA_MM * pxPorMm * 1.34}px Helvetica, Arial, sans-serif`;
    ctx.textBaseline = "middle";

    const passoX = RASTER_PASSO_X_MM * pxPorMm;
    const passoY = RASTER_PASSO_Y_MM * pxPorMm;
    const radianos = (RASTER_ANGULO_GRAUS * Math.PI) / 180;

    // A fase é a posição do bloco NA PÁGINA: sem ela, cada bloco recomeçaria a
    // grade no próprio topo e a marca formaria degraus visíveis a cada questão.
    const fase = faseMm * pxPorMm;
    const primeira = Math.floor(fase / passoY);
    const ultima = Math.ceil((fase + canvas.height) / passoY);

    for (let linha = primeira; linha <= ultima; linha++) {
      const y = linha * passoY - fase;
      // Linhas ímpares deslocadas meio passo: grade em tijolo, que é mais
      // difícil de "adivinhar e apagar" em bloco do que uma grade alinhada.
      const deslocamento = (Math.abs(linha) % 2) * (passoX / 2);
      for (let x = deslocamento - passoX; x < canvas.width + passoX; x += passoX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(radianos);
        ctx.fillText(email, 0, 0);
        ctx.restore();
      }
    }
  } finally {
    ctx.restore();
  }
}

/**
 * Marca d'água VETORIAL e rodapé, numa passada final por TODAS as páginas.
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
 * marca é posta nos MAIORES vãos livres de cada folha, que numa lista com
 * espaço pra resolver é justamente o espaço em branco da conta.
 *
 * ESTA CAMADA É A BONITA, NÃO A QUE SEGURA. Ela é vetorial, e vetor num PDF é
 * objeto: qualquer editor apaga. Quem segura é o carimbo rasterizado de
 * `carimbarNoCanvas`, que está dentro dos pixels. As duas juntas dão as três
 * coisas que se quer de uma marca — nítida onde dá (vetor no branco),
 * impossível de remover onde importa (raster no conteúdo) e presente em toda
 * página aconteça o que acontecer (margens laterais + rodapé). Basta UMA
 * sobreviver a um recorte pra amarrar a cópia à conta.
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

    // 1) O branco da folha. Até três vãos por página (era um ou dois), e um vão
    //    do tamanho do espaço pra resolver leva duas marcas — é justamente a
    //    folha mais "limpa" que valeria a pena raspar e repassar adiante.
    for (const vao of faixasLivres(ocupado.get(p) ?? []).slice(0, 3)) {
      const altura = vao[1] - vao[0];
      pdf.setFontSize(10);
      if (altura >= VAO_DUPLO_MM) {
        pdf.text(email, MARGEM.esquerda + 10, vao[0] + altura * 0.3 + 12, { angle: 26 });
        pdf.text(email, MARGEM.esquerda + 46, vao[0] + altura * 0.72 + 12, { angle: 26 });
      } else {
        pdf.text(email, MARGEM.esquerda + 14, (vao[0] + vao[1]) / 2 + 14, { angle: 26 });
      }
    }

    // 2) As DUAS margens laterais, deitadas, em TODA página — não mais só
    //    quando não sobrou branco. É a faixa que o texto nunca ocupa, então
    //    isso não custa legibilidade nenhuma, e é o que continua identificando
    //    a cópia numa página cheia de ponta a ponta.
    pdf.setFontSize(8);
    pdf.text(email, 6.5, A4.altura / 2 + 28, { angle: 90 });
    pdf.text(email, A4.largura - 4.5, A4.altura / 2 - 28, { angle: -90 });

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
