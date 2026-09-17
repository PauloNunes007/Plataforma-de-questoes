// Leitura da vida acadêmica do aluno — o que a tela /materias e o relatório
// semanal precisam saber sobre faltas e notas de cada disciplina.
//
// O cálculo em si NÃO mora aqui: é tudo `lib/academico/academico.ts` (puro).
// Este arquivo só busca linhas e junta. A separação existe pelo mesmo motivo
// de chance-aprovacao.ts — o veredito "você está reprovado por falta" precisa
// ser testável e idêntico em qualquer consumidor, inclusive num e-mail que
// roda num cron sem browser nenhum.
//
// Uma consulta por tabela (subjects, faltas, avaliacoes), agrupada em memória:
// são três leituras pequenas e escopadas por `user_id` — um join no PostgREST
// aqui devolveria a mesma coisa em mais round-trips e com mais forma pra
// errar. O volume é de um semestre de um aluno, não de um banco de questões.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  projecaoProxima,
  resumoNotas,
  statusFrequencia,
  type AvaliacaoCalc,
  type ProjecaoProxima,
  type ResumoNotas,
  type StatusFrequencia,
} from "./academico";

export type FaltaRow = {
  id: string;
  data: string;
  quantidade: number;
  justificada: boolean;
  motivo: string | null;
};

export type AvaliacaoRow = {
  id: string;
  nome: string;
  peso: number;
  nota: number | null;
  notaMaxima: number;
  data: string | null;
  ordem: number;
};

export type MateriaAcademica = {
  subjectId: string;
  nome: string;
  /** Parâmetros do semestre (ver supabase_vida_academica.sql). */
  faltasMax: number | null;
  cargaHoraria: number | null;
  aulasPorSemana: number | null;
  mediaAprovacao: number;
  faltas: FaltaRow[];
  avaliacoes: AvaliacaoRow[];
  frequencia: StatusFrequencia;
  notas: ResumoNotas;
  /** A próxima avaliação sem nota e o que ela exige. null quando não há o que projetar. */
  proxima: ProjecaoProxima | null;
};

type SubjectRow = {
  id: string;
  nome: string;
  faltas_max: number | null;
  carga_horaria: number | null;
  aulas_por_semana: number | null;
  media_aprovacao: number | string | null;
};

/** `numeric` do Postgres chega como string no supabase-js. */
function num(v: number | string | null | undefined, padrao: number): number {
  if (v === null || v === undefined) return padrao;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : padrao;
}

function numOuNulo(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function carregarVidaAcademica(
  supabase: SupabaseClient,
  userId: string,
): Promise<MateriaAcademica[]> {
  const [{ data: subjects }, { data: faltas }, { data: avaliacoes }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, nome, faltas_max, carga_horaria, aulas_por_semana, media_aprovacao")
      .eq("user_id", userId)
      .order("nome"),
    supabase
      .from("faltas")
      .select("id, subject_id, data, quantidade, justificada, motivo")
      .eq("user_id", userId)
      .order("data", { ascending: false }),
    supabase
      .from("avaliacoes")
      .select("id, subject_id, nome, peso, nota, nota_maxima, data, ordem")
      .eq("user_id", userId)
      .order("ordem")
      .order("criado_em"),
  ]);

  const faltasPor = new Map<string, FaltaRow[]>();
  for (const f of faltas || []) {
    const lista = faltasPor.get(f.subject_id) ?? [];
    lista.push({
      id: f.id,
      data: String(f.data).slice(0, 10),
      quantidade: num(f.quantidade, 1),
      justificada: !!f.justificada,
      motivo: f.motivo ?? null,
    });
    faltasPor.set(f.subject_id, lista);
  }

  const avaliacoesPor = new Map<string, AvaliacaoRow[]>();
  for (const a of avaliacoes || []) {
    const lista = avaliacoesPor.get(a.subject_id) ?? [];
    lista.push({
      id: a.id,
      nome: a.nome,
      peso: num(a.peso, 1),
      nota: numOuNulo(a.nota),
      notaMaxima: num(a.nota_maxima, 10),
      data: a.data ? String(a.data).slice(0, 10) : null,
      ordem: num(a.ordem, 0),
    });
    avaliacoesPor.set(a.subject_id, lista);
  }

  return ((subjects as SubjectRow[]) || []).map((s) => {
    const minhasFaltas = faltasPor.get(s.id) ?? [];
    const minhasAvaliacoes = avaliacoesPor.get(s.id) ?? [];
    const mediaAprovacao = num(s.media_aprovacao, 6);
    const paraCalculo: (AvaliacaoCalc & { nome: string })[] = minhasAvaliacoes.map((a) => ({
      nome: a.nome,
      peso: a.peso,
      nota: a.nota,
      notaMaxima: a.notaMaxima,
    }));
    const notas = resumoNotas(paraCalculo, mediaAprovacao);

    return {
      subjectId: s.id,
      nome: s.nome,
      faltasMax: s.faltas_max ?? null,
      cargaHoraria: s.carga_horaria ?? null,
      aulasPorSemana: s.aulas_por_semana ?? null,
      mediaAprovacao,
      faltas: minhasFaltas,
      avaliacoes: minhasAvaliacoes,
      frequencia: statusFrequencia({ faltas: minhasFaltas, max: s.faltas_max ?? null }),
      notas,
      // Só projeta a próxima quando ainda há corrida: aprovado/impossível/
      // reprovado já têm o veredito, e uma nota-alvo ali confundiria.
      proxima:
        notas.situacao === "no_caminho" || notas.situacao === "dificil" || notas.situacao === "sem_notas"
          ? projecaoProxima(paraCalculo, mediaAprovacao)
          : null,
    };
  });
}

/**
 * Só o que o relatório semanal precisa citar: disciplinas em risco.
 *
 * Um relatório que lista as 8 disciplinas do aluno não é lido. O que faz o
 * e-mail valer a abertura é ele apontar as 2 que estão pegando fogo — e nada,
 * quando nada está.
 */
export type AlertaAcademico = {
  disciplina: string;
  tipo: "falta" | "nota";
  texto: string;
};

export function alertasDaVidaAcademica(materias: MateriaAcademica[]): AlertaAcademico[] {
  const alertas: AlertaAcademico[] = [];

  for (const m of materias) {
    const f = m.frequencia;
    if (f.nivel === "reprovado") {
      alertas.push({
        disciplina: m.nome,
        tipo: "falta",
        texto: `Você passou do limite de faltas (${f.usadas} de ${f.max}). Procure a coordenação — em muitos casos ainda dá pra justificar.`,
      });
    } else if (f.nivel === "limite") {
      alertas.push({
        disciplina: m.nome,
        tipo: "falta",
        texto: `Você está na última falta permitida (${f.usadas} de ${f.max}). A próxima reprova por frequência.`,
      });
    } else if (f.nivel === "atencao" && f.restantes != null) {
      alertas.push({
        disciplina: m.nome,
        tipo: "falta",
        texto: `Restam ${f.restantes} ${f.restantes === 1 ? "falta" : "faltas"} de ${f.max}.`,
      });
    }

    const n = m.notas;
    if (n.situacao === "impossivel") {
      alertas.push({
        disciplina: m.nome,
        tipo: "nota",
        texto: `Pela média atual (${(n.mediaAtual ?? 0).toFixed(1)}), a aprovação direta não fecha mais — o caminho é a prova final.`,
      });
    } else if (n.situacao === "dificil" && n.precisaTirar != null) {
      alertas.push({
        disciplina: m.nome,
        tipo: "nota",
        texto: `Precisa de ${n.precisaTirar.toFixed(1)} no que falta pra passar. Está apertado.`,
      });
    }
  }

  return alertas;
}

/* --------------------------------------------------- resumo pra home */

export type ResumoRiscoAcademico = {
  materias: number;
  /** Quantas já têm teto de faltas configurado (sem isso não há o que avisar). */
  comLimite: number;
  /** A MENOR margem de faltas entre as disciplinas — o número que aperta. */
  faltasRestantesMin: number | null;
  alertas: AlertaAcademico[];
};

/**
 * A versão de UMA LINHA da vida acadêmica, pro cartão da home.
 *
 * Reaproveita `carregarVidaAcademica` em vez de fazer uma consulta enxuta
 * própria: são três leituras pequenas por `user_id`, e ter duas versões da
 * mesma conta (uma pra tela cheia, outra "rápida" pra home) é exatamente como
 * as duas passariam a discordar sobre quem está em risco.
 */
export async function carregarResumoRiscoAcademico(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResumoRiscoAcademico> {
  const materias = await carregarVidaAcademica(supabase, userId);
  const restantes = materias
    .map((m) => m.frequencia.restantes)
    .filter((r): r is number => r != null && r >= 0);

  return {
    materias: materias.length,
    comLimite: materias.filter((m) => m.frequencia.max != null).length,
    faltasRestantesMin: restantes.length ? Math.min(...restantes) : null,
    alertas: alertasDaVidaAcademica(materias),
  };
}
