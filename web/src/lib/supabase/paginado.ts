// O Supabase corta TODA resposta do PostgREST em 1000 linhas (`max-rows`),
// mesmo sem `.limit()` — e `.limit(20000)` NÃO levanta esse teto: o limite do
// cliente só consegue ABAIXAR o do servidor. O corte é silencioso: não vem
// erro, vem menos dado. Foi assim que a matéria "Fundamentos de Cálculo e
// Geometria" sumiu do Banco de Questões e que a trilha passou a marcar tópicos
// com questão como "sem questões" (auditoria de 2026-09-15).
//
// `lerPaginado` é a única forma segura de ler um conjunto que PODE passar de
// 1000 linhas: pagina com .range() até a última página. Exige uma coluna de
// ordenação estável (default "id") — sem ORDER BY, o Postgres não garante a
// mesma ordem entre páginas e dá pra pular ou repetir linha na virada.
//
// REGRA DE USO: antes de alcançar por isto, pergunte se dá pra não trazer as
// linhas. Quase todo lugar que varria `questions` só queria uma CONTAGEM — e
// contagem agora sai pronta das views de supabase_escala_lancamento.sql
// (vw_questoes_por_topico, vw_questoes_por_instituicao, vw_instituicoes),
// que devolvem dezenas de linhas em vez de milhares. Paginar 2.583 questões
// pra contá-las no JS é correto e caro; ler 74 linhas agregadas é correto e
// barato. Isto aqui é pra quando você precisa MESMO das linhas (sortear
// questões de uma missão/simulado) ou pra ler uma view que um dia pode passar
// de 1000 linhas.

/** Teto do PostgREST. Página maior que isso é cortada pelo servidor. */
export const PAGINA_POSTGREST = 1000;

// Tipagem estrutural em vez de importar PostgrestFilterBuilder: só precisamos
// de `.order()` + `.range()`, e os genéricos do postgrest-js mudam entre
// versões menores — depender deles aqui quebraria o build num `npm update`.
type Consultavel<T> = {
  order: (
    coluna: string,
    opcoes: { ascending: boolean },
  ) => {
    range: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
  };
};

export async function lerPaginado<T>(
  /** Recebe o offset e devolve a query já filtrada — SEM .range() e SEM
   *  .limit(); esta função cuida das duas coisas. */
  construir: () => Consultavel<T>,
  opcoes?: { ordenarPor?: string; tamanhoPagina?: number; maxPaginas?: number },
): Promise<T[]> {
  const ordenarPor = opcoes?.ordenarPor ?? "id";
  const tamanho = Math.min(opcoes?.tamanhoPagina ?? PAGINA_POSTGREST, PAGINA_POSTGREST);
  // Teto de segurança: uma query sem filtro num banco muito grande não pode
  // virar um loop que segura o request pra sempre.
  const maxPaginas = opcoes?.maxPaginas ?? 50;

  const todas: T[] = [];
  for (let pagina = 0; pagina < maxPaginas; pagina++) {
    const inicio = pagina * tamanho;
    const { data, error } = await construir()
      .order(ordenarPor, { ascending: true })
      .range(inicio, inicio + tamanho - 1);

    if (error) {
      console.error("Erro ao ler página do PostgREST:", error);
      break;
    }
    if (!data || data.length === 0) break;
    todas.push(...(data as T[]));
    if (data.length < tamanho) break;
  }
  return todas;
}

// ---------------------------------------------------------------------------
// Segundo limite, separado do de linhas: o TAMANHO DA URL.
// ---------------------------------------------------------------------------
// Um `.in("id", [...])` vira querystring. Medido contra este projeto
// (2026-09-15): ~300 uuids passam, ~400 uuids (≈14 KB de querystring) já
// falham com "fetch failed" — a conexão é cortada antes de chegar no Postgres,
// e o supabase-js devolve isso como um erro qualquer, fácil de engolir num
// `(data || [])`. Não é teto do Postgres, é do gateway HTTP na frente dele.
//
// Isso já estava quebrando de verdade: o cálculo de erros classificados por
// matéria montava um `.in()` com os 663 ids de Cálculo I, e o batching de
// lib/dashboard/desempenho-data.ts usava lotes de 400 — os dois acima do
// limite real.
//
// 200 é folgado (≈7 KB) e continua sendo pouca ida e volta.
export const LOTE_IN = 200;

/** Quebra uma lista de ids em lotes seguros pra `.in()` e concatena o
 *  resultado. Use SEMPRE que a lista não tiver um teto pequeno e conhecido. */
export async function emLotes<Id, T>(
  ids: Id[],
  consultar: (lote: Id[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
  tamanho: number = LOTE_IN,
): Promise<T[]> {
  const todas: T[] = [];
  for (let i = 0; i < ids.length; i += tamanho) {
    const { data, error } = await consultar(ids.slice(i, i + tamanho));
    if (error) {
      console.error("Erro ao consultar lote de ids:", error);
      continue;
    }
    if (data) todas.push(...data);
  }
  return todas;
}
