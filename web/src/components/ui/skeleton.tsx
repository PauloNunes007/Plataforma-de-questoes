import { cn } from "@/lib/utils";

// Placeholder de carregamento. Usa a MESMA geometria do conteúdo que vai
// substituir (altura/raio), senão o layout pula quando os dados chegam — que é
// justamente o que o skeleton existe pra evitar.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.09]", className)}
    />
  );
}

/** Bloco de card em carregamento — a forma mais repetida do app. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("surface rounded-2xl p-5", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-3 w-2/3" />
      <Skeleton className="mt-5 h-24 w-full rounded-xl" />
    </div>
  );
}
