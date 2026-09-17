import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto PADRÃO das rotas protegidas: o que TODA tela do app tem em comum
// — título, linha de apoio e um corpo de cartões empilhados.
//
// Antes este arquivo desenhava a silhueta da home (grade de duas colunas com
// trilho lateral) pra todas as rotas, e aí trocar pro Ranking ou pra Trilha
// mostrava por um instante um layout que aquela tela não tem: a página
// "pulava" ao chegar. Uma silhueta neutra promete menos e cumpre sempre.
// Quem tem forma própria e tráfego pra justificar ganha o seu (ver
// `dashboard/loading.tsx`).
export default function Loading() {
  return (
    <div className="casca py-6 lg:py-8">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-7 space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="hidden h-36 w-full rounded-2xl sm:block" />
      </div>
    </div>
  );
}
