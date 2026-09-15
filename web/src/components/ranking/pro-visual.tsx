"use client";

// Acabamento visual de quem assina o Pro dentro do RANKING (pedido do
// usuário, 2026-09-10): o selo saiu do lado do perfil e virou identidade
// pública — quem olha o ranking ou abre o card do aluno percebe na hora.
//
// Regra de estilo: nada aqui inventa hierarquia nova de mérito. A liga
// continua sendo o que diz quanto a pessoa estudou; o Pro só muda o
// ACABAMENTO (moldura prismática, foil, aro dourado) — como uma edição
// especial da mesma carta, não uma carta melhor.
import { motion } from "framer-motion";
import { ProMark } from "@/components/plano/pro-ui";

// Moldura "foil prismático" — substitui LIGA_FRAME no card do assinante.
export const PRO_FRAME = "from-[#f6d97a] via-[#c9903a] to-[#8a5cd6]";

// Aro dourado do avatar nas listas do ranking.
export const PRO_ARO = "ring-2 ring-questly-gold ring-offset-2 ring-offset-card";

/** Brilho prismático contínuo por cima do card (só assinante). */
export function ProFoil() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 mix-blend-overlay"
      style={{
        background:
          "linear-gradient(115deg, transparent 30%, rgba(255,214,120,0.55) 42%, rgba(255,255,255,0.7) 50%, rgba(160,120,255,0.5) 58%, transparent 70%)",
        backgroundSize: "260% 100%",
      }}
      animate={{ backgroundPosition: ["140% 0%", "-40% 0%"] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Selo "PRO" impresso no card — chapa de metal com a marca da assinatura.
 *  Aqui o dourado CHEIO se justifica (é uma carta comemorativa, não um botão
 *  de UI), mas o motivo é o mesmo galão do resto do app — a coroa saiu. */
export function ProSelo({ className = "" }: { className?: string }) {
  return (
    <span
      title="Assinante Questly Pro"
      className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-br from-[#fbe6a4] via-[#d9a52a] to-[#a6760c] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.14em] text-[#2a1d02] shadow-sm ring-1 ring-white/40 ${className}`}
    >
      <ProMark size={9} strokeWidth={2.6} />
      Pro
    </span>
  );
}

/** Marca miúda pra sinalizar a linha do assinante nas listas do ranking. */
export function ProMarcaLinha({ className = "" }: { className?: string }) {
  return (
    <span
      title="Assinante Questly Pro"
      aria-label="Assinante Questly Pro"
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-gradient-to-br from-[#fbe6a4] via-[#d9a52a] to-[#a6760c] text-[#2a1d02] shadow-sm ${className}`}
    >
      <ProMark size={9} strokeWidth={2.7} />
    </span>
  );
}
