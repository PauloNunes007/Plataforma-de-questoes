"use client";

// Carimbo da indicação (/p/[codigo] guardou o código num cookie). Roda no
// layout das rotas protegidas, ou seja: na PRIMEIRA tela que a pessoa vê
// depois de criar a conta e passar pelo onboarding — que é exatamente quando a
// linha em `profiles` já existe e o bônus de Pro pode ser escrito nela.
//
// Não faz nada quando não há cookie, que é o caso de quase todos os acessos.
// Gêmeo de components/plano/convite-auto-resgate.tsx de propósito: são dois
// programas diferentes (convite manual × parceria comercial) que compartilham
// o mesmo momento certo de agir.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { registrarIndicacaoAction } from "@/lib/afiliados/actions";
import { COOKIE_REF } from "@/lib/afiliados/afiliados";

function lerCookie(nome: string): string | null {
  try {
    const alvo = nome + "=";
    for (const parte of document.cookie.split(";")) {
      const p = parte.trim();
      if (p.startsWith(alvo)) return decodeURIComponent(p.slice(alvo.length));
    }
  } catch {
    // cookies bloqueados — nada a carimbar por aqui
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

export function IndicacaoAuto() {
  const router = useRouter();
  const jaTentou = useRef(false);
  const [bonus, setBonus] = useState<{ dias: number; parceiro: string } | null>(null);

  useEffect(() => {
    if (jaTentou.current) return;
    jaTentou.current = true;

    const valor = lerCookie(COOKIE_REF);
    if (!valor) return;

    // Apaga ANTES de chamar: uma tentativa por link, ponto. As recusas
    // possíveis (conta anterior ao clique, conta já indicada, parceiro
    // inativo) são todas definitivas — repetir a cada navegação só geraria
    // tráfego e nunca mudaria a resposta.
    apagarCookie(COOKIE_REF);

    (async () => {
      const res = await registrarIndicacaoAction(valor);
      if (!res.ok) return;
      if (res.diasBonus > 0) setBonus({ dias: res.diasBonus, parceiro: res.parceiro });
      // Revalida os Server Components: o selo Pro no header e os recursos
      // liberados aparecem sem a pessoa precisar recarregar a página.
      router.refresh();
    })();
  }, [router]);

  return (
    <AnimatePresence>
      {bonus ? (
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
              <Sparkles className="size-4.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold">
                <span className="tnum">{bonus.dias}</span> dias de Pro liberados pela indicação de{" "}
                {bonus.parceiro}.
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                Simulados ilimitados, controle de faltas e notas, autópsia do erro e estatísticas
                avançadas já estão valendo.
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
              onClick={() => setBonus(null)}
              aria-label="Fechar aviso"
              className="-mt-1 -mr-1 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
