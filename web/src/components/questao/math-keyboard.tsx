"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { Eye } from "lucide-react";
import { MathText } from "@/components/questao/math-text";

// Editor de anotações pensado pra quem NÃO sabe LaTeX: o aluno escreve
// texto normal e clica nos símbolos/modelos da paleta pra montar as
// fórmulas — nada de decorar comandos. A paleta insere o LaTeX certo na
// posição do cursor, embrulhando em `$...$` só quando o cursor não está
// dentro de uma fórmula já aberta (mesma convenção de delimitadores do
// MathText). Cada tecla mostra o símbolo renderizado (KaTeX), não o código.

type Tecla = {
  // LaTeX inserido no cursor.
  tex: string;
  // Quantos caracteres a partir do fim ficam DEPOIS do cursor — usado nos
  // modelos com "buraco" (fração, potência, raiz) pra deixar o cursor
  // dentro do primeiro campo. 0 = símbolo simples (cursor vai pro fim).
  back?: number;
  // Como a tecla aparece: fórmula KaTeX (padrão) ou texto puro.
  preview: string;
  puro?: boolean;
  titulo: string;
};

type Aba = { id: string; nome: string; teclas: Tecla[] };

const ABAS: Aba[] = [
  {
    id: "basico",
    nome: "Básico",
    teclas: [
      { tex: "^{}", back: 1, preview: "x^{n}", titulo: "Potência" },
      { tex: "_{}", back: 1, preview: "x_{n}", titulo: "Índice / subscrito" },
      { tex: "\\sqrt{}", back: 1, preview: "\\sqrt{x}", titulo: "Raiz quadrada" },
      { tex: "\\sqrt[]{}", back: 3, preview: "\\sqrt[n]{x}", titulo: "Raiz enésima" },
      { tex: "\\frac{}{}", back: 3, preview: "\\frac{a}{b}", titulo: "Fração" },
      { tex: "()", back: 1, preview: "(\\;)", titulo: "Parênteses" },
      { tex: "\\left|\\right|", back: 7, preview: "|x|", titulo: "Módulo" },
      { tex: "\\%", preview: "\\%", titulo: "Porcentagem" },
    ],
  },
  {
    id: "operadores",
    nome: "Operadores",
    teclas: [
      { tex: "\\times", preview: "\\times", titulo: "Vezes" },
      { tex: "\\div", preview: "\\div", titulo: "Dividido" },
      { tex: "\\cdot", preview: "\\cdot", titulo: "Ponto (produto)" },
      { tex: "\\pm", preview: "\\pm", titulo: "Mais ou menos" },
      { tex: "\\neq", preview: "\\neq", titulo: "Diferente" },
      { tex: "\\leq", preview: "\\leq", titulo: "Menor ou igual" },
      { tex: "\\geq", preview: "\\geq", titulo: "Maior ou igual" },
      { tex: "\\approx", preview: "\\approx", titulo: "Aproximado" },
      { tex: "\\propto", preview: "\\propto", titulo: "Proporcional" },
      { tex: "\\to", preview: "\\to", titulo: "Tende a / seta" },
      { tex: "\\Rightarrow", preview: "\\Rightarrow", titulo: "Implica" },
      { tex: "\\angle", preview: "\\angle", titulo: "Ângulo" },
    ],
  },
  {
    id: "grego",
    nome: "Grego",
    teclas: [
      { tex: "\\alpha", preview: "\\alpha", titulo: "alfa" },
      { tex: "\\beta", preview: "\\beta", titulo: "beta" },
      { tex: "\\gamma", preview: "\\gamma", titulo: "gama" },
      { tex: "\\theta", preview: "\\theta", titulo: "teta" },
      { tex: "\\lambda", preview: "\\lambda", titulo: "lambda" },
      { tex: "\\mu", preview: "\\mu", titulo: "mi" },
      { tex: "\\pi", preview: "\\pi", titulo: "pi" },
      { tex: "\\rho", preview: "\\rho", titulo: "rô" },
      { tex: "\\sigma", preview: "\\sigma", titulo: "sigma" },
      { tex: "\\phi", preview: "\\phi", titulo: "fi" },
      { tex: "\\omega", preview: "\\omega", titulo: "ômega" },
      { tex: "\\Delta", preview: "\\Delta", titulo: "Delta (variação)" },
      { tex: "\\Sigma", preview: "\\Sigma", titulo: "Sigma maiúsculo" },
      { tex: "\\Omega", preview: "\\Omega", titulo: "Ômega maiúsculo" },
    ],
  },
  {
    id: "calculo",
    nome: "Cálculo",
    teclas: [
      { tex: "\\int", preview: "\\int", titulo: "Integral" },
      { tex: "\\int_{}^{}", back: 4, preview: "\\int_{a}^{b}", titulo: "Integral definida" },
      { tex: "\\sum_{}^{}", back: 4, preview: "\\sum_{}^{}", titulo: "Somatório" },
      { tex: "\\prod_{}^{}", back: 4, preview: "\\prod", titulo: "Produtório" },
      { tex: "\\lim_{ \\to }", back: 4, preview: "\\lim", titulo: "Limite" },
      { tex: "\\frac{d}{dx}", preview: "\\frac{d}{dx}", titulo: "Derivada" },
      { tex: "\\partial", preview: "\\partial", titulo: "Derivada parcial" },
      { tex: "\\nabla", preview: "\\nabla", titulo: "Gradiente (nabla)" },
      { tex: "\\infty", preview: "\\infty", titulo: "Infinito" },
    ],
  },
  {
    id: "fisica",
    nome: "Física",
    teclas: [
      { tex: "\\vec{}", back: 1, preview: "\\vec{v}", titulo: "Vetor" },
      { tex: "\\hat{}", back: 1, preview: "\\hat{\\imath}", titulo: "Versor / chapéu" },
      { tex: "\\hat\\imath", preview: "\\hat\\imath", titulo: "Versor i" },
      { tex: "\\hat\\jmath", preview: "\\hat\\jmath", titulo: "Versor j" },
      { tex: "\\hat{k}", preview: "\\hat{k}", titulo: "Versor k" },
      { tex: "^\\circ", preview: "90^\\circ", titulo: "Graus" },
      { tex: "\\Delta", preview: "\\Delta", titulo: "Variação" },
      { tex: "\\overrightarrow{}", back: 1, preview: "\\overrightarrow{AB}", titulo: "Vetor AB" },
    ],
  },
];

function Glifo({ preview, puro }: { preview: string; puro?: boolean }) {
  const html = useMemo(() => {
    if (puro) return null;
    try {
      return katex.renderToString(preview, { throwOnError: false, displayMode: false });
    } catch {
      return null;
    }
  }, [preview, puro]);

  if (puro || !html) return <span className="text-[13px] font-medium">{preview}</span>;
  return <span aria-hidden dangerouslySetInnerHTML={{ __html: html }} />;
}

export function MathKeyboard({
  value,
  onChange,
  placeholder,
  minRows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const [aba, setAba] = useState(ABAS[0].id);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const cursorPendente = useRef<number | null>(null);

  // Reposiciona o cursor depois que o valor controlado re-renderiza (não é
  // setState — só toca no DOM, seguro dentro de efeito).
  useEffect(() => {
    if (cursorPendente.current != null && taRef.current) {
      taRef.current.focus();
      taRef.current.setSelectionRange(cursorPendente.current, cursorPendente.current);
      cursorPendente.current = null;
    }
  });

  function inserir(tecla: Tecla) {
    const el = taRef.current;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const antes = value.slice(0, start);
    const depois = value.slice(end);

    const cifoesAntes = (antes.match(/(?<!\\)\$/g) || []).length;
    const dentroDeMath = cifoesAntes % 2 === 1;
    const envolto = dentroDeMath ? tecla.tex : `$${tecla.tex}$`;
    const leading = dentroDeMath ? 0 : 1;
    const back = tecla.back ?? 0;
    const pos = back > 0 ? start + leading + (tecla.tex.length - back) : start + envolto.length;

    cursorPendente.current = pos;
    onChange(antes + envolto + depois);
  }

  const teclasAba = ABAS.find((a) => a.id === aba)?.teclas ?? [];
  const temConteudo = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-questly-green focus:ring-4 focus:ring-questly-green/10"
      />

      {temConteudo && (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <Eye size={12} strokeWidth={2} /> Pré-visualização
          </div>
          <div className="text-[15px] leading-relaxed">
            <MathText text={value} />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex gap-0.5 overflow-x-auto border-b border-border bg-muted/40 p-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                aba === a.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {a.nome}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1.5 p-2 sm:grid-cols-8">
          {teclasAba.map((tecla, i) => (
            <button
              key={`${tecla.tex}-${i}`}
              type="button"
              title={tecla.titulo}
              aria-label={tecla.titulo}
              onClick={() => inserir(tecla)}
              className="flex h-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all hover:border-questly-green/50 hover:bg-questly-green-light active:scale-95"
            >
              <Glifo preview={tecla.preview} puro={tecla.puro} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
