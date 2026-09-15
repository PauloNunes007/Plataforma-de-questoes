"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import {
  baseDoApp,
  enviarLoteCampanha,
  enviarTesteCampanha,
  limparFalhasCampanha,
  previaCampanha,
  resumoCampanha,
  LOTE_MAX,
  type ResultadoLote,
  type ResumoCampanha,
} from "@/lib/email/campanha";
import type { ConteudoCampanha, Destaque } from "@/lib/email/templates-campanha";

// Server Actions do disparo em massa. Arquivo separado de lib/admin/actions.ts
// (que já passa de 480 linhas) e com o próprio requireAdmin: um módulo
// "use server" só pode exportar função async, então não dá pra importar o
// helper de lá — ele devolveria um SupabaseClient, que não é serializável.
//
// A checagem se repete em TODA ação porque Server Action é endpoint chamável
// direto: o redirect da página protege a tela, não a função. E aqui o que está
// do outro lado é "mandar e-mail pra base inteira" — o pior botão do app pra
// deixar destrancado.

async function requireAdmin(): Promise<{ email: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return { error: "Acesso restrito." };
  return { email: user.email };
}

async function idDoAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Normaliza o que veio do formulário. Não é sanitização de segurança (o
 * template escapa tudo, e quem chama já é o admin) — é higiene: campo com
 * espaço sobrando vira assunto feio, e destaque vazio vira bullet solto no
 * meio do e-mail.
 */
function normalizar(bruto: ConteudoCampanha): ConteudoCampanha {
  const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const destaques: Destaque[] = (Array.isArray(bruto.destaques) ? bruto.destaques : [])
    .map((d) => ({ titulo: texto(d?.titulo, 120), texto: texto(d?.texto, 400) }))
    .filter((d) => d.titulo || d.texto)
    .slice(0, 8);

  return {
    assunto: texto(bruto.assunto, 160),
    preheader: texto(bruto.preheader, 200),
    titulo: texto(bruto.titulo, 120),
    intro: texto(bruto.intro, 600),
    destaques,
    rotuloBotao: texto(bruto.rotuloBotao, 60),
    fecho: texto(bruto.fecho, 400),
  };
}

function validar(c: ConteudoCampanha, link: string): string | null {
  if (!c.assunto) return "Escreva o assunto — é a única coisa que aparece antes de abrir.";
  if (!c.titulo) return "Escreva o título do e-mail.";
  if (!c.intro) return "Escreva a abertura do e-mail.";
  if (!c.rotuloBotao) return "Escreva o texto do botão.";
  try {
    const u = new URL(link);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "O link do botão precisa ser http(s).";
  } catch {
    return "O link do botão não é uma URL válida.";
  }
  return null;
}

export async function linkPadraoCampanhaAction(): Promise<{ link: string } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  try {
    return { link: `${baseDoApp()}/login` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function resumoCampanhaAction(
  campanha: string,
  incluirNaoConfirmados: boolean,
): Promise<{ resumo: ResumoCampanha; loteMax: number } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  try {
    const resumo = await resumoCampanha(campanha.trim(), incluirNaoConfirmados);
    return { resumo, loteMax: LOTE_MAX };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function previaCampanhaAction(
  conteudo: ConteudoCampanha,
  link: string,
): Promise<{ html: string } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  // Nome de exemplo: o título do e-mail muda quando há nome, e é justamente
  // essa versão que a maioria vai receber.
  return { html: previaCampanha(normalizar(conteudo), link, "Paulo") };
}

export async function enviarTesteCampanhaAction(
  para: string,
  conteudo: ConteudoCampanha,
  link: string,
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const destino = para.trim();
  if (!destino.includes("@")) return { error: "Digite um e-mail válido para o teste." };

  const limpo = normalizar(conteudo);
  const problema = validar(limpo, link);
  if (problema) return { error: problema };

  const userId = await idDoAdmin();
  if (!userId) return { error: "Sessão expirada." };

  try {
    const res = await enviarTesteCampanha({ para: destino, conteudo: limpo, link, userId });
    return res.ok ? { ok: true } : { error: res.erro };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function enviarLoteCampanhaAction(opcoes: {
  campanha: string;
  conteudo: ConteudoCampanha;
  link: string;
  incluirNaoConfirmados: boolean;
  limite: number;
}): Promise<{ resultado: ResultadoLote } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const campanha = opcoes.campanha.trim();
  if (!campanha) return { error: "Defina um nome para a campanha." };

  const limpo = normalizar(opcoes.conteudo);
  const problema = validar(limpo, opcoes.link);
  if (problema) return { error: problema };

  try {
    const resultado = await enviarLoteCampanha({
      campanha,
      conteudo: limpo,
      link: opcoes.link,
      incluirNaoConfirmados: opcoes.incluirNaoConfirmados,
      limite: opcoes.limite,
    });
    return { resultado };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function limparFalhasCampanhaAction(
  campanha: string,
): Promise<{ removidas: number } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  try {
    return { removidas: await limparFalhasCampanha(campanha.trim()) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
