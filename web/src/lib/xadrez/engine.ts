import { NIVEIS_IA } from "./regras";
import type { NivelIa } from "./types";

// Wrapper do Stockfish (WASM single-thread, sem SharedArrayBuffer) rodando
// num Web Worker. Os assets moram em public/stockfish/ e são carregados por
// URL literal — o bundler nunca vê o arquivo; o loader Emscripten resolve o
// .wasm relativo à URL do próprio .js, por isso os dois ficam lado a lado.
//
// SÓ CLIENT — instanciar dentro de componente "use client" (Worker não
// existe no Node do servidor).
//
// UCI não é reentrante: cada busca roda serializada numa fila de promises.
// Skill Level/MultiPV são "sticky" no engine, então toda busca reseta os
// dois antes do go.

const URL_WORKER = "/stockfish/stockfish-18-lite-single.js";
const TIMEOUT_BUSCA_MS = 30_000;

// Grading dos lances do aluno: sempre força máxima — o tier da resposta é
// quem decide a posição no ranking, não a força do engine.
const SKILL_MAXIMO = 20;
const DEPTH_GRADING = 12;
export const MULTIPV_PADRAO = 6;

export type LanceAvaliado = {
  uci: string; // ex.: "e2e4", "e7e8q"
  rank: number; // 1 = melhor lance da posição
  cp: number | null; // centipawns (perspectiva de quem joga)
  mate: number | null; // lances até o mate (negativo = levando mate)
};

export class MotorXadrez {
  private worker: Worker | null = null;
  private fila: Promise<unknown> = Promise.resolve();
  private aoReceberLinha: ((linha: string) => void) | null = null;

  async init(): Promise<void> {
    if (this.worker) return;
    const worker = new Worker(URL_WORKER);
    worker.onmessage = (e: MessageEvent) => {
      this.aoReceberLinha?.(String(e.data));
    };
    this.worker = worker;
    await this.rodar(async () => {
      await this.enviarEEsperar(["uci"], (l) => l === "uciok");
      await this.enviarEEsperar(["isready"], (l) => l === "readyok");
    });
  }

  // Ranking dos N melhores lances da posição (MultiPV), em força máxima.
  avaliarLances(fen: string, multipv: number = MULTIPV_PADRAO): Promise<LanceAvaliado[]> {
    return this.rodar(async () => {
      const porRank = new Map<number, LanceAvaliado>();
      await this.enviarEEsperar(
        [
          `setoption name Skill Level value ${SKILL_MAXIMO}`,
          `setoption name MultiPV value ${Math.max(1, multipv)}`,
          `position fen ${fen}`,
          `go depth ${DEPTH_GRADING}`,
        ],
        (l) => l.startsWith("bestmove"),
        (l) => {
          const lance = parseLinhaInfo(l);
          if (lance) porRank.set(lance.rank, lance); // a última info de cada rank é a mais profunda
        },
      );
      return Array.from(porRank.values()).sort((a, b) => a.rank - b.rank);
    });
  }

  // Lance da máquina adversária, enfraquecida pro nível escolhido.
  escolherLanceIA(fen: string, nivel: NivelIa): Promise<string | null> {
    const { skill, depth } = NIVEIS_IA[nivel];
    return this.rodar(async () => {
      const linhaFinal = await this.enviarEEsperar(
        [
          `setoption name Skill Level value ${skill}`,
          "setoption name MultiPV value 1",
          `position fen ${fen}`,
          `go depth ${depth}`,
        ],
        (l) => l.startsWith("bestmove"),
      );
      const uci = linhaFinal.split(/\s+/)[1];
      return !uci || uci === "(none)" ? null : uci;
    });
  }

  destruir(): void {
    this.worker?.terminate();
    this.worker = null;
    this.aoReceberLinha = null;
  }

  // Serializa jobs — o UCI só aguenta uma busca por vez.
  private rodar<T>(job: () => Promise<T>): Promise<T> {
    const p = this.fila.then(job, job);
    this.fila = p.then(
      () => undefined,
      () => undefined,
    );
    return p;
  }

  private enviarEEsperar(
    comandos: string[],
    ehFinal: (linha: string) => boolean,
    coletar?: (linha: string) => void,
  ): Promise<string> {
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error("Engine não inicializado"));

    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.aoReceberLinha = null;
        reject(new Error("Engine não respondeu a tempo"));
      }, TIMEOUT_BUSCA_MS);

      this.aoReceberLinha = (linha) => {
        coletar?.(linha);
        if (ehFinal(linha)) {
          clearTimeout(timeout);
          this.aoReceberLinha = null;
          resolve(linha);
        }
      };
      comandos.forEach((c) => worker.postMessage(c));
    });
  }
}

// "info depth 12 ... multipv 2 score cp -35 ... pv e7e5 g1f3" → LanceAvaliado.
// Com MultiPV=1 o engine omite o token "multipv" — rank default 1.
function parseLinhaInfo(linha: string): LanceAvaliado | null {
  if (!linha.startsWith("info ") || !linha.includes(" pv ")) return null;
  const pv = linha.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/);
  if (!pv) return null;
  const rank = linha.match(/\bmultipv (\d+)/);
  const score = linha.match(/\bscore (cp|mate) (-?\d+)/);
  return {
    uci: pv[1],
    rank: rank ? parseInt(rank[1], 10) : 1,
    cp: score && score[1] === "cp" ? parseInt(score[2], 10) : null,
    mate: score && score[1] === "mate" ? parseInt(score[2], 10) : null,
  };
}
