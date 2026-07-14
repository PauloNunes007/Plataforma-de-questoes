"use client";

// Card do hub /questoes com tilt 3D no mouse (mesma física da carta TCG do
// ranking — ver student-card-modal.tsx: useMotionValue + useSpring
// acompanhando a posição do cursor). No celular não tem hover, então o
// "legal" vira feedback de toque (scale no press) + o shimmer holográfico
// que já roda sozinho, sem precisar de mouse.
import { useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function HubTiltCard({
  href,
  Icone,
  corA,
  corB,
  titulo,
  tituloDestaque,
  descricao,
}: {
  href: string;
  Icone: LucideIcon;
  corA: string;
  corB: string;
  titulo: string;
  tituloDestaque: string;
  descricao: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 18 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateY.set(px * 12);
    rotateX.set(-py * 10);
  }

  function onMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 900 }}
    >
      <Link href={href} className="block" style={{ transformStyle: "preserve-3d" }}>
        <motion.div
          style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
          className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[22px] p-6 shadow-xl shadow-black/10 sm:min-h-[480px] sm:p-8"
        >
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(150deg, ${corA}, ${corB})` }}
          />
          {/* respingos decorativos — sem foto real, mantém o clima "colagem" sem inventar imagem de pessoa */}
          <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/12 blur-md" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-black/10 blur-md" />
          <Sparkle className="left-[12%] top-[18%]" delay={0} />
          <Sparkle className="right-[16%] top-[30%]" delay={0.6} />
          <Sparkle className="bottom-[38%] left-[22%]" delay={1.2} />
          <Sparkle className="right-[24%] top-[58%]" delay={1.8} />

          {/* ícone gigante desbotado — ocupa o espaço que ficaria vazio no card alto, sem depender de foto */}
          <motion.span
            className="pointer-events-none absolute -bottom-10 -right-10 text-white/15"
            initial={{ rotate: -8, scale: 0.94 }}
            animate={{ rotate: [-8, -4, -8], scale: [0.94, 1, 0.94] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icone size={220} strokeWidth={1} className="hidden sm:block" />
            <Icone size={140} strokeWidth={1} className="sm:hidden" />
          </motion.span>

          {/* shimmer holográfico contínuo — o "legal no celular" que não depende de mouse */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 z-10 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: "-140%" }}
            animate={{ x: ["-140%", "260%"] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
          />

          {/* flex-1 (não h-full: height:100% não resolve contra um pai
              com só min-height) — é o que empurra o CTA pro pé do card,
              longe do texto. */}
          <div
            className="relative z-20 flex flex-1 flex-col"
            style={{ transform: "translateZ(30px)" }}
          >
            <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm sm:h-16 sm:w-16">
              <Icone size={26} strokeWidth={1.8} className="sm:hidden" />
              <Icone size={30} strokeWidth={1.8} className="hidden sm:block" />
            </span>
            <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.25)] sm:text-[28px]">
              {titulo}
              <br />
              <span className="font-extrabold">{tituloDestaque}</span>
            </h2>
            {/* mb-8 garante respiro mínimo entre o texto e o CTA mesmo
                quando o card está na altura mínima */}
            <p className="mb-8 mt-3 max-w-[300px] text-[13.5px] leading-relaxed text-white/85 sm:text-[14.5px]">
              {descricao}
            </p>

            <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform group-hover:translate-x-0.5">
              Começar
              <ArrowRight size={15} strokeWidth={2.25} />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function Sparkle({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.span
      className={`pointer-events-none absolute text-white/70 ${className}`}
      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
      transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      ✦
    </motion.span>
  );
}
