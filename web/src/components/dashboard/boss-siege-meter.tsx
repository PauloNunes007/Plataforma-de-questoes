"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Lock,
  Map as MapIcon,
  Swords,
  Target,
} from "lucide-react";
import type { BossAlvo, DiaTicker } from "@/lib/questly/dashboard-data";

type BossSiegeMeterProps = {
  bossAlvo: BossAlvo | null;
  hasSubjects: boolean;
  dayTicker: DiaTicker[];
  missoesPendentesIds: string[];
};

// Painel do Boss (redesign 2026-07): sai o gradiente laranja gritante,
// entra um "painel de guerra" sóbrio — a nota projetada é o número
// protagonista, com cor semântica (verde/âmbar/vermelho) e um brilho
// ambiente sutil. O ticker de dias vira uma régua discreta no rodapé.
export function BossSiegeMeter({
  bossAlvo,
  hasSubjects,
  dayTicker,
  missoesPendentesIds,
}: BossSiegeMeterProps) {
  const router = useRouter();

  if (!hasSubjects) {
    return (
      <EstadoVazio
        titulo="Sua campanha nasce aqui"
        descricao="Configure suas disciplinas e as datas das provas pra desbloquear seu primeiro Boss."
        href="/onboarding"
        cta="Configurar agora"
      />
    );
  }

  if (!bossAlvo) {
    return (
      <EstadoVazio
        titulo="Nenhum Boss no horizonte"
        descricao="Cadastre a data da sua próxima prova pra começar o cerco."
        href="/configuracoes"
        cta="Cadastrar prova"
      />
    );
  }

  const handleHojeClick = () => {
    if (missoesPendentesIds.length === 1) {
      router.push(`/questao?missao=${missoesPendentesIds[0]}`);
    } else if (missoesPendentesIds.length > 1) {
      document.getElementById("missoes-do-dia")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  // A nota projetada é o número protagonista quando o motor tem dados;
  // sem dados ainda (cold-start), o card recua pro preparo (cobertura).
  const temProjecao = bossAlvo.notaProjetada != null;
  const valorPrincipal = bossAlvo.notaProjetada ?? Math.round(bossAlvo.preparoPercentual);
  const corValor =
    valorPrincipal >= 70
      ? "text-questly-green"
      : valorPrincipal >= 50
        ? "text-questly-orange"
        : "text-questly-red";
  const corBarra =
    valorPrincipal >= 70
      ? "bg-questly-green"
      : valorPrincipal >= 50
        ? "bg-questly-orange"
        : "bg-questly-red";

  return (
    <div className="surface relative overflow-hidden rounded-2xl p-5 sm:p-6">
      {/* brilho ambiente sutil na cor do boss — destaque, não decoração */}
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full opacity-[0.07] blur-2xl dark:opacity-[0.1]"
        style={{ background: "var(--questly-orange)" }}
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-questly-orange">
            <Swords size={13} strokeWidth={2} />
            Próximo Boss
          </span>
          <span className="tnum rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {bossAlvo.diasAteProva === 0
              ? "é hoje"
              : `em ${bossAlvo.diasAteProva} ${bossAlvo.diasAteProva === 1 ? "dia" : "dias"}`}
          </span>
        </div>

        <h2 className="font-heading text-xl font-semibold tracking-tight">{bossAlvo.bossNome}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{bossAlvo.subjectNome}</p>

        {/* PROTAGONISTA: nota projetada pro dia da prova */}
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <span className={`tnum block font-heading text-[44px] font-semibold leading-none tracking-tight ${corValor}`}>
              {valorPrincipal}
              <span className="text-[22px] font-medium text-muted-foreground">%</span>
            </span>
            <span className="mt-1.5 block text-xs text-muted-foreground">
              {temProjecao ? "nota projetada pro dia da prova" : "preparo (conteúdo coberto)"}
            </span>
          </div>
          {temProjecao && bossAlvo.emRiscoCount > 0 && (
            <Link
              href="/trilha"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-questly-orange-light px-3 py-1.5 text-xs font-medium text-questly-orange-dark transition-colors hover:brightness-95"
            >
              <AlertTriangle size={13} strokeWidth={2} />
              <span className="tnum">{bossAlvo.emRiscoCount}</span>
              {bossAlvo.emRiscoCount === 1 ? "tópico em risco" : "tópicos em risco"}
            </Link>
          )}
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={`h-full rounded-full ${corBarra}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, valorPrincipal)}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="mt-2 mb-5 text-xs text-muted-foreground">
          {temProjecao && (
            <span className="tnum">{Math.round(bossAlvo.preparoPercentual)}% do conteúdo coberto</span>
          )}
          {temProjecao && bossAlvo.chanceAprovacao != null && " · "}
          {bossAlvo.chanceAprovacao != null && (
            <span className="tnum">chance de aprovação {bossAlvo.chanceAprovacao}%</span>
          )}
        </div>

        {/* Régua de ritmo: passado → hoje → até o boss */}
        <div className="flex items-end justify-between gap-1.5 border-t border-border pt-4 sm:justify-start sm:gap-3">
          {dayTicker.map((dia) => {
            const isHoje = dia.estado === "hoje";
            return (
              <button
                key={dia.data}
                type="button"
                onClick={isHoje ? handleHojeClick : undefined}
                disabled={!isHoje}
                title={isHoje ? "Ir pra missão de hoje" : undefined}
                className={`flex flex-col items-center gap-1.5 ${isHoje ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    isHoje ? "text-questly-green" : "text-muted-foreground/70"
                  }`}
                >
                  {isHoje ? "Hoje" : dia.label}
                </span>
                <span className="relative flex h-9 w-9 items-center justify-center">
                  {isHoje && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border border-questly-green"
                      animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                      dia.estado === "feito"
                        ? "border-transparent bg-questly-green-light text-questly-green"
                        : dia.estado === "perdido"
                          ? "border-border bg-transparent text-muted-foreground/40"
                          : isHoje
                            ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                            : "border-dashed border-border bg-transparent text-muted-foreground/40"
                    }`}
                  >
                    {dia.estado === "feito" && <Check size={15} strokeWidth={2.25} />}
                    {dia.estado === "perdido" && <span className="text-sm leading-none">·</span>}
                    {isHoje && <Target size={15} strokeWidth={2.25} />}
                    {dia.estado === "bloqueado" && <Lock size={13} strokeWidth={1.75} />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EstadoVazio({
  titulo,
  descricao,
  href,
  cta,
}: {
  titulo: string;
  descricao: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="surface flex flex-col items-center rounded-2xl px-6 py-10 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-questly-orange-light">
        <MapIcon size={18} strokeWidth={1.75} className="text-questly-orange" />
      </span>
      <p className="mb-1 text-[15px] font-medium">{titulo}</p>
      <p className="mb-5 max-w-[380px] text-sm text-muted-foreground">{descricao}</p>
      <Link
        href={href}
        className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
      >
        {cta}
      </Link>
    </div>
  );
}
