// Avatar redondo com foto (Storage) ou iniciais em gradiente — mesmo
// fallback do app legado (questlyRenderAvatar em js/supabase-client.js),
// reimplementado como componente em vez de manipulação direta de DOM.
//
// Tratamento "cartão profissional" (pedido do usuário, redesign do
// ranking 2026-09-04): um wrapper próprio dá elevação (drop-shadow via
// style, não via classe ring/shadow — assim nunca colide com o ring
// condicional que cada tela já aplica via `className`) + um brilho
// "glass" diagonal por cima da foto/iniciais, e o fallback agora usa até
// duas iniciais (nome + sobrenome) em vez de uma letra só.
type AvatarProps = {
  nome: string;
  fotoUrl: string | null;
  size?: number;
  gradientClassName?: string;
  className?: string;
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

export function RankAvatar({
  nome,
  fotoUrl,
  size = 40,
  gradientClassName = "from-questly-green to-questly-green-deep",
  className = "",
}: AvatarProps) {
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size, filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.22))" }}
    >
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white ${gradientClassName} ${className}`}
        style={{ fontSize: Math.max(11, size * 0.36) }}
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt={nome} className="h-full w-full object-cover" />
        ) : (
          <span className="tracking-tight">{iniciais(nome)}</span>
        )}
      </div>
      {/* brilho "glass" — só no topo, não interfere com a foto por baixo */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-white/0 to-transparent" />
    </div>
  );
}
