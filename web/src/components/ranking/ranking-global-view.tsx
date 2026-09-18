"use client";

import { motion } from "framer-motion";
import { Crown, Info, RefreshCw, TrendingUp } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import { LigaEmblema } from "@/components/ranking/liga-emblema";
import { LIGA_GRADIENTE } from "@/components/ranking/liga-visual";
import { PRO_ARO, ProMarcaLinha } from "@/components/ranking/pro-visual";
import { distintivosResumo } from "@/lib/ranking/badges";
import type { RankingGlobal, RankingGlobalRow } from "@/lib/ranking/ranking-data";
import { Insignia } from "@/components/insignias/insignia";

const POS_METAL = [
  "from-[#f4d47c] to-[#caa02c]",
  "from-[#e6ebf1] to-[#9aa7b5]",
  "from-[#d29a6a] to-[#8a5628]",
];

const PEDESTAL_ALTURA: Record<1 | 2 | 3, string> = {
  1: "h-28",
  2: "h-[86px]",
  3: "h-[68px]",
};

// Colunas compartilhadas pela barra de cabeçalho e por cada linha, pra
// tudo alinhar igual — mesmo espírito de tabela da referência (Rank ·
// Aluno · Conquistas · Experiência · Nível), só que via CSS grid em vez
// de <table> (mais fácil de deixar responsivo).
//
// IMPORTANTE: as DUAS variantes (com e sem "sm:") precisam existir como
// strings LITERAIS próprias — o scanner do Tailwind só gera uma classe
// se o texto exato dela aparecer em algum lugar do arquivo-fonte. Uma
// interpolação tipo `sm:${GRADE_COLUNAS}` nunca produz o texto
// "sm:grid-cols-[...]" no arquivo (o "sm:" e o valor ficam em pedaços
// separados da template string), então essa classe responsiva nunca é
// gerada e a linha cai pro grid de 1 coluna só (foi exatamente o bug
// visto em produção: cada célula empilhada numa linha própria).
const GRADE_COLUNAS = "grid-cols-[34px_minmax(0,1fr)_92px_104px_56px]";
const GRADE_COLUNAS_SM = "sm:grid-cols-[34px_minmax(0,1fr)_92px_104px_56px]";

export function RankingGlobalView({
  dados,
  carregando,
  segundosParaAtualizar,
  onAtualizarAgora,
  onAbrirCard,
}: {
  dados: RankingGlobal;
  carregando: boolean;
  segundosParaAtualizar: number;
  onAtualizarAgora: () => void;
  onAbrirCard: (id: string) => void;
}) {
  const podio = dados.linhas.length >= 3 ? dados.linhas.slice(0, 3) : [];
  const resto = dados.linhas.length >= 3 ? dados.linhas.slice(3) : dados.linhas;

  const min = Math.floor(segundosParaAtualizar / 60);
  const seg = segundosParaAtualizar % 60;

  return (
    <div className={carregando ? "pointer-events-none opacity-40 transition-opacity" : "transition-opacity"}>
      {/* Pódio */}
      {podio.length > 0 && (
        <div className="mb-8 grid grid-cols-3 items-end gap-3 px-1 sm:gap-5">
          <PodiumGlobal aluno={podio[1]} slot={2} onClick={() => onAbrirCard(podio[1].id)} />
          <PodiumGlobal aluno={podio[0]} slot={1} onClick={() => onAbrirCard(podio[0].id)} />
          <PodiumGlobal aluno={podio[2]} slot={3} onClick={() => onAbrirCard(podio[2].id)} />
        </div>
      )}

      {/* Barra de status: aviso de atualização em tempo real + contagem
          regressiva pra próxima busca automática (e um botão manual). */}
      <div className="mb-4 flex items-center justify-between gap-3 px-1 text-[11.5px] text-muted-foreground">
        <span className="group relative flex items-center gap-1.5">
          <Info size={13} strokeWidth={2} />
          <span className="hidden sm:inline">Sua posição pode mudar conforme o XP de todo mundo muda</span>
          <span className="sm:hidden">Ranking ao vivo</span>
        </span>
        <button
          type="button"
          onClick={onAtualizarAgora}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 font-medium transition-colors hover:bg-muted hover:text-foreground"
          title="Atualizar agora"
        >
          <RefreshCw size={12} strokeWidth={2.25} className={carregando ? "animate-spin" : ""} />
          <span className="tnum">
            Atualiza em {min}:{String(seg).padStart(2, "0")}
          </span>
        </button>
      </div>

      {/* Sua posição — sempre fixada no topo da lista (estilo print) */}
      {dados.voce && (
        <PinnedVoce
          aluno={dados.voce}
          foraDoTop={dados.foraDoTop}
          totalAlunos={dados.totalAlunos}
          onClick={() => onAbrirCard(dados.voce!.id)}
        />
      )}

      {dados.linhas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ninguém por aqui ainda.
        </p>
      ) : (
        <>
          {/* Cabeçalho de colunas — barra sólida em degradê de marca, como
              a faixa azul da referência. */}
          <div
            className={`mb-3 hidden items-center gap-3 whitespace-nowrap rounded-xl bg-gradient-to-r from-questly-purple to-questly-blue px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-white/90 sm:grid ${GRADE_COLUNAS}`}
          >
            <span className="text-center">#</span>
            <span>Aluno</span>
            <span className="text-center">Conquistas</span>
            <span className="text-right">Experiência</span>
            <span className="text-right">Nível</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {resto.map((aluno) => (
              <LinhaGlobal
                key={aluno.id}
                aluno={aluno}
                onClick={() => onAbrirCard(aluno.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// `slot` é a VAGA do pedestal (1 = centro alto e dourado, 2 = esquerda,
// 3 = direita) — puro visual. O número que aparece é `aluno.posicao`, a
// posição por competição vinda do servidor: com empate no topo, os três
// pedestais podem legitimamente mostrar "1".
function PodiumGlobal({
  aluno,
  slot,
  onClick,
}: {
  aluno: RankingGlobalRow;
  slot: 1 | 2 | 3;
  onClick: () => void;
}) {
  const destaque = slot === 1;
  const metal = POS_METAL[slot - 1];
  const posicao = aluno.posicao;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: slot * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
    >
      <button type="button" onClick={onClick} className="group flex cursor-pointer flex-col items-center gap-2">
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
          {/* selo de posição flutuante, sobre o avatar */}
          <span
            className={`absolute -left-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-md ring-2 ring-card ${metal}`}
          >
            {posicao}
          </span>
          <RankAvatar
            nome={aluno.username || aluno.nome}
            fotoUrl={aluno.fotoUrl}
            size={destaque ? 68 : 54}
            gradientClassName={LIGA_GRADIENTE[aluno.liga]}
            className={`relative transition-transform group-hover:-translate-y-0.5 ${
              aluno.ehVoce
                ? "ring-2 ring-questly-green ring-offset-2 ring-offset-card"
                : aluno.pro
                  ? PRO_ARO
                  : destaque
                    ? "ring-2 ring-questly-gold/70 ring-offset-2 ring-offset-card"
                    : "ring-2 ring-white/50 ring-offset-2 ring-offset-card"
            }`}
          />
        </div>
        <b className="flex max-w-[124px] items-center gap-1 truncate rounded-full bg-muted px-2.5 py-0.5 text-center text-[12px] font-semibold">
          {aluno.pro && <ProMarcaLinha />}
          <span className="truncate">
            {aluno.ehVoce ? "Você" : aluno.username ? `@${aluno.username}` : aluno.nome.split(" ")[0]}
          </span>
        </b>
        <span className="tnum text-[11.5px] font-medium text-questly-gold-dark">
          {aluno.xp.toLocaleString("pt-BR")} XP
        </span>
      </button>

      <div
        className={`relative mt-3 flex w-full items-start justify-center rounded-t-xl bg-gradient-to-b pt-3 shadow-[inset_0_2px_6px_rgba(255,255,255,0.35)] ${metal} ${PEDESTAL_ALTURA[slot]}`}
      >
        <span className="tnum font-heading text-3xl font-bold text-black/45">{posicao}</span>
      </div>
    </motion.div>
  );
}

function PinnedVoce({
  aluno,
  foraDoTop,
  totalAlunos,
  onClick,
}: {
  aluno: RankingGlobalRow;
  foraDoTop: boolean;
  totalAlunos: number;
  onClick: () => void;
}) {
  return (
    <div className="mb-5">
      <motion.button
        type="button"
        onClick={onClick}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-2 border-questly-red/50 bg-questly-red-light/40 px-4 py-4 text-left"
      >
        <div className="w-12 shrink-0 text-center">
          <span className="tnum text-[17px] font-bold text-questly-red-dark">{aluno.posicao}º</span>
        </div>
        <RankAvatar
          nome={aluno.username || aluno.nome}
          fotoUrl={aluno.fotoUrl}
          size={44}
          gradientClassName={LIGA_GRADIENTE[aluno.liga]}
          className={aluno.pro ? PRO_ARO : ""}
        />
        <div className="min-w-0 flex-1">
          <b className="flex items-center gap-1.5 truncate text-[14px] font-semibold">
            {aluno.pro && <ProMarcaLinha />}
            {aluno.username ? `@${aluno.username}` : aluno.nome}
            <span className="ml-1.5 rounded-md bg-questly-red/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-questly-red-dark">
              você
            </span>
          </b>
          <span className="text-[11.5px] text-muted-foreground">Nível {aluno.nivel}</span>
        </div>
        <div className="tnum shrink-0 text-right text-[16px] font-semibold">
          {aluno.xp.toLocaleString("pt-BR")}
          <span className="ml-1 text-[10px] font-medium text-muted-foreground">XP</span>
        </div>
      </motion.button>
      {foraDoTop ? (
        <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
          Você está em {aluno.posicao.toLocaleString("pt-BR")}º de {totalAlunos.toLocaleString("pt-BR")} — fora do
          Top 100 exibido aqui.
        </p>
      ) : null}
    </div>
  );
}

function LinhaGlobal({ aluno, onClick }: { aluno: RankingGlobalRow; onClick: () => void }) {
  const conquistas = distintivosResumo({
    nivel: aluno.nivel,
    streakAtual: aluno.streakAtual,
    questoesTotal: aluno.questoesTotal,
    numDisciplinas: 0,
    melhorLiga: aluno.liga,
  });

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors sm:grid ${GRADE_COLUNAS_SM} ${
        aluno.ehVoce
          ? "border-questly-green/40 bg-questly-green-light/60"
          : "border-transparent hover:bg-muted"
      }`}
    >
      <div className="tnum hidden text-center text-[13px] font-semibold text-muted-foreground sm:block">
        {aluno.posicao}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="tnum shrink-0 text-center text-[13px] font-semibold text-muted-foreground sm:hidden">
          {aluno.posicao}
        </span>
        <RankAvatar
          nome={aluno.username || aluno.nome}
          fotoUrl={aluno.fotoUrl}
          size={38}
          gradientClassName={LIGA_GRADIENTE[aluno.liga]}
          className={aluno.pro ? PRO_ARO : ""}
        />
        <div className="min-w-0 flex-1">
          <b className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
            {aluno.pro && <ProMarcaLinha />}
            {aluno.username ? `@${aluno.username}` : aluno.nome}
            {aluno.ehVoce && <span className="font-normal text-muted-foreground"> (você)</span>}
          </b>
          <span className="text-[11px] text-muted-foreground sm:hidden">Nível {aluno.nivel}</span>
        </div>
      </div>
      <div className="hidden items-center justify-center gap-1 sm:flex">
        {conquistas.length > 0 ? (
          conquistas.map((d) => (
            <span key={d.id} title={`${d.nome} — ${d.descricao}`} className="leading-none">
              <Insignia nome={d.insignia} tom={d.tom} size={22} nua titulo={d.nome} />
            </span>
          ))
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </div>
      <div className="tnum shrink-0 text-right text-[13.5px] font-semibold">
        {aluno.xp.toLocaleString("pt-BR")}
        <span className="ml-1 text-[10px] font-medium text-muted-foreground">XP</span>
      </div>
      <div className="tnum hidden text-right text-[13px] font-semibold text-muted-foreground sm:block">
        {aluno.nivel}
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
    <div className="mb-6 flex items-center gap-3.5">
      <LigaEmblema liga={liga} size={58} className="shrink-0 drop-shadow-md" />
      <div className="min-w-0">
        <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
      </div>
      <TrendingUp size={18} className="ml-auto shrink-0 text-questly-green" strokeWidth={2} />
    </div>
  );
}
