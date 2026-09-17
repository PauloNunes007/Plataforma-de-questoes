// Plano Pro — constantes, tipos e helpers PUROS (sem Supabase). O estado
// efetivo do plano mora em `profiles` (denormalizado — ver
// supabase_plano_pro.sql); os writes ficam em lib/plano/actions.ts (aluno) e
// lib/admin/actions.ts (ativação manual pelo admin).
//
// **Repasse de 2026-09-17 — a grade virou DUAS opções, e as duas são
// Checkout Pro.**
//
// O que havia antes: três cartões — mensal recorrente (R$ 15/mês), semestral
// recorrente (6× R$ 10 "com fidelidade") e semestral à vista (R$ 60). Dois
// problemas, um comercial e um técnico, e no fundo eram o mesmo problema:
//
//   1. Os dois semestrais custavam **o mesmo total pelo mesmo período**
//      (R$ 60 por 6 meses). A diferença entre eles não era o produto, era a
//      forma de pagar — pergunta que o próprio checkout do Mercado Pago já
//      faz. Um cartão inteiro da tela era gasto numa escolha que não é do
//      aluno, e a "fidelidade" descrevia um compromisso que o código admitia
//      não conseguir impor.
//   2. As opções recorrentes saíam por `/preapproval`, endpoint bem mais
//      exigente que o checkout comum: exige Assinaturas habilitado na conta,
//      recusa `back_url` que não seja https pública e recusa quando pagador e
//      vendedor são a mesma conta. Toda recusa derrubava a venda no meio, e a
//      tela precisava interromper o caixa com um aviso pra não vender
//      assinatura e entregar compra avulsa.
//
// A grade de hoje resolve os dois de uma vez, porque **parcelar é o recorrente
// honesto**: o semestral cobra os R$ 60 numa preferência normal, parcelável em
// até 6× no cartão (ou Pix/boleto à vista), e credita os 6 meses. O aluno vê
// "R$ 10/mês" com a mesma ancoragem de antes, o furo de receita fecha por
// construção (não existe pagar uma parcela e levar o semestre — quem parcela
// já teve o valor cheio autorizado no cartão), e o clique vira sempre um
// redirect limpo pro Mercado Pago.
//
// `MENSAL_RECORRENTE` continua aqui, vivo, atrás de `recorrenteHabilitado()`
// (lib/plano/preapproval.ts, desligado por padrão): quando a conta do MP
// tiver Assinaturas aprovado, é uma variável de ambiente pra voltar a vender
// renovação automática — sem ressuscitar código morto.
//
// Sem MP_ACCESS_TOKEN configurado, cai no fluxo manual (o admin confirma em
// /admin/assinaturas). Preços e ciclos aqui são a fonte da verdade
// compartilhada entre a página /pro, o landing e as ações de servidor.

import { APP_URL } from "@/lib/app-url";

export type Plano = "free" | "pro";
export type Ciclo = "mensal" | "semestral";
export type Forma = "recorrente" | "a_vista";

// centavos, pra bater com assinaturas.valor_centavos (inteiro)
export const PRECO_MENSAL_CENTAVOS = 1500; // R$ 15 por 1 mês
export const PRECO_SEMESTRAL_CENTAVOS = 6000; // R$ 60 pelos 6 meses

export const MESES_SEMESTRE = 6;

// Teto de parcelas no cartão pro semestral. É o que faz o "R$ 10/mês" do
// cartão de preço ser verdade na fatura, sem preapproval nenhum no meio.
//
// O que NÃO prometemos em lugar nenhum da UI: "sem juros". Quem decide se o
// parcelamento é sem juros é a configuração da conta vendedora no painel do
// Mercado Pago, não este campo — a API só limita o NÚMERO de parcelas. No dia
// em que as campanhas sem juros estiverem ligadas lá, aí sim a frase pode
// entrar na tela.
export const PARCELAS_SEMESTRAL = 6;

export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  });
}

// Preço-âncora do semestral: o "por mês" que o cartão mostra grande.
export const PRECO_SEMESTRAL_MENSAL_CENTAVOS = Math.round(
  PRECO_SEMESTRAL_CENTAVOS / MESES_SEMESTRE,
); // R$ 10/mês

// Desconto do semestral sobre o mensal — derivado, nunca digitado à mão: um
// "-33%" escrito na tela vira mentira no dia em que alguém mexer num preço.
export const DESCONTO_SEMESTRAL_PCT = Math.round(
  (1 - PRECO_SEMESTRAL_MENSAL_CENTAVOS / PRECO_MENSAL_CENTAVOS) * 100,
);

// Shape mínimo do profile que o gating lê — casa com as colunas da migração.
export type PlanoDoProfile = {
  plano?: string | null;
  plano_expira_em?: string | null;
};

// Fonte da verdade do "é Pro?": plano marcado 'pro' E ainda dentro da validade
// (expira_em nulo = sem validade). Usada no servidor e no cliente.
export function ehPro(p: PlanoDoProfile | null | undefined): boolean {
  if (!p || p.plano !== "pro") return false;
  if (!p.plano_expira_em) return true;
  return new Date(p.plano_expira_em).getTime() > Date.now();
}

// Descreve uma opção de compra pra montar os cards da /pro sem repetir números.
export type OpcaoPlano = {
  id: string; // chave estável pro React / pro botão
  ciclo: Ciclo;
  forma: Forma;
  titulo: string;
  precoCentavos: number; // o que é cobrado NESTA cobrança
  precoMensalEquivalente: number; // o "R$ X/mês" grande do cartão
  mesesCreditados: number; // quanto tempo de Pro UMA cobrança dessa opção compra
  parcelasMax: number; // teto de parcelas no cartão (1 = à vista)
  cobrancaLabel: string; // "por mês"
  destaque: string | null; // selo ("Mais popular"…)
  observacao: string; // linha fina explicando o que o aluno leva
};

const MENSAL_AVULSO: OpcaoPlano = {
  id: "mensal",
  ciclo: "mensal",
  forma: "a_vista",
  titulo: "Pro Mensal",
  precoCentavos: PRECO_MENSAL_CENTAVOS,
  precoMensalEquivalente: PRECO_MENSAL_CENTAVOS,
  mesesCreditados: 1,
  parcelasMax: 1,
  cobrancaLabel: "por mês",
  destaque: null,
  observacao:
    "Um mês de Pro, sem fidelidade e sem cobrança automática. Volte aqui e renove quando quiser.",
};

// Variante do mensal que cobra sozinha todo mês (preapproval). Só chega à tela
// quando `recorrenteHabilitado()` está ligado — ver o repasse no topo.
const MENSAL_RECORRENTE: OpcaoPlano = {
  ...MENSAL_AVULSO,
  id: "mensal-recorrente",
  forma: "recorrente",
  observacao:
    "Renova sozinho todo mês no cartão. Cancele quando quiser — o mês já pago continua seu.",
};

const SEMESTRAL: OpcaoPlano = {
  id: "semestral",
  ciclo: "semestral",
  forma: "a_vista",
  titulo: "Pro Semestral",
  precoCentavos: PRECO_SEMESTRAL_CENTAVOS,
  precoMensalEquivalente: PRECO_SEMESTRAL_MENSAL_CENTAVOS,
  mesesCreditados: MESES_SEMESTRE,
  parcelasMax: PARCELAS_SEMESTRAL,
  cobrancaLabel: "por mês",
  destaque: "Mais popular",
  observacao:
    "O semestre inteiro liberado de uma vez — dura mais que a próxima prova, a recuperação e a final.",
};

// Tudo que o servidor sabe cobrar. A tela mostra um subconjunto
// (`opcoesVisiveis`); esta lista existe pra `acharOpcao` resolver qualquer id
// que já tenha sido oferecido algum dia.
const TODAS_OPCOES: OpcaoPlano[] = [MENSAL_AVULSO, MENSAL_RECORRENTE, SEMESTRAL];

/**
 * As opções que vão pra tela. Duas, sempre — a decisão do aluno é "um mês ou o
 * semestre", nunca "qual forma de pagamento", que é pergunta do checkout.
 *
 * `recorrenteAtivo` troca o mensal avulso pelo mensal com renovação
 * automática. Quem decide é o SERVIDOR (`recorrenteHabilitado()`), antes de a
 * página renderizar: assim a tela nunca oferece uma assinatura que o gateway
 * vai recusar no clique — que era exatamente a avaria que fazia o caixa parar
 * num aviso no meio do caminho.
 */
export function opcoesVisiveis(recorrenteAtivo = false): OpcaoPlano[] {
  return recorrenteAtivo ? [MENSAL_RECORRENTE, SEMESTRAL] : [MENSAL_AVULSO, SEMESTRAL];
}

export function acharOpcao(id: string): OpcaoPlano | undefined {
  return TODAS_OPCOES.find((o) => o.id === id);
}

// Comparativo de planos — FONTE DA VERDADE única, lida pela /pro e pela landing
// (marketing e produto falando a mesma língua).
//
// ⚠️ REGRA: cada item marcado como exclusivo do Pro tem que ter um gate REAL no
// código. Hoje os gates são exatamente estes:
//   • simulados ...... SIMULADO_FREE_LIMITE_SEMANA (lib/simulados/actions.ts, servidor)
//   • autópsia ....... components/questao/questao-runner.tsx
//   • estatísticas ... components/dashboard/semana-view.tsx
//   • selo Pro ....... components/plano/pro-ui.tsx (ranking/menu)
// Uma lista anterior anunciava "disciplinas ilimitadas", "grade semanal
// automática", "repetição espaçada" e "prática livre ilimitada" como exclusivos
// do Pro — nenhum deles é gated (o plano grátis já tem os quatro). Se quiser
// que virem exclusivos, implemente o gate ANTES de voltar a anunciar.
//
// **Repasse de 2026-09-16.** "Projeção da sua nota pro dia da prova" saiu das
// duas listas: o motor que a calculava foi removido com o resto do
// planejamento automático, e anunciar um recurso que não existe mais é pior
// que não ter o recurso.

export type ItemPlano = { texto: string; incluso: boolean };

export const RECURSOS_FREE: ItemPlano[] = [
  { texto: "Banco de questões completo, com resolução", incluso: true },
  { texto: "Listas montadas por você: disciplina, assunto e tamanho", incluso: true },
  { texto: "Disciplinas ilimitadas", incluso: true },
  { texto: "Trilha da ementa com seu aproveitamento por assunto", incluso: true },
  { texto: "Anotações e favoritos por questão", incluso: true },
  { texto: "Streak, XP e ligas semanais", incluso: true },
  { texto: "1 simulado cronometrado por semana", incluso: true },
  { texto: "Simulados cronometrados ilimitados", incluso: false },
  { texto: "Autópsia do erro", incluso: false },
  { texto: "Estatísticas avançadas de desempenho", incluso: false },
];

export const BENEFICIOS_PRO: string[] = [
  "Simulados cronometrados ilimitados",
  "Autópsia do erro: descubra por que errou e corrija o padrão",
  "Estatísticas avançadas: comparativo, percentil e recordes",
  "Selo Pro no seu card do ranking",
];

export const RECURSOS_PRO: ItemPlano[] = [
  { texto: "Tudo do plano grátis, sem limite", incluso: true },
  ...BENEFICIOS_PRO.map((texto) => ({ texto, incluso: true })),
];

/* ------------------------------------------------------------- convite */

// Nome do cookie que carrega o código do convite do clique no link até a
// primeira tela logada. É legível pelo cliente de propósito (não é httpOnly):
// o código já estava na URL que a pessoa recebeu no WhatsApp — não há segredo
// nenhum a proteger aqui, e quem escreve/limpa é o componente de cliente.
export const COOKIE_CONVITE = "questly_convite";

// Só letras/números/hífen: o código vem da URL e é ecoado na tela.
export function normalizarCodigoCupom(bruto: string): string {
  return bruto
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 40);
}

// URL de convite pronta pra colar no WhatsApp. Usa a MESMA base do resto do
// app (NEXT_PUBLIC_APP_URL) — se o domínio mudar, o link muda junto, e não há
// um segundo lugar com o endereço digitado à mão.
//
// `base` existe pro cliente poder passar `location.origin`: se a variável não
// estiver definida no deploy, o admin copiaria um link pro domínio errado sem
// perceber, e o convite morreria na mão do testador. No browser a origem real
// é a fonte mais confiável que existe.
export function linkConvite(codigo: string, base?: string): string {
  const raiz = (base?.trim() || APP_URL).replace(/\/+$/, "");
  return `${raiz}/convite/${normalizarCodigoCupom(codigo)}`;
}
