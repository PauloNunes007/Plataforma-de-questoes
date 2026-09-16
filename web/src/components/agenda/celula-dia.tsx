"use client";

// Uma célula do calendário mensal.
//
// Dois sistemas de cor convivem aqui e são de propósito diferentes:
//   • a CÉLULA é pintada pelo ESTADO do dia (hoje / prova / estudou);
//   • o CHIP é neutro, com um PONTO na cor da disciplina.
// Chip tingido sobre célula tingida vira lama — por isso o chip usa o fundo da
// superfície e a identidade da disciplina entra pelo ponto. A cor vem de
// `corDaDisciplina(nome)`, a mesma função que pinta o card de questão e o card
// de retomar: a disciplina tem UMA cor no app inteiro, não uma por tela.

import { Check, Swords, Target } from "lucide-react";
import type { CalDay } from "@/lib/questly/dashboard-data";
import type { ProvaDia } from "@/lib/agenda/agenda-data";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";

/** Quantas marcações escritas cabem na célula antes do "+N". */
const VISIVEIS = 3;

export function corDoItem(item: { subjectNome: string | null }): string {
  return item.subjectNome ? corDaDisciplina(item.subjectNome).de : "var(--questly-purple)";
}

export function CelulaDia({
  day,
  itens,
  prova,
  progresso,
  ativo,
  alvoArraste,
  onSelecionar,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStartItem,
}: {
  day: CalDay;
  itens: TarefaRow[];
  prova: ProvaDia | null;
  progresso: Record<string, number>;
  ativo: boolean;
  alvoArraste: boolean;
  onSelecionar: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStartItem: (id: string) => void;
}) {
  const hoje = day.estado === "hoje";
  const estudou = day.estado === "estudou";
  const visiveis = itens.slice(0, VISIVEIS);
  const sobra = itens.length - visiveis.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelecionar}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelecionar();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      title={day.title}
      aria-label={`Dia ${day.dia}${prova ? `, prova de ${prova.subjectNome}` : ""}${
        itens.length ? `, ${itens.length} marcação(ões)` : ""
      }`}
      aria-pressed={ativo}
      className={`group flex min-h-[58px] cursor-pointer flex-col gap-1 rounded-xl border p-1.5 text-left transition-all sm:min-h-[104px] sm:rounded-2xl sm:p-2 ${
        prova
          ? "border-questly-orange/45 bg-questly-orange-light"
          : hoje
            ? "border-questly-green/55 bg-questly-green-light"
            : estudou
              ? "border-questly-green/25 bg-questly-green-light/55"
              : "border-border/70 bg-background/40 hover:border-questly-green/35 hover:bg-muted/50"
      } ${ativo ? "ring-2 ring-questly-green/60 ring-offset-1 ring-offset-card" : ""} ${
        alvoArraste ? "border-dashed border-questly-green bg-questly-green-light" : ""
      }`}
    >
      <span className="flex items-center justify-between gap-1">
        <span
          className={`tnum flex h-[22px] min-w-[22px] items-center justify-center rounded-lg px-1 text-[12.5px] font-bold leading-none ${
            hoje
              ? "bg-questly-green text-white dark:text-[#0c1512]"
              : prova
                ? "text-questly-orange-dark"
                : estudou
                  ? "text-questly-green-dark dark:text-questly-green"
                  : "text-muted-foreground"
          }`}
        >
          {day.dia}
        </span>
        <span className="flex items-center gap-1">
          {prova && <Swords size={11} strokeWidth={2.5} className="text-questly-orange-dark" />}
          {estudou && !prova && (
            <Check size={11} strokeWidth={3} className="text-questly-green-dark dark:text-questly-green" />
          )}
        </span>
      </span>

      {/* Prova sempre ganha a primeira linha da célula: é a única marcação do
          calendário com data que o aluno não escolhe.
          `orange-dark` e não `orange`: no claro, branco sobre #d97706 dá
          ~3,2:1 e reprova em AA nesse corpo de 10px; sobre #b45309 dá 5,0:1.
          No escuro o token vira um laranja CLARO, então o texto é que fica
          escuro — a inversão já é a regra da paleta. */}
      {prova && (
        <span className="hidden min-w-0 items-center gap-1 rounded-[6px] bg-questly-orange-dark px-1.5 py-[3px] text-[10px] font-bold leading-tight text-white sm:flex dark:text-[#1a1206]">
          <span className="truncate">{prova.subjectNome}</span>
        </span>
      )}

      {/* As marcações escritas — é isso que separa um calendário de uma grade
          de quadradinhos. No celular não cabe texto: viram pontos. */}
      <span className="hidden min-w-0 flex-col gap-[3px] sm:flex">
        {visiveis.map((t) => {
          const cor = corDoItem(t);
          const feitas = t.subjectId ? progresso[t.subjectId] || 0 : 0;
          const batida = t.tipo === "meta" && t.metaQuestoes != null && feitas >= t.metaQuestoes;
          return (
            <span
              key={t.id}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                onDragStartItem(t.id);
              }}
              className={`flex min-w-0 cursor-grab items-center gap-1 rounded-[6px] bg-card px-1.5 py-[3px] text-[10px] font-semibold leading-tight text-foreground shadow-xs ring-1 ring-border/60 active:cursor-grabbing ${
                t.concluida || batida ? "opacity-55" : ""
              }`}
            >
              <i aria-hidden className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: cor }} />
              {t.tipo === "meta" ? (
                <>
                  <Target size={9} strokeWidth={2.6} className="shrink-0 opacity-70" />
                  <span className="tnum shrink-0">
                    {feitas}/{t.metaQuestoes}
                  </span>
                  <span className="truncate opacity-75">{t.subjectNome}</span>
                </>
              ) : (
                <>
                  {t.hora && <span className="tnum shrink-0 opacity-75">{t.hora}</span>}
                  <span className={`truncate ${t.concluida ? "line-through" : ""}`}>{t.nome}</span>
                </>
              )}
            </span>
          );
        })}
        {sobra > 0 && (
          <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{sobra} no dia</span>
        )}
      </span>

      {/* Mobile: as mesmas marcações viradas em pontos da cor da disciplina. */}
      <span className="mt-auto flex gap-[3px] sm:hidden">
        {itens.slice(0, 4).map((t) => (
          <i key={t.id} className="h-[5px] w-[5px] rounded-full" style={{ background: corDoItem(t) }} />
        ))}
      </span>
    </div>
  );
}
