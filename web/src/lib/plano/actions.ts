"use server";

// Ações do ALUNO sobre o próprio plano. A ativação do Pro é manual e fica em
// lib/admin/actions.ts (o admin confirma o pagamento). Aqui o aluno só
// registra/cancela a intenção de assinar (uma linha 'pendente' em
// `assinaturas`).
import { createClient } from "@/lib/supabase/server";
import { acharOpcao } from "@/lib/plano/plano";
import { criarPreferenciaCheckout, mpConfigurado } from "@/lib/plano/mercadopago";

export type AssinaturaPendente = {
  id: string;
  ciclo: string;
  forma: string;
  valorCentavos: number;
  status: string;
  criadaEm: string;
};

export async function buscarMinhaAssinaturaPendenteAction(): Promise<AssinaturaPendente | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("assinaturas")
    .select("id, ciclo, forma, valor_centavos, status, criada_em")
    .eq("user_id", user.id)
    .eq("status", "pendente")
    .order("criada_em", { ascending: false })
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    ciclo: data.ciclo,
    forma: data.forma,
    valorCentavos: data.valor_centavos,
    status: data.status,
    criadaEm: data.criada_em,
  };
}

export async function criarAssinaturaAction(
  opcaoId: string,
): Promise<{ checkoutUrl: string } | { assinatura: AssinaturaPendente } | { error: string }> {
  const opcao = acharOpcao(opcaoId);
  if (!opcao) return { error: "Plano inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login pra assinar." };

  // Uma pendente por vez (índice parcial). Se o aluno tinha outra pendente
  // (ex.: trocou de plano), cancela antes — a RLS só deixa o dono fazer
  // pendente→cancelada (supabase_seguranca_hardening.sql).
  await supabase
    .from("assinaturas")
    .update({ status: "cancelada" })
    .eq("user_id", user.id)
    .eq("status", "pendente");

  const { data, error } = await supabase
    .from("assinaturas")
    .insert({
      user_id: user.id,
      ciclo: opcao.ciclo,
      forma: opcao.forma,
      valor_centavos: opcao.precoCentavos,
      status: "pendente",
    })
    .select("id, ciclo, forma, valor_centavos, status, criada_em")
    .single();

  if (error) return { error: error.message };

  // Com gateway configurado, manda pro checkout hospedado do Mercado Pago
  // (cartão/Pix, sem expor dado nenhum seu). Sem token, cai no fluxo manual —
  // registra a intenção e o admin confirma em /admin/assinaturas.
  if (mpConfigurado()) {
    const pref = await criarPreferenciaCheckout({
      assinaturaId: data.id,
      opcao,
      userEmail: user.email,
    });
    if ("url" in pref) return { checkoutUrl: pref.url };
    // Falhou criar a preferência: mantém a pendente e cai no fallback manual.
  }

  return {
    assinatura: {
      id: data.id,
      ciclo: data.ciclo,
      forma: data.forma,
      valorCentavos: data.valor_centavos,
      status: data.status,
      criadaEm: data.criada_em,
    },
  };
}

export async function cancelarAssinaturaPendenteAction(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  // RLS já garante que o aluno só mexe na própria linha; o eq extra é cinto e
  // suspensório e limita ao registro certo.
  const { error } = await supabase
    .from("assinaturas")
    .update({ status: "cancelada" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pendente");

  if (error) return { error: error.message };
  return { ok: true };
}
