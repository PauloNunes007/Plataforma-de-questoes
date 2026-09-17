import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail, remetenteConfigurado } from "@/lib/email/enviar";
import { montarEmailBoasVindasPro, type OrigemPro } from "@/lib/email/templates-pro";

// O disparo do e-mail de boas-vindas ao Pro.
//
// Mora num arquivo separado de `ativar.ts` por uma razão de risco: ativar o
// plano é o caminho do DINHEIRO, e ele não pode ganhar nenhuma dependência que
// possa lançar. Aqui dentro, tudo é engolido — sem remetente configurado, sem
// e-mail no `auth.users`, provedor fora do ar: nada disso pode transformar um
// pagamento aprovado em erro.
//
// Também não existe tabela de controle de envio (diferente de
// `email_campanha_envios`): quem decide o disparo é o estado do plano LIDO
// ANTES da ativação, no mesmo `select` que ela já fazia. Uma segunda tabela
// aqui guardaria a mesma verdade num lugar a mais.
//
// **Repasse de 2026-09-17 — quando este e-mail sai.** A régua era
// `profiles.plano_desde` vazio, ou seja: uma vez na vida da conta. Isso
// deixava mudo o caso mais importante depois do primeiro, o do aluno que foi
// Pro, deixou vencer e VOLTOU — pagando ou com cupom —, porque `plano_desde`
// nunca mais é nulo. A régua agora é a transição: o e-mail sai sempre que uma
// conta que NÃO estava Pro passa a estar (`ehPro` lido antes da escrita), e
// só aí. Renovar um plano ainda ativo continua calado, que renovar não é
// virar Pro — é o que impede a recorrente mensal de mandar isto todo mês.
export async function enviarBoasVindasPro(input: {
  userId: string;
  ciclo: string | null;
  expiraEm: string | null;
  origem: OrigemPro;
  /** Já foi Pro antes (tem `plano_desde`) e está voltando. */
  retorno: boolean;
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
        origem: input.origem,
        retorno: input.retorno,
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
