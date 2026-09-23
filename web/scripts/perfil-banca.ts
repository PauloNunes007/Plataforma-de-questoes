// ============================================================
// Verificação do PERFIL DA BANCA sobre o corpus REAL de provas.
// Rodar:  cd web && npx tsx scripts/perfil-banca.ts
//
// Mesmo papel de `scripts/rede-sintetica.ts`: provar que a máquina
// funciona antes de existir tela. A diferença é que aqui não há mundo
// sintético — a entrada são as provas de verdade em
// `listas_questoes/gerado/`, e o que o script imprime é uma
// afirmação conferível contra o PDF da prova.
//
// Fonte: os JSONs de origem, e não o banco. O banco é a fonte em
// produção (questions.prova_codigo -> vw_provas_oficiais), mas ele
// só recebeu as provas cujas questões TODAS casaram na importação
// (31 provas / 461 questões, ver supabase_provas_oficiais.sql),
// enquanto o corpus em disco tem mais edições. Pra validar a
// matemática, quanto mais edição melhor.
//
// Três conferências, e todas têm resposta certa conhecida:
//  A) fis2-uff-p1: "A Lei de Gauss", "O Campo Elétrico" e "A Lei de
//     Coulomb" nas 7 edições; "Potencial Elétrico" em 3 delas.
//  B) A soma das questões previstas por tópico TEM que bater com o
//     tamanho previsto da prova (alocação por maior resto).
//  C) Slot com amostra fraca ou tamanho instável não pode sair com
//     confiança alta — é o teste de honestidade.
// ============================================================

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  BANCA_MIN_EDICOES,
  frasePerfil,
  perfisPorSlot,
  type PerfilBanca,
  type QuestaoDeProva,
} from "../src/lib/banca/perfil";

const PASTA = join(process.cwd(), "..", "listas_questoes", "gerado");

// fisica2_uff_p1_2025_1.json  ->  fis2-uff-2025.1-p1
// O nome do arquivo é a única fonte do código da prova aqui; na
// produção o código vem da coluna, escrito pela migração.
const NOME_ARQUIVO = /^fisica(\d)_uff_(p\d)_(\d{4})_([12])\.json$/;

function codigoDoArquivo(nome: string): string | null {
  const m = NOME_ARQUIVO.exec(nome);
  if (!m) return null;
  const [, disciplina, prova, ano, semestre] = m;
  return `fis${disciplina}-uff-${ano}.${semestre}-${prova}`;
}

type ItemJson = {
  topico?: string | null;
  dificuldade?: string | null;
  subtopico?: string | null;
};

function carregarCorpus(): QuestaoDeProva[] {
  const saida: QuestaoDeProva[] = [];
  for (const nome of readdirSync(PASTA).sort()) {
    const provaCodigo = codigoDoArquivo(nome);
    if (!provaCodigo) continue; // lotes sem edição (ex.: *_p1_lote1.json) ficam de fora
    const bruto = readFileSync(join(PASTA, nome), "utf8");
    let itens: ItemJson[];
    try {
      itens = JSON.parse(bruto) as ItemJson[];
    } catch {
      console.warn(`  ! ${nome}: JSON inválido, pulado`);
      continue;
    }
    if (!Array.isArray(itens)) continue;
    for (const item of itens) {
      const topico = String(item?.topico || "").trim();
      if (!topico) continue;
      saida.push({
        provaCodigo,
        topico,
        dificuldade: item?.dificuldade ?? null,
        subtopico: item?.subtopico ?? null,
      });
    }
  }
  return saida;
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function imprimirPerfil(p: PerfilBanca): void {
  const de = p.edicoes[0];
  const ate = p.edicoes[p.edicoes.length - 1];
  console.log(
    `\n── ${p.sigla} · ${p.curso.toUpperCase()} · ${p.prova} ` +
      `── ${p.totalEdicoes} edições (${de.ano}.${de.semestre} → ${ate.ano}.${ate.semestre})` +
      ` · confiança ${p.confianca}`,
  );
  console.log(`   Prova prevista: ${p.tamanhoPrevisto} questões — ${frasePerfil(p)}`);
  console.log(
    "   " +
      "tópico".padEnd(38) +
      "edições".padStart(9) +
      "média".padStart(8) +
      "ponder.".padStart(9) +
      "faixa".padStart(9) +
      "prev.".padStart(7),
  );
  for (const t of p.topicos) {
    console.log(
      "   " +
        t.topico.slice(0, 37).padEnd(38) +
        `${t.edicoes}/${p.totalEdicoes}`.padStart(9) +
        t.media.toFixed(1).padStart(8) +
        t.mediaPonderada.toFixed(1).padStart(9) +
        `${t.minimo}–${t.maximo}`.padStart(9) +
        String(t.previstas).padStart(7),
    );
  }
  const dif = Object.entries(p.dificuldade)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${pct(v)}`)
    .join(" · ");
  console.log(`   Dificuldade: ${dif}`);
  if (p.topicosAusentes.length > 0) {
    console.log(`   Nunca caiu neste slot: ${p.topicosAusentes.join(", ")}`);
  }
}

// ------------------------------------------------------------
function main(): void {
  console.log("PERFIL DA BANCA — corpus real de provas da UFF\n");
  const corpus = carregarCorpus();
  const provas = new Set(corpus.map((q) => q.provaCodigo));
  console.log(`Corpus: ${corpus.length} questões em ${provas.size} provas.`);

  // "Ementa" aproximada por curso: a união dos tópicos vistos em QUALQUER prova
  // daquela disciplina. Serve pra responder "isto cai na matéria mas nunca
  // nesta prova" — não é a ementa oficial (essa vive em `topicos`), e o rótulo
  // na saída diz exatamente isso.
  const porCurso = new Map<string, Set<string>>();
  for (const q of corpus) {
    const curso = q.provaCodigo.split("-")[0];
    const s = porCurso.get(curso) ?? new Set<string>();
    s.add(q.topico);
    porCurso.set(curso, s);
  }

  const perfis: PerfilBanca[] = [];
  for (const [curso, topicos] of porCurso) {
    const doCurso = corpus.filter((q) => q.provaCodigo.startsWith(`${curso}-`));
    perfis.push(...perfisPorSlot(doCurso, { topicosDaEmenta: [...topicos].sort() }));
  }
  perfis.sort((a, b) => a.chave.localeCompare(b.chave));

  for (const p of perfis) imprimirPerfil(p);

  // ----------------------------------------------------------
  console.log("\n\nCONFERÊNCIAS");
  let falhas = 0;

  const conferir = (ok: boolean, descricao: string, detalhe = ""): void => {
    console.log(`  ${ok ? "ok  " : "FALHA"} ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
    if (!ok) falhas++;
  };

  // A) o retrato conhecido da P1 de Física 2
  const p1 = perfis.find((p) => p.chave === "fis2-uff-p1");
  if (!p1) {
    conferir(false, "A) perfil de fis2-uff-p1 existe");
  } else {
    const linha = (nome: string) => p1.topicos.find((t) => t.topico === nome);
    conferir(p1.totalEdicoes === 7, "A) fis2-uff-p1 tem 7 edições", `${p1.totalEdicoes}`);
    conferir(
      linha("A Lei de Gauss")?.edicoes === 7,
      "A) 'A Lei de Gauss' cai em 7 de 7",
      `${linha("A Lei de Gauss")?.edicoes ?? "ausente"}`,
    );
    conferir(
      linha("O Campo Elétrico")?.edicoes === 7,
      "A) 'O Campo Elétrico' cai em 7 de 7",
      `${linha("O Campo Elétrico")?.edicoes ?? "ausente"}`,
    );
    conferir(
      linha("A Lei de Coulomb")?.edicoes === 7,
      "A) 'A Lei de Coulomb' cai em 7 de 7",
      `${linha("A Lei de Coulomb")?.edicoes ?? "ausente"}`,
    );
  }

  // B) a previsão fecha
  for (const p of perfis) {
    const soma = p.topicos.reduce((a, t) => a + t.previstas, 0);
    conferir(
      soma === p.tamanhoPrevisto,
      `B) ${p.chave}: previsões somam o tamanho da prova`,
      `${soma} vs ${p.tamanhoPrevisto}`,
    );
  }

  // C) honestidade: nenhum perfil abaixo do mínimo, e nenhum slot de tamanho
  //    instável saindo com confiança alta.
  for (const p of perfis) {
    conferir(
      p.totalEdicoes >= BANCA_MIN_EDICOES,
      `C) ${p.chave}: amostra >= ${BANCA_MIN_EDICOES}`,
      `${p.totalEdicoes}`,
    );
    const tamanhos = p.edicoes.map((e) => e.questoes);
    const instavel = Math.max(...tamanhos) - Math.min(...tamanhos) > 4;
    conferir(
      !(instavel && p.confianca === "alta"),
      `C) ${p.chave}: prova de tamanho instável não sai com confiança alta`,
      `${Math.min(...tamanhos)}–${Math.max(...tamanhos)} questões, confiança ${p.confianca}`,
    );
  }

  console.log(falhas === 0 ? "\nTudo certo.\n" : `\n${falhas} falha(s).\n`);
  if (falhas > 0) process.exitCode = 1;
}

main();
