"use client";

// Mascote da Questly — capivara de CORPO INTEIRO desenhada em SVG (não a
// foto de referência). Sombreamento com gradientes radiais pra dar um ar
// 2.5D, colete + gravata verdes da marca, sombra no chão, e vida: flutua/
// balança de leve (parece esperando na trilha) e pisca de tempos em
// tempos. Respeita prefers-reduced-motion. Escalável pelo `size` (altura).
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function Mascote({ size = 72, className = "" }: { size?: number; className?: string }) {
  const reduzir = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${uid}-${n}`;
  const w = size * (110 / 132);

  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: w, height: size }} aria-hidden>
      {/* sombra no chão (fica parada; só o corpo flutua) */}
      <svg viewBox="0 0 110 132" width={w} height={size} className="absolute inset-0">
        <ellipse cx="55" cy="126" rx="26" ry="5.5" fill="rgba(0,0,0,0.18)" />
      </svg>

      <motion.svg
        viewBox="0 0 110 132"
        width={w}
        height={size}
        className="absolute inset-0 [filter:drop-shadow(0_3px_4px_rgba(0,0,0,0.15))]"
        animate={reduzir ? undefined : { y: [0, -4, 0], rotate: [-1.4, 1.4, -1.4] }}
        transition={reduzir ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id={g("fur")} cx="42%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#cd9160" />
            <stop offset="100%" stopColor="#9a6535" />
          </radialGradient>
          <radialGradient id={g("muzzle")} cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#e0bd8c" />
            <stop offset="100%" stopColor="#c69a67" />
          </radialGradient>
          <radialGradient id={g("nose")} cx="42%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#6d4a30" />
            <stop offset="100%" stopColor="#4b3120" />
          </radialGradient>
          <linearGradient id={g("colete")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--questly-green)" />
            <stop offset="100%" stopColor="var(--questly-green-deep)" />
          </linearGradient>
        </defs>

        {/* pernas + patas */}
        <rect x="38" y="102" width="13" height="20" rx="6" fill="#8a5a30" />
        <rect x="59" y="102" width="13" height="20" rx="6" fill="#8a5a30" />
        <ellipse cx="44" cy="122" rx="9" ry="5" fill="#6b4324" />
        <ellipse cx="66" cy="122" rx="9" ry="5" fill="#6b4324" />

        {/* braços (atrás do colete) */}
        <rect x="20" y="74" width="12" height="26" rx="6" fill="#a06a38" />
        <rect x="78" y="74" width="12" height="26" rx="6" fill="#a06a38" />
        <circle cx="26" cy="100" r="5.5" fill="#8a5a30" />
        <circle cx="84" cy="100" r="5.5" fill="#8a5a30" />

        {/* torso com colete verde */}
        <path d="M30 74 Q30 66 40 65 L70 65 Q80 66 80 74 L80 96 Q80 108 68 108 L42 108 Q30 108 30 96 Z" fill={`url(#${g("colete")})`} />
        <path d="M32 70 Q42 66 55 66 Q68 66 78 70 L78 76 Q66 71 55 71 Q44 71 32 76 Z" fill="#ffffff" opacity="0.16" />

        {/* gola branca em V + gravata */}
        <path d="M45 65 L55 76 L65 65 L59 65 L55 70 L51 65 Z" fill="#f4f1ea" />
        <rect x="51" y="72" width="8" height="6" rx="2" fill="var(--questly-green-deep)" />
        <path d="M55 77 L50.5 84 L55 100 L59.5 84 Z" fill="var(--questly-green-deep)" />
        <path d="M52.5 80 L55 78 L57.5 80 L55 83 Z" fill="#ffffff" opacity="0.18" />

        {/* orelhas pequenas e laterais */}
        <ellipse cx="30" cy="18" rx="7" ry="6.5" fill="#8a5a30" />
        <ellipse cx="80" cy="18" rx="7" ry="6.5" fill="#8a5a30" />
        <ellipse cx="30" cy="19" rx="3.2" ry="3" fill="#6b4324" />
        <ellipse cx="80" cy="19" rx="3.2" ry="3" fill="#6b4324" />

        {/* cabeça blocky de capivara */}
        <rect x="22" y="8" width="66" height="62" rx="22" fill={`url(#${g("fur")})`} />

        {/* focinho */}
        <ellipse cx="55" cy="50" rx="24" ry="17.5" fill={`url(#${g("muzzle")})`} />

        {/* sobrancelhas */}
        <path d="M36 26 Q42 22.8 48 26" stroke="#7a4f2a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M62 26 Q68 22.8 74 26" stroke="#7a4f2a" strokeWidth="2.4" strokeLinecap="round" fill="none" />

        {/* olhos + brilho */}
        <ellipse cx="42" cy="34" rx="5" ry="6" fill="#39241a" />
        <ellipse cx="68" cy="34" rx="5" ry="6" fill="#39241a" />
        <circle cx="40.4" cy="31.8" r="1.5" fill="#fff" />
        <circle cx="66.4" cy="31.8" r="1.5" fill="#fff" />

        {/* pálpebras (piscada) */}
        {!reduzir && (
          <>
            <motion.ellipse
              cx="42" cy="34" rx="5.6" ry="6.4" fill="#b07a48"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
            />
            <motion.ellipse
              cx="68" cy="34" rx="5.6" ry="6.4" fill="#b07a48"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
            />
          </>
        )}

        {/* nariz (morrillo) + narinas */}
        <rect x="45" y="36" width="20" height="13.5" rx="6.5" fill={`url(#${g("nose")})`} />
        <ellipse cx="51" cy="42.5" rx="1.6" ry="2.3" fill="#241610" />
        <ellipse cx="59" cy="42.5" rx="1.6" ry="2.3" fill="#241610" />

        {/* boca */}
        <path d="M48 54 Q55 60 62 54" stroke="#6b4a30" strokeWidth="2.1" strokeLinecap="round" fill="none" />
      </motion.svg>
    </span>
  );
}
