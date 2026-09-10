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
      initial={semMovimento ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
  const cor =
    tom === "bom"
      ? "text-questly-green-dark dark:text-questly-green"
      : tom === "atencao"
        ? "text-questly-gold-dark"
        : tom === "critico"
          ? "text-questly-red-dark"
          : "text-foreground";

  const corpo = (
    <>
      <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        <span className="truncate">{rotulo}</span>
        {href && <ChevronRight size={12} className="ml-auto shrink-0" />}
      </span>
      <p className={`tnum mt-1 font-heading text-[24px] font-bold leading-none ${cor}`}>{valor}</p>
      <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{detalhe}</p>
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="surface-interativa block p-3.5">
        {corpo}
      </Link>
    );
  }
  return <div className="surface p-3.5">{corpo}</div>;
}
