"use client";

// Card público do aluno em "vibe Pokémon TCG" (pedido do usuário,
// 2026-07-11): moldura metálica na cor da liga, janela de arte com o
// retrato, faixa de info como a linha "Nº 0025 Pokémon Rato…", os
// "ataques" são as contribuições reais (XP da semana, streak, questões),
// e o rodapé leva raridade + numeração como uma carta impressa. Ligas
// raras (ouro+) ganham o brilho holográfico; o card inteiro responde ao
// mouse com tilt 3D, como uma carta segurada na mão.
import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Crosshair, Crown, Flame, Medal, Target, X, Zap } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import {
  LIGA_CARD_BG,
  LIGA_FRAME,
  LIGA_GRADIENTE,
  LIGA_HOLO,
  LIGA_RARIDADE,
} from "@/components/ranking/liga-visual";
import { CursoIcone } from "@/components/cursos/curso-icone";
import { cursoReconhecido, resolverCurso } from "@/lib/cursos/registro";
import type { CardUsuario } from "@/lib/ranking/actions";
import { Insignia } from "@/components/insignias/insignia";
import { MAX_DISTINTIVOS_CARD } from "@/lib/ranking/badges";
import { PRO_FRAME, ProFoil, ProSelo } from "@/components/ranking/pro-visual";

type StudentCardModalProps = {
  card: CardUsuario | null;
  loading: boolean;
  onClose: () => void;
};

const TEXTO_POP = "[text-shadow:0_1px_3px_rgba(0,0,0,0.4)]";

// Vagas fixas pras disciplinas, mesmo motivo dos distintivos
// (MAX_DISTINTIVOS_CARD): sem limite, `card.disciplinas` cresce a cada
// campanha nova e o flex-wrap empurra o card pra baixo indefinidamente. Só
// corta a exibição — a lista completa continua em `card.disciplinas`.
const MAX_DISCIPLINAS_CARD = 4;

export function StudentCardModal({ card, loading, onClose }: StudentCardModalProps) {
  const aberto = loading || card !== null;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-5 pt-16 backdrop-blur-md sm:items-center sm:pt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          style={{ perspective: 1100 }}
        >
          {/* Botão de fechar preso à VIEWPORT, não ao cartão — problema real
              reportado: num celular baixo o cartão passava da tela e o "X"
              (que ficava colado no canto do cartão) saía junto, impossível
              de tocar. Fixo aqui ele sempre está acessível, mesmo com o
              cartão rolando por dentro. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <X size={18} strokeWidth={2.25} />
          </button>

          {loading || !card ? (
            <motion.div
              className="surface flex w-full max-w-[380px] flex-col items-center gap-3 p-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            </motion.div>
          ) : (
            <CartaTcg card={card} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CartaTcg({ card }: { card: CardUsuario }) {
  const pro = card.pro;
  const raridade = LIGA_RARIDADE[card.liga];
  const numeroCarta = String(Math.max(1, card.nivel)).padStart(3, "0");
  const curso = resolverCurso(card.curso);
  const cursoNoCard = cursoReconhecido(curso);

  // tilt 3D acompanhando o mouse — a carta "na mão"
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
    rotateY.set(px * 14);
    rotateX.set(-py * 12);
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
      className={`relative w-full max-w-[370px] rounded-[20px] bg-gradient-to-br p-[10px] shadow-2xl shadow-black/50 ${
        pro ? PRO_FRAME : LIGA_FRAME[card.liga]
      }`}
      initial={{ opacity: 0, scale: 0.82, rotateX: -14, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 12 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
    >
      {/* teto de altura + rolagem interna — rede de segurança pra telas bem
          baixas; o "X" de verdade mora fixo na viewport (StudentCardModal),
          então mesmo se isso rolar o fechar nunca some. */}
      <div
        className={`relative max-h-[calc(100dvh-7rem)] overflow-y-auto overflow-x-hidden rounded-[12px] bg-gradient-to-b p-3.5 max-sm:p-2.5 ${LIGA_CARD_BG[card.liga]}`}
      >
        {/* foil prismático do assinante — por cima do holo da liga */}
        {pro && <ProFoil />}
        {/* brilho holográfico — ligas raras (ouro pra cima) e todo card Pro */}
        {(LIGA_HOLO[card.liga] || pro) && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ width: "55%" }}
            initial={{ x: "-130%" }}
            animate={{ x: ["-130%", "260%"] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
          />
        )}
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-white/5" />

        {/* linha de título: estágio (liga) · nome · nível como "PS" */}
        <div className="relative z-10 flex items-center gap-2">
          <span
            className={`shrink-0 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${TEXTO_POP}`}
          >
            Liga {card.ligaNome}
          </span>
          {pro && <ProSelo />}
          <h3 className={`min-w-0 flex-1 truncate font-heading text-[17px] font-bold text-white ${TEXTO_POP}`}>
            {card.username ? `@${card.username}` : card.nome}
          </h3>
          <span className={`flex shrink-0 items-baseline gap-1 text-white ${TEXTO_POP}`}>
            <span className="text-[9px] font-bold uppercase">Nv</span>
            <span className="tnum font-heading text-2xl font-bold leading-none">{card.nivel}</span>
            <Medal size={15} strokeWidth={2.25} className="ml-0.5 self-center" />
          </span>
        </div>

        {/* janela de arte, com moldura "metálica" como numa carta */}
        <div className="relative z-10 mx-1 mt-2.5 rounded-lg bg-gradient-to-b from-white/70 via-white/30 to-white/60 p-[3px] max-sm:mt-2">
          <div
            className={`relative flex items-center justify-center overflow-hidden rounded-[6px] bg-gradient-to-br py-6 max-sm:py-4 ${LIGA_GRADIENTE[card.liga]}`}
          >
            {/* "tipo" da carta = identidade do curso do aluno */}
            {cursoNoCard && (
              <span
                title={`${curso.nome} — ${curso.tagline}`}
                className={`absolute left-2 top-2 z-20 flex max-w-[60%] items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-white ring-1 ring-white/40 ${TEXTO_POP}`}
                style={{ background: `linear-gradient(90deg, ${curso.corA}, ${curso.corB})` }}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <CursoIcone icone={curso.icone} size={13} strokeWidth={2.25} />
                </span>
                <span className="truncate text-[9.5px] font-bold uppercase tracking-wide">
                  {curso.nome}
                </span>
              </span>
            )}
            <RankAvatar
              nome={card.username || card.nome}
              fotoUrl={card.fotoUrl}
              size={96}
              gradientClassName="from-white/25 to-black/20"
              className={pro ? "ring-4 ring-questly-gold/80" : "ring-4 ring-white/30"}
            />
          </div>
        </div>

        {/* faixa de info, como "Nº 0025 Pokémon Rato Altura 0,4m..." */}
        <div className="relative z-10 mx-5 -mt-[1px] rounded-b-lg bg-gradient-to-r from-white/75 via-white/55 to-white/75 px-3 py-1 text-center">
          <span className="tnum block truncate text-[9.5px] font-semibold italic text-black/70">
            Nº {numeroCarta} · {card.curso || "Curso não informado"}
            {card.semestre ? ` · ${card.semestre}º sem` : ""}
          </span>
        </div>

        {/* "ataques": as contribuições reais do aluno */}
        <div className="relative z-10 mt-3.5 flex flex-col max-sm:mt-2.5">
          <Ataque
            icone={<Zap size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-gold"
            nome="Investida semanal"
            descricao="XP conquistado nesta rodada da liga"
            valor={card.xpSemana}
            unidade="XP"
          />
          <Ataque
            icone={<Flame size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-orange"
            nome="Chama constante"
            descricao="dias seguidos cumprindo missão"
            valor={card.streakAtual}
            unidade={card.streakAtual === 1 ? "dia" : "dias"}
          />
          <Ataque
            icone={<Target size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-purple"
            nome="Rajada de questões"
            descricao="questões respondidas na carreira"
            valor={card.questoesTotal}
            unidade=""
          />
          {/* Mira precisa — SEMPRE 4 "ataques", pro card grátis e pro Pro,
              com N distintivos ou nenhum: regra de ouro é altura padrão pra
              todo mundo (pedido explícito do usuário), então essa vaga nunca
              some — sem amostra mínima (ver MIN_QUESTOES_ACERTABILIDADE),
              vira um placeholder honesto em vez de sumir e encolher o card. */}
          <Ataque
            icone={<Crosshair size={13} strokeWidth={2.25} />}
            corEnergia="bg-questly-green"
            nome="Mira precisa"
            descricao={
              card.pctAcerto != null
                ? `${card.acertosTotal.toLocaleString("pt-BR")} acertos em ${card.questoesTotal.toLocaleString("pt-BR")} questões`
                : "ainda sem amostra suficiente"
            }
            valor={card.pctAcerto}
            unidade={card.pctAcerto != null ? "%" : ""}
          />
        </div>

        {/* distintivos — vagas FIXAS (MAX_DISTINTIVOS_CARD): o card não
            cresce mais a cada brasão novo. `card.distintivos` já vem
            escolhido/cortado pelo servidor (distintivosParaCard); aqui só
            desenha exatamente essa quantidade de vagas, sempre a mesma
            linha, preenchendo o resto com a moldura "apagada" (ainda não
            escolhida/conquistada) em vez de deixar buraco. */}
        <div className="relative z-10 mt-3 rounded-xl bg-black/25 p-3 max-sm:mt-2 max-sm:p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/70">
              Distintivos
            </span>
            <span className="tnum text-[9.5px] font-bold text-white/70">
              {card.totalDistintivosConquistados}
            </span>
          </div>
          {/* Selo Pro — vaga SEMPRE reservada (invisible, não removida) pela
              mesma regra de ouro dos ataques/distintivos: um card Pro não
              pode ficar mais alto que um grátis. O "auge" (melhor liga +
              XP/questão), que antes vinha como 2 ataques extras, virou só o
              title deste selo (hover no desktop). */}
          <span
            title={
              pro
                ? `Auge: Liga ${card.melhorLigaNome}${card.xpMedioPorQuestao != null ? ` · ${card.xpMedioPorQuestao.toFixed(1)} XP/questão` : ""}`
                : undefined
            }
            className={`mb-2 flex w-fit max-w-full items-center gap-1.5 truncate rounded-full bg-gradient-to-r from-questly-gold to-amber-300 px-2.5 py-1 text-[10px] font-bold text-[#3a2a05] ring-1 ring-white/50 ${pro ? "" : "invisible"}`}
          >
            <Crown size={11} strokeWidth={2.5} className="shrink-0 fill-current" />
            <span className="truncate">Pro · Auge Liga {card.melhorLigaNome}</span>
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: MAX_DISTINTIVOS_CARD }).map((_, i) => {
              const d = card.distintivos[i];
              return (
                <motion.div
                  key={d?.id ?? `vaga-${i}`}
                  title={d ? `${d.nome} — ${d.descricao}` : undefined}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: "spring", stiffness: 320, damping: 20 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10"
                >
                  {d ? (
                    <Insignia nome={d.insignia} tom={d.tom} size={34} />
                  ) : (
                    <Insignia nome="broto" tom="prata" size={34} apagada />
                  )}
                </motion.div>
              );
            })}
          </div>
          {/* Reservada sempre (invisible, não removida) — do contrário um
              aluno recém-chegado (0 distintivos) ganha uma linha A MAIS que
              alguém com brasões, indo contra a regra de altura padrão. */}
          <p className={`mt-2 text-[10.5px] text-white/70 ${card.totalDistintivosConquistados === 0 ? "" : "invisible"}`}>
            Ainda sem distintivos — responda questões pra desbloquear os primeiros.
          </p>
        </div>

        {/* linha de "fraqueza/resistência" → disciplinas em campanha —
            altura fixa de 1 linha (nowrap+overflow-hidden): igual pra quem
            tem 0 ou 4 disciplinas, e nomes longos só cortam em vez de
            empurrar o card pra baixo. */}
        <div className="relative z-10 mt-3 border-t border-white/15 pt-2.5 max-sm:mt-2 max-sm:pt-2">
          <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/70">
            Disciplinas em campanha
          </div>
          <div className="flex h-[22px] flex-nowrap items-center gap-1.5 overflow-hidden">
            {card.disciplinas.length > 0 ? (
              <>
                {card.disciplinas.slice(0, MAX_DISCIPLINAS_CARD).map((nome) => (
                  <span
                    key={nome}
                    className="shrink-0 rounded-full bg-white/12 px-2.5 py-0.5 text-[10px] font-medium text-white"
                  >
                    {nome}
                  </span>
                ))}
                {card.disciplinas.length > MAX_DISCIPLINAS_CARD && (
                  <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                    +{card.disciplinas.length - MAX_DISCIPLINAS_CARD}
                  </span>
                )}
              </>
            ) : (
              <p className="truncate text-[10.5px] text-white/70">Nenhuma disciplina cadastrada ainda.</p>
            )}
          </div>
        </div>

        {/* rodapé de carta impressa: ilustrador · raridade · numeração */}
        <div className="relative z-10 mt-3 flex items-center justify-between text-[8.5px] italic text-white/55 max-sm:mt-2">
          <span>Ilust. Expectrum</span>
          <span className="tnum not-italic">
            {pro ? "✦" : raridade.simbolo} {numeroCarta}/100 ·{" "}
            {pro ? `${raridade.nome} · Edição Pro` : raridade.nome}
          </span>
          <span>© Expectrum {new Date().getFullYear()}</span>
        </div>
      </div>
    </motion.div>
  );
}

function Ataque({
  icone,
  corEnergia,
  nome,
  descricao,
  valor,
  unidade,
}: {
  icone: React.ReactNode;
  corEnergia: string;
  nome: string;
  descricao: string;
  /** null = ainda sem dado pra essa métrica (mostra "—", não 0) */
  valor: number | null;
  unidade: string;
}) {
  // Exatamente 4 linhas sempre (ver o bloco de "ataques" acima) — o divisor
  // some na última via `last:`.
  return (
    <div className="flex items-center gap-2.5 border-b border-white/12 py-2 last:border-b-0 max-sm:py-1.5">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-white/40 max-sm:h-5 max-sm:w-5 ${corEnergia}`}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[12.5px] font-bold text-white ${TEXTO_POP}`}>{nome}</span>
        <span className="block truncate text-[9.5px] text-white/60">{descricao}</span>
      </span>
      <span className={`tnum shrink-0 font-heading text-lg font-bold text-white ${TEXTO_POP}`}>
        {valor == null ? "—" : valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
        {unidade && <span className="ml-1 text-[10px] font-semibold text-white/70">{unidade}</span>}
      </span>
    </div>
  );
}
