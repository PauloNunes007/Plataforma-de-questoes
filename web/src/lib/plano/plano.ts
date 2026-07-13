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

// Benefícios do Pro — mesma lista que o landing (mantém marketing e produto
// falando a mesma língua).
export const BENEFICIOS_PRO: string[] = [
  "Disciplinas e provas ilimitadas",
  "Grade semanal automática, equilibrada por peso",
  "Projeção pro dia da prova: sua nota estimada no dia D",
  "Repetição espaçada + maestria (BKT) por tópico",
  "Autópsia do erro: descubra por que errou e corrija o padrão",
  "Estatísticas avançadas: comparativo, percentil e recordes",
  "Prática livre ilimitada focada nos seus pontos fracos",
  "Selo Pro no seu card do ranking",
];
