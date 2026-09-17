import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ehPro } from "@/lib/plano/plano";
import { enviarEmail, remetenteConfigurado } from "@/lib/email/enviar";
import { montarEmailRelatorioSemanal } from "@/lib/email/templates-relatorio";
import { montarRelatorioSemanal } from "@/lib/relatorio/relatorio-data";

// CRON do relatório semanal (Pro) — roda toda segunda de manhã.
//
// Agendamento: `vercel.json` (crons). O Vercel chama esta rota com o header
// `Authorization: Bearer $CRON_SECRET`; a rota também aceita `?secret=` pra
// permitir um disparo manual do admin durante um teste.
//
// **Segurança.** Sem `CRON_SECRET` configurado a rota RECUSA (401) em vez de
// liberar: uma rota que dispara e-mail pra base inteira, aberta na internet, é
// um canhão apontado pra reputação do nosso remetente. Falhar fechado aqui é o
// lado certo de falhar — o pior caso é ninguém receber o resumo de uma segunda.
//
// **Idempotência.** A linha em `relatorio_envios` é reivindicada ANTES do envio
// (`status='enviando'`), e o índice único `(user_id, semana)` é o que garante
// um e-mail por aluno por semana. Vale a mesma decisão de
// `email_campanha_envios` (supabase_email_campanha.sql): se a função morrer no
// meio, ela sub-envia em vez de enviar duas vezes. Receber o mesmo relatório
// duas vezes é o caminho mais curto pro botão de spam.
//
// **Quem recebe:** assinante Pro ativo, com `relatorio_semanal` ligado, e cuja
// semana teve alguma coisa a dizer (ver `valeEnviar`). Um e-mail de segunda
// dizendo "você fez 0 questões" não traz ninguém de volta.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// O plano gratuito do Vercel limita a execução; 60s dá conta da base atual
// enviando em série. Quando não der, o passo seguinte é paginar por `offset`
// na querystring — NÃO aumentar o paralelismo (a Brevo tem limite por minuto).
export const maxDuration = 60;

function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET?.trim();
  if (!segredo) return false;

  const header = req.headers.get("authorization")?.trim();
  if (header === `Bearer ${segredo}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret")?.trim() === segredo;
}

async function processar(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!remetenteConfigurado()) {
    return NextResponse.json({ erro: "remetente de e-mail não configurado" }, { status: 503 });
  }

  const admin = createAdminClient();

  // Candidatos: quem está marcado como Pro no banco e não desligou o resumo.
  // `ehPro` refina depois, em memória, porque a validade é comparação de data
  // e a fonte da verdade do "é Pro?" tem que ser uma só (lib/plano/plano.ts) —
  // reescrever essa regra como filtro SQL criaria a segunda.
  const { data: candidatos, error } = await admin
    .from("profiles")
    .select("id, nome, plano, plano_expira_em, relatorio_semanal")
    .eq("plano", "pro");

  if (error) {
    console.error("Cron do relatório semanal: falha ao listar assinantes", error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const alvos = (candidatos || []).filter((p) => ehPro(p) && p.relatorio_semanal !== false);

  let enviados = 0;
  let pulados = 0;
  let erros = 0;

  for (const perfil of alvos) {
    try {
      const relatorio = await montarRelatorioSemanal(admin, perfil.id);
      if (!relatorio.valeEnviar) {
        pulados += 1;
        continue;
      }

      // Reivindica a vaga ANTES de mandar. 23505 = outra execução já pegou
      // esta semana pra este aluno; não é erro, é o índice fazendo o trabalho.
      const { error: errClaim } = await admin.from("relatorio_envios").insert({
        user_id: perfil.id,
        semana: relatorio.semana,
        status: "enviando",
      });
      if (errClaim) {
        if (errClaim.code === "23505") {
          pulados += 1;
          continue;
        }
        throw new Error(errClaim.message);
      }

      const { data: userData } = await admin.auth.admin.getUserById(perfil.id);
      const para = userData?.user?.email;
      if (!para) {
        await admin
          .from("relatorio_envios")
          .update({ status: "erro", erro: "conta sem e-mail" })
          .eq("user_id", perfil.id)
          .eq("semana", relatorio.semana);
        erros += 1;
        continue;
      }

      const res = await enviarEmail(
        montarEmailRelatorioSemanal({ para, nome: perfil.nome ?? null, relatorio }),
      );

      await admin
        .from("relatorio_envios")
        .update(
          res.ok
            ? { status: "enviado", erro: null }
            : { status: "erro", erro: res.erro.slice(0, 400) },
        )
        .eq("user_id", perfil.id)
        .eq("semana", relatorio.semana);

      if (res.ok) enviados += 1;
      else erros += 1;
    } catch (e) {
      erros += 1;
      console.error("Cron do relatório semanal: erro no aluno", perfil.id, e);
    }
  }

  console.log(
    `Relatório semanal: ${enviados} enviados, ${pulados} pulados, ${erros} com erro (de ${alvos.length} assinantes).`,
  );
  return NextResponse.json({ ok: true, enviados, pulados, erros, assinantes: alvos.length });
}

// O Vercel chama crons por GET; o POST existe pro disparo manual e pra
// qualquer agendador externo que prefira verbo com corpo.
export async function GET(req: Request) {
  return processar(req);
}

export async function POST(req: Request) {
  return processar(req);
}
