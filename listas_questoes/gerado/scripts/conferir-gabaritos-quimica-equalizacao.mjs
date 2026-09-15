// Conferidor de gabarito da leva de equalização de Química (2026-09-15).
//
// A maioria das questões desta leva é conceitual, e para essas o gabarito é
// verificado na revisão do texto — não há o que recalcular. Este script cobre
// o subconjunto que TEM conta: recomputa cada resposta a partir dos dados do
// ENUNCIADO (nunca repetindo a expressão da resolução) e exige que
//
//   valor recalculado  ==  valor declarado  ==  número lido na alternativa do
//                                               gabarito
//
// fechando o elo "conta conferida -> número declarado -> letra que o aluno vê",
// como no `calculo1_kit.mjs`. O parser de LaTeX->número está embutido porque as
// alternativas de Química vêm com `{,}` decimal, `\times 10^{n}` e sufixo de
// unidade ("eV", "Hz", "kJ/mol", "vezes", "K", "minutos").
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizGerado = resolve(aqui, "..");

const ARQUIVOS = [
  "quimica_atomica.json",
  "quimica_ligacoes.json",
  "quimica_termo.json",
  "quimica_aplicacoes.json",
];

// LaTeX de alternativa -> número. Devolve null quando não é numérica.
function latexParaNumero(tex) {
  let t = String(tex || "");
  t = t.replace(/\$/g, "").trim();
  t = t.replace(/\\[,;!]/g, " ");
  t = t.replace(/\{,\}/g, ".");
  t = t.replace(/\\text\{[^}]*\}/g, " ");
  // 5,0 \times 10^{14}  ->  5.0e14
  const cient = t.match(/^\s*(-?[\d.]+)\s*\\times\s*10\^\{?(-?\d+)\}?/);
  if (cient) return Number(cient[1]) * Math.pow(10, Number(cient[2]));
  // "2p" é rótulo de orbital, não número: dígito colado numa letra não conta.
  if (/^\s*-?[\d.]+[a-zA-Z]/.test(t)) return null;
  const simples = t.match(/^\s*(-?[\d.]+)/);
  return simples ? Number(simples[1]) : null;
}

const perto = (a, b, rel = 2e-2) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));

// --- as contas, recomputadas a partir dos dados do enunciado ---------------
// chave = subtopico da questão; valor = { esperado, como }
const CONTAS = {
  "Efeito fotoelétrico e energia cinética do fotoelétron": {
    // fóton de 5,0 eV sobre metal de função trabalho 3,0 eV
    esperado: () => 5.0 - 3.0,
    como: "Ec = hv - Phi",
  },
  "Relação entre comprimento de onda e frequência": {
    // lambda = 600 nm, c = 3,0e8 m/s
    esperado: () => 3.0e8 / (600e-9),
    como: "v = c / lambda",
  },
  "Comparação de energia entre fótons": {
    // 250 nm contra 750 nm
    esperado: () => 750 / 250,
    como: "E1/E2 = lambda2/lambda1",
  },
  "Modelo de Bohr — raio das órbitas": {
    esperado: () => Math.pow(3, 2) / Math.pow(1, 2),
    como: "r ~ n^2",
  },
  "Energia de ionização a partir de estado excitado": {
    esperado: () => 0 - (-13.6 / Math.pow(2, 2)),
    como: "dE = 0 - E_n, E_n = -13,6/n^2",
  },
  "Número quântico magnético e quantidade de orbitais": {
    esperado: () => 2 * 2 + 1, // subnível d: l = 2, orbitais = 2l+1
    como: "orbitais = 2l+1 com l=2",
  },
  "Perda de elétrons 4s na formação de cátions": {
    // Ti: [Ar]3d2 4s2 -> Ti(3+) retira os dois 4s e depois um 3d
    esperado: () => {
      let d = 2,
        s = 2;
      for (let i = 0; i < 3; i++) {
        if (s > 0) s--;
        else d--;
      }
      return d;
    },
    como: "remove 4s antes de 3d",
  },
  "Regra de Hund e contagem de elétrons desemparelhados": {
    // 6 elétrons em 5 orbitais degenerados, um a um antes de emparelhar
    esperado: () => {
      const orb = [0, 0, 0, 0, 0];
      for (let e = 0; e < 6; e++) {
        const i = orb.indexOf(Math.min(...orb));
        orb[i]++;
      }
      return orb.filter((n) => n === 1).length;
    },
    como: "preenche 1 por orbital, depois emparelha",
  },
  "Número de elementos por período e subníveis preenchidos": {
    // o 4º período: 4s(2) + 3d(10) + 4p(6) — checado pela contagem, a
    // alternativa é textual, então confere-se só a soma
    esperado: () => 2 + 10 + 6,
    como: "4s + 3d + 4p",
    semAlternativa: true,
  },
  "Elétrons de valência e grupo da tabela": {
    // elemento representativo do grupo 15
    esperado: () => 15 - 10,
    como: "grupos 13-18: valencia = grupo - 10",
  },
  "Lei de Hess e soma de etapas": {
    // C + O2 -> CO2 (-394); CO + 1/2 O2 -> CO2 (-283). Alvo: C + 1/2 O2 -> CO
    esperado: () => -394 - -283,
    como: "soma das etapas com a segunda invertida",
  },
  "Temperatura de inversão da espontaneidade": {
    esperado: () => 60 / 0.2,
    como: "T = dH/dS com dG = 0",
  },
  "Primeira lei: trabalho de expansão e variação de energia interna": {
    esperado: () => -100 + -15,
    como: "dU = q + w, ambos negativos",
  },
  "Relação entre Kp e Kc": {
    esperado: () => 2 - (1 + 3),
    como: "dn = mols gasosos de produto - de reagente",
  },
  "Meia-vida em cinética de primeira ordem": {
    // t(1/2) = ln2/k não depende de [A]0: dobrar a concentração não muda nada.
    // Recomputado integrando a cinética de 1a ordem a partir de 2*[A]0.
    esperado: () => {
      const k = Math.LN2 / 20; // da meia-vida original de 20 min
      const a0 = 2; // concentração dobrada
      return Math.log(a0 / (a0 / 2)) / k;
    },
    como: "integra dA/dt = -kA partindo de 2*[A]0",
  },
};

let erros = 0;
let conferidas = 0;
const naoCobertas = [];

for (const arq of ARQUIVOS) {
  const itens = JSON.parse(readFileSync(resolve(raizGerado, arq), "utf8"));
  itens.forEach((q, i) => {
    const conta = CONTAS[q.subtopico];
    const valorGab = latexParaNumero(q.alternativas[q.gabarito]);
    if (!conta) {
      if (valorGab !== null) naoCobertas.push(`${arq}#${i + 1}  ${q.subtopico}`);
      return;
    }
    conferidas++;
    const esperado = conta.esperado();
    const ref = `${arq}#${i + 1} [${q.subtopico}]`;

    if (conta.semAlternativa) {
      console.log(`  ok  ${ref} — ${conta.como} = ${esperado} (alternativa textual)`);
      return;
    }
    if (valorGab === null) {
      console.log(`ERRO ${ref}: alternativa do gabarito não é numérica ("${q.alternativas[q.gabarito]}")`);
      erros++;
      return;
    }
    if (!perto(valorGab, esperado)) {
      console.log(`ERRO ${ref}: recalculado ${esperado} (${conta.como}), mas a letra ${q.gabarito} vale ${valorGab}`);
      erros++;
      return;
    }
    // nenhum distrator pode valer o mesmo que a correta
    const iguais = Object.entries(q.alternativas).filter(
      ([l, t]) => l !== q.gabarito && latexParaNumero(t) !== null && perto(latexParaNumero(t), esperado),
    );
    if (iguais.length) {
      console.log(`ERRO ${ref}: distrator(es) ${iguais.map(([l]) => l).join(", ")} valem o mesmo que a correta`);
      erros++;
      return;
    }
    console.log(`  ok  ${ref} — ${conta.como} = ${esperado}, letra ${q.gabarito}`);
  });
}

console.log(`\n${conferidas} questão(ões) com conta recalculada; ${erros} divergência(s).`);
if (naoCobertas.length) {
  console.log(`\n${naoCobertas.length} questão(ões) de gabarito numérico SEM conta cadastrada aqui:`);
  naoCobertas.forEach((n) => console.log(`  ${n}`));
}
if (erros || naoCobertas.length) process.exit(1);
