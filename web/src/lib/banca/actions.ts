"use server";

// A PROVA PREVISTA — o simulado montado no formato que a banca de fato aplica.
//
// O montador comum pergunta ao aluno quais tópicos ele quer. Aqui ninguém
// pergunta nada: a composição vem do `perfil.ts`, medida nas edições
// anteriores DAQUELE slot (P1, P2, P3). Se a P1 de Física 2 tem, há sete
// semestres, ~6 questões de Gauss, ~5 de Campo Elétrico e ~3 de Coulomb, a
// prova prevista sai com exatamente isso.
//
// **Nada aqui é gerado.** As questões são reais, do banco — o que a previsão
// decide é a COMPOSIÇÃO, não o conteúdo. Risco de alucinação: zero.
//
// Duas regras que não devem ser afrouxadas:
//
//  · `prova_codigo` fica NULL nesta linha. Ela não é uma prova oficial, e
//    preencher a coluna colocaria um exame sintético dentro de
//    `vw_ranking_provas_oficiais` — o ranking compara quem fez A MESMA prova,
//    e duas provas previstas nunca são a mesma;
//  · simulado não paga XP, não acende ofensiva e não entra no motor de
//    maestria (regra de `supabase_simulados.sql`). Prever não é estudar.

import { createClient } from "@/lib/supabase/server";
import { lerPaginado } from "@/lib/supabase/paginado";
import { questlyEmbaralhar } from "@/lib/questly/shared";
import { dentroDoLimiteSemanal } from "@/lib/simulados/limite";
import { questoesJaVistas } from "@/lib/simulados/vistas";
import { duracaoProvaOficial } from "@/lib/simulados/provas-oficiais";
import { carregarPerfilDoSlot, cotasPorTopico } from "./banca-data";
import { chaveDificuldade, type PerfilBanca } from "./perfil";

/** Postgres 42703 = coluna inexistente. Mesma checagem de simulados/actions.ts. */
function ehColunaAusente(erro: { code?: string; message?: string } | null): boolean {
  if (!erro) return false;
  return erro.code === "42703" || /column .* does not exist/i.test(erro.message || "");
}

export type MontarPrevistaResultado =
  | { ok: true; id: string }
  | { ok: false; erro: "invalido" | "limite" | "sem_perfil" | "sem_questoes" };

type Candidata = {
  id: string;
  topic_id: string | null;
  dificuldade: string | null;
};

/**
 * Escolhe as questões de cada tópico tentando bater, no conjunto, o mix de
 * dificuldade que a banca aplica.
 *
 * Guloso por DÉFICIT: a cada vaga, prefere a dificuldade que está mais atrás
 * do alvo. É o que faz uma prova prevista de 15 questões sair com ~1/3 de
 * fáceis quando a banca aplica 1/3 de fáceis, em vez de virar um bloco de
 * difíceis só porque o banco tem mais dessas.
 *
 * Dentro da mesma dificuldade, inédita na frente de já vista — a mesma
 * prioridade (não filtro) do montador comum: quem já resolveu o banco inteiro
 * continua conseguindo montar a prova.
 */
function escolherComMix(
  porTopico: Map<string, Candidata[]>,
  cotas: Map<string, number>,
  mixAlvo: Record<string, number>,
  jaVistas: Set<string>,
): Candidata[] {
  const total = [...cotas.values()].reduce((a, b) => a + b, 0);
  const alvo: Record<string, number> = {};
  for (const [dif, fracao] of Object.entries(mixAlvo)) alvo[dif] = fracao * total;
  const usado: Record<string, number> = {};

  const deficit = (dif: string) => (alvo[dif] ?? 0) - (usado[dif] ?? 0);

  const saida: Candidata[] = [];
  // Tópico com a maior cota escolhe primeiro: ele é quem mais sofre se a
  // dificuldade escassa acabar antes de chegar nele.
  const ordemTopicos = [...cotas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  for (const [topico, cota] of ordemTopicos) {
    const disponiveis = questlyEmbaralhar(porTopico.get(topico) || []);
    const restantes = [...disponiveis];
    for (let i = 0; i < cota && restantes.length > 0; i++) {
      let melhorIdx = 0;
      let melhorNota = -Infinity;
      for (let k = 0; k < restantes.length; k++) {
        const dif = chaveDificuldade(restantes[k].dificuldade);
        // Déficit é o critério principal; o desempate por inédito vale menos
        // que um ponto inteiro de déficit, então nunca inverte a prioridade.
        const nota = deficit(dif) + (jaVistas.has(restantes[k].id) ? 0 : 0.25);
        if (nota > melhorNota) {
          melhorNota = nota;
          melhorIdx = k;
        }
      }
      const escolhida = restantes.splice(melhorIdx, 1)[0];
      const dif = chaveDificuldade(escolhida.dificuldade);
      usado[dif] = (usado[dif] ?? 0) + 1;
      saida.push(escolhida);
    }
  }
  return saida;
}

/**
 * Redistribui as vagas que um tópico não conseguiu preencher.
 *
 * Um tópico pode ter cota 6 e só 4 questões no banco. Sem isto a prova sairia
 * com 13 questões em vez de 15 — e o aluno estaria treinando um formato que
 * não é o da prova. As vagas sobrando vão pros tópicos que ainda têm questão,
 * na ordem da previsão (o mais cobrado primeiro).
 */
function ajustarCotasAoBanco(
  cotas: Map<string, number>,
  disponivel: Map<string, number>,
  perfil: PerfilBanca,
): Map<string, number> {
  const saida = new Map<string, number>();
  let sobra = 0;
  for (const [topico, cota] of cotas) {
    const cabe = Math.min(cota, disponivel.get(topico) ?? 0);
    saida.set(topico, cabe);
    sobra += cota - cabe;
  }
  if (sobra <= 0) return saida;

  // Ordem da previsão: quem a banca mais cobra recebe a vaga que sobrou.
  const ordem = perfil.topicos.map((t) => t.topico);
  let voltas = 0;
  while (sobra > 0 && voltas <= ordem.length) {
    let mudou = false;
    for (const topico of ordem) {
      if (sobra === 0) break;
      const atual = saida.get(topico) ?? 0;
      if (atual < (disponivel.get(topico) ?? 0)) {
        saida.set(topico, atual + 1);
        sobra -= 1;
        mudou = true;
      }
    }
    if (!mudou) break;
    voltas += 1;
  }
  return saida;
}

export async function montarSimuladoPrevistoAction(input: {
  materiaId: string;
  slot: string;
}): Promise<MontarPrevistaResultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "invalido" };

  const materiaId = String(input?.materiaId || "").trim();
  const slot = String(input?.slot || "").trim().toUpperCase();
  if (!materiaId || !/^P\d$/.test(slot)) return { ok: false, erro: "invalido" };

  const perfilSlot = await carregarPerfilDoSlot(supabase, materiaId, slot);
  if (!perfilSlot) return { ok: false, erro: "sem_perfil" };
  const { perfil } = perfilSlot;

  if (!(await dentroDoLimiteSemanal(supabase, user.id))) return { ok: false, erro: "limite" };

  const cotas = cotasPorTopico(perfil);
  const topicoIds = [...cotas.keys()];
  if (topicoIds.length === 0) return { ok: false, erro: "sem_perfil" };

  // Candidatas: o banco inteiro daqueles tópicos, menos aprofundamento
  // (`desafio`), que fica fora de todo sorteio automático — ver
  // supabase_questao_desafio.sql. Não filtra por instituição de propósito: o
  // que a previsão promete é o FORMATO da banca, e uma questão autoral do
  // mesmo tópico e da mesma dificuldade treina esse formato igual.
  const candidatas = await lerPaginado<Candidata>(() =>
    supabase
      .from("questions")
      .select("id, topic_id, dificuldade")
      .in("topic_id", topicoIds)
      .eq("desafio", false),
  );
  if (candidatas.length === 0) return { ok: false, erro: "sem_questoes" };

  const porTopico = new Map<string, Candidata[]>();
  for (const q of candidatas) {
    if (!q.topic_id) continue;
    const lista = porTopico.get(q.topic_id);
    if (lista) lista.push(q);
    else porTopico.set(q.topic_id, [q]);
  }

  const disponivel = new Map([...porTopico].map(([k, v]) => [k, v.length]));
  const cotasReais = ajustarCotasAoBanco(cotas, disponivel, perfil);

  const jaVistas = await questoesJaVistas(supabase, user.id);
  const escolhidas = escolherComMix(porTopico, cotasReais, perfil.dificuldade, jaVistas);
  if (escolhidas.length === 0) return { ok: false, erro: "sem_questoes" };

  // A ordem é embaralhada: a prova real não agrupa por tópico, e sair com as
  // seis de Gauss em sequência entregaria de graça metade do trabalho de
  // reconhecer o assunto — que é parte do que a prova cobra.
  const questionIds = questlyEmbaralhar(escolhidas).map((q) => q.id);
  const duracaoMin = duracaoProvaOficial(questionIds.length);

  const linha = {
      user_id: user.id,
      // "Prova prevista" na frente, e não "Simulado": numa lista de vinte, a
      // primeira palavra é o que diz o que aquela linha é.
      titulo: `Prova prevista ${perfil.sigla} · ${perfilSlot.materiaNome} · ${slot}`,
      instituicao: perfil.sigla,
      materia_ids: [materiaId],
      topico_ids: [...cotasReais.keys()].filter((t) => (cotasReais.get(t) ?? 0) > 0),
      question_ids: questionIds,
      duracao_min: duracaoMin,
      qtd_questoes: questionIds.length,
      status: "em_andamento",
      respostas: {},
    // prova_codigo fica NULL — ver o comentário no topo do arquivo.
    prova_prevista: slot,
  };

  const inserir = (dados: Record<string, unknown>) =>
    supabase.from("simulados_aluno").insert(dados).select("id").single();

  let { data: criado, error } = await inserir(linha);

  // `prova_prevista` é coluna nova (supabase_prova_prevista.sql). Num banco
  // que ainda não rodou a migração, o insert inteiro falharia por causa de um
  // campo que só serve pro MOLDE da folha impressa — então a prova é montada
  // do mesmo jeito e só perde o molde. Mesma degradação que o app já faz com
  // `missions.xp_pago` e com `tempos`.
  if (error && ehColunaAusente(error)) {
    const { prova_prevista: _ignorado, ...semColuna } = linha;
    void _ignorado;
    ({ data: criado, error } = await inserir(semColuna));
  }

  if (error || !criado) {
    console.error("Erro ao montar a prova prevista:", error);
    return { ok: false, erro: "invalido" };
  }
  return { ok: true, id: criado.id as string };
}

/** Só pra telemetria/depuração da composição — não escreve nada. */
export async function conferirComposicaoPrevistaAction(input: {
  materiaId: string;
  slot: string;
}): Promise<
  | { ok: true; tamanho: number; linhas: { topico: string; previstas: number; edicoes: number }[] }
  | { ok: false }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const perfilSlot = await carregarPerfilDoSlot(
    supabase,
    String(input?.materiaId || ""),
    String(input?.slot || ""),
  );
  if (!perfilSlot) return { ok: false };
  return {
    ok: true,
    tamanho: perfilSlot.perfil.tamanhoPrevisto,
    linhas: perfilSlot.perfil.topicos.map((t) => ({
      topico: perfilSlot.nomeDoTopico[t.topico] || t.topico,
      previstas: t.previstas,
      edicoes: t.edicoes,
    })),
  };
}
