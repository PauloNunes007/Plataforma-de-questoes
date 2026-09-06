import { Skeleton } from "@/components/ui/skeleton";

// Fallback das rotas públicas (landing/login). A landing consulta o banco pra
// mostrar contagens reais; com ISR isso quase sempre vem do cache, mas na
// primeira renderização depois de revalidar existe espera de verdade.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-16">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-10 h-14 w-full max-w-2xl" />
      <Skeleton className="mt-3 h-14 w-full max-w-xl" />
      <Skeleton className="mt-8 h-11 w-52 rounded-xl" />
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
