// Portado de redimensionarAvatar() em js/configuracoes.js — corta o
// centro quadrado e reduz pra 256x256 JPEG no navegador antes de subir
// (~30 KB), pra render bem no 1 GB grátis do Supabase Storage.
export function redimensionarAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const TAM = 256;
      const canvas = document.createElement("canvas");
      canvas.width = TAM;
      canvas.height = TAM;
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2;
      const sy = (img.height - lado) / 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas 2d context indisponível"));
        return;
      }
      ctx.drawImage(img, sx, sy, lado, lado, 0, 0, TAM, TAM);
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
