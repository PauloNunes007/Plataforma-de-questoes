"use server";

// Server Actions do programa de parceiros — o lado de quem CHEGA pelo link
// (registrar o clique, carimbar a indicação, liberar o bônus) e o punhado de
// coisas que o próprio parceiro escreve (a chave Pix).
//
// A gestão do admin (criar parceiro, fechar o mês, marcar o Pix como pago)
// mora em lib/admin/actions-afiliados.ts; a leitura do painel, em
// lib/afiliados/painel.ts.
//
// Tudo que escreve dinheiro ou plano passa por service_role, nunca pelo
// cliente do aluno: `profiles.plano` é protegida pelo trigger de segurança
// (supabase_seguranca_hardening.sql) e as tabelas de afiliado não têm policy
// de escrita pra ninguém além do admin — de propósito.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ehPro } from "@/lib/plano/plano";
import { adicionarMeses } from "@/lib/plano/preapproval";
import { enviarBoasVindasPro } from "@/lib/plano/boas-vindas";
import {
  atribuivel,
  lerValorCookie,
  normalizarCodigoParceiro,
} from "@/lib/afiliados/afiliados";

/* ------------------------------------------------- consulta pública */

export type EstadoParceiro =
  | {
      estado: "valido";
      codigo: string;
      nome: string;
      instagram: string | null;
      diasBonus: number;
    }
  | { estado: "invalido"; codigo: string };

/**
 * O que a página /p/[codigo] precisa pra se desenhar com honestidade. Busca
 * por código EXATO — nunca lista parceiros, do mesmo jeito que
 * `consultarConviteAction` nunca lista cupons.
 *
 * Parceiro desativado é tratado como inexistente: quem recebeu o link não
 * precisa saber a diferença, e as duas telas seriam iguais.
 */
export async function consultarParceiroAction(codigoBruto: string): Promise<EstadoParceiro> {
  const codigo = normalizarCodigoParceiro(codigoBruto);
  if (!codigo) return { estado: "invalido", codigo: "" };

  // Sem SUPABASE_SERVICE_ROLE_KEY o createAdminClient LANÇA. Aqui isso não
  // pode virar tela de erro: a pessoa chegou por um link de Instagram, e
  // "link não encontrado" é melhor que um crash.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { estado: "invalido", codigo };
  }

  const { data } = await admin
    .from("afiliados")
    .select("codigo, nome, instagram, dias_bonus, ativo")
    .ilike("codigo", codigo)
    .maybeSingle();

  if (!data || !data.ativo) return { estado: "invalido", codigo };

  return {
    estado: "valido",
    codigo: data.codigo,
    nome: data.nome,
    instagram: data.instagram,
    diasBonus: data.dias_bonus,
  };
}

/**
 * Conta uma abertura do link. Serve só pra taxa de conversão do painel, então
 * falha calada: um clique perdido é ruído, e não há nada a dizer ao visitante
 * sobre isso.
 *
 * Chamada do CLIENTE (efeito na página /p), não do render do servidor: é o que
 * mantém fora da conta o prefetch do Next e boa parte dos robôs de preview de
 * link — que são muitos, num link colado no Instagram.
 */
export async function registrarCliqueParceiroAction(codigoBruto: string): Promise<void> {
  const codigo = normalizarCodigoParceiro(codigoBruto);
  if (!codigo) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("afiliados")
      .select("id, ativo")
      .ilike("codigo", codigo)
      .maybeSingle();
    if (!data?.ativo) return;
    await admin.from("afiliado_cliques").insert({ afiliado_id: data.id });
  } catch {
    /* clique é métrica, não dinheiro */
  }
}

/* --------------------------------------------------- atribuição */

export type ResultadoIndicacao =
  | { ok: true; diasBonus: number; parceiro: string }
  | { ok: false; motivo: string };

/**
 * Carimba a conta logada como indicação do parceiro do cookie e libera o bônus
 * de Pro. Chamada uma vez, da primeira tela logada (components/afiliados/
 * indicacao-auto.tsx) — que é o primeiro instante em que a linha de `profiles`
 * já existe e o plano pode ser escrito nela.
 *
 * As quatro recusas possíveis são o programa inteiro se protegendo:
 *
 *   • conta criada ANTES do clique → cliente que a plataforma já tinha;
 *   • conta já indicada → uma conta pertence a um parceiro só, pra sempre;
 *   • o parceiro indicando a si mesmo → auto-comissão;
 *   • parceiro inativo → o link saiu do ar.
 *
 * Nenhuma delas é erro de verdade pro aluno: ele segue pro app normalmente e
 * a tela não diz nada.
 */
export async function registrarIndicacaoAction(
  valorCookie: string,
): Promise<ResultadoIndicacao> {
  const lido = lerValorCookie(valorCookie);
  if (!lido) return { ok: false, motivo: "cookie inválido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, motivo: "sem sessão" };

  // Só conta nova. É a regra que impede o parceiro de faturar sobre alunos
  // que a plataforma já havia conquistado (ver `atribuivel`).
  if (!atribuivel(user.created_at, lido.clicadoEm)) {
    return { ok: false, motivo: "conta anterior ao clique" };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, motivo: "service role ausente" };
  }

  const { data: afiliado } = await admin
    .from("afiliados")
    .select("id, codigo, nome, user_id, dias_bonus, janela_meses, ativo")
    .ilike("codigo", lido.codigo)
    .maybeSingle();
  if (!afiliado?.ativo) return { ok: false, motivo: "parceiro inválido" };
  if (afiliado.user_id === user.id) return { ok: false, motivo: "auto-indicação" };

  const { data: jaTem } = await admin
    .from("afiliado_indicacoes")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (jaTem) return { ok: false, motivo: "conta já indicada" };

  const agora = new Date();
  const { error: errIndicacao } = await admin.from("afiliado_indicacoes").insert({
    afiliado_id: afiliado.id,
    user_id: user.id,
    codigo: afiliado.codigo,
    bonus_dias: afiliado.dias_bonus,
    janela_ate: adicionarMeses(agora, afiliado.janela_meses).toISOString(),
  });
  if (errIndicacao) {
    // 23505 = o índice único de uma indicação por conta. Duas abas abertas
    // chegando juntas é o caso comum; a segunda simplesmente não faz nada.
    if (errIndicacao.code !== "23505") {
      console.error("Indicação não registrada:", errIndicacao.message);
    }
    return { ok: false, motivo: "conta já indicada" };
  }

  if (afiliado.dias_bonus <= 0) {
    return { ok: true, diasBonus: 0, parceiro: afiliado.nome };
  }

  // Bônus de Pro — mesma régua do cupom (lib/plano/actions.ts): os dias SOMAM
  // em cima da validade atual quando já existe Pro. Ganhar um bônus nunca
  // pode encurtar o que o aluno já tinha.
  const { data: profile } = await admin
    .from("profiles")
    .select("plano, plano_ciclo, plano_desde, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  // Sem profile o update afetaria ZERO linhas sem erro nenhum, e a indicação
  // ficaria registrada prometendo um Pro que nunca apareceu. A indicação em si
  // continua valendo (é ela que paga o parceiro); só o bônus fica pra depois.
  if (!profile) return { ok: true, diasBonus: 0, parceiro: afiliado.nome };

  const jaPro = ehPro(profile);
  const base = jaPro && profile.plano_expira_em ? new Date(profile.plano_expira_em) : agora;
  const novaExpira = new Date(base.getTime() + afiliado.dias_bonus * 24 * 60 * 60 * 1000);

  const { error: errPlano } = await admin
    .from("profiles")
    .update({
      plano: "pro",
      plano_ciclo: jaPro ? profile.plano_ciclo : "cupom",
      plano_desde: jaPro ? profile.plano_desde : agora.toISOString(),
      plano_expira_em: novaExpira.toISOString(),
    })
    .eq("id", user.id);
  if (errPlano) {
    console.error("Bônus de indicação não aplicado:", errPlano.message);
    return { ok: true, diasBonus: 0, parceiro: afiliado.nome };
  }

  if (!jaPro) {
    await enviarBoasVindasPro({
      userId: user.id,
      ciclo: "cupom",
      expiraEm: novaExpira.toISOString(),
      origem: "cupom",
      retorno: Boolean(profile.plano_desde),
    });
  }

  return { ok: true, diasBonus: afiliado.dias_bonus, parceiro: afiliado.nome };
}

/* ------------------------------------------------ o parceiro escreve */

/**
 * Chave Pix do repasse. Passa por service_role depois de conferir a sessão
 * porque `afiliados` não tem policy de UPDATE pro dono: dar uma ao dono
 * abriria `percentual_fixo`, `dias_bonus` e `ativo` pro console do navegador —
 * o parceiro se daria 90% de comissão em duas linhas de JS.
 */
export async function salvarChavePixAction(
  chave: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const limpa = chave.trim().slice(0, 140);

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Não foi possível salvar agora. Tente de novo em instantes." };
  }

  const { data, error } = await admin
    .from("afiliados")
    .update({ chave_pix: limpa || null })
    .eq("user_id", user.id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Sua conta não está vinculada a nenhum parceiro." };

  return { ok: true };
}
