#!/usr/bin/env python3
"""
Detecção + recorte de figuras em página de PDF (provas UFF Física I).

Porta o mesmo heurístico de `web/src/components/importar/pdf-recortador.tsx`
(`detectarFiguras`): renderiza a página, subtrai as caixas de texto (via
`get_text("words")`) da "tinta" da página (pixel não-branco), agrupa o que
sobra em componentes conexos e devolve as caixas candidatas — funciona tanto
pra figura rasterizada quanto pra desenho vetorial, porque opera nos pixels
já renderizados.

Uso:
  python pdf_figuras.py render <pdf> <pagina 1-based> <outdir> [--dpi 220]
    -> escreve <outdir>/clean.png, <outdir>/annotated.png, <outdir>/boxes.json

  python pdf_figuras.py crop <clean.png> <x> <y> <w> <h> <saida.png>
    -> recorta o retângulo (em pixels da imagem clean.png) e salva

  python pdf_figuras.py compor <saida.png> <img1> <img2> [...]
    -> compõe N imagens numa grade 2xN/2 (pra questão com várias figuras,
       ex. gráficos W/X/Y/Z pra comparar)
"""
import sys
import json
from pathlib import Path

import fitz  # PyMuPDF
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def detectar_caixas(page, pix, zoom):
    W, H = pix.width, pix.height
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(H, W, pix.n)
    rgb = arr[:, :, :3]

    CELL = 8
    cols = (W + CELL - 1) // CELL
    rows = (H + CELL - 1) // CELL

    # máscara de tinta: qualquer pixel não-branco (limiar 235) dentro da célula
    padH = rows * CELL - H
    padW = cols * CELL - W
    rgb_pad = np.pad(rgb, ((0, padH), (0, padW), (0, 0)), constant_values=255)
    escuro = np.any(rgb_pad < 235, axis=2)  # H'xW' bool
    blocos = escuro.reshape(rows, CELL, cols, CELL)
    tem_tinta = blocos.any(axis=(1, 3))  # rows x cols

    # máscara de texto (a partir das palavras do layer de texto do PDF)
    eh_texto = np.zeros((rows, cols), dtype=bool)
    try:
        palavras = page.get_text("words")  # x0,y0,x1,y1,word,...
        pad_pt = 2 / zoom
        for x0, y0, x1, y1, *_ in palavras:
            cx0 = max(0, int(((x0 - pad_pt) * zoom) // CELL))
            cx1 = min(cols - 1, int(((x1 + pad_pt) * zoom) // CELL))
            cy0 = max(0, int(((y0 - pad_pt) * zoom) // CELL))
            cy1 = min(rows - 1, int(((y1 + pad_pt) * zoom) // CELL))
            eh_texto[cy0 : cy1 + 1, cx0 : cx1 + 1] = True
    except Exception:
        pass

    cand = tem_tinta & ~eh_texto
    estrutura = np.ones((3, 3), dtype=int)
    rotulado, n = ndimage.label(cand, structure=estrutura)

    area_min = W * H * 0.004
    caixas = []
    for i in range(1, n + 1):
        ys, xs = np.where(rotulado == i)
        tamanho = len(xs)
        if tamanho < 15:
            continue
        min_cx, max_cx = xs.min(), xs.max()
        min_cy, max_cy = ys.min(), ys.max()
        px = int(min_cx * CELL)
        py = int(min_cy * CELL)
        pw = int((max_cx - min_cx + 1) * CELL)
        ph = int((max_cy - min_cy + 1) * CELL)
        if pw * ph < area_min or pw < 45 or ph < 34:
            continue
        caixas.append([px, py, pw, ph])

    caixas = mesclar_caixas(caixas, folga=20)
    caixas.sort(key=lambda c: c[2] * c[3], reverse=True)
    return caixas[:10]


def mesclar_caixas(caixas, folga):
    out = [list(c) for c in caixas]
    mudou = True
    while mudou:
        mudou = False
        for i in range(len(out)):
            for j in range(i + 1, len(out)):
                a, b = out[i], out[j]
                sobrepoe = (
                    a[0] - folga < b[0] + b[2]
                    and b[0] - folga < a[0] + a[2]
                    and a[1] - folga < b[1] + b[3]
                    and b[1] - folga < a[1] + a[3]
                )
                if sobrepoe:
                    x0 = min(a[0], b[0])
                    y0 = min(a[1], b[1])
                    x1 = max(a[0] + a[2], b[0] + b[2])
                    y1 = max(a[1] + a[3], b[1] + b[3])
                    out[i] = [x0, y0, x1 - x0, y1 - y0]
                    del out[j]
                    mudou = True
                    break
            if mudou:
                break
    return out


def cmd_render(args):
    pdf_path, pagina, outdir = args[0], int(args[1]), Path(args[2])
    dpi = 220
    if "--dpi" in args:
        dpi = int(args[args.index("--dpi") + 1])
    outdir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    if pagina < 1 or pagina > doc.page_count:
        print(json.dumps({"erro": f"pagina {pagina} fora do intervalo (1-{doc.page_count})"}))
        return
    page = doc[pagina - 1]
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    clean_path = outdir / "clean.png"
    pix.save(str(clean_path))

    caixas = detectar_caixas(page, pix, zoom)

    img = Image.open(clean_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    for idx, (x, y, w, h) in enumerate(caixas):
        draw.rectangle([x, y, x + w, y + h], outline=(30, 144, 255), width=4)
        draw.rectangle([x, y, x + 46, y + 28], fill=(30, 144, 255))
        draw.text((x + 8, y + 6), f"#{idx}", fill=(255, 255, 255))
    ann_path = outdir / "annotated.png"
    img.save(ann_path)

    boxes_path = outdir / "boxes.json"
    boxes_path.write_text(
        json.dumps(
            {
                "pdf": pdf_path,
                "pagina": pagina,
                "dpi": dpi,
                "num_paginas": doc.page_count,
                "largura": pix.width,
                "altura": pix.height,
                "caixas": [{"index": i, "x": c[0], "y": c[1], "w": c[2], "h": c[3]} for i, c in enumerate(caixas)],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps({"ok": True, "clean": str(clean_path), "annotated": str(ann_path), "boxes": str(boxes_path), "num_paginas": doc.page_count}))


def cmd_crop(args):
    clean_path, x, y, w, h, saida = args[0], int(args[1]), int(args[2]), int(args[3]), int(args[4]), args[5]
    img = Image.open(clean_path).convert("RGB")
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(img.width, x + w), min(img.height, y + h)
    recorte = img.crop((x0, y0, x1, y1))
    Path(saida).parent.mkdir(parents=True, exist_ok=True)
    recorte.save(saida, quality=92)
    print(json.dumps({"ok": True, "saida": saida, "w": recorte.width, "h": recorte.height}))


def cmd_compor(args):
    saida = args[0]
    imgs = [Image.open(p).convert("RGB") for p in args[1:]]
    n = len(imgs)
    cols = 2 if n > 1 else 1
    rows = (n + cols - 1) // cols
    w = max(i.width for i in imgs)
    h = max(i.height for i in imgs)
    grade = Image.new("RGB", (w * cols, h * rows), "white")
    for k, im in enumerate(imgs):
        grade.paste(im, ((k % cols) * w, (k // cols) * h))
    Path(saida).parent.mkdir(parents=True, exist_ok=True)
    grade.save(saida, quality=92)
    print(json.dumps({"ok": True, "saida": saida, "w": grade.width, "h": grade.height}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    rest = sys.argv[2:]
    if cmd == "render":
        cmd_render(rest)
    elif cmd == "crop":
        cmd_crop(rest)
    elif cmd == "compor":
        cmd_compor(rest)
    else:
        print(__doc__)
        sys.exit(1)
