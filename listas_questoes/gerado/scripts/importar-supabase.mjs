// Importa direto pro banco os JSONs gerados (mesmo payload que
// `web/src/lib/importar/logic.ts#montarPayload` monta), usando a
// service_role key — evita colar arquivo por arquivo no /importar quando o
// lote é grande (ex.: as ~30 provas de Física II da UFF).
//
// Resolve materia/topico por nome contra o banco, pula enunciado duplicado
// (normalizado, igual ao importador) e insere em lotes.
//
// Uso:
//   node listas_questoes/gerado/scripts/importar-supabase.mjs a.json b.json      # dry-run
//   node listas_questoes/gerado/scripts/importar-supabase.mjs a.json --confirm   # insere
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizGerado = resolve(aqui, "..");
const envPath = resolve(aqui, "..", "..", "..", "web", ".env.local");

const env = {};
readFileSync(envPath, "utf8")
  .split(/\r?\n/)
  .forEach((linha) => {
    const i = linha.indexOf("=");
    if (i > 0) env[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  });

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em web/.env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const confirmar = args.includes("--confirm");
const arquivos = args.filter((a) => !a.startsWith("--"));
if (arquivos.length === 0) {
  console.error("uso: node importar-supabase.mjs <arquivo.json> [...] [--confirm]");
  process.exit(1);
}

const LETRAS = ["a", "b", "c", "d", "e"];
const normalizar = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

const api = async (path, init = {}) => {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
};

// PostgREST corta em 1000 linhas por resposta — pagina por Range.
const buscarTudo = async (path) => {
  const tudo = [];
  const passo = 1000;
  for (let inicio = 0; ; inicio += passo) {
    const pagina = await api(path, { headers: { Range: `${inicio}-${inicio + passo - 1}` } });
    tudo.push(...pagina);
    if (pagina.length < passo) return tudo;
  }
};

const materias = await buscarTudo("materias?select=id,nome");
const topicos = await buscarTudo("topicos?select=id,materia_id,nome");
const existentes = await buscarTudo("questions?select=enunciado");

const mapaMaterias = new Map(materias.map((m) => [normalizar(m.nome), m.id]));
const mapaTopicos = new Map(topicos.map((t) => [`${t.materia_id}::${normalizar(t.nome)}`, t.id]));
const enunciados = new Set(existentes.map((q) => normalizar(q.enunciado)));

const payloads = [];
const erros = [];
let duplicados = 0;

for (const arq of arquivos) {
  const itens = JSON.parse(readFileSync(resolve(raizGerado, arq), "utf8"));
  let novos = 0;
  itens.forEach((item, i) => {
    const ref = `${arq}#${i + 1}`;
    const materiaId = mapaMaterias.get(normalizar(item.materia));
    if (!materiaId) return erros.push(`${ref}: matéria não encontrada "${item.materia}"`);
    const topicId = mapaTopicos.get(`${materiaId}::${normalizar(item.topico)}`);
    if (!topicId) return erros.push(`${ref}: tópico não encontrado "${item.topico}" em ${item.materia}`);
    if (!item.gabarito || !item.alternativas?.[item.gabarito]) return erros.push(`${ref}: gabarito inválido`);

    const chave = normalizar(item.enunciado);
    if (enunciados.has(chave)) {
      duplicados++;
      return;
    }
    enunciados.add(chave);

    const alternativas = {};
    LETRAS.forEach((l) => {
      const t = String(item.alternativas?.[l] || "").trim();
      if (t) alternativas[l] = t;
    });
    const altImgs = item.alternativas_imagens && Object.keys(item.alternativas_imagens).length ? item.alternativas_imagens : null;

    payloads.push({
      topic_id: topicId,
      dificuldade: item.dificuldade,
      instituicao: item.instituicao || null,
      ano: item.ano || null,
      enunciado: String(item.enunciado).trim(),
      imagem_url: item.imagem_url || null,
      alternativas,
      alternativas_imagens: altImgs,
      gabarito: item.gabarito,
      resolucao: item.resolucao?.trim() || null,
      subtopico: item.subtopico?.trim() || null,
      // `"desafio": true` no JSON marca a questão como aprofundamento: ela
      // sai de todo sorteio automático do app e ganha selo próprio em
      // /questao. Ver supabase_questao_desafio.sql.
      desafio: item.desafio === true,
    });
    novos++;
  });
  console.log(`${arq}: ${itens.length} questões (${novos} novas)`);
}

if (erros.length) {
  console.log(`\n${erros.length} ERRO(S) — nada foi inserido:`);
  erros.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

console.log(`\ntotal a inserir: ${payloads.length}  |  duplicados pulados: ${duplicados}`);
if (!confirmar) {
  console.log("dry-run (rode de novo com --confirm para inserir de verdade)");
  process.exit(0);
}

let inseridos = 0;
for (let i = 0; i < payloads.length; i += 50) {
  const lote = payloads.slice(i, i + 50);
  await api("questions", { method: "POST", body: JSON.stringify(lote), headers: { Prefer: "return=minimal" } });
  inseridos += lote.length;
  console.log(`  inseridas ${inseridos}/${payloads.length}`);
}
console.log(`\nOK — ${inseridos} questões inseridas.`);
