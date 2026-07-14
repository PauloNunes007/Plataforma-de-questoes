"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Peca, type CorPeca, type TipoPeca } from "./pecas";

// Tabuleiro DISPLAY-ONLY: o aluno nunca move peça (o engine joga pelos
// dois lados), então não existe drag/click — só render + animação. As
// peças são posicionadas por % em cima de um grid 8×8 e animadas via
// framer-motion (spring 220/18, a mesma física de casa dos tilt cards).
//
// Identidade das peças entre lances: um diff FEN→FEN (atribuirIds) mantém
// ids estáveis pra peça que se moveu — sem isso, um par de torres podia
// "teleportar" trocado. Captura sai com fade (AnimatePresence); promoção
// troca peão por dama com fade também (identidade nova de propósito).

const CASA_CLARA = "bg-[#eff1d3]";
const CASA_ESCURA = "bg-[#77955c]";
const COORD_NA_CLARA = "text-[#77955c]";
const COORD_NA_ESCURA = "text-[#eff1d3]";

const ARQUIVOS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

type PecaComId = { id: string; tipo: TipoPeca; cor: CorPeca; casa: string };

export function Tabuleiro({
  fen,
  flip,
  ultimoLance,
  casaXeque,
}: {
  fen: string;
  flip: boolean;
  ultimoLance: { from: string; to: string } | null;
  casaXeque: string | null; // casa do rei em xeque
}) {
  const reduzirMovimento = useReducedMotion();

  // Padrão oficial de "derivar estado de props durante o render": guarda o
  // fen da última atribuição e re-deriva quando ele muda — sem useEffect.
  const [rastreio, setRastreio] = useState<{ fen: string; pecas: PecaComId[] }>(() => ({
    fen,
    pecas: atribuirIds(null, fen),
  }));
  if (rastreio.fen !== fen) {
    setRastreio({ fen, pecas: atribuirIds(rastreio.pecas, fen) });
  }

  const transicao = reduzirMovimento
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 220, damping: 22 };

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-xl border border-border shadow-lg shadow-black/10">
      {/* casas */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {Array.from({ length: 64 }, (_, i) => {
          const col = i % 8;
          const lin = Math.floor(i / 8);
          const escura = (col + lin) % 2 === 1;
          const arquivo = ARQUIVOS[flip ? 7 - col : col];
          const fileira = flip ? lin + 1 : 8 - lin;
          return (
            <div key={i} className={`relative ${escura ? CASA_ESCURA : CASA_CLARA}`}>
              {col === 0 && (
                <span
                  className={`tnum absolute left-[3%] top-[2%] text-[min(1.6vw,11px)] font-bold ${escura ? COORD_NA_ESCURA : COORD_NA_CLARA}`}
                >
                  {fileira}
                </span>
              )}
              {lin === 7 && (
                <span
                  className={`absolute bottom-[2%] right-[5%] text-[min(1.6vw,11px)] font-bold ${escura ? COORD_NA_ESCURA : COORD_NA_CLARA}`}
                >
                  {arquivo}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* highlight do último lance */}
      {ultimoLance &&
        [ultimoLance.from, ultimoLance.to].map((casa) => {
          const { left, top } = posicaoDaCasa(casa, flip);
          return (
            <div
              key={casa}
              className="absolute h-[12.5%] w-[12.5%] bg-questly-gold/45"
              style={{ left, top }}
            />
          );
        })}

      {/* glow de xeque no rei */}
      {casaXeque && (
        <div
          className="absolute h-[12.5%] w-[12.5%] bg-[radial-gradient(circle,rgba(220,38,38,0.6),transparent_72%)]"
          style={posicaoDaCasa(casaXeque, flip)}
        />
      )}

      {/* peças */}
      <AnimatePresence>
        {rastreio.pecas.map((p) => {
          const { left, top } = posicaoDaCasa(p.casa, flip);
          return (
            <motion.div
              key={p.id}
              className="absolute h-[12.5%] w-[12.5%] p-[4%]"
              initial={{ left, top, opacity: 0, scale: 0.6 }}
              animate={{ left, top, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.55, transition: { duration: reduzirMovimento ? 0 : 0.25 } }}
              transition={transicao}
            >
              <Peca cor={p.cor} tipo={p.tipo} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function posicaoDaCasa(casa: string, flip: boolean): { left: string; top: string } {
  const col = casa.charCodeAt(0) - 97; // a..h → 0..7
  const fileira = parseInt(casa[1], 10); // 1..8
  const x = flip ? 7 - col : col;
  const y = flip ? fileira - 1 : 8 - fileira;
  return { left: `${x * 12.5}%`, top: `${y * 12.5}%` };
}

function parseFen(fen: string): { tipo: TipoPeca; cor: CorPeca; casa: string }[] {
  const pecas: { tipo: TipoPeca; cor: CorPeca; casa: string }[] = [];
  const fileiras = fen.split(" ")[0].split("/");
  fileiras.forEach((linha, iLinha) => {
    let col = 0;
    for (const ch of linha) {
      if (/\d/.test(ch)) {
        col += parseInt(ch, 10);
        continue;
      }
      pecas.push({
        tipo: ch.toLowerCase() as TipoPeca,
        cor: ch === ch.toLowerCase() ? "b" : "w",
        casa: `${ARQUIVOS[col]}${8 - iLinha}`,
      });
      col++;
    }
  });
  return pecas;
}

// Mantém ids estáveis entre posições: peça parada reaproveita o id da casa;
// a que se moveu herda o id que "sobrou" do mesmo tipo+cor. Peça capturada
// simplesmente não aparece na nova lista (exit do AnimatePresence); peça
// nova (promoção) ganha id inédito — o sufixo com os campos de relógio do
// FEN garante unicidade sem precisar de contador global.
function atribuirIds(anterior: PecaComId[] | null, fen: string): PecaComId[] {
  const atuais = parseFen(fen);
  const geracao = fen.split(" ").slice(1).join("");

  if (!anterior) {
    return atuais.map((p) => ({ ...p, id: `${p.cor}${p.tipo}:${p.casa}:init` }));
  }

  const livresPorGrupo = new Map<string, PecaComId[]>();
  const paradasPorCasa = new Map<string, PecaComId>();
  anterior.forEach((p) => {
    const grupo = `${p.cor}${p.tipo}`;
    paradasPorCasa.set(`${grupo}@${p.casa}`, p);
    livresPorGrupo.set(grupo, [...(livresPorGrupo.get(grupo) || []), p]);
  });

  // 1ª passada: quem não saiu do lugar fica com o próprio id
  const resultado: (PecaComId | null)[] = atuais.map((p) => {
    const parada = paradasPorCasa.get(`${p.cor}${p.tipo}@${p.casa}`);
    if (!parada) return null;
    const grupo = livresPorGrupo.get(`${p.cor}${p.tipo}`)!;
    livresPorGrupo.set(
      `${p.cor}${p.tipo}`,
      grupo.filter((x) => x.id !== parada.id),
    );
    return { ...p, id: parada.id };
  });

  // 2ª passada: quem se moveu herda um id livre do mesmo grupo; sem sobra = peça nova
  return atuais.map((p, i) => {
    if (resultado[i]) return resultado[i]!;
    const grupo = `${p.cor}${p.tipo}`;
    const livres = livresPorGrupo.get(grupo) || [];
    if (livres.length > 0) {
      const [herdado, ...resto] = livres;
      livresPorGrupo.set(grupo, resto);
      return { ...p, id: herdado.id };
    }
    return { ...p, id: `${grupo}:${p.casa}:${geracao}` };
  });
}
