"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Flag, Loader2, Sparkles, ThumbsUp, TimerOff, TrendingDown, X, Zap } from "lucide-react";
import { Chess } from "chess.js";
import type { DisciplinaPratica } from "@/lib/disciplinas/disciplinas-data";
import type { Pergunta } from "@/lib/questao/types";
import { questlyXpDaQuestao } from "@/lib/questly/shared";
import { MotorXadrez, MULTIPV_PADRAO } from "@/lib/xadrez/engine";
import {
  NIVEIS_IA,
  ROTULO_TIER,
  dificuldadeDaRodada,
  escolherIndicePorTier,
  tempoDaPergunta,
  tierDaResposta,
} from "@/lib/xadrez/regras";
import type {
  CorJogador,
  Dificuldade,
  NivelIa,
  PoolPerguntas,
  RegistroRodada,
  ResultadoPartida as Resultado,
  TierResposta,
} from "@/lib/xadrez/types";
import { finalizarPartidaAction, iniciarPartidaAction } from "@/lib/xadrez/actions";
import { Tabuleiro } from "./tabuleiro";
import { SetupPartida } from "./setup-partida";
import { PerguntaRodada } from "./pergunta-rodada";
import { ResultadoPartida } from "./resultado-partida";

// Orquestrador da Arena de Xadrez. Máquina de estados do loop:
//
//   setup → carregando → pergunta → avaliando → reveal → (vez da IA) → …
//                            ↑__________________________________|
//                                     (fim a qualquer meio-lance) → fim
//
// O estado "vivo" do jogo (chess.js, engine, pool, rodadas) mora em refs —
// o fluxo é async e atravessa vários renders; o que a UI precisa ver vira
// useState espelhado. O aluno nunca move peça: responder() é o único input
// durante a partida (o timer expira chamando responder(null)).

type Fase = "setup" | "carregando" | "pergunta" | "avaliando" | "reveal" | "ia" | "fim";

const MSG_ERRO_INICIO: Record<string, string> = {
  limite: "Sua partida grátis de hoje já foi. Assine o Pro pra jogar sem limite.",
  sem_questoes: "Ainda não há questões suficientes pra essa seleção — tente outra disciplina ou o modo Geral.",
  sessao: "Sessão expirada — recarregue a página e entre de novo.",
};

function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function ArenaXadrez({
  disciplinas,
  ehProAluno,
  partidasHojeIniciais,
  debugFen,
}: {
  disciplinas: DisciplinaPratica[];
  ehProAluno: boolean;
  partidasHojeIniciais: number;
  debugFen: string | null;
}) {
  const [fase, setFase] = useState<Fase>("setup");
  const [iniciando, setIniciando] = useState(false);
  const [erroSetup, setErroSetup] = useState<string | null>(null);
  const [partidasJogadas, setPartidasJogadas] = useState(partidasHojeIniciais);

  const [corJogador, setCorJogador] = useState<CorJogador>("brancas");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [lances, setLances] = useState<string[]>([]);
  const [ultimoLance, setUltimoLance] = useState<{ from: string; to: string } | null>(null);
  const [casaXeque, setCasaXeque] = useState<string | null>(null);

  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [numeroRodada, setNumeroRodada] = useState(1);
  const [tempoTotalSeg, setTempoTotalSeg] = useState(45);
  const [restanteSeg, setRestanteSeg] = useState(45);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [toastTier, setToastTier] = useState<TierResposta | null>(null);
  const [xpLocal, setXpLocal] = useState(0);

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [servidor, setServidor] = useState<{ xpGanho: number; acertos: number; erros: number } | null>(null);
  const [erroFinalizar, setErroFinalizar] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  // estado vivo do jogo (atravessa awaits sem closure velha)
  const faseRef = useRef<Fase>("setup");
  const chessRef = useRef<Chess | null>(null);
  const motorRef = useRef<MotorXadrez | null>(null);
  const poolRef = useRef<PoolPerguntas | null>(null);
  const usadasRef = useRef<Set<string>>(new Set());
  const acertadasRef = useRef<Set<string>>(new Set());
  const recicladaRef = useRef(false);
  const rodadasRef = useRef<RegistroRodada[]>([]);
  const lancesRef = useRef<string[]>([]);
  const perguntaRef = useRef<Pergunta | null>(null);
  const inicioMsRef = useRef(0);
  const tempoTotalRef = useRef(45);
  const partidaIdRef = useRef<string | null>(null);
  const corRef = useRef<CorJogador>("brancas");
  const nivelRef = useRef<NivelIa>("medio");
  const encerradaRef = useRef(false);

  function mudarFase(f: Fase) {
    faseRef.current = f;
    setFase(f);
  }

  function corChar(): "w" | "b" {
    return corRef.current === "brancas" ? "w" : "b";
  }

  async function iniciar(config: { subjectId: string | null; nivelIa: NivelIa; cor: "brancas" | "pretas" | "aleatoria" }) {
    setIniciando(true);
    setErroSetup(null);
    const res = await iniciarPartidaAction(config);
    if ("erro" in res) {
      setErroSetup(MSG_ERRO_INICIO[res.erro] ?? "Não foi possível iniciar a partida.");
      setIniciando(false);
      if (res.erro === "limite") setPartidasJogadas((n) => Math.max(n, 1));
      return;
    }

    partidaIdRef.current = res.partidaId;
    poolRef.current = res.pool;
    corRef.current = res.cor;
    nivelRef.current = config.nivelIa;
    usadasRef.current = new Set();
    acertadasRef.current = new Set();
    rodadasRef.current = [];
    lancesRef.current = [];
    encerradaRef.current = false;

    let chess: Chess;
    try {
      chess = debugFen ? new Chess(debugFen) : new Chess();
    } catch {
      chess = new Chess();
    }
    chessRef.current = chess;

    setCorJogador(res.cor);
    setFen(chess.fen());
    setLances([]);
    setUltimoLance(null);
    setCasaXeque(null);
    setXpLocal(0);
    setServidor(null);
    setErroFinalizar(null);
    setResultado(null);
    setPartidasJogadas((n) => n + 1);
    setIniciando(false);
    mudarFase("carregando");

    const motor = new MotorXadrez();
    motorRef.current = motor;
    try {
      await motor.init();
    } catch {
      setErroSetup("Não foi possível carregar o motor de xadrez — verifique a conexão e tente de novo.");
      mudarFase("setup");
      return;
    }
    await avancar();
  }

  // decide o próximo passo a cada meio-lance
  async function avancar() {
    const chess = chessRef.current;
    if (!chess || encerradaRef.current) return;
    if (chess.isGameOver()) {
      await encerrar(resultadoDoJogo(chess));
      return;
    }
    if (chess.turn() === corChar()) {
      proximaPergunta();
    } else {
      await lanceDaIA();
    }
  }

  async function lanceDaIA() {
    mudarFase("ia");
    const chess = chessRef.current!;
    let uci: string | null = null;
    try {
      uci = await motorRef.current!.escolherLanceIA(chess.fen(), nivelRef.current);
    } catch {
      uci = null;
    }
    if (encerradaRef.current) return;
    if (!uci) uci = lanceFallback(chess);
    if (!uci) {
      await encerrar(resultadoDoJogo(chess));
      return;
    }
    aplicarLance(uci);
    await esperar(900);
    await avancar();
  }

  function proximaPergunta() {
    const chess = chessRef.current!;
    const escolhida = tirarPergunta(chess.moveNumber());
    if (!escolhida) {
      void encerrar(resultadoDoJogo(chess));
      return;
    }
    perguntaRef.current = escolhida.pergunta;
    recicladaRef.current = escolhida.reciclada;
    const total = tempoDaPergunta(escolhida.pergunta.tempo_medio_seg);
    tempoTotalRef.current = total;
    inicioMsRef.current = Date.now();

    setPergunta(escolhida.pergunta);
    setTempoTotalSeg(total);
    setRestanteSeg(total);
    setSelecionada(null);
    setReveal(false);
    setNumeroRodada(rodadasRef.current.length + 1);
    mudarFase("pergunta");
  }

  function tirarPergunta(fullmove: number): { pergunta: Pergunta; reciclada: boolean } | null {
    const pool = poolRef.current;
    if (!pool) return null;
    for (const tier of ordemTiers(dificuldadeDaRodada(fullmove))) {
      const disponivel = pool[tier].find((p) => !usadasRef.current.has(p.id));
      if (disponivel) {
        usadasRef.current.add(disponivel.id);
        return { pergunta: disponivel, reciclada: false };
      }
    }
    // pool esgotado: recicla uma já vista (XP local 0; o servidor deduplica
    // de qualquer forma) — partida longa não trava por falta de questão
    const todas = [...pool.facil, ...pool.medio, ...pool.dificil];
    if (todas.length === 0) return null;
    return { pergunta: todas[Math.floor(Math.random() * todas.length)], reciclada: true };
  }

  async function responder(letra: string | null) {
    if (faseRef.current !== "pergunta") return;
    const perguntaAtual = perguntaRef.current;
    const chess = chessRef.current;
    if (!perguntaAtual || !chess) return;

    mudarFase("avaliando");
    const tempoSeg = Math.min(
      tempoTotalRef.current,
      Math.round((Date.now() - inicioMsRef.current) / 1000),
    );
    const expirou = letra === null;
    const correta = !expirou && letra === perguntaAtual.gabarito;
    const tier = tierDaResposta(correta, tempoSeg, tempoTotalRef.current, expirou);

    setSelecionada(letra);
    setReveal(true);
    rodadasRef.current.push({ questionId: perguntaAtual.id, correta, tempoSeg, tier });
    if (correta && !recicladaRef.current && !acertadasRef.current.has(perguntaAtual.id)) {
      acertadasRef.current.add(perguntaAtual.id);
      setXpLocal((x) => x + questlyXpDaQuestao(perguntaAtual));
    }

    // grading sempre em força máxima; o tier escolhe a posição no ranking
    const soUmLance = chess.moves().length <= 1;
    let uci: string | null = null;
    try {
      const avaliados = await motorRef.current!.avaliarLances(
        chess.fen(),
        Math.min(MULTIPV_PADRAO, Math.max(1, chess.moves().length)),
      );
      if (avaliados.length > 0) {
        const idx = Math.min(escolherIndicePorTier(tier, avaliados.length), avaliados.length - 1);
        uci = avaliados[idx].uci;
      }
    } catch {
      uci = null;
    }
    if (encerradaRef.current) return;
    if (!uci) uci = lanceFallback(chess);
    if (!uci) {
      await encerrar(resultadoDoJogo(chess));
      return;
    }

    aplicarLance(uci);
    setToastTier(soUmLance ? null : tier);
    mudarFase("reveal");
    await esperar(1700);
    setToastTier(null);
    setReveal(false);
    setPergunta(null);
    perguntaRef.current = null;
    await avancar();
  }

  function aplicarLance(uci: string) {
    const chess = chessRef.current!;
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    lancesRef.current.push(mv.san);
    setLances([...lancesRef.current]);
    setFen(chess.fen());
    setUltimoLance({ from: mv.from, to: mv.to });
    setCasaXeque(chess.isCheck() ? casaDoRei(chess, chess.turn()) : null);
  }

  function resultadoDoJogo(chess: Chess): Resultado {
    if (chess.isCheckmate()) return chess.turn() === corChar() ? "derrota" : "vitoria";
    return "empate";
  }

  async function encerrar(resultadoFinal: Resultado) {
    if (encerradaRef.current) return;
    encerradaRef.current = true;
    setResultado(resultadoFinal);
    setToastTier(null);
    mudarFase("fim");

    setFinalizando(true);
    const res = await finalizarPartidaAction({
      partidaId: partidaIdRef.current!,
      resultado: resultadoFinal,
      lances: lancesRef.current,
      rodadas: rodadasRef.current,
    });
    if ("erro" in res) setErroFinalizar(res.erro);
    else setServidor(res);
    setFinalizando(false);
  }

  function desistir() {
    if (encerradaRef.current) return;
    if (window.confirm("Desistir da partida? Ela conta como derrota.")) {
      void encerrar("derrota");
    }
  }

  // timer da rodada — o tier usa Date.now()−inicioMs (imune a drift); o
  // interval só redesenha o anel e dispara o timeout
  const responderRef = useRef(responder);
  useEffect(() => {
    responderRef.current = responder;
  });
  useEffect(() => {
    if (fase !== "pergunta") return;
    const id = setInterval(() => {
      const resta = tempoTotalRef.current - (Date.now() - inicioMsRef.current) / 1000;
      setRestanteSeg(resta);
      if (resta <= 0) {
        clearInterval(id);
        void responderRef.current(null);
      }
    }, 250);
    return () => clearInterval(id);
  }, [fase]);

  // sair da página no meio = partida perdida (a linha vira 'abandonada' no
  // próximo início; o slot do dia já foi consumido) — só solta o worker
  useEffect(() => {
    return () => motorRef.current?.destruir();
  }, []);

  const bloqueadoFreemium = !ehProAluno && partidasJogadas >= 1;

  if (fase === "setup") {
    return (
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <header>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Arena de Xadrez</h1>
          <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
            Você não move as peças — suas respostas movem. Acerte a questão da rodada e o motor joga um
            lance forte por você; erre e ele vacila. A dificuldade sobe conforme a partida avança.
          </p>
        </header>
        <SetupPartida
          disciplinas={disciplinas}
          bloqueado={bloqueadoFreemium}
          iniciando={iniciando}
          erro={erroSetup}
          onIniciar={iniciar}
        />
      </div>
    );
  }

  if (fase === "fim") {
    return (
      <ResultadoPartida
        resultado={resultado ?? "empate"}
        nivelIa={nivelRef.current}
        finalizando={finalizando}
        erro={erroFinalizar}
        servidor={servidor}
        rodadas={rodadasRef.current}
        totalLances={lancesRef.current.length}
        perguntasErradas={perguntasErradasDoPool(poolRef.current, rodadasRef.current)}
        podeJogarDeNovo={ehProAluno || partidasJogadas < 1}
        onJogarDeNovo={() => mudarFase("setup")}
      />
    );
  }

  if (fase === "carregando") {
    return (
      <div className="mx-auto flex w-full max-w-[860px] flex-col items-center gap-3 px-4 py-24 text-center">
        <Loader2 size={28} strokeWidth={2} className="animate-spin text-questly-green" />
        <p className="text-[14px] font-semibold">Acordando o motor de xadrez…</p>
        <p className="text-[12.5px] text-muted-foreground">Primeira vez demora alguns segundos (baixando o cérebro da máquina).</p>
      </div>
    );
  }

  const infoNivel = NIVEIS_IA[nivelRef.current];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 py-5 sm:px-6">
      {/* HUD do topo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={desistir}
          title="Desistir da partida"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-tight">Arena de Xadrez</p>
          <p className="truncate text-[11.5px] text-muted-foreground">
            Máquina no nível {infoNivel.rotulo.toLowerCase()} · você de {corJogador}
          </p>
        </div>
        <div className="tnum flex shrink-0 items-center gap-1 text-xs font-semibold text-questly-gold-dark sm:text-[13px]">
          <Zap size={13} strokeWidth={2} />
          +{xpLocal} XP
        </div>
        <button
          type="button"
          onClick={desistir}
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-red/50 hover:text-questly-red-dark sm:inline-flex"
        >
          <Flag size={13} strokeWidth={2} />
          Desistir
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* coluna do tabuleiro */}
        <div className="flex min-w-0 flex-col gap-3">
          <BarraJogador
            nome={`Máquina · ${infoNivel.rotulo}`}
            cor={corJogador === "brancas" ? "pretas" : "brancas"}
            pensando={fase === "ia"}
            maquina
          />
          <div className="relative mx-auto w-full max-w-[640px]">
            <Tabuleiro fen={fen} flip={corJogador === "pretas"} ultimoLance={ultimoLance} casaXeque={casaXeque} />

            {/* toast do tier do lance */}
            <AnimatePresence>
              {toastTier && (
                <motion.div
                  key={toastTier + lances.length}
                  initial={{ opacity: 0, y: 14, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center"
                >
                  <ToastTier tier={toastTier} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <BarraJogador nome="Você" cor={corJogador} pensando={fase === "pergunta" || fase === "avaliando"} />

          {/* lances em SAN */}
          {lances.length > 0 && (
            <div className="surface overflow-x-auto p-3">
              <div className="flex w-max items-center gap-1.5 font-mono text-[12px] text-muted-foreground">
                {lances.map((san, i) => (
                  <span key={i} className={i === lances.length - 1 ? "rounded bg-questly-gold/20 px-1 font-semibold text-foreground" : ""}>
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""}
                    {san}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* trilho da pergunta */}
        <div className="min-w-0">
          {pergunta ? (
            <PerguntaRodada
              pergunta={pergunta}
              numeroRodada={numeroRodada}
              tempoTotalSeg={tempoTotalSeg}
              restanteSeg={restanteSeg}
              selecionada={selecionada}
              respondida={reveal}
              travada={fase !== "pergunta"}
              onResponder={(letra) => void responder(letra)}
            />
          ) : (
            <div className="surface flex flex-col items-center gap-2.5 p-8 text-center">
              <Bot size={22} strokeWidth={1.8} className="text-muted-foreground" />
              <p className="text-[13.5px] font-semibold">A máquina está pensando…</p>
              <p className="text-[12px] text-muted-foreground">Sua próxima questão chega logo depois do lance dela.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BarraJogador({
  nome,
  cor,
  pensando,
  maquina = false,
}: {
  nome: string;
  cor: CorJogador;
  pensando: boolean;
  maquina?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cor === "brancas" ? "/pecas/wK.svg" : "/pecas/bK.svg"} alt="" className="h-5.5 w-5.5" draggable={false} />
      </span>
      <span className="text-[13px] font-semibold">{nome}</span>
      {maquina && <Bot size={14} strokeWidth={2} className="text-muted-foreground" />}
      {pensando && (
        <span className="ml-auto flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-questly-green opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-questly-green" />
          </span>
          {maquina ? "pensando…" : "sua vez"}
        </span>
      )}
    </div>
  );
}

function ToastTier({ tier }: { tier: TierResposta }) {
  const config: Record<TierResposta, { classe: string; Icone: typeof Sparkles }> = {
    brilhante: {
      classe: "bg-gradient-to-r from-questly-gold to-amber-400 text-[#3a2a05] ring-white/50",
      Icone: Sparkles,
    },
    bom: { classe: "bg-questly-green text-white ring-white/30", Icone: ThumbsUp },
    fraco: { classe: "bg-questly-red text-white ring-white/25", Icone: TrendingDown },
    timeout: { classe: "bg-neutral-700 text-white ring-white/20", Icone: TimerOff },
  };
  const { classe, Icone } = config[tier];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold shadow-xl ring-2 ${classe}`}>
      <Icone size={16} strokeWidth={2.25} />
      {ROTULO_TIER[tier]}
    </span>
  );
}

function ordemTiers(alvo: Dificuldade): Dificuldade[] {
  if (alvo === "facil") return ["facil", "medio", "dificil"];
  if (alvo === "medio") return ["medio", "facil", "dificil"];
  return ["dificil", "medio", "facil"];
}

function lanceFallback(chess: Chess): string | null {
  const legais = chess.moves({ verbose: true });
  if (legais.length === 0) return null;
  const mv = legais[Math.floor(Math.random() * legais.length)];
  return mv.from + mv.to + (mv.promotion ?? "");
}

function casaDoRei(chess: Chess, cor: "w" | "b"): string | null {
  for (const fileira of chess.board()) {
    for (const casa of fileira) {
      if (casa && casa.type === "k" && casa.color === cor) return casa.square;
    }
  }
  return null;
}

function perguntasErradasDoPool(pool: PoolPerguntas | null, rodadas: RegistroRodada[]): Pergunta[] {
  if (!pool) return [];
  const todas = new Map([...pool.facil, ...pool.medio, ...pool.dificil].map((p) => [p.id, p]));
  const idsErradas = new Set(rodadas.filter((r) => !r.correta).map((r) => r.questionId));
  // quem errou E acertou depois (reciclada) continua na revisão — errar uma
  // vez já é sinal pra rever
  return Array.from(idsErradas)
    .map((id) => todas.get(id))
    .filter((p): p is Pergunta => Boolean(p));
}
