"use client";

// A jornada de uma disciplina como um MAPA de verdade: um vale gramado
// (dia/noite conforme o tema) com lagos, árvores, pedras e flores
// (cenario-trilha.tsx), cortado por uma estrada de terra que serpenteia
// do "Início" até o castelo do Boss. Cada tópico da ementa é uma estação
// na estrada; o trecho já percorrido ganha pegadas verdes; o mascote
// (corpo inteiro) fica parado na fronteira ("você está aqui"). Clicar num
// nó abre o painel de detalhe (mesmas ações de sempre + camadas
// inteligentes). Substitui o quest-log vertical de caminho-disciplina.tsx.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Castle, Flag, Sparkles, X } from "lucide-react";
import type { CaminhoDisciplina as CaminhoDisciplinaData } from "@/lib/trilha/trilha-data";
import {
  buscarCaminhoDisciplinaAction,
  iniciarPraticaTopicoAction,
  mudarStatusTopicoAction,
} from "@/lib/trilha/actions";
import { BossEncontro } from "./boss-encontro";
import { CenarioTrilha } from "./cenario-trilha";
import { COR_ESTADO, NoJornada, PainelTopico } from "./no-jornada";

const ROW_H = 136; // distância vertical entre nós (folga pro cenário)
// PAD_TOP precisa comportar mascote (72px) + bandeira de largada quando a
// fronteira é o 1º nó — senão o mascote estoura o overflow-hidden e corta.
const PAD_TOP = 152;
// PAD_BOTTOM comporta o castelo + nome do boss + contagem de dias (o bloco
// é centralizado em bossY, então metade dele desce além de bossY) — senão
// ele cai em cima da legenda.
const PAD_BOTTOM = 200;
const AMP_PCT = 26; // amplitude horizontal da serpente (% da largura)

// paleta do cenário (dia ↔ noite) — CSS vars lidas pelo cenario-trilha e
// pela estrada; definidas aqui via arbitrary properties do Tailwind pra
// ficarem 100% tema-cientes sem tocar no globals.css
const VARS_CENARIO = [
  // gramado
  "[--cen-grama-1:#cfe9bd] dark:[--cen-grama-1:#1d3323]",
  "[--cen-grama-2:#b1d99b] dark:[--cen-grama-2:#16281c]",
  "[--cen-grama-tufo:#8fbf74] dark:[--cen-grama-tufo:#2f5138]",
  // estrada
  "[--cen-estrada:#e8cfa0] dark:[--cen-estrada:#4a3d2a]",
  "[--cen-estrada-borda:#cfae74] dark:[--cen-estrada-borda:#5c4c33]",
  "[--cen-estrada-centro:rgba(255,255,255,0.55)] dark:[--cen-estrada-centro:rgba(255,255,255,0.14)]",
  // vegetação
  "[--cen-copa-1:#57b16b] dark:[--cen-copa-1:#2b5e3d]",
  "[--cen-copa-2:#3f9457] dark:[--cen-copa-2:#224b30]",
  "[--cen-copa-brilho:#a9e3b4] dark:[--cen-copa-brilho:#4f8a5f]",
  "[--cen-tronco:#8a5a30] dark:[--cen-tronco:#4e301f]",
  // água
  "[--cen-agua:#7cc4e8] dark:[--cen-agua:#1f4a63]",
  "[--cen-agua-luz:#c8e9f8] dark:[--cen-agua-luz:#3c7295]",
  "[--cen-agua-borda:#5aa8d0] dark:[--cen-agua-borda:#173a4e]",
  // pedra / flor / sombra
  "[--cen-pedra:#b9bfc7] dark:[--cen-pedra:#3a4149]",
  "[--cen-pedra-luz:#e3e7ec] dark:[--cen-pedra-luz:#59626c]",
  "[--cen-flor-a:#ffffff] dark:[--cen-flor-a:#d6d2b8]",
  "[--cen-flor-b:#f6c6d8] dark:[--cen-flor-b:#a8748c]",
  "[--cen-flor-miolo:#f2b83b] dark:[--cen-flor-miolo:#caa034]",
  "[--cen-sombra:rgba(0,0,0,0.10)] dark:[--cen-sombra:rgba(0,0,0,0.32)]",
].join(" ");

type Props = {
  caminho: CaminhoDisciplinaData;
  onAtualizar: (caminho: CaminhoDisciplinaData) => void;
  onSalvo: () => void;
};

export function CaminhoJornada({ caminho, onAtualizar, onSalvo }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  // No celular o painel de detalhe vira um bottom sheet (o rail lateral só
  // existe no desktop — sem isso, tocar num nó "não fazia nada": o painel
  // renderizava abaixo do mapa inteiro, fora da tela). Só abre em toque
  // explícito do aluno, nunca na seleção padrão da fronteira.
  const [sheetAberto, setSheetAberto] = useState(false);

  const { topicos, progresso } = caminho;
  const fronteiraIdx = topicos.findIndex((t) => t.ehFronteira);

  // trava o scroll da página enquanto o sheet está aberto
  useEffect(() => {
    if (!sheetAberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [sheetAberto]);

  // seleção padrão: a fronteira; senão o 1º tópico. Persiste entre
  // refetches se o tópico ainda existir.
  const selIdx = (() => {
    const i = topicos.findIndex((t) => t.id === selId);
    if (i >= 0) return i;
    if (fronteiraIdx >= 0) return fronteiraIdx;
    return topicos.length > 0 ? 0 : -1;
  })();
  const selecionado = selIdx >= 0 ? topicos[selIdx] : null;

  async function refetch() {
    const atualizado = await buscarCaminhoDisciplinaAction(caminho.subjectId);
    if (atualizado) onAtualizar(atualizado);
  }

  async function marcar(topicoId: string, status: "pendente" | "pulado") {
    setPendingId(topicoId);
    await mudarStatusTopicoAction(topicoId, status);
    await refetch();
    setPendingId(null);
  }

  async function praticar(topicoId: string) {
    setPendingId(topicoId);
    const { missaoId } = await iniciarPraticaTopicoAction(caminho.subjectId, topicoId);
    if (missaoId) {
      router.push(`/questao?missao=${missaoId}`);
      return;
    }
    setPendingId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <CabecalhoJornada caminho={caminho} />

      {progresso.total === 0 ? (
        <div className="surface p-6 text-center text-sm text-muted-foreground">
          Essa disciplina ainda não tem ementa cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
          <MapaVale
            topicos={topicos}
            fronteiraIdx={fronteiraIdx}
            selId={selecionado?.id ?? null}
            onSelect={(id) => {
              setSelId(id);
              setSheetAberto(true);
            }}
            bossNome={caminho.bossNome}
            diasAteProva={caminho.diasAteProva}
          />

          <div className="flex flex-col gap-4 xl:sticky xl:top-7">
            {selecionado && (
              <div className="hidden xl:block">
                <PainelTopico
                  topico={selecionado}
                  numero={selIdx + 1}
                  pending={pendingId === selecionado.id}
                  onSkip={() => marcar(selecionado.id, "pulado")}
                  onUndo={() => marcar(selecionado.id, "pendente")}
                  onPraticar={() => praticar(selecionado.id)}
                />
              </div>
            )}
            <BossEncontro
              subjectId={caminho.subjectId}
              bossId={caminho.bossId}
              bossNome={caminho.bossNome}
              bossData={caminho.bossData}
              diasAteProva={caminho.diasAteProva}
              preparoPercentual={caminho.preparoPercentual}
              chanceAprovacao={caminho.chanceAprovacao}
              topicosEmenta={caminho.topicos.map((t) => ({ id: t.id, nome: t.nome }))}
              bossTopicoIds={caminho.bossTopicoIds}
              onSalvo={onSalvo}
            />
          </div>
        </div>
      )}

      {/* Bottom sheet do tópico (só < xl) — mesma PainelTopico do rail */}
      <AnimatePresence>
        {sheetAberto && selecionado && (
          <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={`Detalhes da missão ${selIdx + 1}: ${selecionado.nome}`}>
            <motion.button
              type="button"
              aria-label="Fechar detalhes"
              className="absolute inset-0 h-full w-full cursor-pointer bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSheetAberto(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background px-3 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between bg-background pb-1 pt-1.5">
                <span className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/25" />
                <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Detalhes da missão
                </span>
                <button
                  type="button"
                  onClick={() => setSheetAberto(false)}
                  aria-label="Fechar"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
              <PainelTopico
                topico={selecionado}
                numero={selIdx + 1}
                pending={pendingId === selecionado.id}
                onSkip={() => marcar(selecionado.id, "pulado")}
                onUndo={() => marcar(selecionado.id, "pendente")}
                onPraticar={() => praticar(selecionado.id)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CabecalhoJornada({ caminho }: { caminho: CaminhoDisciplinaData }) {
  const { progresso, projecao } = caminho;
  return (
    <div className="surface p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-[17px] font-semibold tracking-tight">
          Jornada de {caminho.subjectNome}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {projecao.notaProjetada != null && <ChipProjecao projecao={projecao} />}
          <span className="tnum rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {progresso.pct}% percorrido
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-questly-green"
          initial={{ width: 0 }}
          animate={{ width: `${progresso.pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <Contador valor={progresso.concluidos} rotulo="estudadas" />
        <Contador valor={progresso.pulados} rotulo="puladas" />
        <Contador valor={progresso.naFila} rotulo="na fila" />
        <Contador valor={progresso.total} rotulo="missões na trilha" />
      </div>
    </div>
  );
}

function ChipProjecao({ projecao }: { projecao: { notaProjetada: number | null; emRisco: number } }) {
  const nota = projecao.notaProjetada ?? 0;
  const cor =
    nota >= 70
      ? "bg-questly-green-light text-questly-green-dark"
      : nota >= 50
        ? "bg-questly-orange-light text-questly-orange-dark"
        : "bg-questly-red-light text-questly-red-dark";
  return (
    <span
      className={`tnum inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cor}`}
      title={
        projecao.emRisco > 0
          ? `${projecao.emRisco} tópico(s) devem chegar fracos no dia da prova`
          : "Projeção da sua força média no dia da prova"
      }
    >
      <Sparkles size={12} strokeWidth={2.25} />
      No dia D: ~{nota}%{projecao.emRisco > 0 ? ` · ${projecao.emRisco} em risco` : ""}
    </span>
  );
}

function Contador({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <span>
      <b className="tnum font-semibold text-foreground">{valor}</b> {rotulo}
    </span>
  );
}

// ── O mapa do vale ────────────────────────────────────────────────────
function MapaVale({
  topicos,
  fronteiraIdx,
  selId,
  onSelect,
  bossNome,
  diasAteProva,
}: {
  topicos: CaminhoDisciplinaData["topicos"];
  fronteiraIdx: number;
  selId: string | null;
  onSelect: (id: string) => void;
  bossNome: string | null;
  diasAteProva: number | null;
}) {
  const reduzir = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entradas) => setLargura(entradas[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = topicos.length;
  const altura = PAD_TOP + Math.max(0, n - 1) * ROW_H + PAD_BOTTOM;

  // posição de cada nó (x em %, y em px)
  const xPct = (i: number) => 50 + AMP_PCT * Math.sin(i * 0.8 + 0.35);
  const yPx = (i: number) => PAD_TOP + i * ROW_H;
  const xPx = (i: number) => (xPct(i) / 100) * largura;
  const bossY = PAD_TOP + Math.max(0, n - 1) * ROW_H + PAD_BOTTOM * 0.5;

  // até onde a estrada já foi percorrida (pegadas verdes)
  const walkedEnd = fronteiraIdx >= 0 ? fronteiraIdx : n - 1;

  const pontos = Array.from({ length: n }, (_, i) => ({ x: xPx(i), y: yPx(i) }));
  const pathD = construirPath(pontos, largura, bossY);
  const walkedD = construirPath(pontos.slice(0, walkedEnd + 1), largura, null);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${VARS_CENARIO}`}
      style={{ background: "linear-gradient(180deg, var(--cen-grama-1), var(--cen-grama-2))" }}
    >
      {/* nuvens à deriva */}
      {!reduzir && largura > 0 && (
        <>
          <Nuvem topo={36} duracao={56} atraso={0} largura={largura} escala={1} />
          <Nuvem topo={altura * 0.42} duracao={74} atraso={-30} largura={largura} escala={0.7} />
          <Nuvem topo={altura * 0.74} duracao={64} atraso={-14} largura={largura} escala={0.85} />
        </>
      )}

      <div ref={ref} className="relative mx-3 sm:mx-4" style={{ height: altura }}>
        {largura > 0 && (
          <svg
            width="100%"
            height={altura}
            viewBox={`0 0 ${largura} ${altura}`}
            className="pointer-events-none absolute inset-0"
            fill="none"
          >
            {/* paisagem (embaixo da estrada) */}
            <CenarioTrilha largura={largura} altura={altura} pontos={pontos} />

            {/* estrada de terra: borda + leito + linha central */}
            <path d={pathD} stroke="var(--cen-estrada-borda)" strokeWidth={26} strokeLinecap="round" />
            <path d={pathD} stroke="var(--cen-estrada)" strokeWidth={19} strokeLinecap="round" />
            <path
              d={pathD}
              stroke="var(--cen-estrada-centro)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="7 11"
            />

            {/* pegadas verdes no trecho já percorrido */}
            {walkedEnd > 0 && (
              <motion.path
                d={walkedD}
                stroke="var(--questly-green)"
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeDasharray="0.1 15"
                initial={reduzir ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </svg>
        )}

        {/* nós (estações da estrada) */}
        {topicos.map((t, i) => (
          <motion.div
            key={t.id}
            className="absolute z-10"
            style={{ left: `${xPct(i)}%`, top: yPx(i), transform: "translate(-50%,-50%)" }}
            initial={reduzir ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.5) }}
          >
            <NoJornada
              topico={t}
              numero={i + 1}
              selecionado={t.id === selId}
              onSelect={() => onSelect(t.id)}
            />
          </motion.div>
        ))}

        {/* castelo do Boss no fim da estrada */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{ left: "50%", top: bossY, transform: "translate(-50%,-50%)" }}
        >
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-questly-orange text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.25)] dark:text-[#241703]">
            <Castle size={27} strokeWidth={1.75} />
            {!reduzir && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-questly-orange"
                animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </span>
          <span className="mt-1.5 max-w-[150px] truncate rounded-full bg-black/25 px-2.5 py-0.5 text-center text-[11px] font-semibold text-white backdrop-blur-sm">
            {bossNome || "Boss da prova"}
          </span>
          {diasAteProva != null && (
            <span className="tnum mt-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              em {diasAteProva} {diasAteProva === 1 ? "dia" : "dias"}
            </span>
          )}
        </div>

        {/* bandeira de largada — fica acima da zona do mascote (ver PAD_TOP) */}
        <div
          className="absolute z-[5] flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
          style={{ left: `${xPct(0)}%`, top: 16, transform: "translateX(-50%)" }}
        >
          <Flag size={12} strokeWidth={2.25} className="text-questly-green-light" />
          Início
        </div>
      </div>

      {/* legenda flutuando sobre o gramado */}
      <Legenda />
    </div>
  );
}

// nuvem à deriva — dois ritmos, loop infinito atravessando o mapa
function Nuvem({
  topo,
  duracao,
  atraso,
  largura,
  escala,
}: {
  topo: number;
  duracao: number;
  atraso: number;
  largura: number;
  escala: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute z-[15] opacity-60 dark:opacity-25"
      style={{ top: topo }}
      initial={{ x: -140 * escala }}
      animate={{ x: largura + 140 * escala }}
      transition={{ duration: duracao, delay: atraso, repeat: Infinity, ease: "linear" }}
      aria-hidden
    >
      <svg width={120 * escala} height={40 * escala} viewBox="0 0 120 40">
        <g fill="white">
          <ellipse cx="38" cy="26" rx="26" ry="12" />
          <ellipse cx="66" cy="20" rx="22" ry="14" />
          <ellipse cx="92" cy="27" rx="20" ry="10" />
        </g>
      </svg>
    </motion.div>
  );
}

function construirPath(pontos: Array<{ x: number; y: number }>, largura: number, bossY: number | null): string {
  if (pontos.length === 0 || largura <= 0) return "";
  let d = `M ${pontos[0].x.toFixed(1)} ${pontos[0].y.toFixed(1)}`;
  for (let i = 1; i < pontos.length; i++) {
    const my = ((pontos[i - 1].y + pontos[i].y) / 2).toFixed(1);
    d += ` C ${pontos[i - 1].x.toFixed(1)} ${my}, ${pontos[i].x.toFixed(1)} ${my}, ${pontos[i].x.toFixed(1)} ${pontos[i].y.toFixed(1)}`;
  }
  // estende até o castelo do Boss
  if (bossY != null) {
    const last = pontos[pontos.length - 1];
    const bx = largura / 2;
    const my = ((last.y + bossY) / 2).toFixed(1);
    d += ` C ${last.x.toFixed(1)} ${my}, ${bx.toFixed(1)} ${my}, ${bx.toFixed(1)} ${bossY.toFixed(1)}`;
  }
  return d;
}

const LEGENDA: Array<{ estado: keyof typeof COR_ESTADO; rotulo: string }> = [
  { estado: "coberto", rotulo: "Estudado" },
  { estado: "mestre", rotulo: "Mestre" },
  { estado: "fronteira", rotulo: "Você está aqui" },
  { estado: "pendente", rotulo: "Na fila" },
];

function Legenda() {
  return (
    <div className="relative z-20 mx-3 mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border border-border/50 bg-card/80 px-3.5 py-2.5 shadow-sm backdrop-blur-sm sm:mx-4 sm:mb-4">
      {LEGENDA.map((l) => (
        <span key={l.estado} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span
            className="inline-flex h-3 w-3 items-center justify-center rounded-full"
            style={{ background: `color-mix(in oklab, ${COR_ESTADO[l.estado]} 65%, transparent)` }}
          />
          {l.rotulo}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="inline-flex h-3 w-3 rounded-full ring-2 ring-questly-orange" />
        Revisar / risco
      </span>
    </div>
  );
}
