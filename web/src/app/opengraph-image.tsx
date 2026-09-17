import { ImageResponse } from "next/og";
import { CAMPANHA } from "@/lib/landing/campanha";
import { FaixaEspectro, LockupOg } from "@/components/og/marca-og";

// Card de preview do link (WhatsApp/Instagram/Twitter) — a divulgação da
// campanha começa por link colado em grupo de turma, então o preview É a
// primeira impressão da marca. Gerado no build/edge, sem asset externo:
// tudo aqui é forma e texto, nenhuma fonte ou imagem remota pra falhar.
// Sem prazo no texto: o card é colado em grupo e reencaminhado meses depois.
//
// COMPOSIÇÃO CENTRADA de propósito. A primeira versão era alinhada à esquerda
// e ficou ótima no cartão grande — mas o WhatsApp nem sempre mostra o cartão
// grande: quando cai no preview pequeno, ele recorta um QUADRADO do centro da
// imagem. Com o texto à esquerda, esse quadrado pegava o meio de uma frase e
// nenhuma marca. Centrado, o pior recorte possível ainda mostra o símbolo e o
// começo do título.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Expectrum — simulados e questões de provas antigas";

export default function OpengraphImage() {
  const titulo = CAMPANHA.ativa
    ? `${CAMPANHA.materiaLabel} na ${CAMPANHA.instituicao}?`
    : "Estude o que importa.";
  const subtitulo = CAMPANHA.ativa
    ? "As questões das provas anteriores, catalogadas tópico a tópico — com simulado cronometrado e resolução."
    : "Plano de estudos diário, simulados cronometrados e questões de provas antigas.";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 72px 140px",
          background: "linear-gradient(135deg, #06140f 0%, #0b241b 55%, #062d21 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* halo atrás do título: tira o chapado do gradiente e puxa o olho pro centro */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 260,
            width: 680,
            height: 680,
            borderRadius: 680,
            background:
              "radial-gradient(circle, rgba(18, 185, 129, 0.22) 0%, rgba(18, 185, 129, 0) 70%)",
          }}
        />
        <FaixaEspectro />

        <LockupOg size={54} nome={29} />

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          {titulo}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 27,
            lineHeight: 1.4,
            color: "#a7f3d0",
            maxWidth: 780,
            textAlign: "center",
          }}
        >
          {subtitulo}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32 }}>
          <div
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              background: "#12b981",
              color: "#06140f",
              fontSize: 23,
              fontWeight: 700,
            }}
          >
            Comece grátis
          </div>
          <div style={{ display: "flex", fontSize: 21, color: "#8fbfae" }}>
            sem cartão de crédito
          </div>
        </div>
      </div>
    ),
    size,
  );
}
