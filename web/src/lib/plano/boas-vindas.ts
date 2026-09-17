import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail, remetenteConfigurado } from "@/lib/email/enviar";
import { montarEmailBoasVindasPro } from "@/lib/email/templates-pro";

// O disparo do e-mail de boas-vindas ao Pro.
//
// Mora num arquivo separado de `ativar.ts` por uma razão de risco: ativar o
// plano é o caminho do DINHEIRO, e ele não pode ganhar nenhuma dependência que
// possa lançar. Aqui dentro, tudo é engolido — sem remetente configurado, sem
// e-mail no `auth.users`, provedor fora do ar: nada disso pode transformar um
// pagamento aprovado em erro.
//
// Também não existe tabela de controle de envio (diferente de
// `email_campanha_envios`): a idempotência vem de `profiles.plano_desde`, que
// é preenchido na mesma ativação e só é nulo uma vez na vida da conta (ver
// `estenderPro`). Uma segunda tabela aqui guardaria a mesma verdade num lugar
// a mais.
export async function enviarBoasVindasPro(input: {
  userId: string;
  ciclo: string | null;
  expiraEm: string | null;
}): Promise<void> {
  try {
    if (!remetenteConfigurado()) return;

    const admin = createAdminClient();

    // O endereço vem do `auth.users` (a fonte da verdade do login), nunca de
    // `profiles` — profiles não guarda e-mail, e copiar um pra lá criaria duas
    // versões do mesmo contato.
    const { data, error } = await admin.auth.admin.getUserById(input.userId);
    const para = data?.user?.email;
    if (error || !para) {
      console.error("Boas-vindas Pro: não achei o e-mail do aluno", input.userId, error);
      return;
    }

    const { data: perfil } = await admin
      .from("profiles")
      .select("nome")
      .eq("id", input.userId)
      .maybeSingle();

    const res = await enviarEmail(
      montarEmailBoasVindasPro({
        para,
        nome: perfil?.nome ?? null,
        ciclo: input.ciclo,
        expiraEm: input.expiraEm,
      }),
    );
    if (!res.ok) console.error("Boas-vindas Pro: falha no envio —", res.erro);
  } catch (e) {
    // Engolir aqui é a decisão certa: o aluno JÁ é Pro, e a tela /pro dá as
    // boas-vindas de qualquer jeito. Um throw faria o webhook do Mercado Pago
    // reprocessar uma ativação que já deu certo.
    console.error("Boas-vindas Pro: erro inesperado", e);
  }
}
