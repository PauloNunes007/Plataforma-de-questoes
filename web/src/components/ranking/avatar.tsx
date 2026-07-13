// Avatar redondo com foto (Storage) ou iniciais em gradiente — mesmo
// fallback do app legado (questlyRenderAvatar em js/supabase-client.js),
// reimplementado como componente em vez de manipulação direta de DOM.
type AvatarProps = {
  nome: string;
  fotoUrl: string | null;
  size?: number;
  gradientClassName?: string;
  className?: string;
};

export function RankAvatar({
  nome,
  fotoUrl,
  size = 40,
  gradientClassName = "from-questly-green to-questly-green-deep",
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white ${gradientClassName} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
    >
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt={nome} className="h-full w-full object-cover" />
      ) : (
        nome.charAt(0).toUpperCase()
      )}
    </div>
  );
}
