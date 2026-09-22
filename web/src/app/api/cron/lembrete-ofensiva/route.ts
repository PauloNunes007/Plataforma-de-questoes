import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { questlyHojeISO, toISODate, addDias } from "@/lib/questly/shared";
import {
  enviarPushParaAluno,
  pushConfigurado,
  type InscricaoPush,
} from "@/lib/push/enviar";

// CRON do lembrete de ofensiva — roda uma vez por dia, no fim da tarde.
//
// Agendamento: `vercel.json`. Mesma autenticação do relatório semanal (header
// `Authorization: Bearer $CRON_SECRET`, com `?secret=` aceito pra disparo
// manual num teste).
//
// ---------------------------------------------------------------------------
// AS REGRAS QUE IMPEDEM ISTO DE VIRAR SPAM
// ---------------------------------------------------------------------------
// Permissão de notificação negada no navegador NÃO se pede de novo. Cada push
// inútil é um passo na direção do bloqueio definitivo — então:
//
//  1. NO MÁXIMO UM POR DIA. Garantido pelo próprio agendamento (um cron
//     diário), não por um filtro em JS;
//  2. SILENCIADO PRA QUEM JÁ ESTUDOU HOJE. É `daily_logs` que responde isso, e
//     é exatamente por isso que este recurso só faz sentido DEPOIS do repasse
//     que fez a ofensiva acender com estudo real (2026-09-22): antes,
//     `daily_logs` só registrava quem FECHAVA lista, e o aluno que respondeu
//     25 questões e saiu receberia um "você não estudou hoje" — a mensagem
//     mais fácil de fazer alguém desinstalar um app;
//  3. SÓ PRA QUEM TEM O QUE PERDER. Ofensiva de 0 ou 1 dia não recebe nada:
//     "não perca sua sequência" só é argumento pra quem tem uma sequência, e
//     avisar quem não tem é pedir atenção em troca de nada;
//  4. FATO, NUNCA CHANTAGEM. O texto diz quantos dias estão em jogo. Sem
//     "sentimos sua falta", sem contagem regressiva falsa.
//
// O que ele NÃO faz: não anuncia recurso, não vende Pro, não avisa de
// promoção. O dia em que este cron mandar propaganda é o dia em que ele para
// de funcionar pra todo mundo.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Acima disto, a ofensiva vira o assunto do aviso. Abaixo, não há assunto. */
const STREAK_MINIMO = 2;

function autorizado(req: Request): boolean {
  const segredo = process.env.CRON_SECRET?.trim();
  if (!segredo) return false;

  const header = req.headers.get("authorization")?.trim();
  if (header === `Bearer ${segredo}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret")?.trim() === segredo;
}

function texto(streak: number): { titulo: string; corpo: string } {
  return {
    titulo: `Sua ofensiva de ${streak} dias acaba hoje`,
    corpo:
      streak >= 7
        ? "Algumas questões seguram a sequência — e hoje ainda dá tempo."
        : "Uma lista curta já mantém a sequência viva.",
  };
}

async function processar(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!pushConfigurado()) {
    // Sem chaves VAPID o recurso simplesmente não existe — e isso é um estado
    // legítimo, não um erro do dia.
    return NextResponse.json({ erro: "VAPID não configurado" }, { status: 503 });
  }

  const admin = createAdminClient();
  const hoje = questlyHojeISO();
  const ontem = toISODate(addDias(new Date(), -1));

  // Quem tem aparelho inscrito. A inscrição é o opt-in: quem não está aqui
  // não pediu lembrete nenhum.
  const { data: inscricoes, error } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");
  if (error) {
    console.error("Erro ao ler inscrições de push:", error);
    return NextResponse.json({ erro: "falha ao ler inscrições" }, { status: 500 });
  }
  if (!inscricoes || inscricoes.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "ninguém inscrito" });
  }

  const porAluno = new Map<string, InscricaoPush[]>();
  for (const i of inscricoes) {
    const lista = porAluno.get(i.user_id as string) || [];
    lista.push({
      id: i.id as string,
      endpoint: i.endpoint as string,
      p256dh: i.p256dh as string,
      auth: i.auth as string,
    });
    porAluno.set(i.user_id as string, lista);
  }
  const userIds = Array.from(porAluno.keys());

  // Quem JÁ estudou hoje sai da lista antes de qualquer envio — regra 2.
  // E quem estudou ONTEM é a condição de ter uma ofensiva viva pra proteger:
  // sem isso, o aviso iria pra quem já perdeu a sequência dias atrás, onde
  // ele não avisa nada, só cobra.
  const { data: logs } = await admin
    .from("daily_logs")
    .select("user_id, data, estudou")
    .in("user_id", userIds)
    .in("data", [hoje, ontem]);

  const estudouHoje = new Set<string>();
  const estudouOntem = new Set<string>();
  for (const l of logs || []) {
    const dia = String(l.data).slice(0, 10);
    if (!l.estudou) continue;
    if (dia === hoje) estudouHoje.add(l.user_id as string);
    if (dia === ontem) estudouOntem.add(l.user_id as string);
  }

  const candidatos = userIds.filter((id) => !estudouHoje.has(id) && estudouOntem.has(id));
  if (candidatos.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "todo mundo já estudou hoje" });
  }

  const { data: perfis } = await admin
    .from("profiles")
    .select("id, streak_atual")
    .in("id", candidatos);

  let enviados = 0;
  let pulados = 0;

  for (const perfil of perfis || []) {
    const streak = (perfil.streak_atual as number) || 0;
    if (streak < STREAK_MINIMO) {
      pulados += 1; // regra 3: não há sequência pra proteger
      continue;
    }
    const inscricoesDoAluno = porAluno.get(perfil.id as string) || [];
    if (inscricoesDoAluno.length === 0) continue;

    const { titulo, corpo } = texto(streak);
    const entregues = await enviarPushParaAluno(admin, inscricoesDoAluno, {
      titulo,
      corpo,
      url: "/dashboard",
      tag: "ofensiva",
    });
    if (entregues > 0) enviados += 1;
  }

  return NextResponse.json({ ok: true, enviados, pulados, candidatos: candidatos.length });
}

export async function GET(req: Request) {
  return processar(req);
}

export async function POST(req: Request) {
  return processar(req);
}
