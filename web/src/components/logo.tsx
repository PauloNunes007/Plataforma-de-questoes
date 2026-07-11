import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-heading text-2xl font-bold text-questly-green",
        className,
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-questly-green text-lg font-bold text-white shadow-[0_3px_0_var(--questly-green-dark)]">
        Q
      </span>
      Questly
    </div>
  );
}
