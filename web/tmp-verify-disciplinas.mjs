import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Réplica da query de contarQuestoesPorMateria (disciplinas-data.ts) pra
// confirmar em runtime real, sem depender do Next dev server.
const { data, error } = await admin.from("questions").select("topicos!inner ( materia_id, materias ( nome ) )");
if (error) {
  console.error("erro na query:", error.message);
  process.exit(1);
}

const contagem = new Map();
for (const row of data) {
  const t = row.topicos;
  if (!t?.materia_id) continue;
  const atual = contagem.get(t.materia_id) ?? { nome: t.materias?.nome ?? "?", total: 0 };
  atual.total += 1;
  contagem.set(t.materia_id, atual);
}

const nomes = [...contagem.values()].map((v) => v.nome).sort();
console.log("Materias com >=1 questão (o que vai aparecer em Banco/Listas de Questões e no onboarding):");
nomes.forEach((n) => console.log("  -", n, `(${[...contagem.values()].find((v) => v.nome === n).total})`));

console.log("\nFundamentos de Cálculo e Geometria aparece?", nomes.includes("Fundamentos de Cálculo e Geometria") ? "SIM" : "NÃO");
console.log("Eletromagnetismo aparece?", nomes.includes("Eletromagnetismo") ? "SIM (inesperado, tem 0 questões no banco)" : "NÃO (correto, 0 questões)");
