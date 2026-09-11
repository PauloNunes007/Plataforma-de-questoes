"use client";

// A faixa de identidade da home — o primeiro andar da tela.
//
// Responde "quem eu sou e onde estou" em uma linha: retrato + liga à esquerda,
// e à direita os QUATRO números de progressão que o aluno procura ao abrir o
// app — nível (com a barra de XP), posição no ranking, conquistas e dias
// seguidos. Nada de métrica de estudo aqui (aproveitamento, questões do dia):
// isso é a aba Desempenho, e repetir número entre andares foi exatamente o
// que fez a home anterior virar uma parede.
//
// O bloco do perfil é CLICÁVEL e abre a carta do aluno (o mesmo card TCG do
// ranking) sem sair da home — pedido do usuário.


import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, IdCard, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { LigaEmblema } from "@/components/ranking/liga-emblema";
import { LIGA_COR, LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import { Insignia } from "@/components/insignias/insignia";
import { FocoHojeChip } from "@/components/foco/foco-bar";
import type { Liga } from "@/lib/questly/liga";
import type { HeroDados } from "@/lib/dashboard/hero-data";
import { ChamaStreak } from "./chama-streak";

type PerfilBarProps = {
  nome: string;
  fotoUrl: string | null;
  curso: string | null;
  liga: Liga;
  ligaNome: string;
  nivel: number;
  xpTotal: number;
  xpPorNivel: number;
  streakAtual: number;
  recordeStreak: number;
  hero: HeroDados;
  pro?: boolean;
  onAbrirCarta: () => void;
};

export function PerfilBar({
  nome,
  fotoUrl,
  curso,
  liga,
  ligaNome,
  nivel,
  xpTotal,
  xpPorNivel,
  streakAtual,
  recordeStreak,
  hero,
  pro = false,
  onAbrirCarta,
}: PerfilBarProps) {
  const semMovimento = useReducedMotion();
  const xpNoNivel = xpTotal % xpPorNivel;
  const pctNivel = Math.min(100, (xpNoNivel / xpPorNivel) * 100);
  const cor = LIGA_COR[liga];
  const marcosStreak = 7;

  return (
    <section className="surface relative overflow-hidden p-0">
      {/* brilhos de fundo na cor da liga: dão profundidade sem texto por cima */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full opacity-[0.14] blur-3xl dark:opacity-[0.34]"
        style={{ background: cor }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-questly-blue/10 blur-3xl dark:bg-questly-blue/20"
      />

      <div className="relative flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:gap-6 lg:p-5">
        {/* ------------------------------------------------- identidade */}
        <button
          type="button"
          onClick={onAbrirCarta}
          className="group -m-1 flex min-w-0 cursor-pointer items-center gap-3.5 rounded-2xl p-1 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-questly-green sm:gap-4"
          aria-label="Ver minha carta"
        >
          <span className="relative shrink-0">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full opacity-40 blur-lg"
              style={{ background: cor }}
              animate={semMovimento ? undefined : { scale: [1, 1.14, 1], opacity: [0.4, 0.16, 0.4] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <LigaEmblema liga={liga} size={78} className="relative drop-shadow-xl" />
          </span>

          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-questly-green to-questly-green-deep text-base font-bold text-white transition-transform group-hover:scale-105 dark:text-[#0c1512] ${
                pro ? "ring-2 ring-questly-gold ring-offset-2 ring-offset-card" : "ring-2 ring-border"
              }`}
            >
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                nome.charAt(0).toUpperCase()
              )}
            </span>

            <span className="min-w-0">
              <span className="block truncate font-heading text-[19px] font-semibold leading-tight tracking-tight sm:text-[21px]">
                {nome}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ${LIGA_GRADIENTE[liga]}`}
                >
                  {ligaNome}
                </span>
                {curso && <span className="truncate text-[12px] text-muted-foreground">{curso}</span>}
                <FocoHojeChip />
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground transition-colors group-hover:text-questly-green-dark dark:group-hover:text-questly-green">
                <IdCard size={13} strokeWidth={2.2} />
                Ver minha carta
              </span>
            </span>
          </span>
        </button>

        {/* ------------------------------------------------------ tiles */}
        <div className="grid grid-cols-2 gap-2.5 lg:ml-auto lg:w-[620px] lg:shrink-0 lg:grid-cols-4">
          {/* Nível */}
          <Tile rotulo="Nível" icone={<Zap size={13} strokeWidth={2.3} className="text-questly-purple" />}>
            <p className="tnum font-heading text-[30px] font-bold leading-none tracking-tight">{nivel}</p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-questly-purple to-questly-blue"
                initial={semMovimento ? false : { width: 0 }}
                animate={{ width: `${pctNivel}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="tnum mt-1.5 text-[10.5px] font-medium text-muted-foreground">
              {xpNoNivel.toLocaleString("pt-BR")}/{xpPorNivel.toLocaleString("pt-BR")} XP
            </p>
          </Tile>

          {/* Ranking */}
          <Tile
            rotulo="Ranking"
            href="/ranking"
            icone={<Trophy size={13} strokeWidth={2.3} className="text-questly-gold-dark" />}
          >
            <p className="truncate text-[12px] font-semibold text-muted-foreground">{ligaNome}</p>
            <p className="tnum mt-0.5 font-heading text-[30px] font-bold leading-none tracking-tight">
              {hero.posicaoGeral.toLocaleString("pt-BR")}
              <span className="text-[18px] align-top">º</span>
            </p>
            <p className="tnum mt-1.5 truncate text-[10.5px] font-medium text-muted-foreground">
              de {hero.totalAlunos.toLocaleString("pt-BR")} alunos
            </p>
          </Tile>

          {/* Conquistas */}
          <Tile
            rotulo="Conquistas"
            icone={<Trophy size={13} strokeWidth={2.3} className="text-questly-green-dark dark:text-questly-green" />}
          >
            {hero.conquistas === 0 ? (
              <>
                <p className="tnum font-heading text-[30px] font-bold leading-none text-muted-foreground">0</p>
                <p className="mt-1.5 text-[10.5px] font-medium leading-tight text-muted-foreground">
                  acenda o primeiro brasão
                </p>
              </>
            ) : (
              <>
                <p className="tnum font-heading text-[30px] font-bold leading-none tracking-tight">
                  {hero.conquistas}
                </p>
                <span className="mt-1.5 flex items-center -space-x-1.5">
                  {hero.conquistasLista.slice(0, 4).map((c) => (
                    <Insignia
                      key={c.nome}
                      nome={c.insignia}
                      tom={c.tom}
                      size={26}
                      titulo={c.nome}
                      className="drop-shadow-sm"
                    />
                  ))}
                  {hero.conquistas > 4 && (
                    <span className="tnum !ml-1 text-[10.5px] font-bold text-muted-foreground">
                      +{hero.conquistas - 4}
                    </span>
                  )}
                </span>
              </>
            )}
          </Tile>

          {/* Dias seguidos — a chama de verdade */}
          <Tile rotulo="Dias seguidos" chama={streakAtual > 0}>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={`tnum font-heading text-[30px] font-bold leading-none tracking-tight ${
                    streakAtual > 0 ? "text-questly-orange-dark dark:text-questly-orange" : ""
                  }`}
                >
                  {streakAtual}
                </p>
                <span className="mt-2 flex gap-0.5" aria-hidden>
                  {Array.from({ length: marcosStreak }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < Math.min(streakAtual, marcosStreak)
                          ? "bg-questly-orange"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </span>
                <p className="tnum mt-1.5 text-[10.5px] font-medium leading-tight text-muted-foreground">
                  Recorde: {recordeStreak}
                </p>
              </div>
              <ChamaStreak size={42} apagada={streakAtual === 0} className="-mr-0.5 -mt-1" />
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({
  rotulo,
  icone,
  href,
  chama,
  children,
}: {
  rotulo: string;
  icone?: React.ReactNode;
  href?: string;
  chama?: boolean;
  children: React.ReactNode;
}) {
  const corpo = (
    <>
      <span className="mb-1.5 flex items-center gap-1.5">
        {icone}
        <span className="truncate text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
        {href && <ChevronRight size={13} className="ml-auto shrink-0 text-muted-foreground" />}
        {chama && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-questly-orange" aria-hidden />
        )}
      </span>
      {children}
    </>
  );

  const classe =
    "flex min-h-[104px] flex-col rounded-2xl border border-border bg-background/70 p-3 backdrop-blur-sm dark:bg-background/55";

  if (href) {
    return (
      <Link
        href={href}
        className={`${classe} transition-colors hover:border-questly-green/45 hover:bg-background`}
      >
        {corpo}
      </Link>
    );
  }
  return <div className={classe}>{corpo}</div>;
}
