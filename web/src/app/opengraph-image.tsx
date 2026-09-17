import { ImageResponse } from "next/og";
import { CAMPANHA } from "@/lib/landing/campanha";
import { EspectroFundo, LockupOg } from "@/components/og/marca-og";

// Card de preview do link (WhatsApp/Instagram/Twitter) — a divulgação da
// campanha começa por link colado em grupo de turma, então o preview É a
// primeira impressão da marca. Gerado no build/edge, sem asset externo:
// tudo aqui é forma e texto, nenhuma fonte ou imagem remota pra falhar.
// Sem prazo no texto: o card é colado em grupo e reencaminhado meses depois.
//
// O espectro da marca aparece duas vezes de propósito: pequeno no lockup e
// gigante sangrando pela borda. Num feed de WhatsApp o card é visto a 300px
// de largura — a forma grande é o que sobrevive nesse tamanho, o nome não.
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
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #06140f 0%, #0b241b 55%, #062d21 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* halo frio no canto superior esquerdo: tira o chapado do gradiente */}
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -160,
            width: 760,
            height: 760,
            borderRadius: 760,
            background:
              "radial-gradient(circle, rgba(18, 185, 129, 0.20) 0%, rgba(18, 185, 129, 0) 70%)",
          }}
        />
        <EspectroFundo />

        <LockupOg size={56} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 720,
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
              maxWidth: 760,
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
            expectrum · sem cartão de crédito
          </div>
        </div>
      </div>
    ),
    size,
  );
}
