// Números REAIS do banco de questões, pra landing pública não precisar
// prometer nada que não temos. Roda só no servidor.
//
// Por que service_role: a landing é pública (visitante anônimo) e a policy de
// `questions` libera leitura só pra `authenticated` — com a chave anônima a
// contagem voltaria zerada. É leitura agregada, sem dado de aluno, e a chave
// nunca sai do servidor. Se a variável não estiver configurada (preview sem
// env, por exemplo), caímos num piso conservador em vez de quebrar a página.
import { createAdminClient } from "@/lib/supabase/admin";
import { contagemInstituicaoCompleta, contagemPorTopico } from "@/lib/questly/contagem-questoes";
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

export async function carregarStatsBanco(): Promise<StatsBanco> {
  try {
    const supabase = createAdminClient();
    // Agregados (views de supabase_escala_lancamento.sql) em vez das 2.583
    // linhas cruas de `questions`. Além de ~218 KB por revalidação, a leitura
    // antiga batia no teto de 1000 linhas do PostgREST: a landing anunciava
    // ~1.000 questões quando o banco já tinha 2.583, e a lista de tópicos em
    // foco saía incompleta. `.limit(20000)` não levantava esse teto (ele é do
    // servidor; o .limit só abaixa) — ver lib/supabase/paginado.ts.
    const [porTopico, porInstituicao] = await Promise.all([
      contagemPorTopico(supabase),
      contagemInstituicaoCompleta(supabase),
    ]);

    if (porTopico.length === 0) return FALLBACK;

    const materiasFoco = new Set(CAMPANHA.materias);
    const casadas = new Set(
      instituicoesQueCasam(
        CAMPANHA.instituicao,
        porInstituicao.map((l) => l.instituicao),
      ),
    );

    const disciplinas = new Set<string>();
    const topicos: (TopicoFoco & { ordem: number })[] = [];
    let total = 0;
    let materiaFoco = 0;

    for (const t of porTopico) {
      total += t.total;
      disciplinas.add(t.materiaNome);
      if (!materiasFoco.has(t.materiaNome)) continue;
      materiaFoco += t.total;
      topicos.push({
        materia: t.materiaNome,
        nome: t.topicoNome,
        questoes: t.total,
        ordem: t.topicoOrdem ?? 99,
      });
    }

    let instituicao = 0;
    let instituicaoMateriaFoco = 0;
    for (const l of porInstituicao) {
      // A view passou a devolver também as questões autorais (instituicao
      // null, ver supabase_simulados_fontes.sql) — elas não são de nenhuma
      // instituição, então nunca entram nesta contagem.
      if (!l.instituicao || !casadas.has(l.instituicao.trim())) continue;
      instituicao += l.total;
      if (materiasFoco.has(l.materiaNome)) instituicaoMateriaFoco += l.total;
    }

    const topicosFoco = topicos
      .sort((a, b) => a.materia.localeCompare(b.materia) || a.ordem - b.ordem)
      .map(({ materia, nome, questoes }) => ({ materia, nome, questoes }));

    return {
      total,
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
