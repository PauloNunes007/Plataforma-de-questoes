// Upload em lote de imagens locais (já recortadas pelo pandoc --extract-media
// a partir dos DOCX de provas_uff/) pro bucket "questoes" do Supabase
// Storage, usando a service_role key (bypassa RLS de upload admin-only).
// Ver PROXIMO_CHAT_FIS2_UFF.md pro pipeline completo.
//
// Uso: lê pares "caminhoLocal|caminhoDestino" da stdin, um por linha, ex.:
//   echo "C:/tmp/media/image6.png|uff-fis2/2025-2-p1a/q07.png" | node upload-imagens-uff-fis2.mjs
// Imprime "destino -> url pública" por linha (ou "FAIL destino: ..." se der erro).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(aqui, "..", "..", "..", "web", ".env.local");

function carregarEnv(path) {
  const env = {};
  readFileSync(path, "utf8")
    .split(/\r?\n/)
    .forEach((linha) => {
      const i = linha.indexOf("=");
      if (i > 0) env[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
    });
  return env;
}

const env = carregarEnv(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em web/.env.local");
  process.exit(1);
}

const linhas = readFileSync(0, "utf8").split(/\r?\n/).filter(Boolean);

const extToContentType = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

for (const linha of linhas) {
  const [localPath, destPath] = linha.split("|");
  if (!localPath || !destPath) continue;
  const ext = destPath.split(".").pop().toLowerCase();
  const contentType = extToContentType[ext] || "application/octet-stream";
  const bytes = readFileSync(localPath);
  const r = await fetch(`${url}/storage/v1/object/questoes/${destPath}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!r.ok) {
    console.error(`FAIL ${destPath}: ${r.status} ${await r.text()}`);
    continue;
  }
  console.log(`${destPath} -> ${url}/storage/v1/object/public/questoes/${destPath}`);
}
