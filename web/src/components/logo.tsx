import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-heading text-[17px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-questly-green to-questly-green-deep text-[13px] font-bold text-white dark:text-[#0c1512]">
        Q
      </span>
      Questly
    </div>
  );
}
