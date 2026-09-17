import Link from "next/link";
import { Lock } from "lucide-react";

// A parede do Pro na exportação em PDF, num componente só porque agora são
// três portas de entrada (lista da missão, lista de um tópico e simulado) e
// todas precisam do MESMO texto — três cópias divergiriam na primeira mudança
// de preço ou de nome do plano.
//
// O gate de verdade é a checagem no SERVIDOR, em cada page.tsx; isto aqui é o
// que o aluno vê depois dela.
export function PortaPro({ contexto }: { contexto: "lista" | "simulado" }) {
  return (
    <div className="casca-leitura flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-questly-gold/12 text-questly-gold">
        <Lock size={20} strokeWidth={2} />
      </span>
      <div>
        <h1 className="font-heading text-[19px] font-semibold tracking-tight">
          Exportar em PDF é do Pro
        </h1>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {contexto === "simulado"
            ? "Com o Expectrum Pro você imprime o simulado no layout de prova, resolve no papel e marca as respostas aqui — a correção e a análise de erros saem iguais."
            : "Com o Expectrum Pro você baixa qualquer lista ou simulado pra imprimir e resolver no papel — do jeito que a prova vai ser."}
        </p>
      </div>
      <Link
        href="/pro"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8c257] to-[#b98712] px-5 text-[14px] font-semibold text-[#2a1d02] transition-[filter] hover:brightness-110"
      >
        Conhecer o Pro
      </Link>
    </div>
  );
}
