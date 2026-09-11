// Kit compartilhado das levas 5–9 de Cálculo I (equalização do banco: todos os
// tópicos da ementa subindo para o patamar de "Limites", 57 questões).
//
// Por que existe: o lote 4 carregava, num arquivo só, o gerador E um verificador
// numérico escrito à parte (`conferir-gabaritos-calculo1-lote4.mjs`, ~600 linhas
// para 89 questões). Com 413 questões novas isso não escala e, pior, o
// verificador separado casa questão e conta por SUBTÓPICO — chave frágil.
// Aqui cada questão carrega junto:
//   - `valor`: o valor exato da resposta em ponto flutuante (forma fechada);
//   - `checar`: uma recomputação NUMÉRICA independente (Simpson, diferença
//     central, varredura de raízes, Newton) a partir dos dados do enunciado.
// `finalizar()` só escreve o JSON se, para toda questão, `checar() ≈ valor` E o
// LaTeX da alternativa marcada como gabarito for avaliado (parser abaixo) no
// mesmo `valor`. Isso fecha os dois elos: "a conta que eu confiro" ↔ "o número
// que eu declaro" ↔ "a letra que o aluno vê".
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const R = String.raw;
export const MATERIA = "Cálculo I";
const LETRAS = ["a", "b", "c", "d", "e"];

// ===========================================================================
// Coleta das questões
// ===========================================================================
const brutas = [];

/**
 * @param {string} topico     tópico da ementa (exatamente como no banco)
 * @param {string} subtopico  granularidade fina (nunca vazio)
 * @param {"medio"|"dificil"} dificuldade
 * @param {string} enunciado  LaTeX inline com $...$
 * @param {string} correta    alternativa certa (curta, só o valor)
 * @param {string[]} distratores  as outras 4, no mesmo estilo/forma
 * @param {string} resolucao  todo o raciocínio mora aqui
 * @param {number} valor      valor exato da resposta (forma fechada em JS)
 * @param {() => number} checar  recomputação numérica independente
 * @param {{tol?: number, tolLatex?: number, semLatex?: boolean}} [opcoes]
 */
export function q(topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, valor, checar, opcoes = {}) {
  brutas.push({ topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao, valor, checar, opcoes });
}

// ===========================================================================
// Utilitários numéricos para as closures `checar`
// ===========================================================================
export const d1 = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
export const d2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
export const d3 = (f, x, h = 1e-2) => (f(x + 2 * h) - 2 * f(x + h) + 2 * f(x - h) - f(x - 2 * h)) / (2 * h ** 3);
export const d4 = (f, x, h = 0.02) =>
  (f(x - 2 * h) - 4 * f(x - h) + 6 * f(x) - 4 * f(x + h) + f(x + 2 * h)) / h ** 4;

export function simpson(f, a, b, n = 20000) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

// Integrando que explode (de forma integrável) num extremo: blocos diádicos
// encolhendo rumo à singularidade. Simpson uniforme não enxerga a cauda.
// O teto de blocos evita que a largura caia abaixo do epsilon relativo do ponto
// (aí o extremo colapsa sobre a singularidade e a avaliação vira NaN).
export function simpsonSingular(f, sing, fim, blocos = 45, n = 2000) {
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

// Intervalo infinito [a, +inf), a > 0: blocos [a·2^k, a·2^(k+1)].
export function simpsonInfinito(f, a, blocos = 70, n = 2000) {
  let total = 0;
  let x = a;
  for (let k = 0; k < blocos; k++) {
    total += simpson(f, x, 2 * x, n);
    x *= 2;
  }
  return total;
}

// Limite lateral por amostragem + extrapolação de Aitken (Δ²): avalia f em
// h, h/2 e h/4 e acelera a convergência. É o que permite conferir "valor do
// prolongamento contínuo" sem repetir a álgebra da resolução.
export function limite(f, p, lado = 1, h0 = 1e-3) {
  const v = [];
  for (let k = 0; k < 3; k++) v.push(f(p + (lado * h0) / 2 ** k));
  const [a, b, c] = v;
  const den = c - 2 * b + a;
  if (!isFinite(den) || Math.abs(den) < 1e-13) return c;
  return c - (c - b) ** 2 / den;
}

// Resolve g(t) = alvo em t (bisseção num intervalo dado) — usada quando a
// resposta é o PARÂMETRO que torna a função contínua/derivável: o verificador
// procura o parâmetro numericamente em vez de repetir a conta da resolução.
export function resolverParametro(g, alvo, a, b) {
  return bissecao((t) => g(t) - alvo, a, b);
}

export function bissecao(f, a, b, iter = 200) {
  let fa = f(a);
  for (let i = 0; i < iter; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fa * fm <= 0) b = m;
    else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

export function newton(f, x0, iter = 200) {
  let x = x0;
  for (let i = 0; i < iter; i++) {
    const dx = d1(f, x, 1e-6);
    if (!isFinite(dx) || dx === 0) break;
    const passo = f(x) / dx;
    x -= passo;
    if (Math.abs(passo) < 1e-14) break;
  }
  return x;
}

// Conta raízes varrendo |f| abaixo de um limiar e agrupando: troca de sinal
// sozinha erra em raiz dupla (a curva tangencia sem trocar de sinal). O dedupe
// precisa ser folgado — perto de uma tangência |f| fica achatado e vários
// pontos distintos passam no teste, virando "raízes" diferentes.
export function contarRaizes(f, a, b, passos = 200000, dedupe = 1e-3) {
  const h = (b - a) / passos;
  const raizes = [];
  let ant = f(a);
  for (let i = 1; i <= passos; i++) {
    const x = a + i * h;
    const v = f(x);
    if (ant === 0 || (ant < 0) !== (v < 0)) {
      const r = bissecao(f, x - h, x);
      if (!raizes.some((p) => Math.abs(p - r) < dedupe)) raizes.push(r);
    } else if (Math.abs(v) < 1e-7) {
      if (!raizes.some((p) => Math.abs(p - x) < dedupe)) raizes.push(x);
    }
    ant = v;
  }
  return raizes.length;
}

// Máximo/mínimo de f em [a,b] por varredura.
export function extremo(f, a, b, modo = "max", passos = 200000) {
  const h = (b - a) / passos;
  let melhorX = a;
  let melhorV = f(a);
  for (let i = 1; i <= passos; i++) {
    const x = a + i * h;
    const v = f(x);
    if (!isFinite(v)) continue;
    if (!isFinite(melhorV) || (modo === "max" ? v > melhorV : v < melhorV)) {
      melhorV = v;
      melhorX = x;
    }
  }
  return { x: melhorX, valor: melhorV };
}

// Comprimento de arco de y = f(x) em [a,b].
export const comprimentoArco = (f, a, b, n = 40000) =>
  simpson((x) => Math.sqrt(1 + d1(f, x, 1e-6) ** 2), a, b, n);

// Soma de Riemann com n subintervalos (ponto à direita) — usada quando o
// enunciado É uma soma e a resposta é a integral.
export function riemannDireita(f, a, b, n = 400000) {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 1; i <= n; i++) s += f(a + i * h);
  return s * h;
}

// ===========================================================================
// Avaliador do LaTeX das alternativas → número
// ---------------------------------------------------------------------------
// Recursivo-descendente sobre o subconjunto de LaTeX que as levas usam. Deixa
// o verificador independente da formatação: é ele que confere que a string que
// o aluno lê na alternativa do gabarito vale exatamente o número conferido.
// Devolve `null` quando não entende a expressão (aí a checagem vira aviso).
// ===========================================================================
export function avaliarLatex(bruto) {
  if (bruto == null) return null;
  let s = String(bruto).trim();
  s = s.replace(/^\$+|\$+$/g, "").trim();
  if (!s) return null;
  // limpeza de espaçadores e decorações sem efeito numérico
  s = s
    .replace(/\\(?:,|;|:|!|quad|qquad)/g, " ")
    .replace(/\\left|\\right/g, "")
    .replace(/\\displaystyle/g, " ")
    .replace(/\\mathrm\{([^{}]*)\}/g, "$1")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\{,\}/g, ".")
    .replace(/\\%/g, "");

  let i = 0;
  const espaco = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const olhar = (str) => {
    espaco();
    return s.startsWith(str, i);
  };
  const consumir = (str) => {
    espaco();
    if (!s.startsWith(str, i)) return false;
    i += str.length;
    return true;
  };
  // conteúdo de um grupo {...} respeitando aninhamento
  const grupo = () => {
    espaco();
    if (s[i] !== "{") return atomo();
    let nivel = 0;
    const inicio = ++i;
    while (i < s.length) {
      if (s[i] === "\\") i += 2;
      else if (s[i] === "{") {
        nivel++;
        i++;
      } else if (s[i] === "}") {
        if (nivel === 0) break;
        nivel--;
        i++;
      } else i++;
    }
    const dentro = s.slice(inicio, i);
    i++; // fecha }
    return avaliarLatex(dentro);
  };
  const colchete = () => {
    espaco();
    if (s[i] !== "[") return null;
    const inicio = ++i;
    while (i < s.length && s[i] !== "]") i++;
    const dentro = s.slice(inicio, i);
    i++;
    return avaliarLatex(dentro);
  };

  const FUNCOES = {
    "\\ln": Math.log,
    "\\log": (x) => Math.log10(x),
    "\\exp": Math.exp,
    "\\cos": Math.cos,
    "\\sin": Math.sin,
    "\\tan": Math.tan,
    "\\arctan": Math.atan,
    "\\arcsin": Math.asin,
    "\\arccos": Math.acos,
    "\\cosh": Math.cosh,
    "\\sinh": Math.sinh,
  };
  const OPERATORNAME = {
    sen: Math.sin,
    tg: Math.tan,
    cotg: (x) => 1 / Math.tan(x),
    sec: (x) => 1 / Math.cos(x),
    cossec: (x) => 1 / Math.sin(x),
    arctg: Math.atan,
    arcsen: Math.asin,
    arccos: Math.acos,
    senh: Math.sinh,
    cosh: Math.cosh,
    tgh: Math.tanh,
  };

  function atomo() {
    espaco();
    if (i >= s.length) return null;
    if (consumir("(")) {
      const v = expr();
      if (!consumir(")")) return null;
      return v;
    }
    if (olhar("{")) return grupo();
    if (consumir("\\dfrac") || consumir("\\tfrac") || consumir("\\frac")) {
      const a = grupo();
      const b = grupo();
      return a == null || b == null ? null : a / b;
    }
    if (consumir("\\sqrt")) {
      const n = olhar("[") ? colchete() : 2;
      const a = grupo();
      if (a == null || n == null) return null;
      if (a < 0 && n % 2 === 0) return NaN;
      return Math.sign(a) * Math.pow(Math.abs(a), 1 / n);
    }
    if (consumir("\\operatorname")) {
      espaco();
      if (s[i] !== "{") return null;
      const fim = s.indexOf("}", i);
      const nome = s.slice(i + 1, fim).trim();
      i = fim + 1;
      const f = OPERATORNAME[nome];
      if (!f) return null;
      const arg = potencia();
      return arg == null ? null : f(arg);
    }
    for (const nome of Object.keys(FUNCOES)) {
      if (olhar(nome) && !/[a-zA-Z]/.test(s[i + nome.length] || "")) {
        i += nome.length;
        const arg = potencia();
        return arg == null ? null : FUNCOES[nome](arg);
      }
    }
    if (consumir("\\pi")) return Math.PI;
    if (consumir("\\infty")) return Infinity;
    if (consumir("e")) return Math.E;
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      return parseFloat(m[0]);
    }
    return null;
  }

  // potência: atomo ^ {expoente}
  function potencia() {
    let base = atomo();
    if (base == null) return null;
    espaco();
    while (consumir("^")) {
      espaco();
      let exp;
      if (olhar("{")) exp = grupo();
      else if (consumir("(")) {
        exp = expr();
        if (!consumir(")")) return null;
      } else {
        const neg = consumir("-");
        const mm = /^\d/.exec(s.slice(i));
        if (mm) {
          i += 1;
          exp = (neg ? -1 : 1) * parseFloat(mm[0]);
        } else {
          const a = atomo();
          if (a == null) return null;
          exp = (neg ? -1 : 1) * a;
        }
      }
      if (exp == null) return null;
      base = Math.pow(base, exp);
      espaco();
    }
    return base;
  }

  // termo: produtos implícitos (2\sqrt{3}), \cdot, \times e divisão /
  function termo() {
    let v = null;
    for (;;) {
      espaco();
      if (i >= s.length) break;
      if (consumir("\\cdot") || consumir("\\times")) {
        const p = potencia();
        if (p == null) return null;
        v = v == null ? p : v * p;
        continue;
      }
      if (olhar("/")) {
        i++;
        const p = potencia();
        if (p == null || v == null) return null;
        v /= p;
        continue;
      }
      if (olhar("+") || olhar("-") || olhar(")") || olhar("}") || olhar("]")) break;
      const p = potencia();
      if (p == null) break;
      v = v == null ? p : v * p;
    }
    return v;
  }

  function expr() {
    espaco();
    let sinal = 1;
    if (consumir("-")) sinal = -1;
    else consumir("+");
    let v = termo();
    if (v == null) return null;
    v *= sinal;
    for (;;) {
      espaco();
      if (consumir("+")) {
        const t = termo();
        if (t == null) return null;
        v += t;
      } else if (consumir("-")) {
        const t = termo();
        if (t == null) return null;
        v -= t;
      } else break;
    }
    return v;
  }

  const valor = expr();
  espaco();
  if (i < s.length) return null; // sobrou lixo: não entendi a expressão
  return typeof valor === "number" && !Number.isNaN(valor) ? valor : null;
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
    const ref = `#${idx + 1} [${b.topico}] ${b.subtopico}`;
    // 1) recomputação numérica independente × valor declarado
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
    // 2) LaTeX da alternativa correta × valor declarado
    if (!b.opcoes.semLatex) {
      const lido = avaliarLatex(b.correta);
      if (lido == null) avisos.push(`${ref}: LaTeX da correta não avaliado — "${b.correta}"`);
      else if (!perto(lido, b.valor, b.opcoes.tolLatex ?? 1e-6))
        falhas.push(`${ref}: alternativa correta "${b.correta}" vale ${lido}, mas valor=${b.valor}`);
      // 3) distrator numericamente igual à resposta
      b.distratores.forEach((d, k) => {
        const dv = avaliarLatex(d);
        if (dv != null && perto(dv, b.valor, 1e-9))
          falhas.push(`${ref}: distrator ${k + 1} "${d}" vale o mesmo que a correta`);
      });
    }
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

  const porTopico = new Map();
  const porLetra = new Map();
  const porDif = new Map();
  for (const x of questoes) {
    porTopico.set(x.topico, (porTopico.get(x.topico) || 0) + 1);
    porLetra.set(x.gabarito, (porLetra.get(x.gabarito) || 0) + 1);
    porDif.set(x.dificuldade, (porDif.get(x.dificuldade) || 0) + 1);
  }
  console.log(`${questoes.length} questões escritas em ${destino}`);
  console.log("por tópico:");
  [...porTopico.entries()].forEach(([t, n]) => console.log(`  ${String(n).padStart(3)}  ${t}`));
  console.log("por dificuldade:", Object.fromEntries(porDif));
  console.log("por letra:", Object.fromEntries([...porLetra.entries()].sort()));
  console.log(
    `conferência: ${brutas.filter((b) => typeof b.checar === "function").length}/${brutas.length} com recálculo numérico`
  );
  if (avisos.length) {
    console.log(`\n${avisos.length} aviso(s):`);
    avisos.forEach((a) => console.log(`  - ${a}`));
  }
}
