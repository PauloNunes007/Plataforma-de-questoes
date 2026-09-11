// Recalcula numericamente, de forma independente do texto da resolução, a
// resposta de cada uma das 92 questões de `fcg_lote3.json`, e confere:
//   1) que a alternativa marcada como gabarito é exatamente o LaTeX esperado
//      (fecha o elo entre "a conta que eu confiro" e "a letra que o aluno vê");
//   2) que o valor daquela alternativa bate com o recálculo numérico.
//
// É a única rede que pega gabarito errado: um erro de conta passa limpo pelo
// validar.mjs e pelo render-katex.mjs.
//
// Questões cuja resposta é um CONJUNTO (domínio, solução de inequação, imagem)
// são conferidas por discordância: varre-se um grid comparando o predicado
// original com o predicado da alternativa correta; o valor recalculado é o
// número de pontos em que eles discordam, e o esperado é zero.
//
// Uso: node listas_questoes/gerado/scripts/conferir-gabaritos-fcg-lote3.mjs
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const itens = JSON.parse(readFileSync(resolve(aqui, "..", "fcg_lote3.json"), "utf8"));
const porSubtopico = new Map(itens.map((q) => [q.subtopico, q]));

const falhas = [];
let checados = 0;

// ---- utilitários numéricos -------------------------------------------------
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

// Raízes por troca de sinal E por tangência (mínimo local de |f| encostando em
// zero) — contar só trocas de sinal erra em raiz dupla, que não troca sinal.
function raizes(f, a, b, passos = 200000, tol = 1e-7) {
  const h = (b - a) / passos;
  const achadas = [];
  const guardar = (r) => {
    if (!Number.isFinite(r)) return;
    if (Math.abs(f(r)) > tol) return;
    if (!achadas.some((p) => Math.abs(p - r) < 1e-3)) achadas.push(r);
  };
  let vAnt = f(a);
  let vAtual = f(a + h);
  for (let i = 1; i < passos; i++) {
    const x = a + i * h;
    const vProx = f(x + h);
    if (Number.isFinite(vAnt) && Number.isFinite(vAtual)) {
      if (vAnt === 0 || (vAnt < 0) !== (vAtual < 0)) guardar(bissecao(f, x - h, x));
      const m = Math.abs(vAtual);
      if (m < Math.abs(vAnt) && m < Math.abs(vProx)) {
        // tangência: refina o mínimo de |f| por seção áurea
        let lo = x - h;
        let hi = x + h;
        for (let k = 0; k < 200; k++) {
          const m1 = lo + (hi - lo) / 3;
          const m2 = hi - (hi - lo) / 3;
          if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2;
          else lo = m1;
        }
        guardar((lo + hi) / 2);
      }
    }
    vAnt = vAtual;
    vAtual = vProx;
  }
  return achadas.sort((x, y) => x - y);
}

// Extremo por varredura fina + refino por seção áurea local.
function extremo(f, a, b, sinal = 1, passos = 200000) {
  let melhorX = a;
  let melhor = -Infinity;
  for (let i = 0; i <= passos; i++) {
    const x = a + ((b - a) * i) / passos;
    const v = sinal * f(x);
    if (Number.isFinite(v) && v > melhor) {
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

// Conta pontos do grid em que o predicado original e o da alternativa discordam.
function discordancias(real, alegado, a, b, passo = 1e-3, pular = () => false) {
  let n = 0;
  for (let x = a; x <= b; x += passo) {
    const v = +x.toFixed(10);
    if (pular(v)) continue;
    if (real(v) !== alegado(v)) n++;
  }
  return n;
}

// Menor período entre candidatos da forma m*pi/n, testado em pontos de amostra.
function periodo(f, maxMult = 24) {
  const cands = [];
  for (let n = 1; n <= 12; n++) {
    for (let m = 1; m <= maxMult * n; m++) {
      const T = (m * Math.PI) / n;
      if (T <= 40) cands.push(T);
    }
  }
  cands.sort((x, y) => x - y);
  for (const T of cands) {
    let ok = true;
    for (let k = 0; k < 60; k++) {
      const x = -3 + k * 0.137;
      if (Math.abs(f(x + T) - f(x)) > 1e-9) {
        ok = false;
        break;
      }
    }
    if (ok) return T;
  }
  return NaN;
}

// ---- vetores ---------------------------------------------------------------
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const norma = (u) => Math.sqrt(dot(u, u));
const sub = (u, v) => u.map((x, i) => x - v[i]);
const cruz = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const det3 = (u, v, w) => dot(u, cruz(v, w));
const det2 = (u, v) => u[0] * v[1] - u[1] * v[0];

const perto = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// ---- a checagem em si ------------------------------------------------------
// ok(subtopico, latexEsperadoDaCorreta, valorQueEuAfirmo, valorRecalculado)
// esperado/calculado podem ser número ou vetor de números.
function ok(subtopico, latexCorreta, esperado, calculado, tol = 1e-4) {
  checados++;
  const item = porSubtopico.get(subtopico);
  if (!item) {
    falhas.push(`"${subtopico}": subtópico não encontrado no JSON`);
    return;
  }
  const texto = item.alternativas?.[item.gabarito];
  if (texto !== latexCorreta) {
    falhas.push(`"${subtopico}": alternativa ${item.gabarito} é ${JSON.stringify(texto)}, esperava ${JSON.stringify(latexCorreta)}`);
    return;
  }
  const e = Array.isArray(esperado) ? esperado : [esperado];
  const c = Array.isArray(calculado) ? calculado : [calculado];
  if (e.length !== c.length) {
    falhas.push(`"${subtopico}": dimensão ${c.length} no recálculo, esperava ${e.length}`);
    return;
  }
  for (let i = 0; i < e.length; i++) {
    if (!Number.isFinite(c[i]) || !perto(e[i], c[i], tol)) {
      falhas.push(`"${subtopico}": afirmo ${e.join(", ")}, recálculo deu ${c.join(", ")}`);
      return;
    }
  }
}

// ===========================================================================
// 1. FUNÇÕES EM R
// ===========================================================================
ok("Domínio máximo com radical e logaritmo", String.raw`$\left(-\infty,2\right]\cup\left(3,4\right)$`, 0,
  discordancias(
    (x) => x * x - 5 * x + 6 >= 0 && 4 - x > 0 && Math.abs(Math.log(4 - x)) > 1e-9,
    (x) => x <= 2 || (x > 3 && x < 4),
    -6, 5, 1e-3,
    (x) => Math.abs(x - 2) < 1e-6 || Math.abs(x - 3) < 1e-3 || Math.abs(x - 4) < 1e-6));

ok("Inequação racional com duas frações", String.raw`$\left(-\infty,0\right)\cup\left[2,4\right)$`, 0,
  discordancias(
    (x) => (1 - x) / x <= (x - 3) / (4 - x),
    (x) => x < 0 || (x >= 2 && x < 4),
    -8, 8, 1e-3,
    (x) => Math.abs(x) < 1e-6 || Math.abs(x - 4) < 1e-6));

ok("Inequação com três módulos", String.raw`$\left(-\infty,-\dfrac{3}{2}\right]$`, 0,
  discordancias(
    (x) => Math.abs(x - 1) + Math.abs(x + 2) <= 2 * Math.abs(x) + 1e-12,
    (x) => x <= -1.5,
    -8, 8, 1e-3,
    (x) => Math.abs(x + 1.5) < 1e-6));

ok("Equação modular quadrática", String.raw`$4$`, 4,
  raizes((x) => Math.abs(x * x - 4 * x) - 3, -6, 10).length);

ok("Estudo de sinal no lançamento vertical", String.raw`$2$ s`, 2,
  ((rs) => rs[1] - rs[0])(raizes((t) => -5 * t * t + 20 * t - 15, -1, 6)));

ok("Raízes de polinômio cúbico e relações de Girard", String.raw`$\dfrac{53}{4}$`, 53 / 4,
  raizes((x) => 2 * x ** 3 - 3 * x * x - 11 * x + 6, -6, 6).reduce((s, r) => s + r * r, 0));

ok("Divisibilidade de polinômios", String.raw`$10$`, 10,
  (() => {
    // p(1)=0 e p(-2)=0: sistema 2x2 em (a,b) resolvido por Cramer.
    const [a1, b1, c1] = [1, 1, -7]; // a + b = -7
    const [a2, b2, c2] = [4, -2, 2]; // 4a - 2b = 2
    const D = a1 * b2 - a2 * b1;
    const a = (c1 * b2 - c2 * b1) / D;
    const b = (a1 * c2 - a2 * c1) / D;
    const p = (x) => x ** 3 + a * x * x + b * x + 6;
    return Math.abs(p(1)) + Math.abs(p(-2)) < 1e-9 ? a * b : NaN;
  })());

ok("Equação exponencial por mudança de variável", String.raw`$1$`, 1,
  raizes((x) => 2 ** (2 * x + 1) - 9 * 2 ** x + 4, -6, 6).reduce((s, r) => s + r, 0));

ok("Inequação exponencial com mudança de variável", String.raw`$\left[-1,0\right]$`, 0,
  discordancias(
    (x) => (1 / 9) ** x - 4 * (1 / 3) ** x + 3 <= 1e-12,
    (x) => x >= -1 && x <= 0,
    -4, 4, 1e-3,
    (x) => Math.abs(x + 1) < 1e-6 || Math.abs(x) < 1e-6));

ok("Equação logarítmica com bases diferentes", String.raw`$\dfrac{4}{3}$`, 4 / 3,
  (() => {
    const f = (x) => Math.log2(x + 2) - Math.log(x * x) / Math.log(4) - 1;
    const rs = [...raizes(f, -1.999, -0.001), ...raizes(f, 0.001, 20)];
    return rs.reduce((s, r) => s + r, 0);
  })());

ok("Equação trigonométrica redutível a quadrática", String.raw`$\dfrac{5\pi}{2}$`, (5 * Math.PI) / 2,
  raizes((x) => 2 * Math.cos(x) ** 2 - 1 - Math.sin(x), 0, 2 * Math.PI - 1e-9)
    .reduce((s, r) => s + r, 0));

ok("Identidade trigonométrica com soma conhecida", String.raw`$\dfrac{7}{5}$`, 7 / 5,
  ((x) => Math.sin(x) - Math.cos(x))(raizes((x) => Math.sin(x) + Math.cos(x) - 0.2, 1e-6, Math.PI - 1e-6)[0]));

ok("Período fundamental de soma trigonométrica", String.raw`$\pi$`, Math.PI,
  periodo((x) => Math.sin(2 * x) * Math.cos(2 * x) + Math.cos(3 * x) ** 2));

ok("Iteração de função homográfica", String.raw`$\dfrac{3}{2}$`, 1.5,
  ((f) => f(f(f(3))))((x) => x / (x - 1)));

ok("Domínio de função composta", String.raw`$\left(-\infty,2-\sqrt{5}\right]\cup\left[2+\sqrt{5},+\infty\right)$`, 0,
  discordancias(
    (x) => x * x - 4 * x - 1 >= 0,
    (x) => x <= 2 - Math.sqrt(5) || x >= 2 + Math.sqrt(5),
    -10, 12, 1e-3,
    (x) => Math.abs(x - (2 - Math.sqrt(5))) < 1e-6 || Math.abs(x - (2 + Math.sqrt(5))) < 1e-6));

ok("Equação em função definida por partes", String.raw`$0$`, 0,
  (() => {
    const f = (x) => (x < 2 ? x * x - 3 : 2 * x - 3);
    const rs = raizes((x) => f(x) - 1, -6, 6);
    return rs.reduce((s, r) => s + r, 0);
  })());

ok("Decaimento exponencial e meia-vida", String.raw`$\dfrac{\sqrt{2}}{8}$`, Math.SQRT2 / 8,
  0.5 ** (215 / 86));

ok("Inequação com radical", String.raw`$\left[-5,4\right)$`, 0,
  discordancias(
    (x) => x >= -5 && Math.sqrt(x + 5) > x - 1,
    (x) => x >= -5 && x < 4,
    -8, 10, 1e-3,
    (x) => Math.abs(x + 5) < 1e-6 || Math.abs(x - 4) < 1e-6));

ok("Setor circular com perímetro e área dados", String.raw`$8$ cm`, 8,
  Math.max(...raizes((r) => 2 * r + 64 / r - 24, 0.5, 30)));

// ===========================================================================
// 2. FUNÇÃO INVERSA
// ===========================================================================
ok("Inversa de função homográfica", String.raw`$-6$`, -6,
  raizes((x) => (2 * x - 3) / (x + 1) - 3, -20, -1.001)[0]);

ok("Inversa de uma composta", String.raw`$\dfrac{1}{2}$`, 0.5,
  raizes((x) => (2 * x + 1) ** 3 - 1 - 7, -5, 5)[0]);

ok("Restrição de domínio para inverter", String.raw`$12$`, 12,
  raizes((x) => x * x - 6 * x + 5, 3, 20)[0] + raizes((x) => x * x - 6 * x + 5 - 12, 3, 20)[0]);

ok("Inversa de função logarítmica", String.raw`$6$`, 6,
  raizes((x) => Math.log(2 * x - 1) / Math.log(3) - 2, 0.51, 40)[0] +
    raizes((x) => Math.log(2 * x - 1) / Math.log(3), 0.51, 40)[0]);

ok("Equação com seno hiperbólico", String.raw`$\ln 2$`, Math.log(2),
  raizes((x) => (Math.exp(x) - Math.exp(-x)) / 2 - 0.75, -5, 5)[0]);

ok("Identidade hiperbólica de arco duplo", String.raw`$\dfrac{15}{8}$`, 15 / 8,
  ((x) => (Math.exp(2 * x) - Math.exp(-2 * x)) / 2)(
    raizes((x) => (Math.exp(x) + Math.exp(-x)) / 2 - 1.25, 1e-6, 5)[0]));

ok("Cosseno do arco duplo de um arco-seno", String.raw`$\dfrac{7}{25}$`, 7 / 25,
  Math.cos(2 * Math.asin(3 / 5)));

ok("Soma de dois arcos-tangentes", String.raw`$\dfrac{\pi}{4}$`, Math.PI / 4,
  Math.atan(1 / 2) + Math.atan(1 / 3));

ok("Tangente da soma de arcos inversos", String.raw`$\dfrac{63}{16}$`, 63 / 16,
  Math.tan(Math.asin(4 / 5) + Math.atan(5 / 12)));

ok("Domínio de arco-seno composto", String.raw`$\left[-1,3\right]$`, 0,
  discordancias(
    (x) => Math.abs((x - 1) / 2) <= 1,
    (x) => x >= -1 && x <= 3,
    -6, 8, 1e-3,
    (x) => Math.abs(x + 1) < 1e-6 || Math.abs(x - 3) < 1e-6));

ok("Inversa de função definida por partes", String.raw`$0$`, 0,
  (() => {
    const f = (x) => (x < 0 ? x + 1 : x * x + 1);
    return raizes((x) => f(x) - 5, -10, 10)[0] + raizes((x) => f(x) + 1, -10, 10)[0];
  })());

ok("Maior intervalo de injetividade", String.raw`$-2$`, -2,
  extremo((x) => x * x + 4 * x + 3, -10, 10, -1).x);

ok("Equação com logaritmo de base variável", String.raw`$3$`, 3,
  raizes((x) => Math.log(2 * x + 3) / Math.log(x) - 2, 1.001, 20)[0]);

ok("Inversa de composta com exponencial e logaritmo", String.raw`$2$`, 2,
  raizes((x) => Math.exp(2 * Math.log(x + 1)) - 9, -0.999, 20)[0]);

ok("Inversa de função cúbica estritamente crescente", String.raw`$0$`, 0,
  raizes((x) => x ** 3 + 3 * x - 2 - 2, -6, 6)[0] + raizes((x) => x ** 3 + 3 * x - 2 + 6, -6, 6)[0]);

ok("Mudança de base de logaritmo", String.raw`$\dfrac{3+a}{1+a}$`,
  Math.log(24) / Math.log(6),
  ((a) => (3 + a) / (1 + a))(Math.log2(3)));

ok("Inversa do argumento do seno hiperbólico", String.raw`$\dfrac{4}{3}$`, 4 / 3,
  raizes((x) => Math.log(x + Math.sqrt(x * x + 1)) - Math.log(3), -10, 10)[0]);

ok("Logaritmos recíprocos na mesma equação", String.raw`$4\sqrt{2}$`, 4 * Math.SQRT2,
  raizes((x) => Math.log2(x) + 1 / Math.log2(x) - 2.5, 1.001, 20)
    .reduce((p, r) => p * r, 1));

ok("Arco-seno igual ao dobro de um arco-tangente", String.raw`$\dfrac{3}{5}$`, 3 / 5,
  Math.sin(2 * Math.atan(1 / 3)));

// ===========================================================================
// 3. CLASSES DE FUNÇÕES E SEUS GRÁFICOS
// ===========================================================================
ok("Decomposição em parte par e parte ímpar", String.raw`$13$`, 13,
  ((f) => (f(2) + f(-2)) / 2 + (f(1) - f(-1)) / 2)((x) => x ** 3 + 2 * x * x - x + 5));

ok("Imagem de combinação de seno e cosseno", String.raw`$\left[-3,7\right]$`, [-3, 7],
  (() => {
    const f = (x) => 3 * Math.sin(x) - 4 * Math.cos(x) + 2;
    return [extremo(f, 0, 2 * Math.PI, -1).y, extremo(f, 0, 2 * Math.PI, 1).y];
  })());

ok("Máximo de função racional limitada", String.raw`$1$`, 1,
  extremo((x) => (2 * x) / (x * x + 1), -50, 50, 1).y);

ok("Ponto correspondente após transformações", String.raw`$\left(1,7\right)$`, [1, 7],
  (() => {
    const f = (t) => t - 5; // qualquer f com f(2) = -3
    const g = (x) => -2 * f(3 - x) + 1;
    const x = raizes((t) => 3 - t - 2, -5, 5)[0];
    return [x, g(x)];
  })());

ok("Período de função modular", String.raw`$\dfrac{\pi}{3}$`, Math.PI / 3,
  periodo((x) => Math.abs(Math.cos(3 * x))));

ok("Monotonicidade de função com módulo", String.raw`$2$`, 2,
  extremo((x) => x * x - 4 * Math.abs(x) + 3, 0, 20, -1).x);

ok("Raízes de equação biquadrada com módulo", String.raw`$4$`, 4,
  raizes((x) => x * x - 6 * Math.abs(x) + 8, -10, 10).length);

ok("Equação com módulo de trinômio", String.raw`$3$`, 3,
  raizes((x) => Math.abs(x * x - 4 * x + 3) - 1, -4, 8).length);

ok("Mínimo após translação e homotetia", String.raw`$1$`, 1,
  ((f) => extremo((x) => 2 * f(x - 1) + 3, -20, 20, -1).y)((x) => x * x - 2 * x));

ok("Simetria do gráfico de uma quadrática", String.raw`$2$`, 2,
  (() => {
    // f(x) = a(x-1)^2 + c, com f(0) = 5 e f(3) = 2.
    const a = (2 - 5) / (4 - 1);
    const c = 5 - a;
    const f = (x) => a * (x - 1) ** 2 + c;
    return Math.abs(f(0) - 5) + Math.abs(f(3) - 2) < 1e-9 ? f(-1) : NaN;
  })());

ok("Paridade de combinações de funções", String.raw`$7$`, 7,
  (() => {
    // duas escolhas concretas de f ímpar e g par: a razão h(-3)/h(3) tem de dar 1.
    const pares = [
      [(t) => t ** 3, (t) => t * t],
      [(t) => Math.sin(t), (t) => Math.cos(t)],
    ];
    let razao = 1;
    for (const [f, g] of pares) {
      const h = (x) => f(g(x)) + g(f(x));
      razao *= h(-3) / h(3);
    }
    return 7 * razao;
  })());

ok("Função exponencial determinada por dois pontos", String.raw`$96$`, 96,
  (() => {
    const a = Math.sqrt(24 / 6);
    const C = 6 / a;
    return C * a ** 5;
  })());

ok("Imagem de função racional par", String.raw`$\left[-1,1\right)$`, [-1, 1],
  (() => {
    const f = (x) => (x * x - 1) / (x * x + 1);
    const min = extremo(f, -50, 50, -1).y;
    const sup = f(1e8);
    const atinge1 = raizes((x) => f(x) - 1, -1e6, 1e6).length;
    return [min, atinge1 === 0 ? sup : NaN];
  })());

ok("Interseção de dois gráficos com módulo", String.raw`$2$`, 2,
  raizes((x) => Math.abs(x - 2) - (3 - Math.abs(x)), -10, 10).reduce((s, r) => s + r, 0));

ok("Imagem de função homográfica", String.raw`$\mathbb{R}\setminus\left\{2\right\}$`, 2,
  (() => {
    const f = (x) => (2 * x + 1) / (x - 3);
    const naoAtingido = raizes((x) => f(x) - 2, -1e6, 1e6).length === 0;
    return naoAtingido ? f(1e9) : NaN;
  })());

ok("Composição de compressão e translação", String.raw`$0$`, 0,
  (() => {
    const f = (t) => t - 1; // qualquer f com f(6) = 5
    const g = (x) => f(3 * (x + 2));
    return raizes((x) => g(x) - 5, -10, 10)[0];
  })());

ok("Período de soma de funções trigonométricas", String.raw`$12\pi$`, 12 * Math.PI,
  periodo((x) => Math.sin(x / 2) + Math.cos(x / 3)));

ok("Simetria funcional numa soma finita", String.raw`$\dfrac{9}{2}$`, 4.5,
  (() => {
    const f = (x) => 4 ** x / (4 ** x + 2);
    let s = 0;
    for (let k = 1; k <= 9; k++) s += f(k / 10);
    return s;
  })());

// ===========================================================================
// 4. VETORES E RETAS NO PLANO
// ===========================================================================
ok("Vetor projeção ortogonal", String.raw`$\left(\dfrac{39}{10},-\dfrac{13}{10}\right)$`, [3.9, -1.3],
  (() => {
    const u = [5, 2];
    const v = [3, -1];
    const k = dot(u, v) / dot(v, v);
    return [k * v[0], k * v[1]];
  })());

ok("Componente ortogonal na decomposição", String.raw`$\left(\dfrac{2}{5},-\dfrac{1}{5}\right)$`, [0.4, -0.2],
  (() => {
    const u = [3, 5];
    const v = [1, 2];
    const k = dot(u, v) / dot(v, v);
    const w = [u[0] - k * v[0], u[1] - k * v[1]];
    return Math.abs(dot(w, v)) < 1e-12 ? w : [NaN, NaN];
  })());

ok("Área de triângulo com vértice sobre uma reta", String.raw`$10$`, 10,
  (() => {
    const A = [5, 0];
    const B = [3, 4];
    const area = (b) => {
      const C = [5 - 4 * b, b];
      return Math.abs(det2(sub(B, A), sub(C, A))) / 2;
    };
    return raizes((b) => area(b) - 7, -10, 10).reduce((s, b) => s + (5 - 4 * b), 0);
  })());

ok("Circunferência tangente a uma reta", String.raw`$\dfrac{17}{5}$`, 17 / 5,
  Math.abs(4 * 3 - 3 * -1 + 2) / Math.hypot(4, 3));

ok("Comprimento de corda determinada por uma reta", String.raw`$7\sqrt{2}$`, 7 * Math.SQRT2,
  (() => {
    // resolve o sistema de fato e mede a distância entre os pontos
    const xs = raizes((x) => x * x + (x + 1) ** 2 - 25, -10, 10);
    const p = xs.map((x) => [x, x + 1]);
    return norma(sub(p[1], p[0]));
  })());

ok("Simétrico de um ponto em relação a uma reta", String.raw`$\left(2,5\right)$`, [2, 5],
  (() => {
    const P = [4, 1];
    const n = [1, -2];
    const k = (dot(n, P) + 3) / dot(n, n);
    return [P[0] - 2 * k * n[0], P[1] - 2 * k * n[1]];
  })());

ok("Bissetriz do ângulo agudo entre duas retas", String.raw`$x-8y=0$`, 0,
  (() => {
    // soma dos versores das direções das retas: tem de satisfazer x - 8y = 0
    const d1 = [4, 3].map((c) => c / 5);
    const d2 = [12, -5].map((c) => c / 13);
    const s = [d1[0] + d2[0], d1[1] + d2[1]];
    const ang = (u) => Math.abs(Math.atan2(det2([4, 3], u), dot([4, 3], u)));
    // confere também que a soma bissecta: mesmo ângulo com as duas retas
    const erroAng = Math.abs(ang(s) - Math.abs(Math.atan2(det2([12, -5], s), dot([12, -5], s))));
    return Math.abs(s[0] - 8 * s[1]) + erroAng;
  })());

ok("Tangente do ângulo entre duas retas", String.raw`$7$`, 7,
  (() => {
    const d1 = [1, 2];
    const d2 = [3, -1];
    return Math.abs(det2(d1, d2) / dot(d1, d2));
  })());

ok("Distância entre retas paralelas", String.raw`$\dfrac{19}{10}$`, 19 / 10,
  (() => {
    // ponto qualquer da primeira reta, distância dele à segunda
    const P = [-1, 1]; // 3(-1) - 4(1) + 7 = 0
    return Math.abs(6 * P[0] - 8 * P[1] - 5) / Math.hypot(6, 8);
  })());

ok("Quarto vértice de um paralelogramo", String.raw`$\left(2,6\right)$`, [2, 6],
  (() => {
    const A = [1, 2];
    const B = [5, 3];
    const C = [6, 7];
    const D = [A[0] + C[0] - B[0], A[1] + C[1] - B[1]];
    // confere o paralelogramo: AB = DC e AD = BC
    const e = norma(sub(sub(B, A), sub(C, D))) + norma(sub(sub(D, A), sub(C, B)));
    return e < 1e-12 ? D : [NaN, NaN];
  })());

ok("Ortocentro de um triângulo", String.raw`$\left(1,1\right)$`, [1, 1],
  (() => {
    const A = [0, 0];
    const B = [4, 0];
    const C = [1, 3];
    // H = (x,y) com (H-A).(B-C) = 0 e (H-B).(A-C) = 0
    const [a1, b1] = sub(B, C);
    const [a2, b2] = sub(A, C);
    const c1 = dot(A, sub(B, C));
    const c2 = dot(B, sub(A, C));
    const D = a1 * b2 - a2 * b1;
    return [(c1 * b2 - c2 * b1) / D, (a1 * c2 - a2 * c1) / D];
  })());

ok("Circunferência circunscrita a triângulo retângulo", String.raw`$5$`, 5,
  (() => {
    const O = [3, 4]; // ponto médio da hipotenusa
    const rs = [[0, 0], [6, 0], [0, 8]].map((P) => norma(sub(P, O)));
    return Math.max(...rs) - Math.min(...rs) < 1e-12 ? rs[0] : NaN;
  })());

ok("Parâmetro para ângulo dado entre vetores", String.raw`$\dfrac{8}{3}$`, 8 / 3,
  raizes((m) => {
    const u = [1, m];
    const v = [2, 1];
    return dot(u, v) / (norma(u) * norma(v)) - Math.SQRT1_2;
  }, -10, 10).reduce((s, m) => s + m, 0));

ok("Área de quadrilátero pelo determinante", String.raw`$19$`, 19,
  (() => {
    const pts = [[0, 0], [5, 1], [6, 5], [1, 4]];
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const qn = pts[(i + 1) % pts.length];
      s += p[0] * qn[1] - qn[0] * p[1];
    }
    return Math.abs(s) / 2;
  })());

ok("Reta perpendicular a uma reta paramétrica", String.raw`$1$`, 1,
  (() => {
    const A = [2, -1];
    const d = [1, 1]; // diretor de m, normal de l
    // l: d.(X - A) = 0; interseção com x = 0
    return (dot(d, A) - d[0] * 0) / d[1];
  })());

ok("Distância de ponto a reta paramétrica", String.raw`$\dfrac{6\sqrt{5}}{5}$`, (6 * Math.sqrt(5)) / 5,
  (() => {
    const A = [1, 0];
    const d = [2, 1];
    const P = [3, 4];
    // mínimo real da distância ao longo da reta, sem usar a fórmula
    return extremo((t) => norma(sub([A[0] + t * d[0], A[1] + t * d[1]], P)), -50, 50, -1).y;
  })());

ok("Corda comum a duas circunferências", String.raw`$4\sqrt{3}$`, 4 * Math.sqrt(3),
  (() => {
    const ys = raizes((y) => 4 + y * y - 16, -10, 10); // x = 2 vem do eixo radical
    return Math.abs(ys[1] - ys[0]);
  })());

ok("Norma da diferença a partir da norma da soma", String.raw`$\sqrt{14}$`, Math.sqrt(14),
  (() => {
    const u = [3, 0];
    const t = raizes((th) => norma([u[0] + 4 * Math.cos(th), u[1] + 4 * Math.sin(th)]) - 6, 0, Math.PI)[0];
    const v = [4 * Math.cos(t), 4 * Math.sin(t)];
    return norma(sub(u, v));
  })());

// ===========================================================================
// 5. VETORES NO ESPAÇO E GEOMETRIA SÓLIDA
// ===========================================================================
ok("Produto misto com parâmetro e volume dado", String.raw`$8$`, 8,
  (() => {
    const A = [1, -2, 3];
    const vol = (m) => Math.abs(det3(sub([2, -1, -4], A), sub([0, 2, 0], A), sub([-1, m, 1], A)));
    return raizes((m) => vol(m) - 20, -20, 20).reduce((s, m) => s + m, 0);
  })());

ok("Coplanaridade por produto misto nulo", String.raw`$-4$`, -4,
  (() => {
    const A = [1, 1, 1];
    const misto = (k) => det3(sub([2, 3, 4], A), sub([0, 1, k], A), sub([1, 0, 2], A));
    return raizes(misto, -20, 20)[0];
  })());

ok("Distância entre retas reversas", String.raw`$\dfrac{\sqrt{3}}{3}$`, Math.sqrt(3) / 3,
  (() => {
    // minimiza a distância ponto a ponto nas duas retas, sem usar a fórmula
    let melhor = Infinity;
    for (let t = -20; t <= 20; t += 0.001) {
      for (let u = -20; u <= 20; u += 0.05) {
        const P = [1 + t, t, 0];
        const Q = [0, 1 + u, 1 + u];
        const d = norma(sub(P, Q));
        if (d < melhor) melhor = d;
      }
    }
    return melhor;
  })(), 2e-3);

ok("Ângulo entre reta e plano", String.raw`$\dfrac{4}{9}$`, 4 / 9,
  (() => {
    const d = [1, 2, 2];
    const n = [2, -1, 2];
    // projeta o diretor sobre o plano e mede o ângulo entre ele e sua projeção
    const k = dot(d, n) / dot(n, n);
    const proj = sub(d, n.map((c) => k * c));
    return Math.sin(Math.acos(dot(d, proj) / (norma(d) * norma(proj))));
  })());

ok("Circunferência de interseção esfera-plano", String.raw`$\sqrt{5}$`, Math.sqrt(5),
  (() => {
    // maior distância, dentro do plano x = 4, entre o centro do corte e a esfera
    const F = (y, z) => 16 + y * y + z * z - 16 + 2 * y - 6 * z + 5;
    const zs = raizes((z) => F(-1, z), -10, 10); // corte pela reta y = -1
    return Math.abs(zs[1] - zs[0]) / 2;
  })());

ok("Distância da origem ao plano por três pontos", String.raw`$\dfrac{13\sqrt{2}}{10}$`, (13 * Math.SQRT2) / 10,
  (() => {
    const A = [1, 0, 2];
    const n = cruz(sub([2, 1, 0], A), sub([0, 3, 1], A));
    return Math.abs(dot(n, A)) / norma(n);
  })());

ok("Reta interseção de dois planos", String.raw`$2$`, 2,
  (() => {
    // resolve o sistema 3x+y-z=3, x+y+z=7, y=1 diretamente
    // -> 3x - z = 2 e x + z = 6
    const x = (2 + 6) / 4;
    const z = 6 - x;
    const conf = Math.abs(3 * x + 1 - z - 3) + Math.abs(x + 1 + z - 7);
    return conf < 1e-12 ? x : NaN;
  })());

ok("Reta contida em um plano", String.raw`$-20$`, -20,
  (() => {
    const ponto = (t) => [3 + 4 * t, 1 - 4 * t, -3 + t];
    const A = raizes((a) => dot([4, -4, 1], [a, 2, -4]), -20, 20)[0];
    const P = ponto(0);
    const D = -(A * P[0] + 2 * P[1] - 4 * P[2]);
    // confere que outro ponto da reta também satisfaz
    const Q = ponto(7);
    const resid = A * Q[0] + 2 * Q[1] - 4 * Q[2] + D;
    return Math.abs(resid) < 1e-9 ? A + D : NaN;
  })());

ok("Área de triângulo no espaço", String.raw`$2\sqrt{14}$`, 2 * Math.sqrt(14),
  (() => {
    const A = [2, 1, 3];
    return norma(cruz(sub([-1, 2, 8], A), sub([4, 3, 1], A))) / 2;
  })());

ok("Combinação linear de três vetores", String.raw`$1$`, 1,
  (() => {
    const u = [2, 3, 0];
    const v = [1, 0, 1];
    const w = [0, 1, 2];
    const a = [3, 2, -1];
    const D = det3(u, v, w);
    const al = det3(a, v, w) / D;
    const be = det3(u, a, w) / D;
    const ga = det3(u, v, a) / D;
    const resid = norma(sub(a, [al * u[0] + be * v[0] + ga * w[0], al * u[1] + be * v[1] + ga * w[1], al * u[2] + be * v[2] + ga * w[2]]));
    return resid < 1e-12 ? al + be + ga : NaN;
  })());

ok("Ângulo entre dois planos", String.raw`$\dfrac{14}{15}$`, 14 / 15,
  (() => {
    const n1 = [3, 0, -4];
    const n2 = [2, 1, -2];
    return Math.abs(dot(n1, n2)) / (norma(n1) * norma(n2));
  })());

ok("Distância de ponto a reta no espaço", String.raw`$3$`, 3,
  extremo((t) => Math.hypot(2 * t - 1, t - 2, 1 - 2 * t - 3), -50, 50, -1).y);

ok("Volume de tetraedro", String.raw`$\dfrac{19}{6}$`, 19 / 6,
  Math.abs(det3([1, 2, 0], [0, 3, 1], [2, 0, 5])) / 6);

ok("Projeção ortogonal de ponto sobre plano", String.raw`$\dfrac{17}{9}$`, 17 / 9,
  (() => {
    const P = [1, 1, 1];
    const n = [1, 2, 2];
    // minimiza |X - P| sobre o plano, parametrizando com duas direções do plano
    const d1 = cruz(n, [1, 0, 0]);
    const d2 = cruz(n, d1);
    const X0 = [3, 0, 0]; // ponto do plano: 3 + 0 + 0 = 3
    let melhor = Infinity;
    let Q = null;
    for (let s = -3; s <= 3; s += 0.002) {
      for (let t = -3; t <= 3; t += 0.002) {
        const X = [X0[0] + s * d1[0] + t * d2[0], X0[1] + s * d1[1] + t * d2[1], X0[2] + s * d1[2] + t * d2[2]];
        const d = norma(sub(X, P));
        if (d < melhor) {
          melhor = d;
          Q = X;
        }
      }
    }
    return Q[0] + Q[1] + Q[2];
  })(), 1e-3);

ok("Esfera tangente a um plano", String.raw`$3$`, 3,
  (() => {
    const C = [1, 2, -1];
    // menor distância do centro a um ponto do plano 2x - 2y + z = 6
    return extremo((s) => {
      const X = [s, 0, 6 - 2 * s];
      return norma(sub(X, C));
    }, -50, 50, -1).y;
  })(), 1e-3);

ok("Secção plana de uma esfera", String.raw`$20\pi$`, 20 * Math.PI,
  Math.PI * (6 * 6 - 4 * 4));

ok("Altura do tetraedro regular", String.raw`$2\sqrt{6}$`, 2 * Math.sqrt(6),
  (() => {
    // constrói um tetraedro regular de aresta 6 e mede a altura
    const a = 6;
    const A = [0, 0, 0];
    const B = [a, 0, 0];
    const C = [a / 2, (a * Math.sqrt(3)) / 2, 0];
    const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, 0];
    const h = Math.sqrt(a * a - dot(sub(A, G), sub(A, G)));
    const D = [G[0], G[1], h];
    const arestas = [norma(sub(D, A)), norma(sub(D, B)), norma(sub(D, C))];
    return arestas.every((e) => Math.abs(e - a) < 1e-9) ? h : NaN;
  })());

ok("Cilindro inscrito em cone", String.raw`$48\pi$`, 48 * Math.PI,
  (() => {
    const R = 6;
    const H = 9;
    const r = 4;
    const h = raizes((z) => R * (1 - z / H) - r, 0, H)[0]; // raio do cone na altura z
    return Math.PI * r * r * h;
  })());

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
