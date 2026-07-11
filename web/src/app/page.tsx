import { Button } from "@/components/ui/button";

const gamificationSwatches = [
  { className: "bg-questly-green", label: "Verde (marca / XP)" },
  { className: "bg-questly-blue", label: "Azul (info / links)" },
  { className: "bg-questly-orange", label: "Laranja (streak)" },
  { className: "bg-questly-red", label: "Vermelho (erro)" },
  { className: "bg-questly-gold", label: "Dourado (liga / mestre)" },
  { className: "bg-questly-purple", label: "Roxo (destaque)" },
] as const;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center gap-12 px-6 py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-semibold text-questly-green">
          Questly
        </h1>
        <p className="max-w-md text-muted-foreground">
          Setup inicial: Next.js + TypeScript + Tailwind + Shadcn UI +
          Supabase SSR. Design system em validação.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button>Começar missão</Button>
        <Button variant="secondary">Ver trilha</Button>
        <Button variant="outline">Configurações</Button>
        <Button variant="destructive">Encerrar</Button>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
        {gamificationSwatches.map((swatch) => (
          <div
            key={swatch.className}
            className="flex flex-col gap-2 rounded-2xl border border-border p-4"
          >
            <div className={`h-12 w-full rounded-xl ${swatch.className}`} />
            <span className="font-heading text-sm">{swatch.label}</span>
          </div>
        ))}
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        Fredoka · Nunito · JetBrains Mono — light/dark automático (tema do
        sistema)
      </p>
    </main>
  );
}
