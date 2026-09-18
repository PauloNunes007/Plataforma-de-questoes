// A SEMANA PRO DE LANÇAMENTO — constantes e helpers PUROS (sem Supabase,
// seguros pra client component). A concessão em si mora em
// ./lancamento-servidor.ts, que usa service_role e não pode chegar ao browser.
//
// A regra, inteira, em três frases: toda conta que existia quando
// `supabase_pro_lancamento.sql` rodou ganhou 7 dias de Pro; toda conta criada
// enquanto a janela estiver aberta ganha os mesmos 7 dias contados do próprio
// cadastro; no oitavo dia de cada uma, `ehPro()` para de responder "sim" e a
// conta volta ao grátis sozinha.
//
// Por que a revogação não precisa de cron: o Pro nunca foi um booleano. É
// `plano='pro'` MAIS uma data de validade (supabase_plano_pro.sql), e
// `ehPro()` compara essa data com agora em toda leitura. Conceder com
// validade É a revogação — a alternativa (um job que roda no oitavo dia e
// desliga todo mundo) tem um modo de falha que este desenho não tem: o job
// não rodar, e a base inteira ficar Pro de graça pra sempre.
//
// O que a semana NÃO é: "a plataforma é grátis". Por isso a concessão carrega
// `plano_ciclo = 'lancamento'` — é esse valor que faz a tela de planos, o
// e-mail de boas-vindas e o aviso pós-lista dizerem que isto é um benefício
// com data pra acabar, em vez de anunciarem um plano pago que ninguém
// contratou.

/** Valor gravado em `profiles.plano_ciclo` pelas contas desta semana. */
export const PROMO_LANCAMENTO_CICLO = "lancamento";

/** Quantos dias de Pro cada conta ganha. */
export const PROMO_LANCAMENTO_DIAS = 7;

/**
 * Fim da JANELA DE CADASTRO — até quando uma conta nova ainda entra na
 * promoção. Não é a validade do Pro de ninguém: quem se cadastrar no último
 * dia leva os 7 dias cheios a partir dali, então o último acesso de
 * lançamento se apaga ~14 dias depois do início. É de propósito — cortar o
 * brinde de quem chegou no dia 7 pela metade seria a pior primeira impressão
 * possível.
 *
 * Sobrescrevível por `QUESTLY_PROMO_LANCAMENTO_FIM` (ISO) pra esticar ou
 * encerrar a campanha sem deploy — leia o aviso de `promoLancamentoAtiva`.
 */
export const PROMO_LANCAMENTO_FIM_PADRAO = "2026-09-25T23:59:59-03:00";

export function fimDaPromoLancamento(): Date {
  const bruto = process.env.QUESTLY_PROMO_LANCAMENTO_FIM?.trim();
  if (bruto) {
    const d = new Date(bruto);
    if (!Number.isNaN(d.getTime())) return d;
    console.error(
      `QUESTLY_PROMO_LANCAMENTO_FIM inválida ("${bruto}") — usando a data padrão.`,
    );
  }
  return new Date(PROMO_LANCAMENTO_FIM_PADRAO);
}

/**
 * A janela de cadastro ainda está aberta?
 *
 * ⚠️ SÓ NO SERVIDOR. Lê uma env sem prefixo `NEXT_PUBLIC_`, que no browser é
 * `undefined` — e aí a resposta cairia calada na data padrão, discordando do
 * servidor exatamente no dia em que a campanha tivesse sido esticada. Quem
 * decide quem ganha Pro é sempre o servidor; o cliente só recebe o resultado.
 */
export function promoLancamentoAtiva(agora: Date = new Date()): boolean {
  return agora.getTime() < fimDaPromoLancamento().getTime();
}

/** Esta conta está Pro POR CAUSA da semana de lançamento (e não por ter pago)? */
export function ehProDeLancamento(
  p: { plano_ciclo?: string | null } | null | undefined,
): boolean {
  return p?.plano_ciclo === PROMO_LANCAMENTO_CICLO;
}

/**
 * Nome do plano pra mostrar ao aluno, a partir do ciclo gravado.
 *
 * Existe porque a tela decidia com um ternário — `ciclo === "semestral" ? "Pro
 * Semestral" : "Pro Mensal"` — e portanto chamava de "Pro Mensal" TODO ciclo
 * que não fosse semestral: o cupom já caía aí, e a semana de lançamento cairia
 * também. Dizer "Plano Pro Mensal" pra quem não pagou nada não é um detalhe de
 * copy: é a tela afirmando uma compra que não houve, e é o começo do "então
 * por que estão me cobrando agora?" daqui a sete dias.
 */
export function nomeDoPlano(ciclo: string | null | undefined): string {
  if (ciclo === PROMO_LANCAMENTO_CICLO) return "Pro de lançamento";
  if (ciclo === "cupom") return "Pro por cupom";
  if (ciclo === "semestral") return "Pro Semestral";
  return "Pro Mensal";
}
