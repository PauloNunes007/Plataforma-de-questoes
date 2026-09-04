"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

// Alterna claro/escuro (o header da print tem esse toggle). Usa next-themes,
// que já está montado no RootLayout. `mounted` evita mismatch de hidratação —
// o tema resolvido só existe no cliente.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Só o cliente sabe o tema resolvido — flag de mount evita mismatch de
  // hidratação. Sync de mount legítimo (mesma exceção usada no importador).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const escuro = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Ativar tema claro" : "Ativar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {mounted && escuro ? (
        <Sun size={18} strokeWidth={1.9} />
      ) : (
        <Moon size={18} strokeWidth={1.9} />
      )}
    </button>
  );
}
