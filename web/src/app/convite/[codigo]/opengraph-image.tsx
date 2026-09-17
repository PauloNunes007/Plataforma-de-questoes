import { ImageResponse } from "next/og";
import { EspectroFundo, LockupOg } from "@/components/og/marca-og";

// Card de preview do LINK DE CONVITE. Esse link nasce pra ser colado numa
// conversa de WhatsApp, então o card é a primeira impressão — mais ainda que
// na landing, porque aqui a pessoa recebeu de um conhecido e decide em dois
// segundos se toca.
//
// Não consulta o banco de propósito: nada de número de dias ou de vagas aqui.
// Um card é gerado uma vez e reencaminhado depois — prometer "7 dias" numa
// imagem que sobrevive ao cupom seria mentir com atraso. O número exato (e
// vivo) aparece na própria página, lido do cupom.
//
// Mesma marca e mesma composição da landing; o que muda é o âmbar — o convite
// é o único lugar onde a plataforma fala em tom de exceção, e a cor precisa
// dizer isso antes do texto.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Convite pra testar a Expectrum";

export default function ConviteOpengraphImage() {
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
          background: "linear-gradient(135deg, #06140f 0%, #0b241b 55%, #1a1408 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            left: -160,
            width: 760,
            height: 760,
            borderRadius: 760,
            background:
              "radial-gradient(circle, rgba(18, 185, 129, 0.18) 0%, rgba(18, 185, 129, 0) 70%)",
          }}
        />
        <EspectroFundo cor="245, 196, 84" />

        <LockupOg size={56} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(245, 196, 84, 0.16)",
              color: "#f5c454",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            CONVITE DE TESTADOR
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 720,
            }}
          >
            Você foi convidado pra testar a Expectrum.
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 28,
              lineHeight: 1.4,
              color: "#a7f3d0",
              maxWidth: 760,
            }}
          >
            Plano Pro liberado na hora: simulados cronometrados com questões de provas anteriores,
            projeção da sua nota e plano de estudos por dia.
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
            Abrir meu convite
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#8fbfae" }}>
            sem cartão de crédito
          </div>
        </div>
      </div>
    ),
    size,
  );
}
