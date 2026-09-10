"use client";

// Figura de questão (enunciado ou alternativa) — extraída em 2026-09-10 do
// feedback "demora para a imagem aparecer na questão".
//
// A demora não era tamanho de arquivo (as figuras têm ~20KB): era o navegador
// só COMEÇAR o download quando o aluno já estava olhando pra questão. Duas
// causas, as duas corrigidas aqui:
//
//  1. `loading="lazy"` fazia o navegador adiar até calcular layout/viewport —
//     numa imagem que é o conteúdo principal da tela isso só atrasa. Agora é
//     `eager` + `fetchPriority="high"` + `decoding="async"`.
//  2. A questão seguinte só é montada quando o aluno chega nela, então a
//     figura dela começava do zero. `usePrefetchFiguras` puxa as próximas pro
//     cache enquanto ele ainda está respondendo a atual — quando vira a
//     página, a imagem já está lá.
//
// Enquanto carrega, um shimmer ocupa exatamente a altura final (nada de
// pulo de layout). Se a URL estiver quebrada, o bloco inteiro some — mesmo
// comportamento do `onError` que existia antes.

import { useCallback, useEffect, useState } from "react";

type Estado = "carregando" | "pronta" | "erro";

export function FiguraQuestao({
  src,
  alt,
  className,
  prioridade = true,
}: {
  src: string;
  alt: string;
  /** classes do contêiner (altura fixa + margem) — reserva o espaço */
  className: string;
  /** false só pra figuras que não são o foco da tela (ex.: alternativas) */
  prioridade?: boolean;
}) {
  const [estado, setEstado] = useState<Estado>("carregando");

  // Ref callback (não useEffect — a regra react-hooks/set-state-in-effect):
  // cobre a imagem que já veio do cache antes da hidratação, caso em que o
  // evento `load` nunca dispara e o shimmer ficaria pra sempre.
  const registrar = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setEstado("pronta");
  }, []);

  if (estado === "erro") return null;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-white ${className}`}>
      {estado === "carregando" && (
        <span aria-hidden className="absolute inset-0 animate-pulse bg-muted" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={registrar}
        src={src}
        alt={alt}
        loading={prioridade ? "eager" : "lazy"}
        fetchPriority={prioridade ? "high" : "auto"}
        decoding="async"
        onLoad={() => setEstado("pronta")}
        onError={() => setEstado("erro")}
        className={`relative h-full w-full object-contain transition-opacity duration-200 ${
          estado === "pronta" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/**
 * Deixa as figuras das próximas questões prontas no cache do navegador.
 * Recebe as URLs já achatadas (enunciado + alternativas) — a chave do efeito é
 * a própria lista, então trocar de questão dispara o prefetch da seguinte.
 */
export function usePrefetchFiguras(urls: (string | null | undefined)[]) {
  const chave = urls.filter(Boolean).join("|");
  useEffect(() => {
    if (!chave) return;
    for (const url of chave.split("|")) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [chave]);
}

/** Todas as figuras de uma questão (enunciado + alternativas), sem nulos. */
export function figurasDaPergunta(pergunta: {
  imagem_url?: string | null;
  alternativas_imagens?: Record<string, string> | null;
}): string[] {
  const saida: string[] = [];
  if (pergunta.imagem_url) saida.push(pergunta.imagem_url);
  for (const url of Object.values(pergunta.alternativas_imagens || {})) {
    if (url) saida.push(url);
  }
  return saida;
}
