// De ONDE saem as questões de um simulado. Módulo PURO (sem Supabase) porque
// o montador é componente de cliente e o servidor revalida com as mesmas
// funções — fonte é decisão de produto, não de camada.
//
// Até 2026-09-16 um simulado só podia sair das provas da universidade do
// aluno, e quem não estudava numa instituição catalogada simplesmente não
// tinha a tela. Agora existem três liberdades (pedido do dono):
//   • misturar as provas da própria universidade com questões autorais;
//   • montar só com autorais (o caminho de todo mundo que não é da UFF);
//   • treinar com as provas de OUTRA universidade de propósito.
//
// "Fonte" agrupa os valores crus de `questions.instituicao` pelo núcleo do
// nome — "UFF", "UFF (1º sem.)" e "UFF (2º sem.)" são UMA fonte, a mesma
// fusão que `agruparInstituicoesContadas` já fazia no onboarding — mais a
// fonte sintética AUTORAL, que é `instituicao is null`.
import { normalizarInstituicao, nucleoInstituicao } from "@/lib/cursos/instituicao";
import { contarNaGrade, type ChaveDificuldade, type GradeTopico } from "./constantes";

/** Id da fonte sintética das questões sem instituição (feitas pela equipe).
 *  Com underscores pra não colidir com o núcleo de nenhuma instituição real. */
export const FONTE_AUTORAL = "__autorais__";

export const ROTULO_AUTORAL = "Autorais";

export type FonteSimulado = {
  /** `FONTE_AUTORAL` ou o núcleo normalizado da instituição ("uff"). */
  id: string;
  /** Rótulo pro aluno ("UFF", "Autorais"), na capitalização do banco. */
  nome: string;
  /** Quantas questões (regulares) essa fonte tem no recorte carregado. */
  questoes: number;
  /** Casa com `profiles.universidade` — é a fonte "da minha faculdade". */
  propria: boolean;
  autoral: boolean;
};

/**
 * `questions.instituicao` nem sempre guarda uma universidade: além de null,
 * parte das questões feitas pela equipe foi importada com o rótulo de autoria
 * própria ("Expectrum"). As duas coisas são a MESMA fonte pro aluno — ele não
 * distingue "sem origem" de "origem: a gente" — então caem as duas no autoral.
 * (Códigos de disciplina, tipo "MAT-111", continuam sendo fonte própria: são
 * lista de professor, não questão nossa.)
 */
export function ehRotuloAutoral(instituicao: string | null | undefined): boolean {
  const limpo = (instituicao || "").trim().toLowerCase();
  return limpo === "" || limpo.includes("questly") || limpo.includes("expectrum");
}

/** Valor cru de `questions.instituicao` → id de fonte. */
export function idDaFonte(instituicao: string | null | undefined): string {
  if (ehRotuloAutoral(instituicao)) return FONTE_AUTORAL;
  const nucleo = nucleoInstituicao(normalizarInstituicao((instituicao || "").trim()));
  return nucleo || FONTE_AUTORAL;
}

/**
 * Nome curto pra mostrar. Entre "UFF" e "UFF (1º sem.)" vence o mais curto —
 * é a instituição que o aluno reconhece, não o rótulo da edição da prova.
 */
export function melhorRotulo(atual: string | null, candidato: string): string {
  const limpo = candidato.trim();
  if (!atual) return limpo;
  return limpo.length < atual.length ? limpo : atual;
}

/**
 * Rótulo do conjunto de fontes de uma prova já montada — vai no título e na
 * coluna `simulados_aluno.instituicao`. Precisa caber numa linha de lista:
 * com três ou mais vira contagem, porque "UFF + UFRJ + USP + autorais" já não
 * é reconhecível de relance.
 */
export function rotuloDasFontes(nomes: string[]): string | null {
  const limpos = nomes.map((n) => n.trim()).filter(Boolean);
  if (limpos.length === 0) return null;
  if (limpos.length === 1) return limpos[0];
  if (limpos.length === 2) return `${limpos[0]} + ${limpos[1]}`;
  return `${limpos.length} fontes`;
}

/**
 * Reparte `quantidade` vagas entre as fontes escolhidas.
 *
 * REGRA: parte IGUAL pra cada fonte, limitada pelo estoque de cada uma, com a
 * sobra voltando pra quem ainda tem questão. Deliberadamente NÃO é
 * proporcional ao tamanho da fonte — proporcional produz exatamente o
 * resultado que o dono pediu pra evitar: o banco tem milhares de autorais
 * contra algumas dezenas de questões de uma prova específica, então a
 * proporção devolveria "29 autorais e 1 da UFF" e a prova deixaria de ser
 * coesa. Com parte igual, 20 questões de duas fontes viram 10 + 10; se a
 * fonte pequena só tem 4, viram 4 + 16 (ninguém fica sem prova por causa do
 * teto da outra).
 *
 * Determinística: com o mesmo estoque, a mesma divisão (o desempate é por
 * estoque restante e, aí sim, pelo id).
 */
export function repartirEntreFontes(
  /** fonteId → quantas questões existem disponíveis nela */
  disponivel: Map<string, number>,
  quantidade: number,
): Map<string, number> {
  const estoque = [...disponivel.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const cotas = new Map<string, number>(estoque.map(([id]) => [id, 0]));
  if (estoque.length === 0) return cotas;

  const total = estoque.reduce((s, [, n]) => s + n, 0);
  let restante = Math.max(0, Math.min(Math.round(quantidade), total));

  while (restante > 0) {
    const candidatas = estoque.filter(([id, n]) => (cotas.get(id) ?? 0) < n);
    if (candidatas.length === 0) break;

    const base = Math.floor(restante / candidatas.length);
    if (base === 0) {
      // Menos vagas que fontes: entrega de uma em uma, começando por quem tem
      // mais estoque sobrando (a fonte com mais conteúdo é a que menos sente
      // ficar de fora na próxima volta).
      const ordenadas = [...candidatas].sort(
        (a, b) =>
          b[1] - (cotas.get(b[0]) ?? 0) - (a[1] - (cotas.get(a[0]) ?? 0)) || a[0].localeCompare(b[0]),
      );
      for (const [id] of ordenadas) {
        if (restante === 0) break;
        cotas.set(id, (cotas.get(id) ?? 0) + 1);
        restante -= 1;
      }
      continue;
    }

    for (const [id, n] of candidatas) {
      const atual = cotas.get(id) ?? 0;
      const cabe = Math.min(base, n - atual, restante);
      if (cabe <= 0) continue;
      cotas.set(id, atual + cabe);
      restante -= cabe;
    }
  }

  return cotas;
}

/**
 * Quantas questões um tópico oferece no recorte atual — a versão por fonte de
 * `contarNaGrade`. Lista vazia (de fontes, dificuldades ou anos) é sempre
 * "todas", que é como o montador representa "sem filtro" sem precisar marcar
 * tudo e manter sincronia.
 */
export function contarNoTopico(
  porFonte: Record<string, GradeTopico>,
  fontes: readonly string[],
  dificuldades: readonly ChaveDificuldade[],
  anos: readonly number[],
): number {
  const ids = fontes.length > 0 ? fontes : Object.keys(porFonte);
  let total = 0;
  for (const id of ids) {
    const grade = porFonte[id];
    if (grade) total += contarNaGrade(grade, dificuldades, anos);
  }
  return total;
}

/** Rótulo da divisão prevista ("12 da UFF + 8 autorais"), pro aluno ver ANTES
 *  de começar como a mistura vai cair. Só faz sentido com 2+ fontes. */
export function rotuloDaDivisao(partes: { nome: string; questoes: number }[]): string {
  return partes
    .filter((p) => p.questoes > 0)
    .map((p) => `${p.questoes} ${p.nome}`)
    .join(" + ");
}
