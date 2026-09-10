"use client";

// Gabarito do simulado — a parte que faz o aluno aprender com a prova em vez de
// só olhar a nota. Três camadas, da visão mais rápida pra mais detalhada:
//   1. folha de respostas (todas as questões numa grade, status por marca);
//   2. filtro por resultado — "só as que eu errei" é o modo de estudo real;
//   3. cartão questão a questão com enunciado, alternativas e resolução.

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";
import type { QuestaoAnalisada, StatusQuestao } from "@/lib/simulados/analise";
import { ROTULO_DIFICULDADE, fmtSegundosPreciso } from "@/lib/simulados/analise";

type Filtro = "todas" | "erro" | "branco" | "acerto";

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: "todas", rotulo: "Todas" },
  { chave: "erro", rotulo: "Erradas" },
  { chave: "branco", rotulo: "Em branco" },
  { chave: "acerto", rotulo: "Certas" },
];

const ICONE_STATUS: Record<StatusQuestao, React.ReactNode> = {
  acerto: <CheckCircle2 size={16} />,
  erro: <XCircle size={16} />,
  branco: <MinusCircle size={16} />,
};

const CLASSE_CHIP: Record<StatusQuestao, string> = {
  acerto: "bg-questly-green-light text-questly-green-dark border-questly-green/40",
  erro: "bg-questly-red-light text-questly-red-dark border-questly-red/40",
  branco: "bg-muted text-muted-foreground border-border",
};

const ROTULO_STATUS: Record<StatusQuestao, string> = {
  acerto: "acertou",
  erro: "errou",
  branco: "deixou em branco",
};

export function GabaritoSimulado({
  perguntas,
  analise,
}: {
  perguntas: Pergunta[];
  analise: QuestaoAnalisada[];
}) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const porId = useMemo(() => new Map(analise.map((a) => [a.id, a])), [analise]);
  const contagem = useMemo(
    () => ({
      todas: analise.length,
      acerto: analise.filter((a) => a.status === "acerto").length,
      erro: analise.filter((a) => a.status === "erro").length,
      branco: analise.filter((a) => a.status === "branco").length,
    }),
    [analise],
  );

  const visiveis = useMemo(
    () => perguntas.filter((p) => filtro === "todas" || porId.get(p.id)?.status === filtro),
    [perguntas, porId, filtro],
  );

  function alternar(id: string) {
    setAbertas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  const todasAbertas = visiveis.length > 0 && visiveis.every((p) => abertas.has(p.id));

  function alternarTodas() {
    setAbertas(todasAbertas ? new Set() : new Set(visiveis.map((p) => p.id)));
  }

  /** Da folha de respostas pro cartão: garante o filtro certo, abre e rola. */
  function irPara(item: QuestaoAnalisada) {
    if (filtro !== "todas" && filtro !== item.status) setFiltro("todas");
    setAbertas((atual) => new Set(atual).add(item.id));
    requestAnimationFrame(() => {
      containerRef.current
        ?.querySelector(`[data-questao="${item.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <section ref={containerRef}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold">Gabarito comentado</h2>
        <button
          type="button"
          onClick={alternarTodas}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 hover:text-foreground"
        >
          {todasAbertas ? <ChevronsDownUp size={13} /> : <ChevronsUpDown size={13} />}
          {todasAbertas ? "Recolher todas" : "Expandir todas"}
        </button>
      </div>

      {/* Folha de respostas — a prova inteira numa olhada */}
      <div className="surface mb-3 p-4">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Folha de respostas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {analise.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => irPara(a)}
              title={`Questão ${a.numero} — você ${ROTULO_STATUS[a.status]}. Gabarito ${a.gabarito.toUpperCase()}.`}
              className={`tnum flex h-9 w-9 flex-col items-center justify-center rounded-lg border text-[11px] font-bold leading-none transition-transform hover:scale-105 ${CLASSE_CHIP[a.status]}`}
            >
              {a.numero}
              <span className="mt-0.5 text-[9px] font-semibold opacity-80">
                {a.marcada ? a.marcada.toUpperCase() : "—"}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[11px] font-medium text-muted-foreground">
          O número é a questão; a letra embaixo é o que você marcou. Toque para abrir a correção.
        </p>
      </div>

      {/* Filtro — uma linha só, acima de tudo que ele filtra */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => {
          const n = contagem[f.chave];
          const ativo = filtro === f.chave;
          if (n === 0 && f.chave !== "todas") return null;
          return (
            <button
              key={f.chave}
              type="button"
              onClick={() => setFiltro(f.chave)}
              aria-pressed={ativo}
              className={`tnum rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                ativo
                  ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                  : "border-border bg-card text-muted-foreground hover:border-questly-green/40"
              }`}
            >
              {f.rotulo} <span className="opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {visiveis.map((p) => {
          const item = porId.get(p.id);
          if (!item) return null;
          const expandida = abertas.has(p.id);
          const letras = Object.keys(p.alternativas || {}).sort();
          const imagensAlt = p.alternativas_imagens || {};
          return (
            <div key={p.id} data-questao={p.id} className="surface scroll-mt-20 overflow-hidden">
              <button
                type="button"
                onClick={() => alternar(p.id)}
                aria-expanded={expandida}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${CLASSE_CHIP[item.status]}`}
                >
                  {ICONE_STATUS[item.status]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="tnum block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Questão {item.numero} · {item.topico}
                  </span>
                  <span className="line-clamp-1 block text-[13px] font-medium text-muted-foreground">
                    <MathText text={p.enunciado} />
                  </span>
                </span>
                <span className="tnum hidden shrink-0 text-[11px] font-bold text-muted-foreground sm:block">
                  {item.marcada ? `Você: ${item.marcada.toUpperCase()}` : "Em branco"} ·{" "}
                  <span className="text-questly-green-dark dark:text-questly-green">
                    Gab: {p.gabarito.toUpperCase()}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-muted-foreground transition-transform ${expandida ? "rotate-180" : ""}`}
                />
              </button>

              {expandida && (
                <div className="border-t border-border/60 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {item.dificuldade && (
                      <Chip>{ROTULO_DIFICULDADE[item.dificuldade]}</Chip>
                    )}
                    {p.instituicao && <Chip>{p.instituicao}{p.ano ? ` ${p.ano}` : ""}</Chip>}
                    {item.subtopico && <Chip>{item.subtopico}</Chip>}
                    {item.tempoSeg != null && (
                      <Chip>
                        <Clock size={11} className="mr-1 inline align-[-1px]" />
                        {fmtSegundosPreciso(item.tempoSeg)}
                      </Chip>
                    )}
                  </div>

                  <div className="mb-4 text-[15px] font-medium leading-relaxed">
                    <MathText text={p.enunciado} />
                  </div>

                  {p.imagem_url && (
                    <div className="mb-4 flex h-[220px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imagem_url}
                        alt="Imagem da questão"
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {letras.map((letra) => {
                      const eGab = letra === p.gabarito;
                      const eSua = letra === item.marcada;
                      return (
                        <div
                          key={letra}
                          className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-[14px] ${
                            eGab
                              ? "border-questly-green/60 bg-questly-green-light"
                              : eSua
                                ? "border-questly-red/60 bg-questly-red-light"
                                : "border-border"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-bold ${
                              eGab
                                ? "bg-questly-green text-white dark:text-[#0c1512]"
                                : eSua
                                  ? "bg-questly-red text-white dark:text-[#2b0a0a]"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {letra.toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            {imagensAlt[letra] && (
                              <span className="mb-2 flex h-[130px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imagensAlt[letra]}
                                  alt={`Imagem da alternativa ${letra.toUpperCase()}`}
                                  loading="lazy"
                                  className="h-full w-full object-contain"
                                />
                              </span>
                            )}
                            <MathText text={p.alternativas?.[letra] ?? ""} />
                          </span>
                          {eGab && (
                            <span className="shrink-0 text-[11px] font-bold text-questly-green-dark">Correta</span>
                          )}
                          {eSua && !eGab && (
                            <span className="shrink-0 text-[11px] font-bold text-questly-red-dark">Sua resposta</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {p.resolucao ? (
                    <div className="mt-4 rounded-xl bg-muted/60 p-4">
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Resolução
                      </p>
                      <div className="text-[14px] leading-relaxed">
                        <MathText text={p.resolucao} />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-[12px] font-medium text-muted-foreground">
                      Essa questão ainda não tem resolução escrita no banco.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}
