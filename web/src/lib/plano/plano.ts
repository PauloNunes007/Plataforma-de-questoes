// Plano Pro — constantes, tipos e helpers PUROS (sem Supabase). O estado
// efetivo do plano mora em `profiles` (denormalizado — ver
// supabase_plano_pro.sql); os writes ficam em lib/plano/actions.ts (aluno) e
// lib/admin/actions.ts (ativação manual pelo admin).
//
// Pagamento pelo checkout do Mercado Pago (cartão/Pix, dados do recebedor
// ocultos) — ver lib/plano/mercadopago.ts. Sem MP_ACCESS_TOKEN configurado,
// cai no fluxo manual (o admin confirma em /admin/assinaturas). Preços e ciclos
// aqui são a fonte da verdade compartilhada entre a página /pro, o landing e as
// ações de servidor.

export type Plano = "free" | "pro";
export type Ciclo = "mensal" | "semestral";
export type Forma = "recorrente" | "a_vista";

// centavos, pra bater com assinaturas.valor_centavos (inteiro)
export const PRECO_MENSAL_CENTAVOS = 1500; // R$ 15/mês
export const PRECO_SEMESTRAL_MENSAL_CENTAVOS = 1000; // R$ 10/mês (fidelidade 6 meses)
export const PRECO_SEMESTRAL_AVISTA_CENTAVOS = 6000; // R$ 60 à vista (6 meses)

export const MESES_SEMESTRE = 6;

export function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  });
}

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
  precoCentavos: number; // o que é cobrado nessa cobrança
  precoMensalEquivalente: number; // pra mostrar "R$ X/mês"
  cobrancaLabel: string; // "por mês" | "à vista (6 meses)"
  destaque: string | null; // selo ("Mais popular", "Melhor preço"…)
  observacao: string; // linha fina explicando fidelidade/economia
};

export const OPCOES_PLANO: OpcaoPlano[] = [
  {
    id: "mensal",
    ciclo: "mensal",
    forma: "recorrente",
    titulo: "Pro Mensal",
    precoCentavos: PRECO_MENSAL_CENTAVOS,
    precoMensalEquivalente: PRECO_MENSAL_CENTAVOS,
    cobrancaLabel: "por mês",
    destaque: null,
    observacao: "Sem fidelidade. Cancele quando quiser.",
  },
  {
    id: "semestral-recorrente",
    ciclo: "semestral",
    forma: "recorrente",
    titulo: "Pro Semestral",
    precoCentavos: PRECO_SEMESTRAL_MENSAL_CENTAVOS,
    precoMensalEquivalente: PRECO_SEMESTRAL_MENSAL_CENTAVOS,
    cobrancaLabel: "por mês",
    destaque: "Mais popular",
    observacao: "R$ 10/mês com fidelidade de 6 meses — economia de 33% no semestre.",
  },
  {
    id: "semestral-avista",
    ciclo: "semestral",
    forma: "a_vista",
    titulo: "Pro Semestral à vista",
    precoCentavos: PRECO_SEMESTRAL_AVISTA_CENTAVOS,
    precoMensalEquivalente: Math.round(PRECO_SEMESTRAL_AVISTA_CENTAVOS / MESES_SEMESTRE),
    cobrancaLabel: "à vista (6 meses)",
    destaque: "Melhor preço",
    observacao: "R$ 60 de uma vez pelos 6 meses — sai R$ 10/mês, sem mensalidade.",
  },
];

export function acharOpcao(id: string): OpcaoPlano | undefined {
  return OPCOES_PLANO.find((o) => o.id === id);
}

// Comparativo de planos — FONTE DA VERDADE única, lida pela /pro e pela landing
// (marketing e produto falando a mesma língua).
//
// ⚠️ REGRA: cada item marcado como exclusivo do Pro tem que ter um gate REAL no
// código. Hoje os gates são exatamente estes:
//   • simulados ...... SIMULADO_FREE_LIMITE_SEMANA (lib/simulados/actions.ts, servidor)
//   • projeção D ..... lib/trilha/trilha-data.ts + lib/questly/dashboard-data.ts
//   • autópsia ....... components/questao/questao-runner.tsx
//   • estatísticas ... components/dashboard/semana-view.tsx
//   • selo Pro ....... components/plano/pro-ui.tsx (ranking/menu)
// Uma lista anterior anunciava "disciplinas ilimitadas", "grade semanal
// automática", "repetição espaçada" e "prática livre ilimitada" como exclusivos
// do Pro — nenhum deles é gated (o plano grátis já tem os quatro). Se quiser
// que virem exclusivos, implemente o gate ANTES de voltar a anunciar.

export type ItemPlano = { texto: string; incluso: boolean };

export const RECURSOS_FREE: ItemPlano[] = [
  { texto: "Missão do dia montada pelo motor", incluso: true },
  { texto: "Disciplinas e provas ilimitadas", incluso: true },
  { texto: "Trilha da ementa e boss por prova", incluso: true },
  { texto: "Banco de questões completo, com resolução", incluso: true },
  { texto: "Anotações e favoritos por questão", incluso: true },
  { texto: "Streak, XP e ligas semanais", incluso: true },
  { texto: "1 simulado cronometrado por semana", incluso: true },
  { texto: "Simulados cronometrados ilimitados", incluso: false },
  { texto: "Projeção da sua nota pro dia da prova", incluso: false },
  { texto: "Autópsia do erro", incluso: false },
  { texto: "Estatísticas avançadas de desempenho", incluso: false },
];

export const BENEFICIOS_PRO: string[] = [
  "Simulados cronometrados ilimitados",
  "Projeção da sua nota pro dia da prova (e a rota pra subir ela)",
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
  const raiz = (base?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://questly.com.br")
    .replace(/\/+$/, "");
  return `${raiz}/convite/${normalizarCodigoCupom(codigo)}`;
}
