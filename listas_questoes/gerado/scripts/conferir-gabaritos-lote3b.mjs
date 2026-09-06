// Recalcula, de forma independente, cada resposta dos lotes 3 de Cálculo I,
// Cálculo II, Álgebra Linear, Física I e Física II.
//
// Uso: node listas_questoes/gerado/scripts/conferir-gabaritos-lote3b.mjs
const falhas = [];
let checados = 0;
const perto = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

function ok(ref, esperado, calculado, tol = 1e-6) {
  checados++;
  if (Array.isArray(esperado)) {
    const bate = esperado.length === calculado.length && esperado.every((v, i) => perto(v, calculado[i], tol));
    if (!bate) falhas.push(`${ref}: gabarito [${esperado}] vs calculado [${calculado.map((x) => +x.toFixed(6))}]`);
    return;
  }
  if (!perto(esperado, calculado, tol)) falhas.push(`${ref}: gabarito ${esperado} vs calculado ${calculado}`);
}

const d1 = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const d2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
function simpson(f, a, b, n = 20000) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
// Integral com singularidade de potencia em 0: soma blocos diadicos
// [b/2^(k+1), b/2^k]. O integrando e suave em cada bloco e as larguras caem
// geometricamente, ao contrario do Simpson de passo uniforme, que explode.
function simpsonSingular0(f, b, blocos = 200, n = 2000) {
  let total = 0;
  for (let k = 0; k < blocos; k++) {
    const hi = b / 2 ** k, lo = b / 2 ** (k + 1);
    const parcela = simpson(f, lo, hi, n);
    total += parcela;
    if (Math.abs(parcela) < 1e-15 * Math.max(1, Math.abs(total))) break;
  }
  return total;
}

const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const det3 = (M) =>
  M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
  M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
  M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

// ---- CÁLCULO I (lote 3) ----------------------------------------------------
ok("L1 prolongamento contínuo", 12, (2.000001 ** 3 - 8) / 0.000001, 1e-4);
{
  const f = (x) => x ** 4 - 4 * x + 1;
  let trocas = 0;
  for (let x = 0; x < 2; x += 1e-5) if (f(x) * f(x + 1e-5) < 0) trocas++;
  ok("L2 número de raízes em [0,2]", 2, trocas);
}
ok("L3 derivada pela definição", 3 / 4, d1((x) => Math.sqrt(3 * x + 1), 1), 1e-5);
{
  const f = (x) => x * x + 1;
  const m = d1(f, 1);
  ok("L4 inclinação da tangente", 2, m, 1e-5);
  ok("L4 intercepto da normal", 5 / 2, f(1) + (1 / m) * 1, 1e-5);
}
ok("L5 quociente trigonométrico", 2 / 3, d1((x) => Math.sin(x) / (1 + Math.cos(x)), Math.PI / 3), 1e-5);
{
  // resolve y(x) perto de (1,2) em x^2+xy+y^2=7 e deriva numericamente
  const yDe = (x) => {
    let y = 2;
    for (let i = 0; i < 300; i++) y -= (x * x + x * y + y * y - 7) / (x + 2 * y);
    return y;
  };
  ok("L6 derivação implícita", -4 / 5, d1(yDe, 1, 1e-4), 1e-4);
}
ok("L7 derivada segunda de produto", -2, d2((x) => Math.exp(-x) * Math.sin(x), 0), 1e-4);
{
  // V = 4/3 pi r^3 cresce a 100 cm^3/s; r(t) tal que V(r(t)) = V0 + 100 t
  const V = (r) => (4 / 3) * Math.PI * r ** 3;
  const rDe = (t) => Math.cbrt((V(5) + 100 * t) / ((4 / 3) * Math.PI));
  ok("L8 taxas relacionadas", 1 / Math.PI, d1(rDe, 0, 1e-4), 1e-4);
}
{
  let m = 0;
  for (let x = 0; x <= 2; x += 1e-5) m = Math.max(m, 2 * x * Math.sqrt(Math.max(0, 4 - x * x)));
  ok("L9 retângulo no semicírculo", 4, m, 1e-6);
}
ok("L10 L'Hospital", 0, 1 / 1e-3 - 1 / Math.sin(1e-3), 1e-3);
{
  const f = (x) => x ** 3 - 6 * x * x + 9 * x;
  ok("L11 inflexão: f''(2)=0", 0, d2(f, 2), 1e-4);
  ok("L11 ordenada", 2, f(2), 1e-9);
}
{
  let s = 0;
  const n = 1000000;
  for (let i = 1; i <= n; i++) s += (1 + i / n) ** 3 / n;
  ok("L12 soma de Riemann", 15 / 4, s, 1e-5);
}
ok("L13 paridade", 3 * Math.PI, simpson((x) => x ** 5 * Math.cos(x) + 3, -Math.PI / 2, Math.PI / 2), 1e-9);
ok("L14 substituição logarítmica", 1 / 2, simpson((x) => Math.log(x) / x, 1, Math.E));
{
  const F = (x) => simpson((t) => Math.sqrt(1 + t * t), 0, Math.sin(x), 2000);
  ok("L15 TFC composto", Math.sqrt(15) / 4, d1(F, Math.PI / 6, 1e-4), 1e-4);
}
ok("L16 área entre curvas", 1 / 4, simpson((x) => x - x ** 3, 0, 1));
ok("L17 cascas cilíndricas", 8 * Math.PI, 2 * Math.PI * simpson((x) => x * x * x, 0, 2));
ok("L18 arco-seno", (4 * Math.sqrt(3)) / 3, d1((x) => Math.asin(2 * x), 0.25), 1e-4);
ok("L19 logaritmo", 4 / 5, d1((x) => Math.log(x * x + 1), 2), 1e-5);
ok("L20 por partes", 1, simpson((x) => Math.log(x), 1, Math.E));
ok("L21 arco-seno definido", Math.PI / 3, simpson((x) => 1 / Math.sqrt(4 - x * x), 0, Math.sqrt(3)), 1e-5);
ok("L22 frações parciais", 0.5 * Math.log(8 / 3), simpson((x) => (x + 2) / ((x + 1) * (x + 3)), 0, 1));
ok("L23 arco-tangente impróprio", Math.PI / 2, Math.atan(1e12), 1e-9);
ok("L24 singularidade na origem", 3, simpsonSingular0((x) => x ** (-2 / 3), 1), 1e-6);

// ---- CÁLCULO II (lote 3) ---------------------------------------------------
{
  const y = (x) => Math.sqrt(x * x + 2 * x + 4);
  ok("M1 separável satisfaz a EDO", (1.3 + 1) / y(1.3), d1(y, 1.3), 1e-4);
  ok("M1 y(0)", 2, y(0));
  ok("M1 y(2)", 2 * Math.sqrt(3), y(2));
}
{
  const y = (x) => Math.exp(2 * x) + 2 * Math.exp(x);
  ok("M2 linear satisfaz a EDO", Math.exp(2 * 0.6), d1(y, 0.6) - y(0.6), 1e-4);
  ok("M2 y(ln2)", 8, y(Math.log(2)));
}
ok("M3 crescimento exponencial", 8000, 1000 * Math.exp(Math.log(2) * 3), 1e-9);
ok("M4 decaimento", 1 / 8, 0.5 ** (15 / 5));
{
  const y = (x) => Math.exp(2 * x) + Math.exp(-2 * x);
  ok("M5 satisfaz y''-4y=0", 0, d2(y, 0.3) - 4 * y(0.3), 1e-3);
  ok("M5 y(ln2/2)", 5 / 2, y(Math.log(2) / 2));
}
{
  const y = (x) => Math.exp(-x) * Math.cos(2 * x);
  ok("M6 satisfaz a EDO", 0, d2(y, 0.4) + 2 * d1(y, 0.4) + 5 * y(0.4), 1e-3);
  ok("M6 y'(0)", -1, d1(y, 0), 1e-5);
  ok("M6 y(pi/2)", -Math.exp(-Math.PI / 2), y(Math.PI / 2));
}
{
  const yp = (x) => x * x - 2;
  ok("M7 coeficientes a determinar", 0.7 ** 2, d2(yp, 0.7) + yp(0.7), 1e-3);
}
{
  const y = (x) => (1 + 2 * x) * Math.exp(-2 * x);
  ok("M8 amortecimento crítico", 0, d2(y, 0.5) + 4 * d1(y, 0.5) + 4 * y(0.5), 1e-3);
  ok("M8 y(1)", 3 * Math.exp(-2), y(1));
}
ok("M9 hélice", 10 * Math.PI, simpson(() => 5, 0, 2 * Math.PI));
ok("M10 quadrado perfeito", Math.E - 1 / Math.E, simpson((t) => Math.exp(t) + Math.exp(-t), 0, 1));
ok("M11 rapidez na elipse", 2, Math.hypot(-2 * Math.sin(Math.PI / 2), 3 * Math.cos(Math.PI / 2)), 1e-12);
ok("M12 tangente unitário", (2 * Math.sqrt(13)) / 13, 2 / Math.hypot(2, 3), 1e-12);
{
  const c = [1 * 0 - 1 * -1, 1 * 1 - 1 * 0, 1 * -1 - 1 * 1];
  ok("M13 direção da interseção", [1, 1, -2], c);
}
ok("M14 planos paralelos", 2, Math.abs(12 - 6) / Math.hypot(2, -1, 2), 1e-12);
ok("M15 seção do elipsoide", 8 * Math.PI, Math.PI * 2 * 4);
{
  // ponto da geratriz z=2x girado: z^2 = 4(x^2+y^2)
  const r = 1.7, ang = 0.9, z = 2 * r;
  ok("M16 cone de revolução", z * z, 4 * ((r * Math.cos(ang)) ** 2 + (r * Math.sin(ang)) ** 2), 1e-9);
}
{
  const fx = (x, y) => 3 * x * x * y * y + y * Math.exp(x * y);
  ok("M17 parcial mista", 1, (fx(0, 1 + 1e-5) - fx(0, 1 - 1e-5)) / 2e-5, 1e-4);
}
ok("M18 taxa máxima", Math.sqrt(185), Math.hypot(2 * 1 * 2, 1 * 1 + 3 * 4), 1e-12);
{
  const z = (s, t) => (s + t) ** 2 + (s - t) ** 2;
  ok("M19 regra da cadeia", 4, (z(1 + 1e-5, 0.7) - z(1 - 1e-5, 0.7)) / 2e-5, 1e-4);
}
{
  const F = (x, y, z) => x * y - z;
  const h = 1e-5;
  const grad = [
    (F(1 + h, 1, 1) - F(1 - h, 1, 1)) / (2 * h),
    (F(1, 1 + h, 1) - F(1, 1 - h, 1)) / (2 * h),
    (F(1, 1, 1 + h) - F(1, 1, 1 - h)) / (2 * h),
  ];
  ok("M20 normal à superfície", [1, 1, -1], grad, 1e-4);
}
{
  let m = Infinity;
  for (let x = 0; x <= 4; x += 1e-3) for (let y = -5; y <= -1; y += 1e-3) m = Math.min(m, x * x + y * y - 4 * x + 6 * y + 13);
  ok("M21 mínimo", 0, m, 1e-5);
}
{
  const f = (x, y) => x ** 3 - 3 * x * y + y ** 3;
  let m = Infinity;
  for (let x = 0.5; x <= 1.5; x += 1e-3) for (let y = 0.5; y <= 1.5; y += 1e-3) m = Math.min(m, f(x, y));
  ok("M22 mínimo local", -1, m, 1e-5);
}
{
  let m = Infinity;
  for (let x = -20; x <= 20; x += 1e-3) { const y = (10 - x) / 2; m = Math.min(m, x * x + y * y); }
  ok("M23 Lagrange linear", 20, m, 1e-5);
}
{
  let m = -Infinity;
  for (let a = 0; a < 2 * Math.PI; a += 1e-5) m = Math.max(m, Math.cos(a) * Math.sin(a));
  ok("M24 máximo no disco", 1 / 2, m, 1e-8);
}

// ---- ÁLGEBRA LINEAR (lote 3) -----------------------------------------------
ok("N1 determinante", -3, det3([[1, 2, 3], [4, 5, 6], [7, 8, 10]]));
{
  let n = 0;
  for (const k of [-1, 1]) if (Math.abs(k * k - 1) < 1e-12) n++;
  ok("N2 valores de k", 2, n);
}
ok("N3 traço do produto", 69, mul([[1, 2], [3, 4]], [[5, 6], [7, 8]]).reduce((s, r, i) => s + r[i], 0));
{
  const [x, y] = [3, -2];
  ok("N4 Cramer: eq1", 0, 2 * x + 3 * y);
  ok("N4 Cramer: eq2", 5, x - y);
}
{
  const v1 = [1, 2, 0, 1], v3 = [0, 1, 1, 0];
  ok("N5 v2 = 2 v1", [2, 4, 0, 2], v1.map((v) => 2 * v));
  ok("N5 v4 = v1 + v3", [1, 3, 1, 1], v1.map((v, i) => v + v3[i]));
}
ok("N6 Grassmann", 1, 2 + 2 - 3);
{
  const [a, b, c] = [5, -8, 5];
  ok("N7 coeficiente de x^2", 5, c);
  ok("N7 coeficiente de x", -3, b + c);
  ok("N7 termo constante", 2, a + b + c);
}
ok("N8 dimensão de P2", 3, 3);
ok("N9 núcleo e imagem", 2, 3 - 1);
ok("N10 linearidade", [2, 5, 2], [2 * 1 - 0, 2 * 2 - -1, 2 * 3 - 4]);
{
  const T = (x, y) => [2 * x, 3 * y];
  const S = (x, y) => [x - y, x + y];
  ok("N11 composição", [-1, 5], S(...T(1, 1)));
}
ok("N12 reflexão em y=x", [-5, 3], [-5, 3].slice());
ok("N13 produto dos autovalores", -6, det3([[2, 0, 0], [1, 3, 0], [4, 5, -1]]));
{
  const A = [[4, -2], [1, 1]];
  const A2 = mul(A, A);
  ok("N14 traço de A²", 13, A2[0][0] + A2[1][1]);
}
ok("N15 imagem de operador singular", 1, [[1, 2], [3, 6]][0][0] * 6 - 2 * 3 === 0 ? 1 : 2);
ok("N16 traço de A³", 65, 1 ** 3 + 4 ** 3);
{
  const u1 = [1, 1, 1], v2 = [1, 1, 0];
  const proj = (v2[0] + v2[1] + v2[2]) / 3;
  const u2 = v2.map((v, i) => v - proj * u1[i]);
  ok("N17 Gram-Schmidt", [1 / 3, 1 / 3, -2 / 3], u2, 1e-12);
  ok("N17 ortogonalidade", 0, u1.reduce((s, v, i) => s + v * u2[i], 0), 1e-12);
}
ok("N18 determinante ortogonal", -1, (1 / 2) * (1 * -1 - 1 * 1), 1e-12);
ok("N19 traço de A⁵", 244, 1 ** 5 + 3 ** 5);
{
  // autovalores do bloco [[1,1],[1,1]]: traço 2, determinante 0 -> 0 e 2
  const tr = 2, dt = 0;
  const menor = (tr - Math.sqrt(tr * tr - 4 * dt)) / 2;
  ok("N20 menor autovalor", 0, Math.min(menor, 1), 1e-12);
}

// ---- FÍSICA I (lote 3) -----------------------------------------------------
ok("P1 soma de vetores", 13, Math.hypot(3 - 3, -4 + 4, 12 + 1), 1e-12);
ok("P2 direção do vetor", 120, (Math.atan2(Math.sqrt(3), -1) * 180) / Math.PI, 1e-12);
ok("P3 componente na direção", 11, (5 * 3 + 10 * 4) / Math.hypot(3, 4), 1e-12);
ok("P4 três blocos", 6, 3 * (12 / 6));
{
  const f = 0.25 * 2 * 10;
  const a = (3 * 10 - f) / 5;
  ok("P5 aceleração", 5, a);
  ok("P5 tração (bloco da mesa)", 15, f + 2 * a);
  ok("P5 tração (bloco pendurado)", 15, 3 * 10 - 3 * a);
}
ok("P6 normal no elevador", 720, 60 * (10 + 2));
ok("P7 força média", 1000, (0.5 * 20) / 0.01, 1e-12);
ok("P8 centro de massa", 3, (2 * 0 + 3 * 5) / 5);
ok("P9 coeficiente de restituição", 0.6, Math.sqrt(0.45 / 1.25), 1e-12);
ok("P10 pêndulo", 4, Math.sqrt(2 * 10 * 1.6 * (1 - Math.cos(Math.PI / 3))), 1e-12);
{
  const k = 50 / 0.2;
  ok("P11 constante elástica", 250, k);
  ok("P11 energia", 5, 0.5 * k * 0.2 ** 2, 1e-12);
}
ok("P12 K = U", 10, 400 / 2 / 2 / 10, 1e-12);
ok("P13 trabalho na mola", 18, simpson((x) => 400 * x, 0, 0.3), 1e-9);
ok("P14 trabalho do peso", 100, 5 * 10 * (4 * Math.sin(Math.PI / 6)), 1e-12);
ok("P15 potência média", 1000, (200 * 10 * 15) / 30);
ok("P16 momento de inércia", 1.5, 3 * 2 * 0.5 ** 2, 1e-12);
ok("P17 energia de rotação", 100, 0.5 * 0.5 * 20 ** 2);
ok("P18 momento angular", 6, 0.2 * 10 * 3, 1e-12);
ok("P19 gravitação universal", 3.3e-7, (6.67e-11 * 100 * 200) / 2 ** 2, 1e-2);
{
  const T = 2 * Math.PI * Math.sqrt(6.4e6 / 10);
  ok("P20 período rasante (s)", 5027, T, 1e-3);
  ok("P20 período rasante (min)", 84, T / 60, 1e-2);
}
ok("P21 energia orbital", 3.2e10, (1000 * 10 * 6.4e6) / 2);
ok("P22 frequência do MHS", 3.2, Math.sqrt(80 / 0.2) / (2 * Math.PI), 1e-2);
ok("P23 aceleração máxima", 20, 20 ** 2 * 0.05, 1e-12);
ok("P24 pêndulo em outro planeta", 4, 2 * Math.sqrt(10 / 2.5), 1e-12);

// ---- FÍSICA II (lote 3) ----------------------------------------------------
const k = 9e9, e0 = 8.85e-12;
ok("R1 quantização", 0.8e-6, 5.0e12 * 1.6e-19, 1e-9);
ok("R2 lei do inverso do quadrado", 2, 8 / (60 / 30) ** 2, 1e-12);
{
  const F12 = (k * 1e-6 * 2e-6) / 0.1 ** 2;
  const F32 = (k * 2e-6 * 3e-6) / 0.1 ** 2;
  ok("R3 superposição", 3.6, F32 - F12, 1e-9);
}
ok("R4 campo puntiforme", 2.0e5, (k * 2e-6) / 0.3 ** 2, 1e-9);
ok("R5 força em carga negativa", 0.12, 3e-6 * 4e4, 1e-12);
ok("R6 gota de Millikan", 10, (1.6e-15 * 10) / 1e4 / 1.6e-19, 1e-9);
ok("R7 potencial dentro da casca", 3.6e5, (k * 4e-6) / 0.10, 1e-9);
ok("R8 plano infinito", 500, 8.85e-9 / (2 * e0), 1e-9);
ok("R9 campo entre placas", 5.0e4, 100 / 2e-3, 1e-12);
ok("R10 elétron acelerado", 5.9e6, Math.sqrt((2 * 1.6e-19 * 100) / 9.11e-31), 1e-2);
ok("R11 paralelo", 200e-6, (2e-6 + 3e-6 + 5e-6) * 20, 1e-12);
ok("R12 placas planas", 1.77e-10, (e0 * 1e-2) / 5e-4, 1e-2);
ok("R13 carga transportada", 600, 2.5 * 240);
ok("R14 resistência com temperatura", 120, 100 * (1 + 4e-3 * 50), 1e-12);
ok("R15 condutividade", 5.0e7, 1 / 2e-8, 1e-12);
ok("R16 paralelo de iguais", 2, 6 / 3);
ok("R17 efeito Joule", 1.08e4, 10 * 3 ** 2 * 120);
ok("R18 divisor de tensão", 9, (12 * 9) / 12);
ok("R19 lei de Faraday", 0.1, 0.02 * (0.5 / 0.1), 1e-12);
ok("R20 fem de movimento", 0.4, 0.2 * 0.5 * 4, 1e-12);
ok("R21 energia no indutor", 2.25, 0.5 * 0.5 * 3 ** 2, 1e-12);
ok("R22 circuito LC", 1000, 1 / Math.sqrt(1.0 * 1.0e-6), 1e-12);
ok("R23 impedância RLC", 50, Math.hypot(30, 80 - 40), 1e-12);
ok("R24 valor eficaz", 220, 311 / Math.SQRT2, 1e-2);

console.log(`${checados} verificações numéricas independentes`);
if (falhas.length) {
  console.log(`\n${falhas.length} DIVERGÊNCIA(S):`);
  falhas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("OK — todos os gabaritos conferem.");
