"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, MailX, Undo2 } from "lucide-react";
import { reativarEmailsAction } from "@/lib/email/actions";

// O tom aqui é deliberado: nada de "tem certeza?", nada de culpa. Quem clicou
// em sair já saiu quando esta tela abriu — ela só confirma e deixa a porta
// destrancada. Segurar alguém que quer sair rende reclamação de spam, e spam
// queima o remetente que entrega a confirmação de cadastro.
export function DescadastroPainel({
  ok,
  userId,
  token,
}: {
  ok: boolean;
  userId: string;
  token: string;
}) {
  const [reativado, setReativado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function reativar() {
    setCarregando(true);
    setErro(null);
    const res = await reativarEmailsAction(userId, token);
    setCarregando(false);
    if ("error" in res) {
      setErro(res.error);
      return;
    }
    setReativado(true);
  }

  if (!ok) {
    return (
      <div className="surface w-full max-w-[400px] px-6 py-9 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MailX size={22} strokeWidth={1.9} />
        </span>
        <h1 className="font-heading text-[19px] font-semibold tracking-tight">Link inválido ou expirado</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Não conseguimos identificar sua conta por este link. Você pode ajustar isso entrando na
          Questly, em Configurações.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-questly-green px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
        >
          Entrar na Questly
        </Link>
      </div>
    );
  }

  return (
    <div className="surface w-full max-w-[400px] px-6 py-9 text-center">
      <span
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
          reativado
            ? "bg-questly-green-light text-questly-green-dark"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {reativado ? <Check size={22} strokeWidth={2.2} /> : <MailX size={22} strokeWidth={1.9} />}
      </span>

      <h1 className="font-heading text-[19px] font-semibold tracking-tight">
        {reativado ? "Pronto, você voltou" : "Você não receberá mais novidades"}
      </h1>

      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        {reativado
          ? "Vamos te avisar quando algo importante mudar na Questly."
          : "Removemos seu e-mail dos avisos sobre o produto. E-mails de conta — confirmação de cadastro e recuperação de senha — continuam chegando normalmente, porque são resposta a algo que você pediu."}
      </p>

      {erro && <p className="mt-3 text-[12.5px] text-questly-red-dark">{erro}</p>}

      {!reativado && (
        <button
          type="button"
          onClick={reativar}
          disabled={carregando}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-[13.5px] font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
        >
          {carregando ? (
            <Loader2 size={15} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Undo2 size={15} strokeWidth={2.2} />
          )}
          Voltar a receber
        </button>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <Link href="/" className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
          Ir para a Questly
        </Link>
      </div>
    </div>
  );
}
