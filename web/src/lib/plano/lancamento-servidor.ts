import { createAdminClient } from "@/lib/supabase/admin";
import { ehPro } from "./plano";
import { enviarBoasVindasPro } from "./boas-vindas";
import {
  PROMO_LANCAMENTO_CICLO,
  PROMO_LANCAMENTO_DIAS,
  promoLancamentoAtiva,
} from "./lancamento";

// A concessão da semana de lançamento pra UMA conta nova. Só servidor:
// `plano*` são colunas protegidas pelo trigger de
// supabase_seguranca_hardening.sql, então quem escreve é o service_role — a
// mesma trilha do pagamento aprovado e do cupom.
//
// Onde é chamada: `garantirProfile` (lib/auth/perfil.ts), no instante em que a
// linha de `profiles` nasce. Esse ponto foi escolhido por ser o ÚNICO que as
// duas portas de entrada atravessam (login e confirmação de e-mail) e por só
// acontecer uma vez na vida da conta — o que torna a concessão idempotente de
// graça, sem tabela de controle.
//
// FALHA ABERTA, sempre. Um brinde não pode derrubar um cadastro: se o
// service_role não estiver configurado, se o Supabase engasgar, se qualquer
// coisa aqui dentro lançar, a conta é criada do mesmo jeito e a pessoa entra
// no plano grátis. O erro barato é alguém não receber a semana; o caro é a
// pessoa não conseguir criar conta no dia do lançamento.
export async function concederProLancamento(userId: string): Promise<boolean> {
  try {
    if (!promoLancamentoAtiva()) return false;

    const admin = createAdminClient();

    const { data: profile, error: errLeitura } = await admin
      .from("profiles")
      .select("plano, plano_ciclo, plano_desde, plano_expira_em")
      .eq("id", userId)
      .maybeSingle();
    if (errLeitura) {
      console.error("Semana Pro: falha ao ler o profile", userId, errLeitura);
      return false;
    }
    // Conta nova não deveria estar Pro — mas se estiver (um cupom resgatado
    // pelo link de convite antes daqui, por exemplo), a semana não encosta:
    // conceder por cima ENCURTARIA o que a pessoa já tem. Mesma regra do
    // script SQL da base existente.
    if (!profile || ehPro(profile)) return false;

    const agora = new Date();
    const expira = new Date(
      agora.getTime() + PROMO_LANCAMENTO_DIAS * 24 * 60 * 60 * 1000,
    );

    const { error } = await admin
      .from("profiles")
      .update({
        plano: "pro",
        plano_ciclo: PROMO_LANCAMENTO_CICLO,
        plano_desde: profile.plano_desde ?? agora.toISOString(),
        plano_expira_em: expira.toISOString(),
        plano_fidelidade_ate: null,
      })
      .eq("id", userId);
    if (error) {
      console.error("Semana Pro: falha ao conceder", userId, error);
      return false;
    }

    // Mesma régua dos outros caminhos (pago e cupom): quem NÃO estava Pro e
    // passou a estar recebe o inventário do que ganhou. Aqui ele carrega uma
    // coisa a mais, e é a razão de o e-mail existir neste caso: a data em que
    // acaba. Ninguém pode descobrir que o acesso era temporário no dia em que
    // ele some.
    await enviarBoasVindasPro({
      userId,
      ciclo: PROMO_LANCAMENTO_CICLO,
      expiraEm: expira.toISOString(),
      origem: "lancamento",
      retorno: Boolean(profile.plano_desde),
    });

    return true;
  } catch (e) {
    console.error("Semana Pro: erro inesperado ao conceder", userId, e);
    return false;
  }
}
