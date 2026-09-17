// Vida acadêmica — MATEMÁTICA PURA (sem Supabase, sem React).
//
// Duas contas que o aluno hoje faz de cabeça, errado, e tarde demais:
//
//   1. frequência — "quantas faltas ainda cabem?";
//   2. média      — "quanto preciso na próxima pra passar?".
//
// Tudo aqui é função pura e determinística: a tela, o e-mail do relatório
// semanal e (um dia) qualquer outro consumidor precisam chegar EXATAMENTE ao
// mesmo veredito sobre o semestre do aluno. Dois lugares calculando "você está
// reprovado por falta" com regras diferentes seria pior do que não calcular.
//
// Regra de honestidade herdada de chance-aprovacao.ts: quando não há dado
// suficiente, isto devolve `null`/"sem_dados" em vez de um número inventado. O
// aluno vai TOMAR DECISÃO com isso ("posso matar a aula de sexta?"), e um
// palpite com cara de cálculo é a pior coisa que a tela pode oferecer.

/* ------------------------------------------------------------ frequência */

// Fração mínima de presença exigida por lei no ensino superior brasileiro
// (LDB 9.394/96, art. 47 §3º: 75%). Logo, o teto de faltas é 25% da carga.
export const FRACAO_PRESENCA_MINIMA = 0.75;

/**
 * Sugere o teto de faltas a partir da carga horária.
 *
 * `cargaHoraria` é o total em HORAS-AULA do semestre (o número que está no
 * plano de ensino) e `aulasPorSemana` é quantos ENCONTROS por semana — dividir
 * um pelo outro dá a duração média do encontro em horas-aula, que é a unidade
 * em que a chamada é feita.
 *
 * Exemplo real: Cálculo II, 60h, 2 encontros/semana num semestre de 15
 * semanas = 30 encontros de 2 horas-aula. 25% de 60h = 15 horas-aula = 7
 * encontros (piso, nunca teto — arredondar pra cima devolveria ao aluno uma
 * falta que ele não tem).
 */
export function sugerirFaltasMax(
  cargaHoraria: number | null,
  aulasPorSemana: number | null,
): number | null {
  if (!cargaHoraria || cargaHoraria <= 0) return null;
  const horasQuePodeFaltar = cargaHoraria * (1 - FRACAO_PRESENCA_MINIMA);
  // Sem saber quantos encontros por semana, a unidade é a própria hora-aula.
  if (!aulasPorSemana || aulasPorSemana <= 0) return Math.floor(horasQuePodeFaltar);

  // ~15 semanas letivas é o padrão do semestre brasileiro. É uma ESTIMATIVA, e
  // por isso o número resultante é sempre editável pelo aluno na tela.
  const SEMANAS_LETIVAS = 15;
  const encontros = aulasPorSemana * SEMANAS_LETIVAS;
  const horasPorEncontro = cargaHoraria / encontros;
  if (horasPorEncontro <= 0) return null;
  return Math.floor(horasQuePodeFaltar / horasPorEncontro);
}

export type NivelFrequencia = "sem_dados" | "seguro" | "atencao" | "limite" | "reprovado";

export type StatusFrequencia = {
  /** Faltas que CONTAM (justificadas ficam de fora). */
  usadas: number;
  justificadas: number;
  max: number | null;
  /** Quantas ainda cabem. null quando o teto não foi configurado. */
  restantes: number | null;
  /** 0..1 do teto consumido. null sem teto configurado. */
  fracao: number | null;
  nivel: NivelFrequencia;
};

// Onde a barra muda de cor. "limite" é a ÚLTIMA falta disponível — o aviso
// precisa chegar antes da falta fatal, não junto com ela.
const LIMIAR_ATENCAO = 0.6;

export function statusFrequencia(input: {
  faltas: { quantidade: number; justificada: boolean }[];
  max: number | null;
}): StatusFrequencia {
  let usadas = 0;
  let justificadas = 0;
  for (const f of input.faltas) {
    const q = Math.max(0, f.quantidade || 0);
    if (f.justificada) justificadas += q;
    else usadas += q;
  }

  const max = input.max != null && input.max >= 0 ? input.max : null;
  if (max === null) {
    return { usadas, justificadas, max: null, restantes: null, fracao: null, nivel: "sem_dados" };
  }

  const restantes = max - usadas;
  // max = 0 é configuração válida ("não posso faltar nenhuma"): qualquer falta
  // reprova, e nenhuma falta é 0% consumido — não 0/0.
  const fracao = max === 0 ? (usadas > 0 ? 1 : 0) : Math.min(1, usadas / max);

  const nivel: NivelFrequencia =
    restantes < 0 ? "reprovado" : restantes === 0 ? "limite" : fracao >= LIMIAR_ATENCAO ? "atencao" : "seguro";

  return { usadas, justificadas, max, restantes, fracao, nivel };
}

/* ----------------------------------------------------------------- notas */

export type AvaliacaoCalc = {
  peso: number;
  /** null = ainda não saiu (é ela que a projeção precisa). */
  nota: number | null;
  notaMaxima: number;
};

export type SituacaoNota =
  | "sem_dados" // nenhuma avaliação cadastrada
  | "sem_notas" // cadastradas, mas nenhuma nota lançada
  | "aprovado" // já passou, mesmo zerando o resto
  | "no_caminho" // dá pra passar com nota possível
  | "dificil" // precisa de quase o máximo no que falta
  | "impossivel" // nem tirando o máximo no que falta a média chega lá
  | "reprovado"; // acabaram as avaliações e a média não bateu

export type ResumoNotas = {
  /** Média ponderada do que JÁ saiu, na escala 0..10. null se nada saiu. */
  mediaAtual: number | null;
  /**
   * Média ponderada considerando o que falta como ZERO — o piso garantido.
   * É o número que responde "se eu parar agora, passo?".
   */
  mediaGarantida: number | null;
  /** Soma dos pesos já lançados / soma total. */
  fracaoConcluida: number;
  /** Nota (0..10) necessária, em média, no que falta. null quando não se aplica. */
  precisaTirar: number | null;
  situacao: SituacaoNota;
  pesoTotal: number;
  pesoPendente: number;
};

/** Traz qualquer escala (0..5, 0..100) pra 0..10, que é a escala da UI. */
function normalizar(nota: number, maxima: number): number {
  if (!maxima || maxima <= 0) return 0;
  return (nota / maxima) * 10;
}

const EPS = 1e-9;
// A partir daqui a conta ainda fecha, mas só com quase tudo: a tela avisa em
// vez de dizer um "dá pra passar" que soa tranquilo.
const LIMIAR_DIFICIL = 9;

/**
 * Média atual, piso garantido e a nota necessária no que falta.
 *
 * A conta da nota necessária é a inversão direta da média ponderada:
 *
 *     (pontosJaFeitos + x · pesoPendente) / pesoTotal = mediaAprovacao
 *     x = (mediaAprovacao · pesoTotal − pontosJaFeitos) / pesoPendente
 *
 * `x` pode sair negativo (já passou, tanto faz o resto) ou acima de 10 (não
 * fecha nem com nota máxima). Os dois casos são informação valiosa — não
 * devolvemos um `clamp` que esconde qual dos dois é.
 */
export function resumoNotas(
  avaliacoes: AvaliacaoCalc[],
  mediaAprovacaoBruta: number,
): ResumoNotas {
  const validas = avaliacoes.filter((a) => a.peso > 0);
  const pesoTotal = validas.reduce((s, a) => s + a.peso, 0);
  const mediaAprovacao = Number.isFinite(mediaAprovacaoBruta) ? mediaAprovacaoBruta : 6;

  if (validas.length === 0 || pesoTotal <= 0) {
    return {
      mediaAtual: null,
      mediaGarantida: null,
      fracaoConcluida: 0,
      precisaTirar: null,
      situacao: "sem_dados",
      pesoTotal: 0,
      pesoPendente: 0,
    };
  }

  const lancadas = validas.filter((a) => a.nota != null);
  const pesoLancado = lancadas.reduce((s, a) => s + a.peso, 0);
  const pesoPendente = pesoTotal - pesoLancado;
  const pontosFeitos = lancadas.reduce((s, a) => s + normalizar(a.nota as number, a.notaMaxima) * a.peso, 0);

  const fracaoConcluida = pesoLancado / pesoTotal;
  const mediaAtual = pesoLancado > 0 ? pontosFeitos / pesoLancado : null;
  const mediaGarantida = pontosFeitos / pesoTotal;

  // Já bateu a média com o que está no papel: o resto é irrelevante pra
  // aprovação, e dizer "precisa tirar 0" seria um conselho ruim disfarçado.
  if (mediaGarantida >= mediaAprovacao - EPS) {
    return {
      mediaAtual,
      mediaGarantida,
      fracaoConcluida,
      precisaTirar: 0,
      situacao: "aprovado",
      pesoTotal,
      pesoPendente,
    };
  }

  if (pesoPendente <= EPS) {
    // Acabaram as avaliações e a média não fechou.
    return {
      mediaAtual,
      mediaGarantida,
      fracaoConcluida,
      precisaTirar: null,
      situacao: "reprovado",
      pesoTotal,
      pesoPendente: 0,
    };
  }

  const precisaTirar = (mediaAprovacao * pesoTotal - pontosFeitos) / pesoPendente;

  const situacao: SituacaoNota =
    pesoLancado === 0
      ? "sem_notas"
      : precisaTirar > 10 + EPS
        ? "impossivel"
        : precisaTirar >= LIMIAR_DIFICIL
          ? "dificil"
          : "no_caminho";

  return {
    mediaAtual,
    mediaGarantida,
    fracaoConcluida,
    precisaTirar,
    situacao,
    pesoTotal,
    pesoPendente,
  };
}

/* ------------------------------------------------------------- rótulos */

export const ROTULO_FREQUENCIA: Record<NivelFrequencia, string> = {
  sem_dados: "Defina o limite de faltas",
  seguro: "Frequência tranquila",
  atencao: "Atenção às faltas",
  limite: "Última falta disponível",
  reprovado: "Limite de faltas estourado",
};

export const ROTULO_SITUACAO: Record<SituacaoNota, string> = {
  sem_dados: "Cadastre suas avaliações",
  sem_notas: "Nenhuma nota lançada ainda",
  aprovado: "Aprovado — média garantida",
  no_caminho: "Dá pra passar",
  dificil: "Vai precisar de quase tudo",
  impossivel: "A média não fecha mais",
  reprovado: "Média abaixo da aprovação",
};

/** Cor semântica (tokens do design system) por nível — usada na UI e no e-mail. */
export function tomFrequencia(nivel: NivelFrequencia): "verde" | "amarelo" | "vermelho" | "neutro" {
  if (nivel === "reprovado") return "vermelho";
  if (nivel === "limite") return "vermelho";
  if (nivel === "atencao") return "amarelo";
  if (nivel === "seguro") return "verde";
  return "neutro";
}

export function tomSituacao(situacao: SituacaoNota): "verde" | "amarelo" | "vermelho" | "neutro" {
  if (situacao === "aprovado" || situacao === "no_caminho") return "verde";
  if (situacao === "dificil") return "amarelo";
  if (situacao === "impossivel" || situacao === "reprovado") return "vermelho";
  return "neutro";
}

/* ------------------------------------------------- projeção da próxima */

// "Quanto preciso tirar no que falta" é a média necessária no CONJUNTO das
// avaliações pendentes — e é o número certo pra decidir se o semestre fecha.
// Mas não é a pergunta de quem está estudando hoje: essa é "quanto preciso na
// P2?", com nome, peso e escala próprios.
//
// Duas leituras honestas, e a tela mostra as duas porque uma sozinha engana:
//
//   `precisa`  — a nota NESSA avaliação supondo que as outras pendentes saiam
//                na mesma nota. É a média necessária, só reescalada pra escala
//                da avaliação (uma P2 que vale 100 pede "84", não "8,4").
//   `seTirarMaximo` — a média que ainda seria exigida no resto se ele gabaritar
//                esta. É o piso do que vem depois: mesmo com 10 na P2, se isto
//                der 9,5, o semestre já está apertado e ele precisa saber ANTES
//                de fazer a P2, não depois.

export type ProjecaoProxima = {
  nome: string;
  peso: number;
  notaMaxima: number;
  /** Fatia do total que esta avaliação representa (0..1). */
  fracaoDoTotal: number;
  /** Nota necessária nela, NA ESCALA DELA. Pode passar de `notaMaxima`. */
  precisa: number | null;
  /** Quantas avaliações pendentes ficam depois desta. */
  pendentesDepois: number;
  /** Média (0..10) ainda necessária no resto se ele gabaritar esta. null se não há resto. */
  seTirarMaximo: number | null;
};

/**
 * A próxima avaliação sem nota e o que ela exige.
 *
 * Devolve `null` quando não há o que projetar: sem avaliações, sem pendentes,
 * ou quando a aprovação já está garantida/perdida — nesses casos o cartão já
 * mostra o fato, e uma nota-alvo ali seria ruído.
 */
export function projecaoProxima(
  avaliacoes: (AvaliacaoCalc & { nome: string })[],
  mediaAprovacaoBruta: number,
): ProjecaoProxima | null {
  const validas = avaliacoes.filter((a) => a.peso > 0);
  const proxima = validas.find((a) => a.nota == null);
  if (!proxima) return null;

  const mediaAprovacao = Number.isFinite(mediaAprovacaoBruta) ? mediaAprovacaoBruta : 6;
  const pesoTotal = validas.reduce((s, a) => s + a.peso, 0);
  if (pesoTotal <= 0) return null;

  const lancadas = validas.filter((a) => a.nota != null);
  const pontosFeitos = lancadas.reduce((s, a) => s + normalizar(a.nota as number, a.notaMaxima) * a.peso, 0);
  const pesoPendente = pesoTotal - lancadas.reduce((s, a) => s + a.peso, 0);
  if (pesoPendente <= EPS) return null;

  // Média uniforme necessária no que falta, reescalada pra escala da próxima.
  const uniforme = (mediaAprovacao * pesoTotal - pontosFeitos) / pesoPendente;
  const precisa = (uniforme / 10) * (proxima.notaMaxima || 10);

  const pesoDepois = pesoPendente - proxima.peso;
  const seTirarMaximo =
    pesoDepois > EPS ? (mediaAprovacao * pesoTotal - pontosFeitos - 10 * proxima.peso) / pesoDepois : null;

  return {
    nome: proxima.nome,
    peso: proxima.peso,
    notaMaxima: proxima.notaMaxima || 10,
    fracaoDoTotal: proxima.peso / pesoTotal,
    precisa,
    pendentesDepois: validas.filter((a) => a.nota == null).length - 1,
    seTirarMaximo: seTirarMaximo != null ? Math.max(0, seTirarMaximo) : null,
  };
}
