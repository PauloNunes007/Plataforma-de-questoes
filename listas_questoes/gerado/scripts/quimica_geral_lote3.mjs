// Lote 3 de Química Geral — compêndio de reforço para colocar a matéria em pé
// de igualdade com Cálculo I, FCG e Álgebra Linear em quantidade de questões.
// Estilo Brown, "Química: A Ciência Central", com a preferência do usuário para
// Química: maioria conceitual, mas SEM questões triviais — toda questão exige
// duas ou mais etapas encadeadas (identificar a espécie, aplicar o modelo e só
// então concluir) e cada uma traz gabarito comentado completo.
//
// As questões vivem em quatro módulos, um por tópico da ementa cadastrada:
//   quimica_lote3/topico1_estrutura.mjs
//   quimica_lote3/topico2_ligacoes.mjs
//   quimica_lote3/topico3_termo_cinetica_equilibrio.mjs
//   quimica_lote3/topico4_funcoes_reacoes.mjs
//
// Rode: node listas_questoes/gerado/scripts/quimica_geral_lote3.mjs
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { questoes as t1 } from "./quimica_lote3/topico1_estrutura.mjs";
import { questoes as t2 } from "./quimica_lote3/topico2_ligacoes.mjs";
import { questoes as t3 } from "./quimica_lote3/topico3_termo_cinetica_equilibrio.mjs";
import { questoes as t4 } from "./quimica_lote3/topico4_funcoes_reacoes.mjs";

const MATERIA = "Química Geral";
const LETRAS = ["a", "b", "c", "d", "e"];

// A letra do gabarito vem de uma sequência pré-embaralhada e balanceada, nunca
// escolhida à mão questão a questão (ver scripts/calculo1_lote4.mjs).
function sequenciaDeLetras(n) {
  const base = [];
  for (let i = 0; i < n; i++) base.push(LETRAS[i % 5]);
  let s = 20260911;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

const brutas = [...t1, ...t2, ...t3, ...t4];
const letras = sequenciaDeLetras(brutas.length);

const questoes = brutas.map((b, i) => {
  const certa = letras[i];
  const alternativas = {};
  let k = 0;
  for (const l of LETRAS) alternativas[l] = l === certa ? b.correta : b.distratores[k++];
  return {
    materia: MATERIA,
    topico: b.topico,
    subtopico: b.subtopico,
    dificuldade: b.dificuldade,
    enunciado: b.enunciado,
    alternativas,
    gabarito: certa,
    resolucao: b.resolucao,
    instituicao: null,
    ano: null,
    tikz_code: null,
  };
});

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = resolve(aqui, "..", "quimica_geral_lote3.json");
writeFileSync(destino, JSON.stringify(questoes, null, 2), "utf8");

const conta = (campo) => {
  const m = new Map();
  for (const q of questoes) m.set(q[campo], (m.get(q[campo]) || 0) + 1);
  return m;
};

console.log(`${questoes.length} questões escritas em ${destino}`);
console.log("por tópico:");
[...conta("topico").entries()].forEach(([t, n]) => console.log(`  ${String(n).padStart(3)}  ${t}`));
console.log("por dificuldade:", Object.fromEntries(conta("dificuldade")));
console.log("por letra:", Object.fromEntries([...conta("gabarito").entries()].sort()));
const subs = new Set(questoes.map((q) => q.subtopico));
console.log(`subtópicos distintos: ${subs.size}`);
