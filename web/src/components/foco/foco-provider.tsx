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

export type ModoFoco = "cronometro" | "timer";
type EstadoFoco = "parado" | "rodando" | "pausado";

export type Celebracao = { titulo: string; sub: string; cor: string };

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

  // Restaura a sessão do localStorage no mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMontado(true);
    try {
      const bruto = localStorage.getItem(CHAVE_LS);
      if (bruto) {
        const salvo = JSON.parse(bruto) as Partial<Sessao>;
        setSessao({ ...SESSAO_INICIAL, ...salvo });
        if (salvo.estado === "rodando" || salvo.estado === "pausado") setBarraAberta(true);
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

  const segundosAgora = useCallback((s: Sessao): number => {
    const corrido =
      s.estado === "rodando" && s.iniciadoEm
        ? Math.floor((Date.now() - s.iniciadoEm) / 1000)
        : 0;
    return s.acumuladoSeg + corrido;
  }, []);

  const segundos = segundosAgora(sessao);
  const restanteSeg =
    sessao.modo === "timer" ? Math.max(0, sessao.alvoMin * 60 - segundos) : Infinity;

  const persistir = useCallback(async (segFocados: number, modo: ModoFoco, objetivo: string) => {
    if (segFocados < 20) return;
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

  const iniciar = useCallback(() => {
    setColapsada(false);
    setSessao((s) => ({ ...s, estado: "rodando", iniciadoEm: Date.now(), acumuladoSeg: 0 }));
    setBarraAberta(true);
  }, []);

  const pausar = useCallback(() => {
    setSessao((s) => {
      if (s.estado !== "rodando") return s;
      return { ...s, estado: "pausado", acumuladoSeg: segundosAgora(s), iniciadoEm: null };
    });
  }, [segundosAgora]);

  const retomar = useCallback(() => {
    setSessao((s) =>
      s.estado === "pausado" ? { ...s, estado: "rodando", iniciadoEm: Date.now() } : s,
    );
  }, []);

  const finalizar = useCallback(() => {
    setColapsada(false);
    setSessao((s) => {
      const seg = segundosAgora(s);
      if (seg >= 20) {
        const novoTotal = focoHojeRef.current + seg;
        setCelebracao(fraseFoco(novoTotal, s.cor));
      }
      void persistir(seg, s.modo, s.objetivo);
      return { ...SESSAO_INICIAL, modo: s.modo, alvoMin: s.alvoMin, cor: s.cor };
    });
  }, [segundosAgora, persistir]);

  const descartar = useCallback(() => {
    setColapsada(false);
    setSessao((s) => ({ ...SESSAO_INICIAL, modo: s.modo, alvoMin: s.alvoMin, cor: s.cor }));
  }, []);

  useEffect(() => {
    if (sessao.estado !== "rodando") return;
    const id = setInterval(() => {
      if (sessao.modo === "timer" && segundosAgora(sessao) >= sessao.alvoMin * 60) {
        finalizar();
        return;
      }
      setTick((t) => (t + 1) % 1_000_000);
    }, 1000);
    return () => clearInterval(id);
  }, [sessao, segundosAgora, finalizar]);

  const valor = useMemo<FocoContexto>(
    () => ({
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
        setColapsada(false);
        setBarraAberta(true);
      },
      fecharBarra: () => setBarraAberta(false),
      alternarBarra: () => {
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
      colapsar: () => setColapsada(true),
      expandir: () => setColapsada(false),
      limparCelebracao: () => setCelebracao(null),
    }),
    [sessao, segundos, restanteSeg, focoHojeSeg, barraAberta, colapsada, montado, celebracao, iniciar, pausar, retomar, finalizar, descartar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function formatarRelogio(seg: number): string {
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
// (pedido do usuário: "UAU! 6 HORAS DE FOCO"). Escala de emoji/tom conforme
// as horas acumuladas.
export function fraseFoco(totalSeg: number, cor: string): Celebracao {
  const h = Math.floor(totalSeg / 3600);
  const m = Math.round((totalSeg % 3600) / 60);

  if (totalSeg < 25 * 60) {
    return {
      titulo: "Foco concluído! 💪",
      sub: `${Math.max(1, Math.round(totalSeg / 60))} min de foco hoje — todo minuto conta.`,
      cor,
    };
  }
  if (h < 1) {
    return { titulo: `Boa! ${m} min de foco hoje 🔥`, sub: "Você está construindo o hábito.", cor };
  }

  const emoji = h >= 6 ? "🤯" : h >= 4 ? "🚀" : h >= 2 ? "⚡" : "🔥";
  const tempo = m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  const sub =
    h >= 6
      ? "Maratona lendária. Descansa que você merece! 🏆"
      : h >= 4
        ? "Que sessão monstra! Orgulho desse foco."
        : h >= 2
          ? "Ritmo de aprovado. Segue assim!"
          : "Mandou muito bem hoje.";
  return { titulo: `UAU! ${tempo} DE FOCO HOJE ${emoji}`, sub, cor };
}
