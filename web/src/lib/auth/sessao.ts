import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// Quem é o aluno desta requisição — sem ida de rede.
//
// PERFORMANCE: `auth.getUser()` faz uma chamada HTTP ao endpoint /auth/v1/user
// do Supabase. Toda página protegida chamava isso DUAS vezes (uma no
// (protected)/layout.tsx, outra na page.tsx), então cada navegação pagava dois
// round-trips extras antes de qualquer dado do app começar a ser lido — e isso
// vale pra cada payload RSC de navegação interna e pra cada prefetch que o Next
// dispara no hover.
//
// `getClaims()` faz o mesmo trabalho de confiança sem sair da máquina: o
// projeto assina o JWT com chave assimétrica (ES256, JWKS publicado), então a
// assinatura é verificada localmente via WebCrypto — não é aceitar o cookie no
// escuro. É exatamente o que lib/supabase/middleware.ts já usa pro guard de
// rota desde 2026-09-10; isto só estende o mesmo padrão pras páginas.
//
// O `cache()` do React fecha o resto: dentro de UM render, layout e page
// compartilham a mesma resolução em vez de repeti-la.
//
// ESCOPO DELIBERADO: só LEITURA de página. As Server Actions (escrita) seguem
// em `auth.getUser()` — lá a ida de rede é barata perto do write e pega na hora
// uma sessão revogada.

export type UsuarioSessao = { id: string; email: string | null };

async function resolver(supabase: SupabaseClient): Promise<UsuarioSessao | null> {
  try {
    const { data } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
    // Exige o email junto do sub: o gate de admin (`user.email === ADMIN_EMAIL`)
    // depende dele, e um claim sem email trancaria o dono fora do /admin em
    // silêncio. Sem email, cai no getUser() e paga o round-trip — correto vale
    // mais que rápido neste ponto.
    if (sub && email) return { id: sub, email };
  } catch {
    // Chave simétrica (HS256), JWKS fora do ar, versão da lib sem getClaims —
    // qualquer um desses cai no caminho de sempre em vez de deslogar o aluno.
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export const usuarioDaSessao = cache(resolver);
