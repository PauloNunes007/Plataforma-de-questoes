import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente com a chave SERVICE_ROLE. Bypassa RLS e o trigger de proteção do
// profile (supabase_seguranca_hardening.sql), então:
//
//   ⚠️  SÓ pode ser importado em código de SERVIDOR (Server Actions com
//       "use server" ou Route Handlers). NUNCA em componente "use client" —
//       a chave nunca pode chegar ao browser.
//
// Todo uso precisa validar a autorização ANTES de escrever (ex.: confirmar
// que o user da sessão é dono do recurso, ou que é o admin). O cliente por si
// só não faz nenhuma checagem.
//
// É por aqui que passam as escritas privilegiadas: economia de gamificação
// (XP/liga/streak em profiles), ativação de Pro, e a recalibração de
// tempo_medio_seg em questions — todas colunas/tabelas que o trigger/RLS
// bloqueiam pro contexto do próprio usuário.

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL) ausente — " +
        "necessária pras escritas privilegiadas (XP/liga/Pro). Configure no .env.local e no Vercel.",
    );
  }

  cached = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
