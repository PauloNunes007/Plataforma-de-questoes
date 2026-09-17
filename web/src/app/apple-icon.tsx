import { ImageResponse } from "next/og";
import { MarcaOg } from "@/components/og/marca-og";

// Ícone de tela inicial no iOS. O `icon.svg` não serve aqui: o Safari não usa
// SVG pra apple-touch-icon e, sem este arquivo, quem adiciona a Expectrum à
// tela inicial (o `appleWebApp` do layout convida a isso) fica com um
// screenshot borrado da página no lugar da marca.
//
// O iOS já aplica o próprio arredondamento por cima, então o squircle interno
// da MarcaOg é desenhado em tamanho cheio e a máscara do sistema cuida do
// resto — por isso não há padding em volta.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MarcaOg size={180} raio={0} />
      </div>
    ),
    size,
  );
}
