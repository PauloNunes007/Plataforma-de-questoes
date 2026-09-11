// Aplica a regra de ouro das alternativas: nenhuma alternativa — muito menos
// a correta — pode se destacar. Duas checagens:
//  1) tamanho: razão entre o comprimento da correta e a média das erradas;
//  2) forma: a correta não pode ser a ÚNICA fração / raiz / decimal / notação
//     científica / fórmula química / texto do conjunto. Um aluno test-wise
//     elimina alternativas pela aparência sem resolver a questão.
//
// Uso: node listas_questoes/gerado/scripts/conferir-alternativas.mjs a.json ...
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizGerado = resolve(aqui, "..");
const LETRAS = ["a", "b", "c", "d", "e"];

function forma(s) {
  const t = String(s || "");
  const marcas = [];
  if (/\{,\}/.test(t)) marcas.push("decimal");
  // Os marcadores procuram COMANDO LaTeX, não substring solta: /frac/ casava
  // com a palavra "fracas" de uma alternativa em prosa e acusava tell falso
  // (visto na leva de Química no estilo UFF, que é quase toda em prosa).
  if (/\[dt]?frac/.test(t)) marcas.push("fracao");
  if (/\sqrt/.test(t)) marcas.push("raiz");
  if (/\\pi/.test(t)) marcas.push("pi");
  if (/times\s*10\^|10\^\{/.test(t)) marcas.push("notcient");
  if (/pmatrix|begin\{matrix\}|vmatrix/.test(t)) marcas.push("matriz");
  if (/\\text\{/.test(t)) marcas.push("quimica");
  // "prosa" = alternativa sem nenhuma matemática delimitada por cifrão
  if (!t.includes("$")) marcas.push("prosa");
  return marcas.join("+") || "simples";
}

const arquivos = process.argv.slice(2);
const flagsForma = [];
const assimetrias = [];
let maiorAlternativa = 0;
let somaRazao = 0;
let n = 0;

for (const arq of arquivos) {
  const itens = JSON.parse(readFileSync(resolve(raizGerado, arq), "utf8"));
  itens.forEach((item, i) => {
    const ref = `${arq}#${i + 1}`;
    const formas = LETRAS.map((l) => forma(item.alternativas?.[l]));
    const formaCerta = formas[LETRAS.indexOf(item.gabarito)];
    if (formas.filter((f) => f === formaCerta).length === 1) {
      flagsForma.push(`${ref}  correta=${item.gabarito} (${formaCerta})  todas=[${formas.join(", ")}]`);
    }

    const comps = LETRAS.map((l) => (item.alternativas?.[l] || "").length);
    maiorAlternativa = Math.max(maiorAlternativa, ...comps);
    const certa = comps[LETRAS.indexOf(item.gabarito)];
    const media = comps.filter((_, k) => LETRAS[k] !== item.gabarito).reduce((s, v) => s + v, 0) / 4;
    const razao = certa / media;
    somaRazao += razao;
    n++;
    assimetrias.push({ ref, razao: +razao.toFixed(2) });
  });
}

console.log(`${n} questões analisadas em ${arquivos.length} arquivo(s)`);
console.log(`razão média (correta / média das erradas): ${(somaRazao / n).toFixed(3)}  — 1.00 é simétrico`);
console.log(`maior alternativa do lote: ${maiorAlternativa} caracteres`);

assimetrias.sort((a, b) => Math.abs(b.razao - 1) - Math.abs(a.razao - 1));
console.log("\n5 maiores assimetrias de tamanho:");
assimetrias.slice(0, 5).forEach((a) => console.log(`  ${a.ref}  razão=${a.razao}`));

console.log(`\n${flagsForma.length} questão(ões) em que a correta é a única com aquela forma:`);
flagsForma.forEach((f) => console.log(`  ${f}`));
if (flagsForma.length) process.exit(1);
