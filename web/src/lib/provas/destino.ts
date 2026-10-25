// "Pra onde este aluno queria ir antes de criar a conta."
//
// Quem toca em "Treinar" na página pública da P2 ainda não tem conta. Sem isto,
// o cadastro (login → código por e-mail → onboarding) jogaria fora a intenção e
// ele cairia na home sem saber onde estava o simulado que pediu. A rota de
// treinar grava o próprio caminho neste cookie antes de mandar pro cadastro;
// `destinoPosLogin` e o fim do onboarding o leem, e a rota o apaga quando o
// simulado finalmente nasce.
//
// Só aceita caminhos de treino da página: um cookie é entrada de usuário, e um
// redirecionamento pra qualquer URL seria um open redirect.
import { cookies } from "next/headers";
import { ROTA_P2_2026_2 } from "./p2-2026-2";

export const COOKIE_DESTINO = "expectrum_destino";
export const DESTINO_MAX_IDADE_SEG = 60 * 60 * 24; // um dia: dá pra confirmar o e-mail com calma

const PREFIXO_PERMITIDO = `${ROTA_P2_2026_2}/treinar/`;

export function destinoValido(valor: string | null | undefined): string | null {
  if (!valor) return null;
  // O Next grava o valor com encodeURIComponent; dependendo de quem lê, ele
  // chega decodificado ou não. A validação abaixo vale pros dois.
  if (valor.includes("%")) {
    try {
      valor = decodeURIComponent(valor);
    } catch {
      return null;
    }
  }
  if (!valor.startsWith(PREFIXO_PERMITIDO)) return null;
  if (!/^[a-z0-9/-]+$/.test(valor)) return null;
  return valor;
}

/** Lê o destino guardado (Server Actions e Server Components). */
export async function lerDestinoPendente(): Promise<string | null> {
  const jar = await cookies();
  return destinoValido(jar.get(COOKIE_DESTINO)?.value);
}
