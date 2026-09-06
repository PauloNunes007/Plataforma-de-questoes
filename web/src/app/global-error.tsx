"use client";

// Última rede de segurança: pega erro que estoura no próprio root layout (onde
// a fronteira de error.tsx ainda não existe). Precisa renderizar <html>/<body>
// por conta própria e não pode depender de nada do app — por isso o estilo é
// inline, sem Tailwind e sem componentes.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#0b0f14",
          color: "#e8eef2",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Questly</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
            A página não conseguiu carregar
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#9fb0bb", margin: "0 0 20px" }}>
            Tente recarregar. Seu progresso está salvo.
          </p>
          <button
            onClick={reset}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 15,
              fontWeight: 600,
              background: "#12b981",
              color: "#06140f",
            }}
          >
            Tentar de novo
          </button>
          {error.digest && (
            <p style={{ marginTop: 18, fontSize: 11, color: "#6d7f8a", fontFamily: "monospace" }}>
              código: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
