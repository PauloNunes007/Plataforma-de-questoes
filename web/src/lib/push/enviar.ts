import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

// Envio de Web Push — a única saída do app que alcança um aluno que NÃO
// abriu o site.
//
// Até 2026-09-22 não existia canal nenhum: o único cron era o relatório
// semanal, e só pra Pro. Ou seja, a retenção D1 dependia inteiramente de o
// aluno lembrar sozinho — o que é justamente o problema que o hábito resolve.
//
// DEGRADA EM SILÊNCIO SEM AS CHAVES. Sem VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY
// configuradas, `pushConfigurado()` devolve false e todo o resto vira no-op.
// Nenhuma tela quebra e nenhum botão some sem explicação — mesmo tratamento
// que o app já dá ao remetente de e-mail não configurado.

export type PayloadPush = {
  titulo: string;
  corpo: string;
  /** Pra onde o toque leva. Sempre um caminho interno. */
  url?: string;
  /** Notificações com a mesma tag se SUBSTITUEM na bandeja em vez de
   *  empilhar — ver public/sw.js. */
  tag?: string;
};

export type InscricaoPush = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** A chave pública, que o browser precisa pra se inscrever. Pública mesmo:
 *  ela vai no bundle do cliente por definição do protocolo. */
export function chavePublicaPush(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
}

export function pushConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim(),
  );
}

let configurado = false;
function garantirVapid(): boolean {
  if (!pushConfigurado()) return false;
  if (configurado) return true;
  webpush.setVapidDetails(
    // `mailto:` é exigido pelo protocolo: é o contato que o serviço de push
    // usa se algo der errado com o nosso envio.
    "mailto:contato@expectrum.com.br",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
  configurado = true;
  return true;
}

/**
 * Envia pra UMA inscrição. Devolve `morta: true` quando o serviço de push diz
 * que aquele endpoint não existe mais.
 *
 * 404/410 são o jeito do navegador dizer "este aparelho não está mais
 * inscrito" (app desinstalado, permissão revogada, perfil apagado). A linha
 * precisa sumir do banco, senão a tabela vira um cemitério que o cron
 * percorre todo dia — e, pior, o número de "alunos com lembrete" mente.
 */
export async function enviarPush(
  inscricao: InscricaoPush,
  payload: PayloadPush,
): Promise<{ ok: boolean; morta: boolean }> {
  if (!garantirVapid()) return { ok: false, morta: false };

  try {
    await webpush.sendNotification(
      {
        endpoint: inscricao.endpoint,
        keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 6 },
    );
    return { ok: true, morta: false };
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) return { ok: false, morta: true };
    console.error("Erro ao enviar push:", e);
    return { ok: false, morta: false };
  }
}

/**
 * Envia pra todos os aparelhos de um aluno e limpa os endpoints mortos.
 *
 * `supabase` tem que ser o cliente admin: o cron não tem sessão de usuário e
 * a RLS de `push_subscriptions` é dono-only.
 */
export async function enviarPushParaAluno(
  supabase: SupabaseClient,
  inscricoes: InscricaoPush[],
  payload: PayloadPush,
): Promise<number> {
  let entregues = 0;
  const mortas: string[] = [];

  for (const inscricao of inscricoes) {
    const { ok, morta } = await enviarPush(inscricao, payload);
    if (ok) entregues += 1;
    if (morta) mortas.push(inscricao.id);
  }

  if (mortas.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", mortas);
  }
  if (entregues > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ ultimo_envio_em: new Date().toISOString() })
      .in(
        "id",
        inscricoes.filter((i) => !mortas.includes(i.id)).map((i) => i.id),
      );
  }

  return entregues;
}
