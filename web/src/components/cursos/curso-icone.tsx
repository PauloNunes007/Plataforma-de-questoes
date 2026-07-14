"use client";

// Renderiza o ícone Lucide da identidade de curso (chave `icone` do registro em
// lib/cursos/registro.ts). Switch explícito em vez de `const Icone = MAP[k]`
// pra respeitar a regra react-hooks/static-components do compilador React 19.
import {
  Atom,
  BarChart3,
  Bot,
  Building2,
  Code2,
  Cog,
  Compass,
  Cpu,
  Droplet,
  FlaskConical,
  Layers,
  Leaf,
  Plane,
  Radio,
  Ship,
  Sigma,
  TrendingUp,
  Zap,
} from "lucide-react";

export function CursoIcone({
  icone,
  size = 24,
  strokeWidth = 1.8,
  className,
}: {
  icone: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const p = { size, strokeWidth, className, "aria-hidden": true } as const;
  switch (icone) {
    case "radio":
      return <Radio {...p} />;
    case "cpu":
      return <Cpu {...p} />;
    case "code":
      return <Code2 {...p} />;
    case "bot":
      return <Bot {...p} />;
    case "cog":
      return <Cog {...p} />;
    case "building":
      return <Building2 {...p} />;
    case "trending":
      return <TrendingUp {...p} />;
    case "flask":
      return <FlaskConical {...p} />;
    case "leaf":
      return <Leaf {...p} />;
    case "layers":
      return <Layers {...p} />;
    case "plane":
      return <Plane {...p} />;
    case "droplet":
      return <Droplet {...p} />;
    case "ship":
      return <Ship {...p} />;
    case "zap":
      return <Zap {...p} />;
    case "atom":
      return <Atom {...p} />;
    case "sigma":
      return <Sigma {...p} />;
    case "chart":
      return <BarChart3 {...p} />;
    default:
      return <Compass {...p} />;
  }
}
