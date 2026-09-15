// Kit das levas de Química Geral no ESTILO DA BANCA DA UFF.
//
// Nasceu da leva `quimica_uff_estilo.mjs` (61 questões, 2026-09-11): o helper
// `qa` era inline lá e foi copiado à mão para cada lote novo. Aqui ele vira
// módulo porque a equalização de 2026-09-15 usa QUATRO lotes (um por tópico da
// ementa) e a regra do gabarito precisa valer igual em todos.
//
// RÉGUA DA MATÉRIA (memória `criacao_questoes_preferencias`): o dono cursou a
// disciplina e disse que o lote "estilo compêndio" foi longe demais. O padrão
// certo é a prova real do professor — "ele quer saber se você entendeu o
// FENÔMENO". Então: conceito em primeiro lugar, conta só quando cabe em uma
// linha (pH de ácido forte, E° de pilha, λν = c), nada de Slater, Born-Haber
// numérico, tabela ICE ou Nernst — esse material já existe no banco e está
// marcado como `desafio`.
//
// REGRAS DE FORMA:
//   - alternativas curtas, simétricas e da MESMA forma visual (todas em prosa
//     ou todas valores) — a correta não pode se destacar pela aparência;
//   - todo o raciocínio vive em `resolucao`, nunca dentro da alternativa;
//   - `instituicao: null` (autoral não se passa por prova real, e por isso não
//     entra no montador de simulados);
//   - `subtopico` obrigatório;
//   - a letra do gabarito NÃO é escolhida questão a questão: `finalizar()`
//     distribui as letras por uma sequência balanceada e embaralhada com
//     semente fixa (determinística, mas sem padrão perceptível).
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raizGerado = resolve(aqui, "..");

export const LETRAS = ["a", "b", "c", "d", "e"];

export const T1 = "Estrutura Atômica e Tabela Periódica";
export const T2 = "Ligações Químicas";
export const T3 = "Termodinâmica, Cinética e Equilíbrio";
export const T4 = "Funções Inorgânicas e Reações Químicas";

// PRNG com semente — o embaralhamento precisa ser reprodutível para que
// rodar o gerador duas vezes não troque o gabarito das questões já importadas.
function mulberry32(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sequência de n letras em que cada uma aparece n/5 vezes (±1), embaralhada.
// Balanceada por construção: o problema real do lote 3 de Cálculo I foi
// escolher a letra a olho, o que concentrou metade dos gabaritos numa letra.
function sequenciaDeLetras(n, semente) {
  const base = [];
  for (let i = 0; i < n; i++) base.push(LETRAS[i % 5]);
  const rnd = mulberry32(semente);
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

export function criarLote({ arquivo, semente }) {
  const itens = [];

  // `ok` é a correta, `err` os quatro distratores. A letra só é atribuída em
  // finalizar(), quando o total já é conhecido.
  const qa = (o) => {
    if (!o.sub) throw new Error(`subtopico obrigatório: ${o.e.slice(0, 60)}`);
    if (o.err.length !== 4) throw new Error(`precisa de 4 distratores: ${o.e.slice(0, 60)}`);
    itens.push(o);
  };

  const finalizar = () => {
    const seq = sequenciaDeLetras(itens.length, semente);
    const saida = itens.map((o, i) => {
      const letra = seq[i];
      const restantes = LETRAS.filter((l) => l !== letra);
      const mapa = { [letra]: o.ok };
      o.err.forEach((t, k) => {
        mapa[restantes[k]] = t;
      });
      return {
        materia: "Química Geral",
        topico: o.t,
        subtopico: o.sub,
        dificuldade: o.dif,
        instituicao: null,
        ano: null,
        enunciado: o.e,
        alternativas: Object.fromEntries(LETRAS.map((l) => [l, mapa[l]])),
        gabarito: letra,
        resolucao: o.r,
        tikz_code: null,
        imagem_enunciado: false,
        alternativas_com_imagem: [],
      };
    });

    // Rede local: distrator igual à correta (ou a outro distrator) é erro de
    // digitação que passa batido no validador e chega quebrado no aluno.
    saida.forEach((q, i) => {
      const textos = LETRAS.map((l) => q.alternativas[l].trim().toLowerCase());
      if (new Set(textos).size !== 5) throw new Error(`alternativas repetidas na questão ${i + 1}: ${q.enunciado.slice(0, 60)}`);
    });

    const destino = resolve(raizGerado, arquivo);
    writeFileSync(destino, JSON.stringify(saida, null, 2), "utf8");
    console.log(`${saida.length} questões escritas em ${arquivo}`);

    const conta = (chave) => {
      const m = new Map();
      saida.forEach((i) => m.set(i[chave], (m.get(i[chave]) || 0) + 1));
      return [...m.entries()].sort();
    };
    for (const chave of ["topico", "dificuldade", "gabarito"]) {
      console.log(`\npor ${chave}:`);
      conta(chave).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
    }
  };

  return { qa, finalizar };
}
