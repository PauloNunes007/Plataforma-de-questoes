"use client";

// Mascote da Questly — a capivara de terno da landing (public/mascote.png),
// redesenhada em SVG de CORPO INTEIRO fiel à arte original: mesma paleta
// caramelo, sobrancelhas, olhos castanhos com íris, focinho enorme com
// narinas, sorriso com dentinhos, e o terno verde com lapelas + camisa
// branca + gravata + suéter escuro. Sombreamento com gradientes radiais
// pra manter o ar 3D do render. A animação de idle é uma "respiração"
// (squash & stretch com transform-origin nos PÉS) — os pés ficam sempre
// plantados na sombra do chão, nada de flutuar. Pisca de tempos em tempos.
// Respeita prefers-reduced-motion. Escalável pelo `size` (altura).
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

const VB_W = 140;
const VB_H = 160;

export function Mascote({ size = 84, className = "" }: { size?: number; className?: string }) {
  const reduzir = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${uid}-${n}`;
  const w = size * (VB_W / VB_H);

  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: w, height: size }} aria-hidden>
      {/* sombra no chão (fica parada; o corpo respira em cima dela) */}
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={w} height={size} className="absolute inset-0">
        <ellipse cx="70" cy="152" rx="34" ry="6" fill="rgba(0,0,0,0.16)" />
      </svg>

      <motion.svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width={w}
        height={size}
        className="absolute inset-0 [filter:drop-shadow(0_3px_4px_rgba(0,0,0,0.14))]"
        style={{ transformOrigin: "50% 96%" }}
        animate={reduzir ? undefined : { scaleY: [1, 1.03, 1], scaleX: [1, 0.99, 1], rotate: [-0.5, 0.5, -0.5] }}
        transition={reduzir ? undefined : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id={g("fur")} cx="46%" cy="24%" r="85%">
            <stop offset="0%" stopColor="#cf9d66" />
            <stop offset="55%" stopColor="#bf8a52" />
            <stop offset="100%" stopColor="#96662f" />
          </radialGradient>
          <radialGradient id={g("muzzle")} cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#dfba8c" />
            <stop offset="100%" stopColor="#bd8f5c" />
          </radialGradient>
          <radialGradient id={g("nose")} cx="45%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#b98d6c" />
            <stop offset="100%" stopColor="#8a5f42" />
          </radialGradient>
          <linearGradient id={g("jacket")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#237a52" />
            <stop offset="100%" stopColor="#14523a" />
          </linearGradient>
          <linearGradient id={g("sweater")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#186044" />
            <stop offset="100%" stopColor="#0f4630" />
          </linearGradient>
          <linearGradient id={g("tie")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#33ac67" />
            <stop offset="100%" stopColor="#218a50" />
          </linearGradient>
        </defs>

        {/* orelhas (atrás da cabeça) */}
        <ellipse cx="44" cy="12" rx="10" ry="9" fill="#8f5d32" />
        <ellipse cx="96" cy="12" rx="10" ry="9" fill="#8f5d32" />
        <ellipse cx="44.5" cy="13" rx="5" ry="4.5" fill="#6a4222" />
        <ellipse cx="95.5" cy="13" rx="5" ry="4.5" fill="#6a4222" />

        {/* mangas do paletó + patas (atrás do corpo) */}
        <rect x="26" y="96" width="14" height="26" rx="7" fill="#175a3e" />
        <rect x="100" y="96" width="14" height="26" rx="7" fill="#175a3e" />
        <circle cx="33" cy="123" r="6.5" fill="#8a5a30" />
        <circle cx="107" cy="123" r="6.5" fill="#8a5a30" />

        {/* pernas + pés (atrás do paletó, plantados no chão) */}
        <rect x="48" y="126" width="15" height="20" rx="7" fill="#8a5a30" />
        <rect x="77" y="126" width="15" height="20" rx="7" fill="#8a5a30" />
        <ellipse cx="56" cy="147" rx="12.5" ry="6" fill="#6f4626" />
        <ellipse cx="84" cy="147" rx="12.5" ry="6" fill="#6f4626" />

        {/* corpo: paletó verde */}
        <path
          d="M32 128 L32 100 C32 86 44 78 58 76 L82 76 C96 78 108 86 108 100 L108 128 C108 134 104 137 98 137 L42 137 C36 137 32 134 32 128 Z"
          fill={`url(#${g("jacket")})`}
        />

        {/* suéter escuro no peito */}
        <path
          d="M54 78 L86 78 L86 126 C86 130 83 132 79 132 L61 132 C57 132 54 130 54 126 Z"
          fill={`url(#${g("sweater")})`}
        />

        {/* camisa branca em V + colarinho (abaixo do queixo) */}
        <path d="M55 81 L70 102 L85 81 Z" fill="#f7f4ec" />
        <path d="M55 81 L62 81 L58.5 88.5 Z" fill="#ffffff" />
        <path d="M85 81 L78 81 L81.5 88.5 Z" fill="#ffffff" />

        {/* gravata */}
        <path d="M66 87.5 L74 87.5 L75.5 93.5 L70 97 L64.5 93.5 Z" fill={`url(#${g("tie")})`} />
        <path d="M65.5 95.5 L74.5 95.5 L72.5 118 L70 121 L67.5 118 Z" fill={`url(#${g("tie")})`} />

        {/* lapelas finas acompanhando o V */}
        <path d="M55 81 L70 102 L65.5 106.5 C54.5 97 48.8 88 48.2 81.8 C50.5 81.2 52.7 81 55 81 Z" fill="#1b6848" />
        <path d="M85 81 L70 102 L74.5 106.5 C85.5 97 91.2 88 91.8 81.8 C89.5 81.2 87.3 81 85 81 Z" fill="#1b6848" />
        <path d="M55 81 L70 102" stroke="#0e3d2a" strokeWidth="1.2" fill="none" opacity="0.45" />
        <path d="M85 81 L70 102" stroke="#0e3d2a" strokeWidth="1.2" fill="none" opacity="0.45" />

        {/* cabeça: larga, topo achatado, bochechas de capivara */}
        <path
          d="M70 4 C46 4 27 19 24.5 42 C22.5 61 34 82 70 82 C106 82 117.5 61 115.5 42 C113 19 94 4 70 4 Z"
          fill={`url(#${g("fur")})`}
        />
        {/* brilho no topo */}
        <ellipse cx="60" cy="16" rx="24" ry="8" fill="#ffffff" opacity="0.10" />
        {/* traços de pelo nas laterais */}
        <path d="M30 46 Q28 52 30 58" stroke="#9c6a38" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M35 54 Q33 60 35.5 66" stroke="#9c6a38" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.45" />
        <path d="M110 46 Q112 52 110 58" stroke="#9c6a38" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M105 54 Q107 60 104.5 66" stroke="#9c6a38" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.45" />

        {/* sobrancelhas */}
        <path d="M36 30 Q43 25.5 50 29" stroke="#8a5327" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M90 29 Q97 25.5 104 30" stroke="#8a5327" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* olhos castanhos com íris + brilho */}
        <ellipse cx="44" cy="40" rx="6" ry="5.4" fill="#4a2e18" />
        <ellipse cx="96" cy="40" rx="6" ry="5.4" fill="#4a2e18" />
        <circle cx="44" cy="40" r="3.6" fill="#7c4a22" />
        <circle cx="96" cy="40" r="3.6" fill="#7c4a22" />
        <circle cx="44" cy="40.4" r="1.9" fill="#241407" />
        <circle cx="96" cy="40.4" r="1.9" fill="#241407" />
        <circle cx="42.6" cy="38.4" r="1.4" fill="#fff" />
        <circle cx="94.6" cy="38.4" r="1.4" fill="#fff" />

        {/* pálpebras (piscada) */}
        {!reduzir && (
          <>
            <motion.ellipse
              cx="44" cy="40" rx="6.6" ry="6" fill="#b07c48"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
            />
            <motion.ellipse
              cx="96" cy="40" rx="6.6" ry="6" fill="#b07c48"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
            />
          </>
        )}

        {/* focinho enorme (marca da capivara) */}
        <path
          d="M70 30 C55 30 47 41 46 55 C45 70 54 80 70 80 C86 80 95 70 94 55 C93 41 85 30 70 30 Z"
          fill={`url(#${g("muzzle")})`}
        />

        {/* nariz grandão + narinas */}
        <rect x="54" y="38" width="32" height="21" rx="10" fill={`url(#${g("nose")})`} />
        <ellipse cx="62" cy="52" rx="2.7" ry="3.7" fill="#3a2313" transform="rotate(-14 62 52)" />
        <ellipse cx="78" cy="52" rx="2.7" ry="3.7" fill="#3a2313" transform="rotate(14 78 52)" />

        {/* filtro + sorriso */}
        <path d="M70 59 L70 64.5" stroke="#6f4526" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M57 65 Q70 74 83 65" stroke="#6f4526" strokeWidth="2.6" strokeLinecap="round" fill="none" />

        {/* dentinhos */}
        <path d="M64.5 69.5 L75.5 69.5 L75.5 74 C75.5 76.5 73.5 78 70 78 C66.5 78 64.5 76.5 64.5 74 Z" fill="#f7f2e8" />
        <path d="M70 69.5 L70 77.5" stroke="#d9cdb4" strokeWidth="1.2" />
      </motion.svg>
    </span>
  );
}
