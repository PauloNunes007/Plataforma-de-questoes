// O PERFIL DA BANCA, lido do banco.
//
// `perfil.ts` é a matemática pura; este arquivo é a única coisa que sabe que
// ela vem de `questions.prova_codigo`. A separação é a mesma de
// `motor-aprovacao.ts` (puro) × `dashboard-data.ts` (leitura).
//
// Detalhe que não é detalhe: o perfil é agregado por **topic_id**, não pelo
// nome do tópico. O nome serve pra tela; o id é o que o sorteio da prova
// prevista precisa, e dois tópicos de matérias diferentes podem ter o mesmo
// nome. `perfil.ts` trata a chave como opaca justamente pra isto caber sem
// mudar nada lá.
import type { SupabaseClient } from "@supabase/supabase-js";

import { lerPaginado } from "@/lib/supabase/paginado";
import {
  montarPerfilBanca,
  perfisPorSlot,
  type PerfilBanca,
  type QuestaoDeProva,
} from "./perfil";

export type PerfilSlot = {
  perfil: PerfilBanca;
  materiaId: string;
  materiaNome: string;
  /** topic_id → nome do tópico, só pra exibição */
  nomeDoTopico: Record<string, string>;
  /** rótulo cru de `questions.instituicao` mais comum nas provas deste slot */
  instituicao: string | null;
};

type LinhaQuestaoProva = {
  topic_id: string | null;
  prova_codigo: string | null;
  dificuldade: string | null;
  instituicao: string | null;
};

type Materia = { id: string; nome: string };

async function lerTopicos(
  supabase: SupabaseClient,
  materiaId: string,
): Promise<{ id: string; nome: string }[]> {
  const { data } = await supabase
    .from("topicos")
    .select("id, nome")
    .eq("materia_id", materiaId);
  return ((data || []) as { id: string; nome: string | null }[])
    .filter((t) => t.id)
    .map((t) => ({ id: t.id, nome: t.nome || "" }));
}

/** As questões de prova oficial de uma matéria, no recorte que o perfil usa. */
async function lerQuestoesDeProva(
  supabase: SupabaseClient,
  topicoIds: string[],
): Promise<LinhaQuestaoProva[]> {
  if (topicoIds.length === 0) return [];
  return lerPaginado<LinhaQuestaoProva>(() =>
    supabase
      .from("questions")
      .select("topic_id, prova_codigo, dificuldade, instituicao")
      .in("topic_id", topicoIds)
      .not("prova_codigo", "is", null),
  );
}

function rotuloMaisComum(valores: (string | null)[]): string | null {
  const contagem = new Map<string, number>();
  for (const v of valores) {
    const s = (v || "").trim();
    if (!s) continue;
    contagem.set(s, (contagem.get(s) || 0) + 1);
  }
  let melhor: string | null = null;
  let maior = 0;
  for (const [k, n] of contagem) {
    if (n > maior || (n === maior && melhor !== null && k < melhor)) {
      melhor = k;
      maior = n;
    }
  }
  return melhor;
}

/**
 * Todos os slots (P1/P2/P3…) de uma matéria que têm amostra suficiente.
 *
 * Slot sem amostra simplesmente não volta — a ausência é a resposta honesta,
 * e a tela mostra "ainda não dá pra descrever esta prova" em vez de uma
 * previsão bonita em cima de duas provas.
 */
export async function carregarPerfisDaMateria(
  supabase: SupabaseClient,
  materiaId: string,
): Promise<PerfilSlot[]> {
  const { data: materia } = await supabase
    .from("materias")
    .select("id, nome")
    .eq("id", materiaId)
    .maybeSingle();
  if (!materia) return [];
  const m = materia as Materia;

  const topicos = await lerTopicos(supabase, materiaId);
  if (topicos.length === 0) return [];
  const nomeDoTopico = Object.fromEntries(topicos.map((t) => [t.id, t.nome]));

  const linhas = await lerQuestoesDeProva(
    supabase,
    topicos.map((t) => t.id),
  );
  if (linhas.length === 0) return [];

  const questoes: QuestaoDeProva[] = linhas
    .filter((l) => l.topic_id && l.prova_codigo)
    .map((l) => ({
      provaCodigo: l.prova_codigo as string,
      topico: l.topic_id as string,
      dificuldade: l.dificuldade,
    }));

  const perfis = perfisPorSlot(questoes, {
    // A ementa aqui são os tópicos da matéria — é o que faz "nunca caiu nesta
    // prova" ser uma afirmação sobre a EMENTA, e não sobre o que por acaso
    // apareceu no acervo.
    topicosDaEmenta: topicos.map((t) => t.id),
  });

  return perfis.map((perfil) => {
    const codigos = new Set(perfil.edicoes.map((e) => e.codigo));
    const instituicao = rotuloMaisComum(
      linhas.filter((l) => l.prova_codigo && codigos.has(l.prova_codigo)).map((l) => l.instituicao),
    );
    return {
      perfil,
      materiaId: m.id,
      materiaNome: m.nome,
      nomeDoTopico,
      instituicao,
    };
  });
}

/** Um slot só ("P1"). `null` quando não há amostra — ver acima. */
export async function carregarPerfilDoSlot(
  supabase: SupabaseClient,
  materiaId: string,
  slot: string,
): Promise<PerfilSlot | null> {
  const alvo = String(slot || "").trim().toUpperCase();
  if (!/^P\d$/.test(alvo)) return null;
  const todos = await carregarPerfisDaMateria(supabase, materiaId);
  return todos.find((p) => p.perfil.prova === alvo) ?? null;
}

/**
 * Quantas questões de cada tópico a próxima edição deve trazer.
 * `topic_id → nº de questões`, já somando exatamente `tamanhoPrevisto`.
 */
export function cotasPorTopico(perfil: PerfilBanca): Map<string, number> {
  const saida = new Map<string, number>();
  for (const t of perfil.topicos) {
    if (t.previstas > 0) saida.set(t.topico, t.previstas);
  }
  return saida;
}

/** Reexporta pra quem só precisa do perfil sem tocar em `perfil.ts`. */
export { montarPerfilBanca };
export type { PerfilBanca };

// ---------------------------------------------------------------------------
// Catálogo pro aluno
// ---------------------------------------------------------------------------

export type LinhaPrevisao = {
  topico: string;
  previstas: number;
  edicoes: number;
  totalEdicoes: number;
};

export type ProvaPrevista = {
  materiaId: string;
  materiaNome: string;
  sigla: string;
  /** "P1" | "P2" | "P3" */
  slot: string;
  totalEdicoes: number;
  periodoDe: string;
  periodoAte: string;
  tamanhoPrevisto: number;
  confianca: "alta" | "media" | "baixa";
  linhas: LinhaPrevisao[];
  /** tópicos da ementa que NUNCA caíram nesta prova */
  nuncaCaem: string[];
};

/**
 * As provas que dá pra prever pras disciplinas que o aluno cursa.
 *
 * Só volta slot com amostra — `perfisPorSlot` já descarta o resto. Quem não
 * cursa nenhuma matéria com acervo de prova recebe lista vazia, e a tela diz
 * isso em vez de inventar uma previsão.
 */
export async function carregarProvasPrevistas(
  supabase: SupabaseClient,
  user: { id: string },
): Promise<ProvaPrevista[]> {
  const { data: matriculas } = await supabase
    .from("subjects")
    .select("materia_id")
    .eq("user_id", user.id);

  const materiaIds = [
    ...new Set(((matriculas || []) as { materia_id: string | null }[]).map((m) => m.materia_id)),
  ].filter(Boolean) as string[];
  if (materiaIds.length === 0) return [];

  const porMateria = await Promise.all(
    materiaIds.map((id) => carregarPerfisDaMateria(supabase, id)),
  );

  const saida: ProvaPrevista[] = [];
  for (const perfis of porMateria) {
    for (const p of perfis) {
      const de = p.perfil.edicoes[0];
      const ate = p.perfil.edicoes[p.perfil.edicoes.length - 1];
      saida.push({
        materiaId: p.materiaId,
        materiaNome: p.materiaNome,
        sigla: p.perfil.sigla,
        slot: p.perfil.prova,
        totalEdicoes: p.perfil.totalEdicoes,
        periodoDe: `${de.ano}.${de.semestre}`,
        periodoAte: `${ate.ano}.${ate.semestre}`,
        tamanhoPrevisto: p.perfil.tamanhoPrevisto,
        confianca: p.perfil.confianca,
        // Só o que a previsão de fato coloca na prova; o resto vira a linha de
        // "raramente cai", que a tela não precisa listar item a item.
        linhas: p.perfil.topicos
          .filter((t) => t.previstas > 0)
          .map((t) => ({
            topico: p.nomeDoTopico[t.topico] || "—",
            previstas: t.previstas,
            edicoes: t.edicoes,
            totalEdicoes: p.perfil.totalEdicoes,
          })),
        nuncaCaem: p.perfil.topicosAusentes
          .map((id) => p.nomeDoTopico[id] || "")
          .filter(Boolean)
          .sort(),
      });
    }
  }

  return saida.sort(
    (a, b) => a.materiaNome.localeCompare(b.materiaNome) || a.slot.localeCompare(b.slot),
  );
}
