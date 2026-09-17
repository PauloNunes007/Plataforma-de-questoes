"use client";

// Link de NAVEGAÇÃO PRINCIPAL (header do desktop e barra inferior do celular).
//
// POR QUE ELE EXISTE. A queixa era "a plataforma fica lerda ao mudar de aba".
// Metade disso era mesmo latência (resolvida em next.config.ts, com o cache de
// rota do cliente e o prefetch no hover) — a outra metade era SILÊNCIO: o
// `<Link>` cru não muda nada na tela entre o toque e a resposta do servidor.
// Por alguns décimos de segundo o aluno via a aba antiga ainda acesa e concluía
// que o toque não pegou — então tocava de novo, o que cancela e recomeça a
// navegação e deixa tudo de fato mais lento.
//
// Aqui o estado ativo é OTIMISTA: no clique a aba acende na hora, antes de
// qualquer resposta. `useLinkStatus` (Next 15.3+) diz se aquela navegação
// ainda está em voo, pra desenhar o fio de progresso por baixo do rótulo.
//
// O palpite nunca sobrevive à verdade. Ele é guardado junto com o caminho em
// que foi feito (`de`) e SÓ VALE enquanto o caminho continuar aquele — quando
// a rota muda, a comparação falha sozinha durante o render e o palpite morre,
// sem efeito nenhum. O temporizador cobre o outro fim: navegação cancelada ou
// que falhou, em que o caminho NÃO muda e a aba ficaria acesa mentindo.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

/** Teto pro palpite: passou disso, a navegação não vai mesmo acontecer. */
const LIMITE_PALPITE_MS = 8000;

type NavPendenteCtx = {
  /** href tocado e ainda não confirmado pela rota — ou null. */
  pendente: string | null;
  marcar: (href: string) => void;
};

const Ctx = createContext<NavPendenteCtx>({ pendente: null, marcar: () => {} });

export function NavPendenteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [palpite, setPalpite] = useState<{ href: string; de: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const marcar = useCallback(
    (href: string) => {
      setPalpite({ href, de: pathname });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPalpite(null), LIMITE_PALPITE_MS);
    },
    [pathname],
  );

  // Derivado no render, não num efeito: assim que `pathname` vira outro, o
  // palpite deixa de casar e some — sem passo extra de renderização.
  const valor = useMemo<NavPendenteCtx>(
    () => ({ pendente: palpite && palpite.de === pathname ? palpite.href : null, marcar }),
    [palpite, pathname, marcar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * Diz se `href` deve ser desenhado como aba ativa AGORA — considerando o
 * toque que ainda não virou rota. Havendo pendente, ele é o único ativo: sem
 * isso duas abas acendiam juntas durante a troca.
 */
export function useAbaAtiva(href: string) {
  const pathname = usePathname();
  const { pendente } = useContext(Ctx);
  const casa = (p: string) => p === href || p.startsWith(`${href}/`);
  return pendente ? casa(pendente) : casa(pathname);
}

export function NavLink({
  href,
  className,
  children,
  ...props
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  const { marcar } = useContext(Ctx);

  return (
    <Link href={href} onNavigate={() => marcar(href)} className={className} {...props}>
      {children}
    </Link>
  );
}

/**
 * Fio de progresso da aba — some sozinho quando o payload chega. Só funciona
 * DENTRO de um `<Link>`: `useLinkStatus` lê o contexto que o próprio Link abre.
 */
export function NavProgresso({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-2 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-current/25 ${className ?? ""}`}
    >
      <span className="block h-full w-1/3 animate-[nav-fio_0.9s_ease-in-out_infinite] rounded-full bg-current" />
    </span>
  );
}
