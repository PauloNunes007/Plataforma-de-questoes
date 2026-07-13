"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import { StudentCardModal } from "@/components/ranking/student-card-modal";
import { LIGA_COR, LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import { buscarCardUsuarioAction, buscarRankingLigaAction, type CardUsuario } from "@/lib/ranking/actions";
import type { DadosRanking, RankingRow } from "@/lib/ranking/ranking-data";
import type { Liga } from "@/lib/questly/liga";

type RankingViewProps = {
  dados: DadosRanking;
};

// Medalhas do pódio: gradiente "metálico" por posição (ouro/prata/bronze)
const POS_METAL = [
  "from-[#f4d47c] to-[#caa02c]",
  "from-[#e6ebf1] to-[#9aa7b5]",
  "from-[#d29a6a] to-[#8a5628]",
];

export function RankingView({ dados }: RankingViewProps) {
  const [card, setCard] = useState<CardUsuario | null>(null);
  const [carregandoCard, setCarregandoCard] = useState(false);

  const [ligaSelecionada, setLigaSelecionada] = useState<Liga>(dados.liga);
  const [grupoAtivo, setGrupoAtivo] = useState<RankingRow[]>(dados.grupo);
  const [hintAtivo, setHintAtivo] = useState(dados.hint);
  const [carregandoGrupo, setCarregandoGrupo] = useState(false);

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

  return (
    <>
      {/* cabeçalho: status pessoal na liga atual */}
      <div className="surface relative overflow-hidden p-6 text-center sm:p-7">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-[0.1] blur-2xl"
          style={{ background: LIGA_COR[dados.liga] }}
        />
        <div className="relative mx-auto mb-3.5 flex h-[72px] w-[72px] items-center justify-center">
          <motion.span
            className={`absolute inset-0 rounded-full bg-gradient-to-br opacity-30 ${LIGA_GRADIENTE[dados.liga]}`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg ${LIGA_GRADIENTE[dados.liga]}`}
          >
            <Medal size={28} strokeWidth={1.75} />
          </div>
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
            {/* pódio (top 3) */}
            {podio.length > 0 && (
              <div className="mb-6 flex items-end justify-center gap-4 px-2">
                {[podio[1], podio[0], podio[2]].map((aluno, i) =>
                  aluno ? (
                    <PodiumSlot
                      key={aluno.id}
                      aluno={aluno}
                      posicao={aluno === podio[0] ? 1 : aluno === podio[1] ? 2 : 3}
                      destaque={i === 1}
                      liga={ligaSelecionada}
                      onClick={() => abrirCard(aluno.id)}
                    />
                  ) : (
                    <div key={`vazio-${i}`} className="w-[92px]" />
                  ),
                )}
              </div>
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

      <StudentCardModal card={card} loading={carregandoCard} onClose={fecharCard} />
    </>
  );
}

function PodiumSlot({
  aluno,
  posicao,
  destaque,
  liga,
  onClick,
}: {
  aluno: RankingRow;
  posicao: 1 | 2 | 3;
  destaque: boolean;
  liga: Liga;
  onClick: () => void;
}) {
  const alturaBase = destaque ? "pt-0" : "pt-7";
  const tamanhoAvatar = destaque ? 64 : 50;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: posicao * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`flex w-[92px] cursor-pointer flex-col items-center gap-1.5 ${alturaBase}`}
    >
      <div className="relative">
        {destaque && (
          <motion.span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-questly-gold"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown size={18} strokeWidth={2} fill="currentColor" />
          </motion.span>
        )}
        <RankAvatar
          nome={aluno.nome}
          fotoUrl={aluno.fotoUrl}
          size={tamanhoAvatar}
          gradientClassName={LIGA_GRADIENTE[liga]}
          className={aluno.ehVoce ? "ring-2 ring-questly-green ring-offset-2 ring-offset-card" : ""}
        />
        <span
          className={`tnum absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-sm ring-2 ring-card ${POS_METAL[posicao - 1]}`}
        >
          {posicao}
        </span>
      </div>
      <b className="w-full truncate text-center text-[11.5px] font-semibold">
        {aluno.ehVoce ? "Você" : aluno.nome.split(" ")[0]}
      </b>
      <span className="tnum text-[11px] font-medium text-questly-green-dark">
        {aluno.xpSemana.toLocaleString("pt-BR")} XP
      </span>
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
      <RankAvatar nome={aluno.nome} fotoUrl={aluno.fotoUrl} size={36} />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-semibold">
          {aluno.nome}
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
