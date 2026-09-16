// O "porquê" da missão do dia, em português de gente.
//
// **Repasse de 2026-09-16 — o GPS da Aprovação foi FUNDIDO aqui.** Antes, a
// direção do motor preditivo morava num cartão à parte na home ("rota
// Δnota/min", passos, ganho marginal). Eram dois planos disputando a mesma
// tela: a missão dizia O QUE fazer e o GPS dizia o que fazer — com números
// diferentes, porque eram dois algoritmos. O aluno tinha que escolher em qual
// acreditar.
//
// Agora existe UM plano. A missão do dia continua sendo montada pelo
// mission-engine (fronteira curricular + revisão vencida + risco na prova), e
// este módulo só traduz os sinais que ELA já usou numa frase que o aluno
// entende. Nada aqui é um segundo cálculo: é a mesma decisão, dita em voz
// alta. Continua valendo a regra de honestidade do motor — isto explica uma
// recomendação, não promete nota.
import { QUESTLY_RETENCAO_LIMIAR } from "./shared";
import { QUESTLY_FORCA_RISCO, questlyForcaNaProva, questlyRetencaoEfetiva } from "./motor-aprovacao";

/** Por que este tópico está na missão de hoje. A ordem da união é a ordem de
 *  prioridade do motor: risco de prova > revisão vencida > conteúdo novo. */
export type MotivoTopico = "risco" | "revisao" | "novo" | "reforco";

export type TopicoDaMissao = {
  id: string;
  nome: string;
  motivo: MotivoTopico;
};

export type ProgressoTopico = {
  num_questoes_respondidas?: number | null;
  taxa_acerto?: number | null;
  ultima_revisao?: string | null;
  maestria?: number | null;
  estabilidade?: number | null;
};

export const ROTULO_MOTIVO: Record<MotivoTopico, string> = {
  risco: "Chega fraco na prova",
  revisao: "Revisão vencida",
  novo: "Conteúdo novo",
  reforco: "Reforço",
};

/** Classifica um tópico com os MESMOS limiares que o mission-engine usou pra
 *  escolhê-lo — nenhum número novo entra aqui. */
export function questlyMotivoTopico(
  progresso: ProgressoTopico | undefined,
  dataProvaMs: number | null,
  agoraMs: number = Date.now(),
): MotivoTopico {
  const respondidas = progresso?.num_questoes_respondidas || 0;
  if (!progresso || respondidas === 0) return "novo";

  if (dataProvaMs != null && questlyForcaNaProva(progresso, dataProvaMs, agoraMs) < QUESTLY_FORCA_RISCO) {
    return "risco";
  }

  const retencao = questlyRetencaoEfetiva(progresso, agoraMs);
  if (retencao != null && retencao < QUESTLY_RETENCAO_LIMIAR) return "revisao";

  return "reforco";
}

/** A frase única que explica a missão. Uma linha, sem jargão do motor, sempre
 *  ancorada no tópico principal — que é o primeiro da lista, porque o
 *  mission-engine já ordenou por prioridade. */
export function questlyPorqueDaMissao(
  topicos: TopicoDaMissao[],
  diasAteProva: number | null,
): string {
  const principal = topicos[0];
  if (!principal) return "Prática do dia na sua trilha.";

  const prazo =
    diasAteProva != null && diasAteProva >= 0
      ? diasAteProva === 0
        ? " — sua prova é hoje"
        : diasAteProva === 1
          ? " — sua prova é amanhã"
          : ` — faltam ${diasAteProva} dias pra prova`
      : "";

  const base = (() => {
    switch (principal.motivo) {
      case "risco":
        return `${principal.nome} é o assunto que chega mais fraco no dia da prova`;
      case "revisao":
        return `Está na hora de revisar ${principal.nome} antes de esquecer`;
      case "novo":
        return `${principal.nome} é o próximo assunto da sua ementa`;
      default:
        return `Hoje é dia de firmar ${principal.nome}`;
    }
  })();

  const segundo = topicos[1];
  const extra = segundo
    ? segundo.motivo === "revisao" || segundo.motivo === "risco"
      ? `. Entram algumas questões de ${segundo.nome} pra não enferrujar`
      : `. No fim, um pouco de ${segundo.nome}`
    : "";

  return `${base}${prazo}${extra}.`;
}

// ── Listas E simulados ──────────────────────────────────────────────
// A segunda metade do "distribuir de forma inteligente": praticar a lista do
// dia todo dia treina conteúdo, mas não responde "eu passo?". Perto da prova
// falta a outra medida — desempenho sob relógio, com a prova inteira de uma
// vez. Esta é a única regra: prova perto E nenhum simulado recente. As duas
// condições juntas, porque um aviso que aparece sempre vira paisagem.
export const QUESTLY_DIAS_PROVA_PERTO = 14;
export const QUESTLY_DIAS_SEM_SIMULADO = 7;

export type SugestaoSimulado = { subjectNome: string; diasAteProva: number };

export function questlySugerirSimulado(
  entrada: {
    subjectNome: string;
    diasAteProva: number;
    /** Uma prova com o relógio correndo já É o simulado do momento. */
    temSimuladoEmAndamento: boolean;
    /** created_at do último simulado concluído (null = nunca fez). */
    ultimoSimuladoISO: string | null;
  } | null,
  agoraMs: number = Date.now(),
): SugestaoSimulado | null {
  if (!entrada) return null;
  if (entrada.temSimuladoEmAndamento) return null;
  if (entrada.diasAteProva < 0 || entrada.diasAteProva > QUESTLY_DIAS_PROVA_PERTO) return null;

  const recente =
    entrada.ultimoSimuladoISO != null &&
    agoraMs - new Date(entrada.ultimoSimuladoISO).getTime() <= QUESTLY_DIAS_SEM_SIMULADO * 86_400_000;
  if (recente) return null;

  return { subjectNome: entrada.subjectNome, diasAteProva: entrada.diasAteProva };
}
