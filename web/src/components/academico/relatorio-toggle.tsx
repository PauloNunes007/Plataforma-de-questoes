"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { definirRelatorioSemanalAction } from "@/lib/academico/actions";

// Liga/desliga o relatório semanal por e-mail (Pro).
//
// Fica no PÉ de /materias, e não em Configurações, porque é aqui que o aluno
// entende o que o e-mail contém — ele acabou de ver as faltas e a projeção que
// o relatório resume. Um interruptor de e-mail escondido três telas longe do
// conteúdo que ele controla é como o aluno acaba marcando spam.
//
// O optimistic update é intencional: a preferência é reversível, de baixo
// risco, e uma espera de rede pra mexer num interruptor faz a tela parecer
// quebrada. Se a escrita falhar, o estado volta e o erro aparece.
export function RelatorioToggle({ inicial }: { inicial: boolean }) {
  const [ligado, setLigado] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function alternar() {
    const alvo = !ligado;
    setLigado(alvo);
    setErro(null);
    startTransition(async () => {
      const res = await definirRelatorioSemanalAction(alvo);
      if ("error" in res) {
        setLigado(!alvo);
        setErro(res.error);
      }
    });
  }

  return (
    <div className="surface flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-questly-blue/12 text-questly-blue-dark">
        {pendente ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} strokeWidth={1.9} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold tracking-tight">Relatório semanal por e-mail</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          Toda segunda, um resumo do que você estudou na semana, seus pontos fracos e as disciplinas onde as
          faltas ou a média estão apertando.
        </p>
        {erro && <p className="mt-1 text-[11.5px] text-questly-red-dark">{erro}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        onClick={alternar}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          ligado ? "bg-questly-green" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            ligado ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
