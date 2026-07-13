"use client";

import { useEffect, useRef, useState } from "react";

// Editor + compilação de uma figura a partir de código TikZ. A compilação
// REAL acontece no backend (POST /api/tikz/compilar → texlive.net → SVG no
// Storage), então circuitikz, pgfplots e o resto do TeX Live funcionam sem
// limitação. Espelha as props do ImgPicker e soma o par código/onCodeChange,
// já que aqui a "imagem" tem uma fonte editável por trás. Compila (ou reusa
// do cache por hash, feito no servidor) automaticamente quando a questão
// entra na revisão com um tikz_code sem imagem ainda; depois disso o fluxo
// de aprovação trata como imagem comum.
export function TikzPicker({
  code,
  currentUrl,
  onCodeChange,
  onUrlChange,
}: {
  code: string | null;
  currentUrl: string | null;
  onCodeChange: (code: string | null) => void;
  onUrlChange: (url: string | null) => void;
}) {
  const [rascunho, setRascunho] = useState(code || "");
  const [status, setStatus] = useState<"ocioso" | "compilando" | "erro">("ocioso");
  const [erro, setErro] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const autoCompilado = useRef(false);

  async function compilarEUsar(codigoParaCompilar: string) {
    if (!codigoParaCompilar.trim()) return;
    setStatus("compilando");
    setErro(null);
    setLog(null);
    try {
      const res = await fetch("/api/tikz/compilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoParaCompilar }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setStatus("erro");
        setErro(dados.erro || "Falha ao compilar.");
        setLog(dados.log || null);
        return;
      }
      setStatus("ocioso");
      onUrlChange(dados.url);
    } catch (err) {
      console.error("Erro compilando TikZ:", err);
      setStatus("erro");
      setErro("Falha de rede ao compilar. Tente de novo.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRascunho(code || "");
    setErro(null);
    setLog(null);
    autoCompilado.current = false;
  }, [code]);

  useEffect(() => {
    if (autoCompilado.current) return;
    if (!code || currentUrl) return;
    autoCompilado.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    compilarEUsar(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, currentUrl]);

  function aplicarEdicao() {
    onCodeChange(rascunho.trim() || null);
    compilarEUsar(rascunho);
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-border p-3">
      <textarea
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        placeholder={"código TikZ, ex:\n\\begin{circuitikz}\n  \\draw (0,0) to[R=$R_1$] (2,0);\n\\end{circuitikz}"}
        rows={5}
        className="w-full resize-y rounded-lg border-2 border-border bg-card px-2.5 py-2 font-mono text-xs outline-none focus:border-questly-blue"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={status === "compilando" || !rascunho.trim()}
          onClick={aplicarEdicao}
          className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold text-muted-foreground disabled:opacity-50"
        >
          {status === "compilando" ? "Compilando..." : "Compilar figura"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={() => onUrlChange(null)}
            className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold text-questly-red-dark"
          >
            Remover
          </button>
        )}
        <span className="text-[10.5px] font-semibold text-muted-foreground">
          compilado no TeX Live completo (circuitikz, pgfplots, etc.)
        </span>
      </div>

      {erro && (
        <div className="rounded-lg bg-questly-red-light px-3 py-2 text-xs font-bold text-questly-red-dark">
          {erro}
          {log && (
            <details className="mt-1.5 font-normal">
              <summary className="cursor-pointer font-bold">ver log do LaTeX</summary>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] leading-snug">{log}</pre>
            </details>
          )}
        </div>
      )}

      {currentUrl && status !== "erro" && (
        <div className="mx-auto max-h-[220px] max-w-full overflow-auto rounded-lg border border-border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="Figura TikZ compilada" className="mx-auto max-h-[200px] max-w-full" />
        </div>
      )}
    </div>
  );
}
