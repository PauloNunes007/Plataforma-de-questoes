// ============================================================
// Reenvio das BOAS-VINDAS AO PRO pra quem já era Pro antes do e-mail existir.
//
//   Pré-visualizar (não manda nada, escreve os HTMLs em disco):
//     cd web && npx tsx scripts/boas-vindas-pro-retroativo.ts
//   Mandar de verdade:
//     cd web && npx tsx scripts/boas-vindas-pro-retroativo.ts --enviar
//   Mandar só pra um endereço:
//     ... --enviar --so paulocresponunes@gmail.com
//
// Por que um script e não um botão no /admin: o e-mail de boas-vindas nasceu
// em 2026-09-17 e o disparo é por TRANSIÇÃO (lib/plano/boas-vindas.ts) — quem
// já estava Pro naquele dia nunca vai cruzar a transição de novo, então não
// existe caminho no app que alcance essas contas. É um acerto de retaguarda,
// de uma vez, não um recurso.
//
// **Não existe registro de quem já recebeu.** O disparo normal não tem tabela
// de controle (a verdade dele é o estado do plano), então rodar isto duas
// vezes manda duas vezes. Com o punhado de contas Pro que existe, conferir a
// lista impressa antes de passar `--enviar` é mais honesto que inventar uma
// tabela de bookkeeping pra um mutirão que roda uma vez.
//
// Precisa de EMAIL_REMETENTE no ambiente (ver PUBLICAR.md). Ela mora só no
// Vercel — pra rodar daqui, copie pro .env.local antes.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { ehPro } from "../src/lib/plano/plano";
import { montarEmailBoasVindasPro, type OrigemPro } from "../src/lib/email/templates-pro";
import { enviarEmail, remetenteConfigurado } from "../src/lib/email/enviar";

// .env.local na mão: tsx não carrega env de arquivo como o Next faz.
function carregarEnv(): void {
  const arquivo = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(arquivo)) return;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const corte = linha.indexOf("=");
    if (corte <= 0 || linha.trimStart().startsWith("#")) continue;
    const chave = linha.slice(0, corte).trim();
    if (process.env[chave]) continue; // ambiente real ganha do arquivo
    process.env[chave] = linha.slice(corte + 1).trim();
  }
}
carregarEnv();

type PerfilPro = {
  id: string;
  nome: string | null;
  plano: string | null;
  plano_ciclo: string | null;
  plano_desde: string | null;
  plano_expira_em: string | null;
};

async function main(): Promise<void> {
  const enviar = process.argv.includes("--enviar");
  const so = (() => {
    const i = process.argv.indexOf("--so");
    return i >= 0 ? (process.argv[i + 1] ?? "").trim().toLowerCase() : "";
  })();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const admin = createClient(url, chave, { auth: { persistSession: false } });

  const { data, error } = await admin
    .from("profiles")
    .select("id, nome, plano, plano_ciclo, plano_desde, plano_expira_em")
    .eq("plano", "pro")
    .order("plano_desde", { ascending: true });
  if (error) {
    console.error("Falha ao ler profiles:", error.message);
    process.exit(1);
  }

  // Só quem está Pro AGORA. Uma conta com `plano='pro'` vencida não deve receber
  // "seu Pro está ativo" — ela não tem mais nada liberado pra comemorar.
  const vigentes = (data as PerfilPro[]).filter((p) => ehPro(p));

  const pasta = path.join(process.cwd(), ".previa-emails");
  if (!enviar) fs.mkdirSync(pasta, { recursive: true });

  console.log(
    `${vigentes.length} conta(s) Pro vigente(s) de ${data!.length} com plano='pro'.` +
      (enviar ? "  MODO ENVIO." : "  Pré-visualização — nada será enviado."),
  );
  if (enviar && !remetenteConfigurado()) {
    console.error("\nEMAIL_REMETENTE não está no ambiente — sem ela a Brevo recusa o envio.");
    process.exit(1);
  }

  let mandados = 0;
  for (const p of vigentes) {
    const { data: conta, error: errConta } = await admin.auth.admin.getUserById(p.id);
    const para = conta?.user?.email;
    if (errConta || !para) {
      console.log(`  ! ${p.nome ?? p.id}: sem e-mail no auth.users — pulado.`);
      continue;
    }
    if (so && para.toLowerCase() !== so) continue;

    // Cupom vs. pago muda o agradecimento e o rodapé (nada de "pagamento
    // confirmado" pra quem não pagou). `retorno: false` porque este mutirão é,
    // por definição, a primeira vez que estas contas recebem as boas-vindas.
    const origem: OrigemPro = p.plano_ciclo === "cupom" ? "cupom" : "pago";
    const msg = montarEmailBoasVindasPro({
      para,
      nome: p.nome,
      ciclo: p.plano_ciclo,
      expiraEm: p.plano_expira_em,
      origem,
      retorno: false,
    });

    if (!enviar) {
      const arquivo = path.join(pasta, `${para.replace(/[^a-z0-9]+/gi, "_")}.html`);
      fs.writeFileSync(arquivo, msg.html, "utf8");
      console.log(`  · ${para}  [${origem}]  "${msg.assunto}"  → ${arquivo}`);
      continue;
    }

    const res = await enviarEmail(msg);
    console.log(`  ${res.ok ? "✓" : "✗"} ${para}  [${origem}]${res.ok ? "" : "  " + res.erro}`);
    if (res.ok) mandados++;
  }

  console.log(enviar ? `\n${mandados} e-mail(s) enviado(s).` : `\nAbra os HTMLs em ${pasta}`);
}

main();
