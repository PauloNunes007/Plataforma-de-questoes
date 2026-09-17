import { createAdminClient } from "@/lib/supabase/admin";
import { aprovarComissoesVencidas } from "@/lib/afiliados/comissao";
import {
  comissaoCentavos,
  competenciaDe,
  faixaPorVendas,
  MINIMO_REPASSE_CENTAVOS,
  proximaFaixa,
  type Faixa,
} from "@/lib/afiliados/afiliados";

// Leitura do painel do parceiro (/parceiro) — e das mesmas contas na tela do
// admin, que precisa enxergar exatamente o que o parceiro enxerga antes de
// mandar um Pix.
//
// Lê TUDO via service_role, mesmo o que a RLS já liberaria, por uma razão de
// desenho: metade destes números (cliques, contas criadas) vem de tabelas que
// o parceiro deliberadamente NÃO pode ler linha a linha — ele vê "38 contas
// vieram do seu link", nunca quem são. Agregar no servidor é o que torna essa
// promessa verdadeira em vez de uma convenção de tela.
//
// A comissão de uma venda só ganha percentual no FECHAMENTO do mês (a faixa
// depende do volume do mês inteiro — ver lib/afiliados/afiliados.ts). Até lá o
// painel mostra uma PROJEÇÃO, calculada com a faixa que o mês tem agora. É por
// isso que `projetarPorCompetencia` existe e é a única aritmética que decide o
// que aparece como "a receber".

export type ComissaoProjetada = {
  competencia: string;
  vendas: number;
  faixa: Faixa;
  percentual: number;
  baseCentavos: number;
  comissaoCentavos: number;
};

type LinhaComissao = {
  competencia: string;
  valor_base_centavos: number;
  valor_centavos: number | null;
  percentual: number | null;
  status: string;
};

/**
 * Agrupa comissões por competência e aplica a faixa daquele mês.
 *
 * Só conta 'pendente' e 'aprovada' no VOLUME do mês: comissão cancelada
 * (estorno) não é venda, e deixá-la contando empurraria o parceiro pra uma
 * faixa que ele não vendeu.
 *
 * Quando a linha já tem `percentual` (mês fechado), ele manda — o fechamento é
 * a palavra final, e recalcular por cima transformaria um valor já prometido
 * num número que muda sozinho.
 */
export function projetarPorCompetencia(
  comissoes: LinhaComissao[],
  percentualFixo: number | null,
): ComissaoProjetada[] {
  const porMes = new Map<string, LinhaComissao[]>();
  for (const c of comissoes) {
    if (c.status !== "pendente" && c.status !== "aprovada" && c.status !== "paga") continue;
    const chave = c.competencia.slice(0, 10);
    const lista = porMes.get(chave);
    if (lista) lista.push(c);
    else porMes.set(chave, [c]);
  }

  const saida: ComissaoProjetada[] = [];
  for (const [competencia, linhas] of porMes) {
    const vendas = linhas.length;
    const faixa = faixaPorVendas(vendas);
    const percentual = percentualFixo ?? faixa.percentual;
    let base = 0;
    let total = 0;
    for (const l of linhas) {
      base += l.valor_base_centavos;
      total +=
        l.percentual !== null && l.valor_centavos !== null
          ? l.valor_centavos
          : comissaoCentavos(l.valor_base_centavos, percentual);
    }
    saida.push({
      competencia,
      vendas,
      faixa,
      percentual,
      baseCentavos: base,
      comissaoCentavos: total,
    });
  }

  return saida.sort((a, b) => b.competencia.localeCompare(a.competencia));
}

export type ParceiroResumo = {
  id: string;
  codigo: string;
  nome: string;
  instagram: string | null;
  email: string | null;
  diasBonus: number;
  janelaMeses: number;
  percentualFixo: number | null;
  chavePix: string | null;
  ativo: boolean;
};

export type RepasseResumo = {
  id: string;
  competencia: string;
  valorCentavos: number;
  qtdComissoes: number;
  status: string;
  pagoEm: string | null;
};

export type PainelParceiro = {
  parceiro: ParceiroResumo;
  cliques: { total: number; ultimos30: number };
  indicacoes: { total: number; ultimos30: number };
  /** Alunos indicados que já compraram alguma vez (não identifica quem). */
  compradores: number;
  /** Mês corrente: volume, faixa e projeção. */
  mes: ComissaoProjetada & { faltamProxima: { faixa: Faixa; faltam: number } | null };
  /** Já liberado (passou o arrependimento) e ainda não repassado. */
  aReceberCentavos: number;
  /** Ainda dentro do prazo de arrependimento. */
  pendenteCentavos: number;
  /** Soma dos repasses já pagos. */
  recebidoCentavos: number;
  /** O saldo alcança o piso de repasse? */
  atingiuMinimo: boolean;
  repasses: RepasseResumo[];
  /** Últimas vendas, sem NADA que identifique o aluno. */
  ultimasVendas: {
    id: string;
    em: string;
    brutoCentavos: number;
    baseCentavos: number;
    status: string;
  }[];
};

async function contar(
  admin: ReturnType<typeof createAdminClient>,
  tabela: string,
  afiliadoId: string,
  coluna: string,
  desde?: Date,
): Promise<number> {
  let q = admin
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq("afiliado_id", afiliadoId);
  if (desde) q = q.gte(coluna, desde.toISOString());
  const { count } = await q;
  return count ?? 0;
}

/**
 * Acha o parceiro da conta logada. Além do vínculo direto (`user_id`), tenta
 * casar pelo e-mail: o admin cadastra o parceiro ANTES de ele ter conta (o
 * cadastro nasce de uma conversa no Instagram, não de um formulário), e sem
 * isso o parceiro criaria a conta e encontraria um painel vazio, sem entender
 * por quê. O vínculo é gravado na primeira visita e não se repete.
 */
export async function acharParceiroDaConta(
  userId: string,
  email: string | null | undefined,
): Promise<ParceiroResumo | null> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  const colunas =
    "id, codigo, nome, instagram, email, dias_bonus, janela_meses, percentual_fixo, chave_pix, ativo";

  const { data: direto } = await admin
    .from("afiliados")
    .select(colunas)
    .eq("user_id", userId)
    .maybeSingle();

  let linha = direto;

  if (!linha && email) {
    const { data: porEmail } = await admin
      .from("afiliados")
      .select(colunas)
      .ilike("email", email)
      .is("user_id", null)
      .maybeSingle();
    if (porEmail) {
      // O índice único em user_id é quem garante um parceiro por conta; se
      // duas abas fizerem isso junto, a segunda falha e não quebra nada.
      const { error } = await admin
        .from("afiliados")
        .update({ user_id: userId })
        .eq("id", porEmail.id)
        .is("user_id", null);
      if (!error) linha = porEmail;
    }
  }

  if (!linha) return null;

  return {
    id: linha.id,
    codigo: linha.codigo,
    nome: linha.nome,
    instagram: linha.instagram,
    email: linha.email,
    diasBonus: linha.dias_bonus,
    janelaMeses: linha.janela_meses,
    percentualFixo: linha.percentual_fixo,
    chavePix: linha.chave_pix,
    ativo: linha.ativo,
  };
}

export async function carregarPainelParceiro(
  parceiro: ParceiroResumo,
): Promise<PainelParceiro | null> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  // Preguiçoso, como o rollover da liga: quem abre o painel é exatamente quem
  // se importa se a comissão de 8 dias atrás já venceu o arrependimento.
  await aprovarComissoesVencidas(parceiro.id);

  const trintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    cliquesTotal,
    cliques30,
    indicacoesTotal,
    indicacoes30,
    { data: comissoes },
    { data: repasses },
  ] = await Promise.all([
    contar(admin, "afiliado_cliques", parceiro.id, "criado_em"),
    contar(admin, "afiliado_cliques", parceiro.id, "criado_em", trintaDias),
    contar(admin, "afiliado_indicacoes", parceiro.id, "criada_em"),
    contar(admin, "afiliado_indicacoes", parceiro.id, "criada_em", trintaDias),
    admin
      .from("afiliado_comissoes")
      .select(
        "id, competencia, valor_bruto_centavos, valor_base_centavos, valor_centavos, percentual, status, pagamento_id, criada_em, user_id",
      )
      .eq("afiliado_id", parceiro.id)
      .order("criada_em", { ascending: false }),
    admin
      .from("afiliado_pagamentos")
      .select("id, competencia, valor_centavos, qtd_comissoes, status, pago_em")
      .eq("afiliado_id", parceiro.id)
      .order("competencia", { ascending: false }),
  ]);

  const linhas = comissoes ?? [];
  const vivas = linhas.filter((c) => c.status !== "cancelada");

  const projecao = projetarPorCompetencia(vivas, parceiro.percentualFixo);
  const competenciaAtual = competenciaDe();
  const mesAtual =
    projecao.find((p) => p.competencia === competenciaAtual) ??
    ({
      competencia: competenciaAtual,
      vendas: 0,
      faixa: faixaPorVendas(0),
      percentual: parceiro.percentualFixo ?? faixaPorVendas(0).percentual,
      baseCentavos: 0,
      comissaoCentavos: 0,
    } satisfies ComissaoProjetada);

  // "A receber" e "pendente" precisam usar a faixa do MÊS INTEIRO, não a do
  // subconjunto que estou somando. Projetar só as aprovadas daria um volume
  // menor, logo uma faixa menor, logo um número abaixo do que o fechamento
  // (lib/admin/actions-afiliados.ts, que conta toda venda viva da competência)
  // vai efetivamente pagar — e um painel que mostra menos do que o parceiro
  // recebe quebra a confiança na mesma moeda em que um que mostra mais.
  const tarifaDoMes = new Map<string, number>();
  for (const p of projetarPorCompetencia(vivas, parceiro.percentualFixo)) {
    tarifaDoMes.set(p.competencia, p.percentual);
  }

  let aReceberCentavos = 0;
  let pendenteCentavos = 0;
  for (const c of vivas) {
    if (c.pagamento_id) continue;
    const pct = tarifaDoMes.get(c.competencia.slice(0, 10)) ?? mesAtual.percentual;
    const valor =
      c.percentual !== null && c.valor_centavos !== null
        ? c.valor_centavos
        : comissaoCentavos(c.valor_base_centavos, pct);
    if (c.status === "aprovada") aReceberCentavos += valor;
    else if (c.status === "pendente") pendenteCentavos += valor;
  }
  const recebidoCentavos = (repasses ?? [])
    .filter((r) => r.status === "pago")
    .reduce((s, r) => s + r.valor_centavos, 0);

  const compradores = new Set(vivas.map((c) => c.user_id).filter(Boolean)).size;

  return {
    parceiro,
    cliques: { total: cliquesTotal, ultimos30: cliques30 },
    indicacoes: { total: indicacoesTotal, ultimos30: indicacoes30 },
    compradores,
    mes: {
      ...mesAtual,
      faltamProxima: parceiro.percentualFixo === null ? proximaFaixa(mesAtual.vendas) : null,
    },
    aReceberCentavos,
    pendenteCentavos,
    recebidoCentavos,
    atingiuMinimo: aReceberCentavos >= MINIMO_REPASSE_CENTAVOS,
    repasses: (repasses ?? []).map((r) => ({
      id: r.id,
      competencia: r.competencia,
      valorCentavos: r.valor_centavos,
      qtdComissoes: r.qtd_comissoes,
      status: r.status,
      pagoEm: r.pago_em,
    })),
    ultimasVendas: linhas.slice(0, 12).map((c) => ({
      id: c.id,
      em: c.criada_em,
      brutoCentavos: c.valor_bruto_centavos,
      baseCentavos: c.valor_base_centavos,
      status: c.status,
    })),
  };
}
