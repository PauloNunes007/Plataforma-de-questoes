"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Insignia } from "@/components/insignias/insignia";
import { reenviarCodigoAction, verificarCodigoAction } from "@/lib/auth/actions";

const DIGITOS = 6;
/** Mesma janela que o Supabase impõe entre dois reenvios. */
const ESPERA_REENVIO_S = 60;

const estadoInicial = null;

export function VerificarEmailForm({
  email,
  jaEnviado,
}: {
  email: string;
  jaEnviado: boolean;
}) {
  const [verificarState, verificarFormAction, verificarPending] = useActionState(
    verificarCodigoAction,
    estadoInicial,
  );
  const [reenviarState, reenviarFormAction, reenviarPending] = useActionState(
    reenviarCodigoAction,
    estadoInicial,
  );

  const [digitos, setDigitos] = useState<string[]>(() => Array(DIGITOS).fill(""));
  const [espera, setEspera] = useState(jaEnviado ? ESPERA_REENVIO_S : 0);
  const camposRef = useRef<Array<HTMLInputElement | null>>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const jaEnviouRef = useRef(false);

  const codigo = digitos.join("");

  // Contagem regressiva do reenvio. Pedir um código novo antes da hora só
  // rende erro do Supabase — melhor o botão dizer quanto falta.
  useEffect(() => {
    if (espera <= 0) return;
    const t = setInterval(() => setEspera((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [espera]);

  // Reagir ao retorno das actions comparando com o valor anterior DURANTE o
  // render — não num useEffect. É o padrão recomendado pra "ajustar estado
  // quando uma entrada muda": o React descarta este render e refaz antes de
  // pintar, sem frame intermediário (e sem violar react-hooks/set-state-in-effect).
  const [erroVisto, setErroVisto] = useState<string | undefined>(undefined);
  if (verificarState?.error !== erroVisto) {
    setErroVisto(verificarState?.error);
    // Errou o código: limpa as caixas, senão o aluno apaga 6 dígitos na mão.
    if (verificarState?.error) setDigitos(Array(DIGITOS).fill(""));
  }

  const [reenvioVisto, setReenvioVisto] = useState(reenviarState);
  if (reenviarState !== reenvioVisto) {
    setReenvioVisto(reenviarState);
    if (reenviarState?.success) setEspera(ESPERA_REENVIO_S);
  }

  // Foco é sistema externo (DOM), então aqui efeito é o lugar certo.
  useEffect(() => {
    if (!verificarState?.error) return;
    jaEnviouRef.current = false;
    camposRef.current[0]?.focus();
  }, [verificarState]);

  useEffect(() => {
    camposRef.current[0]?.focus();
  }, []);

  function preencher(valores: string[]) {
    const limpos = valores.slice(0, DIGITOS);
    const novos = Array(DIGITOS)
      .fill("")
      .map((_, i) => limpos[i] ?? "");
    setDigitos(novos);

    // Envia sozinho quando o sexto dígito entra — o botão vira confirmação
    // visual, não trabalho extra.
    if (novos.every((d) => d !== "") && !jaEnviouRef.current) {
      jaEnviouRef.current = true;
      requestAnimationFrame(() => formRef.current?.requestSubmit());
    }
  }

  function aoDigitar(indice: number, valor: string) {
    const numeros = valor.replace(/\D/g, "");
    if (!numeros) {
      const novos = [...digitos];
      novos[indice] = "";
      setDigitos(novos);
      return;
    }

    // Colar o código inteiro em qualquer caixa distribui pelas seguintes.
    if (numeros.length > 1) {
      preencher([...digitos.slice(0, indice), ...numeros.split("")]);
      const alvo = Math.min(indice + numeros.length, DIGITOS - 1);
      camposRef.current[alvo]?.focus();
      return;
    }

    const novos = [...digitos];
    novos[indice] = numeros;
    preencher(novos);
    if (indice < DIGITOS - 1) camposRef.current[indice + 1]?.focus();
  }

  function aoTeclar(indice: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[indice] && indice > 0) {
      e.preventDefault();
      const novos = [...digitos];
      novos[indice - 1] = "";
      setDigitos(novos);
      camposRef.current[indice - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && indice > 0) camposRef.current[indice - 1]?.focus();
    if (e.key === "ArrowRight" && indice < DIGITOS - 1) camposRef.current[indice + 1]?.focus();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="surface w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-black/5 sm:p-10 dark:shadow-black/30"
    >
      <div className="flex flex-col items-center text-center">
        <Insignia nome="envelope" tom="esmeralda" size={64} className="mb-4" />
        <h1 className="mb-2 font-heading text-xl font-semibold tracking-tight">
          Confirme seu email
        </h1>
        <p className="text-sm font-semibold text-muted-foreground">
          Enviamos um código de 6 dígitos para
          <br />
          <span className="text-foreground">{email}</span>
        </p>
      </div>

      {/* O remetente ainda não tem reputação com o Gmail, então o código cai em
          spam na maioria das vezes. Enquanto isso for verdade, avisar antes é
          mais honesto (e resolve mais cadastros) do que deixar o aluno esperando
          um email que ele acha que não chegou. */}
      <div className="mt-6 flex gap-3 rounded-2xl border-2 border-questly-orange/45 bg-questly-orange-light/60 p-4 text-left">
        <AlertTriangle
          size={20}
          strokeWidth={2.5}
          className="mt-0.5 shrink-0 text-questly-orange-dark"
          aria-hidden
        />
        <div>
          <p className="font-heading text-sm font-bold text-questly-orange-dark">
            Olhe na caixa de spam
          </p>
          <p className="mt-1 text-[13px] leading-relaxed font-semibold text-questly-orange-dark/85">
            O código quase sempre cai em <strong>Spam</strong> ou{" "}
            <strong>Lixo eletrônico</strong>. Procure por <strong>Expectrum</strong> e marque como{" "}
            <strong>&ldquo;Não é spam&rdquo;</strong> — assim os próximos chegam direto.
          </p>
        </div>
      </div>

      <form ref={formRef} action={verificarFormAction} className="mt-6">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="codigo" value={codigo} />

        <div className="flex justify-center gap-2" role="group" aria-label="Código de verificação">
          {digitos.map((digito, i) => (
            <input
              key={i}
              ref={(el) => {
                camposRef.current[i] = el;
              }}
              value={digito}
              onChange={(e) => aoDigitar(i, e.target.value)}
              onKeyDown={(e) => aoTeclar(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Dígito ${i + 1}`}
              disabled={verificarPending}
              className="h-14 w-11 rounded-xl border border-input bg-transparent text-center font-mono text-2xl font-bold tabular-nums transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30"
            />
          ))}
        </div>

        {verificarState?.error && (
          <p className="mt-4 rounded-lg bg-questly-red-light px-3 py-2 text-center text-sm font-semibold text-questly-red-dark">
            {verificarState.error}
          </p>
        )}

        <Button
          type="submit"
          className="mt-5 h-12 w-full cursor-pointer text-[15px]"
          disabled={verificarPending || codigo.length < DIGITOS}
        >
          {verificarPending ? "Confirmando..." : "Confirmar e começar"}
        </Button>
      </form>

      <form action={reenviarFormAction} className="mt-5 text-center">
        <input type="hidden" name="email" value={email} />
        <p className="text-xs font-semibold text-muted-foreground">
          Procurou no spam e não achou?
        </p>
        <button
          type="submit"
          disabled={reenviarPending || espera > 0}
          className="mt-1 cursor-pointer text-sm font-semibold text-questly-green underline-offset-4 hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
        >
          {reenviarPending
            ? "Reenviando..."
            : espera > 0
              ? `Reenviar código em ${espera}s`
              : "Reenviar código"}
        </button>

        {reenviarState?.error && (
          <p className="mt-3 text-sm font-semibold text-questly-red-dark">{reenviarState.error}</p>
        )}
        {reenviarState?.success && (
          <p className="mt-3 text-sm font-semibold text-questly-green-dark dark:text-questly-green">
            {reenviarState.success}
          </p>
        )}
      </form>

      <div className="mt-7 border-t border-border pt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Usar outro email
        </Link>
      </div>
    </motion.div>
  );
}
