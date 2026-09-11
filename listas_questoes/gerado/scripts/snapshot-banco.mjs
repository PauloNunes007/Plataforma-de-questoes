// Baixa do Supabase o snapshot de matérias/tópicos/enunciados usado por
// validar.mjs (checagem de taxonomia e de enunciado duplicado). Os arquivos
// `_snapshot_*.json` são regeneráveis e ficam fora do git.
//
// Uso: node listas_questoes/gerado/scripts/snapshot-banco.mjs
import { readFileSync, writeFileSync } from "node:fs";
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

// PostgREST corta em 1000 linhas por resposta, independente do ?limit — daí a
// paginação por Range (o banco de questões já passou desse teto).
const buscar = async (path) => {
  const tudo = [];
  const passo = 1000;
  for (let inicio = 0; ; inicio += passo) {
    const r = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${inicio}-${inicio + passo - 1}` },
    });
    if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
    const pagina = await r.json();
    tudo.push(...pagina);
    if (pagina.length < passo) return tudo;
  }
};

// `order=id` e obrigatorio: sem ORDER BY explicito o Postgres nao garante a
// mesma ordem entre as requisicoes paginadas por Range, e o snapshot sai com
// linhas repetidas no lugar de linhas que nunca vieram (visto na pratica: 1179
// linhas baixadas, 1128 enunciados distintos) — o que fura a checagem de
// enunciado duplicado do validar.mjs.
const alvos = [
  ["_snapshot_materias.json", "materias?select=id,nome&order=id"],
  ["_snapshot_topicos.json", "topicos?select=id,materia_id,nome,ordem&order=id"],
  ["_snapshot_questions.json", "questions?select=id,topic_id,enunciado,subtopico,dificuldade&order=id"],
];

for (const [arquivo, path] of alvos) {
  const dados = await buscar(path);
  writeFileSync(resolve(raizGerado, arquivo), JSON.stringify(dados), "utf8");
  console.log(`${arquivo}: ${dados.length} linhas`);
}
