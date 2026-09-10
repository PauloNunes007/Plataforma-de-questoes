"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Pause, Pin, Play, Square, Trash2, X } from "lucide-react";
import { Insignia } from "@/components/insignias/insignia";
import { useFoco, formatarRelogio, formatarDuracaoCurta, CORES_FOCO } from "./foco-provider";

const MINUTOS_RAPIDOS = [15, 25, 50] as const;

// Altura do header (h-14) — a barra gruda logo abaixo dele.
const TOPO_STICKY = "top-14";

// Barra de Foco abaixo do header. Ela ACOMPANHA a rolagem (sticky): sumir
// quando o aluno desce a página era o jeito mais rápido de esquecer que o
// cronômetro está rodando.
//
// Estados: painel de setup (parado), barra colorida rodando, OU linha fina
// quando está recolhida — o que acontece SOZINHO alguns segundos depois de
// iniciar, pra não roubar o topo da tela. Passar o mouse por cima devolve a
// barra inteira por um instante, SOBREPOSTA (absolute), pra espiar o relógio
// e usar os controles sem empurrar o conteúdo da página pra baixo.
export function FocoBar() {
  const foco = useFoco();
  const [espiando, setEspiando] = useState(false);
  // Recolher com o mouse em cima reabriria a espiada no mesmo instante (e o
  // clique em "recolher" pareceria não ter funcionado). O bloqueio dura até o
  // ponteiro sair da barra.
  const [bloqueado, setBloqueado] = useState(false);
  const colapsadaAntes = useRef(foco.colapsada);

  useEffect(() => {
    if (foco.colapsada && !colapsadaAntes.current && espiando) setBloqueado(true);
    colapsadaAntes.current = foco.colapsada;
  }, [foco.colapsada, espiando]);

  if (!foco.montado) return <CelebracaoOverlay />;

  const ativo = foco.estado === "rodando" || foco.estado === "pausado";
  const recolhida = ativo && foco.colapsada;

  return (
    <>
      <div
        className={`sticky z-30 ${TOPO_STICKY}`}
        onMouseEnter={() => setEspiando(true)}
        onMouseLeave={() => {
          setEspiando(false);
          setBloqueado(false);
        }}
      >
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

        {/* Espiada por hover: sobreposta à página, não desloca nada. */}
        <AnimatePresence>
          {recolhida && espiando && !bloqueado && (
            <motion.div
              key="espiada"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-0 shadow-xl shadow-black/20"
            >
              <CorpoBarra espiando />
            </motion.div>
          )}
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

// Conteúdo da barra ativa, SEM wrapper de animação — quem monta decide se ela
// entra no fluxo (estado expandido) ou sobreposta (espiada por hover).
function CorpoBarra({ espiando = false }: { espiando?: boolean }) {
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
          {espiando ? (
            <BotaoCirculo onClick={foco.expandir} label="Fixar a barra aberta">
              <Pin size={15} strokeWidth={2.5} />
            </BotaoCirculo>
          ) : (
            <BotaoCirculo onClick={foco.colapsar} label="Recolher (só uma linha)">
              <ChevronDown size={16} strokeWidth={2.5} />
            </BotaoCirculo>
          )}
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
// Clicar fixa a barra inteira de volta; passar o mouse já mostra a espiada.
function LinhaFina() {
  const foco = useFoco();
  const rodando = foco.estado === "rodando";
  const mostrado = foco.modo === "timer" ? foco.restanteSeg : foco.segundos;

  return (
    <motion.button
      type="button"
      onClick={foco.expandir}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Expandir sessão de foco"
      title="Sessão de foco em andamento — clique pra expandir"
      className="group relative block w-full cursor-pointer overflow-hidden border-b border-black/5 backdrop-blur-sm dark:border-white/10"
      style={{ backgroundColor: `${foco.cor}22` }}
    >
      {/* barrinha de cor com brilho deslizante */}
      <span className="relative block h-[4px] w-full" style={{ backgroundColor: foco.cor }}>
        {rodando && (
          <motion.span
            className="absolute inset-y-0 w-1/3 bg-white/40 blur-[2px]"
            animate={{ x: ["-40%", "340%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </span>
      {/* Linha de status baixinha (~20px). A versão anterior tinha só os 6px
          de cor e o relógio ficava CORTADO pelo overflow-hidden — dava pra
          ver que algo rodava, mas não quanto. */}
      <span className="mx-auto flex w-full max-w-[1340px] items-center gap-2 px-4 py-[3px] sm:px-6">
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
        <span className="min-w-0 flex-1 truncate text-left text-[10.5px] font-medium text-muted-foreground">
          {foco.objetivo || (foco.modo === "timer" ? "Foco cronometrado" : "Sessão de foco")}
          {!rodando && " · pausado"}
        </span>
        <span
          className="tnum shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold text-white"
          style={{ backgroundColor: foco.cor }}
        >
          {formatarRelogio(mostrado)}
        </span>
      </span>
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
