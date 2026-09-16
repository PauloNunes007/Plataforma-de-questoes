"use client";

// Resgate automático do convite (/convite/[codigo] guardou o código num
// cookie). Roda no layout das rotas protegidas, ou seja: na PRIMEIRA tela que
// o testador vê depois de criar a conta e passar pelo onboarding — que é
// exatamente quando a linha em `profiles` já existe e o resgate pode escrever
// nela. Rodar antes (no /login ou no /onboarding) consumiria o cupom sem
// conseguir ligar o Pro.
//
// Não faz nada quando não há cookie, que é o caso de 100% dos acessos normais.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, X } from "lucide-react";
import { resgatarCupomAction } from "@/lib/plano/actions";
import { COOKIE_CONVITE, normalizarCodigoCupom } from "@/lib/plano/plano";

function lerCookie(nome: string): string | null {
  try {
    const alvo = nome + "=";
    for (const parte of document.cookie.split(";")) {
      const p = parte.trim();
      if (p.startsWith(alvo)) return decodeURIComponent(p.slice(alvo.length));
    }
  } catch {
    // cookies bloqueados — nada a resgatar por aqui
  }
  return null;
}

function apagarCookie(nome: string) {
  try {
    document.cookie = nome + "=; path=/; max-age=0; samesite=lax";
  } catch {
    /* idem */
  }
}

export function ConviteAutoResgate() {
  const router = useRouter();
  const jaTentou = useRef(false);
  const [diasLiberados, setDiasLiberados] = useState<number | null>(null);

  useEffect(() => {
    if (jaTentou.current) return;
    jaTentou.current = true;

    const codigo = normalizarCodigoCupom(lerCookie(COOKIE_CONVITE) ?? "");
    if (!codigo) return;

    // Apaga ANTES de chamar: uma tentativa por convite, ponto. Se a ação
    // falhar por qualquer motivo (convite esgotado no meio do caminho, rede
    // caindo), o caminho manual continua aberto em /pro → "Tenho um cupom" —
    // melhor isso do que o app reenviando o mesmo resgate a cada navegação.
    apagarCookie(COOKIE_CONVITE);

    (async () => {
      const res = await resgatarCupomAction(codigo);
      if ("error" in res) return;
      setDiasLiberados(res.diasConcedidos);
      // Revalida os Server Components: o selo Pro no header e os recursos
      // liberados aparecem sem o aluno precisar recarregar a página.
      router.refresh();
    })();
  }, [router]);

  return (
    <AnimatePresence>
      {diasLiberados !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          role="status"
          className="fixed inset-x-4 bottom-20 z-50 mx-auto w-auto max-w-sm lg:bottom-6"
        >
          <div className="surface flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-lg">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-questly-gold/15 text-questly-gold">
              <BadgeCheck className="size-4.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold">
                Convite aplicado — <span className="tnum">{diasLiberados}</span> dias de Pro.
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                Simulados ilimitados, projeção da nota e autópsia do erro já estão liberados.
              </p>
              <Link
                href="/pro"
                className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-questly-gold underline-offset-2 hover:underline"
              >
                Ver o que mudou
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setDiasLiberados(null)}
              aria-label="Fechar aviso"
              className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
