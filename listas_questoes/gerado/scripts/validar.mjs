// Validador dos JSONs gerados — espelha a heurística de
// `web/src/lib/importar/logic.ts` (avaliarElegibilidadeAuto) e checa contra o
// banco real: matéria/tópico existem, gabarito aponta pra alternativa
// preenchida, dificuldade válida, subtópico presente, enunciado não duplicado
// (nem no banco, nem entre os arquivos).
//
// Uso: node listas_questoes/gerado/scripts/validar.mjs arq1.json arq2.json ...
// (caminhos relativos a listas_questoes/gerado/)
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizGerado = resolve(aqui, "..");
const raizRepo = resolve(aqui, "..", "..", "..");

const LETRAS = ["a", "b", "c", "d", "e"];
const DIFICULDADES = ["facil", "medio", "dificil"];

// Mesma heurística do importador: $ e {} balanceados.
function pareceLatexQuebrado(texto) {
  if (!texto) return false;
  const cifroes = (texto.match(/(?<!\\)\$/g) || []).length;
  if (cifroes % 2 !== 0) return true;
  let abertas = 0;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") abertas++;
    else if (ch === "}") abertas--;
    if (abertas < 0) return true;
  }
  return abertas !== 0;
}

const normalizar = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Taxonomia: usa o snapshot do banco se existir; senão, só avisa.
function carregarTaxonomia() {
  const cands = [
    resolve(raizRepo, "listas_questoes", "gerado", "_snapshot_materias.json"),
    process.env.QUESTLY_SNAPSHOT_DIR ? resolve(process.env.QUESTLY_SNAPSHOT_DIR, "materias.json") : null,
  ].filter(Boolean);
  for (const c of cands) {
    if (existsSync(c)) {
      const base = dirname(c);
      return {
        materias: JSON.parse(readFileSync(c, "utf8")),
        topicos: JSON.parse(readFileSync(resolve(base, c.includes("_snapshot_") ? "_snapshot_topicos.json" : "topicos.json"), "utf8")),
        questions: JSON.parse(readFileSync(resolve(base, c.includes("_snapshot_") ? "_snapshot_questions.json" : "questions.json"), "utf8")),
      };
    }
  }
  return null;
}

const arquivos = process.argv.slice(2);
if (arquivos.length === 0) {
  console.error("uso: node validar.mjs <arquivo.json> [...]");
  process.exit(1);
}

const taxonomia = carregarTaxonomia();
let mapaMaterias = null;
let mapaTopicos = null;
const enunciadosExistentes = new Set();

if (taxonomia) {
  mapaMaterias = new Map(taxonomia.materias.map((m) => [normalizar(m.nome), m.id]));
  mapaTopicos = new Map();
  taxonomia.topicos.forEach((t) => {
    mapaTopicos.set(`${t.materia_id}::${normalizar(t.nome)}`, t.id);
  });
  taxonomia.questions.forEach((q) => enunciadosExistentes.add(normalizar(q.enunciado)));
  console.log(
    `taxonomia carregada: ${taxonomia.materias.length} matérias, ${taxonomia.topicos.length} tópicos, ${taxonomia.questions.length} questões existentes\n`
  );
} else {
  console.log("AVISO: snapshot do banco não encontrado — pulando checagens de taxonomia e duplicata contra o banco\n");
}

const problemas = [];
const avisos = [];
const vistosNesteLote = new Map();
const cobertura = new Map();
const porGabarito = new Map();
let total = 0;

for (const arq of arquivos) {
  const caminho = resolve(raizGerado, arq);
  const itens = JSON.parse(readFileSync(caminho, "utf8"));
  itens.forEach((item, i) => {
    total++;
    const ref = `${arq}#${i + 1}`;
    const erro = (msg) => problemas.push(`${ref}: ${msg}`);

    if (!item.enunciado || !item.enunciado.trim()) erro("enunciado vazio");
    if (!item.subtopico || !item.subtopico.trim()) erro("subtopico ausente");
    if (!DIFICULDADES.includes(item.dificuldade)) erro(`dificuldade inválida: ${item.dificuldade}`);
    if (item.instituicao === "Questly" || item.instituicao === "Expectrum") erro(`instituicao "${item.instituicao}" é reservada para conteúdo demo`);

    const preenchidas = LETRAS.filter((l) => item.alternativas && item.alternativas[l] && String(item.alternativas[l]).trim());
    if (preenchidas.length < 2) erro(`só ${preenchidas.length} alternativa(s) preenchida(s)`);
    // Cinco alternativas é a regra das levas AUTORAIS. Prova real transcrita
    // (`instituicao` preenchida) fica com o formato que o professor usou —
    // Certo/Errado tem 2, o item "I / II" da UFF tem 4 — e completar pra cinco
    // seria inventar distrator, o que a regra de ouro proíbe. Vira aviso.
    if (preenchidas.length !== 5) {
      const msg = `esperadas 5 alternativas, achadas ${preenchidas.length}`;
      if (item.instituicao) avisos.push(`${ref}: ${msg} (transcrição de ${item.instituicao} — formato da prova)`);
      else erro(msg);
    }
    if (!item.gabarito || !preenchidas.includes(item.gabarito)) erro(`gabarito "${item.gabarito}" não aponta pra alternativa preenchida`);

    // alternativas repetidas entre si (mesmo valor em duas letras)
    const textos = preenchidas.map((l) => normalizar(item.alternativas[l]));
    const dupAlt = textos.filter((t, k) => textos.indexOf(t) !== k);
    if (dupAlt.length) erro(`alternativas repetidas: ${[...new Set(dupAlt)].join(" | ")}`);

    if (pareceLatexQuebrado(item.enunciado)) erro("LaTeX possivelmente quebrado no enunciado");
    LETRAS.forEach((l) => {
      if (item.alternativas && pareceLatexQuebrado(item.alternativas[l])) erro(`LaTeX possivelmente quebrado na alternativa ${l.toUpperCase()}`);
    });
    if (pareceLatexQuebrado(item.resolucao)) erro("LaTeX possivelmente quebrado na resolução");
    if (!item.resolucao || !item.resolucao.trim()) erro("resolução vazia");

    // duplicata de enunciado
    const chave = normalizar(item.enunciado);
    if (enunciadosExistentes.has(chave)) erro("enunciado já existe no banco");
    if (vistosNesteLote.has(chave)) erro(`enunciado duplicado (também em ${vistosNesteLote.get(chave)})`);
    vistosNesteLote.set(chave, ref);

    // taxonomia
    if (mapaMaterias) {
      const mid = mapaMaterias.get(normalizar(item.materia));
      if (!mid) erro(`matéria não encontrada: "${item.materia}"`);
      else if (!mapaTopicos.get(`${mid}::${normalizar(item.topico)}`)) erro(`tópico não encontrado em ${item.materia}: "${item.topico}"`);
    }

    const chaveCob = `${item.materia} :: ${item.topico}`;
    cobertura.set(chaveCob, (cobertura.get(chaveCob) || 0) + 1);
    porGabarito.set(item.gabarito, (porGabarito.get(item.gabarito) || 0) + 1);
  });
  console.log(`${arq}: ${itens.length} questões`);
}

console.log(`\ncobertura por tópico (${total} questões no total):`);
[...cobertura.entries()].sort().forEach(([k, v]) => console.log(`  ${v.toString().padStart(3)}  ${k}`));

console.log("\ndistribuição de gabaritos:");
LETRAS.forEach((l) => console.log(`  ${l}: ${porGabarito.get(l) || 0}`));

if (avisos.length) {
  console.log(`
${avisos.length} AVISO(S) (não bloqueiam):`);
  avisos.forEach((a) => console.log(`  - ${a}`));
}

if (problemas.length) {
  console.log(`\n${problemas.length} PROBLEMA(S):`);
  problemas.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log("\nOK — nenhum problema encontrado.");
