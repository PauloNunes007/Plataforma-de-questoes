import { Fragment } from "react";
import katex from "katex";

// Mesmos 4 delimitadores do KATEX_OPTS legado (js/questao.js): $$...$$ e
// \[...\] em modo display, $...$ e \(...\) inline. LaTeX malformado não
// deve travar a página do aluno — throwOnError:false faz o KaTeX
// renderizar o trecho quebrado em vermelho em vez de lançar exceção.
const REGEX_DELIMITADORES = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;

type Segmento = { tipo: "texto" | "math"; conteudo: string; display: boolean };

function segmentar(texto: string): Segmento[] {
  const segmentos: Segmento[] = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(REGEX_DELIMITADORES);
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      segmentos.push({ tipo: "texto", conteudo: texto.slice(ultimoIndice, match.index), display: false });
    }
    const displayMath = match[1] ?? match[2];
    const inlineMath = match[3] ?? match[4];
    if (displayMath != null) {
      segmentos.push({ tipo: "math", conteudo: displayMath, display: true });
    } else {
      segmentos.push({ tipo: "math", conteudo: inlineMath as string, display: false });
    }
    ultimoIndice = regex.lastIndex;
  }
  if (ultimoIndice < texto.length) {
    segmentos.push({ tipo: "texto", conteudo: texto.slice(ultimoIndice), display: false });
  }
  return segmentos;
}

export function MathText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const segmentos = segmentar(text);

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {segmentos.map((seg, i) => {
        if (seg.tipo === "texto") {
          return <Fragment key={i}>{seg.conteudo}</Fragment>;
        }
        const html = katex.renderToString(seg.conteudo, {
          throwOnError: false,
          displayMode: seg.display,
        });
        return seg.display ? (
          // equação longa/matriz não deve forçar a página inteira a rolar
          // de lado num celular — ela rola sozinha dentro dessa div.
          <div key={i} className="max-w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </span>
  );
}
