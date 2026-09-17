import Link from "next/link";
import { FileWarning, Lock } from "lucide-react";

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

// A parede da COTA — o aluno É Pro e mesmo assim não passa, porque exportar em
// PDF é o único recurso com teto nos dois planos (ver lib/plano/limites.ts).
//
// O texto assume a coisa de frente. Um Pro que bate num limite que ninguém
// avisou que existia tem toda a razão de se sentir enganado, então a tela diz
// o número, diz QUANDO volta e diz por quê — "o banco de questões é o produto"
// é uma razão que qualquer aluno entende, e é a verdadeira.
export function PortaCota({
  motivo,
  renovaEm,
  tetoSemana,
  tetoMes,
}: {
  motivo: "semana" | "mes";
  renovaEm: string;
  tetoSemana: number;
  tetoMes: number;
}) {
  const data = new Date(`${renovaEm}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="casca-leitura flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-questly-gold/12 text-questly-gold">
        <FileWarning size={20} strokeWidth={2} />
      </span>
      <div>
        <h1 className="font-heading text-[19px] font-semibold tracking-tight">
          {motivo === "semana"
            ? "Você já exportou o limite desta semana"
            : "Você já exportou o limite deste mês"}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          {motivo === "semana"
            ? `O Pro exporta ${tetoSemana} listas ou simulados diferentes por semana. A sua cota volta a encher na segunda, ${data}.`
            : `O Pro exporta ${tetoMes} listas ou simulados diferentes por mês. A cota é móvel: cada exportação libera de volta 30 dias depois.`}
        </p>
        <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
          O teto existe porque o banco de questões é o produto — sem ele, o
          caminho mais curto até ele seria assinar um mês e baixar tudo.{" "}
          <strong className="font-semibold text-foreground">
            Reimprimir o que você já exportou nesta semana não conta
          </strong>{" "}
          e continua liberado.
        </p>
      </div>
      <Link
        href="/questoes"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-[14px] font-semibold transition-colors hover:bg-muted"
      >
        Voltar pro banco de questões
      </Link>
    </div>
  );
}
