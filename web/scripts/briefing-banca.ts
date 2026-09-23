// ============================================================
// BRIEFING DA BANCA — o dossiê que permite escrever questão NOVA
// no estilo de uma prova real.
//
// Rodar:
//   cd web && npx tsx scripts/briefing-banca.ts fis2 P1
//   cd web && npx tsx scripts/briefing-banca.ts fis1 P2 --exemplares 4
//
// Saída: `listas_questoes/gerado/briefings/<curso>-<slot>.md`.
//
// POR QUE ISTO EXISTE. "Escrever uma questão parecida com a da UFF" é um
// pedido vago até alguém dizer PARECIDA EM QUÊ. Este script responde com
// dado medido: quantas questões de cada tópico a prova traz, qual mix de
// dificuldade, quais ARQUÉTIPOS aquele professor repete (os `subtopico` das
// provas reais, que é onde o estilo mora) e exemplares íntegros de cada um,
// pra quem escreve ver o tom, o estilo numérico e o jeito dos distratores.
//
// O briefing NÃO gera questão. Ele alimenta o fluxo de autoria que já existe
// neste repositório (ver `listas_questoes/gerado/AGENTE_*.md`): um agente lê
// o dossiê, escreve o JSON, e o JSON entra pela fila de revisão de
// `/importar` — onde a checagem de duplicata e o olho humano decidem o que
// vira questão do banco. Nenhuma questão gerada chega ao aluno sem alguém ter
// olhado.
// ============================================================

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { montarPerfilBanca, chaveDificuldade, type QuestaoDeProva } from "../src/lib/banca/perfil";

const PASTA = join(process.cwd(), "..", "listas_questoes", "gerado");
const SAIDA = join(PASTA, "briefings");

const NOME_ARQUIVO = /^fisica(\d)_uff_(p\d)_(\d{4})_([12])\.json$/;

type ItemJson = {
  materia?: string | null;
  topico?: string | null;
  subtopico?: string | null;
  dificuldade?: string | null;
  enunciado?: string | null;
  alternativas?: Record<string, string> | null;
  gabarito?: string | null;
  imagem_enunciado?: boolean | null;
  imagem_url?: string | null;
};

type Questao = ItemJson & {
  provaCodigo: string;
  ano: number;
  semestre: number;
};

function carregar(curso: string, slot: string): Questao[] {
  const saida: Questao[] = [];
  for (const nome of readdirSync(PASTA).sort()) {
    const m = NOME_ARQUIVO.exec(nome);
    if (!m) continue;
    const [, disciplina, prova, ano, semestre] = m;
    if (`fis${disciplina}` !== curso.toLowerCase()) continue;
    if (prova.toUpperCase() !== slot.toUpperCase()) continue;
    const itens = JSON.parse(readFileSync(join(PASTA, nome), "utf8")) as ItemJson[];
    if (!Array.isArray(itens)) continue;
    for (const item of itens) {
      if (!String(item?.topico || "").trim()) continue;
      saida.push({
        ...item,
        provaCodigo: `fis${disciplina}-uff-${ano}.${semestre}-${prova}`,
        ano: Number(ano),
        semestre: Number(semestre),
      });
    }
  }
  return saida;
}

/** Mais recente primeiro — é o estilo atual da banca que interessa copiar. */
function porRecencia(a: Questao, b: Questao): number {
  return b.ano - a.ano || b.semestre - a.semestre;
}

function bloco(q: Questao): string {
  const letras = Object.keys(q.alternativas || {}).sort();
  const alternativas = letras
    .map((l) => `  ${l.toUpperCase()}) ${(q.alternativas || {})[l] ?? ""}`)
    .join("\n");
  const figura = q.imagem_url || q.imagem_enunciado ? "\n  *(esta questão tem figura)*" : "";
  return [
    `**${q.provaCodigo}** · ${q.dificuldade ?? "sem rótulo"} · _${q.subtopico ?? "sem subtópico"}_`,
    "",
    "```",
    (q.enunciado || "").trim(),
    "",
    alternativas,
    "```",
    `Gabarito: **${String(q.gabarito || "?").toUpperCase()}**${figura}`,
  ].join("\n");
}

function main(): void {
  const [curso, slot, ...resto] = process.argv.slice(2);
  if (!curso || !slot) {
    console.error("uso: npx tsx scripts/briefing-banca.ts <curso: fis1|fis2> <slot: P1|P2|P3> [--exemplares N]");
    process.exitCode = 1;
    return;
  }
  const iFlag = resto.indexOf("--exemplares");
  const porTopicoMax = iFlag >= 0 ? Math.max(1, Number(resto[iFlag + 1]) || 3) : 3;

  const questoes = carregar(curso, slot);
  if (questoes.length === 0) {
    console.error(`Nenhuma prova de ${curso} ${slot} no corpus.`);
    process.exitCode = 1;
    return;
  }

  const paraPerfil: QuestaoDeProva[] = questoes.map((q) => ({
    provaCodigo: q.provaCodigo,
    topico: String(q.topico),
    dificuldade: q.dificuldade,
  }));
  const perfil = montarPerfilBanca(paraPerfil);
  if (!perfil) {
    console.error("Amostra insuficiente pra descrever esta prova (< BANCA_MIN_EDICOES edições).");
    process.exitCode = 1;
    return;
  }

  const materia = questoes.find((q) => q.materia)?.materia ?? curso.toUpperCase();
  const de = perfil.edicoes[0];
  const ate = perfil.edicoes[perfil.edicoes.length - 1];

  const linhas: string[] = [];
  const p = (t = "") => linhas.push(t);

  p(`# Briefing da banca — ${materia} · ${perfil.sigla} · ${slot.toUpperCase()}`);
  p();
  p(
    `Gerado por \`scripts/briefing-banca.ts\` a partir de **${perfil.totalEdicoes} provas reais** ` +
      `(${de.ano}.${de.semestre} → ${ate.ano}.${ate.semestre}), ${questoes.length} questões.`,
  );
  p();
  p("> Tudo neste arquivo é **medido**, não opinião. Onde houver dúvida sobre o estilo da banca, a");
  p("> resposta está nos exemplares — eles são as questões que o professor de fato aplicou.");
  p();

  p("## O que você vai escrever");
  p();
  p("Questões **autorais**, novas, no estilo desta prova. Três regras que não se negociam:");
  p();
  p("1. **Nunca copie uma questão real.** O briefing existe pra você reproduzir o *tipo* de");
  p("   pergunta, não o enunciado. Trocar os números de uma questão existente é cópia, e o");
  p("   importador tem detecção de duplicata que vai pegar — o que é o menor dos problemas.");
  p("2. **A questão é sua e o rótulo diz isso.** `instituicao` vai como `\"Expectrum\"` e");
  p("   `prova_codigo` **não existe** no JSON de questão autoral. Uma questão que a gente");
  p("   escreveu nunca pode aparecer catalogada como prova da universidade.");
  p("3. **Você tem que conseguir resolver.** Escreva a resolução completa antes de fechar o");
  p("   gabarito; se a conta não fecha, a questão não vai. Distrator tem que ser o resultado de");
  p("   um ERRO PLAUSÍVEL (sinal trocado, fator 2 esquecido, raio no lugar do diâmetro), nunca");
  p("   um número aleatório.");
  p();

  p("## Composição da prova");
  p();
  p(`A próxima edição deve ter **${perfil.tamanhoPrevisto} questões**, assim distribuídas:`);
  p();
  p("| tópico | questões previstas | apareceu em | faixa por prova |");
  p("|---|---|---|---|");
  for (const t of perfil.topicos) {
    p(
      `| ${t.topico} | ${t.previstas} | ${t.edicoes} de ${perfil.totalEdicoes} | ${t.minimo}–${t.maximo} |`,
    );
  }
  p();
  const mix = Object.entries(perfil.dificuldade)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `**${k}** ${Math.round(v * 100)}%`)
    .join(" · ");
  p(`Mix de dificuldade (ponderado por recência): ${mix}.`);
  p();
  if (perfil.confianca !== "alta") {
    p(
      `⚠️ Confiança **${perfil.confianca}**: a composição varia bastante entre edições. Use a tabela ` +
        "como tendência, não como gabarito de proporções.",
    );
    p();
  }

  p("## Arquétipos por tópico");
  p();
  p("Cada linha é um `subtopico` de uma prova real — é o inventário do que esta banca pergunta.");
  p("Escreva questões que caiam NESTES arquétipos, com situação física e números novos.");
  p();

  const porTopico = new Map<string, Questao[]>();
  for (const q of questoes) {
    const k = String(q.topico);
    const lista = porTopico.get(k);
    if (lista) lista.push(q);
    else porTopico.set(k, [q]);
  }

  for (const t of perfil.topicos) {
    const doTopico = (porTopico.get(t.topico) || []).slice().sort(porRecencia);
    if (doTopico.length === 0) continue;

    p(`### ${t.topico}`);
    p();
    p(`${t.previstas} questão(ões) na prova prevista · ${doTopico.length} no acervo deste slot.`);
    p();
    const vistos = new Set<string>();
    for (const q of doTopico) {
      const st = String(q.subtopico || "").trim();
      if (!st || vistos.has(st.toLowerCase())) continue;
      vistos.add(st.toLowerCase());
      p(`- ${st}`);
    }
    p();
    p(`<details><summary>Exemplares (${Math.min(porTopicoMax, doTopico.length)} mais recentes)</summary>`);
    p();
    for (const q of doTopico.slice(0, porTopicoMax)) {
      p(bloco(q));
      p();
    }
    p("</details>");
    p();
  }

  p("## O JSON que você entrega");
  p();
  p("Um array por lote, em `listas_questoes/gerado/`, no mesmo formato que o importador já lê");
  p("(ver `AGENTE_PROVA_UFF_FIS2.md` pra o contrato completo de campos e imagens):");
  p();
  p("```json");
  p("[");
  p("  {");
  p(`    "materia": ${JSON.stringify(materia)},`);
  p(`    "topico": ${JSON.stringify(perfil.topicos[0]?.topico ?? "")},`);
  p('    "subtopico": "o arquétipo que esta questão cobra",');
  p('    "dificuldade": "medio",');
  p('    "instituicao": "Expectrum",');
  p(`    "ano": ${new Date().getFullYear()},`);
  p('    "enunciado": "…",');
  p('    "alternativas": { "a": "…", "b": "…", "c": "…", "d": "…", "e": "…" },');
  p('    "gabarito": "c",');
  p('    "resolucao": "…",');
  p('    "tikz_code": null');
  p("  }");
  p("]");
  p("```");
  p();
  p("Cinco alternativas, como a prova. `desafio` fica de fora (ou `false`): o que se está");
  p("escrevendo aqui é questão **de prova**, não aprofundamento.");
  p();
  p("## Depois");
  p();
  p("O arquivo entra por `/importar`. A fila de revisão mostra cada questão com o LaTeX");
  p("renderizado e a checagem de duplicata; **nada vai pro banco sem alguém aprovar**. Assim que");
  p("aprovadas, elas entram no sorteio normal e na **prova prevista** deste slot, porque a");
  p("previsão sorteia por tópico e dificuldade — não por origem.");

  mkdirSync(SAIDA, { recursive: true });
  const destino = join(SAIDA, `${curso.toLowerCase()}-${slot.toLowerCase()}.md`);
  writeFileSync(destino, linhas.join("\n"), "utf8");
  console.log(`Briefing escrito: ${destino}`);
  console.log(
    `${perfil.totalEdicoes} edições · ${questoes.length} questões · ${perfil.topicos.length} tópicos · confiança ${perfil.confianca}`,
  );
  const semSubtopico = questoes.filter((q) => !String(q.subtopico || "").trim()).length;
  if (semSubtopico > 0) {
    console.log(`Aviso: ${semSubtopico} questões sem subtopico — o inventário de arquétipos sai incompleto.`);
  }
  const semDificuldade = questoes.filter((q) => chaveDificuldade(q.dificuldade) === "outra").length;
  if (semDificuldade > 0) {
    console.log(`Aviso: ${semDificuldade} questões sem rótulo de dificuldade.`);
  }
}

main();
