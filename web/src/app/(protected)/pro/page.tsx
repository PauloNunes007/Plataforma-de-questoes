import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import {
  buscarMinhaAssinaturaPendenteAction,
  conferirPagamentoAction,
  resumoAssinaturaAction,
} from "@/lib/plano/actions";
import { ehPro, opcoesVisiveis } from "@/lib/plano/plano";
import { metodosPagamentoMP } from "@/lib/plano/mercadopago";
import { recorrenteHabilitado } from "@/lib/plano/preapproval";
import { PlanosView } from "@/components/plano/planos-view";
import { GerenciarAssinatura } from "@/components/plano/gerenciar-assinatura";

export const metadata: Metadata = {
  title: "Pro",
};

// Nunca cachear: o estado do plano muda no meio do fluxo de pagamento.
export const dynamic = "force-dynamic";

// Query params que o Mercado Pago cola nas back_urls quando o aluno volta do
// checkout. `payment_id`/`collection_id` são o mesmo número em nomes
// diferentes (legado do MP) — usamos o que vier.
type ProSearchParams = {
  status?: string;
  payment_id?: string;
  collection_id?: string;
  collection_status?: string;
};

export default async function ProPage({
  searchParams,
}: {
  searchParams: Promise<ProSearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  // Volta do checkout: confere o pagamento na API do Mercado Pago ANTES de
  // renderizar, pra o aluno já cair na tela de "assinatura ativa" em vez de
  // num "aguardando" que dependeria do webhook. O webhook continua ligado (é
  // o caminho rápido e cobre quem fecha a aba); os dois chamam a mesma
  // ativação idempotente, então rodar os dois não duplica nada.
  const voltouDoCheckout =
    !!params.status || !!params.payment_id || !!params.collection_id;
  const paymentId =
    params.payment_id && params.payment_id !== "null"
      ? params.payment_id
      : params.collection_id && params.collection_id !== "null"
        ? params.collection_id
        : undefined;

  const conferencia = voltouDoCheckout ? await conferirPagamentoAction(paymentId) : null;

  const [{ data: profile }, pendente, metodos] = await Promise.all([
    supabase
      .from("profiles")
      .select("plano, plano_ciclo, plano_desde, plano_expira_em, plano_fidelidade_ate")
      .eq("id", user.id)
      .maybeSingle(),
    buscarMinhaAssinaturaPendenteAction(),
    // Os meios que a conta vendedora aceita HOJE. A tela só promete Pix/boleto
    // se eles existirem no checkout — ver `MetodosPagamento` em lib/plano/plano.ts.
    metodosPagamentoMP(),
  ]);

  const jaEhPro = ehPro(profile);

  // O menu de cancelamento só é montado pra quem TEM o que cancelar. Ele é
  // lido depois da conferência de propósito: quem acabou de pagar precisa ver
  // a saída já refletindo a compra que acabou de acontecer — inclusive o prazo
  // de arrependimento, que começa a correr agora (ver DIAS_ARREPENDIMENTO).
  const resumo = jaEhPro ? await resumoAssinaturaAction() : null;

  return (
    <div className="casca-media py-6 lg:py-8">
      <PlanosView
        // Quais opções esta instalação consegue cobrar de verdade é decidido
        // AQUI, no servidor, antes de desenhar o cartão — e não no clique. É o
        // que garante que "assinar" seja sempre um redirect limpo pro Mercado
        // Pago, sem aviso nenhum no meio do caixa.
        opcoes={opcoesVisiveis(recorrenteHabilitado())}
        metodos={metodos}
        jaEhPro={jaEhPro}
        ciclo={profile?.plano_ciclo ?? null}
        expiraEm={jaEhPro ? (profile?.plano_expira_em ?? null) : null}
        fidelidadeAte={jaEhPro ? (profile?.plano_fidelidade_ate ?? null) : null}
        pendenteInicial={pendente}
        voltouDoCheckout={voltouDoCheckout}
        conferenciaInicial={conferencia}
      />

      {/* A porta de saída fica na MESMA tela da porta de entrada: é o que o
          CDC art. 6º pede (cancelar não pode custar mais esforço que
          contratar) e o que evita o "onde eu cancelo isso?" virar e-mail. */}
      {resumo && (
        <div className="mt-8">
          <GerenciarAssinatura resumo={resumo} />
        </div>
      )}
    </div>
  );
}
