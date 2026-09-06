// Números REAIS do banco de questões, pra landing pública não precisar
// prometer nada que não temos. Roda só no servidor.
//
// Por que service_role: a landing é pública (visitante anônimo) e a policy de
// `questions` libera leitura só pra `authenticated` — com a chave anônima a
// contagem voltaria zerada. É leitura agregada, sem dado de aluno, e a chave
// nunca sai do servidor. Se a variável não estiver configurada (preview sem
// env, por exemplo), caímos num piso conservador em vez de quebrar a página.
import { createAdminClient } from "@/lib/supabase/admin";
import { instituicoesQueCasam } from "@/lib/cursos/instituicao";
import { CAMPANHA } from "./campanha";

export type TopicoFoco = { materia: string; nome: string; questoes: number };

export type StatsBanco = {
  /** Total de questões catalogadas. */
  total: number;
  /** Questões das matérias em foco da campanha (ex.: Física I + II). */
  materiaFoco: number;
  /** Questões de provas da instituição da campanha (ex.: UFF). */
  instituicao: number;
  /** Interseção: provas da instituição NA matéria em foco. */
  instituicaoMateriaFoco: number;
  /** Tópicos das matérias em foco, com contagem — em ordem curricular. */
  topicosFoco: TopicoFoco[];
  /** Quantas disciplinas têm pelo menos uma questão. */
  disciplinas: number;
  /** true quando os números vieram do banco; false = piso de fallback. */
  aoVivo: boolean;
};

// Piso deliberadamente abaixo do que já existe no banco: se a consulta falhar,
// a página segue no ar sem prometer mais do que temos.
const FALLBACK: StatsBanco = {
  total: 700,
  materiaFoco: 400,
  instituicao: 200,
  instituicaoMateriaFoco: 190,
  topicosFoco: [],
  disciplinas: 7,
  aoVivo: false,
};

type Linha = {
  instituicao: string | null;
  topic_id: string | null;
  topicos: {
    id: string;
    nome: string | null;
    ordem: number | null;
    materias: { nome: string | null } | null;
  } | null;
};

export async function carregarStatsBanco(): Promise<StatsBanco> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("questions")
      .select("instituicao, topic_id, topicos ( id, nome, ordem, materias ( nome ) )")
      .limit(20000);

    if (error || !data || data.length === 0) return FALLBACK;

    const linhas = data as unknown as Linha[];
    const materiasFoco = new Set(CAMPANHA.materias);
    const casadas = new Set(
      instituicoesQueCasam(
        CAMPANHA.instituicao,
        linhas.map((l) => l.instituicao),
      ),
    );

    const disciplinas = new Set<string>();
    const topicos = new Map<string, TopicoFoco & { ordem: number }>();
    let materiaFoco = 0;
    let instituicao = 0;
    let instituicaoMateriaFoco = 0;

    for (const l of linhas) {
      const materia = l.topicos?.materias?.nome ?? null;
      if (materia) disciplinas.add(materia);
      const ehFoco = !!materia && materiasFoco.has(materia);
      const ehInstituicao = !!l.instituicao && casadas.has(l.instituicao.trim());
      if (ehInstituicao) instituicao++;
      if (!ehFoco) continue;

      materiaFoco++;
      if (ehInstituicao) instituicaoMateriaFoco++;
      const t = l.topicos;
      if (!t?.id) continue;
      const atual = topicos.get(t.id);
      if (atual) atual.questoes++;
      else
        topicos.set(t.id, {
          materia: materia as string,
          nome: t.nome || "Tópico",
          questoes: 1,
          ordem: t.ordem ?? 99,
        });
    }

    const topicosFoco = [...topicos.values()]
      .sort((a, b) => a.materia.localeCompare(b.materia) || a.ordem - b.ordem)
      .map(({ materia, nome, questoes }) => ({ materia, nome, questoes }));

    return {
      total: linhas.length,
      materiaFoco,
      instituicao,
      instituicaoMateriaFoco,
      topicosFoco,
      disciplinas: disciplinas.size,
      aoVivo: true,
    };
  } catch {
    return FALLBACK;
  }
}

/** "429" → "420+". Arredonda pra BAIXO — a contagem exibida nunca infla o que
 *  existe no banco, e o degrau acompanha a ordem de grandeza pra não subestimar
 *  demais (199 vira "190+", não "150+"). */
export function arredondarPraBaixo(n: number): string {
  if (n < 20) return String(n);
  if (n < 500) return `${Math.floor(n / 10) * 10}+`;
  if (n < 2000) return `${Math.floor(n / 50) * 50}+`;
  return `${Math.floor(n / 500) * 500}+`;
}
