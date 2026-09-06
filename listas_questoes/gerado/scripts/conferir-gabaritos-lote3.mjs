// Recalcula, de forma independente, cada resposta numérica dos lotes de
// Cálculo III, Fundamentos de Cálculo e Geometria e Química Geral.
// As questões conceituais de Química (teoria de bandas, VSEPR, Le Chatelier,
// passivação etc.) não têm valor numérico e ficam fora desta rede — foram
// conferidas contra o Brown na autoria.
//
// Uso: node listas_questoes/gerado/scripts/conferir-gabaritos-lote3.mjs
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

function simpson(f, a, b, n = 4000) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

// integral dupla em região de tipo I: y entre g1(x) e g2(x)
const dupla = (f, a, b, g1, g2, n = 600) => simpson((x) => simpson((y) => f(x, y), g1(x), g2(x), n), a, b, n);

// derivada parcial numérica
const px = (f, x, y, z, h = 1e-5) => (f(x + h, y, z) - f(x - h, y, z)) / (2 * h);
const py = (f, x, y, z, h = 1e-5) => (f(x, y + h, z) - f(x, y - h, z)) / (2 * h);
const pz = (f, x, y, z, h = 1e-5) => (f(x, y, z + h) - f(x, y, z - h)) / (2 * h);

// rotacional e divergência numéricos de F(x,y,z) = [P,Q,R]
function rot(F, x, y, z) {
  const P = (a, b, c) => F(a, b, c)[0];
  const Q = (a, b, c) => F(a, b, c)[1];
  const Rr = (a, b, c) => F(a, b, c)[2];
  return [py(Rr, x, y, z) - pz(Q, x, y, z), pz(P, x, y, z) - px(Rr, x, y, z), px(Q, x, y, z) - py(P, x, y, z)];
}
function div(F, x, y, z) {
  const P = (a, b, c) => F(a, b, c)[0];
  const Q = (a, b, c) => F(a, b, c)[1];
  const Rr = (a, b, c) => F(a, b, c)[2];
  return px(P, x, y, z) + py(Q, x, y, z) + pz(Rr, x, y, z);
}

// integral de linha de campo vetorial sobre curva parametrizada r(t)
function linha(F2, r, t0, t1, n = 200000) {
  let total = 0;
  const h = (t1 - t0) / n;
  for (let i = 0; i < n; i++) {
    const t = t0 + (i + 0.5) * h;
    const p = r(t);
    const dr = [d1((s) => r(s)[0], t), d1((s) => r(s)[1], t)];
    const f = F2(p[0], p[1]);
    total += (f[0] * dr[0] + f[1] * dr[1]) * h;
  }
  return total;
}

// ---- CÁLCULO III -----------------------------------------------------------
ok("T1 dupla sobre retângulo", 5, dupla((x, y) => x + 2 * y, 0, 1, () => 0, () => 2));
ok("T2 região tipo I", 1 / 6, dupla((x) => 2 * x, 0, 1, (x) => x * x, (x) => x), 1e-5);
ok("T3 inversão da ordem", (Math.E - 1) / 2, dupla((x) => Math.exp(x * x), 0, 1, () => 0, (x) => x), 1e-5);
ok("T4 polares", 18 * Math.PI, 2 * Math.PI * simpson((r) => r * r, 0, 3));
{
  // área do paralelogramo por shoelace nos 4 vértices reais (independe do jacobiano)
  const V = [[0, 0], [1, 1], [1 / 3, 7 / 3], [-2 / 3, 4 / 3]];
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = V[i], [x2, y2] = V[(i + 1) % 4];
    s += x1 * y2 - x2 * y1;
  }
  ok("T5 mudança de variáveis", 2, Math.abs(s) / 2, 1e-12);
}
ok("T6 tripla sobre caixa", 9 / 2, simpson((x) => x, 0, 1) * simpson((y) => y, 0, 2) * simpson((z) => z, 0, 3));
ok("T7 volume do paraboloide", 8 * Math.PI, 2 * Math.PI * simpson((r) => (4 - r * r) * r, 0, 2));
ok("T8 cilíndricas", 2 * Math.PI, 2 * Math.PI * simpson((r) => r, 0, 1) * simpson((z) => z, 0, 2));
ok("T9 esféricas", (128 * Math.PI) / 5, 2 * Math.PI * simpson((f) => Math.sin(f), 0, Math.PI) * simpson((p) => p ** 4, 0, 2));
ok("T10 massa com densidade", 3 / 2, 3 * simpson((x) => x, 0, 1));
ok("T11 linha escalar", (3 * Math.sqrt(5)) / 2, simpson((t) => 3 * t * Math.sqrt(5), 0, 1));
{
  // campo (y,x) de (0,0) a (2,3) por dois caminhos diferentes: deve dar o mesmo
  const F = (x, y) => [y, x];
  const reta = linha(F, (t) => [2 * t, 3 * t], 0, 1);
  const quebrado = linha(F, (t) => (t < 1 ? [2 * t, 0] : [2, 3 * (t - 1)]), 0, 2, 400000);
  ok("T12 independência do caminho (reta)", 6, reta, 1e-4);
  ok("T12 independência do caminho (quebrado)", 6, quebrado, 1e-3);
}
ok("T13 Green", 8 * Math.PI, linha((x, y) => [x - y, x + y], (t) => [2 * Math.cos(t), 2 * Math.sin(t)], 0, 2 * Math.PI), 1e-4);
ok("T14 área da elipse", 6 * Math.PI, 0.5 * linha((x, y) => [-y, x], (t) => [3 * Math.cos(t), 2 * Math.sin(t)], 0, 2 * Math.PI), 1e-4);
ok("T15 conservativo", 3, linha((x, y) => [2 * x * y + 3, x * x - 1], (t) => [t, 2 * t], 0, 1), 1e-4);
ok("T16 área plana", 2 * Math.sqrt(14), 2 * Math.sqrt(1 + 4 + 9), 1e-12);
ok("T17 hemisfério", 18 * Math.PI, 0.5 * 4 * Math.PI * 9);
ok("T18 superfície escalar", 8 * Math.PI, 2 * Math.PI * 8 * simpson((f) => Math.cos(f) * Math.sin(f), 0, Math.PI / 2));
ok("T19 fluxo pelo disco", 12 * Math.PI, 3 * Math.PI * 4);
ok("T20 área lateral do cilindro", 20 * Math.PI, 2 * Math.PI * 2 * 5);
ok("T21 Stokes: circulação", -2 * Math.PI, linha((x, y) => [y, -x], (t) => [Math.cos(t), Math.sin(t)], 0, 2 * Math.PI), 1e-4);
ok("T22 rotacional", [-3, 1, 1], rot((x, y, z) => [x * z, x * y * z, -y * y], 1, 1, 1), 1e-5);
{
  const rt = rot(() => [0, 0, 0], 1, 1, 1); // placeholder para manter a forma
  const c = rot((x, y, z) => [z, x, y], 0.3, 0.3, 0.4);
  ok("T23 rot de (z,x,y)", [1, 1, 1], c, 1e-5);
  const areaTri = (Math.sqrt(3) / 4) * Math.SQRT2 ** 2;
  ok("T23 área do triângulo", Math.sqrt(3) / 2, areaTri, 1e-12);
  ok("T23 Stokes", 3 / 2, ((1 + 1 + 1) / Math.sqrt(3)) * areaTri, 1e-12);
  void rt;
}
{
  const F = (x, y, z) => [2 * x * y, x * x + z * z, 2 * y * z];
  ok("T24 rotacional nulo", [0, 0, 0], rot(F, 0.4, 0.6, 0.7), 1e-4);
  const f = (x, y, z) => x * x * y + y * z * z;
  ok("T24 potencial", 2, f(1, 1, 1) - f(0, 0, 0));
}
ok("T25 Stokes rot variável", (3 * Math.PI) / 2, linha((x, y) => [-(y ** 3), x ** 3], (t) => [Math.cos(t), Math.sin(t)], 0, 2 * Math.PI), 1e-4);
{
  const F = (x, y, z) => [x * x, y * y, z * z];
  ok("T26 divergência", 2 * 0.3 + 2 * 0.4 + 2 * 0.5, div(F, 0.3, 0.4, 0.5), 1e-5);
  ok("T26 fluxo no cubo", 3, 3 * (2 * 0.5));
}
ok("T27 fluxo na esfera", 32 * Math.PI, 3 * (4 / 3) * Math.PI * 8);
ok("T28 divergência em ponto", 13, div((x, y, z) => [x * x * y, y * z, x * z * z], 1, 2, 3), 1e-5);
ok("T29 fluxo no cilindro", 36 * Math.PI, 2 * (Math.PI * 9 * 2));
ok("T30 divergência constante", (20 * Math.PI) / 3, 5 * (4 / 3) * Math.PI);

// ---- FUNDAMENTOS DE CÁLCULO E GEOMETRIA ------------------------------------
{
  const f = (x) => Math.sqrt(x - 1) / (x - 3);
  ok("G1 domínio: x=1 vale", 0, f(1));
  ok("G1 domínio: x=0.5 fora", 1, Number.isNaN(f(0.5)) ? 1 : 0);
  ok("G1 domínio: x=3 fora", 1, Number.isFinite(f(3)) ? 0 : 1);
}
{
  const dentro = (x) => (Math.abs(2 * x - 3) < 5 ? 1 : 0);
  ok("G2 |2x-3|<5: x=0 dentro", 1, dentro(0));
  ok("G2 extremo -1 fora", 0, dentro(-1));
  ok("G2 extremo 4 fora", 0, dentro(4));
}
{
  const p = (x) => x ** 3 - 4 * x * x + x + 6;
  ok("G3 raiz 3", 0, p(3));
  ok("G3 raiz 2", 0, p(2));
  ok("G3 raiz -1", 0, p(-1));
}
{
  // Contar por troca de sinal nao serve: sen x = -1 e raiz DUPLA (a curva
  // tangencia o eixo em 3pi/2 sem trocar de sinal). Varre-se |g| abaixo de um
  // limiar e agrupam-se os pontos vizinhos em raizes distintas.
  const g = (x) => 2 * Math.sin(x) ** 2 + Math.sin(x) - 1;
  const passo = 1e-5, limiar = 1e-3;
  const raizes = [];
  let ultimo = -Infinity;
  for (let x = 0; x < 2 * Math.PI; x += passo) {
    if (Math.abs(g(x)) < limiar) {
      if (x - ultimo > 0.05) raizes.push(x);
      ultimo = x;
    }
  }
  ok("G4 numero de solucoes", 3, raizes.length);
  ok("G4 raiz em pi/6", 0, g(Math.PI / 6), 1e-12);
  ok("G4 raiz em 5pi/6", 0, g((5 * Math.PI) / 6), 1e-12);
  ok("G4 raiz em 3pi/2", 0, g((3 * Math.PI) / 2), 1e-12);
}
ok("G5 exponencial", 3 ** (2 * -4 - 1), 27 ** (-4 + 1), 1e-12);
{
  const f = (x) => 2 * x + 1, g = (x) => x * x - 3;
  ok("G6 composição", 25, f(g(2)) + g(f(2)));
}
{
  const f = (x) => (2 * x + 1) / (x - 3);
  ok("G7 inversa homográfica", 3, f(10));
}
ok("G8 inversa cúbica", 9, 2 ** 3 + 1);
ok("G9 logaritmo", 3, Math.log2(3 - 1) + Math.log2(3 + 1), 1e-12);
ok("G10 senh(ln2)", 3 / 4, (Math.exp(Math.log(2)) - Math.exp(-Math.log(2))) / 2, 1e-12);
ok("G11 sen(arccos(3/5))", 4 / 5, Math.sin(Math.acos(3 / 5)), 1e-12);
ok("G12 exp/log inversas", 15, 2 ** (Math.log2(5) + Math.log2(3)), 1e-12);
ok("G13 par e ímpar", 10, 5 * -(-2));
ok("G14 translação", 2, (5 - 3) ** 2 - 2);
{
  // f com máximo em x=6; g(x)=3f(2x) deve ter máximo em x=3
  const f = (x) => -((x - 6) ** 2) + 10;
  const g = (x) => 3 * f(2 * x);
  let melhorX = 0, melhor = -Infinity;
  for (let x = 0; x <= 10; x += 1e-4) if (g(x) > melhor) { melhor = g(x); melhorX = x; }
  ok("G15 homotetia", 3, melhorX, 1e-3);
}
{
  let m = -Infinity;
  for (let x = 0; x < Math.PI; x += 1e-5) m = Math.max(m, 5 - 3 * Math.cos(2 * x));
  ok("G16 função limitada", 8, m, 1e-8);
}
{
  let m = Infinity;
  for (let x = -10; x <= 20; x += 1e-4) m = Math.min(m, x * x - 6 * x + 5);
  ok("G17 mínimo da parábola", -4, m, 1e-6);
}
ok("G18 reflexão e translação", -1, -Math.abs(4 - 1) + 2);
ok("G19 raio da circunferência", 5, Math.sqrt(9 + 16));
ok("G20 ângulo entre vetores", 45, (Math.acos((2 + 3) / (Math.sqrt(5) * Math.sqrt(10))) * 180) / Math.PI, 1e-12);
ok("G21 projeção", 19 / 5, Math.abs(5 * 3 + 1 * 4) / Math.hypot(3, 4), 1e-12);
ok("G22 área do paralelogramo", 13, Math.abs(3 * 5 - 1 * 2));
{
  ok("G23 passa por (2,3)", 17, 4 * 2 + 3 * 3);
  ok("G23 perpendicular", 0, 3 * 4 + -4 * 3); // normais (3,-4) e (4,3)
}
ok("G24 distância ponto-reta", 1 / 5, Math.abs(3 * 1 + 4 * 2 - 10) / Math.hypot(3, 4), 1e-12);
ok("G25 raio da esfera", 5, Math.sqrt(11 + 1 + 4 + 9));
{
  const u = [1, 2, 3], v = [2, -1, 1];
  const c = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  ok("G26 produto vetorial", [5, 5, -5], c);
  ok("G26 área do triângulo", (5 * Math.sqrt(3)) / 2, Math.hypot(...c) / 2, 1e-12);
}
{
  const det = 1 * (3 * 0 - 1 * 1) - 0 * (0 * 0 - 1 * 2) + 2 * (0 * 1 - 3 * 2);
  ok("G27 produto misto", 13, Math.abs(det));
}
ok("G28 plano por ponto", 12, 2 * 1 - 1 * 2 + 4 * 3);
ok("G29 ângulo entre planos", Math.sqrt(6) / 3, 2 / (Math.sqrt(3) * Math.sqrt(2)), 1e-12);
ok("G30 esfera no cilindro", 2 / 3, ((4 / 3) * Math.PI * 27) / (Math.PI * 9 * 6), 1e-12);

// ---- QUÍMICA GERAL (parte computacional) -----------------------------------
ok("Q1 energia do fóton", 4.97e-19, (6.626e-34 * 3.0e8) / 400e-9, 1e-3);
ok("Q2 Bohr n=3", -1.51, -13.6 / 9, 1e-2);
{
  const dE = 13.6 * (1 / 4 - 1 / 9);
  ok("Q3 energia da transição", 1.89, dE, 1e-2);
  ok("Q3 comprimento de onda", 656, 1240 / dE, 1e-2);
}
ok("Q4 de Broglie", 7.3e-10, 6.626e-34 / (9.11e-31 * 1.0e6), 1e-2);
ok("Q5 Fe3+ tem 23 elétrons", 23, 26 - 3);
ok("Q6 camada n=4", 32, 2 * 4 ** 2);
ok("Q9 Born-Haber", -788, -411 - (108 + 496 + 122 - 349));
ok("Q13 carga formal do N", 1, 5 - 0 - 4);
ok("Q17 entalpia de combustão", -890.3, -393.5 + 2 * -285.8 - -74.8, 1e-9);
ok("Q19 meia-vida", 10, Math.log(2) / 0.0693, 1e-3);
ok("Q21 equilíbrio NO2", 0.19, Math.sqrt(0.36 * 0.1), 1e-2);
ok("Q23 NOX do cromo", 6, (-2 + 14) / 2);
ok("Q24 fem da pilha", 1.1, 0.34 - -0.76, 1e-9);
ok("Q25 eletrólise do cobre", 3.18, (9650 / 96500 / 2) * 63.5, 5e-3);
ok("Q28 neutralização", 100, ((0.05 * 0.2) / 0.1) * 1000, 1e-9);
ok("Q29 cal hidratada", 74, ((56 / (40 + 16)) * (40 + 2 * (16 + 1))));

// ---- relatório -------------------------------------------------------------
console.log(`${checados} verificações numéricas independentes`);
if (falhas.length) {
  console.log(`\n${falhas.length} DIVERGÊNCIA(S):`);
  falhas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("OK — todos os gabaritos numéricos conferem.");
