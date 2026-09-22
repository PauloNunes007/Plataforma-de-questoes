// Loader do Caderno de Erros (sem "use server": é chamado direto do Server
// Component, mesmo padrão de lib/anotacoes/dados.ts).
//
// A tabela `caderno_erros` guarda só a ESCOLHA de guardar a questão. Tudo o
// que o cartão mostra vem de junção com quem já é dono daquela verdade:
//   • questions          → enunciado, alternativas, gabarito, resolução
//   • question_attempts  → o que marquei, quando, por quê, quantas vezes
//   • question_notes     → a anotação (a mesma de /questoes/anotacoes)
//
// Todas as tabelas de tentativa/nota são dono-only sob RLS, então nenhuma
// delas precisa de filtro por id — o filtro extra só repetiria o recorte e
// ainda arriscaria estourar a URL (ver lib/supabase/paginado.ts).
import type { SupabaseClient } from "@supabase/supabase-js";
import { emLotes } from "@/lib/supabase/paginado";
import type { Pergunta } from "@/lib/questao/types";
import type { FiltroCaderno, ItemCaderno, ResumoCaderno } from "./types";

type TopicoEmbutido = { nome: string; materias: { nome: string } | { nome: string }[] | null };

function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type LinhaCaderno = {
  question_id: string;
  attempt_id: string | null;
  criado_em: string;
  resolvido_em: string | null;
};

export async function carregarCaderno(
  supabase: SupabaseClient,
  user: { id: string },
  filtro: FiltroCaderno = "abertos",
): Promise<ItemCaderno[]> {
  let consulta = supabase
    .from("caderno_erros")
    .select("question_id, attempt_id, criado_em, resolvido_em")
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });
  if (filtro === "abertos") consulta = consulta.is("resolvido_em", null);
  if (filtro === "resolvidos") consulta = consulta.not("resolvido_em", "is", null);

  const { data: linhasRaw } = await consulta;
  const linhas = (linhasRaw || []) as LinhaCaderno[];
  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => l.question_id);

  const [questoes, { data: tentativas }, { data: notas }, { data: favoritos }] = await Promise.all([
    // Em lotes: a lista de um aluno não tem teto, e um `.in()` grande estoura
    // a URL do gateway antes de chegar no banco.
    emLotes(ids, (lote) =>
      supabase.from("questions").select("*, topicos(nome, materias(nome))").in("id", lote),
    ),
    supabase
      .from("question_attempts")
      .select("id, question_id, correta, motivo_erro, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("question_notes").select("question_id, nota").eq("user_id", user.id),
    supabase.from("question_favoritos").select("question_id").eq("user_id", user.id),
  ]);

  const questaoPorId = new Map<string, ItemCaderno["questao"]>();
  questoes.forEach((q) => {
    const topico = primeiro(q.topicos as unknown as TopicoEmbutido | TopicoEmbutido[]);
    const materia = primeiro(topico?.materias ?? null);
    questaoPorId.set(q.id, {
      ...(q as Pergunta),
      materiaNome: materia?.nome ?? null,
      topicoNome: topico?.nome ?? null,
    });
  });

  const notaPorId = new Map<string, string>();
  (notas || []).forEach((n) => notaPorId.set(n.question_id as string, n.nota as string));

  const favoritadas = new Set((favoritos || []).map((f) => f.question_id as string));

  // Histórico por questão, montado numa passada só.
  type Hist = {
    erros: number;
    porId: Map<string, { correta: boolean; motivo_erro: string | null; created_at: string }>;
    ultimaErrada: { motivo_erro: string | null; created_at: string } | null;
    ultimoAcertoEm: string | null;
  };
  const historico = new Map<string, Hist>();
  const marcadaPorAttempt = new Map<string, string>();
  for (const t of (tentativas || []) as {
    id: string;
    question_id: string;
    correta: boolean;
    motivo_erro: string | null;
    created_at: string;
  }[]) {
    const h =
      historico.get(t.question_id) ??
      { erros: 0, porId: new Map(), ultimaErrada: null, ultimoAcertoEm: null };
    h.porId.set(t.id, t);
    if (t.correta) h.ultimoAcertoEm = t.created_at;
    else {
      h.erros += 1;
      h.ultimaErrada = { motivo_erro: t.motivo_erro, created_at: t.created_at };
    }
    historico.set(t.question_id, h);
    marcadaPorAttempt.set(t.id, t.question_id);
  }

  // `resposta_marcada` é a única coisa que exige olhar a tentativa ESPECÍFICA
  // que originou o item (o aluno pode ter refeito a questão depois e marcado
  // outra letra — o cartão fala da vez em que ele guardou).
  const attemptIds = linhas.map((l) => l.attempt_id).filter((id): id is string => !!id);
  const marcadaPorId = new Map<string, string | null>();
  if (attemptIds.length > 0) {
    const origens = await emLotes(attemptIds, (lote) =>
      supabase
        .from("question_attempts")
        .select("id, resposta_marcada")
        .eq("user_id", user.id)
        .in("id", lote),
    );
    origens.forEach((o) => marcadaPorId.set(o.id as string, (o.resposta_marcada as string) ?? null));
  }

  return linhas
    .map((linha): ItemCaderno | null => {
      const questao = questaoPorId.get(linha.question_id);
      if (!questao) return null; // questão apagada do banco depois de salva
      const h = historico.get(linha.question_id);
      return {
        questao,
        respostaMarcada: linha.attempt_id ? (marcadaPorId.get(linha.attempt_id) ?? null) : null,
        motivoErro: h?.ultimaErrada?.motivo_erro ?? null,
        erradoEm: h?.ultimaErrada?.created_at ?? null,
        vezesErrada: h?.erros ?? 0,
        // "acertou depois" = existe acerto posterior ao dia em que guardou.
        // É o que deixa o cartão sugerir "resolvi" sem MARCAR por conta
        // própria: um acerto pode ser sorte, e a decisão é do aluno.
        acertouDepois: !!h?.ultimoAcertoEm && h.ultimoAcertoEm > linha.criado_em,
        notaTexto: notaPorId.get(linha.question_id) ?? null,
        favoritado: favoritadas.has(linha.question_id),
        resolvidoEm: linha.resolvido_em,
      };
    })
    .filter((i): i is ItemCaderno => i !== null);
}

/** Contagem pros rótulos das abas e pro badge do menu. Dois head-counts —
 *  nunca trazer a lista só pra medir o tamanho dela. */
export async function contarCaderno(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResumoCaderno> {
  const base = () =>
    supabase.from("caderno_erros").select("id", { count: "exact", head: true }).eq("user_id", userId);
  const [{ count: abertos }, { count: resolvidos }] = await Promise.all([
    base().is("resolvido_em", null),
    base().not("resolvido_em", "is", null),
  ]);
  return { abertos: abertos ?? 0, resolvidos: resolvidos ?? 0 };
}
