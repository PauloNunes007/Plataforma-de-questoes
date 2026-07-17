// ============================================================
// Rede neural (MLP) em TypeScript puro — zero dependências.
//
// Por que não TensorFlow/ONNX: o modelo é minúsculo (~350 parâmetros,
// entrada de 12 features tabulares) e precisa treinar/inferir no runtime
// Node do Next (Vercel) e em script local. Implementar forward + Adam à
// mão dá um bundle de ~0 KB extra e treino em < 5s para dezenas de
// milhares de exemplos — qualquer lib seria overkill e pesaria mais que
// o modelo. A matemática é a padrão: camadas densas, tanh nas ocultas,
// sigmoide na saída, perda BCE, Adam com weight decay (L2) e early
// stopping na validação.
//
// Funções puras; a serialização é um objeto JSON simples que vai pra
// coluna `pesos` de `ml_modelos` (supabase_rede_neural.sql).
// ============================================================

export type RedeSerializada = {
  arquitetura: number[]; // ex.: [12, 16, 8, 1]
  pesos: number[][][]; // [camada][neuronio][entrada]
  vies: number[][]; // [camada][neuronio]
};

export type OpcoesTreino = {
  taxaAprendizado?: number;
  epocas?: number;
  tamanhoLote?: number;
  l2?: number;
  paciencia?: number; // épocas sem melhora na validação antes de parar
  seed?: number;
};

// RNG determinístico (mulberry32) — treino reproduzível pro mesmo dataset.
function criarRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sigmoide(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function criarRede(arquitetura: number[], seed = 42): RedeSerializada {
  const rng = criarRng(seed);
  const pesos: number[][][] = [];
  const vies: number[][] = [];
  for (let c = 1; c < arquitetura.length; c++) {
    const nIn = arquitetura[c - 1];
    const nOut = arquitetura[c];
    // Inicialização Xavier/Glorot (uniforme) — adequada a tanh.
    const limite = Math.sqrt(6 / (nIn + nOut));
    pesos.push(
      Array.from({ length: nOut }, () => Array.from({ length: nIn }, () => (rng() * 2 - 1) * limite)),
    );
    vies.push(Array.from({ length: nOut }, () => 0));
  }
  return { arquitetura: [...arquitetura], pesos, vies };
}

// Forward completo guardando ativações por camada (necessário no backprop).
function forwardCompleto(rede: RedeSerializada, entrada: number[]): number[][] {
  const ativacoes: number[][] = [entrada];
  let atual = entrada;
  for (let c = 0; c < rede.pesos.length; c++) {
    const ultima = c === rede.pesos.length - 1;
    const saida = rede.pesos[c].map((pesosNeuronio, n) => {
      let z = rede.vies[c][n];
      for (let i = 0; i < pesosNeuronio.length; i++) z += pesosNeuronio[i] * atual[i];
      return ultima ? sigmoide(z) : Math.tanh(z);
    });
    ativacoes.push(saida);
    atual = saida;
  }
  return ativacoes;
}

export function preverRede(rede: RedeSerializada, entrada: number[]): number {
  const ativacoes = forwardCompleto(rede, entrada);
  return ativacoes[ativacoes.length - 1][0];
}

const EPS = 1e-7;

export function perdaLogLoss(previsoes: number[], rotulos: number[]): number {
  let soma = 0;
  for (let i = 0; i < previsoes.length; i++) {
    const p = Math.min(1 - EPS, Math.max(EPS, previsoes[i]));
    soma += rotulos[i] === 1 ? -Math.log(p) : -Math.log(1 - p);
  }
  return soma / Math.max(1, previsoes.length);
}

type EstadoAdam = { m: number; v: number };

function clonarRede(rede: RedeSerializada): RedeSerializada {
  return {
    arquitetura: [...rede.arquitetura],
    pesos: rede.pesos.map((c) => c.map((n) => [...n])),
    vies: rede.vies.map((c) => [...c]),
  };
}

export type ResultadoTreino = {
  rede: RedeSerializada;
  epocasRodadas: number;
  logLossTreino: number;
  logLossValidacao: number;
};

// Treina com Adam + mini-batch + L2 e early stopping em (Xval, yval),
// devolvendo os pesos da MELHOR época de validação (não da última).
export function treinarRede(
  X: number[][],
  y: number[],
  Xval: number[][],
  yval: number[],
  arquitetura: number[],
  opcoes: OpcoesTreino = {},
): ResultadoTreino {
  const lr = opcoes.taxaAprendizado ?? 0.003;
  const epocas = opcoes.epocas ?? 300;
  const lote = opcoes.tamanhoLote ?? 64;
  const l2 = opcoes.l2 ?? 1e-4;
  const paciencia = opcoes.paciencia ?? 25;
  const seed = opcoes.seed ?? 42;

  const rede = criarRede(arquitetura, seed);
  const rng = criarRng(seed ^ 0x9e3779b9);

  // Estado do Adam espelhando a estrutura de pesos/viés.
  const adamPesos: EstadoAdam[][][] = rede.pesos.map((c) => c.map((n) => n.map(() => ({ m: 0, v: 0 }))));
  const adamVies: EstadoAdam[][] = rede.vies.map((c) => c.map(() => ({ m: 0, v: 0 })));
  const b1 = 0.9;
  const b2 = 0.999;
  let passo = 0;

  const indices = X.map((_, i) => i);
  let melhorVal = Infinity;
  let melhorRede = clonarRede(rede);
  let melhorEpoca = 0;
  let semMelhora = 0;

  for (let epoca = 1; epoca <= epocas; epoca++) {
    // Embaralha (Fisher–Yates com o RNG semeado).
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let inicio = 0; inicio < indices.length; inicio += lote) {
      const idsLote = indices.slice(inicio, inicio + lote);
      // Acumuladores de gradiente do lote.
      const gradPesos = rede.pesos.map((c) => c.map((n) => n.map(() => 0)));
      const gradVies = rede.vies.map((c) => c.map(() => 0));

      for (const idx of idsLote) {
        const ativacoes = forwardCompleto(rede, X[idx]);
        const nCamadas = rede.pesos.length;
        // Saída sigmoide + BCE: delta = (p - y), a simplificação clássica.
        let delta = [ativacoes[nCamadas][0] - y[idx]];
        for (let c = nCamadas - 1; c >= 0; c--) {
          const entradaCamada = ativacoes[c];
          const proxDelta = new Array(entradaCamada.length).fill(0);
          for (let n = 0; n < rede.pesos[c].length; n++) {
            gradVies[c][n] += delta[n];
            for (let i = 0; i < entradaCamada.length; i++) {
              gradPesos[c][n][i] += delta[n] * entradaCamada[i];
              proxDelta[i] += delta[n] * rede.pesos[c][n][i];
            }
          }
          if (c > 0) {
            // Derivada da tanh: 1 - a².
            for (let i = 0; i < proxDelta.length; i++) proxDelta[i] *= 1 - ativacoes[c][i] ** 2;
          }
          delta = proxDelta;
        }
      }

      // Passo Adam (gradiente médio do lote + weight decay nos pesos).
      passo++;
      const escala = 1 / idsLote.length;
      const corr1 = 1 - Math.pow(b1, passo);
      const corr2 = 1 - Math.pow(b2, passo);
      for (let c = 0; c < rede.pesos.length; c++) {
        for (let n = 0; n < rede.pesos[c].length; n++) {
          for (let i = 0; i < rede.pesos[c][n].length; i++) {
            const g = gradPesos[c][n][i] * escala + l2 * rede.pesos[c][n][i];
            const st = adamPesos[c][n][i];
            st.m = b1 * st.m + (1 - b1) * g;
            st.v = b2 * st.v + (1 - b2) * g * g;
            rede.pesos[c][n][i] -= (lr * (st.m / corr1)) / (Math.sqrt(st.v / corr2) + 1e-8);
          }
          const gb = gradVies[c][n] * escala;
          const stb = adamVies[c][n];
          stb.m = b1 * stb.m + (1 - b1) * gb;
          stb.v = b2 * stb.v + (1 - b2) * gb * gb;
          rede.vies[c][n] -= (lr * (stb.m / corr1)) / (Math.sqrt(stb.v / corr2) + 1e-8);
        }
      }
    }

    const perdaVal = perdaLogLoss(
      Xval.map((x) => preverRede(rede, x)),
      yval,
    );
    if (perdaVal < melhorVal - 1e-5) {
      melhorVal = perdaVal;
      melhorRede = clonarRede(rede);
      melhorEpoca = epoca;
      semMelhora = 0;
    } else {
      semMelhora++;
      if (semMelhora >= paciencia) break;
    }
  }

  return {
    rede: melhorRede,
    epocasRodadas: melhorEpoca,
    logLossTreino: perdaLogLoss(
      X.map((x) => preverRede(melhorRede, x)),
      y,
    ),
    logLossValidacao: melhorVal,
  };
}
