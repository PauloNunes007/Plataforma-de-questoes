"use client";

import { useState } from "react";

import { FILTRO_DESAFIO } from "@/lib/disciplinas/filtros";

// Chips de dificuldade: cor semântica no estado ativo, sem emoji de
// bolinha (redesign 2026-07) — a própria cor do chip comunica o nível.
const DIFICULDADES = [
  { valor: "facil", label: "Fácil", ativoClasse: "border-questly-green/50 bg-questly-green-light text-questly-green-dark" },
  { valor: "medio", label: "Médio", ativoClasse: "border-questly-orange/50 bg-questly-orange-light text-questly-orange-dark" },
  { valor: "dificil", label: "Difícil", ativoClasse: "border-questly-red/50 bg-questly-red-light text-questly-red-dark" },
];

const QTD_OPCOES = [5, 10, 15, 20] as const;

const CHIP_BASE =
  "cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors";
const CHIP_INATIVO = "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground";
const CHIP_ATIVO_NEUTRO = "border-questly-green/50 bg-questly-green-light text-questly-green-dark";

export function FiltrosPratica({
  dificuldades,
  onToggleDificuldade,
  onLimparDificuldades,
  quantidade,
  onQuantidade,
}: {
  dificuldades: Set<string>;
  onToggleDificuldade: (valor: string) => void;
  onLimparDificuldades: () => void;
  quantidade: number | "todas";
  onQuantidade: (q: number | "todas") => void;
}) {
  const [custom, setCustom] = useState(false);
  const [customValor, setCustomValor] = useState("25");

  const usandoCustom =
    custom && typeof quantidade === "number" && !QTD_OPCOES.includes(quantidade as (typeof QTD_OPCOES)[number]);

  // "Todas" fala só dos NÍVEIS: ter marcado o aprofundamento não pode apagar
  // o estado ativo dele (são dois eixos diferentes do mesmo Set).
  const niveisSelecionados = [...dificuldades].filter((d) => d !== FILTRO_DESAFIO);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="kicker mb-2.5">Dificuldade</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLimparDificuldades}
            className={`${CHIP_BASE} ${niveisSelecionados.length === 0 ? CHIP_ATIVO_NEUTRO : CHIP_INATIVO}`}
          >
            Todas
          </button>
          {DIFICULDADES.map((d) => (
            <button
              key={d.valor}
              type="button"
              onClick={() => onToggleDificuldade(d.valor)}
              aria-pressed={dificuldades.has(d.valor)}
              className={`${CHIP_BASE} ${dificuldades.has(d.valor) ? d.ativoClasse : CHIP_INATIVO}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aprofundamento (questions.desafio) é opt-in e mora num bloco próprio,
          não como um quarto nível: ele não ordena com fácil/médio/difícil — é
          outro eixo, "cai na prova" contra "vai além dela". Este é o único
          lugar do app em que o aluno encontra essas questões. */}
      <div>
        <div className="kicker mb-2.5">Aprofundamento</div>
        <button
          type="button"
          onClick={() => onToggleDificuldade(FILTRO_DESAFIO)}
          aria-pressed={dificuldades.has(FILTRO_DESAFIO)}
          className={`${CHIP_BASE} ${
            dificuldades.has(FILTRO_DESAFIO)
              ? "border-questly-purple/50 bg-questly-purple/12 text-questly-purple"
              : CHIP_INATIVO
          }`}
        >
          Incluir questões de desafio
        </button>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
          Questões de desafio vão além do nível cobrado na prova. Ficam fora da
          prática automática e dos simulados — só aparecem quando você pede. Valem XP
          normalmente.
        </p>
      </div>

      <div>
        <div className="kicker mb-2.5">Quantidade de questões</div>
        <div className="flex flex-wrap items-center gap-2">
          {QTD_OPCOES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setCustom(false);
                onQuantidade(q);
              }}
              className={`tnum ${CHIP_BASE} ${!custom && quantidade === q ? CHIP_ATIVO_NEUTRO : CHIP_INATIVO}`}
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustom(false);
              onQuantidade("todas");
            }}
            className={`${CHIP_BASE} ${!custom && quantidade === "todas" ? CHIP_ATIVO_NEUTRO : CHIP_INATIVO}`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => {
              setCustom(true);
              onQuantidade(parseInt(customValor, 10) || 1);
            }}
            className={`${CHIP_BASE} ${usandoCustom ? CHIP_ATIVO_NEUTRO : `border-dashed ${CHIP_INATIVO}`}`}
          >
            Outra
          </button>
          {custom && (
            <input
              type="number"
              min={1}
              value={customValor}
              onChange={(e) => {
                setCustomValor(e.target.value);
                onQuantidade(parseInt(e.target.value, 10) || 1);
              }}
              className="tnum w-20 rounded-full border border-questly-green/50 bg-questly-green-light px-3 py-1.5 text-center text-[13px] font-medium text-questly-green-dark outline-none focus:ring-2 focus:ring-questly-green/25"
            />
          )}
        </div>
      </div>
    </div>
  );
}
