import { ImageResponse } from "next/og";
import { CAMPANHA } from "@/lib/landing/campanha";

// Card de preview do link (WhatsApp/Instagram/Twitter) — a divulgação da
// campanha começa por link colado em grupo de turma, então o preview É a
// primeira impressão da marca. Gerado no build/edge, sem asset externo:
// tudo aqui é forma e texto, nenhuma fonte ou imagem remota pra falhar.
// Sem prazo no texto: o card é colado em grupo e reencaminhado meses depois.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Questly — simulados e questões de provas antigas";

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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #06140f 0%, #0b241b 55%, #062d21 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #12b981, #085e43)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>Questly</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            {titulo}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#a7f3d0",
              maxWidth: 900,
            }}
          >
            {subtitulo}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              padding: "12px 22px",
              borderRadius: 999,
              background: "#12b981",
              color: "#06140f",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Comece grátis
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#8fbfae" }}>
            questly · sem cartão de crédito
          </div>
        </div>
      </div>
    ),
    size,
  );
}
