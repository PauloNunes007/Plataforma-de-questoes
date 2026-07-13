"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Crop, Loader2, Minus, Plus, X } from "lucide-react";
import type { PDFDocumentProxy, PageViewport } from "pdfjs-dist";
import { LETRAS_ALTERNATIVA, type Letra } from "@/lib/importar/types";

// Alvo do recorte: a figura do enunciado ou a de uma alternativa.
export type AlvoRecorte = { tipo: "enunciado" } | { tipo: "alt"; letra: Letra };

export type ArquivoPdf = { nome: string; data: ArrayBuffer };

type Retangulo = { x: number; y: number; w: number; h: number }; // em px do canvas (device)

// Normalização tolerante pra casar `fonte_arquivo` do JSON com o nome real
// do PDF carregado ("P1 (16.2).pdf" ~ "P1_16-2.pdf" → "p1162pdf").
export function normalizarNomeArquivo(nome: string): string {
  return nome.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// pdfjs é ESM/só-browser — importado dinamicamente no cliente. O worker é
// resolvido como asset local (sem CDN, respeita a CSP do app).
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function carregarPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

// Detecção de figuras: renderiza a página, subtrai as caixas de texto
// (via getTextContent) da "tinta" da página e agrupa o que sobra em
// componentes conexos — pega tanto figura rasterizada quanto desenho
// vetorial, porque opera nos pixels já renderizados. Heurística, sempre
// ajustável na mão.
async function detectarFiguras(
  pdfjs: typeof import("pdfjs-dist"),
  canvas: HTMLCanvasElement,
  page: Awaited<ReturnType<PDFDocumentProxy["getPage"]>>,
  viewport: PageViewport,
): Promise<Retangulo[]> {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || W === 0 || H === 0) return [];

  const CELL = 6;
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);
  const ehTexto = new Uint8Array(cols * rows);
  const temTinta = new Uint8Array(cols * rows);

  // Máscara de texto
  try {
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const m = pdfjs.Util.transform(viewport.transform, item.transform);
      const alturaFonte = Math.hypot(m[2], m[3]) || 1;
      const largura = (item.width || 0) * viewport.scale;
      const x0 = m[4];
      const y0 = m[5] - alturaFonte; // baseline → topo
      const pad = 2;
      const cx0 = Math.max(0, Math.floor((x0 - pad) / CELL));
      const cx1 = Math.min(cols - 1, Math.floor((x0 + largura + pad) / CELL));
      const cy0 = Math.max(0, Math.floor((y0 - pad) / CELL));
      const cy1 = Math.min(rows - 1, Math.floor((y0 + alturaFonte + pad) / CELL));
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) ehTexto[cy * cols + cx] = 1;
      }
    }
  } catch {
    // sem text layer (ex: prova escaneada) — segue só com a tinta
  }

  // Mapa de tinta (pixel não-branco)
  const data = ctx.getImageData(0, 0, W, H).data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235) {
        temTinta[Math.floor(y / CELL) * cols + Math.floor(x / CELL)] = 1;
      }
    }
  }

  // Células candidatas: tinta que não é texto
  const cand = new Uint8Array(cols * rows);
  for (let k = 0; k < cand.length; k++) {
    if (temTinta[k] && !ehTexto[k]) cand[k] = 1;
  }

  // Componentes conexos (8-conectividade) → caixas
  const visitado = new Uint8Array(cols * rows);
  const caixas: Retangulo[] = [];
  const pilha: number[] = [];
  for (let inicio = 0; inicio < cand.length; inicio++) {
    if (!cand[inicio] || visitado[inicio]) continue;
    pilha.length = 0;
    pilha.push(inicio);
    visitado[inicio] = 1;
    let minCx = cols, minCy = rows, maxCx = 0, maxCy = 0, tamanho = 0;
    while (pilha.length) {
      const k = pilha.pop()!;
      const cx = k % cols;
      const cy = (k - cx) / cols;
      tamanho++;
      if (cx < minCx) minCx = cx;
      if (cx > maxCx) maxCx = cx;
      if (cy < minCy) minCy = cy;
      if (cy > maxCy) maxCy = cy;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nk = ny * cols + nx;
          if (cand[nk] && !visitado[nk]) {
            visitado[nk] = 1;
            pilha.push(nk);
          }
        }
      }
    }
    const px = minCx * CELL;
    const py = minCy * CELL;
    const pw = (maxCx - minCx + 1) * CELL;
    const ph = (maxCy - minCy + 1) * CELL;
    // Filtra: precisa ser grande o bastante e não uma tira fina (linha de texto residual)
    const areaMin = W * H * 0.004;
    if (pw * ph < areaMin || pw < 40 || ph < 30 || tamanho < 12) continue;
    caixas.push({ x: px, y: py, w: pw, h: ph });
  }

  // Mescla caixas próximas/sobrepostas
  const mescladas = mesclarCaixas(caixas, 18);
  mescladas.sort((a, b) => b.w * b.h - a.w * a.h);
  return mescladas.slice(0, 6);
}

function mesclarCaixas(caixas: Retangulo[], folga: number): Retangulo[] {
  const out = caixas.map((c) => ({ ...c }));
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        const sobrepoe =
          a.x - folga < b.x + b.w &&
          b.x - folga < a.x + a.w &&
          a.y - folga < b.y + b.h &&
          b.y - folga < a.y + a.h;
        if (sobrepoe) {
          const x0 = Math.min(a.x, b.x);
          const y0 = Math.min(a.y, b.y);
          const x1 = Math.max(a.x + a.w, b.x + b.w);
          const y1 = Math.max(a.y + a.h, b.y + b.h);
          out[i] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
          out.splice(j, 1);
          mudou = true;
          break;
        }
      }
      if (mudou) break;
    }
  }
  return out;
}

function rotuloAlvo(alvo: AlvoRecorte): string {
  return alvo.tipo === "enunciado" ? "Enunciado" : `Alternativa ${alvo.letra.toUpperCase()}`;
}

export function PdfRecortador({
  arquivos,
  nomeInicial,
  paginaInicial,
  alvoInicial,
  onRecortar,
  onFechar,
}: {
  arquivos: ArquivoPdf[];
  nomeInicial: string | null;
  paginaInicial: number | null;
  alvoInicial: AlvoRecorte;
  onRecortar: (alvo: AlvoRecorte, blob: Blob) => Promise<void>;
  onFechar: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docsRef = useRef<Map<string, PDFDocumentProxy>>(new Map());
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // -1 quando o `fonte_arquivo` da questão não casou com nenhum PDF carregado
  // (ou não havia fonte) — aí mostramos o seletor pra pessoa escolher.
  const idxAchado = arquivos.findIndex((a) => a.nome === nomeInicial);
  const [indiceArquivo, setIndiceArquivo] = useState(idxAchado === -1 ? 0 : idxAchado);
  const [pagina, setPagina] = useState(Math.max(1, paginaInicial || 1));
  const [numPaginas, setNumPaginas] = useState(0);
  const [escala, setEscala] = useState(1.6);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [candidatos, setCandidatos] = useState<Retangulo[]>([]);
  const [selecao, setSelecao] = useState<Retangulo | null>(null);
  const [fatorExibicao, setFatorExibicao] = useState(1); // display px / device px
  const [alvo, setAlvo] = useState<AlvoRecorte>(alvoInicial);

  const arrastando = useRef<{ x0: number; y0: number } | null>(null);

  const arquivoAtual = arquivos[indiceArquivo];

  const renderizar = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !arquivoAtual) return;
    setCarregando(true);
    setErro(null);
    try {
      const pdfjs = await carregarPdfjs();
      let doc = docsRef.current.get(arquivoAtual.nome);
      if (!doc) {
        // slice(0): getDocument pode "detach" o ArrayBuffer (transferido pro
        // worker) — passa uma cópia pra fonte original seguir reutilizável.
        doc = await pdfjs.getDocument({ data: arquivoAtual.data.slice(0) }).promise;
        docsRef.current.set(arquivoAtual.nome, doc);
      }
      setNumPaginas(doc.numPages);
      const pageNum = Math.min(Math.max(1, pagina), doc.numPages);
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: escala });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas 2d indisponível");
      renderTaskRef.current?.cancel();
      const task = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;

      const fatores = await detectarFiguras(pdfjs, canvas, page, viewport);
      setCandidatos(fatores);
      setSelecao(fatores[0] ?? null);
      const rect = canvas.getBoundingClientRect();
      setFatorExibicao(rect.width / canvas.width || 1);
    } catch (e) {
      if ((e as Error)?.name === "RenderingCancelledException") return;
      console.error("Erro ao renderizar PDF:", e);
      setErro("Não foi possível abrir/renderizar esse PDF.");
    } finally {
      setCarregando(false);
    }
  }, [arquivoAtual, pagina, escala]);

  useEffect(() => {
    renderizar();
  }, [renderizar]);

  // Mantém o fator de exibição em dia quando a janela redimensiona
  useEffect(() => {
    function aoRedimensionar() {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.width) return;
      const rect = canvas.getBoundingClientRect();
      setFatorExibicao(rect.width / canvas.width || 1);
    }
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  function coordDevice(e: React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const rx = canvas.width / rect.width;
    const ry = canvas.height / rect.height;
    return {
      x: Math.min(canvas.width, Math.max(0, (e.clientX - rect.left) * rx)),
      y: Math.min(canvas.height, Math.max(0, (e.clientY - rect.top) * ry)),
    };
  }

  function aoPointerDown(e: React.PointerEvent) {
    if (carregando) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = coordDevice(e);
    arrastando.current = { x0: p.x, y0: p.y };
    setSelecao({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function aoPointerMove(e: React.PointerEvent) {
    if (!arrastando.current) return;
    const p = coordDevice(e);
    const { x0, y0 } = arrastando.current;
    setSelecao({
      x: Math.min(x0, p.x),
      y: Math.min(y0, p.y),
      w: Math.abs(p.x - x0),
      h: Math.abs(p.y - y0),
    });
  }
  function aoPointerUp() {
    if (arrastando.current && selecao && (selecao.w < 8 || selecao.h < 8)) {
      // clique sem arrasto real — descarta seleção degenerada
      setSelecao(candidatos[0] ?? null);
    }
    arrastando.current = null;
  }

  async function confirmar() {
    const canvas = canvasRef.current;
    if (!canvas || !selecao || selecao.w < 8 || selecao.h < 8) return;
    const sx = Math.round(selecao.x);
    const sy = Math.round(selecao.y);
    const sw = Math.round(selecao.w);
    const sh = Math.round(selecao.h);
    const temp = document.createElement("canvas");
    temp.width = sw;
    temp.height = sh;
    const ctx = temp.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sw, sh);
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    const blob = await new Promise<Blob | null>((res) => temp.toBlob(res, "image/jpeg", 0.9));
    if (!blob) return;
    setEnviando(true);
    try {
      await onRecortar(alvo, blob);
    } finally {
      setEnviando(false);
    }
  }

  const semArquivos = arquivos.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm" role="dialog" aria-modal>
      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col p-3 sm:p-5">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Cabeçalho */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Crop size={16} strokeWidth={2} className="text-questly-green" />
            <h3 className="text-sm font-semibold tracking-tight">Recortar figura do PDF</h3>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-[11px] font-medium text-muted-foreground">Usar em:</label>
              <select
                value={alvo.tipo === "enunciado" ? "enunciado" : `alt:${alvo.letra}`}
                onChange={(e) => {
                  const v = e.target.value;
                  setAlvo(v === "enunciado" ? { tipo: "enunciado" } : { tipo: "alt", letra: v.slice(4) as Letra });
                }}
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium outline-none focus:border-questly-green"
              >
                <option value="enunciado">Enunciado</option>
                {LETRAS_ALTERNATIVA.map((l) => (
                  <option key={l} value={`alt:${l}`}>
                    Alternativa {l.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onFechar}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Barra de controles */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
            {arquivos.length > 1 || idxAchado === -1 ? (
              <select
                value={indiceArquivo}
                onChange={(e) => {
                  setIndiceArquivo(Number(e.target.value));
                  setPagina(1);
                }}
                className="max-w-[220px] truncate rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium outline-none focus:border-questly-green"
              >
                {arquivos.map((a, i) => (
                  <option key={a.nome} value={i}>
                    {a.nome}
                  </option>
                ))}
              </select>
            ) : (
              <span className="max-w-[220px] truncate text-xs font-medium text-muted-foreground">{arquivoAtual?.nome}</span>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="tnum min-w-[64px] text-center text-xs font-medium text-muted-foreground">
                {pagina} / {numPaginas || "…"}
              </span>
              <button
                type="button"
                disabled={numPaginas > 0 && pagina >= numPaginas}
                onClick={() => setPagina((p) => (numPaginas ? Math.min(numPaginas, p + 1) : p + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEscala((s) => Math.max(0.8, Math.round((s - 0.2) * 10) / 10))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
              >
                <Minus size={14} />
              </button>
              <span className="tnum w-10 text-center text-xs font-medium text-muted-foreground">{Math.round(escala * 100)}%</span>
              <button
                type="button"
                onClick={() => setEscala((s) => Math.min(3, Math.round((s + 0.2) * 10) / 10))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Área do PDF */}
          <div className="relative min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
            {semArquivos ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Nenhum PDF carregado. Feche, carregue os PDFs de origem na tela anterior e tente de novo.
              </div>
            ) : (
              <div className="relative mx-auto w-fit">
                <canvas ref={canvasRef} className="block h-auto max-w-full rounded-md shadow-sm" />
                {/* Camada de captura de arrasto + caixas */}
                <div
                  className="absolute inset-0 cursor-crosshair touch-none"
                  onPointerDown={aoPointerDown}
                  onPointerMove={aoPointerMove}
                  onPointerUp={aoPointerUp}
                >
                  {candidatos.map((c, i) => {
                    const selecionado =
                      selecao && Math.abs(c.x - selecao.x) < 2 && Math.abs(c.y - selecao.y) < 2 && Math.abs(c.w - selecao.w) < 2;
                    if (selecionado) return null;
                    return (
                      <div
                        key={i}
                        className="pointer-events-none absolute rounded-sm border-2 border-dashed border-questly-blue/70"
                        style={{
                          left: c.x * fatorExibicao,
                          top: c.y * fatorExibicao,
                          width: c.w * fatorExibicao,
                          height: c.h * fatorExibicao,
                        }}
                      />
                    );
                  })}
                  {selecao && (
                    <div
                      className="pointer-events-none absolute rounded-sm border-2 border-questly-green bg-questly-green/10"
                      style={{
                        left: selecao.x * fatorExibicao,
                        top: selecao.y * fatorExibicao,
                        width: selecao.w * fatorExibicao,
                        height: selecao.h * fatorExibicao,
                      }}
                    />
                  )}
                </div>
                {carregando && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/60">
                    <Loader2 size={22} className="animate-spin text-questly-green" />
                  </div>
                )}
              </div>
            )}
            {erro && (
              <div className="absolute inset-x-4 top-4 rounded-lg bg-questly-red-light px-3 py-2 text-xs font-medium text-questly-red-dark">
                {erro}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            {candidatos.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Sugestões:</span>
                {candidatos.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelecao(c)}
                    className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    #{i + 1}
                  </button>
                ))}
              </div>
            )}
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Arraste na página pra desenhar o recorte.
            </p>
            <button
              type="button"
              disabled={!selecao || selecao.w < 8 || selecao.h < 8 || enviando || carregando}
              onClick={confirmar}
              className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]"
            >
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <Crop size={15} strokeWidth={2} />}
              {enviando ? "Enviando..." : `Recortar → ${rotuloAlvo(alvo)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
