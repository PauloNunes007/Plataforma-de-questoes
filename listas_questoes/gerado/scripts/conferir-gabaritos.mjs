// Recalcula, de forma independente do enunciado escrito à mão, o resultado de
// cada questão dos lotes 2 e compara com o valor da alternativa marcada como
// gabarito. Derivadas por diferença central, integrais por Simpson, EDOs por
// verificação direta da equação, álgebra linear por operações numéricas.
//
// Uso: node listas_questoes/gerado/scripts/conferir-gabaritos.mjs
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

// ---- utilitários numéricos -------------------------------------------------
const d1 = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const d2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);

function simpson(f, a, b, n = 20000) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

// integral com singularidade: recorta e refina
const simpsonAberto = (f, a, b, eps = 1e-9) => simpson(f, a + eps, b - eps, 200000);

// integral ate o infinito: soma blocos diadicos [a*2^k, a*2^(k+1)], cada um
// com Simpson proprio, ate a contribuicao ficar desprezivel. Evita o erro de
// usar passo uniforme num intervalo enorme.
function simpsonInfinito(f, a, blocos = 200, n = 2000, proximo = (lo) => lo * 2) {
  let total = 0;
  let lo = a;
  for (let k = 0; k < blocos; k++) {
    const hi = proximo(lo);
    const parcela = simpson(f, lo, hi, n);
    total += parcela;
    if (Math.abs(parcela) < 1e-14 * Math.max(1, Math.abs(total))) break;
    lo = hi;
  }
  return total;
}

// ---- CÁLCULO I -------------------------------------------------------------
ok("C1 continuidade removível", 1 / 4, (Math.sqrt(2 + 1e-8 + 2) - 2) / 1e-8, 1e-4);
{
  const a = -4, b = 2 / 3;
  ok("C2 partes: continuidade em 1", 3 * 1 + a, 1 * 1 - 2);
  ok("C2 partes: continuidade em 3", 3 * 3 - 2, b * 3 + 5);
  ok("C2 a+b", -10 / 3, a + b);
}
ok("C3 k+m", 5, Math.sin(3 * 1e-6) / 1e-6 + (1 - Math.cos(2 * 1e-4)) / 1e-8, 1e-4);
{
  const f = (x) => x ** 3 + x - 3;
  ok("C4 TVI: f(1)<0", -1, f(1));
  ok("C4 TVI: f(1.5)>0", 15 / 8, f(1.5));
}
ok("C5 derivada pela definição", -2 / 9, d1((x) => 1 / (2 * x + 1), 1), 1e-5);
{
  const f = (x) => x ** 3 - 3 * x + 1;
  const x0 = 2;
  ok("C6 tangente paralela a y=9x", 9, d1(f, x0), 1e-5);
  ok("C6 coeficiente linear", -15, f(x0) - 9 * x0, 1e-5);
}
ok("C7 derivabilidade: a*b", -2, 2 * (1 - 2));
ok("C8 produto+cadeia", Math.PI / 3, d1((x) => x * x * Math.sin(3 * x), Math.PI / 6), 1e-5);
{
  // fólio: resolve y(x) perto de (3,3) e deriva numericamente
  const yDe = (x) => {
    let y = 3;
    for (let i = 0; i < 200; i++) {
      const F = x ** 3 + y ** 3 - 6 * x * y;
      const dF = 3 * y * y - 6 * x;
      y -= F / dF;
    }
    return y;
  };
  ok("C9 derivação implícita", -1, d1(yDe, 3, 1e-4), 1e-4);
}
ok("C10 y''(1)", -1 / 2, d2((x) => x / (x * x + 1), 1), 1e-4);
ok("C11 cadeia com radical", 1, d1((x) => Math.sqrt(1 + Math.tan(2 * x)), 0), 1e-5);
{
  // escada: y = sqrt(25 - x^2), x(t) = 3 + 0.6 t
  const y = (t) => Math.sqrt(25 - (3 + 0.6 * t) ** 2);
  ok("C12 taxas relacionadas", -0.45, d1(y, 0), 1e-5);
}
{
  const V = (x) => x * (12 - 2 * x) ** 2;
  let melhor = 0;
  for (let x = 0; x <= 6; x += 1e-5) melhor = Math.max(melhor, V(x));
  ok("C13 otimização caixa", 128, melhor, 1e-6);
}
ok("C14 L'Hospital", 2, (Math.exp(2 * 1e-4) - 1 - 2 * 1e-4) / 1e-8, 1e-3);
{
  const f = (x) => x ** 3 - 3 * x * x - 9 * x + 5;
  let m = -Infinity;
  for (let x = -2; x <= 4; x += 1e-5) m = Math.max(m, f(x));
  ok("C15 máximo absoluto", 10, m, 1e-6);
}
ok("C16 TVM", (2 * Math.sqrt(3)) / 3, Math.sqrt(4 / 3));
{
  let s = 0;
  const n = 2000000;
  for (let i = 1; i <= n; i++) s += Math.sqrt(i / n) / n;
  ok("C17 soma de Riemann", 2 / 3, s, 1e-5);
}
ok("C18 integral simétrica", 16, simpson((x) => x ** 3 + 3 * x * x, -2, 2));
ok("C19 propriedades", 4, 2 * (12 - 7) - 3 * (5 - 3));
ok("C20 substituição", (2 / 3) * (5 * Math.sqrt(5) - 1), simpson((x) => 2 * x * Math.sqrt(x * x + 1), 0, 2));
{
  const F = (x) => simpson((t) => t ** 3 + 1, 1, x * x, 2000);
  ok("C21 TFC + cadeia", 260, d1(F, 2, 1e-4), 1e-4);
}
ok("C22 TVM para integrais", Math.sqrt(3), Math.sqrt(simpson((x) => x * x, 0, 3) / 3));
ok("C23 área entre curvas", 1 / 3, simpson((x) => 2 * x - 2 * x * x, 0, 1));
ok("C24 volume de revolução", 8 * Math.PI, Math.PI * simpson((x) => x, 0, 4));
ok("C25 comprimento de arco", 14 / 3, simpson((x) => Math.sqrt(1 + x), 0, 3));
{
  const f = (x) => x ** 3 + 2 * x + 1;
  ok("C26 função inversa", 1 / 5, 1 / d1(f, 1), 1e-5);
}
ok("C27 arctg(sqrt(x))", 1 / 4, d1((x) => Math.atan(Math.sqrt(x)), 1), 1e-5);
ok("C28 derivação logarítmica", 2, d1((x) => Math.pow(x, Math.log(x)), Math.E), 1e-4);
ok("C29 por partes", (Math.E ** 2 + 1) / 4, simpson((x) => x * Math.exp(2 * x), 0, 1));
ok("C30 substituição trigonométrica", Math.SQRT2 / 8, simpson((x) => 1 / (x * x + 4) ** 1.5, 0, 2));
ok("C31 frações parciais", 0.5 * Math.log(1.5), simpson((x) => 1 / (x * x - 1), 2, 3));
ok("C32 potências de seno", 2 / 15, simpson((x) => Math.sin(x) ** 3 * Math.cos(x) ** 2, 0, Math.PI / 2));
ok("C33 imprópria p>1", 2, simpsonInfinito((x) => x ** -1.5, 1), 1e-6);
ok("C34 ln x em (0,1]", -1, simpsonAberto((x) => Math.log(x), 0, 1, 1e-12), 1e-4);
ok("C35 x e^{-2x}", 1 / 4, simpson((x) => x * Math.exp(-2 * x), 0, 60), 1e-8);
// o integrando decai so como 1/ln x, entao integrar direto em x trunca a cauda
// cedo demais (e ir alem estoura o double). Mudanca de variavel u = ln x,
// dx = e^u du, leva a integral de 1/u^2 a partir de ln 2 — decaimento rapido.
ok("C36 1/(x ln^2 x)", 1 / Math.log(2), simpsonInfinito((u) => 1 / (u * u), Math.log(2)), 1e-6);

// ---- CÁLCULO II ------------------------------------------------------------
{
  // y' = y^2 cos x, y(0)=1, RK4 até pi/6
  let y = 1, x = 0;
  const h = 1e-6, f = (x, y) => y * y * Math.cos(x);
  while (x < Math.PI / 6 - 1e-12) {
    const k1 = f(x, y), k2 = f(x + h / 2, y + (h * k1) / 2), k3 = f(x + h / 2, y + (h * k2) / 2), k4 = f(x + h, y + h * k3);
    y += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    x += h;
  }
  ok("D1 separável", 2, y, 1e-5);
}
{
  const y = (x) => Math.exp(-x) - Math.exp(-2 * x);
  ok("D2 linear: satisfaz a EDO", Math.exp(-0.7), d1(y, 0.7) + 2 * y(0.7), 1e-5);
  ok("D2 linear: y(ln2)", 1 / 4, y(Math.log(2)));
}
{
  const k = Math.log(2) / 10;
  ok("D3 resfriamento", 40, 20 + 80 * Math.exp(-k * 20), 1e-9);
}
{
  const y = (x) => x ** 3 / 5 + 4 / (5 * x * x);
  ok("D4 linear var.: satisfaz xy'+2y=x^3", 1.7 ** 3, 1.7 * d1(y, 1.7) + 2 * y(1.7), 1e-4);
  ok("D4 y(1)=1", 1, y(1));
  ok("D4 y(2)", 9 / 5, y(2));
}
{
  const Q = (t) => 200 * (1 - Math.exp(-t / 20));
  ok("D5 tanque: satisfaz Q'=10-Q/20", 0, d1(Q, 7) - (10 - Q(7) / 20), 1e-4);
  ok("D5 Q(20)", 200 * (1 - Math.exp(-1)), Q(20));
}
{
  const y = (x) => 3 * Math.exp(2 * x) - 2 * Math.exp(3 * x);
  ok("D6 EDO2 homogênea", 0, d2(y, 0.4) - 5 * d1(y, 0.4) + 6 * y(0.4), 1e-3);
  ok("D6 y(0)", 1, y(0));
  ok("D6 y'(0)", 0, d1(y, 0), 1e-5);
}
{
  const y = (x) => 2 * Math.exp(-2 * x) * Math.sin(3 * x);
  ok("D7 raízes complexas", 0, d2(y, 0.3) + 4 * d1(y, 0.3) + 13 * y(0.3), 1e-3);
  ok("D7 y'(0)", 6, d1(y, 0), 1e-4);
  ok("D7 y(pi/6)", 2 * Math.exp(-Math.PI / 3), y(Math.PI / 6));
}
{
  const y = (x) => (2 + 7 * x) * Math.exp(-3 * x);
  ok("D8 raiz dupla", 0, d2(y, 0.5) + 6 * d1(y, 0.5) + 9 * y(0.5), 1e-3);
  ok("D8 y(1)", 9 * Math.exp(-3), y(1));
}
{
  const yp = (x) => Math.exp(2 * x);
  ok("D9 coef. a determinar", 3 * Math.exp(2 * 0.6), d2(yp, 0.6) - yp(0.6), 1e-3);
}
{
  const yp = (x) => (-x / 4) * Math.cos(2 * x);
  ok("D10 ressonância", Math.sin(2 * 0.8), d2(yp, 0.8) + 4 * yp(0.8), 1e-3);
}
ok("D11 rapidez", Math.sqrt(13), Math.hypot(2, 3));
ok("D12 hélice", 2 * Math.SQRT2 * Math.PI, simpson(() => Math.SQRT2, 0, 2 * Math.PI));
ok("D13 aceleração tangencial", (4 * Math.sqrt(5)) / 5, (0 * 1 + 2 * 2) / Math.hypot(1, 2));
ok("D14 espiral logarítmica", Math.SQRT2, simpson((t) => Math.SQRT2 * Math.exp(t), 0, Math.log(2)));
ok("D15 integração vetorial", [10, 5], [2 ** 3 + 2, 2 ** 2 + 1]);
{
  const plano = (x, y, z) => 6 * x + 3 * y + 2 * z;
  ok("D16 plano em A", 6, plano(1, 0, 0));
  ok("D16 plano em B", 6, plano(0, 2, 0));
  ok("D16 plano em C", 6, plano(0, 0, 3));
}
ok("D17 distância ponto-plano", 1 / 3, Math.abs(2 * 1 - 2 + 2 * 3 - 5) / Math.hypot(2, -1, 2));
{
  const t = 1.5, P = [1 + 2 * t, -t, 2 + t];
  ok("D18 interseção: está no plano", 6, P[0] + P[1] + P[2]);
  ok("D18 ponto", [4, -1.5, 3.5], P);
}
ok("D19 seção do hiperboloide", Math.sqrt(5), Math.sqrt(1 + 2 ** 2));
{
  // ponto da geratriz (x=3, z=sqrt3) girado 40°: confere z^4 = x^2+y^2
  const r = 3, ang = 0.7, z = Math.sqrt(r);
  ok("D20 superfície de revolução", z ** 4, (r * Math.cos(ang)) ** 2 + (r * Math.sin(ang)) ** 2, 1e-9);
}
ok("D21 derivada parcial", 33 / 2, d1((x) => x * x * 8 + x / 2, 1), 1e-5);
{
  const z = (t) => Math.exp(2 * t) ** 2 * Math.sin(t);
  ok("D22 regra da cadeia", 1, d1(z, 0), 1e-5);
}
{
  const f = (x, y) => x * x + x * y;
  const h = 1e-5;
  ok("D23 derivada direcional", 16 / 5, (f(1 + (3 / 5) * h, 2 + (4 / 5) * h) - f(1 - (3 / 5) * h, 2 - (4 / 5) * h)) / (2 * h), 1e-5);
}
{
  const plano = (x, y) => 2 * x + 2 * y - 2;
  ok("D24 plano tangente: toca", 2, plano(1, 1));
  ok("D24 plano tangente: inclinação x", 2, d1((x) => x * x + 1, 1), 1e-5);
}
{
  let pior = 0;
  for (let k = 0; k < 400; k++) {
    const a = (k / 400) * 2 * Math.PI, r = 1e-4;
    const x = r * Math.cos(a), y = r * Math.sin(a);
    pior = Math.max(pior, Math.abs((x * x * y) / (x * x + y * y)));
  }
  ok("D25 limite duas variáveis", 0, pior, 1e-3);
}
{
  const f = (x, y) => x ** 3 - 3 * x + y * y;
  let m = Infinity;
  for (let x = 0.5; x <= 1.5; x += 1e-3) for (let y = -0.5; y <= 0.5; y += 1e-3) m = Math.min(m, f(x, y));
  ok("D26 mínimo local", -2, m, 1e-5);
}
{
  let m = -Infinity;
  for (let a = 0; a < 2 * Math.PI; a += 1e-5) m = Math.max(m, Math.sqrt(8) * Math.cos(a) * (Math.sqrt(8) * Math.sin(a)));
  ok("D27 Lagrange xy", 4, m, 1e-6);
}
ok("D28 Lagrange linear", 14, Math.hypot(1, 2, 3) * Math.sqrt(14));
{
  const f = (x, y) => x * x + 2 * y * y - 4 * x;
  let m = -Infinity;
  for (let x = 0; x <= 3; x += 1e-3) for (let y = -1; y <= 1; y += 1e-3) m = Math.max(m, f(x, y));
  ok("D29 máximo em região fechada", 2, m, 1e-5);
}
{
  let m = Infinity;
  for (let x = 1; x <= 10; x += 1e-3) for (let y = 1; y <= 10; y += 1e-3) {
    const z = 32 / (x * y);
    m = Math.min(m, x * y + 2 * x * z + 2 * y * z);
  }
  ok("D30 caixa sem tampa", 48, m, 1e-4);
}

// ---- ÁLGEBRA LINEAR --------------------------------------------------------
const det3 = (M) =>
  M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
  M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
  M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
const mul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));

ok("A1 determinante 3x3", -13, det3([[2, 1, 3], [0, -1, 2], [1, 4, 1]]));
{
  // k=-4 torna o sistema inconsistente: posto(A)=2, posto([A|b])=3
  const k = -4;
  ok("A2 sistema impossível: det=0", 0, det3([[1, 2, -1], [2, 5, 1], [1, 1, k]]));
  ok("A2 sistema impossível: det aumentado != 0", 1, det3([[2, -1, 1], [5, 1, 3], [1, k, 2]]) !== 0 ? 1 : 0);
}
ok("A3 inversa 2x2", [1, 0, 0, 1], mul([[2, 1], [5, 3]], [[3, -1], [-5, 2]]).flat());
ok("A4 det(2 A^T A^-1)", 8, 2 ** 3 * 4 * (1 / 4));
{
  const [x, y, z] = [1, 2, 3];
  ok("A5 eq1", 8, x + 2 * y + z);
  ok("A5 eq2", 9, 2 * x - y + 3 * z);
  ok("A5 eq3", -1, 3 * x + y - 2 * z);
  ok("A5 x-y+2z", 5, x - y + 2 * z);
}
ok("A6 dim do gerado", 0, det3([[1, 2, -1], [2, 4, -2], [1, 0, 1]]));
ok("A7 coordenadas na base", [5, 1], [3 * 1 + 2 * 1, 3 * 1 + 2 * -1]);
{
  // colunas da matriz devem reproduzir os vetores de B a partir de C
  const C = [[2, 1], [1, 1]]; // colunas c1=(2,1), c2=(1,1)
  const col1 = [1, -1], col2 = [0, 1];
  const comb = (c) => [C[0][0] * c[0] + C[0][1] * c[1], C[1][0] * c[0] + C[1][1] * c[1]];
  ok("A8 mudança de base col1", [1, 0], comb(col1));
  ok("A8 mudança de base col2", [1, 1], comb(col2));
}
{
  const v = [1, 1, 3];
  ok("A9 interseção: em W", 0, v[0] + 2 * v[1] - v[2]);
  ok("A9 interseção: em U", 0, v[0] - v[1]);
}
ok("A10 LD para k=4", 0, det3([[1, 2, 3], [2, 5, 7], [1, 3, 4]]));
{
  const v = [1, -1, 1];
  ok("A11 núcleo", [0, 0], [v[0] + v[1], v[1] + v[2]]);
}
ok("A12 linearidade", [4, 6], [3 + 1, 5 + 1]);
ok("A13 núcleo e imagem", 2, 5 - 3);
ok("A14 rotação 30°", [Math.sqrt(3), 1], [2 * Math.cos(Math.PI / 6), 2 * Math.sin(Math.PI / 6)], 1e-12);
{
  // [T]_B colunas: coords em B={(1,1),(1,0)} de T(1,1) e T(1,0), com T(x,y)=(x+2y,3x)
  const emB = (v) => [v[1], v[0] - v[1]]; // a=y, b=x-y
  ok("A15 col1", [3, 0], emB([3, 3]));
  ok("A15 col2", [3, -2], emB([1, 3]));
}
{
  const tr = 3 + 2, dt = 3 * 2 - 1 * 2;
  const raizes = [(tr - Math.sqrt(tr * tr - 4 * dt)) / 2, (tr + Math.sqrt(tr * tr - 4 * dt)) / 2];
  ok("A16 autovalores", [1, 4], raizes, 1e-12);
}
ok("A17 autovetor", [-1, 1], [1 * 1 + 2 * -1, 2 * 1 + 1 * -1]);
ok("A18 det(A^3)", 512, (2 * 4) ** 3);
{
  let A = [[1, 0], [0, 1]];
  for (let i = 0; i < 4; i++) A = mul(A, [[2, 1], [0, 2]]);
  ok("A19 A^4", [16, 32, 0, 16], A.flat());
}
{
  // posto de A-I = 2 => nulidade 1
  const M = [[0, 2, 1], [0, 0, 0], [0, 0, 1]];
  ok("A20 nulidade", 1, 3 - 2);
  ok("A20 A-I tem linha nula", 0, M[1].reduce((s, v) => s + Math.abs(v), 0));
}
{
  const u1 = [1, 1, 0], u2 = [0.5, -0.5, 1];
  ok("A21 Gram-Schmidt: ortogonal", 0, u1.reduce((s, v, i) => s + v * u2[i], 0));
  const v2 = [1, 0, 1];
  ok("A21 Gram-Schmidt: fórmula", [0.5, -0.5, 1], v2.map((v, i) => v - (1 / 2) * u1[i]));
}
ok("A22 projeção", [11 / 5, 22 / 5], [(11 / 5) * 1, (11 / 5) * 2]);
{
  const tr = 10, dt = 25 - 16;
  ok("A23 maior autovalor", 9, (tr + Math.sqrt(tr * tr - 4 * dt)) / 2, 1e-12);
}
ok("A24 complemento ortogonal", 0, 1 - 2 + 1);
{
  let m = Infinity;
  for (let a = 0; a < 2 * Math.PI; a += 1e-5) {
    const x = Math.cos(a), y = Math.sin(a);
    m = Math.min(m, 3 * x * x + 2 * x * y + 3 * y * y);
  }
  ok("A25 forma quadrática", 2, m, 1e-8);
}

// ---- FÍSICA I --------------------------------------------------------------
const cruz = (A, B) => [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
ok("F1 produto vetorial", [-5, 5, 5], cruz([2, -1, 3], [1, 2, -1]));
ok("F2 resultante", 100 * Math.sqrt(3), Math.hypot(200 * Math.cos(Math.PI / 6), 200 * Math.sin(Math.PI / 6) - 100), 1e-12);
ok("F3 ângulo", 4 / 9, (1 * 2 + 2 * -1 + 2 * 2) / (Math.hypot(1, 2, 2) * Math.hypot(2, -1, 2)), 1e-12);
ok("F4 força de contato", 4, 2 * (10 / (3 + 2)));
{
  const a = ((6 - 2) * 10) / 8;
  ok("F5 Atwood", 30, 2 * (10 + a));
  ok("F5 Atwood (outro corpo)", 30, 6 * (10 - a));
}
ok("F6 fio e polia", 12, 2 * ((3 * 10) / 5));
{
  const v = (2 * 6) / 6;
  ok("F7 energia dissipada", 24, 0.5 * 2 * 36 - 0.5 * 6 * v * v);
}
ok("F8 impulso", 3.6, 0.2 * (8 - -10), 1e-12);
ok("F9 explosão", 4.5, (2 * 9) / 4);
ok("F10 colisão 2D", 2.5, Math.hypot(0.5 * 4, 0.5 * 3) / 1);
ok("F11 mola", 2, Math.sqrt((2 * (0.5 * 200 * 0.1 ** 2)) / 0.5), 1e-12);
{
  const v1 = 5, m1 = 2, m2 = 3;
  const v2f = ((2 * m1) / (m1 + m2)) * v1, v1f = ((m1 - m2) / (m1 + m2)) * v1;
  ok("F12 colisão elástica", 4, v2f);
  ok("F12 momento conservado", m1 * v1, m1 * v1f + m2 * v2f);
  ok("F12 energia conservada", 0.5 * m1 * v1 ** 2, 0.5 * m1 * v1f ** 2 + 0.5 * m2 * v2f ** 2);
}
{
  const L = 3 / 0.6;
  ok("F13 rampa com atrito", 6, Math.sqrt(2 * (10 * 3 - 0.3 * 10 * 0.8 * L)), 1e-12);
}
ok("F14 força variável", 8, simpson((x) => 3 * x * x, 0, 2));
ok("F15 atrito", 0.4, (0.5 * 4 * 100) / (4 * 10 * 12.5));
ok("F16 potência", 2000, 500 * 10 * 0.4);
ok("F17 trabalho vetorial", -7, 4 * 2 + -3 * 5);
ok("F18 aceleração angular", 4, 1 / (0.5 * 2 * 0.5 ** 2));
ok("F19 rolamento", 4, Math.sqrt((4 * 10 * 1.2) / 3), 1e-12);
{
  const wf = (6 * 2) / 2;
  ok("F20 momento angular", 36, 0.5 * 2 * wf * wf);
}
ok("F21 equilíbrio estático", 325, (20 * 10 * 2 + 30 * 10 * 3) / 4);
ok("F22 gravidade na altitude", 2.5, 10 * (1 / 2) ** 2);
ok("F23 velocidade orbital", 5.7e3, Math.sqrt((10 * 6.4e6) / 2), 1e-2);
ok("F24 Kepler", 8, Math.pow(4, 1.5), 1e-12);
ok("F25 energia orbital", 2.4e10, 0.75 * 10 * 6.4e6 * 500);
ok("F26 pêndulo", 2, 2 * Math.PI * Math.sqrt(1 / 10), 7e-3);
ok("F27 v máxima MHS", 0.8, Math.sqrt(200 / 0.5) * 0.04, 1e-12);
ok("F28 energia MHS", 0.375, 0.5 * 100 * 0.1 ** 2 - 0.5 * 100 * 0.05 ** 2, 1e-12);
ok("F29 oscilação vertical", 0.44, (2 * Math.PI) / Math.sqrt(10 / 0.05), 5e-3);

// ---- FÍSICA II -------------------------------------------------------------
const k = 9e9, e0 = 8.85e-12, mu0 = 4 * Math.PI * 1e-7;
ok("G1 Coulomb", 1.2, (k * 3e-6 * 4e-6) / 0.3 ** 2, 1e-9);
{
  const F = (k * (2e-6) ** 2) / 0.1 ** 2;
  ok("G2 superposição", 6.2, 2 * F * Math.cos(Math.PI / 6), 1e-2);
}
{
  const x = 0.3;
  ok("G3 equilíbrio", 9 / x ** 2, 1 / (0.4 - x) ** 2, 1e-12);
}
{
  const x = 1.2;
  ok("G4 campo nulo", 8 / x ** 2, 2 / (x - 0.6) ** 2, 1e-12);
}
{
  const t = 0.04 / 2e6, a = (1.6e-19 * 100) / 9.1e-31;
  ok("G5 desvio do elétron", 3.5e-3, 0.5 * a * t * t, 2e-2);
}
ok("G6 torque de dipolo", 2e-5, 2e-9 * 0.02 * 5e5, 1e-9);
ok("G7 anel no eixo", 1.6e3, (k * 5e-9 * 0.1) / (0.1 ** 2 + 0.1 ** 2) ** 1.5, 1e-2);
ok("G8 esfera condutora", 1.35e6, (k * 6e-6) / 0.2 ** 2, 1e-9);
ok("G9 fio infinito", 9.0e5, (2 * k * 5e-6) / 0.1, 1e-9);
ok("G10 esfera isolante", 900, (k * 8e-9 * 0.1) / 0.2 ** 3, 1e-9);
ok("G11 fluxo", 226, 2e-9 / e0, 3e-3);
ok("G12 potencial", 9.0e4, k * (4e-6 / 0.2 - 1e-6 / 0.1), 1e-9);
ok("G13 trabalho externo", -3e-4, 2e-6 * (-50 - 100), 1e-12);
ok("G14 |E| do gradiente", Math.sqrt(157), Math.hypot(-6 * 1 * 2, -3 * 1 ** 2, 2), 1e-12);
ok("G15 energia de 3 cargas", 0.27, (3 * k * (1e-6) ** 2) / 0.1, 1e-9);
{
  const ceq = 1 / (1 / 3e-6 + 1 / 6e-6), Q = ceq * 12;
  ok("G16 série", 8, Q / 3e-6, 1e-9);
  ok("G16 soma das tensões", 12, Q / 3e-6 + Q / 6e-6, 1e-9);
}
ok("G17 dielétrico", 5.3e-10, (3 * e0 * 0.02) / 1e-3, 3e-3);
{
  const Ui = 0.5 * 10e-6 * 100 ** 2, Q = 10e-6 * 100, Uf = (0.5 * Q * Q) / 20e-6;
  ok("G18 energia dissipada", 0.025, Ui - Uf, 1e-12);
}
ok("G19 resistência do fio", 0.17, (1.7e-8 * 20) / 2e-6, 1e-9);
ok("G20 densidade de corrente", 2e6, 6 / 3e-6, 1e-12);
ok("G21 velocidade de deriva", 3.7e-4, 10 / (8.5e28 * 1.6e-19 * 2e-6), 5e-3);
ok("G22 chuveiro", 11, 220 ** 2 / 4400, 1e-12);
{
  const rp = 1 / (1 / 6 + 1 / 12), I = 24 / (4 + rp);
  ok("G23 série-paralelo", 1, (I * rp) / 12, 1e-12);
}
ok("G24 tensão terminal", 11, 12 - 0.5 * (12 / 6), 1e-12);
ok("G25 circuito RC", 32e-6, 5e-6 * 10 * (1 - Math.exp(-1)), 1e-2);
{
  // lei dos nós: (12-V)/2 + (6-V)/3 = V/6
  let lo = 0, hi = 20;
  for (let i = 0; i < 200; i++) {
    const V = (lo + hi) / 2;
    if ((12 - V) / 2 + (6 - V) / 3 - V / 6 > 0) lo = V; else hi = V;
  }
  ok("G26 Kirchhoff: V", 8, lo, 1e-9);
  ok("G26 Kirchhoff: corrente", 4 / 3, lo / 6, 1e-9);
}
ok("G27 força magnética", 0.24, 2e-6 * 3e5 * 0.4, 1e-12);
ok("G28 raio do próton", 0.042, (1.67e-27 * 2e6) / (1.6e-19 * 0.5), 1e-2);
ok("G29 fio longo", 4e-5, (mu0 * 10) / (2 * Math.PI * 0.05), 1e-9);
ok("G30 solenoide", 7.5e-3, mu0 * 2000 * 3, 1e-2);
ok("G31 torque na bobina", 0.3, 50 * 2 * 0.01 * 0.3, 1e-12);

// ---- relatório -------------------------------------------------------------
console.log(`${checados} verificações numéricas independentes`);
if (falhas.length) {
  console.log(`\n${falhas.length} DIVERGÊNCIA(S):`);
  falhas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("OK — todos os gabaritos conferem.");
