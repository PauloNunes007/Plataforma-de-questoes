// Os números do RELATÓRIO SEMANAL de um aluno (recurso do Pro).
//
// Roda no cron (app/api/cron/relatorio-semanal), sempre via service_role — não
// há sessão de ninguém ali dentro, então TODA consulta aqui filtra por
// `user_id` explicitamente. A RLS não está protegendo nada neste caminho; o
// filtro é a proteção.
//
// O relatório fala da SEMANA FECHADA (segunda a domingo anterior), não dos
// "últimos 7 dias": a semana da liga já é a unidade de tempo do produto, e um
// e-mail de segunda que fala de terça a segunda confundiria o aluno que acabou
// de ver o ranking zerar.
//
// Regra editorial que o formato impõe: se a semana foi VAZIA (zero questões e
// nenhum alerta acadêmico), NÃO existe relatório. Mandar "você fez 0 questões"
// toda segunda é a receita mais curta pra virar spam — e quem sumiu por uma
// semana não volta por causa de um e-mail que o repreende.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  alertasDaVidaAcademica,
  carregarVidaAcademica,
  type AlertaAcademico,
} from "@/lib/academico/academico-data";

export type TopicoFraco = {
  nome: string;
  erros: number;
  total: number;
};

export type RelatorioSemanal = {
  userId: string;
  /** Segunda-feira (YYYY-MM-DD) da semana que o relatório resume. */
  semana: string;
  periodoLabel: string;
  questoes: number;
  acertos: number;
  precisao: number | null;
  diasEstudados: number;
  xpSemana: number;
  /** Comparação com a semana anterior. null = não havia semana anterior. */
  variacaoQuestoes: number | null;
  topicosFracos: TopicoFraco[];
  alertas: AlertaAcademico[];
  /** false = semana sem nada a dizer; o cron pula sem enviar. */
  valeEnviar: boolean;
};

function segundaAnterior(hoje: Date): Date {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dow = d.getDay();
  // Volta pra segunda desta semana...
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  // ...e recua 7 dias: a semana FECHADA é a anterior à corrente.
  d.setDate(d.getDate() - 7);
  return d;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rotuloDia(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Quantos tópicos fracos o e-mail cita. Três é o que cabe numa leitura de
 *  15 segundos — uma lista de dez não é lida, e não é acionável. */
const MAX_TOPICOS_FRACOS = 3;
/** Abaixo disso a amostra é pequena demais pra chamar de "ponto fraco". */
const MIN_TENTATIVAS_TOPICO = 3;

export async function montarRelatorioSemanal(
  admin: SupabaseClient,
  userId: string,
  agora = new Date(),
): Promise<RelatorioSemanal> {
  const inicio = segundaAnterior(agora);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 7); // domingo 23:59 = segunda 00:00 exclusivo

  const anteriorInicio = new Date(inicio);
  anteriorInicio.setDate(anteriorInicio.getDate() - 7);

  const [{ data: tentativas }, { count: qtdAnterior }, { data: perfil }, materias] =
    await Promise.all([
      admin
        .from("question_attempts")
        .select("question_id, correta, created_at, questions(topic_id, topicos(nome))")
        .eq("user_id", userId)
        .gte("created_at", inicio.toISOString())
        .lt("created_at", fim.toISOString()),
      // Semana anterior: só a CONTAGEM, pra dizer "mais/menos que na semana
      // passada". `head: true` não traz linha nenhuma — é o barato que permite
      // esta comparação rodar pra toda a base num cron só.
      admin
        .from("question_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", anteriorInicio.toISOString())
        .lt("created_at", inicio.toISOString()),
      admin.from("profiles").select("nome, xp_semana").eq("id", userId).maybeSingle(),
      carregarVidaAcademica(admin, userId),
    ]);

  const linhas = tentativas || [];
  const questoes = linhas.length;
  const acertos = linhas.filter((t) => t.correta).length;

  const dias = new Set(linhas.map((t) => String(t.created_at).slice(0, 10)));

  // Tópicos em que ele mais errou — o único trecho "acionável" do e-mail.
  const porTopico = new Map<string, { erros: number; total: number }>();
  for (const t of linhas) {
    const q = t.questions as { topicos?: { nome?: string } | { nome?: string }[] } | null;
    const topico = Array.isArray(q?.topicos) ? q?.topicos[0] : q?.topicos;
    const nome = topico?.nome;
    if (!nome) continue;
    const atual = porTopico.get(nome) ?? { erros: 0, total: 0 };
    atual.total += 1;
    if (!t.correta) atual.erros += 1;
    porTopico.set(nome, atual);
  }

  const topicosFracos = Array.from(porTopico.entries())
    .filter(([, v]) => v.total >= MIN_TENTATIVAS_TOPICO && v.erros > 0)
    // Ordena pela TAXA de erro, não pelo número absoluto: 4 erros em 5 é um
    // problema; 4 erros em 40 é ruído de volume.
    .sort((a, b) => b[1].erros / b[1].total - a[1].erros / a[1].total)
    .slice(0, MAX_TOPICOS_FRACOS)
    .map(([nome, v]) => ({ nome, erros: v.erros, total: v.total }));

  const alertas = alertasDaVidaAcademica(materias);

  const fimVisivel = new Date(fim);
  fimVisivel.setDate(fimVisivel.getDate() - 1);

  return {
    userId,
    semana: iso(inicio),
    periodoLabel: `${rotuloDia(inicio)} a ${rotuloDia(fimVisivel)}`,
    questoes,
    acertos,
    precisao: questoes > 0 ? acertos / questoes : null,
    diasEstudados: dias.size,
    xpSemana: perfil?.xp_semana ?? 0,
    variacaoQuestoes: qtdAnterior != null && qtdAnterior > 0 ? questoes - qtdAnterior : null,
    topicosFracos,
    alertas,
    // Semana morta E nada apertando na vida acadêmica = nada a dizer.
    valeEnviar: questoes > 0 || alertas.length > 0,
  };
}

export async function nomeDoAluno(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await admin.from("profiles").select("nome").eq("id", userId).maybeSingle();
  return data?.nome ?? null;
}
