"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { registrarSessaoFocoAction } from "@/lib/foco/actions";
import { toISODate } from "@/lib/questly/shared";
import type { NomeInsignia } from "@/components/insignias/insignia";

export type ModoFoco = "cronometro" | "timer";
type EstadoFoco = "parado" | "rodando" | "pausado";

export type Celebracao = { titulo: string; sub: string; cor: string; insignia: NomeInsignia };

// Cores predefinidas pra personalizar a sessão de foco (pedido do usuário).
export const CORES_FOCO = [
  "#5b5bd6", // índigo (padrão)
  "#2e9ab3", // ciano
  "#16a34a", // verde
  "#d4a017", // âmbar
  "#e0533d", // laranja
  "#db2777", // rosa
  "#8b5cf6", // violeta
] as const;

// Estado durável da sessão (o que sobrevive a refresh via localStorage). O
// tempo é derivado de timestamps, não de um contador incrementado — assim não
// há drift e a barra retoma certo depois de um refresh/reconexão.
type Sessao = {
  estado: EstadoFoco;
  modo: ModoFoco;
  objetivo: string;
  cor: string;
  alvoMin: number; // usado só no modo "timer"
  acumuladoSeg: number; // segundos já acumulados antes do trecho atual
  iniciadoEm: number | null; // timestamp (ms) do início do trecho atual
};

const SESSAO_INICIAL: Sessao = {
  estado: "parado",
  modo: "cronometro",
  objetivo: "",
  cor: CORES_FOCO[0],
  alvoMin: 25,
  acumuladoSeg: 0,
  iniciadoEm: null,
};

const CHAVE_LS = "questly_foco_v1";
// Batimento gravado a cada tick enquanto roda. Sem ele, fechar a aba com uma
// sessão rodando e voltar no dia seguinte creditaria as horas em que ninguém
// estava estudando (o tempo é derivado de `iniciadoEm`).
const CHAVE_VISTO = "questly_foco_visto_v1";
// Buraco tolerado entre o último batimento e a volta: F5/navegação levam menos
// que isso, então a sessão retoma sem perder nada; sumiço maior vira pausa no
// último instante com sinal de vida.
const GAP_MAX_MS = 90_000;
// Depois de iniciar, a barra se recolhe sozinha pra não roubar a tela — o
// aluno vê que começou e ela sai da frente (hover devolve por um instante).
const AUTO_COLAPSA_MS = 2400;
const CELEBRACAO_MS = 5000;
// Piso pra gravar a sessão: menos que isso é clique sem querer.
const MIN_SEG_VALIDA = 20;

type FocoContexto = {
  modo: ModoFoco;
  estado: EstadoFoco;
  objetivo: string;
  cor: string;
  alvoMin: number;
  segundos: number;
  restanteSeg: number;
  focoHojeSeg: number;
  barraAberta: boolean;
  colapsada: boolean;
  montado: boolean;
  celebracao: Celebracao | null;
  abrirBarra: () => void;
  fecharBarra: () => void;
  alternarBarra: () => void;
  setObjetivo: (v: string) => void;
  setCor: (v: string) => void;
  setModo: (m: ModoFoco) => void;
  setAlvoMin: (m: number) => void;
  iniciar: () => void;
  pausar: () => void;
  retomar: () => void;
  finalizar: () => void;
  descartar: () => void;
  colapsar: () => void;
  expandir: () => void;
  limparCelebracao: () => void;
};

const Ctx = createContext<FocoContexto | null>(null);

export function useFoco(): FocoContexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFoco precisa estar dentro de <FocoProvider>");
  return ctx;
}

function segundosDaSessao(s: Sessao): number {
  const corrido =
    s.estado === "rodando" && s.iniciadoEm ? Math.floor((Date.now() - s.iniciadoEm) / 1000) : 0;
  return s.acumuladoSeg + corrido;
}

// Reidrata a sessão salva descontando o tempo em que a aba esteve fechada.
function restaurarSessao(salvo: Sessao, vistoEm: number): Sessao {
  if (salvo.estado !== "rodando" || !salvo.iniciadoEm) return salvo;
  const agora = Date.now();
  // Relógio do sistema pra trás (fuso/ajuste) — não dá pra confiar no delta.
  if (salvo.iniciadoEm > agora) return { ...salvo, estado: "pausado", iniciadoEm: null };
  if (vistoEm > 0 && agora - vistoEm <= GAP_MAX_MS) return salvo;

  const ate = Math.min(agora, Math.max(salvo.iniciadoEm, vistoEm));
  return {
    ...salvo,
    estado: "pausado",
    acumuladoSeg: salvo.acumuladoSeg + Math.floor((ate - salvo.iniciadoEm) / 1000),
    iniciadoEm: null,
  };
}

export function FocoProvider({
  children,
  focoHojeSegInicial = 0,
}: {
  children: React.ReactNode;
  focoHojeSegInicial?: number;
}) {
  const [sessao, setSessao] = useState<Sessao>(SESSAO_INICIAL);
  const [barraAberta, setBarraAberta] = useState(false);
  const [colapsada, setColapsada] = useState(false);
  const [focoHojeSeg, setFocoHojeSeg] = useState(focoHojeSegInicial);
  const [celebracao, setCelebracao] = useState<Celebracao | null>(null);
  const [montado, setMontado] = useState(false);
  const [, setTick] = useState(0);

  // Espelho do total do dia pra montar a frase de conclusão com o valor certo
  // sem depender do fechamento desatualizado dentro do finalizar.
  const focoHojeRef = useRef(focoHojeSeg);
  useEffect(() => {
    focoHojeRef.current = focoHojeSeg;
  }, [focoHojeSeg]);

  // Espelho da sessão: as ações leem daqui em vez de fazer efeito colateral
  // dentro do updater do setState (o React pode chamar o updater duas vezes —
  // em StrictMode ele chama — e isso gravava a sessão de foco em dobro).
  const sessaoRef = useRef(sessao);
  useEffect(() => {
    sessaoRef.current = sessao;
  }, [sessao]);

  const autoColapsoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebracaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelarAutoColapso = useCallback(() => {
    if (autoColapsoRef.current) {
      clearTimeout(autoColapsoRef.current);
      autoColapsoRef.current = null;
    }
  }, []);

  const limparCelebracao = useCallback(() => {
    if (celebracaoRef.current) {
      clearTimeout(celebracaoRef.current);
      celebracaoRef.current = null;
    }
    setCelebracao(null);
  }, []);

  // Some sozinha depois de alguns segundos. Fica no provider (e não num
  // useEffect do overlay) porque lá o timeout reiniciava a cada re-render da
  // barra — que acontece de segundo em segundo.
  const celebrar = useCallback((c: Celebracao) => {
    if (celebracaoRef.current) clearTimeout(celebracaoRef.current);
    setCelebracao(c);
    celebracaoRef.current = setTimeout(() => {
      celebracaoRef.current = null;
      setCelebracao(null);
    }, CELEBRACAO_MS);
  }, []);

  useEffect(
    () => () => {
      if (autoColapsoRef.current) clearTimeout(autoColapsoRef.current);
      if (celebracaoRef.current) clearTimeout(celebracaoRef.current);
    },
    [],
  );

  // Restaura a sessão do localStorage no mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMontado(true);
    try {
      const bruto = localStorage.getItem(CHAVE_LS);
      if (!bruto) return;
      const salvo = { ...SESSAO_INICIAL, ...(JSON.parse(bruto) as Partial<Sessao>) };
      const vistoEm = Number(localStorage.getItem(CHAVE_VISTO)) || 0;
      const sessaoAtual = restaurarSessao(salvo, vistoEm);
      setSessao(sessaoAtual);
      if (sessaoAtual.estado !== "parado") {
        setBarraAberta(true);
        // Volta recolhida: quem deu F5 no meio da sessão quer a página, não a
        // barra ocupando o topo de novo.
        setColapsada(true);
      }
    } catch {
      /* localStorage indisponível/corrompido — começa limpo */
    }
  }, []);

  useEffect(() => {
    if (!montado) return;
    try {
      localStorage.setItem(CHAVE_LS, JSON.stringify(sessao));
    } catch {
      /* ignora */
    }
  }, [sessao, montado]);

  const segundos = segundosDaSessao(sessao);
  const restanteSeg =
    sessao.modo === "timer" ? Math.max(0, sessao.alvoMin * 60 - segundos) : Infinity;

  const persistir = useCallback(async (segFocados: number, modo: ModoFoco, objetivo: string) => {
    if (segFocados < MIN_SEG_VALIDA) return;
    setFocoHojeSeg((v) => v + segFocados);
    try {
      const res = await registrarSessaoFocoAction({
        objetivo: objetivo || null,
        segundos: segFocados,
        modo,
        data: toISODate(new Date()),
      });
      if (res.ok && res.totalSeg > 0) setFocoHojeSeg(res.totalSeg);
    } catch {
      /* mantém o otimista */
    }
  }, []);

  const colapsar = useCallback(() => {
    cancelarAutoColapso();
    setColapsada(true);
  }, [cancelarAutoColapso]);

  const expandir = useCallback(() => {
    cancelarAutoColapso();
    setColapsada(false);
  }, [cancelarAutoColapso]);

  const iniciar = useCallback(() => {
    cancelarAutoColapso();
    setColapsada(false);
    setBarraAberta(true);
    try {
      localStorage.setItem(CHAVE_VISTO, String(Date.now()));
    } catch {
      /* ignora */
    }
    setSessao((s) => ({ ...s, estado: "rodando", iniciadoEm: Date.now(), acumuladoSeg: 0 }));
    autoColapsoRef.current = setTimeout(() => {
      autoColapsoRef.current = null;
      setColapsada(true);
    }, AUTO_COLAPSA_MS);
  }, [cancelarAutoColapso]);

  const pausar = useCallback(() => {
    cancelarAutoColapso();
    setSessao((s) =>
      s.estado === "rodando"
        ? { ...s, estado: "pausado", acumuladoSeg: segundosDaSessao(s), iniciadoEm: null }
        : s,
    );
  }, [cancelarAutoColapso]);

  const retomar = useCallback(() => {
    setSessao((s) =>
      s.estado === "pausado" ? { ...s, estado: "rodando", iniciadoEm: Date.now() } : s,
    );
  }, []);

  const finalizar = useCallback(() => {
    cancelarAutoColapso();
    setColapsada(false);
    const s = sessaoRef.current;
    if (s.estado === "parado") return;
    const seg = segundosDaSessao(s);
    sessaoRef.current = { ...SESSAO_INICIAL, modo: s.modo, alvoMin: s.alvoMin, cor: s.cor };
    setSessao(sessaoRef.current);
    if (seg >= MIN_SEG_VALIDA) celebrar(fraseFoco(focoHojeRef.current + seg, s.cor));
    void persistir(seg, s.modo, s.objetivo);
  }, [cancelarAutoColapso, celebrar, persistir]);

  const descartar = useCallback(() => {
    cancelarAutoColapso();
    setColapsada(false);
    const s = sessaoRef.current;
    sessaoRef.current = { ...SESSAO_INICIAL, modo: s.modo, alvoMin: s.alvoMin, cor: s.cor };
    setSessao(sessaoRef.current);
  }, [cancelarAutoColapso]);

  // Relógio: um tick por segundo só enquanto roda. O valor exibido vem de
  // timestamps (segundosDaSessao), então o tick só força o re-render — e de
  // quebra grava o batimento que protege contra aba fechada.
  const { estado, modo, alvoMin } = sessao;
  useEffect(() => {
    if (estado !== "rodando") return;
    const id = setInterval(() => {
      try {
        localStorage.setItem(CHAVE_VISTO, String(Date.now()));
      } catch {
        /* ignora */
      }
      if (modo === "timer" && segundosDaSessao(sessaoRef.current) >= alvoMin * 60) {
        finalizar();
        return;
      }
      setTick((t) => (t + 1) % 1_000_000);
    }, 1000);
    return () => clearInterval(id);
  }, [estado, modo, alvoMin, finalizar]);

  const valor = useMemo<FocoContexto>(() => {
    const ativo = sessao.estado !== "parado";
    return {
      modo: sessao.modo,
      estado: sessao.estado,
      objetivo: sessao.objetivo,
      cor: sessao.cor,
      alvoMin: sessao.alvoMin,
      segundos,
      restanteSeg,
      focoHojeSeg,
      barraAberta,
      colapsada,
      montado,
      celebracao,
      abrirBarra: () => {
        cancelarAutoColapso();
        setColapsada(false);
        setBarraAberta(true);
      },
      fecharBarra: () => setBarraAberta(false),
      // Com sessão rolando, a barra não fecha (perderia o cronômetro de
      // vista): o botão do header vira recolher/expandir.
      alternarBarra: () => {
        cancelarAutoColapso();
        if (ativo) {
          setColapsada((v) => !v);
          return;
        }
        setColapsada(false);
        setBarraAberta((v) => !v);
      },
      setObjetivo: (v) => setSessao((s) => ({ ...s, objetivo: v })),
      setCor: (v) => setSessao((s) => ({ ...s, cor: v })),
      setModo: (m) => setSessao((s) => (s.estado === "parado" ? { ...s, modo: m } : s)),
      setAlvoMin: (m) =>
        setSessao((s) => (s.estado === "parado" ? { ...s, alvoMin: Math.max(1, m) } : s)),
      iniciar,
      pausar,
      retomar,
      finalizar,
      descartar,
      colapsar,
      expandir,
      limparCelebracao,
    };
  }, [
    sessao,
    segundos,
    restanteSeg,
    focoHojeSeg,
    barraAberta,
    colapsada,
    montado,
    celebracao,
    cancelarAutoColapso,
    iniciar,
    pausar,
    retomar,
    finalizar,
    descartar,
    colapsar,
    expandir,
    limparCelebracao,
  ]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function formatarRelogio(seg: number): string {
  if (!Number.isFinite(seg)) return "--:--";
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}

export function formatarDuracaoCurta(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

// Frase comemorativa no fim da sessão — SEMPRE baseada no total do dia
// (pedido do usuário: "UAU! 6 HORAS DE FOCO"). A escala agora é de MATERIAL:
// o brasão sobe de chama → raio → cometa → troféu conforme as horas
// acumuladas, no lugar dos emojis que enfeitavam o título antes.
export function fraseFoco(totalSeg: number, cor: string): Celebracao {
  const h = Math.floor(totalSeg / 3600);
  const m = Math.round((totalSeg % 3600) / 60);

  if (totalSeg < 25 * 60) {
    return {
      titulo: "Foco concluído!",
      insignia: "chama",
      sub: `${Math.max(1, Math.round(totalSeg / 60))} min de foco hoje — todo minuto conta.`,
      cor,
    };
  }
  if (h < 1) {
    return { titulo: `Boa! ${m} min de foco hoje`, sub: "Você está construindo o hábito.", cor, insignia: "chama" };
  }

  const insignia: NomeInsignia = h >= 6 ? "trofeu" : h >= 4 ? "cometa" : h >= 2 ? "raio" : "chama";
  const tempo = m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  const sub =
    h >= 6
      ? "Maratona lendária. Descansa que você merece."
      : h >= 4
        ? "Que sessão monstra! Orgulho desse foco."
        : h >= 2
          ? "Ritmo de aprovado. Segue assim!"
          : "Mandou muito bem hoje.";
  return { titulo: `UAU! ${tempo} DE FOCO HOJE`, sub, cor, insignia };
}
