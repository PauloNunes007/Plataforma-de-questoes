// ============================================================
// Disparo MANUAL do relatório semanal (Pro) pra UM aluno só, por e-mail.
//
// Existe porque o cron oficial (app/api/cron/relatorio-semanal) processa TODA
// a base de assinantes Pro de uma vez — não dá pra usá-lo pra testar/reenviar
// pra uma conta sem arriscar mandar e-mail pra gente que não pediu. Este
// script repete a mesma lógica (montarRelatorioSemanal + template + Brevo)
// mas filtrado a um único endereço, e ignora `valeEnviar`/`relatorio_envios`
// de propósito: é um disparo manual, não a rodada de segunda.
//
//   cd web && npx tsx scripts/relatorio-semanal-manual.ts paulocresponunes@gmail.com
//
// Precisa de EMAIL_REMETENTE no ambiente (só existe no Vercel — copie pro
// .env.local antes, como no boas-vindas-pro-retroativo.ts).
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { montarRelatorioSemanal } from "../src/lib/relatorio/relatorio-data";
import { montarEmailRelatorioSemanal } from "../src/lib/email/templates-relatorio";
import { enviarEmail, remetenteConfigurado } from "../src/lib/email/enviar";

function carregarEnv(): void {
  const arquivo = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(arquivo)) return;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const corte = linha.indexOf("=");
    if (corte <= 0 || linha.trimStart().startsWith("#")) continue;
    const chave = linha.slice(0, corte).trim();
    if (process.env[chave]) continue;
    process.env[chave] = linha.slice(corte + 1).trim();
  }
}
carregarEnv();

async function buscarUserIdPorEmail(url: string, chave: string, email: string): Promise<string | null> {
  // auth.admin.listUsers do supabase-js não tipa `filter`, mas o GoTrue aceita
  // na querystring — é o mesmo endpoint que lib/email/campanha.ts pisa.
  const resposta = await fetch(
    `${url.replace(/\/+$/, "")}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
    { headers: { apikey: chave, Authorization: `Bearer ${chave}` } },
  );
  if (!resposta.ok) {
    console.error(`Falha ao buscar usuário (${resposta.status}):`, await resposta.text().catch(() => ""));
    return null;
  }
  const corpo = (await resposta.json()) as { users?: { id: string; email?: string }[] };
  const achado = (corpo.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return achado?.id ?? null;
}

async function main(): Promise<void> {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    console.error("Uso: npx tsx scripts/relatorio-semanal-manual.ts <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  if (!remetenteConfigurado()) {
    console.error("EMAIL_REMETENTE não está no ambiente — sem ela a Brevo recusa o envio.");
    process.exit(1);
  }

  const admin = createClient(url, chave, { auth: { persistSession: false } });

  const userId = await buscarUserIdPorEmail(url, chave, email);
  if (!userId) {
    console.error(`Nenhuma conta encontrada para ${email}.`);
    process.exit(1);
  }

  const { data: perfil } = await admin.from("profiles").select("nome").eq("id", userId).maybeSingle();

  const relatorio = await montarRelatorioSemanal(admin, userId);
  console.log(
    `Semana ${relatorio.semana} (${relatorio.periodoLabel}): ${relatorio.questoes} questões, ` +
      `${relatorio.alertas.length} alerta(s). valeEnviar=${relatorio.valeEnviar} (ignorado — disparo manual).`,
  );

  const msg = montarEmailRelatorioSemanal({ para: email, nome: perfil?.nome ?? null, relatorio });
  const res = await enviarEmail(msg);
  if (res.ok) {
    console.log(`✓ Enviado para ${email}.`);
  } else {
    console.error(`✗ Falha ao enviar: ${res.erro}`);
    process.exit(1);
  }
}

main();
