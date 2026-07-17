// Sanidade da rota Δnota/min (GPS da Aprovação) em cenários sintéticos.
// Rodar: npx tsx scripts/rota-sintetica.ts
// Mesma postura do rede-sintetica.ts: não é benchmark, é verificação de
// que o guloso se comporta como o produto promete.

import { questlyRotaAprovacao, type TopicoRota } from "../src/lib/questly/rota-aprovacao";

const AGORA = Date.now();
const DIA = 86_400_000;
const PROVA = AGORA + 14 * DIA;

function topico(id: string, extra: Partial<TopicoRota>): TopicoRota {
  return {
    id,
    nome: id,
    tempoMedioSeg: 150,
    questoesDisponiveis: 30,
    maestria: null,
    estabilidade: null,
    taxa_acerto: 0,
    num_questoes_respondidas: 0,
    ultima_revisao: null,
    ...extra,
  };
}

let falhas = 0;
function verificar(nome: string, ok: boolean, detalhe: string) {
  console.log(`${ok ? "✓" : "✗ FALHA"} ${nome}${ok ? "" : ` — ${detalhe}`}`);
  if (!ok) falhas++;
}

// Cenário: fraco/urgente vs. dominado vs. lacuna vs. sem questões.
const topicos: TopicoRota[] = [
  // dominado e revisado ontem — pouco a ganhar
  topico("dominado", {
    maestria: 0.95,
    estabilidade: 30,
    num_questoes_respondidas: 40,
    taxa_acerto: 0.95,
    ultima_revisao: new Date(AGORA - 1 * DIA).toISOString(),
  }),
  // fraco, tocado há 10 dias — memória caindo, muito a ganhar
  topico("fraco-urgente", {
    maestria: 0.45,
    estabilidade: 4,
    num_questoes_respondidas: 8,
    taxa_acerto: 0.5,
    ultima_revisao: new Date(AGORA - 10 * DIA).toISOString(),
  }),
  // nunca estudado — força 0 na prova, lacuna aberta
  topico("lacuna", {}),
  // fraco mas SEM questões no banco — não pode entrar na rota
  topico("sem-questoes", {
    questoesDisponiveis: 0,
    maestria: 0.3,
    estabilidade: 2,
    ultima_revisao: new Date(AGORA - 5 * DIA).toISOString(),
  }),
];

const rota = questlyRotaAprovacao({
  topicos,
  dataProvaMs: PROVA,
  agoraMs: AGORA,
  tempoDisponivelMin: 60,
});

if (!rota) {
  console.log("✗ FALHA rota nula num cenário com ganho óbvio");
  process.exit(1);
}

console.log(
  `rota: ${rota.notaAtual} → ${rota.notaAposRota} (+${rota.deltaNota} pts) em ~${rota.tempoTotalMin}min / ${rota.questoesTotal} questões`,
);
rota.passos.forEach((p, i) =>
  console.log(
    `  ${i + 1}. ${p.nome}: ${p.questoes}q ~${p.minutos}min +${p.deltaNota} pts (força ${p.forcaAntes.toFixed(2)} → ${p.forcaDepois.toFixed(2)})`,
  ),
);

verificar("nota sobe", rota.notaAposRota > rota.notaAtual, `${rota.notaAtual} → ${rota.notaAposRota}`);
verificar(
  "orçamento respeitado (60min + arredondamento)",
  rota.tempoTotalMin <= 60 + rota.passos.length,
  `tempoTotalMin=${rota.tempoTotalMin}`,
);
verificar(
  "tópico sem questões fica fora",
  rota.passos.every((p) => p.topicoId !== "sem-questoes"),
  "sem-questoes entrou na rota",
);
verificar(
  "prioridade é do fraco/lacuna, não do dominado",
  rota.passos[0].topicoId !== "dominado",
  `1º passo = ${rota.passos[0].topicoId}`,
);
const idsRota = rota.passos.map((p) => p.topicoId);
verificar(
  "fraco-urgente e lacuna entram na rota",
  idsRota.includes("fraco-urgente") && idsRota.includes("lacuna"),
  `rota = ${idsRota.join(", ")}`,
);

// Determinismo: mesma entrada, mesma rota (sem sorteio na simulação).
const rota2 = questlyRotaAprovacao({ topicos, dataProvaMs: PROVA, agoraMs: AGORA, tempoDisponivelMin: 60 });
verificar(
  "determinística",
  JSON.stringify(rota2) === JSON.stringify(rota),
  "duas execuções divergiram",
);

// Orçamento minúsculo: não pode estourar nem travar.
const rotaCurta = questlyRotaAprovacao({ topicos, dataProvaMs: PROVA, agoraMs: AGORA, tempoDisponivelMin: 5 });
verificar(
  "orçamento de 5min gera rota pequena",
  !!rotaCurta && rotaCurta.questoesTotal <= 2,
  `questoesTotal=${rotaCurta?.questoesTotal}`,
);

// Tudo dominado e recém-revisado: ganho ~zero → rota nula ou quase vazia.
const tudoDominado = ["a", "b"].map((id) =>
  topico(id, {
    maestria: 0.98,
    estabilidade: 60,
    num_questoes_respondidas: 50,
    taxa_acerto: 0.97,
    ultima_revisao: new Date(AGORA - 1 * DIA).toISOString(),
  }),
);
const rotaSaturada = questlyRotaAprovacao({
  topicos: tudoDominado,
  dataProvaMs: PROVA,
  agoraMs: AGORA,
  tempoDisponivelMin: 60,
});
verificar(
  "saturado não recomenda grind (Δ < 3 pts)",
  !rotaSaturada || rotaSaturada.deltaNota < 3,
  `deltaNota=${rotaSaturada?.deltaNota}`,
);

console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
