"use server";

import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarDesempenho, DESEMPENHO_VAZIO, type DesempenhoDados } from "./desempenho-data";

// POR QUE ESTA ACTION EXISTE (2026-09-18).
//
// `carregarDesempenho` era o loader mais caro do app e rodava no
// `Promise.all` que SEGURA a home inteira. O comentário na page.tsx dizia que
// "a carga é leve porque vem agregada do servidor" — a agregação é em JS, e o
// que chega do banco antes dela é o histórico cru: até 8.000 linhas de
// `question_attempts`, lidas em páginas SEQUENCIAIS de 1.000 (o teto do
// PostgREST), e depois os ids batidos contra `questions`, `topicos` e
// `materias` em lotes `.in()` também sequenciais (~330 ids por lote). Num
// aluno com histórico grande isso é algo como 30 idas e voltas ao Supabase,
// uma esperando a outra, antes de o primeiro byte da home sair.
//
// E tudo isso pra abastecer a aba "Desempenho", que não é a aba inicial: o
// aluno que abre a home pra ver o que fazer hoje pagava pela análise que ele
// não pediu. Agora a home não espera mais por isso; a aba busca o próprio dado
// quando é aberta pela primeira vez (ver dashboard-view.tsx), e o resultado
// fica guardado no cliente enquanto a página viver.
export async function carregarDesempenhoAction(): Promise<DesempenhoDados> {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return DESEMPENHO_VAZIO;

  return carregarDesempenho(supabase, user.id);
}
