"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { descadastroValido } from "@/lib/email/descadastro";

// Desfazer do descadastro. Fica numa Server Action própria (e não na rota
// /api/email/descadastrar) porque quem chama é um botão numa página já aberta:
// não há redirect nem one-click envolvido, só um clique e uma frase mudando.
//
// Chamada SEM sessão, de propósito — a página é pública e a autorização é a
// mesma assinatura que trouxe a pessoa até aqui. Sem validar o token, qualquer
// um poderia reinscrever quem saiu, que é a versão pior do problema original.
export async function reativarEmailsAction(
  userId: string,
  token: string,
): Promise<{ ok: true } | { error: string }> {
  if (!descadastroValido(userId, token)) {
    return { error: "Este link não é mais válido." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ aceita_emails: true }).eq("id", userId);
  if (error) return { error: error.message };

  return { ok: true };
}
