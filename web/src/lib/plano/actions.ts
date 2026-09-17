"use server";

// Ações do ALUNO sobre o próprio plano: registra/cancela a intenção de assinar
// (uma linha 'pendente' em `assinaturas`), manda pro checkout do Mercado Pago e
// — o ponto importante — CONFERE o pagamento contra a API do MP pra liberar o
// Pro sozinho, sem admin nenhum no meio (`conferirPagamentoAction`).
//
// Há três caminhos que levam à MESMA ativação idempotente (lib/plano/ativar.ts):
//   1) webhook do MP (app/api/mercadopago/webhook) — o mais rápido;
//   2) volta do checkout / polling da tela /pro — `conferirPagamentoAction`,
//      que pergunta o status direto pro MP e não depende do webhook chegar;
//   3) confirmação manual do admin (lib/admin/actions.ts) — hoje só pra
//      contingência (gateway fora do ar, pagamento por fora).
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acharOpcao, ehPro, normalizarCodigoCupom } from "@/lib/plano/plano";
import {
  buscarPagamentoMP,
  buscarPagamentosPorReferencia,
  criarPreferenciaCheckout,
  mpConfigurado,
} from "@/lib/plano/mercadopago";
import {
  buscarPreapprovalMP,
  cancelarAssinaturaRecorrente,
  criarAssinaturaRecorrente,
  recorrenteHabilitado,
} from "@/lib/plano/preapproval";
import { creditarCobranca } from "@/lib/plano/ativar";

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
  // O id vem do cliente. Se a recorrência está desligada nesta instalação, a
  // tela nem oferece o plano recorrente — mas aceitar o id aqui abriria
  // justamente a porta que o flag existe pra manter fechada.
  if (opcao.forma === "recorrente" && !recorrenteHabilitado()) {
    return { error: "Plano indisponível." };
  }

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

  // Com gateway configurado, manda pro Mercado Pago. QUAL produto do MP
  // depende da forma de cobrança:
  //
  //   • à vista    → `/checkout/preferences`: uma cobrança, aceita Pix, boleto
  //     e cartão parcelado. É o caminho de TODA venda hoje;
  //   • recorrente → `/preapproval`: o MP cobra o cartão todo mês sozinho. Só
  //     chega aqui com `MP_RECORRENTE=1` (ver `recorrenteHabilitado`).
  //
  // **Repasse de 2026-09-17 — o caixa não interrompe mais.**
  //
  // Antes, todo plano recorrente tentava o preapproval e, na recusa, caía
  // sozinho pro checkout avulso de um mês. Como a compra passava a ser outra
  // coisa (um mês sem renovação em vez de uma assinatura), a tela tinha que
  // parar tudo e pedir um segundo clique — e o que o aluno via era um caixa
  // travado num aviso laranja.
  //
  // O degrau de degradação SAIU, e não porque a honestidade deixou de
  // importar: ela passou a ser garantida mais cedo. A tela só oferece o que
  // esta instalação consegue cobrar (`opcoesVisiveis(recorrenteHabilitado())`,
  // resolvido no servidor antes de renderizar), então não há discrepância a
  // avisar no meio do caminho. Se o gateway recusar mesmo assim, o certo é
  // dizer o motivo e deixar o aluno tentar de novo — nunca trocar o produto
  // por baixo dele.
  if (mpConfigurado()) {
    const criado = await (opcao.forma === "recorrente"
      ? criarAssinaturaRecorrente({ assinaturaId: data.id, opcao, userEmail: user.email })
      : criarPreferenciaCheckout({ assinaturaId: data.id, opcao, userEmail: user.email }));

    if ("url" in criado) {
      // Guarda a referência da assinatura no gateway pra conferência e
      // auditoria. Envolvido em try/catch porque `createAdminClient()` LANÇA
      // sem SUPABASE_SERVICE_ROLE_KEY — e nesse ponto a assinatura já existe no
      // Mercado Pago. Estourar aqui deixaria o aluno com uma assinatura aberta
      // lá e uma tela de erro aqui, que é o pior desfecho possível. A
      // conferência sabe achar a assinatura por `external_reference` mesmo sem
      // esta coluna.
      if ("preapprovalId" in criado) {
        try {
          await createAdminClient()
            .from("assinaturas")
            .update({ gateway_id: criado.preapprovalId })
            .eq("id", data.id);
        } catch (e) {
          console.error("Assinatura criada no MP mas gateway_id não foi salvo:", e);
        }
      }
      return { checkoutUrl: criado.url };
    }

    // O gateway está de pé e disse não. Cancela a pendente que acabou de
    // nascer (senão o índice parcial de "uma pendente por aluno" barra a
    // próxima tentativa) e devolve o motivo real, em vez do "confirmaremos
    // manualmente" — que é uma promessa de que alguém vai cobrar por fora, e
    // ninguém vai.
    await supabase
      .from("assinaturas")
      .update({ status: "cancelada" })
      .eq("id", data.id)
      .eq("user_id", user.id);
    return { error: criado.error };
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

// ------------------------------------------------------- conferência do MP
// Estados possíveis ao perguntar pro Mercado Pago "e aí, esse pagamento saiu?".
// `indisponivel` = sem MP_ACCESS_TOKEN (fluxo manual do admin).
export type EstadoPagamento =
  | "ativo"
  | "processando"
  | "recusado"
  | "sem_pendencia"
  | "indisponivel";

export type ConferenciaPagamento = {
  estado: EstadoPagamento;
  detalhe?: string;
};

// Status do MP que ainda podem virar "approved" — enquanto estiver num
// destes, a tela continua esperando (Pix leva segundos, cartão em análise
// pode levar minutos).
const STATUS_EM_ANDAMENTO = new Set([
  "pending",
  "in_process",
  "in_mediation",
  "authorized",
]);

function motivoRecusa(statusDetail: string | null): string {
  switch (statusDetail) {
    case "cc_rejected_insufficient_amount":
      return "Saldo/limite insuficiente no cartão.";
    case "cc_rejected_bad_filled_security_code":
      return "Código de segurança incorreto.";
    case "cc_rejected_bad_filled_date":
      return "Data de validade incorreta.";
    case "cc_rejected_bad_filled_other":
      return "Algum dado do cartão saiu errado.";
    case "cc_rejected_call_for_authorize":
      return "O banco pediu que você autorize a compra antes.";
    case "cc_rejected_high_risk":
      return "O emissor recusou a compra por segurança.";
    case "cc_rejected_max_attempts":
      return "Muitas tentativas com esse cartão.";
    case "expired":
      return "O prazo do pagamento expirou.";
    default:
      return "O pagamento não foi concluído.";
  }
}

// Pergunta pro Mercado Pago o status do pagamento do aluno e, se estiver
// aprovado, ATIVA o Pro na hora (mesma função idempotente do webhook).
//
// `paymentId` vem da volta do checkout (`/pro?payment_id=...`); sem ele,
// procuramos por `external_reference` = id da assinatura pendente — é assim
// que o polling da tela funciona mesmo quando o aluno fecha o checkout e volta
// pelo menu.
//
// Segurança: a assinatura sempre é lida pelo client do ALUNO com
// `.eq("user_id", user.id)` (a RLS é dona-só de qualquer jeito), então nunca dá
// pra ativar o Pro de outra conta passando um payment_id alheio.
export async function conferirPagamentoAction(
  paymentId?: string,
): Promise<ConferenciaPagamento> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { estado: "sem_pendencia" };

  // Já é Pro (o webhook chegou primeiro, ou é uma renovação): nada a fazer.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();
  if (ehPro(profile)) return { estado: "ativo" };

  if (!mpConfigurado()) return { estado: "indisponivel" };

  // 1) Caminho da volta do checkout: temos o id do pagamento na URL.
  if (paymentId) {
    const pag = await buscarPagamentoMP(paymentId);
    if (pag?.externalReference) {
      const { data: minha } = await supabase
        .from("assinaturas")
        .select("id, status")
        .eq("id", pag.externalReference)
        .eq("user_id", user.id)
        .maybeSingle();
      if (minha) {
        if (pag.status === "approved") {
          const res = await creditarCobranca({
            assinaturaId: minha.id,
            gatewayPaymentId: paymentId,
            observacao: "Pago via Mercado Pago",
          });
          if ("error" in res) {
            console.error("Erro ao creditar cobrança na volta do checkout:", res.error);
            return { estado: "processando" };
          }
          return { estado: "ativo" };
        }
        if (STATUS_EM_ANDAMENTO.has(pag.status)) return { estado: "processando" };
        return { estado: "recusado", detalhe: motivoRecusa(pag.statusDetail) };
      }
    }
  }

  // 2) Caminho do polling: procura pagamentos da assinatura pendente do aluno.
  const { data: pendentes } = await supabase
    .from("assinaturas")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pendente")
    .order("criada_em", { ascending: false })
    .limit(1);

  const assinaturaId = pendentes?.[0]?.id;
  if (!assinaturaId) return { estado: "sem_pendencia" };

  // 2a) Assinatura recorrente: o aluno AUTORIZA o cartão e a primeira cobrança
  // pode levar alguns minutos pra existir. Perguntar só por pagamento faria a
  // tela dizer "não concluído" logo depois de ele ter autorizado — e ele
  // tentaria de novo, abrindo uma segunda assinatura. Enquanto a preapproval
  // estiver 'pending'/'authorized' sem cobrança, o estado honesto é
  // "processando".
  const { data: dadosAss } = await supabase
    .from("assinaturas")
    .select("forma, gateway_id")
    .eq("id", assinaturaId)
    .maybeSingle();

  if (dadosAss?.forma === "recorrente" && dadosAss.gateway_id) {
    const pre = await buscarPreapprovalMP(dadosAss.gateway_id);
    if (pre?.status === "cancelled") {
      return { estado: "recusado", detalhe: "A assinatura foi cancelada no Mercado Pago." };
    }
    if (pre && pre.status !== "authorized") return { estado: "processando" };
  }

  const pagamentos = await buscarPagamentosPorReferencia(assinaturaId);
  if (!pagamentos) return { estado: "processando" };

  const aprovado = pagamentos.find((p) => p.status === "approved");
  if (aprovado) {
    const res = await creditarCobranca({
      assinaturaId,
      gatewayPaymentId: aprovado.id,
      observacao: "Pago via Mercado Pago",
    });
    if ("error" in res) {
      console.error("Erro ao creditar cobrança no polling:", res.error);
      return { estado: "processando" };
    }
    return { estado: "ativo" };
  }

  if (pagamentos.some((p) => STATUS_EM_ANDAMENTO.has(p.status))) {
    return { estado: "processando" };
  }

  // Só recusa/cancelamento: o aluno pode tentar de novo. Não cancelamos a
  // linha pendente aqui — `criarAssinaturaAction` já limpa antes de criar a
  // próxima, e manter a linha preserva o histórico da tentativa.
  const recusado = pagamentos.find(
    (p) => p.status === "rejected" || p.status === "cancelled",
  );
  if (recusado) return { estado: "recusado", detalhe: motivoRecusa(recusado.statusDetail) };

  // Nenhum pagamento ainda: o aluno abriu o checkout e não terminou.
  return { estado: "processando" };
}

// --------------------------------------------------- cancelar a renovação
// Parar de ser cobrado. Existe porque o plano recorrente é, agora, cobrança
// DE VERDADE todo mês (ver lib/plano/preapproval.ts): vender uma assinatura
// sem um botão de sair dela é o tipo de coisa que vira reclamação no cartão.
//
// O que ela NÃO faz: tirar o Pro. O aluno pagou o mês corrente, então
// `plano_expira_em` fica onde está e ele usa até o fim — só não há próxima
// cobrança.
//
// A fidelidade do semestral é informada, não imposta pelo código: cancelar
// durante os 6 meses é permitido aqui, e a cobrança já feita não volta. Impor
// de verdade exigiria reter valor, que é decisão comercial (e jurídica), não
// de implementação — e fingir que o botão não existe seria pior.
export async function cancelarRenovacaoAction(): Promise<
  { ok: true; proAte: string | null } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { data: ass } = await supabase
    .from("assinaturas")
    .select("id, gateway_id, forma")
    .eq("user_id", user.id)
    .eq("status", "ativa")
    .eq("forma", "recorrente")
    .order("criada_em", { ascending: false })
    .maybeSingle();

  if (!ass) return { error: "Você não tem uma assinatura com renovação automática." };

  if (ass.gateway_id && !(await cancelarAssinaturaRecorrente(ass.gateway_id))) {
    // Falhou no gateway: NÃO marcamos como cancelada aqui. Uma linha
    // "cancelada" no nosso banco com o cartão ainda sendo cobrado no MP é o
    // pior dos dois mundos — o aluno acharia que parou e continuaria pagando.
    return { error: "Não foi possível cancelar no Mercado Pago agora. Tente de novo." };
  }

  const { error } = await supabase
    .from("assinaturas")
    .update({ status: "cancelada" })
    .eq("id", ass.id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  return { ok: true, proAte: profile?.plano_expira_em ?? null };
}

// ------------------------------------------------------------- cupom de Pro
// Resgate de um cupom (dias_pro concedidos direto, sem passar pelo Mercado
// Pago — ver supabase_cupons_pro.sql). A leitura do cupom e a escrita em
// `profiles`/`cupom_resgates` rodam via service_role: o aluno não tem policy
// de select em `cupons` (a validação é toda no servidor) e a coluna `plano`
// é protegida pelo trigger de segurança contra o cliente do próprio aluno.
export async function resgatarCupomAction(
  codigoDigitado: string,
): Promise<{ ok: true; diasConcedidos: number } | { error: string }> {
  const codigo = codigoDigitado.trim();
  if (!codigo) return { error: "Digite um código." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login pra usar um cupom." };

  const admin = createAdminClient();

  const { data: cupom, error: errCupom } = await admin
    .from("cupons")
    .select("id, dias_pro, ativo, limite_usos, usos, expira_em")
    .ilike("codigo", codigo)
    .maybeSingle();
  if (errCupom) return { error: errCupom.message };
  if (!cupom || !cupom.ativo) return { error: "Cupom inválido." };
  if (cupom.expira_em && new Date(cupom.expira_em).getTime() < Date.now()) {
    return { error: "Esse cupom expirou." };
  }
  if (cupom.limite_usos !== null && cupom.usos >= cupom.limite_usos) {
    return { error: "Esse cupom atingiu o limite de usos." };
  }

  const { data: jaResgatado } = await admin
    .from("cupom_resgates")
    .select("id")
    .eq("cupom_id", cupom.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (jaResgatado) return { error: "Você já usou esse cupom nesta conta." };

  const { data: profile, error: errProfile } = await admin
    .from("profiles")
    .select("plano, plano_ciclo, plano_desde, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();
  if (errProfile) return { error: errProfile.message };
  // Sem linha em `profiles` o update abaixo afetaria ZERO linhas sem erro
  // nenhum (RLS/`eq` não acham nada) — o cupom seria consumido e o Pro nunca
  // apareceria. Acontece se o resgate for disparado antes do onboarding criar
  // o profile; melhor recusar e mandar terminar o cadastro.
  if (!profile) {
    return { error: "Termine seu cadastro antes de usar o cupom." };
  }

  // Já é Pro (pago ou de outro cupom): soma os dias em cima da validade atual
  // em vez de reiniciar — resgatar um cupom nunca deve ENCURTAR o que o aluno
  // já tinha. Do contrário, começa a contar de agora.
  const agora = new Date();
  const jaPro = ehPro(profile);
  const baseExpira = jaPro && profile?.plano_expira_em ? new Date(profile.plano_expira_em) : agora;
  const novaExpira = new Date(baseExpira.getTime() + cupom.dias_pro * 24 * 60 * 60 * 1000);

  const { error: errUpdate } = await admin
    .from("profiles")
    .update({
      plano: "pro",
      plano_ciclo: jaPro ? profile?.plano_ciclo : "cupom",
      plano_desde: jaPro ? profile?.plano_desde : agora.toISOString(),
      plano_expira_em: novaExpira.toISOString(),
    })
    .eq("id", user.id);
  if (errUpdate) return { error: errUpdate.message };

  await admin.from("cupom_resgates").insert({
    cupom_id: cupom.id,
    user_id: user.id,
    dias_concedidos: cupom.dias_pro,
  });
  // Incremento simples (leitura-e-escrita, não atômico sob concorrência) — pro
  // volume de um cupom distribuído manualmente isso é aceitável; o que
  // realmente impede abuso é o índice único (cupom_id, user_id) checado acima,
  // que já barra a mesma conta resgatando duas vezes.
  await admin.from("cupons").update({ usos: cupom.usos + 1 }).eq("id", cupom.id);

  return { ok: true, diasConcedidos: cupom.dias_pro };
}

/* ------------------------------------------------------- convite (link) */

// Estado de um código consultado a partir do link de convite. É o suficiente
// pra desenhar a tela /convite/[codigo] com honestidade — inclusive quando o
// convite já não vale mais — sem NUNCA listar os cupons existentes: a busca é
// por código exato, nada de varredura.
export type EstadoConvite =
  | {
      estado: "valido";
      codigo: string;
      diasPro: number;
      /** null = cupom sem limite de usos. */
      vagasRestantes: number | null;
    }
  | { estado: "invalido" | "expirado" | "esgotado"; codigo: string }
  | { estado: "ja_usado"; codigo: string; diasPro: number };

export async function consultarConviteAction(codigoBruto: string): Promise<EstadoConvite> {
  const codigo = normalizarCodigoCupom(codigoBruto);
  if (!codigo) return { estado: "invalido", codigo: "" };

  // Sem SUPABASE_SERVICE_ROLE_KEY o createAdminClient LANÇA. Aqui isso não
  // pode virar tela de erro: a pessoa chegou por um link que um amigo mandou,
  // e a resposta honesta ("não encontramos este convite") é melhor do que um
  // crash. Vale sobretudo em ambiente de desenvolvimento, onde a chave costuma
  // não estar configurada.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { estado: "invalido", codigo };
  }

  const { data: cupom } = await admin
    .from("cupons")
    .select("id, codigo, dias_pro, ativo, limite_usos, usos, expira_em")
    .ilike("codigo", codigo)
    .maybeSingle();

  // Cupom desativado à mão pelo admin é tratado como inexistente: quem recebeu
  // o link não precisa saber a diferença, e as duas telas seriam iguais.
  if (!cupom || !cupom.ativo) return { estado: "invalido", codigo };
  if (cupom.expira_em && new Date(cupom.expira_em).getTime() < Date.now()) {
    return { estado: "expirado", codigo: cupom.codigo };
  }

  // Se a pessoa JÁ resgatou este convite, a tela vira um "seu acesso já está
  // liberado" em vez de um botão que só daria erro. Vale só com sessão — quem
  // ainda não entrou vê o convite normal.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: jaResgatado } = await admin
      .from("cupom_resgates")
      .select("id")
      .eq("cupom_id", cupom.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (jaResgatado) {
      return { estado: "ja_usado", codigo: cupom.codigo, diasPro: cupom.dias_pro };
    }
  }

  if (cupom.limite_usos !== null && cupom.usos >= cupom.limite_usos) {
    return { estado: "esgotado", codigo: cupom.codigo };
  }

  return {
    estado: "valido",
    codigo: cupom.codigo,
    diasPro: cupom.dias_pro,
    vagasRestantes:
      cupom.limite_usos === null ? null : Math.max(0, cupom.limite_usos - cupom.usos),
  };
}
