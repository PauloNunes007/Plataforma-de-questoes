import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { CAMPANHA_LANCAMENTO_PRO } from "@/lib/email/templates-campanha";
import { baseDoApp, previaCampanha } from "@/lib/email/campanha";
import { CampanhaEmail } from "@/components/admin/campanha-email";

export const metadata: Metadata = {
  title: "E-mails",
};

// Um lote pode levar dezenas de segundos (são chamadas à API da Brevo, uma por
// aluno). O padrão da Vercel corta bem antes disso e o disparo morreria no
// meio — deixando linhas em 'enviando' que ninguém mandou.
export const maxDuration = 60;

export default async function AdminEmailsPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  let link = "";
  let previaInicial = "";
  let erroBase: string | null = null;
  try {
    link = `${baseDoApp()}/login`;
    previaInicial = previaCampanha(CAMPANHA_LANCAMENTO_PRO, link, "Paulo");
  } catch (e) {
    erroBase = e instanceof Error ? e.message : String(e);
  }

  return (
    <CampanhaEmail
      conteudoPadrao={CAMPANHA_LANCAMENTO_PRO}
      linkPadrao={link}
      previaInicial={previaInicial}
      erroBase={erroBase}
      emailAdmin={user.email ?? ""}
    />
  );
}
