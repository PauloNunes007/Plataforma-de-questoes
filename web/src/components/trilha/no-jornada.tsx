"use client";

// Nó ("casinha") da jornada + painel de detalhe do tópico selecionado.
// Redesign 2026-07: a trilha virou uma jornada 2.5D — cada tópico é um nó
// no caminho serpenteante e, quando selecionado, abre este painel com as
// mesmas ações de sempre (Já sei / recap / voltar / treinar) MAIS as
// camadas inteligentes que já estavam calculadas e escondidas: cobertura,
// precisão, memória (Ebbinghaus) e projeção pro dia da prova.
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  Crown,
  MapPin,
  SkipForward,
  Sparkles,
  Undo2,
  Zap,
} from "lucide-react";
import type { TopicoTrilha } from "@/lib/trilha/trilha-data";
import { Mascote } from "./mascote-capivara";

export type EstadoVisual = TopicoTrilha["estado"] | "fronteira";

export function visual(t: TopicoTrilha): EstadoVisual {
  return t.estado === "pendente" && t.ehFronteira ? "fronteira" : t.estado;
}

// cor de acento por estado (usada no anel, no traçado e no glow)
export const COR_ESTADO: Record<EstadoVisual, string> = {
  fronteira: "var(--questly-orange)",
  mestre: "var(--questly-gold)",
  dominado: "var(--questly-blue)",
  coberto: "var(--questly-green)",
  pendente: "var(--muted-foreground)",
  vazio: "var(--muted-foreground)",
  pulado: "var(--muted-foreground)",
};

// estilo do miolo do marcador (mesma linguagem do quest-log antigo)
const MARCA_ESTADO: Record<EstadoVisual, string> = {
  pulado: "border-border bg-muted text-muted-foreground",
  mestre: "border-questly-gold/50 bg-questly-gold-light text-questly-gold-dark",
  dominado: "border-questly-blue/40 bg-questly-blue-light text-questly-blue-dark",
  coberto: "border-questly-green/40 bg-questly-green-light text-questly-green-dark",
  vazio: "border-dashed border-border bg-card text-muted-foreground/60",
  pendente: "border-border bg-card text-muted-foreground",
  fronteira: "border-transparent bg-questly-orange text-white dark:text-[#241703]",
};

const BADGE_ESTADO: Record<EstadoVisual, { texto: string; classe: string }> = {
  pulado: { texto: "Pulado", classe: "bg-muted text-muted-foreground" },
  mestre: { texto: "Mestre", classe: "bg-questly-gold-light text-questly-gold-dark" },
  dominado: { texto: "Dominado", classe: "bg-questly-blue-light text-questly-blue-dark" },
  coberto: { texto: "Estudado", classe: "bg-questly-green-light text-questly-green-dark" },
  vazio: { texto: "Sem questões ainda", classe: "border border-dashed border-border text-muted-foreground" },
  pendente: { texto: "Na fila", classe: "bg-muted text-muted-foreground" },
  fronteira: { texto: "Você está aqui", classe: "bg-questly-orange-light text-questly-orange-dark" },
};

const ICONE_ESTADO: Partial<Record<EstadoVisual, React.ReactNode>> = {
  mestre: <Crown size={15} strokeWidth={2} />,
  dominado: <Check size={15} strokeWidth={2.25} />,
  coberto: <Check size={15} strokeWidth={2.25} />,
  pulado: <SkipForward size={14} strokeWidth={2} />,
  vazio: <span className="text-sm leading-none">·</span>,
  fronteira: <MapPin size={15} strokeWidth={2.25} />,
};

// mostra anel de progresso nesses estados (fração de cobertura rumo à meta)
const COM_ANEL = new Set<EstadoVisual>(["fronteira", "pendente", "coberto", "dominado", "mestre"]);

// ── Anel de progresso (mesmo padrão SVG do xp-diario-card) ──────────
function AnelProgresso({ size, pct, cor }: { size: number; pct: number; cor: string }) {
  const raio = size / 2 - 3;
  const circ = 2 * Math.PI * raio;
  const offset = circ - Math.min(1, Math.max(0, pct)) * circ;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute inset-0 -rotate-90"
    >
      <circle cx={size / 2} cy={size / 2} r={raio} fill="none" stroke="var(--muted)" strokeWidth="3" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={raio}
        fill="none"
        stroke={cor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

// ── Nó da jornada (o marcador na trilha serpenteante) ───────────────
export function NoJornada({
  topico,
  numero,
  selecionado,
  onSelect,
}: {
  topico: TopicoTrilha;
  numero: number;
  selecionado: boolean;
  onSelect: () => void;
}) {
  const reduzir = useReducedMotion();
  const est = visual(topico);
  const cor = COR_ESTADO[est];
  const ehFronteira = est === "fronteira";
  const size = ehFronteira ? 60 : 48;
  const anel = size + 10;

  return (
    <div className="relative flex flex-col items-center">
      {/* mascote (corpo inteiro) parado no nó onde o aluno está — a
          "respiração" já vive dentro do próprio Mascote e mantém os pés
          plantados; o offset faz os pés PISAREM na face do marcador (uns
          9px pra dentro da borda superior), senão ele parece flutuar */}
      {ehFronteira && (
        <motion.div
          className="pointer-events-none absolute -top-[66px] z-20"
          initial={reduzir ? false : { y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Mascote size={84} />
        </motion.div>
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-label={`Missão ${numero}: ${topico.nome}`}
        aria-pressed={selecionado}
        className="relative cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{ width: anel, height: anel }}
      >
        {/* anel de progresso (cobertura rumo à meta) */}
        {COM_ANEL.has(est) && (
          <AnelProgresso size={anel} pct={est === "mestre" ? 1 : topico.cobertura} cor={cor} />
        )}

        {/* glow pulsante: memória caindo (laranja) tem prioridade; senão
            mestre ganha um brilho dourado constante */}
        {topico.memoriaCaindo ? (
          <motion.span
            className="pointer-events-none absolute rounded-full"
            style={{ inset: -2, boxShadow: `0 0 0 2px var(--questly-orange)` }}
            animate={reduzir ? { opacity: 0.7 } : { opacity: [0.25, 0.75, 0.25] }}
            transition={reduzir ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : est === "mestre" ? (
          <motion.span
            className="pointer-events-none absolute rounded-full"
            style={{ inset: -2, boxShadow: `0 0 12px 1px color-mix(in oklab, var(--questly-gold) 55%, transparent)` }}
            animate={reduzir ? { opacity: 0.6 } : { opacity: [0.35, 0.8, 0.35] }}
            transition={reduzir ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}

        {/* anel de "você está aqui" */}
        {ehFronteira && !reduzir && (
          <motion.span
            className="pointer-events-none absolute rounded-full border-2 border-questly-orange"
            style={{ inset: 1 }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* o miolo do marcador — "botão de argila": sombra interna embaixo
            + sombra projetada no gramado (claymorphism, guia de design) */}
        <span
          className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border font-semibold shadow-[inset_0_-3px_0_rgba(0,0,0,0.14),inset_0_2px_0_rgba(255,255,255,0.25),0_5px_10px_rgba(0,0,0,0.22)] ${MARCA_ESTADO[est]} ${
            selecionado ? "ring-[3px] ring-white/80 dark:ring-white/40" : ""
          }`}
          style={{
            width: size,
            height: size,
            fontSize: ehFronteira ? 15 : 13,
            transform: "translate(-50%,-50%) perspective(400px) rotateX(6deg)",
          }}
        >
          <span className="tnum">{ICONE_ESTADO[est] || numero}</span>
        </span>

        {/* selo de risco na prova (canto) */}
        {topico.emRiscoProva && !topico.memoriaCaindo && (
          <span
            className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-questly-red text-white shadow"
            title="Você chega fraco nesse tópico no dia da prova"
          >
            <AlertTriangle size={11} strokeWidth={2.5} />
          </span>
        )}
      </button>
    </div>
  );
}

// ── Painel de detalhe do tópico selecionado ─────────────────────────
export function PainelTopico({
  topico,
  numero,
  pending,
  onSkip,
  onUndo,
  onPraticar,
}: {
  topico: TopicoTrilha;
  numero: number;
  pending: boolean;
  onSkip: () => void;
  onUndo: () => void;
  onPraticar: () => void;
}) {
  const est = visual(topico);
  const badge = BADGE_ESTADO[est];
  const ehFronteira = est === "fronteira";
  const podeAcao = est === "pendente" || est === "fronteira";
  const podeTreinar = est === "coberto" || est === "dominado";

  return (
    <motion.div
      key={topico.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="surface relative overflow-hidden p-5"
    >
      {est === "mestre" && (
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-[0.1] blur-2xl dark:opacity-[0.16]"
          style={{ background: "var(--questly-gold)" }}
        />
      )}
      <div className="relative z-10">
        <div className="mb-2.5 flex items-center gap-3">
          {ehFronteira && <Mascote size={44} />}
          <div className="min-w-0 flex-1">
            <span
              className={`tnum block text-[10.5px] font-semibold uppercase tracking-[0.09em] ${
                ehFronteira ? "text-questly-orange-dark" : "text-muted-foreground/60"
              }`}
            >
              Missão {numero}
            </span>
            <h3 className="truncate font-heading text-[16px] font-semibold tracking-tight">
              {topico.nome}
            </h3>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.classe}`}>
            {badge.texto}
          </span>
        </div>

        {topico.descricao && (
          <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">{topico.descricao}</p>
        )}

        {/* ── camadas inteligentes ── */}
        <CamadasInteligentes topico={topico} est={est} />

        {/* ── ações (idênticas às de sempre, por estado) ── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {podeAcao && (
            <>
              <MiniBotao onClick={onSkip} disabled={pending} variante="skip">
                <Check size={13} strokeWidth={2} />
                Já sei isso
              </MiniBotao>
              <MiniBotao onClick={onPraticar} disabled={pending} variante="recap">
                <Zap size={13} strokeWidth={2} />
                {pending ? "Preparando..." : "Fazer recap"}
              </MiniBotao>
            </>
          )}

          {est === "pulado" && (
            <MiniBotao onClick={onUndo} disabled={pending} variante="undo">
              <Undo2 size={13} strokeWidth={2} />
              Voltar pra trilha
            </MiniBotao>
          )}

          {(podeTreinar || (est === "mestre" && topico.memoriaCaindo)) && (
            <MiniBotao onClick={onPraticar} disabled={pending} variante="treinar">
              <Crown size={13} strokeWidth={2} />
              {pending
                ? "Preparando..."
                : est === "mestre"
                  ? "Revisar agora"
                  : "Treinar pra virar Mestre"}
            </MiniBotao>
          )}

          {est === "vazio" && (
            <span className="text-xs text-muted-foreground">
              Ainda não há questões desse tópico no banco.
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CamadasInteligentes({ topico, est }: { topico: TopicoTrilha; est: EstadoVisual }) {
  const num = Math.round(topico.cobertura * 5); // meta = 5 questões
  const temAlgo =
    topico.precisao != null ||
    topico.memoriaCaindo ||
    (topico.rumoMestre && !topico.rumoMestre.pronto) ||
    topico.emRiscoProva;

  return (
    <div className="flex flex-col gap-2">
      {/* barra de cobertura — só quando o tópico já tem alguma cobertura */}
      {(est === "coberto" || est === "dominado" || est === "mestre" || est === "fronteira") && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Cobertura</span>
            <span className="tnum">
              {Math.min(num, 5)}/5 questões{topico.precisao != null && ` · ${Math.round(topico.precisao * 100)}% de acerto`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-questly-green transition-[width] duration-700"
              style={{ width: `${Math.round(topico.cobertura * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* memória caindo (Ebbinghaus) */}
      {topico.memoriaCaindo && topico.retencao != null && (
        <Callout
          cor="orange"
          icone={<BrainCircuit size={14} strokeWidth={2} />}
          titulo={`Memória em ${Math.round(topico.retencao * 100)}%`}
          texto="Faz um tempo que você não revisa — uma revisão rápida trava o esquecimento."
        />
      )}

      {/* rumo a Mestre */}
      {topico.rumoMestre && !topico.rumoMestre.pronto && (est === "coberto" || est === "dominado") && (
        <Callout
          cor="gold"
          icone={<Sparkles size={14} strokeWidth={2} />}
          titulo="Rumo a Mestre"
          texto={rumoTexto(topico.rumoMestre)}
        />
      )}

      {/* projeção pro dia da prova */}
      {topico.emRiscoProva && topico.forcaNaProva != null && (
        <Callout
          cor="red"
          icone={<AlertTriangle size={14} strokeWidth={2} />}
          titulo={`No dia da prova: ~${Math.round(topico.forcaNaProva * 100)}%`}
          texto="Você estudou, mas a projeção diz que chega fraco no dia D. Reforce antes."
        />
      )}

      {!temAlgo && est !== "vazio" && est !== "pulado" && (
        <p className="text-[11.5px] text-muted-foreground">
          {est === "fronteira" || est === "pendente"
            ? "É por aqui que a sua trilha avança agora."
            : "Tópico em dia — nada urgente por aqui."}
        </p>
      )}
    </div>
  );
}

function rumoTexto(r: { faltamQuestoes: number; faltaPrecisao: number }): string {
  const partes: string[] = [];
  if (r.faltamQuestoes > 0) partes.push(`+${r.faltamQuestoes} ${r.faltamQuestoes === 1 ? "questão" : "questões"}`);
  if (r.faltaPrecisao > 0) partes.push(`+${Math.round(r.faltaPrecisao * 100)}% de acerto`);
  if (partes.length === 0) return "Você já bateu os requisitos — só falta consolidar.";
  return `Falta ${partes.join(" e ")} pra cravar o 🏅.`;
}

const COR_CALLOUT = {
  orange: "border-questly-orange/25 bg-questly-orange-light/60 text-questly-orange-dark",
  gold: "border-questly-gold/25 bg-questly-gold-light/60 text-questly-gold-dark",
  red: "border-questly-red/25 bg-questly-red-light/50 text-questly-red-dark",
} as const;

function Callout({
  cor,
  icone,
  titulo,
  texto,
}: {
  cor: keyof typeof COR_CALLOUT;
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className={`flex gap-2.5 rounded-xl border px-3 py-2 ${COR_CALLOUT[cor]}`}>
      <span className="mt-0.5 shrink-0">{icone}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold">{titulo}</span>
        <span className="block text-[11.5px] leading-snug opacity-80">{texto}</span>
      </span>
    </div>
  );
}

function MiniBotao({
  children,
  onClick,
  disabled,
  variante,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variante: "skip" | "recap" | "undo" | "treinar";
}) {
  const classes: Record<typeof variante, string> = {
    skip: "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
    recap: "border-transparent bg-questly-green text-white hover:brightness-105 dark:text-[#0c1512]",
    undo: "border-border bg-transparent text-questly-green-dark hover:bg-questly-green-light",
    treinar: "border-questly-gold/40 bg-questly-gold-light text-questly-gold-dark hover:brightness-[0.98]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${classes[variante]}`}
    >
      {children}
    </button>
  );
}
