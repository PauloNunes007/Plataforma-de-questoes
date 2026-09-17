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
export function LockupOg({ size = 56, nome = 30 }: { size?: number; nome?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <MarcaOg size={size} />
      <div style={{ display: "flex", fontSize: nome, fontWeight: 600, letterSpacing: -0.5 }}>
        Expectrum
      </div>
    </div>
  );
}

/**
 * O espectro como faixa rente à borda de baixo — um equalizador da largura
 * inteira do cartão.
 *
 * Nasceu de uma versão anterior que empilhava quatro barras gigantes no canto
 * inferior DIREITO. Ficava bonita no cartão inteiro e péssima no WhatsApp: lá
 * o preview às vezes vira um quadradinho recortado do CENTRO da imagem, e o
 * centro não tinha nem marca nem frase legível — só o meio de uma palavra. A
 * faixa é simétrica e mora fora da área de texto, então qualquer recorte
 * (quadrado, 1.91:1, 4:1) continua mostrando o motivo da marca sem comer
 * conteúdo.
 */
export function FaixaEspectro({ cor = "18, 185, 129" }: { cor?: string }) {
  // A curva SOBE da esquerda pra direita, e sobe acelerando — é a mesma curva
  // das quatro barras do símbolo, esticada na largura do cartão. Uma primeira
  // versão usava uma onda senoidal: ficava simétrica e discreta, mas lia como
  // equalizador de áudio, que não é a promessa da marca.
  const TOTAL = 30;
  const barras = Array.from({ length: TOTAL }, (_, i) => {
    const t = i / (TOTAL - 1);
    const subida = Math.pow(t, 1.7);
    return { altura: Math.round(16 + subida * 96), opacidade: 0.05 + subida * 0.14 };
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "flex-end",
        paddingLeft: 20,
        gap: 20,
      }}
    >
      {barras.map((barra, i) => (
        <div
          key={i}
          style={{
            width: 20,
            height: barra.altura,
            borderRadius: "10px 10px 0 0",
            backgroundColor: `rgba(${cor}, ${barra.opacidade})`,
          }}
        />
      ))}
    </div>
  );
}
