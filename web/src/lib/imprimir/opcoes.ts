import type { Pergunta } from "@/lib/questao/types";

// As opções de impressão — o que o aluno responde ANTES de gerar a folha.
//
// Funções puras, sem Supabase e sem React: a folha de lista, a de simulado e o
// cartão-resposta dividem exatamente estas regras, e uma conta de páginas que
// mente é pior que nenhuma conta.

export type Espacamento = "compacto" | "normal" | "amplo";

/** Altura do espaço de resolução por questão, em mm, por nível de espaçamento.
 *
 *  Calibrado em 2026-09-17 depois do dono reclamar que não sobrava espaço pra
 *  fazer conta: `amplo` (o padrão) é ~1/4 de folha A4 por questão, que é o que
 *  uma questão de Física com desenvolvimento pede de verdade. Quem quiser
 *  economizar papel desce pra `normal` ou `compacto` nas Opções. */
export const ALTURA_RESOLUCAO_MM = { compacto: 0, normal: 32, amplo: 68 } as const;

/**
 * Acima disso a tela AVISA que o arquivo é longo.
 *
 * Não é frescura de tamanho: a pré-visualização do Chrome falha
 * ("Falha ao carregar documento PDF") em documentos muito longos com muitas
 * figuras, e o aluno leva a culpa achando que o site quebrou. Com o espaço de
 * resolução amplo como padrão, 25 questões já passam de 25 páginas.
 */
export const PAGINAS_DEMAIS = 40;

export type OpcoesFolha = {
  /** Quantas questões entram no PDF (as N primeiras, na ordem da lista). */
  quantidade: number;
  /** Folha de gabarito no fim, em página nova. */
  gabarito: boolean;
  /** Resoluções junto do gabarito (só aparece se alguma questão tiver). */
  resolucoes: boolean;
  /** Cartão-resposta em branco pra marcar durante a prova. */
  cartaoResposta: boolean;
  /** Cabeçalho com Nome/Matrícula/Turma/Data pra preencher à mão. */
  identificacao: boolean;
  /** Quanto espaço em branco sobra embaixo de cada questão pra resolver. */
  espacamento: Espacamento;
};

/**
 * Quantas questões entram no PDF quando ninguém escolheu nada.
 *
 * **Não é o tamanho da lista**, de propósito. O padrão anterior era "todas", e
 * isso é o pior padrão possível aqui: a lista de um tópico passa fácil de 100
 * questões, com o espaço de resolução amplo cada uma custa quase meia folha, e
 * o resultado era um arquivo de dezenas de páginas que ninguém imprime (quando
 * o navegador conseguia gerar — em documento muito longo com figura ele
 * simplesmente falha).
 *
 * Dez questões é uma sessão de estudo de verdade e um arquivo que cabe na
 * impressora. Quem quer mais sobe num toque; o caminho contrário — descobrir,
 * depois de 40 páginas na fila, que dava pra cortar — não existe.
 */
export const PADRAO_QUESTOES_FOLHA = 10;

/** Teto duro por arquivo: acima disso o PDF é grande demais pra ser útil. */
export const MAX_QUESTOES_FOLHA = 120;

export const ESPACAMENTOS: { valor: Espacamento; rotulo: string; ajuda: string }[] = [
  { valor: "compacto", rotulo: "Compacto", ajuda: "Só o enunciado — economiza papel." },
  { valor: "normal", rotulo: "Médio", ajuda: "Um terço de folha por questão pra fazer conta." },
  { valor: "amplo", rotulo: "Pra fazer conta", ajuda: "Quase meia folha por questão — o padrão." },
];

export function opcoesPadrao(total: number, temResolucao: boolean): OpcoesFolha {
  return {
    quantidade: Math.min(total, PADRAO_QUESTOES_FOLHA),
    // O gabarito entra por padrão: quem baixa uma lista pra treinar precisa
    // conferir depois, e desligar é um toque. Quem vai simular a prova
    // desliga — a opção existe justamente pra isso.
    gabarito: true,
    resolucoes: temResolucao,
    cartaoResposta: false,
    identificacao: true,
    // SEMPRE o mais espaçoso, inclusive em lista longa. Quem imprime uma lista
    // de Cálculo vai resolver NA folha: sair apertado é o defeito que custa o
    // recurso inteiro, e quem quer economizar papel desce nas Opções — o
    // caminho contrário (descobrir que dá pra aumentar) ninguém percorre.
    espacamento: "amplo",
  };
}

/**
 * Sugestões de recorte pra uma lista de `total` questões.
 *
 * Só oferece números MENORES que o total (uma sugestão de 30 numa lista de 12
 * seria uma promessa falsa) e sempre termina com o total inteiro, limitado ao
 * teto do arquivo.
 */
export function sugestoesDeQuantidade(total: number): number[] {
  const base = [10, 15, 20, 30, 50, 80];
  const teto = Math.min(total, MAX_QUESTOES_FOLHA);
  const saida = base.filter((n) => n < teto);
  saida.push(teto);
  return saida;
}

export function limitarQuantidade(n: number, total: number): number {
  const teto = Math.min(total, MAX_QUESTOES_FOLHA);
  if (!Number.isFinite(n)) return teto;
  return Math.min(teto, Math.max(1, Math.round(n)));
}

/**
 * Estimativa de páginas A4.
 *
 * Deliberadamente grosseira e assumidamente aproximada na UI ("~N páginas"):
 * serve pra decidir entre 20 e 120 questões, não pra prever o arquivo. A conta
 * é em "altura equivalente": uma questão média ocupa ~55mm de coluna útil,
 * cada figura soma, e o espaço de resolução escolhido soma direto.
 */
export function paginasEstimadas(questoes: Pergunta[], opcoes: OpcoesFolha): number {
  const alturaUtilMm = 245; // A4 (297) menos margens e cabeçalho/rodapé correntes
  const extraEspaco = ALTURA_RESOLUCAO_MM[opcoes.espacamento];

  let mm = opcoes.identificacao ? 42 : 24; // cabeçalho da primeira página
  for (const q of questoes.slice(0, opcoes.quantidade)) {
    const linhasEnunciado = Math.ceil((q.enunciado?.length || 0) / 95);
    const alternativas = Object.keys(q.alternativas || {}).length;
    mm += 10 + linhasEnunciado * 5.5 + alternativas * 6.5 + extraEspaco;
    if (q.imagem_url) mm += 50;
    // Figuras de alternativa saem em DUAS colunas (ver Alternativas em
    // folha-prova.tsx): cinco figuras são três linhas, não cinco.
    const figurasAlt = Object.keys(q.alternativas_imagens || {}).length;
    if (figurasAlt > 0) mm += Math.ceil(figurasAlt / 2) * 24;
  }

  let paginas = Math.max(1, Math.ceil(mm / alturaUtilMm));
  if (opcoes.cartaoResposta) paginas += 1;
  if (opcoes.gabarito) paginas += 1;
  if (opcoes.gabarito && opcoes.resolucoes) paginas += 1;
  return paginas;
}

/**
 * Alternativas curtas o bastante pra caber lado a lado, como nas provas
 * impressas de verdade (a) 2 m/s (b) 4 m/s (c) ...
 *
 * Qualquer imagem, LaTeX de bloco ou texto longo desliga o modo em linha: uma
 * fórmula espremida em coluna de 25% é ilegível, e economizar papel não vale
 * uma alternativa que o aluno não consegue ler.
 */
export function alternativasEmLinha(q: Pergunta): boolean {
  const textos = Object.values(q.alternativas || {});
  if (textos.length === 0) return false;
  if (Object.keys(q.alternativas_imagens || {}).length > 0) return false;
  return textos.every((t) => {
    const s = (t ?? "").trim();
    return s.length > 0 && s.length <= 26 && !s.includes("$$") && !s.includes("\\frac");
  });
}

/**
 * O nome que o PDF vai ter ao ser salvo.
 *
 * O Chrome sugere o nome do arquivo a partir do `document.title` — e o título
 * da rota ("Imprimir lista do tópico · Expectrum") não diz NADA sobre o que o
 * aluno acabou de baixar: seis listas na pasta de Downloads com o mesmo nome
 * genérico. A troca acontece AO ABRIR a tela (efeito de montagem em
 * folha-impressao.tsx), nunca no clique de imprimir — ver o comentário lá.
 *
 * Sem "/" e sem ":" — em Windows e macOS eles não podem entrar num nome de
 * arquivo, e o navegador os substitui por algo pior do que não tê-los.
 */
export function nomeDoArquivo(disciplina: string | null, titulo: string): string {
  const partes = [disciplina, titulo].filter(Boolean) as string[];
  const bruto = partes.length > 0 ? partes.join(" - ") : "Lista de exercicios";
  return (
    bruto
      .replace(/[\\/:*?"<>|·]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90) + " - Expectrum"
  );
}
