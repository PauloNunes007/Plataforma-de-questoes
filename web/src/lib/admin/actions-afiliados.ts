"use server";

// Gestão do programa de parceiros pelo admin: cadastrar o parceiro, ver o que
// cada um rendeu, FECHAR o mês (transformar comissões aprovadas num repasse) e
// marcar o Pix como pago.
//
// Arquivo próprio, com o próprio `requireAdmin`, pela mesma razão de
// actions-campanha.ts: um módulo "use server" só exporta função async, então o
// helper de lib/admin/actions.ts (que devolve um SupabaseClient) não pode ser
// importado daqui. A checagem se repete em TODA ação porque Server Action é
// endpoint chamável direto — o redirect da página protege a tela, não a função.
//
// O fechamento escreve via service_role, e não com o client do admin, embora a
// policy `admin gerencia comissoes` permitisse: é a mesma trilha que escreve
// `profiles.plano` e `assinatura_pagamentos`. Dinheiro sai por um caminho só.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { aprovarComissoesVencidas } from "@/lib/afiliados/comissao";
import {
  comissaoCentavos,
  competenciaDe,
  DIAS_BONUS_PADRAO,
  faixaPorVendas,
  JANELA_MESES_PADRAO,
  MINIMO_REPASSE_CENTAVOS,
  normalizarCodigoParceiro,
} from "@/lib/afiliados/afiliados";
import { reais } from "@/lib/plano/plano";

async function requireAdmin(): Promise<{ email: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return { error: "Acesso restrito." };
  return { email: user.email };
}

function admin() {
  return createAdminClient();
}

export type AfiliadoAdmin = {
  id: string;
  codigo: string;
  nome: string;
  instagram: string | null;
  email: string | null;
  diasBonus: number;
  percentualFixo: number | null;
  janelaMeses: number;
  chavePix: string | null;
  ativo: boolean;
  observacao: string | null;
  criadoEm: string;
  vinculado: boolean;
  /* agregados */
  cliques: number;
  indicacoes: number;
  vendas: number;
  /** Comissão aprovada e ainda não repassada (projetada pela faixa do mês). */
  aReceberCentavos: number;
  /** Ainda dentro do prazo de arrependimento. */
  pendenteCentavos: number;
  /** Já repassado (Pix marcado como pago). */
  pagoCentavos: number;
  /** Receita bruta que este parceiro trouxe — o outro lado da conta. */
  receitaCentavos: number;
};

export async function listarAfiliadosAdminAction(): Promise<
  { afiliados: AfiliadoAdmin[] } | { error: string }
> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = admin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  // Aprova o que venceu antes de somar: sem isso a tela mostra "a receber R$ 0"
  // num parceiro cujas comissões já passaram do prazo de arrependimento, e o
  // admin conclui que não há o que pagar.
  await aprovarComissoesVencidas();

  const [{ data: linhas, error }, { data: comissoes }, { data: pagamentos }, { data: cliques }, { data: indicacoes }] =
    await Promise.all([
      db
        .from("afiliados")
        .select(
          "id, codigo, nome, instagram, email, user_id, dias_bonus, percentual_fixo, janela_meses, chave_pix, ativo, observacao, criado_em",
        )
        .order("criado_em", { ascending: false }),
      db
        .from("afiliado_comissoes")
        .select(
          "afiliado_id, competencia, valor_bruto_centavos, valor_base_centavos, valor_centavos, percentual, status, pagamento_id",
        ),
      db.from("afiliado_pagamentos").select("afiliado_id, valor_centavos, status"),
      db.from("afiliado_cliques").select("afiliado_id"),
      db.from("afiliado_indicacoes").select("afiliado_id"),
    ]);

  if (error) return { error: error.message };

  const contar = (rows: { afiliado_id: string }[] | null, id: string) =>
    (rows ?? []).filter((r) => r.afiliado_id === id).length;

  const afiliados: AfiliadoAdmin[] = (linhas ?? []).map((a) => {
    const minhas = (comissoes ?? []).filter((c) => c.afiliado_id === a.id && c.status !== "cancelada");

    // Faixa por competência, igual ao painel do parceiro e ao fechamento: os
    // três precisam chegar no MESMO número, senão o admin paga um valor que a
    // tela do parceiro nunca mostrou.
    const porMes = new Map<string, typeof minhas>();
    for (const c of minhas) {
      const k = c.competencia.slice(0, 10);
      const l = porMes.get(k);
      if (l) l.push(c);
      else porMes.set(k, [c]);
    }

    let aReceber = 0;
    let pendente = 0;
    for (const linhasMes of porMes.values()) {
      const pct = a.percentual_fixo ?? faixaPorVendas(linhasMes.length).percentual;
      for (const c of linhasMes) {
        if (c.pagamento_id) continue;
        const valor =
          c.percentual !== null && c.valor_centavos !== null
            ? c.valor_centavos
            : comissaoCentavos(c.valor_base_centavos, pct);
        if (c.status === "aprovada") aReceber += valor;
        else if (c.status === "pendente") pendente += valor;
      }
    }

    return {
      id: a.id,
      codigo: a.codigo,
      nome: a.nome,
      instagram: a.instagram,
      email: a.email,
      diasBonus: a.dias_bonus,
      percentualFixo: a.percentual_fixo,
      janelaMeses: a.janela_meses,
      chavePix: a.chave_pix,
      ativo: a.ativo,
      observacao: a.observacao,
      criadoEm: a.criado_em,
      vinculado: Boolean(a.user_id),
      cliques: contar(cliques, a.id),
      indicacoes: contar(indicacoes, a.id),
      vendas: minhas.length,
      aReceberCentavos: aReceber,
      pendenteCentavos: pendente,
      pagoCentavos: (pagamentos ?? [])
        .filter((p) => p.afiliado_id === a.id && p.status === "pago")
        .reduce((s, p) => s + p.valor_centavos, 0),
      receitaCentavos: minhas.reduce((s, c) => s + c.valor_bruto_centavos, 0),
    };
  });

  return { afiliados };
}

export async function criarAfiliadoAdminAction(input: {
  nome: string;
  codigo: string;
  instagram: string | null;
  email: string | null;
  diasBonus: number;
  percentualFixo: number | null;
  janelaMeses: number;
  observacao: string | null;
}): Promise<{ ok: true; id: string } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const nome = input.nome.trim();
  const codigo = normalizarCodigoParceiro(input.codigo);
  if (!nome) return { error: "Escreva o nome do parceiro." };
  if (codigo.length < 3) return { error: "O código precisa ter pelo menos 3 caracteres." };

  const diasBonus = Number.isInteger(input.diasBonus) ? input.diasBonus : DIAS_BONUS_PADRAO;
  if (diasBonus < 0 || diasBonus > 180) return { error: "Bônus entre 0 e 180 dias." };

  const janela = Number.isInteger(input.janelaMeses) ? input.janelaMeses : JANELA_MESES_PADRAO;
  if (janela < 1 || janela > 60) return { error: "Janela entre 1 e 60 meses." };

  if (
    input.percentualFixo !== null &&
    (!Number.isInteger(input.percentualFixo) ||
      input.percentualFixo < 0 ||
      input.percentualFixo > 100)
  ) {
    return { error: "Percentual fixo entre 0 e 100 (ou vazio pra usar a tabela de faixas)." };
  }

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = admin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  const { data, error } = await db
    .from("afiliados")
    .insert({
      nome,
      codigo,
      instagram: input.instagram?.trim().replace(/^@/, "") || null,
      email: input.email?.trim().toLowerCase() || null,
      dias_bonus: diasBonus,
      percentual_fixo: input.percentualFixo,
      janela_meses: janela,
      observacao: input.observacao?.trim() || null,
      criado_por: auth.email,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Já existe um parceiro com esse código." };
    return { error: error.message };
  }
  return { ok: true, id: data.id };
}

export async function atualizarAfiliadoAdminAction(
  id: string,
  campos: {
    ativo?: boolean;
    diasBonus?: number;
    percentualFixo?: number | null;
    chavePix?: string | null;
    observacao?: string | null;
  },
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const patch: Record<string, unknown> = {};
  if (typeof campos.ativo === "boolean") patch.ativo = campos.ativo;
  if (typeof campos.diasBonus === "number") {
    if (!Number.isInteger(campos.diasBonus) || campos.diasBonus < 0 || campos.diasBonus > 180) {
      return { error: "Bônus entre 0 e 180 dias." };
    }
    patch.dias_bonus = campos.diasBonus;
  }
  if (campos.percentualFixo !== undefined) {
    if (
      campos.percentualFixo !== null &&
      (!Number.isInteger(campos.percentualFixo) ||
        campos.percentualFixo < 0 ||
        campos.percentualFixo > 100)
    ) {
      return { error: "Percentual fixo entre 0 e 100." };
    }
    patch.percentual_fixo = campos.percentualFixo;
  }
  if (campos.chavePix !== undefined) patch.chave_pix = campos.chavePix?.trim() || null;
  if (campos.observacao !== undefined) patch.observacao = campos.observacao?.trim() || null;

  if (!Object.keys(patch).length) return { ok: true };

  try {
    const { error } = await admin().from("afiliados").update(patch).eq("id", id);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true };
}

/**
 * FECHA o que está devido a um parceiro: carimba o percentual da faixa em cada
 * comissão aprovada sem repasse e agrupa tudo num lote de Pix.
 *
 * Três decisões que moram aqui:
 *
 *  1. **A faixa é por competência, não pelo lote.** Um lote pode somar meses
 *     anteriores que não bateram o piso; aplicar a faixa do lote inteiro
 *     pagaria julho no percentual de setembro. Cada mês é fechado com o volume
 *     que aquele mês teve.
 *  2. **O percentual é gravado na comissão.** Depois do fechamento, aquele
 *     valor não muda mais — é a promessa feita, e projeção nenhuma passa por
 *     cima dela (ver `projetarPorCompetencia`).
 *  3. **Abaixo do piso, não fecha.** O saldo acumula pro mês seguinte, que é
 *     o que a proposta diz. Como o fechamento sempre varre TODAS as
 *     competências não pagas, acumular funciona sem ninguém precisar lembrar.
 */
export async function fecharRepasseAdminAction(
  afiliadoId: string,
): Promise<
  { ok: true; valorCentavos: number; qtd: number; pagamentoId: string } | { error: string }
> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = admin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  await aprovarComissoesVencidas(afiliadoId);

  const { data: parceiro } = await db
    .from("afiliados")
    .select("id, percentual_fixo")
    .eq("id", afiliadoId)
    .maybeSingle();
  if (!parceiro) return { error: "Parceiro não encontrado." };

  // O VOLUME do mês (que define a faixa) conta toda venda viva da competência,
  // inclusive a que ainda está no prazo de arrependimento: o mês do parceiro
  // foi o que foi. O que entra no LOTE é só o aprovado.
  const { data: todas } = await db
    .from("afiliado_comissoes")
    .select("id, competencia, valor_base_centavos, status, pagamento_id")
    .eq("afiliado_id", afiliadoId)
    .neq("status", "cancelada");

  const aprovadas = (todas ?? []).filter((c) => c.status === "aprovada" && !c.pagamento_id);
  if (!aprovadas.length) {
    return { error: "Não há comissão aprovada esperando repasse pra este parceiro." };
  }

  const volumePorMes = new Map<string, number>();
  for (const c of todas ?? []) {
    const k = c.competencia.slice(0, 10);
    volumePorMes.set(k, (volumePorMes.get(k) ?? 0) + 1);
  }

  const calculadas = aprovadas.map((c) => {
    const k = c.competencia.slice(0, 10);
    const pct = parceiro.percentual_fixo ?? faixaPorVendas(volumePorMes.get(k) ?? 1).percentual;
    return { id: c.id, percentual: pct, valor: comissaoCentavos(c.valor_base_centavos, pct) };
  });

  const total = calculadas.reduce((s, c) => s + c.valor, 0);
  if (total < MINIMO_REPASSE_CENTAVOS) {
    return {
      error: `O saldo aprovado é ${reais(total)} e o piso de repasse é ${reais(
        MINIMO_REPASSE_CENTAVOS,
      )}. Fica acumulado pro próximo fechamento — é o que a proposta promete.`,
    };
  }

  // A competência do REPASSE é o mês em que ele está sendo gerado (o Pix de
  // setembro), não o mês das vendas — que podem ser vários. O índice único
  // (afiliado_id, competencia) vira então a regra "um repasse por mês por
  // parceiro", que é exatamente a regra comercial.
  const { data: pagamento, error: errPag } = await db
    .from("afiliado_pagamentos")
    .insert({
      afiliado_id: afiliadoId,
      competencia: competenciaDe(),
      valor_centavos: total,
      qtd_comissoes: calculadas.length,
      status: "a_pagar",
    })
    .select("id")
    .single();

  if (errPag) {
    if (errPag.code === "23505") {
      return { error: "Já existe um repasse gerado pra este parceiro neste mês." };
    }
    return { error: errPag.message };
  }

  // Uma escrita por comissão: o valor difere por linha (preço e faixa), e são
  // dezenas, não milhares. Se uma falhar, ela fica sem `pagamento_id` e entra
  // no próximo fechamento — nunca é paga em duplicidade.
  for (const c of calculadas) {
    const { error } = await db
      .from("afiliado_comissoes")
      .update({ percentual: c.percentual, valor_centavos: c.valor, pagamento_id: pagamento.id })
      .eq("id", c.id)
      .is("pagamento_id", null);
    if (error) console.error("Comissão não entrou no repasse:", c.id, error.message);
  }

  return { ok: true, valorCentavos: total, qtd: calculadas.length, pagamentoId: pagamento.id };
}

export async function marcarRepassePagoAdminAction(
  pagamentoId: string,
  comprovante: string | null,
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = admin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  const { error } = await db
    .from("afiliado_pagamentos")
    .update({
      status: "pago",
      pago_em: new Date().toISOString(),
      comprovante: comprovante?.trim().slice(0, 300) || null,
    })
    .eq("id", pagamentoId);
  if (error) return { error: error.message };

  // As comissões do lote só viram 'paga' quando o dinheiro saiu de verdade.
  // Enquanto o Pix não foi feito elas continuam 'aprovada' com `pagamento_id`
  // preenchido — o estado honesto de "já contada, ainda não paga".
  const { error: errCom } = await db
    .from("afiliado_comissoes")
    .update({ status: "paga" })
    .eq("pagamento_id", pagamentoId)
    .eq("status", "aprovada");
  if (errCom) console.error("Repasse marcado como pago mas comissões não:", errCom.message);

  return { ok: true };
}

export type RepasseAdmin = {
  id: string;
  afiliadoId: string;
  competencia: string;
  valorCentavos: number;
  qtdComissoes: number;
  status: string;
  pagoEm: string | null;
  comprovante: string | null;
};

export async function listarRepassesAdminAction(): Promise<
  { repasses: RepasseAdmin[] } | { error: string }
> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  try {
    const { data, error } = await admin()
      .from("afiliado_pagamentos")
      .select("id, afiliado_id, competencia, valor_centavos, qtd_comissoes, status, pago_em, comprovante")
      .order("criado_em", { ascending: false })
      .limit(100);
    if (error) return { error: error.message };
    return {
      repasses: (data ?? []).map((r) => ({
        id: r.id,
        afiliadoId: r.afiliado_id,
        competencia: r.competencia,
        valorCentavos: r.valor_centavos,
        qtdComissoes: r.qtd_comissoes,
        status: r.status,
        pagoEm: r.pago_em,
        comprovante: r.comprovante,
      })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
