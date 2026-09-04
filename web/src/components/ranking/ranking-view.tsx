"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Gem, Globe, Medal, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import { StudentCardModal } from "@/components/ranking/student-card-modal";
import { LigaEmblema } from "@/components/ranking/liga-emblema";
import { RankingGlobalView, GlobalHeader } from "@/components/ranking/ranking-global-view";
import { LIGA_COR, LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import {
  buscarCardUsuarioAction,
  buscarRankingLigaAction,
  buscarRankingGlobalAction,
  type CardUsuario,
} from "@/lib/ranking/actions";
import type { DadosRanking, RankingRow, RankingGlobal, ModoGlobal } from "@/lib/ranking/ranking-data";
import type { Liga } from "@/lib/questly/liga";

type Aba = "geral" | "semana" | "divisao";

type RankingViewProps = {
  dados: DadosRanking;
  geralInicial: RankingGlobal;
};

// Medalhas do pódio: gradiente "metálico" por posição (ouro/prata/bronze)
const POS_METAL = [
  "from-[#f4d47c] to-[#caa02c]",
  "from-[#e6ebf1] to-[#9aa7b5]",
  "from-[#d29a6a] to-[#8a5628]",
];

export function RankingView({ dados, geralInicial }: RankingViewProps) {
  const [card, setCard] = useState<CardUsuario | null>(null);
  const [carregandoCard, setCarregandoCard] = useState(false);

  const [aba, setAba] = useState<Aba>("geral");
  const [globais, setGlobais] = useState<Record<ModoGlobal, RankingGlobal | null>>({
    geral: geralInicial,
    semana: null,
  });
  const [carregandoGlobal, setCarregandoGlobal] = useState(false);

  const [ligaSelecionada, setLigaSelecionada] = useState<Liga>(dados.liga);
  const [grupoAtivo, setGrupoAtivo] = useState<RankingRow[]>(dados.grupo);
  const [hintAtivo, setHintAtivo] = useState(dados.hint);
  const [carregandoGrupo, setCarregandoGrupo] = useState(false);

  async function trocarAba(nova: Aba) {
    setAba(nova);
    if ((nova === "geral" || nova === "semana") && !globais[nova]) {
      setCarregandoGlobal(true);
      const res = await buscarRankingGlobalAction(nova);
      if (res) setGlobais((g) => ({ ...g, [nova]: res }));
      setCarregandoGlobal(false);
    }
  }

  async function abrirCard(userId: string) {
    setCarregandoCard(true);
    const resultado = await buscarCardUsuarioAction(userId);
    setCard(resultado);
    setCarregandoCard(false);
  }

  function fecharCard() {
    setCard(null);
    setCarregandoCard(false);
  }

  async function selecionarLiga(liga: Liga) {
    if (liga === ligaSelecionada) return;
    if (liga === dados.liga) {
      setLigaSelecionada(liga);
      setGrupoAtivo(dados.grupo);
      setHintAtivo(dados.hint);
      return;
    }
    setLigaSelecionada(liga);
    setCarregandoGrupo(true);
    const resultado = await buscarRankingLigaAction(liga);
    setGrupoAtivo(resultado.grupo);
    setHintAtivo(resultado.hint);
    setCarregandoGrupo(false);
  }

  const podio = grupoAtivo.length >= 3 ? grupoAtivo.slice(0, 3) : [];
  const resto = grupoAtivo.length >= 3 ? grupoAtivo.slice(3) : grupoAtivo;

  const indiceVoce = grupoAtivo.findIndex((a) => a.ehVoce);
  const posicaoVoce = indiceVoce >= 0 ? indiceVoce + 1 : 0;
  // Só fixa a linha "Você" quando o aluno existe no grupo E não está no pódio.
  const vocePinado = indiceVoce >= podio.length ? grupoAtivo[indiceVoce] : null;

  const globalAtivo = aba === "geral" || aba === "semana" ? globais[aba] : null;

  return (
    <>
      {/* Abas: Geral (XP total) · Semana (XP da semana) · Divisão (liga) */}
      <div className="surface flex gap-1 p-1.5">
        <AbaBtn ativo={aba === "geral"} onClick={() => trocarAba("geral")} icone={<Globe size={15} strokeWidth={2} />}>
          Geral
        </AbaBtn>
        <AbaBtn ativo={aba === "semana"} onClick={() => trocarAba("semana")} icone={<TrendingUp size={15} strokeWidth={2} />}>
          Semana
        </AbaBtn>
        <AbaBtn ativo={aba === "divisao"} onClick={() => trocarAba("divisao")} icone={<Gem size={15} strokeWidth={2} />}>
          Divisão
        </AbaBtn>
      </div>

      {/* MODO GLOBAL (Geral / Semana) */}
      {(aba === "geral" || aba === "semana") && globalAtivo && (
        <div className="surface p-5">
          <GlobalHeader
            liga={globalAtivo.voce?.liga || dados.liga}
            titulo={aba === "geral" ? "Ranking Geral" : "Ranking da Semana"}
            subtitulo={
              aba === "geral"
                ? `Top 100 por XP total · ${globalAtivo.totalAlunos.toLocaleString("pt-BR")} alunos`
                : "Top 100 por XP conquistado nesta semana"
            }
          />
          <RankingGlobalView dados={globalAtivo} carregando={carregandoGlobal} onAbrirCard={abrirCard} />
        </div>
      )}
      {(aba === "geral" || aba === "semana") && !globalAtivo && (
        <div className="surface p-10 text-center text-sm text-muted-foreground">Carregando ranking…</div>
      )}

      {/* MODO DIVISÃO (liga da semana) */}
      {aba === "divisao" && (
      <>
      {/* cabeçalho: status pessoal na liga atual */}
      <div className="surface relative overflow-hidden p-6 text-center sm:p-7">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-[0.1] blur-2xl"
          style={{ background: LIGA_COR[dados.liga] }}
        />
        <div className="relative mx-auto mb-3 flex h-[92px] w-[92px] items-center justify-center">
          <motion.span
            className={`absolute inset-0 rounded-full bg-gradient-to-br opacity-25 blur-md ${LIGA_GRADIENTE[dados.liga]}`}
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.05, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <LigaEmblema liga={dados.liga} size={88} className="relative drop-shadow-lg" />
        </div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">Liga {dados.ligaNome}</h2>
        <p className="tnum mt-1 text-xs text-muted-foreground">
          Fecha em {dados.diasAteReset} {dados.diasAteReset === 1 ? "dia" : "dias"} ·{" "}
          {dados.xpSemana.toLocaleString("pt-BR")} XP essa semana
        </p>
      </div>

      {/* navegador de ligas */}
      <div className="surface p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3 px-1">
          <span className="text-[13.5px] font-semibold tracking-tight">Explorar ligas</span>
          <span className="text-[11px] text-muted-foreground">toque pra ver cada ranking</span>
        </div>
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {dados.ribbon.map((l) => {
            const selecionada = l.liga === ligaSelecionada;
            return (
              <button
                key={l.liga}
                type="button"
                onClick={() => selecionarLiga(l.liga)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selecionada
                    ? `bg-gradient-to-br text-white shadow-sm ${LIGA_GRADIENTE[l.liga]}`
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Medal
                  size={13}
                  strokeWidth={2}
                  style={selecionada ? undefined : { color: LIGA_COR[l.liga] }}
                />
                {l.nome}
                {l.atual && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                      selecionada ? "bg-white/25" : "bg-questly-green-light text-questly-green-dark"
                    }`}
                  >
                    você
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={ligaSelecionada}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: carregandoGrupo ? 0.4 : 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* pódio (top 3) — pedestais ouro/prata/bronze (estilo print) */}
            {podio.length > 0 && (
              <div className="mb-5 grid grid-cols-3 items-end gap-2 px-1 sm:gap-3">
                <PodiumSlot
                  aluno={podio[1]}
                  posicao={2}
                  liga={ligaSelecionada}
                  onClick={() => abrirCard(podio[1].id)}
                />
                <PodiumSlot
                  aluno={podio[0]}
                  posicao={1}
                  liga={ligaSelecionada}
                  onClick={() => abrirCard(podio[0].id)}
                />
                <PodiumSlot
                  aluno={podio[2]}
                  posicao={3}
                  liga={ligaSelecionada}
                  onClick={() => abrirCard(podio[2].id)}
                />
              </div>
            )}

            {/* Linha "Você" fixada quando o aluno está fora do pódio (estilo
                print: destaque em vermelho com a posição na liga). */}
            {vocePinado && (
              <PinnedVoce
                aluno={vocePinado}
                posicao={posicaoVoce}
                onClick={() => abrirCard(vocePinado.id)}
              />
            )}

            {hintAtivo && (
              <p className="mb-3 text-center text-[11.5px] text-muted-foreground">{hintAtivo}</p>
            )}

            {grupoAtivo.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Sprout size={18} strokeWidth={1.75} className="text-muted-foreground" />
                </span>
                <p className="text-sm text-muted-foreground">Ninguém nessa liga essa semana ainda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {resto.map((aluno, i) => (
                  <RankRow
                    key={aluno.id}
                    aluno={aluno}
                    posicao={podio.length > 0 ? i + 4 : i + 1}
                    onClick={() => abrirCard(aluno.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      </>
      )}

      <StudentCardModal card={card} loading={carregandoCard} onClose={fecharCard} />
    </>
  );
}

function AbaBtn({
  ativo,
  onClick,
  icone,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors ${
        ativo ? "text-white" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {ativo && (
        <motion.span
          layoutId="ranking-aba"
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-questly-purple to-questly-blue shadow-sm"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icone}
        {children}
      </span>
    </button>
  );
}

// Altura do pilar por posição (1º mais alto), estilo pódio olímpico da print.
const PEDESTAL_ALTURA: Record<1 | 2 | 3, string> = {
  1: "h-24",
  2: "h-[74px]",
  3: "h-[58px]",
};

function PodiumSlot({
  aluno,
  posicao,
  liga,
  onClick,
}: {
  aluno: RankingRow;
  posicao: 1 | 2 | 3;
  liga: Liga;
  onClick: () => void;
}) {
  const destaque = posicao === 1;
  const tamanhoAvatar = destaque ? 60 : 48;
  const metal = POS_METAL[posicao - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: posicao * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
    >
      <button
        type="button"
        onClick={onClick}
        className="group flex cursor-pointer flex-col items-center gap-1.5"
      >
        <div className="relative">
          {destaque && (
            <>
              <span className="pointer-events-none absolute -inset-3 rounded-full bg-questly-gold/25 blur-lg" />
              <motion.span
                className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 text-questly-gold"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown size={20} strokeWidth={2} fill="currentColor" />
              </motion.span>
            </>
          )}
          <RankAvatar
            nome={aluno.username || aluno.nome}
            fotoUrl={aluno.fotoUrl}
            size={tamanhoAvatar}
            gradientClassName={LIGA_GRADIENTE[liga]}
            className={`relative transition-transform group-hover:-translate-y-0.5 ${
              aluno.ehVoce
                ? "ring-2 ring-questly-green ring-offset-2 ring-offset-card"
                : destaque
                  ? "ring-2 ring-questly-gold/70 ring-offset-2 ring-offset-card"
                  : ""
            }`}
          />
        </div>
        <b className="max-w-[92px] truncate text-center text-[11.5px] font-semibold">
          {aluno.ehVoce ? "Você" : aluno.username ? `@${aluno.username}` : aluno.nome.split(" ")[0]}
        </b>
        <span className="tnum text-[11px] font-medium text-questly-green-dark">
          {aluno.xpSemana.toLocaleString("pt-BR")} XP
        </span>
      </button>

      {/* Pilar do pódio */}
      <div
        className={`relative mt-2 flex w-full items-start justify-center rounded-t-xl bg-gradient-to-b pt-2.5 shadow-[inset_0_2px_6px_rgba(255,255,255,0.35)] ${metal} ${PEDESTAL_ALTURA[posicao]}`}
      >
        <span className="tnum font-heading text-2xl font-bold text-black/45">{posicao}</span>
      </div>
    </motion.div>
  );
}

function PinnedVoce({
  aluno,
  posicao,
  onClick,
}: {
  aluno: RankingRow;
  posicao: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      className="mb-4 flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-questly-red/50 bg-questly-red-light/40 px-3 py-2.5 text-left"
    >
      <div className="tnum w-9 shrink-0 text-center">
        <span className="text-[15px] font-bold text-questly-red-dark">{posicao}º</span>
      </div>
      <RankAvatar nome={aluno.username || aluno.nome} fotoUrl={aluno.fotoUrl} size={38} />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[13.5px] font-semibold">
          {aluno.username ? `@${aluno.username}` : aluno.nome}{" "}
          <span className="ml-0.5 rounded-md bg-questly-red/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-questly-red-dark">
            você
          </span>
        </b>
        <span className="tnum text-[11px] text-muted-foreground">
          {aluno.questoesSemana} questões essa semana
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="tnum text-[14px] font-semibold">
          {aluno.xpSemana.toLocaleString("pt-BR")}{" "}
          <span className="text-[10px] font-medium text-muted-foreground">XP</span>
        </div>
        {aluno.destino > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-questly-green-dark">
            <TrendingUp size={11} strokeWidth={2.25} /> sobe
          </span>
        )}
        {aluno.destino < 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-questly-red-dark">
            <TrendingDown size={11} strokeWidth={2.25} /> desce
          </span>
        )}
      </div>
    </motion.button>
  );
}

function RankRow({ aluno, posicao, onClick }: { aluno: RankingRow; posicao: number; onClick: () => void }) {
  const zonaClasse =
    aluno.destino > 0
      ? "bg-questly-green-light/50 hover:bg-questly-green-light"
      : aluno.destino < 0
        ? "bg-questly-red-light/50 hover:bg-questly-red-light"
        : "hover:bg-muted";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        aluno.ehVoce
          ? "border-questly-green/40 bg-questly-green-light/60"
          : `border-transparent ${zonaClasse}`
      }`}
    >
      <div className="tnum w-6 shrink-0 text-center text-[13px] font-semibold text-muted-foreground">
        {posicao}
      </div>
      <RankAvatar nome={aluno.username || aluno.nome} fotoUrl={aluno.fotoUrl} size={36} />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-semibold">
          {aluno.username ? `@${aluno.username}` : aluno.nome}
          {aluno.ehVoce && <span className="font-normal text-muted-foreground"> (você)</span>}
        </b>
        <span className="tnum text-[11px] text-muted-foreground">
          {aluno.questoesSemana} questões essa semana
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="tnum text-[13.5px] font-semibold text-foreground">
          {aluno.xpSemana.toLocaleString("pt-BR")}{" "}
          <span className="text-[10px] font-medium text-muted-foreground">XP</span>
        </div>
        {aluno.destino > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-questly-green-dark">
            <TrendingUp size={11} strokeWidth={2.25} /> sobe
          </span>
        )}
        {aluno.destino < 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-questly-red-dark">
            <TrendingDown size={11} strokeWidth={2.25} /> desce
          </span>
        )}
      </div>
    </motion.button>
  );
}
