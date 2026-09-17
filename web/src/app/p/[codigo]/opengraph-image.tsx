import { ImageResponse } from "next/og";
import { FaixaEspectro, LockupOg } from "@/components/og/marca-og";

// Card de preview do LINK DE PARCEIRO. É o que aparece quando alguém cola o
// link num story, num grupo ou na bio — ou seja, é a peça de divulgação que o
// parceiro NÃO desenha, e que precisa parecer digna do perfil dele.
//
// Não consulta o banco, pela mesma razão do card do convite: um preview é
// gerado uma vez e reencaminhado depois. Prometer "15 dias" numa imagem que
// sobrevive a uma mudança no cadastro do parceiro seria mentir com atraso — o
// número exato, e vivo, está na própria página.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Expectrum Pro liberado por indicação";

export default function LinkParceiroOpengraphImage() {
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
          padding: "56px 72px 140px",
          background: "linear-gradient(135deg, #06140f 0%, #0b241b 55%, #1a1408 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 260,
            width: 680,
            height: 680,
            borderRadius: 680,
            background:
              "radial-gradient(circle, rgba(245, 196, 84, 0.16) 0%, rgba(245, 196, 84, 0) 70%)",
          }}
        />
        <FaixaEspectro cor="245, 196, 84" />

        <LockupOg size={50} nome={27} />

        <div
          style={{
            display: "flex",
            marginTop: 20,
            padding: "7px 18px",
            borderRadius: 999,
            background: "rgba(245, 196, 84, 0.16)",
            color: "#f5c454",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          INDICAÇÃO
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          Expectrum Pro liberado pelo link de quem te indicou.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 26,
            lineHeight: 1.4,
            color: "#a7f3d0",
            maxWidth: 820,
            textAlign: "center",
          }}
        >
          Questões de provas anteriores com resolução, simulados cronometrados e controle de faltas
          e notas do seu semestre.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26 }}>
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
            Criar minha conta
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
