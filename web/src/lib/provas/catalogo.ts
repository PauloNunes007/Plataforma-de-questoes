// Catálogo PÚBLICO das provas antigas oficiais de Física I e II da UFF.
//
// É a porta de entrada de quem ainda não tem conta: o aluno que digita
// "prova de física 2 da UFF" no Google cai aqui, vê que a prova dele existe
// mesmo — questão a questão, com os assuntos que ela cobra — e decide se
// quer entrar. Por isso a página é indexável e não exige sessão.
//
// POR QUE SERVICE_ROLE (mesma razão de lib/landing/stats.ts): `questions` e
// `vw_provas_oficiais` liberam leitura só pra `authenticated`. Com a chave
// anônima o catálogo voltaria vazio pro visitante — que é exatamente quem a
// página serve. A chave nunca sai do servidor e o que sai daqui é agregado.
//
// O QUE ESTA CAMADA DELIBERADAMENTE NÃO LÊ: `gabarito` e `resolucao`. Não é
// filtro de UI — as colunas não entram no `select`, então não existe caminho
// (props, JSON do RSC, view-source) que as entregue a quem não fez login. A
// amostra mostra a questão como ela é; a resposta é o produto.
//
// Regra de honestidade herdada da landing: nada aqui inventa número. Se o
// banco não responder, o catálogo volta vazio e a página diz isso — nunca um
// "31 provas" escrito na mão que vira mentira na próxima importação.
import { createAdminClient } from "@/lib/supabase/admin";
import { compararProvas, duracaoProvaOficial, lerCodigoProva } from "@/lib/simulados/provas-oficiais";

/** Cursos do acervo cobertos por esta página, na chave usada no prova_codigo. */
const CURSOS: Record<string, string> = { fis1: "1", fis2: "2" };
const SIGLA = "UFF";

export type ProvaCatalogo = {
  codigo: string;
  /** Slug legível da URL — "fisica-2-2023-1-p1". */
  slug: string;
  materiaNome: string;
  ano: number;
  semestre: number;
  /** "P1" | "P2" | "P3" */
  prova: string;
  /** "2023.1" — como o aluno escreve o período. */
  periodo: string;
  questoes: number;
  duracaoMin: number;
};

export type GrupoMateria = {
  materiaNome: string;
  /** "1" | "2" — o número da disciplina, pro slug e pros rótulos curtos. */
  numero: string;
  provas: ProvaCatalogo[];
  questoes: number;
};

export type CatalogoProvas = {
  grupos: GrupoMateria[];
  totalProvas: number;
  totalQuestoes: number;
  anoMin: number | null;
  anoMax: number | null;
  /** false = a consulta falhou; a página mostra estado honesto, não zero. */
  aoVivo: boolean;
};

const VAZIO: CatalogoProvas = {
  grupos: [],
  totalProvas: 0,
  totalQuestoes: 0,
  anoMin: null,
  anoMax: null,
  aoVivo: false,
};

/** "fis2-uff-2023.1-p1" → "fisica-2-2023-1-p1". null se não for prova desta página. */
export function slugDaProva(codigo: string): string | null {
  const c = lerCodigoProva(codigo);
  if (!c || c.sigla !== SIGLA) return null;
  const numero = CURSOS[c.curso];
  if (!numero) return null;
  return `fisica-${numero}-${c.ano}-${c.semestre}-${c.prova.toLowerCase()}`;
}

/** Inverso de `slugDaProva`. Devolve null pra qualquer coisa fora do formato —
 *  é a validação do que chega pela URL, antes de virar filtro de banco. */
export function codigoDoSlug(slug: string): string | null {
  const m = /^fisica-([12])-(\d{4})-([12])-(p[1-9])$/.exec(String(slug || "").trim().toLowerCase());
  if (!m) return null;
  return `fis${m[1]}-uff-${m[2]}.${m[3]}-${m[4]}`;
}

// `ano` da view não entra: o ano e o semestre corretos são os do prova_codigo
// (a view guarda max(q.ano), que não sabe distinguir 2023.1 de 2023.2).
type LinhaView = {
  codigo: string;
  materia_nome: string | null;
  questoes: number | null;
};

function montarProva(l: LinhaView): ProvaCatalogo | null {
  const c = lerCodigoProva(l.codigo);
  if (!c || c.sigla !== SIGLA || !CURSOS[c.curso]) return null;
  const slug = slugDaProva(l.codigo);
  if (!slug) return null;
  const questoes = Number(l.questoes ?? 0);
  return {
    codigo: l.codigo,
    slug,
    materiaNome: l.materia_nome ?? `Física ${CURSOS[c.curso]}`,
    ano: c.ano,
    semestre: c.semestre,
    prova: c.prova,
    periodo: `${c.ano}.${c.semestre}`,
    questoes,
    duracaoMin: duracaoProvaOficial(questoes),
  };
}

/** O catálogo inteiro, agrupado por disciplina e em ordem cronológica reversa. */
export async function carregarCatalogoProvas(): Promise<CatalogoProvas> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("vw_provas_oficiais")
      .select("codigo, materia_nome, questoes");
    // Sem supabase_provas_oficiais.sql rodado a view não existe: a página
    // perde o catálogo, não o ar.
    if (error || !data) return VAZIO;

    const provas = (data as LinhaView[])
      .map(montarProva)
      .filter((p): p is ProvaCatalogo => p !== null)
      .sort(compararProvas);

    if (provas.length === 0) return VAZIO;

    const porMateria = new Map<string, ProvaCatalogo[]>();
    for (const p of provas) {
      const lista = porMateria.get(p.materiaNome) ?? [];
      lista.push(p);
      porMateria.set(p.materiaNome, lista);
    }

    const grupos: GrupoMateria[] = [...porMateria.entries()]
      .map(([materiaNome, lista]) => ({
        materiaNome,
        numero: CURSOS[lerCodigoProva(lista[0].codigo)!.curso],
        provas: lista,
        questoes: lista.reduce((s, p) => s + p.questoes, 0),
      }))
      .sort((a, b) => a.numero.localeCompare(b.numero));

    const anos = provas.map((p) => p.ano);
    return {
      grupos,
      totalProvas: provas.length,
      totalQuestoes: provas.reduce((s, p) => s + p.questoes, 0),
      anoMin: Math.min(...anos),
      anoMax: Math.max(...anos),
      aoVivo: true,
    };
  } catch {
    return VAZIO;
  }
}

/* ------------------------------------------------------------- detalhe */

export type AmostraQuestao = {
  enunciado: string;
  /** letra → texto. Sem gabarito: ele não é lido do banco. */
  alternativas: { letra: string; texto: string; imagem: string | null }[];
  imagemUrl: string | null;
  topicoNome: string | null;
  subtopico: string | null;
  dificuldade: string | null;
  ordem: number | null;
};

export type ProvaPublica = {
  prova: ProvaCatalogo;
  /** Assuntos que a prova cobra, do mais cobrado pro menos. */
  topicos: { nome: string; questoes: number }[];
  /** Recortes mais finos (questions.subtopico), quando existem. */
  subtopicos: string[];
  dificuldades: { facil: number; medio: number; dificil: number };
  amostra: AmostraQuestao | null;
};

type TopicoEmbutido = { nome: string | null; materias: { nome: string | null } | { nome: string | null }[] | null };

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/**
 * Uma prova, pelo slug da URL. Devolve null quando o slug não casa com o
 * formato OU quando a prova não está no acervo — a página trata os dois como
 * 404, que é a verdade nos dois casos.
 */
export async function carregarProvaPublica(slug: string): Promise<ProvaPublica | null> {
  const codigo = codigoDoSlug(slug);
  if (!codigo) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("questions")
      // gabarito e resolucao NÃO entram aqui de propósito — ver o cabeçalho.
      .select(
        "enunciado, alternativas, alternativas_imagens, imagem_url, prova_ordem, dificuldade, subtopico, topicos!inner(nome, materias(nome))",
      )
      .eq("prova_codigo", codigo)
      .order("prova_ordem", { ascending: true });

    if (error || !data || data.length === 0) return null;

    const linhas = data as unknown as {
      enunciado: string;
      alternativas: Record<string, string> | null;
      alternativas_imagens: Record<string, string> | null;
      imagem_url: string | null;
      prova_ordem: number | null;
      dificuldade: string | null;
      subtopico: string | null;
      topicos: TopicoEmbutido | TopicoEmbutido[];
    }[];

    const materiaNome =
      primeiro(primeiro(linhas[0].topicos)?.materias ?? null)?.nome ?? null;

    const prova = montarProva({ codigo, materia_nome: materiaNome, questoes: linhas.length });
    if (!prova) return null;

    const contagem = new Map<string, number>();
    const subtopicos = new Set<string>();
    const dificuldades = { facil: 0, medio: 0, dificil: 0 };

    for (const l of linhas) {
      const nome = primeiro(l.topicos)?.nome;
      if (nome) contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
      if (l.subtopico) subtopicos.add(l.subtopico.trim());
      if (l.dificuldade === "facil" || l.dificuldade === "medio" || l.dificuldade === "dificil") {
        dificuldades[l.dificuldade] += 1;
      }
    }

    // A amostra é a primeira questão que tem alternativas de texto — não a
    // primeira da prova a qualquer custo: uma questão que é só figura não
    // mostra nada a quem chegou do Google.
    const bruta = linhas.find((l) => Object.values(l.alternativas || {}).some((t) => t?.trim()));
    const amostra: AmostraQuestao | null = bruta
      ? {
          enunciado: bruta.enunciado,
          alternativas: Object.entries(bruta.alternativas || {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letra, texto]) => ({
              letra: letra.toUpperCase(),
              texto,
              imagem: (bruta.alternativas_imagens || {})[letra] ?? null,
            })),
          imagemUrl: bruta.imagem_url,
          topicoNome: primeiro(bruta.topicos)?.nome ?? null,
          subtopico: bruta.subtopico,
          dificuldade: bruta.dificuldade,
          ordem: bruta.prova_ordem,
        }
      : null;

    return {
      prova,
      topicos: [...contagem.entries()]
        .map(([nome, questoes]) => ({ nome, questoes }))
        .sort((a, b) => b.questoes - a.questoes || a.nome.localeCompare(b.nome)),
      subtopicos: [...subtopicos].sort((a, b) => a.localeCompare(b)),
      dificuldades,
      amostra,
    };
  } catch {
    return null;
  }
}
