"use client";

// Faixa de métricas da home — os quatro números que respondem "como eu estou?".
//
// Consolida o que antes estavam espalhados em três lugares diferentes da mesma
// tela: o donut "Questões feitas" (um cartão inteiro pra dois números), o
// cartão "Comparativo" no rail e o tile de ranking dentro do hero. Eram três
// cartões, três estilos e duas repetições — agora é uma linha.
//
// Regra de honestidade herdada de chance-aprovacao.ts: sem amostra, o número
// não é inventado — a célula diz o que falta em vez de mostrar 0%.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, ChevronRight, Target, Trophy, Users } from "lucide-react";
import type { HeroDados } from "@/lib/dashboard/hero-data";
import type { ComparativoSemana } from "@/lib/questly/dashboard-data";

export function MetricasStrip({
  hero,
  comparativo,
}: {
  hero: HeroDados;
  comparativo: ComparativoSemana;
}) {
  const semMovimento = useReducedMotion();
  const temQuestoes = hero.totalQuestoes > 0;

  return (
    <motion.section
      // Com reduced-motion a faixa já nasce no estado final.
      initial={semMovimento ? "visivel" : "oculto"}
      animate="visivel"
      variants={{ visivel: { transition: { staggerChildren: 0.04 } } }}
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {/* Aproveitamento — o número que o aluno mais quer ver, com a barra
          acerto/erro embutida no lugar do donut que ocupava um cartão. */}
      <Celula
        icone={<Target size={13} />}
        rotulo="Aproveitamento"
        valor={temQuestoes ? `${hero.pctAcerto}%` : "—"}
        detalhe={
          temQuestoes
            ? `${hero.acertos.toLocaleString("pt-BR")} certas · ${hero.erros.toLocaleString("pt-BR")} erradas`
            : "responda a primeira questão"
        }
        tom={temQuestoes ? faixa(hero.pctAcerto) : "neutro"}
      >
        {temQuestoes && (
          <span className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-questly-red/70">
            <span
              className="h-full rounded-full bg-questly-green"
              style={{ width: `${hero.pctAcerto}%` }}
            />
          </span>
        )}
      </Celula>

      <Celula
        icone={<BarChart3 size={13} />}
        rotulo="Questões"
        valor={hero.totalQuestoes.toLocaleString("pt-BR")}
        detalhe="resolvidas na vida toda"
      />

      <Celula
        icone={<Trophy size={13} />}
        rotulo="Ranking geral"
        valor={`${hero.posicaoGeral.toLocaleString("pt-BR")}º`}
        detalhe={`entre ${hero.totalAlunos.toLocaleString("pt-BR")} alunos`}
        href="/ranking"
      />

      <Celula
        icone={<Users size={13} />}
        rotulo="Nesta semana"
        valor={comparativo.percentil != null ? `top ${comparativo.percentil}%` : "—"}
        detalhe={
          comparativo.percentil != null
            ? "dos que mais pontuaram"
            : "pontue esta semana pra comparar"
        }
        tom={comparativo.percentil != null && comparativo.percentil <= 25 ? "bom" : "neutro"}
      />
    </motion.section>
  );
}

function faixa(pct: number): "bom" | "atencao" | "critico" {
  if (pct >= 70) return "bom";
  if (pct >= 50) return "atencao";
  return "critico";
}

function Celula({
  icone,
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
  href,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  detalhe: string;
  tom?: "neutro" | "bom" | "atencao" | "critico";
  href?: string;
  children?: React.ReactNode;
}) {
  // O tom pinta o NÚMERO e o chip do ícone. A cor nunca é o único sinal: o
  // valor e o texto de detalhe já dizem a mesma coisa por escrito.
  const cor =
    tom === "bom"
      ? "text-questly-green-dark dark:text-questly-green"
      : tom === "atencao"
        ? "text-questly-gold-dark"
        : tom === "critico"
          ? "text-questly-red-dark"
          : "text-foreground";

  const chip =
    tom === "bom"
      ? "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
      : tom === "atencao"
        ? "bg-questly-gold-light text-questly-gold-dark"
        : tom === "critico"
          ? "bg-questly-red-light text-questly-red-dark"
          : "bg-muted text-muted-foreground";

  const corpo = (
    <>
      <span className="flex items-center gap-2">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${chip}`}>
          {icone}
        </span>
        <span className="truncate text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
        {href && <ChevronRight size={13} className="ml-auto shrink-0 text-muted-foreground" />}
      </span>
      <p className={`tnum mt-2 font-heading text-[26px] font-bold leading-none tracking-tight ${cor}`}>
        {valor}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{detalhe}</p>
      {children}
    </>
  );

  const entrada = {
    oculto: { opacity: 0, y: 8 },
    visivel: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
  };

  if (href) {
    return (
      <motion.div variants={entrada}>
        <Link href={href} className="surface-interativa block h-full p-4">
          {corpo}
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.div variants={entrada} className="surface h-full p-4">
      {corpo}
    </motion.div>
  );
}
