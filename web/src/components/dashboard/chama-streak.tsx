"use client";

// A chama do streak. Desenhada à mão em SVG, não o ícone genérico de lapela:
// o streak é o número que o aluno mais olha na home e o fogo é o símbolo dele.
//
// Por que não `<Flame>` do lucide: ícone de contorno de 1,5px em 44px vira um
// rabisco vazio; e por que não emoji 🔥: fonte do sistema, muda de desenho por
// plataforma e não segue a paleta (ver o cabeçalho de insignias/insignia.tsx).
//
// Construção: três camadas de fogo (externa quente, interna clara, brasa
// branca) com gradientes verticais e um halo desfocado atrás. Elas respiram em
// contratempo (durações 2,4s / 1,7s / 2,9s), que é o que dá vida sem virar
// GIF piscando — e param inteiras com prefers-reduced-motion.
//
// `apagada` (streak zerado) troca o fogo por um contorno cinza: o estado
// "ainda não acendeu" tem que ser legível sem depender da cor.

import { motion, useReducedMotion } from "framer-motion";

export function ChamaStreak({
  size = 56,
  apagada = false,
  className = "",
}: {
  size?: number;
  apagada?: boolean;
  className?: string;
}) {
  const semMovimento = useReducedMotion();
  const anima = !semMovimento && !apagada;

  const respirar = (duracao: number, escala: number) =>
    anima
      ? {
          animate: { scaleY: [1, escala, 1], scaleX: [1, 2 - escala, 1] },
          transition: { duration: duracao, repeat: Infinity, ease: "easeInOut" as const },
        }
      : {};

  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* halo quente atrás — some quando a chama está apagada */}
      {!apagada && (
        <motion.span
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.55), transparent 68%)" }}
          animate={anima ? { opacity: [0.55, 0.85, 0.55] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="relative"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="chama-externa" x1="32" y1="62" x2="32" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#c2410c" />
            <stop offset="0.35" stopColor="#f97316" />
            <stop offset="0.75" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id="chama-interna" x1="32" y1="60" x2="32" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fb923c" />
            <stop offset="0.5" stopColor="#fcd34d" />
            <stop offset="1" stopColor="#fffbeb" />
          </linearGradient>
          <linearGradient id="chama-brasa" x1="32" y1="58" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff7ed" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Corpo da chama: base larga, lambida à esquerda, ponta torcida. */}
        <motion.path
          d="M32 3C38 14 44 20 48 27c4 6 5 10 5 14 0 11-9 20-21 20S11 52 11 41c0-7 3-13 8-17-1 5 1 8 4 9-3-10 0-21 9-30Z"
          fill={apagada ? "none" : "url(#chama-externa)"}
          stroke={apagada ? "currentColor" : "none"}
          strokeWidth={apagada ? 3 : 0}
          strokeLinejoin="round"
          className={apagada ? "text-muted-foreground/45" : ""}
          style={{ transformOrigin: "32px 61px" }}
          {...respirar(2.4, 1.05)}
        />

        {!apagada && (
          <>
            <motion.path
              d="M32 20c4 8 9 13 11 19 2 5 1 11-3 15-3 3-6 4-8 4s-5-1-8-4c-4-4-5-10-3-15 2-6 7-11 11-19Z"
              fill="url(#chama-interna)"
              style={{ transformOrigin: "32px 58px" }}
              {...respirar(1.7, 1.09)}
            />
            <motion.path
              d="M32 36c2 5 5 8 6 12 1 4-2 8-6 8s-7-4-6-8c1-4 4-7 6-12Z"
              fill="url(#chama-brasa)"
              style={{ transformOrigin: "32px 56px" }}
              {...respirar(2.9, 1.12)}
            />
          </>
        )}
      </svg>
    </span>
  );
}
