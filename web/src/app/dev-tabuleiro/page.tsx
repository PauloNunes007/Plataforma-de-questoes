"use client";

// ROTA TEMPORÁRIA DE DEBUG — apagar depois. Reproduz o bug "duas peças se
// movendo por lance" isolando o Tabuleiro do resto da Arena: joga a
// abertura Ruy Lopez sozinho, um lance a cada 2s.
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Tabuleiro } from "@/components/xadrez/tabuleiro";

const LANCES = ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "d4", "exd4"];

export default function DevTabuleiro() {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(() => chess.fen());
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i >= LANCES.length) return;
    const t = setTimeout(() => {
      chess.move(LANCES[i]);
      setFen(chess.fen());
      setI(i + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [i, chess]);

  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "40px auto" }} data-lance={i}>
      <Tabuleiro fen={fen} flip={false} ultimoLance={null} casaXeque={null} />
    </div>
  );
}
