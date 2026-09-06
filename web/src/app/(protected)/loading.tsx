import { Skeleton } from "@/components/ui/skeleton";

// Fallback de Suspense pra qualquer rota protegida. As páginas fazem o fetch
// inicial no servidor (dashboard chega a montar missões), então sem isso o
// clique numa aba deixa o app aparentemente travado até a resposta chegar.
// O TopNav já está pintado pelo layout — aqui só o miolo.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-5">
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-2 h-4 w-72" />

      <div className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
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
