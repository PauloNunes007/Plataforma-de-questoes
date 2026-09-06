// Renderiza com o KaTeX real (o mesmo que /questao usa) todo o LaTeX dos
// JSONs gerados, com throwOnError:true, para pegar comando inválido ou
// ambiente não suportado antes de a questão chegar na fila de revisão.
//
// Uso: node listas_questoes/gerado/scripts/render-katex.mjs a.json b.json ...
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizGerado = resolve(aqui, "..");
const require = createRequire(resolve(aqui, "..", "..", "..", "web", "package.json"));
const katex = require("katex");

// Mesma varredura de $...$ que o app faz ao renderizar enunciado/alternativas.
function trechosMatematicos(texto) {
  if (!texto) return [];
  const partes = String(texto).split(/(?<!\\)\$/);
  // índices ímpares são conteúdo matemático
  return partes.filter((_, i) => i % 2 === 1);
}

const arquivos = process.argv.slice(2);
const falhas = [];
let expressoes = 0;

for (const arq of arquivos) {
  const itens = JSON.parse(readFileSync(resolve(raizGerado, arq), "utf8"));
  itens.forEach((item, i) => {
    const campos = [
      ["enunciado", item.enunciado],
      ["resolucao", item.resolucao],
      ...["a", "b", "c", "d", "e"].map((l) => [`alt.${l}`, item.alternativas?.[l]]),
    ];
    campos.forEach(([nome, texto]) => {
      trechosMatematicos(texto).forEach((expr) => {
        expressoes++;
        try {
          katex.renderToString(expr, { throwOnError: true, displayMode: false });
        } catch (e) {
          falhas.push(`${arq}#${i + 1} [${nome}]: ${e.message.split("\n")[0]}  <<${expr}>>`);
        }
      });
    });
  });
}

console.log(`${expressoes} expressões LaTeX renderizadas em ${arquivos.length} arquivo(s)`);
if (falhas.length) {
  console.log(`\n${falhas.length} FALHA(S) DE RENDERIZAÇÃO:`);
  falhas.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log("OK — todo o LaTeX renderiza no KaTeX.");
