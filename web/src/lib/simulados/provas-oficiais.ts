// Provas antigas OFICIAIS — a prova real de uma universidade, reaplicada na
// ordem original, em vez de um exame sorteado que nunca existiu.
//
// Módulo PURO (sem Supabase): o servidor monta a prova com estas funções e a
// tela mostra o mesmo rótulo e o mesmo relógio. Ver supabase_provas_oficiais.sql
// pra identidade da prova no banco (`questions.prova_codigo`/`prova_ordem`).
//
// O código da prova é a chave de tudo e tem formato fechado:
//     fis2-uff-2023.1-p1
//     └───┘ └─┘ └────┘ └┘
//    curso  sigla  período  prova
// Ele é gerado na migração, nunca digitado por ninguém — o que chega do
// cliente é sempre casado contra `vw_provas_oficiais` antes de virar filtro.
import { SIMULADO_DURACOES_MIN } from "./constantes";

export type ProvaOficial = {
  codigo: string;
  materiaId: string;
  materiaNome: string;
  /** valor cru de questions.instituicao ("UFF (1º sem.)") — só telemetria */
  instituicao: string | null;
  ano: number;
  /** 1 ou 2 (o semestre em que a prova foi aplicada) */
  semestre: number;
  /** "P1", "P2", "P3"… em caixa alta, como o aluno chama */
  prova: string;
  sigla: string;
  questoes: number;
  duracaoMin: number;
};

/** O que o aluno já fez desta prova (nunca de outra pessoa). */
export type MinhaTentativa = {
  simuladoId: string;
  status: "em_andamento" | "concluido" | "abandonado";
  nota: number | null;
  acertos: number | null;
  total: number | null;
  publico: boolean;
  criadoEm: string;
};

const FORMATO = /^([a-z0-9]+)-([a-z]+)-(\d{4})\.([12])-(p\d)$/;

export type CodigoProva = {
  curso: string;
  sigla: string;
  ano: number;
  semestre: number;
  prova: string;
};

/** Devolve null pra qualquer coisa fora do formato — é a validação de entrada
 *  do código que chega do cliente, antes mesmo de ir ao banco. */
export function lerCodigoProva(codigo: string): CodigoProva | null {
  const m = FORMATO.exec(String(codigo || "").trim().toLowerCase());
  if (!m) return null;
  return {
    curso: m[1],
    sigla: m[2].toUpperCase(),
    ano: Number(m[3]),
    semestre: Number(m[4]),
    prova: m[5].toUpperCase(),
  };
}

/** "P1 · 2023.1" — o jeito como o aluno se refere à prova na conversa. */
export function rotuloProva(p: Pick<ProvaOficial, "prova" | "ano" | "semestre">): string {
  return `${p.prova} · ${p.ano}.${p.semestre}`;
}

/** Título do simulado gerado a partir dela. Começa com "Prova" (e não
 *  "Simulado") de propósito: na lista do histórico, ao lado dos sorteados, a
 *  primeira palavra é o que diz que esta aqui existiu de verdade. */
export function tituloProvaOficial(p: ProvaOficial): string {
  return `Prova ${p.sigla} · ${p.materiaNome} · ${p.prova} ${p.ano}.${p.semestre}`;
}

/**
 * Relógio da prova. O acervo guarda as QUESTÕES da prova, não quanto tempo o
 * professor deu — então o tempo é derivado do tamanho, a 8 min por questão,
 * arredondado pra uma das durações que o app já oferece. Não é invenção
 * disfarçada de dado: a UI chama isso de "tempo sugerido", e 8 min/questão é
 * exatamente o ritmo de uma prova de 15 questões em 2h, que é o formato da UFF
 * de onde vem a maior parte do acervo.
 */
export function duracaoProvaOficial(questoes: number): number {
  const alvo = Math.max(1, questoes) * 8;
  return SIMULADO_DURACOES_MIN.reduce((melhor, min) =>
    Math.abs(min - alvo) < Math.abs(melhor - alvo) ? min : melhor,
  );
}

/** Ordena o catálogo: mais recente primeiro, e dentro do período P1 → P2 → P3
 *  (a ordem cronológica do semestre, não a alfabética). */
export function compararProvas(a: ProvaOficial, b: ProvaOficial): number {
  return (
    b.ano - a.ano ||
    b.semestre - a.semestre ||
    a.prova.localeCompare(b.prova) ||
    a.materiaNome.localeCompare(b.materiaNome)
  );
}

/**
 * Posição no ranking com empate justo: quem tem a MESMA nota divide a mesma
 * colocação (1,1,3), e o desempate visual é o tempo. A mesma regra de
 * "competition ranking" da liga semanal (questlyDestinoNaLiga) — dois alunos
 * que acertaram o mesmo número de questões não podem ser 1º e 2º por causa de
 * quem clicou mais rápido no botão de entregar.
 */
export function posicoesDoRanking<T extends { nota: number | null }>(linhas: T[]): number[] {
  const saida: number[] = [];
  let posicao = 0;
  let anterior: number | null = null;
  for (const [i, l] of linhas.entries()) {
    const nota = Number(l.nota ?? 0);
    if (anterior == null || nota !== anterior) posicao = i + 1;
    saida.push(posicao);
    anterior = nota;
  }
  return saida;
}
