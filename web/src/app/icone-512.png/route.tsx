import { ImageResponse } from "next/og";
import { MarcaOg } from "@/components/og/marca-og";

// Ícone PNG do manifest (app/manifest.ts), versão grande.
//
// O `icon.svg` do favicon não serve aqui: o Android exige PNG pro ícone da
// tela inicial, e um manifest que aponta só pra SVG resulta numa instalação
// com o ícone genérico do navegador. Gerado por ImageResponse em vez de um
// arquivo binário em public/ pra marca continuar existindo num lugar só
// (components/og/marca-og.tsx) — mexer nela atualiza favicon, OG, ícone do
// iOS e este ao mesmo tempo.
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#055f38",
        }}
      >
        <MarcaOg size={512} raio={0} />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
