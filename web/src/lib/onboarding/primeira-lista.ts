// A PRIMEIRA LISTA de quem acabou de chegar — o que transforma "criei a conta"
// em "respondi uma questão".
//
// Existe por causa de um funil medido em 2026-10-24: de 36 alunos que
// terminaram o onboarding, só 11 responderam alguma questão. O resto chegava à
// home e encontrava um convite pra PLANEJAR a semana num calendário vazio, ou
// um assistente de quatro escolhas (disciplina, assuntos, dificuldade,
// quantidade) — decisões que ninguém sabe tomar antes de ver uma questão.
//
// Aqui o app decide por ele, uma vez só, e de forma previsível:
//   • a disciplina do aluno com MAIS questões regulares no banco (a que tem o
//     melhor conteúdo pra uma primeira impressão — e não depende de uma coluna
//     de ordem de cadastro em `subjects`);
//   • o COMEÇO da ementa (os primeiros tópicos por `ordem`), que é o conteúdo
//     mais provável de o aluno já ter visto em aula;
//   • fácil e médio, 5 questões: um aquecimento de ~10 minutos, não uma prova.
//     Se a disciplina não tiver fácil/médio nesses tópicos, cai pra qualquer
//     dificuldade — melhor uma lista difícil do que nenhuma.
//
// Não é prescrição de rotina (o motor de missões continua morto, ver
// web/CLAUDE.md): é uma porta de entrada, oferecida só a quem nunca respondeu.
//
// Sem "use server": chamado por Server Actions (onboarding e home).
import type { SupabaseClient } from "@supabase/supabase-js";
import { criarListaDeQuestoes } from "@/lib/questly/criar-lista";
import { contagemDasMaterias } from "@/lib/questly/contagem-questoes";

export const PRIMEIRA_LISTA_QTD = 5;
/** Quantos tópicos do começo da ementa entram no sorteio. Dois dá variedade
 *  sem sair do que provavelmente já foi dado em aula. */
const PRIMEIRA_LISTA_TOPICOS = 2;

export type PrimeiraLista = {
  subjectId: string;
  disciplina: string;
  topicIds: string[];
};

/** Escolhe disciplina e tópicos da primeira lista, sem gravar nada. */
export async function escolherPrimeiraLista(
  supabase: SupabaseClient,
  userId: string,
): Promise<PrimeiraLista | null> {
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, nome, materia_id")
    .eq("user_id", userId);
  const comMateria = (subjects ?? []).filter((s) => s.materia_id);
  if (comMateria.length === 0) return null;

  const contagens = await contagemDasMaterias(
    supabase,
    comMateria.map((s) => s.materia_id as string),
  );

  let melhor: PrimeiraLista | null = null;
  let melhorTotal = 0;
  for (const s of comMateria) {
    const topicos = contagens
      .filter((c) => c.materiaId === s.materia_id && c.totalRegular > 0)
      .sort((a, b) => (a.topicoOrdem ?? 9999) - (b.topicoOrdem ?? 9999));
    const total = topicos.reduce((acc, t) => acc + t.totalRegular, 0);
    if (total > melhorTotal) {
      melhorTotal = total;
      melhor = {
        subjectId: s.id as string,
        disciplina: s.nome as string,
        topicIds: topicos.slice(0, PRIMEIRA_LISTA_TOPICOS).map((t) => t.topicId),
      };
    }
  }
  return melhor;
}

/** Monta e grava a primeira lista. Devolve null quando o aluno não tem
 *  disciplina com questão — quem chama manda pro Banco de Questões. */
export async function criarPrimeiraLista(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ missaoId: string | null }> {
  const escolha = await escolherPrimeiraLista(supabase, userId);
  if (!escolha) return { missaoId: null };

  const base = {
    subjectId: escolha.subjectId,
    topicIds: escolha.topicIds,
    quantidade: PRIMEIRA_LISTA_QTD,
  };
  const leve = await criarListaDeQuestoes(supabase, userId, {
    ...base,
    dificuldades: ["facil", "medio"],
  });
  if (leve.missaoId) return { missaoId: leve.missaoId };

  const qualquer = await criarListaDeQuestoes(supabase, userId, { ...base, dificuldades: [] });
  return { missaoId: qualquer.missaoId };
}
