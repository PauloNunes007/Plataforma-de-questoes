// Kit de verificação acoplada dos lotes 4–7 de Fundamentos de Cálculo e
// Geometria (pipeline v4).
//
// Por quê: FCG é a matéria em que a resposta mais raramente é um número solto —
// domínio de função, solução de inequação e imagem são CONJUNTOS; inversa e
// transformação de gráfico são EXPRESSÕES. O `calculo1_kit` só sabe conferir
// número, e o verificador avulso do lote 3 (`conferir-gabaritos-fcg-lote3.mjs`)
// casava questão e conta por subtópico — chave frágil que não escala.
//
// Aqui cada questão carrega a própria checagem, em três sabores:
//   q()         → resposta numérica: `checar()` recomputa o número a partir dos
//                 dados do enunciado e o LaTeX da alternativa certa é avaliado
//                 (parser do calculo1_kit) no mesmo valor.
//   qConjunto() → resposta é um conjunto: compara, ponto a ponto num grid, o
//                 predicado DO ENUNCIADO com o predicado DA ALTERNATIVA certa
//                 (zero divergências) e exige que todo distrator discorde em
//                 pelo menos um ponto. Pega extremo aberto/fechado trocado.
//   qFuncao()   → resposta é uma expressão: uma referência construída
//                 independentemente (inversa por bisseção, composição, etc.)
//                 tem de bater com a alternativa certa num grid, e nenhum
//                 distrator pode bater.
//
// Isso fecha o mesmo elo dos outros kits: "a conta que eu confiro" ↔ "o objeto
// que eu declaro" ↔ "a alternativa que o aluno vê".
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { avaliarLatex, simpson } from "./calculo1_kit.mjs";

// `simpson` viaja junto: questão de sólido de revolução se confere integrando o
// próprio sólido, em vez de repetir a fórmula do tronco/calota da resolução.
export { avaliarLatex, simpson };
export const R = String.raw;
export const MATERIA = "Fundamentos de Cálculo e Geometria";
const LETRAS = ["a", "b", "c", "d", "e"];

const brutas = [];

// ---------------------------------------------------------------------------
// Coleta
// ---------------------------------------------------------------------------

/** Resposta numérica. `valor` é a forma fechada; `checar` recomputa do zero. */
export function q(topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, valor, checar, opcoes = {}) {
  brutas.push({ tipo: "num", topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, valor, checar, opcoes });
}

/**
 * Resposta que é um conjunto (domínio, solução de inequação, imagem).
 * @param {{alvo:(x:number)=>boolean, cand:(x:number)=>boolean,
 *          distCand:((x:number)=>boolean)[], amostras:number[],
 *          criticos?:number[], folga?:number}} prova
 *   alvo     — predicado extraído do ENUNCIADO (a condição original)
 *   cand     — predicado da alternativa correta
 *   distCand — predicados dos 4 distratores, na mesma ordem de `distratores`
 *   criticos — pontos onde os dois predicados podem divergir por arredondamento
 *              (fronteiras); uma vizinhança `folga` em torno deles é pulada,
 *              mas os próprios pontos críticos são testados exatamente.
 */
export function qConjunto(topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, prova) {
  brutas.push({ tipo: "conj", topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, prova });
}

/**
 * Resposta que é uma expressão/função.
 * @param {{ref:(x:number)=>number, cand:(x:number)=>number,
 *          distCand:((x:number)=>number)[], amostras:number[], tol?:number}} prova
 *   ref — construída independentemente da alternativa (bisseção, composição…).
 */
export function qFuncao(topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, prova) {
  brutas.push({ tipo: "func", topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, prova });
}

// ---------------------------------------------------------------------------
// Comparadores tolerantes — a espinha dorsal da checagem de conjunto
// ---------------------------------------------------------------------------
// Num extremo do intervalo, `Math.pow(1/3, 3) >= 1/27` é decidido pelo último
// bit do float, não pela matemática. Com estes, o extremo exato devolve
// `ge = true` e `gt = false` — que é exatamente a distinção
// aberto/fechado que a checagem precisa medir.
const eps = (b) => 1e-9 * Math.max(1, Math.abs(b));
export const ge = (a, b) => a >= b - eps(b);
export const gt = (a, b) => a > b + eps(b);
export const le = (a, b) => a <= b + eps(b);
export const lt = (a, b) => a < b - eps(b);
export const igual = (a, b) => Math.abs(a - b) <= eps(b);

/** Grid uniforme fechado em [a,b], com os extras (pontos-chave) anexados. */
export const grade = (a, b, n = 801, extras = []) => [
  ...Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)),
  ...extras,
];

// ---------------------------------------------------------------------------
// Utilitários numéricos (uma variável)
// ---------------------------------------------------------------------------
export const d1 = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);

export function bissecao(f, a, b, iter = 300) {
  let fa = f(a);
  if (fa === 0) return a;
  for (let k = 0; k < iter; k++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm === 0) return m;
    if (fa * fm < 0) b = m;
    else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

/** Raízes de f em [a,b] por troca de sinal + varredura de |f| (pega raiz dupla). */
export function raizes(f, a, b, passos = 400000, dedupe = 1e-3) {
  const achadas = [];
  const guardar = (r) => {
    if (!isFinite(r)) return;
    if (achadas.some((x) => Math.abs(x - r) < dedupe)) return;
    achadas.push(r);
  };
  const h = (b - a) / passos;
  let xa = a;
  let fa = f(xa);
  for (let i = 1; i <= passos; i++) {
    const xb = a + i * h;
    const fb = f(xb);
    if (isFinite(fa) && isFinite(fb)) {
      if (fa === 0) guardar(xa);
      else if (fa * fb < 0) guardar(bissecao(f, xa, xb));
      else if (Math.abs(fb) < 1e-7 && Math.abs(f(xb + h)) > Math.abs(fb) && Math.abs(fa) > Math.abs(fb)) guardar(xb);
    }
    xa = xb;
    fa = fb;
  }
  return achadas.sort((p, r) => p - r);
}

export const contarRaizes = (f, a, b, passos, dedupe) => raizes(f, a, b, passos, dedupe).length;

/**
 * Raízes incluindo TANGÊNCIAS (f toca o zero sem trocar de sinal) — o caso de
 * $(x^2-5x+7)^{x-3}=1$, em que $x=3$ é mínimo da curva e não cruzamento.
 * Agrupa os pontos em que |f| fica abaixo de um limiar e refina cada grupo.
 */
export function raizesComTangencia(f, a, b, passos = 120000, limiar = 1e-3, dedupe = 1e-4) {
  const achadas = [];
  let ini = null;
  let fim = null;
  const fechar = () => {
    if (ini === null) return;
    const r = extremo((t) => Math.abs(f(t)), ini, fim === ini ? ini + (b - a) / passos : fim, "min", 4000).x;
    if (Math.abs(f(r)) < 1e-8 && !achadas.some((y) => Math.abs(y - r) < dedupe)) achadas.push(r);
    ini = null;
  };
  const h = (b - a) / passos;
  for (let i = 0; i <= passos; i++) {
    const x = a + i * h;
    const v = f(x);
    if (isFinite(v) && Math.abs(v) < limiar) {
      if (ini === null) ini = x;
      fim = x;
    } else fechar();
  }
  fechar();
  return achadas.sort((p, r) => p - r);
}

/**
 * Teste de ATINGIMENTO: $y$ pertence à imagem de $f$?
 * Procura de fato uma pré-imagem (troca de sinal + bisseção) em cada janela —
 * é isso que distingue imagem aberta de fechada sem eu declarar a resposta.
 * As janelas têm de ficar longe do ponto em que o float satura o limite
 * (usar [-20,20], não [-200,200], quando f tende a uma assíntota horizontal).
 */
export function naImagem(f, y, janelas) {
  return janelas.some(([a, b]) => {
    const fa = f(a) - y;
    const fb = f(b) - y;
    if (!isFinite(fa) || !isFinite(fb)) return false;
    if (fa === 0 || fb === 0) return true;
    if (fa * fb > 0) return false;
    const x = bissecao((t) => f(t) - y, a, b);
    return Math.abs(f(x) - y) < 1e-9;
  });
}

/** Extremo de f em [a,b] por varredura + refino por seção áurea. */
export function extremo(f, a, b, modo = "max", passos = 200000) {
  let melhor = a;
  let valor = modo === "max" ? -Infinity : Infinity;
  const h = (b - a) / passos;
  for (let i = 0; i <= passos; i++) {
    const x = a + i * h;
    const y = f(x);
    if (!isFinite(y)) continue;
    if (modo === "max" ? y > valor : y < valor) {
      valor = y;
      melhor = x;
    }
  }
  let e = Math.max(a, melhor - h);
  let d = Math.min(b, melhor + h);
  for (let k = 0; k < 200; k++) {
    const m1 = e + (d - e) / 3;
    const m2 = d - (d - e) / 3;
    const y1 = f(m1);
    const y2 = f(m2);
    if (modo === "max" ? y1 < y2 : y1 > y2) e = m1;
    else d = m2;
  }
  return { x: (e + d) / 2, y: f((e + d) / 2), valor, ponto: melhor };
}

/** Inversa numérica de f (monótona em [a,b]) avaliada em y. */
export function inversaNum(f, a, b, y) {
  return bissecao((x) => f(x) - y, a, b);
}

/** Menor período positivo de f, procurado entre candidatos p = m·base/n. */
export function periodo(f, candidatos, amostras = [0.13, 0.47, 0.91, 1.37, 2.03, 2.71, 3.33]) {
  for (const p of candidatos) {
    if (p <= 0) continue;
    if (amostras.every((x) => Math.abs(f(x + p) - f(x)) < 1e-7)) return p;
  }
  return NaN;
}

// ---------------------------------------------------------------------------
// Utilitários vetoriais / geométricos (Boulos & Camargo)
// ---------------------------------------------------------------------------
export const V = {
  soma: (a, b) => a.map((x, i) => x + b[i]),
  sub: (a, b) => a.map((x, i) => x - b[i]),
  esc: (k, a) => a.map((x) => k * x),
  interno: (a, b) => a.reduce((s, x, i) => s + x * b[i], 0),
  cruz: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norma: (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0)),
  misto: (a, b, c) => V.interno(a, V.cruz(b, c)),
  unit: (a) => V.esc(1 / V.norma(a), a),
};

/** Distância de P à reta {A + t·u} (2D ou 3D). */
export function distPontoReta(P, A, u) {
  const w = V.sub(P, A);
  if (P.length === 2) return Math.abs(w[0] * u[1] - w[1] * u[0]) / V.norma(u);
  return V.norma(V.cruz(w, u)) / V.norma(u);
}

/** Distância de P ao plano n·X = d. */
export const distPontoPlano = (P, n, d) => Math.abs(V.interno(n, P) - d) / V.norma(n);

/** Distância entre as retas reversas {A+t·u} e {B+s·v}. */
export function distRetasReversas(A, u, B, v) {
  const n = V.cruz(u, v);
  return Math.abs(V.interno(V.sub(B, A), n)) / V.norma(n);
}

/** Ângulo (em radianos, entre 0 e π/2) entre duas direções. */
export const anguloDirecoes = (u, v) =>
  Math.acos(Math.min(1, Math.abs(V.interno(u, v)) / (V.norma(u) * V.norma(v))));

/** Projeção ortogonal de P sobre a reta {A + t·u}. */
export function projRetaPonto(P, A, u) {
  const t = V.interno(V.sub(P, A), u) / V.interno(u, u);
  return V.soma(A, V.esc(t, u));
}

/** Projeção ortogonal de P sobre o plano n·X = d. */
export function projPlanoPonto(P, n, d) {
  const t = (d - V.interno(n, P)) / V.interno(n, n);
  return V.soma(P, V.esc(t, n));
}

/** Área do triângulo de vértices A, B, C (2D ou 3D). */
export function areaTriangulo(A, B, C) {
  const u = V.sub(B, A);
  const v = V.sub(C, A);
  if (A.length === 2) return Math.abs(u[0] * v[1] - u[1] * v[0]) / 2;
  return V.norma(V.cruz(u, v)) / 2;
}

/** Volume do tetraedro ABCD. */
export const volumeTetraedro = (A, B, C, D) => Math.abs(V.misto(V.sub(B, A), V.sub(C, A), V.sub(D, A))) / 6;

// ---------------------------------------------------------------------------
// Montagem final + conferência
// ---------------------------------------------------------------------------
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

function conferirNumerica(b, ref, falhas, avisos) {
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
    avisos.push(`${ref}: sem recomputação numérica`);
  }
  if (b.opcoes.semLatex) return;
  const lido = avaliarLatex(b.correta);
  if (lido == null) avisos.push(`${ref}: LaTeX da correta não avaliado — "${b.correta}"`);
  else if (!perto(lido, b.valor, b.opcoes.tolLatex ?? 1e-6))
    falhas.push(`${ref}: alternativa correta "${b.correta}" vale ${lido}, mas valor=${b.valor}`);
  b.distratores.forEach((d, k) => {
    const dv = avaliarLatex(d);
    if (dv != null && perto(dv, b.valor, 1e-9)) falhas.push(`${ref}: distrator ${k + 1} "${d}" vale o mesmo que a correta`);
  });
}

function conferirConjunto(b, ref, falhas) {
  const { alvo, cand, distCand, amostras, criticos = [], folga = 1e-6 } = b.prova;
  if (distCand.length !== b.distratores.length)
    return falhas.push(`${ref}: ${distCand.length} predicados para ${b.distratores.length} distratores`);
  const perto_ = (x) => criticos.some((c) => Math.abs(x - c) < folga && x !== c);
  let testados = 0;
  const divergencias = [];
  const marcam = distCand.map(() => false);
  for (const x of amostras) {
    if (perto_(x)) continue;
    testados++;
    let a;
    let c;
    try {
      a = !!alvo(x);
      c = !!cand(x);
    } catch (e) {
      return falhas.push(`${ref}: predicado lançou ${e.message} em x=${x}`);
    }
    if (a !== c && divergencias.length < 6) divergencias.push(`x=${x} (enunciado ${a}, alternativa ${c})`);
    distCand.forEach((p, k) => {
      if (!!p(x) !== a) marcam[k] = true;
    });
  }
  if (divergencias.length) falhas.push(`${ref}: alternativa correta discorda do enunciado em ${divergencias.join(", ")}`);
  if (testados < 50) falhas.push(`${ref}: só ${testados} amostras efetivas — grid insuficiente`);
  marcam.forEach((ok, k) => {
    if (!ok) falhas.push(`${ref}: distrator ${k + 1} ("${b.distratores[k]}") descreve o MESMO conjunto da correta`);
  });
}

function conferirFuncao(b, ref, falhas) {
  const { ref: referencia, cand, distCand, amostras, tol = 1e-6 } = b.prova;
  if (distCand.length !== b.distratores.length)
    return falhas.push(`${ref}: ${distCand.length} funções para ${b.distratores.length} distratores`);
  const marcam = distCand.map(() => false);
  const divergencias = [];
  let testados = 0;
  for (const x of amostras) {
    let alvo;
    let c;
    try {
      alvo = referencia(x);
      c = cand(x);
    } catch (e) {
      return falhas.push(`${ref}: avaliação lançou ${e.message} em x=${x}`);
    }
    if (!isFinite(alvo)) continue;
    testados++;
    if (!perto(alvo, c, tol) && divergencias.length < 6) divergencias.push(`x=${x}: referência ${alvo} × alternativa ${c}`);
    distCand.forEach((p, k) => {
      const dv = p(x);
      if (!isFinite(dv) || !perto(alvo, dv, tol)) marcam[k] = true;
    });
  }
  if (divergencias.length) falhas.push(`${ref}: alternativa correta diverge da referência em ${divergencias.join("; ")}`);
  if (testados < 8) falhas.push(`${ref}: só ${testados} amostras efetivas`);
  marcam.forEach((ok, k) => {
    if (!ok) falhas.push(`${ref}: distrator ${k + 1} ("${b.distratores[k]}") é idêntico à correta no grid`);
  });
}

export function finalizar(nomeArquivo, semente) {
  const falhas = [];
  const avisos = [];
  const vistos = new Map();

  brutas.forEach((b, idx) => {
    const ref = `#${idx + 1} [${b.topico}] ${b.subtopico}`;
    if (!b.subtopico) falhas.push(`${ref}: subtópico vazio`);
    if (b.distratores.length !== 4) falhas.push(`${ref}: ${b.distratores.length} distratores (esperado 4)`);
    const todas = [b.correta, ...b.distratores];
    if (new Set(todas).size !== todas.length) falhas.push(`${ref}: alternativas repetidas entre si`);
    const chave = b.enunciado.toLowerCase().replace(/\s+/g, " ").trim();
    if (vistos.has(chave)) falhas.push(`${ref}: enunciado idêntico ao de ${vistos.get(chave)}`);
    else vistos.set(chave, ref);

    if (b.tipo === "num") conferirNumerica(b, ref, falhas, avisos);
    else if (b.tipo === "conj") conferirConjunto(b, ref, falhas);
    else conferirFuncao(b, ref, falhas);
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
      materia: MATERIA,
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

  const conta = (chave) => {
    const m = new Map();
    for (const x of questoes) m.set(x[chave], (m.get(x[chave]) || 0) + 1);
    return [...m.entries()].sort();
  };
  console.log(`${questoes.length} questões escritas em ${destino}`);
  console.log("por tópico:");
  conta("topico").forEach(([t, n]) => console.log(`  ${String(n).padStart(3)}  ${t}`));
  console.log("por dificuldade:", Object.fromEntries(conta("dificuldade")));
  console.log("por letra:", Object.fromEntries(conta("gabarito")));
  const porTipo = brutas.reduce((m, b) => ({ ...m, [b.tipo]: (m[b.tipo] || 0) + 1 }), {});
  console.log("conferência por tipo:", porTipo);
  if (avisos.length) {
    console.log(`\n${avisos.length} aviso(s):`);
    avisos.forEach((a) => console.log(`  - ${a}`));
  }
}
