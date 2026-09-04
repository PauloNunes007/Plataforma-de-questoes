"use client";

import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import { LigaEmblema } from "@/components/ranking/liga-emblema";
import { LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import type { RankingGlobal, RankingGlobalRow } from "@/lib/ranking/ranking-data";

const POS_METAL = [
  "from-[#f4d47c] to-[#caa02c]",
  "from-[#e6ebf1] to-[#9aa7b5]",
  "from-[#d29a6a] to-[#8a5628]",
];

const PEDESTAL_ALTURA: Record<1 | 2 | 3, string> = {
  1: "h-24",
  2: "h-[74px]",
  3: "h-[58px]",
};

export function RankingGlobalView({
  dados,
  carregando,
  onAbrirCard,
}: {
  dados: RankingGlobal;
  carregando: boolean;
  onAbrirCard: (id: string) => void;
}) {
  const podio = dados.linhas.length >= 3 ? dados.linhas.slice(0, 3) : [];
  const resto = dados.linhas.length >= 3 ? dados.linhas.slice(3) : dados.linhas;

  return (
    <div className={carregando ? "pointer-events-none opacity-40 transition-opacity" : "transition-opacity"}>
      {/* Pódio */}
      {podio.length > 0 && (
        <div className="mb-5 grid grid-cols-3 items-end gap-2 px-1 sm:gap-3">
          <PodiumGlobal aluno={podio[1]} posicao={2} onClick={() => onAbrirCard(podio[1].id)} />
          <PodiumGlobal aluno={podio[0]} posicao={1} onClick={() => onAbrirCard(podio[0].id)} />
          <PodiumGlobal aluno={podio[2]} posicao={3} onClick={() => onAbrirCard(podio[2].id)} />
        </div>
      )}

      {/* Sua posição — sempre fixada no topo da lista (estilo print) */}
      {dados.voce && (
        <PinnedVoce aluno={dados.voce} foraDoTop={dados.foraDoTop} onClick={() => onAbrirCard(dados.voce!.id)} />
      )}

      {dados.linhas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ninguém pontuou ainda por aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {resto.map((aluno) => (
            <LinhaGlobal
              key={aluno.id}
              aluno={aluno}
              onClick={() => onAbrirCard(aluno.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PodiumGlobal({
  aluno,
  posicao,
  onClick,
}: {
  aluno: RankingGlobalRow;
  posicao: 1 | 2 | 3;
  onClick: () => void;
}) {
  const destaque = posicao === 1;
  const metal = POS_METAL[posicao - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: posicao * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
    >
      <button type="button" onClick={onClick} className="group flex cursor-pointer flex-col items-center gap-1.5">
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
            size={destaque ? 60 : 48}
            gradientClassName={LIGA_GRADIENTE[aluno.liga]}
            className={`relative transition-transform group-hover:-translate-y-0.5 ${
              aluno.ehVoce
                ? "ring-2 ring-questly-green ring-offset-2 ring-offset-card"
                : destaque
                  ? "ring-2 ring-questly-gold/70 ring-offset-2 ring-offset-card"
                  : ""
            }`}
          />
        </div>
        <b className="max-w-[96px] truncate text-center text-[11.5px] font-semibold">
          {aluno.ehVoce ? "Você" : aluno.username ? `@${aluno.username}` : aluno.nome.split(" ")[0]}
        </b>
        <span className="tnum text-[11px] font-medium text-questly-gold-dark">
          {aluno.xp.toLocaleString("pt-BR")} XP
        </span>
      </button>

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
  foraDoTop,
  onClick,
}: {
  aluno: RankingGlobalRow;
  foraDoTop: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mb-4">
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-questly-red/50 bg-questly-red-light/40 px-3 py-3 text-left"
      >
        <div className="w-12 shrink-0 text-center">
          <span className="tnum text-[16px] font-bold text-questly-red-dark">{aluno.posicao}º</span>
        </div>
        <RankAvatar
          nome={aluno.username || aluno.nome}
          fotoUrl={aluno.fotoUrl}
          size={40}
          gradientClassName={LIGA_GRADIENTE[aluno.liga]}
        />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[13.5px] font-semibold">
            {aluno.username ? `@${aluno.username}` : aluno.nome}
            <span className="ml-1.5 rounded-md bg-questly-red/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-questly-red-dark">
              você
            </span>
          </b>
          <span className="text-[11px] text-muted-foreground">Nível {aluno.nivel}</span>
        </div>
        <div className="tnum shrink-0 text-right text-[15px] font-semibold">
          {aluno.xp.toLocaleString("pt-BR")}
          <span className="ml-1 text-[10px] font-medium text-muted-foreground">XP</span>
        </div>
      </motion.button>
      {foraDoTop && (
        <p className="mt-1.5 text-center text-[11.5px] text-muted-foreground">
          Sua posição está fora do Top 100 desta lista.
        </p>
      )}
    </div>
  );
}

function LinhaGlobal({ aluno, onClick }: { aluno: RankingGlobalRow; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        aluno.ehVoce
          ? "border-questly-green/40 bg-questly-green-light/60"
          : "border-transparent hover:bg-muted"
      }`}
    >
      <div className="tnum w-7 shrink-0 text-center text-[13px] font-semibold text-muted-foreground">
        {aluno.posicao}
      </div>
      <RankAvatar
        nome={aluno.username || aluno.nome}
        fotoUrl={aluno.fotoUrl}
        size={36}
        gradientClassName={LIGA_GRADIENTE[aluno.liga]}
      />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-semibold">
          {aluno.username ? `@${aluno.username}` : aluno.nome}
          {aluno.ehVoce && <span className="font-normal text-muted-foreground"> (você)</span>}
        </b>
        <span className="text-[11px] text-muted-foreground">Nível {aluno.nivel}</span>
      </div>
      <div className="tnum shrink-0 text-right text-[13.5px] font-semibold">
        {aluno.xp.toLocaleString("pt-BR")}
        <span className="ml-1 text-[10px] font-medium text-muted-foreground">XP</span>
      </div>
    </motion.button>
  );
}

// Cabeçalho do modo global: emblema alado + título/subtítulo.
export function GlobalHeader({
  liga,
  titulo,
  subtitulo,
}: {
  liga: RankingGlobalRow["liga"];
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <LigaEmblema liga={liga} size={54} className="shrink-0 drop-shadow-md" />
      <div className="min-w-0">
        <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
      </div>
      <TrendingUp size={18} className="ml-auto shrink-0 text-questly-green" strokeWidth={2} />
    </div>
  );
}
