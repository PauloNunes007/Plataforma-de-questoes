// Programa de parceiros — constantes, tipos e funções PURAS (sem Supabase).
//
// É a fonte da verdade comercial do programa: a tabela de faixas, a base de
// cálculo, a janela de indicação e as regras que a página pública (/parceria)
// e o painel do parceiro (/parceiro) exibem. Nenhum número aqui pode ser
// redigitado numa tela — a regra de honestidade da landing vale em dobro num
// lugar onde o texto é, na prática, uma proposta comercial.
//
// ────────────────────────────────────────────────────────────────────────
// O DESENHO, e por que ele é assim
// ────────────────────────────────────────────────────────────────────────
//
// O que o parceiro ganha .... % do que ENTRA (líquido do gateway), em toda
//                             compra do aluno que ele trouxe, por 12 meses.
// O que o público dele ganha  nada de especial, por padrão — cria conta
//                             normal, no plano grátis que já existe. O link
//                             só CARIMBA de quem foi a indicação.
// O que a plataforma protege  paga só sobre dinheiro que ficou (o estorno
//                             cancela a comissão), só sobre conta NOVA, e a
//                             taxa alta só existe em volume que só existe
//                             por causa do parceiro.
//
// Três decisões carregam o programa:
//
// 1. **Sem oferta especial pro público, por padrão.** O plano grátis da
//    plataforma já é um produto completo — banco de questões, trilha da
//    ementa, um simulado por semana. Dar dias de Pro de graça pra QUALQUER
//    um que clicar custaria caro em escala (todo link vira uma promoção) e
//    treinaria o público a nunca pagar preço cheio. `afiliados.dias_bonus`
//    continua existindo no schema — serve pra um acordo pontual e negociado
//    com um parceiro específico (o admin decide caso a caso), nunca como
//    regra do programa. O valor pro parceiro está inteiro na comissão, não
//    em precisar convencer o público com um brinde.
//
// 2. **Faixa por volume, retroativa ao mês.** A comissão começa em 25% e
//    sobe até 40%. Pro parceiro é o que transforma "divulgar" em meta: ele
//    vê quantas vendas faltam pra faixa seguinte e o aumento vale pro mês
//    INTEIRO, não só pra venda seguinte. Pra plataforma é o melhor negócio
//    que existe: 40% só é pago em cima de um volume que, por definição, não
//    aconteceria sem ele — e o piso de 25% protege a margem no caso comum.
//    Uma taxa única alta paga caro por parceiro fraco; uma única baixa não
//    fecha com parceiro bom. A faixa resolve os dois.
//
// 3. **Janela de 12 meses.** Recorrente pra sempre soa generoso e é a forma
//    mais rápida de transformar aquisição em renda vitalícia sobre trabalho
//    que a plataforma faz sozinha (o aluno renova porque o produto funciona,
//    não porque viu um story em 2026). Doze meses cobrem dois semestres —
//    o ciclo de vida real de um aluno — e o parceiro recebe pelas renovações
//    todas desse período, o que já o coloca acima da esmagadora maioria dos
//    programas de assinatura do mercado brasileiro.

import { APP_URL } from "@/lib/app-url";
import {
  DIAS_ARREPENDIMENTO,
  PRECO_MENSAL_CENTAVOS,
  PRECO_SEMESTRAL_CENTAVOS,
  reais,
} from "@/lib/plano/plano";

/* ------------------------------------------------------------- faixas */

export type Faixa = {
  /** Vendas no mês a partir das quais a faixa vale. */
  min: number;
  percentual: number;
  nome: string;
  cor: "bronze" | "prata" | "ouro" | "diamante";
};

/**
 * Tabela de comissão por vendas aprovadas no mês (ordem crescente de `min`).
 *
 * "Venda" = uma cobrança creditada de um aluno indicado, seja a primeira ou
 * uma renovação. Contar renovação na faixa é de propósito: o parceiro que
 * traz aluno que FICA sobe de faixa sozinho, e aluno que fica é exatamente o
 * que a plataforma quer comprar.
 */
export const FAIXAS: Faixa[] = [
  { min: 0, percentual: 25, nome: "Bronze", cor: "bronze" },
  { min: 10, percentual: 30, nome: "Prata", cor: "prata" },
  { min: 25, percentual: 35, nome: "Ouro", cor: "ouro" },
  { min: 50, percentual: 40, nome: "Diamante", cor: "diamante" },
];

export function faixaPorVendas(vendas: number): Faixa {
  let atual = FAIXAS[0];
  for (const f of FAIXAS) if (vendas >= f.min) atual = f;
  return atual;
}

/** A próxima faixa e quantas vendas faltam. null = já está no topo. */
export function proximaFaixa(vendas: number): { faixa: Faixa; faltam: number } | null {
  const acima = FAIXAS.find((f) => vendas < f.min);
  return acima ? { faixa: acima, faltam: acima.min - vendas } : null;
}

/* ------------------------------------------------- base de cálculo */

/**
 * Taxa estimada do meio de pagamento, em %. A comissão é calculada sobre o
 * LÍQUIDO (o que de fato entra na conta), não sobre o valor cheio da etiqueta.
 *
 * Por que estimada e não a real de cada cobrança: a API do Mercado Pago só
 * devolve `fee_details` de forma confiável depois da liberação do valor, e a
 * comissão nasce no instante da aprovação. Um número fixo e declarado na
 * proposta é melhor que um número certo que só se conhece dias depois — e
 * 5% é o teto da faixa usual do Checkout Pro, então o erro, quando existe,
 * é a favor do parceiro.
 */
export const TAXA_GATEWAY_PCT = 5;

/** Quanto sobra da venda depois da taxa do gateway — a base da comissão. */
export function baseLiquidaCentavos(brutoCentavos: number): number {
  return Math.max(0, Math.round(brutoCentavos * (1 - TAXA_GATEWAY_PCT / 100)));
}

export function comissaoCentavos(baseCentavos: number, percentual: number): number {
  return Math.max(0, Math.round((baseCentavos * percentual) / 100));
}

/** Quanto o parceiro ganha numa venda de `brutoCentavos` naquela faixa. */
export function ganhoPorVenda(brutoCentavos: number, percentual: number): number {
  return comissaoCentavos(baseLiquidaCentavos(brutoCentavos), percentual);
}

/* ----------------------------------------------------------- padrões */

/** Dias de Pro que o público do parceiro ganha ao criar conta pelo link. */
export const DIAS_BONUS_PADRAO = 0;

/** Por quantos meses as compras do aluno indicado ainda pagam comissão. */
export const JANELA_MESES_PADRAO = 12;

/**
 * Piso do repasse. Abaixo disso o saldo ACUMULA pro mês seguinte em vez de
 * virar um Pix — não é confisco (o dinheiro continua do parceiro e aparece no
 * painel), é só o tamanho mínimo que faz um repasse valer o trabalho dos dois
 * lados. O fechamento soma competências anteriores não pagas justamente pra
 * que acumular funcione sem ninguém precisar lembrar.
 */
export const MINIMO_REPASSE_CENTAVOS = 5000; // R$ 50

/** Dia útil-alvo do repasse do mês fechado. Informativo (entra na proposta). */
export const DIA_REPASSE = 15;

/**
 * Dias entre a venda e a liberação da comissão. É exatamente o prazo de
 * arrependimento do CDC (art. 49), e não um número inventado pra segurar
 * dinheiro: enquanto o aluno pode desfazer a compra e receber tudo de volta,
 * não existe venda pra dividir. Quando o estorno acontece, a comissão é
 * cancelada (lib/afiliados/comissao.ts) — nunca cobrada de volta do parceiro.
 */
export const DIAS_LIBERACAO = DIAS_ARREPENDIMENTO;

/* ------------------------------------------------------- link e código */

/**
 * Cookie que leva o código do clique no link até a primeira tela logada.
 * Mesmo desenho do convite (COOKIE_CONVITE): legível pelo cliente, porque o
 * código já viajou na URL pública e não há segredo a proteger.
 *
 * O VALOR é `CODIGO.timestampDoClique` — o timestamp não é enfeite: é o que
 * permite atribuir só conta NOVA. Conta criada ANTES do clique é cliente que
 * a plataforma já tinha, e pagar comissão por ela seria pagar duas vezes pelo
 * mesmo aluno (ver `atribuivel`).
 */
export const COOKIE_REF = "questly_ref";

/** 60 dias: o seguidor que viu o story hoje e cria a conta na véspera da P1. */
export const DIAS_COOKIE_REF = 60;

export function montarValorCookie(codigo: string, agora = Date.now()): string {
  return `${normalizarCodigoParceiro(codigo)}.${agora}`;
}

export function lerValorCookie(valor: string | null | undefined): {
  codigo: string;
  clicadoEm: number;
} | null {
  if (!valor) return null;
  const sep = valor.lastIndexOf(".");
  if (sep <= 0) return null;
  const codigo = normalizarCodigoParceiro(valor.slice(0, sep));
  const clicadoEm = Number(valor.slice(sep + 1));
  if (!codigo || !Number.isFinite(clicadoEm) || clicadoEm <= 0) return null;
  return { codigo, clicadoEm };
}

/**
 * A conta pode ser atribuída a este clique?
 *
 * Regra: **só conta nova**. A conta precisa ter nascido DEPOIS do clique.
 * Sem isso, bastaria o parceiro postar "clica no meu link antes de assinar"
 * pra faturar comissão sobre alunos que a plataforma já tinha conquistado —
 * o vazamento clássico de programa de afiliado, e o mais caro, porque paga
 * exatamente onde não houve aquisição nenhuma.
 *
 * `folgaMs` cobre o relógio do navegador estar alguns minutos adiantado em
 * relação ao servidor; é tolerância de relógio, não de regra.
 */
export function atribuivel(
  contaCriadaEm: string | Date,
  clicadoEm: number,
  folgaMs = 10 * 60 * 1000,
): boolean {
  const criada = new Date(contaCriadaEm).getTime();
  if (!Number.isFinite(criada)) return false;
  return criada >= clicadoEm - folgaMs;
}

/** Só letras/números/hífen: o código vem da URL e é ecoado na tela. */
export function normalizarCodigoParceiro(bruto: string): string {
  return bruto
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

/** Sugere um código a partir do @ do Instagram ("@fisica.uff" → "FISICAUFF"). */
export function codigoSugerido(instagram: string): string {
  return normalizarCodigoParceiro(instagram.replace(/[._]/g, "")).slice(0, 18);
}

/** O link que o parceiro cola na bio/story. Curto de propósito. */
export function linkParceiro(codigo: string, base?: string): string {
  const raiz = (base?.trim() || APP_URL).replace(/\/+$/, "");
  return `${raiz}/p/${normalizarCodigoParceiro(codigo)}`;
}

/** Mesmo link sem o protocolo — é assim que se escreve numa bio do Instagram. */
export function linkParceiroCurto(codigo: string, base?: string): string {
  return linkParceiro(codigo, base).replace(/^https?:\/\//, "");
}

/**
 * O link do PAINEL do parceiro (/parceiro) — diferente de `linkParceiro`
 * (o /p/<codigo> que vai na bio/story, pro PÚBLICO dele). Este é o que o
 * admin manda em privado pro parceiro ver quanto está recebendo. Não leva
 * `codigo`: o painel é da CONTA logada, não de um link — o vínculo é por
 * `afiliados.user_id` (casado por e-mail no primeiro acesso, ver
 * `acharParceiroDaConta`).
 */
export function linkPainelParceiro(base?: string): string {
  const raiz = (base?.trim() || APP_URL).replace(/\/+$/, "");
  return `${raiz}/parceiro`;
}

/* ----------------------------------------- convite de avaliação */

/**
 * Código do cupom que dá ao PARCEIRO EM POTENCIAL um dia de Pro pra conhecer a
 * plataforma por dentro antes de aceitar a parceria — /convite/AFILIADO.
 *
 * Por que 1 dia, e não 7 como o convite de testador: o que se está vendendo
 * aqui não é o produto, é a parceria. Quem abre esse link não quer estudar,
 * quer decidir se põe o link na bio — e pra isso um dia com tudo destravado
 * basta. O dia curto também mantém o custo do recrutamento em zero mesmo se o
 * link vazar, já que ele vai circular entre perfis, não entre alunos.
 *
 * É um cupom comum na tabela `cupons` (semeado por supabase_afiliados.sql): a
 * tela é outra, o mecanismo de resgate é exatamente o mesmo, e portanto o
 * índice único (cupom_id, user_id) continua sendo quem garante um dia por
 * conta.
 */
export const CODIGO_CONVITE_PARCEIRO = "AFILIADO";

export const DIAS_CONVITE_PARCEIRO = 1;

/* ------------------------------------------------------- competência */

/** Primeiro dia do mês de uma data, em 'YYYY-MM-DD' (a competência). */
export function competenciaDe(data: Date | string = new Date()): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "setembro de 2026" a partir de '2026-09-01'. */
export function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.slice(0, 10).split("-");
  const i = Number(mes) - 1;
  return `${MESES[i] ?? mes} de ${ano}`;
}

/* ----------------------------------------------- a proposta, em texto */

/**
 * As regras do programa numa lista só, lida pela página pública (/parceria) e
 * pelo painel do parceiro. Existe porque as duas telas SÃO o contrato: não há
 * PDF assinado no meio, e é péssimo negócio que a versão que o parceiro leu
 * antes de entrar seja diferente da que ele lê depois.
 */
export const REGRAS_PROGRAMA: { titulo: string; texto: string }[] = [
  {
    titulo: "O que seu público ganha ao clicar",
    texto:
      "Nada de especial, por padrão: a pessoa cria conta normal, no plano grátis que qualquer visitante tem. O link não é um cupom de desconto — o que ele faz é registrar que a indicação foi sua, e é esse registro que vira comissão pra você quando ela decidir assinar o Pro, quando quiser.",
  },
  {
    titulo: "Quem conta como sua indicação",
    texto:
      "Toda conta criada depois de alguém abrir o seu link. A indicação é sua para sempre — não depende de a pessoa comprar no mesmo dia, nem de clicar de novo antes de pagar.",
  },
  {
    titulo: `Por ${JANELA_MESES_PADRAO} meses`,
    texto: `Você recebe em toda compra daquele aluno nos primeiros ${JANELA_MESES_PADRAO} meses de conta — a primeira e cada renovação, mensal ou semestral.`,
  },
  {
    titulo: "Sobre o que o percentual incide",
    texto: `Sobre o valor líquido recebido, ou seja, o preço pago pelo aluno menos a taxa do meio de pagamento (estimada em ${TAXA_GATEWAY_PCT}%). Nada mais é descontado.`,
  },
  {
    titulo: `Liberação em ${DIAS_LIBERACAO} dias`,
    texto: `A comissão fica pendente por ${DIAS_LIBERACAO} dias, que é o prazo legal de arrependimento do aluno (CDC art. 49). Passado o prazo, ela é aprovada. Se o aluno pedir o dinheiro de volta dentro dele, a comissão é cancelada — e nunca cobrada de volta de você.`,
  },
  {
    titulo: "Repasse por Pix, todo mês",
    texto: `O mês fecha no último dia e o Pix cai até o dia ${DIA_REPASSE} do mês seguinte. Abaixo de ${reais(MINIMO_REPASSE_CENTAVOS)} o saldo acumula pro mês seguinte em vez de virar um Pix — ele continua seu e aparece no painel.`,
  },
  {
    titulo: "O que não conta",
    texto:
      "Compra feita na sua própria conta, conta criada antes de você entrar no programa e anúncio pago no nome da marca (Google/Meta Ads com a palavra Expectrum). O resto é livre: story, post, bio, grupo, vídeo, aula.",
  },
];

/**
 * Simulação usada na página de recrutamento: quanto rende um mês.
 * Os preços vêm de lib/plano/plano.ts — a proposta nunca redigita um valor.
 */
export type LinhaSimulacao = {
  vendas: number;
  faixa: Faixa;
  /** Ganho supondo todas as vendas no plano semestral (R$ 60). */
  semestralCentavos: number;
  /** Ganho supondo todas no mensal (R$ 15). */
  mensalCentavos: number;
};

export function simular(vendasPorMes: number[]): LinhaSimulacao[] {
  return vendasPorMes.map((vendas) => {
    const faixa = faixaPorVendas(vendas);
    return {
      vendas,
      faixa,
      semestralCentavos: vendas * ganhoPorVenda(PRECO_SEMESTRAL_CENTAVOS, faixa.percentual),
      mensalCentavos: vendas * ganhoPorVenda(PRECO_MENSAL_CENTAVOS, faixa.percentual),
    };
  });
}
