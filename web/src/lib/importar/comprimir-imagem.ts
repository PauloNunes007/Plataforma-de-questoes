// Portado de comprimirImagem() em js/importar.js — redimensiona pro
// maior lado caber em 1280px e comprime pra JPEG. Enunciados/alternativas
// viram gráficos/prints, não precisam de mais resolução que isso.
export function comprimirImagem(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1280;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w >= h) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        } else {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas 2d context indisponível"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("canvas.toBlob falhou"));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("imagem inválida"));
    };
    img.src = URL.createObjectURL(file);
  });
}
