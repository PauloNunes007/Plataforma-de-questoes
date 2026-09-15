// Kit compartilhado das levas de Cálculo II e Cálculo III (2026-09-15).
//
// Mesma ideia do `calculo1_kit.mjs` (cada questão carrega o valor exato da
// resposta E uma closure que o recomputa numericamente; `finalizar()` só
// escreve o JSON se as duas coisas baterem entre si e com o LaTeX da
// alternativa do gabarito), com três diferenças:
//
//   1. a matéria vem por questão — o mesmo arquivo pode misturar Cálculo II e
//      Cálculo III, e os lotes daqui cobrem as duas;
//   2. o ferramental numérico é multivariável: integral dupla/tripla iterada,
//      integral de linha (escalar e vetorial), integral de superfície e fluxo
//      sobre superfície parametrizada, gradiente/divergente/rotacional por
//      diferença central, e RK4 (escalar e sistema) para conferir EDO;
//   3. a conferência de Cálculo III é deliberadamente feita PELO OUTRO LADO do
//      teorema: questão de Green/Stokes/Gauss é conferida integrando
//      diretamente a curva/superfície parametrizada, nunca repetindo a conta
//      da resolução. Se o teorema foi aplicado errado, os dois lados discordam.
//
// O avaliador de LaTeX e os utilitários de uma variável vêm do kit de
// Cálculo I — um parser só, sem cópia.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { avaliarLatex, simpson, d1, d2, bissecao, newton, contarRaizes, extremo } from "./calculo1_kit.mjs";

export { avaliarLatex, simpson, d1, d2, bissecao, newton, contarRaizes, extremo };
export const R = String.raw;
const LETRAS = ["a", "b", "c", "d", "e"];

const brutas = [];

/**
 * @param {string} materia    "Cálculo II" ou "Cálculo III"
 * @param {string} topico     tópico da ementa (exatamente como no banco)
 * @param {string} subtopico  granularidade fina (nunca vazio)
 * @param {"facil"|"medio"|"dificil"} dificuldade
 * @param {string} enunciado
 * @param {string} correta        alternativa certa (curta, só o valor)
 * @param {string[]} distratores  as outras 4, mesma forma/tamanho
 * @param {string} resolucao      todo o raciocínio mora aqui
 * @param {number} valor          valor exato da resposta
 * @param {() => number} checar   recomputação numérica independente
 * @param {{tol?: number, tolLatex?: number, semLatex?: boolean}} [opcoes]
 */
export function q(materia, topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, valor, checar, opcoes = {}) {
  brutas.push({ materia, topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, valor, checar, opcoes });
}

// ===========================================================================
// Álgebra vetorial (arrays comuns de 2 ou 3 componentes)
// ===========================================================================
export const soma = (a, b) => a.map((x, i) => x + b[i]);
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const esc = (k, a) => a.map((x) => k * x);
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norma = (a) => Math.sqrt(dot(a, a));
// produto vetorial em 2D devolve só a componente z (usada em curvatura plana)
export const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];

// ===========================================================================
// Derivadas numéricas
// ===========================================================================
// derivada de uma parametrização vetorial r(t)
export const dvec = (r, t, h = 1e-5) => {
  const a = r(t + h);
  const b = r(t - h);
  return a.map((x, i) => (x - b[i]) / (2 * h));
};
export const d2vec = (r, t, h = 1e-4) => {
  const a = r(t + h);
  const m = r(t);
  const b = r(t - h);
  return a.map((x, i) => (x - 2 * m[i] + b[i]) / (h * h));
};
export const d3vec = (r, t, h = 1e-2) => {
  const a = r(t + 2 * h);
  const b = r(t + h);
  const c = r(t - h);
  const e = r(t - 2 * h);
  return a.map((x, i) => (x - 2 * b[i] + 2 * c[i] - e[i]) / (2 * h ** 3));
};

// derivada parcial de f(...args) na direção do índice k
export function parcial(f, p, k, h = 1e-5) {
  const a = p.slice();
  const b = p.slice();
  a[k] += h;
  b[k] -= h;
  return (f(...a) - f(...b)) / (2 * h);
}
export function parcial2(f, p, k, j, h = 1e-4) {
  return parcial((...x) => parcial(f, x, j, h), p, k, h);
}
export const gradiente = (f, p, h = 1e-5) => p.map((_, k) => parcial(f, p, k, h));
export const divergente = (F, p, h = 1e-5) => p.reduce((s, _, k) => s + parcial((...x) => F(...x)[k], p, k, h), 0);
export const rotacional = (F, p, h = 1e-5) => {
  const dF = (i, k) => parcial((...x) => F(...x)[i], p, k, h);
  return [dF(2, 1) - dF(1, 2), dF(0, 2) - dF(2, 0), dF(1, 0) - dF(0, 1)];
};
// curvatura de uma curva parametrizada (2D ou 3D)
export function curvatura(r, t) {
  const v = dvec(r, t, 1e-4);
  const a = d2vec(r, t, 1e-3);
  const num = v.length === 2 ? Math.abs(cross2(v, a)) : norma(cross(v, a));
  return num / norma(v) ** 3;
}
export function torcao(r, t) {
  const v = dvec(r, t, 1e-3);
  const a = d2vec(r, t, 1e-2);
  const j = d3vec(r, t, 2e-2);
  const c = cross(v, a);
  return dot(c, j) / dot(c, c);
}

// ===========================================================================
// Integrais múltiplas (Simpson iterado)
// ===========================================================================
// x de a a b, y de g1(x) a g2(x)  — limites podem ser número ou função
const lim = (g, x) => (typeof g === "function" ? g(x) : g);

export function dupla(f, a, b, g1, g2, n = 200) {
  return simpson((x) => {
    const y0 = lim(g1, x);
    const y1 = lim(g2, x);
    if (!isFinite(y0) || !isFinite(y1) || y1 === y0) return 0;
    return simpson((y) => f(x, y), y0, y1, n);
  }, a, b, n);
}

// integral em coordenadas polares: f recebe (x, y) cartesianos; o jacobiano r
// entra aqui, então o autor escreve a função como ela aparece no enunciado
export function duplaPolar(f, t0, t1, r0, r1, n = 200) {
  return simpson((t) => {
    const a = lim(r0, t);
    const b = lim(r1, t);
    if (b === a) return 0;
    return simpson((r) => f(r * Math.cos(t), r * Math.sin(t)) * r, a, b, n);
  }, t0, t1, n);
}

export function tripla(f, a, b, g1, g2, h1, h2, n = 40) {
  return simpson((x) => {
    const y0 = lim(g1, x);
    const y1 = lim(g2, x);
    if (y1 === y0) return 0;
    return simpson((y) => {
      const z0 = typeof h1 === "function" ? h1(x, y) : h1;
      const z1 = typeof h2 === "function" ? h2(x, y) : h2;
      if (z1 === z0) return 0;
      return simpson((z) => f(x, y, z), z0, z1, n);
    }, y0, y1, n);
  }, a, b, n);
}

// cilíndricas: f(x,y,z) cartesiano; limites em (theta, r, z)
export function triplaCilindrica(f, t0, t1, r0, r1, z0, z1, n = 60) {
  return simpson((t) => {
    const ra = lim(r0, t);
    const rb = lim(r1, t);
    return simpson((r) => {
      const za = typeof z0 === "function" ? z0(r, t) : z0;
      const zb = typeof z1 === "function" ? z1(r, t) : z1;
      if (zb === za) return 0;
      return simpson((z) => f(r * Math.cos(t), r * Math.sin(t), z) * r, za, zb, n);
    }, ra, rb, n);
  }, t0, t1, n);
}

// esféricas: limites em (theta, phi, rho); jacobiano rho^2 sen(phi) entra aqui
export function triplaEsferica(f, t0, t1, p0, p1, r0, r1, n = 60) {
  return simpson((t) => {
    const pa = lim(p0, t);
    const pb = lim(p1, t);
    return simpson((p) => {
      const ra = typeof r0 === "function" ? r0(p, t) : r0;
      const rb = typeof r1 === "function" ? r1(p, t) : r1;
      if (rb === ra) return 0;
      return simpson((rho) => {
        const x = rho * Math.sin(p) * Math.cos(t);
        const y = rho * Math.sin(p) * Math.sin(t);
        const z = rho * Math.cos(p);
        return f(x, y, z) * rho * rho * Math.sin(p);
      }, ra, rb, n);
    }, pa, pb, n);
  }, t0, t1, n);
}

// ===========================================================================
// Integrais de linha e de superfície
// ===========================================================================
// ∫_C f ds  — f escalar de (x,y[,z]), r(t) parametrização
export const linhaEscalar = (f, r, a, b, n = 4000) =>
  simpson((t) => f(...r(t)) * norma(dvec(r, t)), a, b, n);

// ∫_C F·dr — F campo vetorial
export const linhaVetorial = (F, r, a, b, n = 4000) =>
  simpson((t) => dot(F(...r(t)), dvec(r, t)), a, b, n);

// ∫∫_S f dS — S(u,v) parametrização; dS = |S_u × S_v| du dv
export function superficieEscalar(f, S, u0, u1, v0, v1, n = 200) {
  return simpson((u) => {
    const a = lim(v0, u);
    const b = lim(v1, u);
    return simpson((v) => {
      const Su = dvec((x) => S(x, v), u);
      const Sv = dvec((y) => S(u, y), v);
      return f(...S(u, v)) * norma(cross(Su, Sv));
    }, a, b, n);
  }, u0, u1, n);
}

// ∫∫_S F·dS — orientação dada por S_u × S_v (passe `sinal` = -1 para inverter)
export function fluxo(F, S, u0, u1, v0, v1, n = 200, sinal = 1) {
  return (
    sinal *
    simpson((u) => {
      const a = lim(v0, u);
      const b = lim(v1, u);
      return simpson((v) => {
        const Su = dvec((x) => S(x, v), u);
        const Sv = dvec((y) => S(u, y), v);
        return dot(F(...S(u, v)), cross(Su, Sv));
      }, a, b, n);
    }, u0, u1, n)
  );
}

// ===========================================================================
// EDO
// ===========================================================================
// y' = f(t, y), escalar
export function rk4(f, t0, y0, t1, n = 20000) {
  const h = (t1 - t0) / n;
  let t = t0;
  let y = y0;
  for (let i = 0; i < n; i++) {
    const k1 = f(t, y);
    const k2 = f(t + h / 2, y + (h * k1) / 2);
    const k3 = f(t + h / 2, y + (h * k2) / 2);
    const k4 = f(t + h, y + h * k3);
    y += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    t += h;
  }
  return y;
}

// Y' = F(t, Y), vetorial (usada para EDO de 2ª ordem: Y = [y, y'])
export function rk4Sistema(F, t0, Y0, t1, n = 20000) {
  const h = (t1 - t0) / n;
  let t = t0;
  let Y = Y0.slice();
  const anda = (Y, k, f) => Y.map((y, i) => y + h * k * f[i]);
  for (let i = 0; i < n; i++) {
    const k1 = F(t, Y);
    const k2 = F(t + h / 2, anda(Y, 0.5, k1));
    const k3 = F(t + h / 2, anda(Y, 0.5, k2));
    const k4 = F(t + h, anda(Y, 1, k3));
    Y = Y.map((y, i) => y + (h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6);
    t += h;
  }
  return Y;
}

// instante em que a solução de y' = f(t,y) cruza `alvo`
export function tempoEm(f, t0, y0, alvo, tMax, n = 4000) {
  const h = (tMax - t0) / n;
  let t = t0;
  let y = y0;
  for (let i = 0; i < n; i++) {
    const prox = rk4(f, t, y, t + h, 40);
    if ((y - alvo) * (prox - alvo) <= 0) return bissecao((s) => rk4(f, t, y, s, 400) - alvo, t, t + h);
    y = prox;
    t += h;
  }
  return NaN;
}

// ===========================================================================
// Otimização numérica (confere Lagrange / máximos e mínimos sem repetir a conta)
// ===========================================================================
// varre uma caixa e refina por passos que encolhem
export function otimizar(f, caixa, modo = "max", passos = 60, refinos = 60) {
  let melhor = null;
  const dim = caixa.length;
  const total = Math.pow(passos + 1, dim);
  for (let c = 0; c < total; c++) {
    let resto = c;
    const p = [];
    for (let k = 0; k < dim; k++) {
      const i = resto % (passos + 1);
      resto = Math.floor(resto / (passos + 1));
      p.push(caixa[k][0] + ((caixa[k][1] - caixa[k][0]) * i) / passos);
    }
    const v = f(...p);
    if (!isFinite(v)) continue;
    if (melhor === null || (modo === "max" ? v > melhor.valor : v < melhor.valor)) melhor = { p, valor: v };
  }
  let passo = caixa.map(([a, b]) => (b - a) / passos);
  for (let r = 0; r < refinos; r++) {
    let mudou = false;
    for (let k = 0; k < dim; k++) {
      for (const s of [1, -1]) {
        const p = melhor.p.slice();
        p[k] += s * passo[k];
        if (p[k] < caixa[k][0] || p[k] > caixa[k][1]) continue;
        const v = f(...p);
        if (!isFinite(v)) continue;
        if (modo === "max" ? v > melhor.valor : v < melhor.valor) {
          melhor = { p, valor: v };
          mudou = true;
        }
      }
    }
    if (!mudou) passo = passo.map((x) => x / 2);
  }
  return melhor;
}

// ===========================================================================
// Montagem final + verificação
// ===========================================================================
function sequenciaDeLetras(n, semente) {
  const base = [];
  for (let i = 0; i < n; i++) base.push(LETRAS[i % 5]);
  let s = semente;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

const perto = (a, b, tol) => {
  if (!isFinite(a) || !isFinite(b)) return a === b;
  const escala = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= tol * escala;
};

export function finalizar(nomeArquivo, semente) {
  const falhas = [];
  const avisos = [];

  brutas.forEach((b, idx) => {
    const ref = `#${idx + 1} [${b.materia} / ${b.topico}] ${b.subtopico}`;
    if (typeof b.checar === "function") {
      let v;
      try {
        v = b.checar();
      } catch (e) {
        falhas.push(`${ref}: checar() lançou ${e.message}`);
        return;
      }
      const tol = b.opcoes.tol ?? 1e-4;
      if (!perto(v, b.valor, tol)) falhas.push(`${ref}: checar()=${v} != valor=${b.valor} (tol ${tol})`);
    } else {
      avisos.push(`${ref}: sem checagem numérica`);
    }
    if (!b.opcoes.semLatex) {
      const lido = avaliarLatex(b.correta);
      if (lido == null) avisos.push(`${ref}: LaTeX da correta não avaliado — "${b.correta}"`);
      else if (!perto(lido, b.valor, b.opcoes.tolLatex ?? 1e-6))
        falhas.push(`${ref}: alternativa correta "${b.correta}" vale ${lido}, mas valor=${b.valor}`);
      b.distratores.forEach((d, k) => {
        const dv = avaliarLatex(d);
        if (dv != null && perto(dv, b.valor, 1e-9))
          falhas.push(`${ref}: distrator ${k + 1} "${d}" vale o mesmo que a correta`);
      });
    }
    if (b.distratores.length !== 4) falhas.push(`${ref}: ${b.distratores.length} distratores (esperado 4)`);
    if (!b.subtopico) falhas.push(`${ref}: subtópico vazio`);
  });

  if (falhas.length) {
    console.log(`\n${falhas.length} FALHA(S) DE CONFERÊNCIA — nada foi escrito:`);
    falhas.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }

  const letras = sequenciaDeLetras(brutas.length, semente);
  const questoes = brutas.map((b, i) => {
    const certa = letras[i];
    const alternativas = {};
    let k = 0;
    for (const l of LETRAS) alternativas[l] = l === certa ? b.correta : b.distratores[k++];
    return {
      materia: b.materia,
      topico: b.topico,
      subtopico: b.subtopico,
      dificuldade: b.dificuldade,
      enunciado: b.enunciado,
      alternativas,
      gabarito: certa,
      resolucao: b.resolucao,
      instituicao: null,
      ano: null,
      tikz_code: null,
    };
  });

  const aqui = dirname(fileURLToPath(import.meta.url));
  const destino = resolve(aqui, "..", nomeArquivo);
  writeFileSync(destino, JSON.stringify(questoes, null, 2), "utf8");

  const conta = (campo) => {
    const m = new Map();
    for (const x of questoes) m.set(x[campo], (m.get(x[campo]) || 0) + 1);
    return m;
  };
  console.log(`${questoes.length} questões escritas em ${destino}`);
  console.log("por tópico:");
  [...conta("topico").entries()].forEach(([t, n]) => console.log(`  ${String(n).padStart(3)}  ${t}`));
  console.log("por dificuldade:", Object.fromEntries(conta("dificuldade")));
  console.log("por letra:", Object.fromEntries([...conta("gabarito").entries()].sort()));
  console.log(`conferência: ${brutas.filter((b) => typeof b.checar === "function").length}/${brutas.length} com recálculo numérico`);
  if (avisos.length) {
    console.log(`\n${avisos.length} aviso(s):`);
    avisos.forEach((a) => console.log(`  - ${a}`));
  }
}
