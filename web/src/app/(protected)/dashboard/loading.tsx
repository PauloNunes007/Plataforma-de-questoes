import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto DA HOME (era o de todas as rotas protegidas — ver o
// `(protected)/loading.tsx` genérico, que agora só desenha cabeçalho + corpo).
// Vale a pena ser específico aqui: a home é a rota mais cara do app (perfil,
// retomar, hero, desempenho, atalho de simulados e risco acadêmico em
// paralelo) e a mais visitada, então é onde o esqueleto é mais visto e onde
// acertar a SILHUETA — a coluna larga com a faixa de ação, os três tiles e o
// trilho lateral — impede o salto de layout quando o conteúdo chega.
// O TopNav já está pintado pelo layout; aqui só o miolo.
export default function Loading() {
  return (
    <div className="casca py-6">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <div className="hidden space-y-4 xl:block">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
