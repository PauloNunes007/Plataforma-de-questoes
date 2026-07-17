// ============================================================
// Validação do pipeline da rede neural com DADOS SINTÉTICOS.
// Rodar:  cd web && npx tsx scripts/rede-sintetica.ts
//
// Não substitui dados reais — valida que a MÁQUINA funciona e que o
// gate é honesto, em três cenários:
//  A) Mundo com sinal que o BKT NÃO modela (facilidade por questão,
//     habilidade por aluno, fadiga na sessão) → a rede DEVE vencer o
//     baseline e ser elegível pra ativação.
//  B) Mundo gerado EXATAMENTE pelo processo do baseline (BKT +
//     esquecimento + canal slip/guess) → o baseline é o modelo
//     verdadeiro, a rede não tem o que aprender além dele e NÃO PODE
//     ser ativada (ganho < margem) — detector de falso positivo.
//     (Um teste com rótulo=moeda não serve: lá o baseline fica mal
//     calibrado e a rede vence LEGITIMAMENTE ao prever 0.5.)
//  C) Mundo A com poucos dados (< MIN_EXEMPLOS_PARA_ATIVAR) → mesmo
//     ganhando, o gate DEVE recusar a ativação por volume.
// ============================================================

import { montarExemplos, type QuestaoBruta, type TentativaBruta } from "../src/lib/ml/dataset";
import { MIN_EXEMPLOS_PARA_ATIVAR, treinarEAvaliar } from "../src/lib/ml/treinar";
import { probAcertoBaseline } from "../src/lib/ml/features";
import {
  questlyEstadoEfetivo,
  questlyEvoluirEstadoTopico,
  questlyRetencaoDeEstado,
} from "../src/lib/questly/motor-aprovacao";

function criarRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussiana(rng: () => number): number {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));

type Mundo = { tentativas: TentativaBruta[]; questoes: QuestaoBruta[] };

// Cenário A: aluno tem habilidade latente, questão tem facilidade latente
// (correlacionada com a dificuldade rotulada, mas com ruído), conhecimento
// cresce com prática e decai com o tempo, e fadiga derruba o fim da sessão.
// Nada disso (exceto a dinâmica média de prática) está no BKT global.
function gerarMundoComSinal(nAlunos: number, seed: number): Mundo {
  const rng = criarRng(seed);
  const N_TOPICOS = 8;
  const Q_POR_TOPICO = 15;
  const DIAS = 90;

  const questoes: QuestaoBruta[] = [];
  const facilidadeQ = new Map<string, number>();
  const DIFS = ["facil", "medio", "dificil"] as const;
  for (let t = 0; t < N_TOPICOS; t++) {
    for (let q = 0; q < Q_POR_TOPICO; q++) {
      const id = `q-${t}-${q}`;
      const dif = DIFS[q % 3];
      questoes.push({ id, topic_id: `top-${t}`, dificuldade: dif });
      const base = dif === "facil" ? 0.9 : dif === "dificil" ? -0.9 : 0;
      facilidadeQ.set(id, base + gaussiana(rng) * 0.5);
    }
  }

  const tentativas: TentativaBruta[] = [];
  const inicio = Date.UTC(2026, 0, 1);
  for (let a = 0; a < nAlunos; a++) {
    const habilidade = gaussiana(rng) * 0.8;
    const conhecimento = new Array(N_TOPICOS).fill(-1.4);
    const ultimoDia = new Array(N_TOPICOS).fill(-1);
    let topicoAtual = 0;
    for (let dia = 0; dia < DIAS; dia++) {
      if (rng() > 0.4) continue; // nem todo dia é dia de estudo
      let posSessao = 0;
      const topicosHoje = [topicoAtual, Math.min(N_TOPICOS - 1, topicoAtual + (rng() < 0.3 ? 1 : 0))];
      for (const t of new Set(topicosHoje)) {
        const nQ = 4 + Math.floor(rng() * 7);
        for (let i = 0; i < nQ; i++) {
          posSessao++;
          const gap = ultimoDia[t] < 0 ? 0 : dia - ultimoDia[t];
          const kEfetivo = conhecimento[t] * Math.exp(-gap / 40) + (conhecimento[t] < 0 ? 0 : 0);
          const q = questoes[t * Q_POR_TOPICO + Math.floor(rng() * Q_POR_TOPICO)];
          const logit =
            kEfetivo + habilidade + (facilidadeQ.get(q.id) ?? 0) - 0.06 * posSessao;
          const pCerto = 0.15 + 0.8 * sigmoide(logit);
          const correta = rng() < pCerto;
          const ts = new Date(inicio + dia * 86_400_000 + posSessao * 90_000).toISOString();
          tentativas.push({ user_id: `alu-${a}`, question_id: q.id, correta, created_at: ts });
          conhecimento[t] = Math.min(2.5, conhecimento[t] + 0.35);
        }
        ultimoDia[t] = dia;
      }
      if (conhecimento[topicoAtual] > 1.5 && topicoAtual < N_TOPICOS - 1) topicoAtual++;
    }
  }
  return { tentativas, questoes };
}

// Cenário B: o mundo É o baseline — cada resposta é sorteada com a
// probabilidade que o próprio BKT+esquecimento prevê, e o estado evolui
// com AS MESMAS funções do motor. O baseline vira o modelo verdadeiro
// (perfeitamente calibrado); a rede não deve conseguir margem sobre ele.
function gerarMundoBkt(seed: number): Mundo {
  const molde = gerarMundoComSinal(40, seed); // reaproveita a AGENDA (quem responde o quê, quando)
  const rng = criarRng(seed ^ 0xdeadbeef);
  const estado = new Map<
    string,
    { maestria: number; estabilidade: number; ultimaRevisao: string | null }
  >();
  const questaoPorId = new Map(molde.questoes.map((q) => [q.id, q]));

  const tentativas = molde.tentativas.map((t) => {
    const topico = questaoPorId.get(t.question_id)?.topic_id ?? "?";
    const chave = `${t.user_id}|${topico}`;
    let e = estado.get(chave);
    if (!e) {
      e = { ...questlyEstadoEfetivo(null), ultimaRevisao: null };
      estado.set(chave, e);
    }
    const agoraMs = new Date(t.created_at).getTime();
    const retencao = e.ultimaRevisao ? questlyRetencaoDeEstado(e.estabilidade, e.ultimaRevisao, agoraMs) : 0;
    const correta = rng() < probAcertoBaseline(e.maestria, retencao);
    const evoluido = questlyEvoluirEstadoTopico({
      maestria: e.maestria,
      estabilidade: e.estabilidade,
      ultimaRevisao: e.ultimaRevisao,
      taxaAnterior: 0,
      numAnterior: 0,
      acertou: correta,
      agoraMs,
    });
    e.maestria = evoluido.maestria;
    e.estabilidade = evoluido.estabilidade;
    e.ultimaRevisao = t.created_at;
    return { ...t, correta };
  });

  return { questoes: molde.questoes, tentativas };
}

function rodar(nome: string, mundo: Mundo, esperadoVencer: boolean | null) {
  const exemplos = montarExemplos(mundo.tentativas, mundo.questoes);
  const t0 = Date.now();
  const r = treinarEAvaliar(exemplos, 42);
  const ms = Date.now() - t0;
  console.log(`\n━━ ${nome} ━━`);
  console.log(`exemplos: ${exemplos.length} · treino em ${ms}ms`);
  if (r.metricas) {
    console.log(
      `log-loss  rede ${r.metricas.logLoss.toFixed(4)}  vs  baseline BKT ${r.metricas.baselineLogLoss.toFixed(4)}`,
    );
    console.log(
      `AUC       rede ${r.metricas.auc?.toFixed(3) ?? "—"}    vs  baseline BKT ${r.metricas.baselineAuc?.toFixed(3) ?? "—"}`,
    );
    console.log(`épocas até melhor validação: ${r.metricas.epocas}`);
  }
  console.log(`veredito: ${r.motivo}`);
  if (esperadoVencer !== null && r.venceuBaseline !== esperadoVencer) {
    console.error(`❌ FALHA: esperava venceuBaseline=${esperadoVencer}, veio ${r.venceuBaseline}`);
    process.exitCode = 1;
  } else {
    console.log("✅ comportamento esperado");
  }
  return r;
}

// A) sinal extra abundante → a rede deve vencer e poder ativar
rodar("A: mundo com sinal além do BKT (60 alunos)", gerarMundoComSinal(60, 7), true);

// B) mundo = baseline → o gate NÃO pode ativar a rede
rodar("B: mundo gerado pelo próprio BKT (baseline é o modelo verdadeiro)", gerarMundoBkt(11), false);

// C) mesmo mundo de A mas com pouquíssimos dados → gate recusa por volume
{
  const pequeno = gerarMundoComSinal(2, 7);
  const exemplos = montarExemplos(pequeno.tentativas, pequeno.questoes);
  if (exemplos.length >= MIN_EXEMPLOS_PARA_ATIVAR) {
    // garante que o cenário realmente é pequeno
    pequeno.tentativas = pequeno.tentativas.slice(0, 400);
  }
  rodar("C: pouco dado (gate por volume)", pequeno, false);
}
