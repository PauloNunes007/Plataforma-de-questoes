"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

// Alterna claro/escuro (o header da print tem esse toggle). Usa next-themes,
// que já está montado no RootLayout.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Só o cliente sabe o tema resolvido — flag de mount evita mismatch de
  // hidratação. Sync de mount legítimo (mesma exceção usada no importador).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // `escuro` só vale depois do mount: no servidor `resolvedTheme` é undefined,
  // então qualquer atributo derivado dele diverge na hidratação. Antes só o
  // ÍCONE era gated — aria-label e title não, e o React reclamava de mismatch
  // no console em toda página com o header (o atributo nem chega a ser
  // corrigido: "this won't be patched up").
  const escuro = mounted && resolvedTheme === "dark";
  const rotulo = !mounted ? "Alternar tema" : escuro ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={rotulo}
      title={rotulo}
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {escuro ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
    </button>
  );
}
