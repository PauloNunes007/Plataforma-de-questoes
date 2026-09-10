"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Pause, Play, Square, Trash2, X } from "lucide-react";
import { Insignia } from "@/components/insignias/insignia";
import { useFoco, formatarRelogio, formatarDuracaoCurta, CORES_FOCO } from "./foco-provider";

const MINUTOS_RAPIDOS = [15, 25, 50] as const;

// Altura do header (h-14) — a barra gruda logo abaixo dele.
const TOPO_STICKY = "top-14";

// Quanto tempo o ponteiro precisa ficar em cima da linha recolhida antes dela
// "acordar". Passar o mouse rápido (o caso comum — o aluno indo pro conteúdo)
// não dispara nada.
const MS_DESPERTAR = 1000;

// Barra de Foco abaixo do header. Ela ACOMPANHA a rolagem (sticky): sumir
// quando o aluno desce a página era o jeito mais rápido de esquecer que o
// cronômetro está rodando.
//
// Estados: painel de setup (parado), barra colorida rodando, OU linha fina
// quando está recolhida — o que acontece SOZINHO alguns segundos depois de
// iniciar, pra não roubar o topo da tela. Com o ponteiro parado em cima da
// linha por ~1s ela ACORDA: cresce um tico, o relógio ganha corpo e aparece o
// convite "abrir"; clicar devolve a barra inteira. A versão anterior
// escancarava a barra sobreposta no hover — bastava o ponteiro cruzar o topo
// da tela pra ela pular na frente do conteúdo.
export function FocoBar() {
  const foco = useFoco();

  if (!foco.montado) return <CelebracaoOverlay />;

  const ativo = foco.estado === "rodando" || foco.estado === "pausado";
  const recolhida = ativo && foco.colapsada;

  return (
    <>
      <div className={`sticky z-30 ${TOPO_STICKY}`}>
        <AnimatePresence initial={false}>
          {ativo ? (
            recolhida ? (
              <LinhaFina key="linha" />
            ) : (
              <motion.div
                key="ativa"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <CorpoBarra />
              </motion.div>
            )
          ) : foco.barraAberta ? (
            <PainelSetup key="setup" />
          ) : null}
        </AnimatePresence>
      </div>
      <CelebracaoOverlay />
    </>
  );
}

function PainelSetup() {
  const foco = useFoco();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden border-b border-border bg-card/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
        <input
          value={foco.objetivo}
          onChange={(e) => foco.setObjetivo(e.target.value)}
          placeholder="No que você vai focar? (ex.: Cálculo — derivadas)"
          aria-label="Objetivo do foco"
          className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-questly-blue focus:ring-2 focus:ring-questly-blue/20"
        />

        {/* Seletor de cor da sessão */}
        <div className="flex items-center gap-1.5">
          {CORES_FOCO.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => foco.setCor(c)}
              aria-label={`Cor ${c}`}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90"
              style={{
                backgroundColor: c,
                boxShadow: foco.cor === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : undefined,
              }}
            >
              {foco.cor === c && <Check size={12} strokeWidth={3} className="text-white" />}
            </button>
          ))}
          <label className="flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border" title="Cor personalizada">
            <input
              type="color"
              value={foco.cor}
              onChange={(e) => foco.setCor(e.target.value)}
              className="h-8 w-8 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-background p-0.5">
            {(["cronometro", "timer"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => foco.setModo(m)}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={
                  foco.modo === m
                    ? { backgroundColor: foco.cor, color: "#fff" }
                    : { color: "var(--muted-foreground)" }
                }
              >
                {m === "cronometro" ? "Cronômetro" : "Timer"}
              </button>
            ))}
          </div>

          {foco.modo === "timer" && (
            <div className="flex items-center gap-1">
              {MINUTOS_RAPIDOS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => foco.setAlvoMin(min)}
                  className={`tnum cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                    foco.alvoMin === min ? "text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
                  style={foco.alvoMin === min ? { backgroundColor: foco.cor } : undefined}
                >
                  {min}
                </button>
              ))}
              <input
                type="number"
                min={1}
                value={foco.alvoMin}
                onChange={(e) => foco.setAlvoMin(Number(e.target.value) || 1)}
                aria-label="Minutos do timer"
                className="tnum w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-[13px] outline-none"
              />
              <span className="text-[12px] text-muted-foreground">min</span>
            </div>
          )}

          <button
            type="button"
            onClick={foco.iniciar}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: foco.cor }}
          >
            <Play size={15} strokeWidth={2.5} fill="currentColor" />
            Iniciar
          </button>
          <button
            type="button"
            onClick={foco.fecharBarra}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Conteúdo da barra ativa, SEM wrapper de animação — quem monta decide como
// ela entra no fluxo.
function CorpoBarra() {
  const foco = useFoco();
  const rodando = foco.estado === "rodando";
  const pausado = foco.estado === "pausado";
  const mostrado = foco.modo === "timer" ? foco.restanteSeg : foco.segundos;
  const pct =
    foco.modo === "timer" && foco.alvoMin > 0
      ? Math.min(100, (foco.segundos / (foco.alvoMin * 60)) * 100)
      : 0;

  function descartarComAviso() {
    if (foco.segundos >= 60 && !confirm("Descartar essa sessão? O tempo focado não será salvo.")) {
      return;
    }
    foco.descartar();
  }

  return (
    <div className="relative overflow-hidden text-white" style={{ backgroundColor: foco.cor }}>
      {/* escurece um pouco pra o texto branco ler bem em qualquer cor */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 to-black/35" />
      {foco.modo === "timer" && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
          <div className="h-full bg-white/80 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="relative mx-auto flex w-full max-w-[1340px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {rodando && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${rodando ? "bg-white" : "bg-white/50"}`} />
        </span>

        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-white/90">
          {foco.objetivo || (foco.modo === "timer" ? "Foco cronometrado" : "Sessão de foco")}
          {pausado && <span className="ml-2 text-white/60">· pausado</span>}
        </span>

        <span className="tnum shrink-0 text-[19px] font-semibold tabular-nums tracking-tight sm:text-[22px]">
          {formatarRelogio(mostrado)}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <BotaoCirculo onClick={foco.colapsar} label="Recolher (só uma linha)">
            <ChevronDown size={16} strokeWidth={2.5} />
          </BotaoCirculo>
          {rodando ? (
            <BotaoCirculo onClick={foco.pausar} label="Pausar">
              <Pause size={16} strokeWidth={2.5} fill="currentColor" />
            </BotaoCirculo>
          ) : (
            <BotaoCirculo onClick={foco.retomar} label="Retomar">
              <Play size={16} strokeWidth={2.5} fill="currentColor" />
            </BotaoCirculo>
          )}
          <BotaoCirculo onClick={foco.finalizar} label="Concluir e salvar">
            <Square size={15} strokeWidth={2.5} fill="currentColor" />
          </BotaoCirculo>
          <BotaoCirculo onClick={descartarComAviso} label="Descartar sem salvar" discreto>
            <Trash2 size={15} strokeWidth={2.25} />
          </BotaoCirculo>
        </div>
      </div>
    </div>
  );
}

// Linha fina — o Foco recolhido: só lembra que está rodando, sem atrapalhar.
// Ficar com o ponteiro em cima por ~1s a DESPERTA (cresce um tico, o relógio
// ganha corpo, entra o convite "abrir") — é só um sinal de vida, quem manda
// abrir de verdade é o clique. Cruzar o topo da tela de passagem não muda nada.
function LinhaFina() {
  const foco = useFoco();
  // O estado do "despertar" mora aqui de propósito: ele morre junto com a
  // linha quando a barra expande ou a sessão acaba, sem efeito de limpeza.
  const [desperta, setDesperta] = useState(false);
  const relogioRef = useRef<number | null>(null);

  const dormir = useCallback(() => {
    if (relogioRef.current !== null) {
      window.clearTimeout(relogioRef.current);
      relogioRef.current = null;
    }
    setDesperta(false);
  }, []);

  const agendarDespertar = useCallback(() => {
    if (relogioRef.current !== null) return;
    relogioRef.current = window.setTimeout(() => {
      relogioRef.current = null;
      setDesperta(true);
    }, MS_DESPERTAR);
  }, []);

  useEffect(
    () => () => {
      if (relogioRef.current !== null) window.clearTimeout(relogioRef.current);
    },
    [],
  );

  const rodando = foco.estado === "rodando";
  const mostrado = foco.modo === "timer" ? foco.restanteSeg : foco.segundos;
  // Mola curta: o crescimento tem que parecer resposta ao ponteiro, não uma
  // animação com vida própria.
  const mola = { type: "spring" as const, stiffness: 460, damping: 32, mass: 0.6 };

  return (
    <motion.button
      type="button"
      onClick={foco.expandir}
      // "Ficar parado em cima" só existe pro mouse; no toque o clique resolve.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") agendarDespertar();
      }}
      onPointerLeave={dormir}
      onFocus={agendarDespertar}
      onBlur={dormir}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Expandir sessão de foco"
      title="Sessão de foco em andamento — clique pra expandir"
      className="group relative block w-full cursor-pointer overflow-hidden border-b border-black/5 backdrop-blur-sm transition-[background-color,box-shadow] duration-200 dark:border-white/10"
      style={{
        backgroundColor: `${foco.cor}${desperta ? "33" : "1f"}`,
        boxShadow: desperta ? `0 10px 22px -16px ${foco.cor}` : "0 0 0 0 transparent",
      }}
    >
      {/* barrinha de cor com brilho deslizante — desperta, engrossa e o brilho
          passa mais rápido (o "está vivo"). */}
      <motion.span
        className="relative block w-full"
        animate={{ height: desperta ? 7 : 4 }}
        transition={mola}
        style={{ backgroundColor: foco.cor }}
      >
        {rodando && (
          <motion.span
            className="absolute inset-y-0 w-1/3 bg-white/40 blur-[2px]"
            animate={{ x: ["-40%", "340%"] }}
            transition={{ duration: desperta ? 1.5 : 2.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.span>
      {/* Linha de status baixinha (~20px). A versão anterior tinha só os 6px
          de cor e o relógio ficava CORTADO pelo overflow-hidden — dava pra
          ver que algo rodava, mas não quanto. */}
      <motion.span
        className="mx-auto flex w-full max-w-[1340px] items-center gap-2 px-4 sm:px-6"
        animate={{ paddingTop: desperta ? 7 : 3, paddingBottom: desperta ? 7 : 3 }}
        transition={mola}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {rodando && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: foco.cor }}
            />
          )}
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: foco.cor, opacity: rodando ? 1 : 0.5 }}
          />
        </span>
        <motion.span
          className={`min-w-0 flex-1 truncate text-left font-medium transition-colors duration-200 ${
            desperta ? "text-foreground" : "text-muted-foreground"
          }`}
          animate={{ fontSize: desperta ? 12 : 10.5 }}
          transition={mola}
        >
          {foco.objetivo || (foco.modo === "timer" ? "Foco cronometrado" : "Sessão de foco")}
          {!rodando && " · pausado"}
        </motion.span>

        <AnimatePresence initial={false}>
          {desperta && (
            <motion.span
              key="abrir"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex shrink-0 items-center gap-0.5 text-[10.5px] font-semibold"
              style={{ color: foco.cor }}
            >
              abrir
              <ChevronDown size={12} strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>

        <motion.span
          className="tnum shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold text-white"
          style={{ backgroundColor: foco.cor, transformOrigin: "right center" }}
          animate={{ scale: desperta ? 1.15 : 1 }}
          transition={mola}
        >
          {formatarRelogio(mostrado)}
        </motion.span>
      </motion.span>
    </motion.button>
  );
}

function BotaoCirculo({
  onClick,
  label,
  children,
  discreto = false,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  discreto?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors active:scale-95 ${
        discreto ? "bg-white/10 hover:bg-white/25" : "bg-white/20 hover:bg-white/30"
      }`}
    >
      {children}
    </button>
  );
}

// Overlay comemorativo no fim da sessão (o provider limpa sozinho em ~5s).
function CelebracaoOverlay() {
  const foco = useFoco();
  const cel = foco.celebracao;

  return (
    <AnimatePresence>
      {cel && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed left-1/2 top-20 z-[60] w-[min(92vw,420px)] -translate-x-1/2"
          role="status"
        >
          <button
            type="button"
            onClick={foco.limparCelebracao}
            className="relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-popover p-4 text-left shadow-2xl"
          >
            <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-[0.13] blur-2xl dark:opacity-30" style={{ background: cel.cor }} />
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-inner" style={{ backgroundColor: `${cel.cor}22` }}>
                <Insignia nome={cel.insignia} tom="rubi" size={26} nua />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-[15px] font-bold leading-tight" style={{ color: cel.cor }}>
                  {cel.titulo}
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{cel.sub}</p>
              </div>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Chip compacto "tempo focado hoje" — reusado no header e nos cards.
export function FocoHojeChip({ className = "" }: { className?: string }) {
  const foco = useFoco();
  if (!foco.montado || foco.focoHojeSeg <= 0) return null;
  return (
    <span className={`tnum text-[12px] font-medium text-muted-foreground ${className}`}>
      {formatarDuracaoCurta(foco.focoHojeSeg)} hoje
    </span>
  );
}
