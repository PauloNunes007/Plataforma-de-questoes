"use client";

import { useState } from "react";
import { CalendarX2, Lock, Settings2, Target } from "lucide-react";
import type { MateriaAcademica } from "@/lib/academico/academico-data";
import { ModalPainel } from "@/components/ui/modal-painel";
import { AjustesPainel } from "./ajustes-painel";
import { FaltasPainel } from "./faltas-card";
import { NotasPainel } from "./notas-card";

// O detalhe de UMA disciplina, numa camada por cima da grade.
//
// Três abas em vez de uma coluna dupla infinita: o aluno chega com UMA
// pergunta na cabeça ("posso matar a aula?" ou "quanto preciso na P2?"), e as
// duas respostas competindo pelo mesmo scroll era o que fazia a tela antiga
// parecer longa mesmo com pouca informação.
//
// A aba inicial não é fixa: ela é escolhida pelo que está faltando na
// disciplina (ver `abaInicial`). Abrir uma matéria recém-cadastrada em "Faltas"
// mostrando "defina o limite" é pior do que já abrir onde o próximo passo está.

type Aba = "faltas" | "notas" | "ajustes";

const ABAS: { id: Aba; rotulo: string; Icone: typeof CalendarX2 }[] = [
  { id: "faltas", rotulo: "Faltas", Icone: CalendarX2 },
  { id: "notas", rotulo: "Notas", Icone: Target },
  { id: "ajustes", rotulo: "Ajustes", Icone: Settings2 },
];

function abaInicial(m: MateriaAcademica): Aba {
  if (m.frequencia.max === null && m.faltas.length === 0) return "ajustes";
  if (m.notas.situacao === "sem_dados") return "notas";
  return "faltas";
}

export function MateriaPainel({
  materia,
  editavel,
  onFechar,
  onMudou,
}: {
  /** null = painel fechado. */
  materia: MateriaAcademica | null;
  editavel: boolean;
  onFechar: () => void;
  onMudou: () => void;
}) {
  // A escolha do aluno é guardada JUNTO com a disciplina em que ele a fez. A
  // aba padrão só vale enquanto ele não tocou nas abas desta disciplina — sem
  // isso, o `router.refresh()` de cada gravação o jogaria de volta pra aba
  // "sugerida" no meio do que estava fazendo.
  const [escolha, setEscolha] = useState<{ id: string; aba: Aba } | null>(null);
  const id = materia?.subjectId ?? null;
  const aba: Aba = escolha && escolha.id === id ? escolha.aba : materia ? abaInicial(materia) : "faltas";

  const setAba = (nova: Aba) => {
    if (id) setEscolha({ id, aba: nova });
  };

  return (
    <ModalPainel
      aberto={!!materia}
      titulo={materia?.nome ?? ""}
      onFechar={onFechar}
      largura="max-w-xl"
    >
      {materia && (
        <div className="flex flex-col gap-4">
          {!editavel && (
            <p className="flex items-start gap-2 rounded-xl border border-questly-gold/30 bg-questly-gold/[0.07] px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
              <Lock size={13} strokeWidth={2.1} className="mt-[1px] shrink-0 text-questly-gold" />
              <span>
                Você está vendo o que já registrou. Editar faltas e notas faz parte do{" "}
                <b className="font-semibold text-foreground">Pro</b>.
              </span>
            </p>
          )}

          <div role="tablist" aria-label="Seções da disciplina" className="flex gap-1 rounded-xl bg-muted p-1">
            {ABAS.map(({ id: abaId, rotulo, Icone }) => {
              const ativa = aba === abaId;
              return (
                <button
                  key={abaId}
                  type="button"
                  role="tab"
                  id={`aba-${abaId}`}
                  aria-selected={ativa}
                  aria-controls={`painel-${abaId}`}
                  onClick={() => setAba(abaId)}
                  className={`flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold transition-all ${
                    ativa
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icone size={13} strokeWidth={2.1} />
                  {rotulo}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
            {aba === "faltas" && (
              <FaltasPainel
                materia={materia}
                editavel={editavel}
                onMudou={onMudou}
                onConfigurar={() => setAba("ajustes")}
              />
            )}
            {aba === "notas" && (
              <NotasPainel materia={materia} editavel={editavel} onMudou={onMudou} />
            )}
            {aba === "ajustes" && (
              <AjustesPainel materia={materia} editavel={editavel} onSalvo={onMudou} />
            )}
          </div>
        </div>
      )}
    </ModalPainel>
  );
}
