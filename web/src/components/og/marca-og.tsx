// A marca da Expectrum desenhada para o `next/og` (satori), onde não existe
// SVG nem CSS do app: só flexbox e cores literais. Por isso as mesmas quatro
// barras de `components/logo.tsx` são reconstruídas aqui com divs — a geometria
// é a mesma do viewBox 0 0 32 32, multiplicada pela escala pedida, então mudar
// a marca lá é mudar as constantes aqui também.
//
// Fica num arquivo só porque os cartões de link (landing e convite) precisam
// ser idênticos: um link de convite reencaminhado e a landing têm que parecer
// o mesmo produto.

/** Barras do espectro no sistema de coordenadas de 32×32 (x, topo, altura, opacidade). */
const BARRAS = [
  { x: 6.35, y: 19.6, altura: 4.8, opacidade: 0.5 },
  { x: 11.65, y: 16.6, altura: 7.8, opacidade: 0.68 },
  { x: 16.95, y: 12.4, altura: 12, opacidade: 0.84 },
  { x: 22.25, y: 7.6, altura: 16.8, opacidade: 1 },
] as const;

const LARGURA_BARRA = 3.4;
const VAO = 1.9; // espaço entre barras (centros a 5.3 de distância)
const BASE = 24.4; // linha de base das barras
const MARGEM_ESQ = 6.35;

/**
 * O símbolo em caixa (squircle + barras brancas), do tamanho pedido em px.
 * `raio` só existe pro ícone de tela inicial do iOS, que aplica a própria
 * máscara por cima: lá a caixa sangra até a borda (raio 0) e quem arredonda
 * é o sistema, senão sobram cantos escuros em volta do squircle.
 */
export function MarcaOg({ size = 56, raio }: { size?: number; raio?: number }) {
  const e = size / 32;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: raio ?? 9 * e,
        background: "linear-gradient(135deg, #12b981, #055f38)",
        display: "flex",
        alignItems: "flex-end",
        paddingLeft: MARGEM_ESQ * e,
        paddingBottom: (32 - BASE) * e,
        gap: VAO * e,
      }}
    >
      {BARRAS.map((barra) => (
        <div
          key={barra.x}
          style={{
            width: LARGURA_BARRA * e,
            height: barra.altura * e,
            borderRadius: (LARGURA_BARRA / 2) * e,
            backgroundColor: `rgba(255, 255, 255, ${barra.opacidade})`,
          }}
        />
      ))}
    </div>
  );
}

/** Lockup completo: símbolo + nome, como aparece no topo dos cartões. */
export function LockupOg({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <MarcaOg size={size} />
      <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>
        Expectrum
      </div>
    </div>
  );
}

/**
 * O espectro em escala de cartaz, sangrando pela borda inferior direita: é o
 * que faz o preview ser reconhecível como Expectrum antes de qualquer palavra
 * ser lida. Fica atrás do texto (posição absoluta), com opacidade baixa o
 * bastante pra não disputar contrato com o título.
 */
export function EspectroFundo({ cor = "18, 185, 129" }: { cor?: string }) {
  const alturas = [176, 268, 392, 540];
  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        bottom: -96,
        display: "flex",
        alignItems: "flex-end",
        gap: 26,
      }}
    >
      {alturas.map((altura, i) => (
        <div
          key={altura}
          style={{
            width: 54,
            height: altura,
            borderRadius: 27,
            background: `linear-gradient(180deg, rgba(${cor}, ${0.1 + i * 0.055}) 0%, rgba(${cor}, 0.02) 100%)`,
          }}
        />
      ))}
    </div>
  );
}
