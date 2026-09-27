// ACESSO LIVRE — período em que a plataforma inteira fica aberta, sem teto de
// plano pra ninguém. Helpers PUROS (sem Supabase, seguros pra client component).
//
// O mecanismo é o mesmo da semana de lançamento (./lancamento.ts): uma DATA
// comparada com agora em toda leitura, nunca um job que liga/desliga. No
// instante em que `ACESSO_LIVRE_ATE` passa, `temAcessoPro()` volta a responder
// igual a `ehPro()` e os tetos do grátis (./limites.ts) voltam a valer —
// sem deploy, sem cron, sem nada que possa deixar de rodar.
//
// Por que um helper SEPARADO de `ehPro()` em vez de mexer nele: `ehPro()`
// continua respondendo "esta conta PAGOU?", e há lugares que precisam dessa
// resposta e não da outra — o selo Pro no ranking (dar o selo pra todo mundo
// seria mentira pública), o crédito de meses numa compra (ativar.ts soma em
// cima de quem já é Pro), cupom, afiliados, o relatório semanal por e-mail.
// Todo GATE de recurso (tetos, faltas/notas, PDF, autópsia, simulados) passa
// por `temAcessoPro()`.
//
// Sem variável de ambiente de propósito: a data tem que ser a MESMA no
// servidor e no browser, e uma env sem NEXT_PUBLIC_ chegaria `undefined` ao
// cliente (ver o aviso em `promoLancamentoAtiva`).

import { ehPro, type PlanoDoProfile } from "./plano";

/** Primeiro instante SEM acesso livre (meia-noite de Brasília). */
export const ACESSO_LIVRE_ATE = "2026-10-08T00:00:00-03:00";

export function acessoLivreAtivo(agora: Date = new Date()): boolean {
  return agora.getTime() < new Date(ACESSO_LIVRE_ATE).getTime();
}

/** Gate de recurso: Pro pago OU período de acesso livre. */
export function temAcessoPro(p: PlanoDoProfile | null | undefined): boolean {
  return acessoLivreAtivo() || ehPro(p);
}

/**
 * Exibição: esta conta deve APARECER como Pro (selo, aro dourado, "Expectrum
 * Pro" no menu)? Durante o acesso livre ninguém aparece — todo mundo tem
 * tudo, e marcar só quem pagou criaria uma distinção que não corresponde a
 * nada na plataforma. Volta sozinho em `ACESSO_LIVRE_ATE`. Não usar pra
 * decisão de dinheiro (crédito, cupom, afiliados): ali vale `ehPro()`.
 */
export function mostrarComoPro(p: PlanoDoProfile | null | undefined): boolean {
  return !acessoLivreAtivo() && ehPro(p);
}
