// Recalcula numericamente, de forma independente do texto da resolução, a
// resposta de cada uma das 89 questões de `calculo1_lote4.json`, e confere:
//   1) que a alternativa marcada como gabarito é exatamente o LaTeX esperado
//      (fecha o elo entre "a conta que eu confiro" e "a letra que o aluno vê");
//   2) que o valor daquela alternativa bate com o recálculo numérico.
//
// É a única rede que pega gabarito errado: um erro de conta passa limpo pelo
// validar.mjs e pelo render-katex.mjs.
//
// Uso: node listas_questoes/gerado/scripts/conferir-gabaritos-calculo1-lote4.mjs
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const itens = JSON.parse(readFileSync(resolve(aqui, "..", "calculo1_lote4.json"), "utf8"));
const porSubtopico = new Map(itens.map((q) => [q.subtopico, q]));

const falhas = [];
let checados = 0;

// ---- utilitários numéricos -------------------------------------------------
const d1 = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const d2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
const d4 = (f, x, h = 0.02) =>
  (f(x - 2 * h) - 4 * f(x - h) + 6 * f(x) - 4 * f(x + h) + f(x + 2 * h)) / h ** 4;

function simpson(f, a, b, n = 20000) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

// Integra de `sing` (onde f explode, de forma integrável) até `fim`, com blocos
// diádicos encolhendo rumo a `sing` em vez de passo uniforme — Simpson uniforme
// não enxerga a cauda. O número de blocos tem teto: quando a largura do bloco
// fica abaixo do epsilon relativo de `sing`, o extremo colapsa em cima da
// singularidade e a avaliação vira NaN.
function simpsonSingular(f, sing, fim, blocos = 80, n = 2000) {
  let total = 0;
  let dir = fim;
  for (let k = 0; k < blocos; k++) {
    const esq = sing + (dir - sing) / 2;
    if (esq === sing || esq === dir) break;
    total += simpson(f, esq, dir, n);
    dir = esq;
  }
  return total;
}

// Intervalo infinito [a, +inf) com a > 0: blocos [a*2^k, a*2^(k+1)].
function simpsonInfinito(f, a, blocos = 70, n = 2000) {
  let total = 0;
  let x = a;
  for (let k = 0; k < blocos; k++) {
    total += simpson(f, x, 2 * x, n);
    x *= 2;
  }
  return total;
}

// Conta raízes reais de f varrendo |f| abaixo de um limiar e agrupando — troca
// de sinal sozinha erra em raiz dupla (a curva tangencia sem trocar de sinal).
function contarRaizes(f, a, b, passos = 400000) {
  const h = (b - a) / passos;
  const raizes = [];
  let ant = f(a);
  for (let i = 1; i <= passos; i++) {
    const x = a + i * h;
    const v = f(x);
    if (ant === 0 || (ant < 0) !== (v < 0)) {
      const r = bissecao(f, x - h, x);
      if (!raizes.some((p) => Math.abs(p - r) < 1e-6)) raizes.push(r);
    }
    ant = v;
  }
  return raizes.length;
}

function bissecao(f, a, b) {
  let fa = f(a);
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if ((fa < 0) !== (fm < 0)) b = m;
    else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

// Máximo/mínimo por varredura fina seguida de refino por seção áurea local.
function extremo(f, a, b, sinal = 1, passos = 200000) {
  let melhorX = a;
  let melhor = sinal * f(a);
  for (let i = 1; i <= passos; i++) {
    const x = a + ((b - a) * i) / passos;
    const v = sinal * f(x);
    if (v > melhor) {
      melhor = v;
      melhorX = x;
    }
  }
  const d = (b - a) / passos;
  let lo = Math.max(a, melhorX - d);
  let hi = Math.min(b, melhorX + d);
  for (let i = 0; i < 200; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (sinal * f(m1) < sinal * f(m2)) lo = m1;
    else hi = m2;
  }
  const x = (lo + hi) / 2;
  return { x, y: f(x) };
}

const perto = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// ---- a checagem em si ------------------------------------------------------
// ok(subtopico, latexEsperadoDaCorreta, valorQueEuAfirmo, valorRecalculado)
function ok(subtopico, latexCorreta, esperado, calculado, tol = 1e-4) {
  checados++;
  const item = porSubtopico.get(subtopico);
  if (!item) {
    falhas.push(`"${subtopico}": subtópico não encontrado no JSON`);
    return;
  }
  const texto = item.alternativas[item.gabarito];
  if (texto !== latexCorreta) {
    falhas.push(`"${subtopico}": alternativa ${item.gabarito.toUpperCase()} é ${texto} — esperava ${latexCorreta}`);
    return;
  }
  if (!perto(esperado, calculado, tol)) {
    falhas.push(`"${subtopico}": gabarito ${esperado} vs recálculo ${calculado}`);
  }
}

const E = Math.E;
const PI = Math.PI;
const cbrt = Math.cbrt;

// 1. LIMITES -----------------------------------------------------------------
ok("Limite com raízes de índices diferentes", String.raw`$-\dfrac{1}{6}$`, -1 / 6,
  ((x) => (cbrt(8 + x) - Math.sqrt(4 + x)) / x)(1e-4), 1e-3);

ok("Limite no infinito com radical e mudança de sinal", String.raw`$-\dfrac{5}{2}$`, -5 / 2,
  ((x) => x + Math.sqrt(x * x + 5 * x))(-1e9), 1e-6);

ok("Limite trigonométrico de terceira ordem", String.raw`$\dfrac{1}{2}$`, 1 / 2,
  ((x) => (Math.tan(x) - Math.sin(x)) / x ** 3)(1e-3), 1e-5);

ok("Limite de potência com base e expoente variáveis", String.raw`$e^{-1/2}$`, Math.exp(-0.5),
  ((x) => Math.cos(x) ** (1 / x ** 2))(1e-3), 1e-6);

// 2. CONTINUIDADE ------------------------------------------------------------
// a = limite pela direita; b = mesmo valor; pede-se a+b = 2*limite.
ok("Dois parâmetros em função definida por partes", String.raw`$\dfrac{1}{2}$`, 1 / 2,
  2 * ((x) => (Math.sqrt(x + 4) - 2) / x)(1e-7), 1e-5);

ok("Teorema do Valor Intermediário e contagem de raízes", String.raw`$3$`, 3,
  contarRaizes((x) => 3 * x ** 5 - 5 * x ** 3 + 1, -5, 5), 1e-9);

ok("Salto num ponto de descontinuidade", String.raw`$-2$`, -2,
  ((f) => f(2 + 1e-7) - f(2 - 1e-7))((x) => (x * x - 5 * x + 6) / Math.abs(x - 2)), 1e-5);

// k>0 tal que lim (1-cos kx)/(x sen 3x) = 6, achado por bisseção em k.
ok("Parâmetro em limite trigonométrico", String.raw`$6$`, 6,
  bissecao((k) => ((x) => (1 - Math.cos(k * x)) / (x * Math.sin(3 * x)))(1e-3) - 6, 0.1, 20), 1e-5);

ok("Prolongamento contínuo com dois infinitésimos", String.raw`$\dfrac{1}{3}$`, 1 / 3,
  ((x) => (Math.sqrt(x * x + 9) - 3) / (1 - Math.cos(x)))(1e-3), 1e-4);

// 3. A DERIVADA --------------------------------------------------------------
ok("Derivabilidade de função definida por partes", String.raw`$-2$`, -2,
  ((a) => a * (1 - 2 - a))(d1((x) => x ** 3 - 2 * x, 1)), 1e-6);

ok("Tangentes paralelas a uma reta dada", String.raw`$2$`, 2,
  ((f) => {
    const rs = [];
    for (let x = -10; x < 10; x += 1e-4) {
      const g = (t) => d1((u) => f(u), t) - 9;
      if (g(x) * g(x + 1e-4) < 0) rs.push(bissecao(g, x, x + 1e-4));
    }
    return rs.reduce((s, v) => s + v, 0);
  })((x) => x ** 3 - 3 * x * x + 2), 1e-4);

// f qualquer com f(0)=0, f'(0)=3 — tomo f(t)=3 sen t.
ok("Derivada pela definição em argumentos compostos", String.raw`$9$`, 9,
  ((x) => (3 * Math.sin(5 * x) - 3 * Math.sin(2 * x)) / x)(1e-5), 1e-6);

// f com f(2)=4, f'(2)=-1 — tomo f(x)=4-(x-2). Coeficiente linear = g(2)-2g'(2).
ok("Reta tangente ao gráfico de um quociente", String.raw`$\dfrac{7}{2}$`, 7 / 2,
  ((g) => g(2) - 2 * d1(g, 2))((x) => (4 - (x - 2)) / (x * x)), 1e-6);

ok("Derivada de função com módulo", String.raw`$4$`, 4,
  ((f) => d1(f, 3) + d1(f, 1))((x) => Math.abs(x * x - 4)), 1e-6);

// 4. CÁLCULO DAS DERIVADAS ---------------------------------------------------
ok("Derivação logarítmica", String.raw`$1$`, 1,
  d1((x) => x ** Math.sin(x), PI / 2), 1e-6);

ok("Derivada segunda por derivação implícita", String.raw`$-\dfrac{25}{64}$`, -25 / 64,
  d2((x) => Math.sqrt(25 - x * x), 3), 1e-5);

ok("Regra da cadeia em quociente elevado a potência", String.raw`$10$`, 10,
  d1((x) => ((1 + x) / (1 - x)) ** 5, 0), 1e-7);

ok("Derivada de ordem superior de função racional", String.raw`$384$`, 384,
  d4((x) => 1 / (1 - 2 * x), 0), 2e-2);

ok("Potência com expoente racional", String.raw`$\dfrac{7}{3}$`, 7 / 3,
  d1((x) => cbrt(x) * (x - 4), 8), 1e-7);

// Implícita: dy/dx = -F_x/F_y em (1,1), com F(x,y)=x e^y + y e^x - 2e.
ok("Derivação implícita com exponenciais", String.raw`$-1$`, -1,
  ((F) => -d1((x) => F(x, 1), 1) / d1((y) => F(1, y), 1))((x, y) => x * Math.exp(y) + y * Math.exp(x) - 2 * E), 1e-6);

// Série: x^2 e^x = soma x^(n+2)/n!, logo f^(10)(0) = 10!/8!.
ok("Derivada de ordem n de um produto", String.raw`$90$`, 90,
  ((fat) => fat(10) / fat(8))((n) => { let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; }), 1e-9);

// 5. APLICAÇÕES DA DERIVADA --------------------------------------------------
ok("Teorema do Valor Médio", String.raw`$\dfrac{2\sqrt{3}}{3}$`, (2 * Math.sqrt(3)) / 3,
  bissecao((c) => d1((x) => x ** 3 - x, c) - (((2 ** 3 - 2) - 0) / 2), 0.1, 1.9), 1e-5);

// V(h)=pi h^3/12; dh/dt = (dV/dt)/(dV/dh).
ok("Taxas relacionadas em tanque cônico", String.raw`$-\dfrac{2}{\pi}$ m/min`, -2 / PI,
  -2 / d1((h) => (PI * h ** 3) / 12, 2), 1e-6);

ok("Taxas relacionadas com semelhança de triângulos", String.raw`$\dfrac{4}{9}$ m/s`, 4 / 9,
  -d1((x) => 40 / x, 12) * 1.6, 1e-6);

ok("Máximo absoluto em intervalo fechado", String.raw`$2$`, 2,
  extremo((x) => x * Math.sqrt(4 - x * x), -2, 2, 1).y, 1e-6);

ok("Limite exponencial por L'Hospital", String.raw`$e^{9}$`, Math.exp(9),
  Math.exp(3 * 1e8 * Math.log1p(3 / (1e8 - 1))), 1e-6);

// Inflexões = trocas de sinal de f''.
ok("Pontos de inflexão de função racional", String.raw`$3$`, 3,
  contarRaizes((x) => d2((t) => t / (t * t + 3), x, 1e-3), -20, 20, 40000), 1e-9);

ok("Distância entre os extremos locais", String.raw`$2\sqrt{5}$`, 2 * Math.sqrt(5),
  ((f) => {
    const max = extremo(f, -3, 0.9999, 1); // máximo local à esquerda da assíntota
    const min = extremo(f, 1.0001, 5, -1);
    return Math.hypot(max.x - min.x, max.y - min.y);
  })((x) => (x * x) / (x - 1)), 1e-5);

ok("Extremos absolutos de função trigonométrica", String.raw`$2\pi$`, 2 * PI,
  ((f) => extremo(f, 0, 2 * PI, 1).y + extremo(f, 0, 2 * PI, -1).y)((x) => x - 2 * Math.sin(x)), 1e-6);

// 6. INTEGRAL DEFINIDA -------------------------------------------------------
ok("Soma de Riemann que produz arco-tangente", String.raw`$\dfrac{\pi}{4}$`, PI / 4,
  ((n) => { let s = 0; for (let i = 1; i <= n; i++) s += n / (n * n + i * i); return s; })(4e6), 1e-6);

ok("Soma de potências reconhecida como integral", String.raw`$\dfrac{1}{5}$`, 1 / 5,
  ((n) => { let s = 0; for (let i = 1; i <= n; i++) s += (i / n) ** 4 / n; return s; })(4e6), 1e-6);

ok("Simetria do intervalo de integração", String.raw`$\dfrac{3}{2}$`, 3 / 2,
  simpson((x) => Math.sqrt(x) / (Math.sqrt(x) + Math.sqrt(3 - x)), 0, 3, 400000), 1e-4);

ok("Integral de função modular", String.raw`$\dfrac{8}{3}$`, 8 / 3,
  simpson((x) => Math.abs(x * x - 2 * x), 0, 2) + simpson((x) => Math.abs(x * x - 2 * x), 2, 3), 1e-8);

ok("Truque de simetria com exponencial", String.raw`$\dfrac{1}{3}$`, 1 / 3,
  simpson((x) => (x * x) / (1 + Math.exp(x)), -1, 1), 1e-8);

ok("Soma de Riemann e logaritmo", String.raw`$\ln 2$`, Math.LN2,
  ((n) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / (n + i); return s; })(4e6), 1e-6);

// 7. INTEGRAL INDEFINIDA -----------------------------------------------------
ok("Substituição simples com radical", String.raw`$2\sqrt{2}-2$`, 2 * Math.sqrt(2) - 2,
  simpson((x) => Math.cos(x) / Math.sqrt(1 + Math.sin(x)), 0, PI / 2), 1e-8);

ok("Teorema do Valor Médio para integrais", String.raw`$\sqrt{3}$`, Math.sqrt(3),
  bissecao((c) => 1 / (c * c) - simpson((x) => 1 / (x * x), 1, 3) / 2, 1, 3), 1e-7);

ok("Substituição para racionalizar o integrando", String.raw`$4-2\ln 3$`, 4 - 2 * Math.log(3),
  simpson((x) => 1 / (1 + Math.sqrt(x)), 0, 4, 400000), 1e-4);

ok("Substituição com potência", String.raw`$\dfrac{2\left(2\sqrt{2}-1\right)}{9}$`, (2 * (2 * Math.sqrt(2) - 1)) / 9,
  simpson((x) => x * x * Math.sqrt(1 + x ** 3), 0, 1), 1e-8);

ok("Primitiva com condição inicial", String.raw`$4$`, 4,
  3 + simpson((x) => (2 * x) / (x * x + 1), 0, Math.sqrt(E - 1)), 1e-8);

ok("Potência ímpar de tangente", String.raw`$\dfrac{1-\ln 2}{2}$`, (1 - Math.LN2) / 2,
  simpson((x) => Math.tan(x) ** 3, 0, PI / 4), 1e-8);

// 8. APLICAÇÕES DA INTEGRAL DEFINIDA -----------------------------------------
ok("Área entre seno e cosseno", String.raw`$2\sqrt{2}$`, 2 * Math.sqrt(2),
  simpson((x) => Math.abs(Math.sin(x) - Math.cos(x)), 0, PI / 4) +
    simpson((x) => Math.abs(Math.sin(x) - Math.cos(x)), PI / 4, PI), 1e-8);

ok("Área por integração em relação a y", String.raw`$\dfrac{9}{2}$`, 9 / 2,
  simpson((y) => y + 2 - y * y, -1, 2), 1e-9);

ok("Volume de revolução pelo método dos anéis", String.raw`$\dfrac{64\pi}{15}$`, (64 * PI) / 15,
  PI * simpson((x) => (2 * x) ** 2 - x ** 4, 0, 2), 1e-9);

ok("Volume por cascas cilíndricas", String.raw`$2\pi$`, 2 * PI,
  2 * PI * simpson((x) => x * Math.sin(x * x), 0, Math.sqrt(PI)), 1e-8);

ok("Comprimento de arco de curva algébrica", String.raw`$\dfrac{59}{24}$`, 59 / 24,
  simpson((x) => Math.sqrt(1 + (x * x - 1 / (4 * x * x)) ** 2), 1, 2), 1e-8);

ok("Comprimento de arco com secante", String.raw`$\ln\left(2+\sqrt{3}\right)$`, Math.log(2 + Math.sqrt(3)),
  simpson((x) => Math.sqrt(1 + Math.tan(x) ** 2), 0, PI / 3), 1e-8);

ok("Volume em torno de uma reta vertical", String.raw`$\dfrac{256\pi}{15}$`, (256 * PI) / 15,
  PI * simpson((y) => (4 - y * y) ** 2, 0, 2), 1e-9);

// 9. FUNÇÃO INVERSA ----------------------------------------------------------
ok("Teorema da função inversa", String.raw`$\dfrac{1}{5}$`, 1 / 5,
  1 / d1((x) => x ** 3 + 2 * x + 1, bissecao((x) => x ** 3 + 2 * x + 1 - 4, 0, 3)), 1e-6);

ok("Derivadas das inversas trigonométricas", String.raw`$\dfrac{5\sqrt{3}-6}{15}$`, (5 * Math.sqrt(3) - 6) / 15,
  d1((x) => Math.asin(x / 2) + Math.atan(2 / x), 1), 1e-6);

ok("Limite com logaritmo no infinito", String.raw`$3$`, 3,
  ((x) => x * Math.log1p(3 / x))(1e9), 1e-6);

ok("Máximo de potência com expoente real", String.raw`$e^{1/e}$`, Math.exp(1 / E),
  extremo((x) => x ** (1 / x), 0.5, 10, 1).y, 1e-7);

ok("Simplificação na derivada do arco-tangente", String.raw`$-\dfrac{1}{5}$`, -1 / 5,
  d1((x) => Math.atan((1 - x) / (1 + x)), 2), 1e-7);

ok("Derivada de logaritmo de um quociente", String.raw`$\dfrac{1}{4}$`, 1 / 4,
  d1((x) => Math.log(Math.abs((x - 1) / (x + 1))), 3), 1e-7);

// 10. TÉCNICAS DE INTEGRAÇÃO -------------------------------------------------
ok("Integração por partes cíclica", String.raw`$\dfrac{e^{\pi}+1}{2}$`, (Math.exp(PI) + 1) / 2,
  simpson((x) => Math.exp(x) * Math.sin(x), 0, PI), 1e-8);

ok("Frações parciais com fatores lineares", String.raw`$\ln\dfrac{9}{8}$`, Math.log(9 / 8),
  simpson((x) => x / ((x + 1) * (x + 2)), 0, 1), 1e-9);

ok("Substituição trigonométrica com tangente", String.raw`$\dfrac{\pi}{6}+\dfrac{\sqrt{3}}{8}$`, PI / 6 + Math.sqrt(3) / 8,
  simpson((x) => 1 / (1 + x * x) ** 2, 0, Math.sqrt(3)), 1e-9);

ok("Substituição trigonométrica com seno", String.raw`$\dfrac{\pi}{3}-\dfrac{\sqrt{3}}{2}$`, PI / 3 - Math.sqrt(3) / 2,
  simpson((x) => (x * x) / Math.sqrt(4 - x * x), 0, 1), 1e-8);

ok("Frações parciais com fator quadrático irredutível", String.raw`$\dfrac{1}{2}\ln\dfrac{8}{5}$`, Math.log(8 / 5) / 2,
  simpson((x) => 1 / (x * (x * x + 1)), 1, 2), 1e-9);

ok("Integração por partes com logaritmo", String.raw`$\dfrac{2e^{3}+1}{9}$`, (2 * Math.exp(3) + 1) / 9,
  simpson((x) => x * x * Math.log(x), 1, E), 1e-8);

ok("Potências de seno e cosseno", String.raw`$\dfrac{2}{15}$`, 2 / 15,
  simpson((x) => Math.sin(x) ** 3 * Math.cos(x) ** 2, 0, PI / 2), 1e-9);

ok("Integração por partes com arco-tangente", String.raw`$\dfrac{\pi}{4}-\dfrac{\ln 2}{2}$`, PI / 4 - Math.LN2 / 2,
  simpson((x) => Math.atan(x), 0, 1), 1e-9);

// 11. INTEGRAL IMPRÓPRIA -----------------------------------------------------
ok("Intervalo infinito com frações parciais", String.raw`$\ln 2$`, Math.LN2,
  simpsonInfinito((x) => 1 / (x * (x + 1)), 1), 1e-6);

ok("Intervalo infinito com logaritmo", String.raw`$1$`, 1,
  simpsonInfinito((x) => Math.log(x) / (x * x), 1), 1e-6);

ok("Singularidade no extremo do intervalo", String.raw`$-4$`, -4,
  simpsonSingular((x) => Math.log(x) / Math.sqrt(x), 0, 1), 1e-6);

// Armadilha conhecida do pipeline: este integrando decai só como 1/(x ln^2 x), e
// a cauda desprezada pelos blocos diádicos até 2^K vale 1/(K ln 2) — com 200
// blocos ainda sobram 7e-3. É preciso mudar de variável (u = ln x) para a cauda
// virar 1/u^2, que aí os blocos alcançam; a quadratura segue numérica.
ok("Logaritmo no denominador", String.raw`$\dfrac{1}{\ln 2}$`, 1 / Math.LN2,
  simpsonInfinito((u) => 1 / (u * u), Math.LN2, 200), 1e-6);

// Deslocada para u = x+2: integral de -inf a +inf de 1/(u^2+9) = 2 * (0 a inf).
ok("Integral em toda a reta", String.raw`$\dfrac{\pi}{3}$`, PI / 3,
  2 * (simpson((u) => 1 / (u * u + 9), 0, 1) + simpsonInfinito((u) => 1 / (u * u + 9), 1, 200)), 1e-6);

// Singularidade em x = 1, interior ao intervalo: dois ramos diádicos partindo
// dela. O ramo da esquerda vai de 1 rumo a 0, logo sai com o sinal trocado.
ok("Singularidade interior ao intervalo", String.raw`$3\left(1+\sqrt[3]{2}\right)$`, 3 * (1 + cbrt(2)),
  ((g) => -simpsonSingular(g, 1, 0, 45) + simpsonSingular(g, 1, 3, 45))((x) => 1 / cbrt((x - 1) ** 2)), 1e-4);

// 12. DERIVADAS --------------------------------------------------------------
ok("Limite que é uma derivada disfarçada", String.raw`$\dfrac{1}{27}$`, 1 / 27,
  ((h) => (cbrt(27 + h) - 3) / h)(1e-5), 1e-5);

ok("Derivação logarítmica com base variável", String.raw`$2+2\ln 2$`, 2 + 2 * Math.LN2,
  d1((x) => (x * x + 1) ** x, 1), 1e-6);

// 13. TEOREMA FUNDAMENTAL DO CÁLCULO -----------------------------------------
ok("Limite superior composto", String.raw`$4\sqrt{65}$`, 4 * Math.sqrt(65),
  d1((x) => simpson((t) => Math.sqrt(1 + t ** 3), 0, x * x, 4000), 2, 1e-4), 1e-5);

ok("Os dois limites de integração variáveis", String.raw`$e-1$`, E - 1,
  d1((x) => simpson((t) => 1 / Math.log(t), x, x * x, 4000), E, 1e-4), 1e-5);

// Implícita com integrais: dy/dx = -Phi_x/Phi_y em (0,0).
ok("Derivação implícita com funções integrais", String.raw`$-1$`, -1,
  ((Phi) => -d1((x) => Phi(x, 0), 0) / d1((y) => Phi(0, y), 0))(
    (x, y) => simpson((t) => Math.exp(t * t), 0, y, 2000) + simpson((t) => Math.cos(t * t), 0, x, 2000)
  ), 1e-5);

ok("L'Hospital com função integral", String.raw`$\dfrac{1}{3}$`, 1 / 3,
  ((x) => simpson((t) => Math.sin(t * t), 0, x, 2000) / x ** 3)(1e-2), 1e-4);

ok("Mínimo de uma função definida por integral", String.raw`$-\dfrac{16}{3}$`, -16 / 3,
  extremo((x) => simpson((t) => t * t - 4, 0, x, 2000), 0, 3, -1).y, 1e-6);

// 14. PROBLEMAS DE OTIMIZAÇÃO ------------------------------------------------
ok("Lata cilíndrica de área mínima", String.raw`$2$ cm`, 2,
  extremo((r) => 2 * PI * r * r + (32 * PI) / r, 0.5, 10, -1).x, 1e-6);

ok("Distância mínima de um ponto a uma parábola", String.raw`$\sqrt{7}$`, Math.sqrt(7),
  extremo((x) => Math.sqrt((x - 4) ** 2 + 2 * x), 0, 20, -1).y, 1e-7);

ok("Tempo mínimo remando e caminhando", String.raw`$\dfrac{41}{20}$ h`, 41 / 20,
  extremo((x) => Math.sqrt(9 + x * x) / 4 + (8 - x) / 5, 0, 8, -1).y, 1e-7);

ok("Cilindro inscrito em uma esfera", String.raw`$12\sqrt{3}\,\pi$`, 12 * Math.sqrt(3) * PI,
  extremo((h) => PI * (9 - (h * h) / 4) * h, 0, 6, 1).y, 1e-7);

ok("Janela normanda de área máxima", String.raw`$\dfrac{12}{4+\pi}$ m`, 12 / (4 + PI),
  extremo((r) => 12 * r - 2 * r * r - (PI * r * r) / 2, 0, 6, 1).x, 1e-6);

// 15. FUNÇÕES CONTÍNUAS ------------------------------------------------------
ok("Parâmetro para continuidade", String.raw`$4$`, 4,
  bissecao((a) => ((x) => (x * x - a * a) / (x - a))(a + 1e-7) - (3 * a - 4), -10, 10), 1e-5);

ok("Descontinuidades de uma função composta", String.raw`$2$`, 2,
  contarRaizes((x) => x * x - 3, -10, 10), 1e-9);

ok("Parâmetro com indeterminação e radical", String.raw`$3$`, 3,
  bissecao((k) => Math.sqrt(1 + k) - 2, 0.1, 20), 1e-6);

// Intervalo (-1, 2]: f explode em -1 e é finita em 2; verifico os dois fatos.
ok("Maior intervalo de continuidade", String.raw`$(-1,2]$`, 1,
  ((f) => (Math.abs(f(-1 + 1e-9)) > 1e6 && Number.isFinite(f(2)) && Number.isNaN(f(2 + 1e-9)) ? 1 : 0))(
    (x) => Math.sqrt(4 - x * x) / Math.log(x + 2)
  ), 1e-9);

ok("Função contínua definida em três ramos", String.raw`$0$`, 0,
  ((a, b) => a + b)(...(() => { const a = (-2 - 2) / (3 - -1); return [a, 2 + a]; })()), 1e-9);

// 16. ANÁLISE DE GRÁFICOS ----------------------------------------------------
ok("Assíntota oblíqua de função racional", String.raw`$1$`, 1,
  ((x) => (2 * x * x - 3 * x + 1) / (x - 2) - 2 * x)(1e9), 1e-6);

ok("Sinal da derivada e extremos locais", String.raw`$1$`, 1,
  ((fl) => {
    let maximos = 0;
    for (let x = -5; x < 5; x += 1e-4) {
      if (fl(x) > 0 && fl(x + 1e-4) < 0) maximos++;
    }
    return maximos;
  })((x) => x * x * (x - 1) ** 3 * (x - 2)), 1e-9);

ok("Contagem de assíntotas", String.raw`$3$`, 3,
  ((f) => {
    const verticais = [2, -2].filter((p) => Math.abs(f(p + 1e-8)) > 1e6).length;
    const horizontais = Math.abs(f(1e9) - f(-1e9)) < 1e-9 && Number.isFinite(f(1e9)) ? 1 : 0;
    return verticais + horizontais;
  })((x) => (x * x) / (x * x - 4)), 1e-9);

ok("Assíntota oblíqua com denominador quadrático", String.raw`$3$`, 3,
  // `a` precisa ser arredondado ANTES de entrar no cálculo de `b`: com o valor
  // bruto (1.000002...), a subtração f(X) - a*X se cancela e devolve zero.
  ((f) => {
    const X = 1e6;
    const a = Math.round(f(X) / X);
    const b = Math.round(f(X) - a * X);
    return a + b;
  })((x) => x ** 3 / (x - 1) ** 2), 1e-9);

// ---- relatório -------------------------------------------------------------
console.log(`${checados} gabaritos recalculados de forma independente (${itens.length} questões no lote)`);
if (checados !== itens.length) {
  console.log(`AVISO: ${itens.length - checados} questão(ões) sem recálculo.`);
}
if (falhas.length) {
  console.log(`\n${falhas.length} DIVERGÊNCIA(S):`);
  falhas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("OK — todos os gabaritos conferem com o recálculo numérico.");
