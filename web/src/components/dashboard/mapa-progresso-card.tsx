"use client";

// MAPA DE PROGRESSO — o calendário da home, agora compacto e no ALTO da
// coluna da direita.
//
// **Repasse de 2026-09-15** (pedido explícito: *"o card do Mapa de Progresso
// precisa ficar logo no início, no canto direito do hub principal, e não lá
// embaixo onde ninguém rola para ver"*). A `AgendaCard` de largura inteira
// morava no pé da visão Global; o aluno que não rolava até o fim não sabia que
// o calendário existia, e o que rolava encontrava um mês espremido dividindo
// espaço com um formulário.
//
// A divisão que resolveu as duas coisas: este card é SÓ LEITURA — o mês
// pintado, três números e um caminho pra tela dedicada. Planejar (agendar
// sessão, definir meta, marcar prova) é trabalho da `/calendario`, onde o mês
// tem a tela inteira. Cada quadradinho é um link direto pro dia lá, então
// "ver" e "marcar" continuam a um clique de distância.

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Swords, Target } from "lucide-react";
import type { CalDay } from "@/lib/questly/dashboard-data";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import { minutosReservados } from "@/lib/tarefas/tarefas-data";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { DOW_LETRA, diasEntre, fmtDuracao, rotuloDataCurta } from "@/lib/agenda/formato";

export function MapaProgressoCard({
  monthLabel,
  dowOffset,
  days,
  tarefas,
  hoje,
  proximaProva,
}: {
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  tarefas: Record<string, TarefaRow[]>;
  hoje: string;
  /** Próxima prova futura do aluno (de qualquer mês) — null se não houver. */
  proximaProva: { nome: string; data: string } | null;
}) {
  const doMes = days.flatMap((d) => tarefas[d.data] || []);
  const minutos = minutosReservados(doMes);
  const diasEstudados = days.filter((d) => d.estado === "estudou").length;
  const faltam = proximaProva ? diasEntre(hoje, proximaProva.data) : null;

  return (
    <section className="surface flex flex-col p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays
            size={15}
            strokeWidth={2.2}
            className="shrink-0 text-questly-green-dark dark:text-questly-green"
          />
          <h2 className="font-heading truncate text-[14.5px] font-semibold tracking-tight">
            Mapa de progresso
          </h2>
        </span>
        <Link
          href="/calendario"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1 text-[11.5px] font-semibold text-questly-green-dark transition-colors hover:bg-questly-green-light dark:text-questly-green"
        >
          Abrir
          <ArrowUpRight size={13} strokeWidth={2.4} />
        </Link>
      </header>

      <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
        {monthLabel}
      </p>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DOW_LETRA.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-center text-[9.5px] font-bold uppercase text-muted-foreground/60"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: dowOffset }).map((_, i) => (
          <span key={`offset-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => (
          <QuadradoDia key={day.data} day={day} itens={tarefas[day.data] || []} />
        ))}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-1.5 border-t border-border pt-3">
        <Mini rotulo="dias" valor={String(diasEstudados)} />
        <Mini rotulo="reservado" valor={minutos > 0 ? fmtDuracao(minutos) : "—"} />
        <Mini rotulo="marcados" valor={String(doMes.length)} />
      </dl>

      {proximaProva && faltam !== null && faltam >= 0 && (
        <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-questly-orange/40 bg-questly-orange-light px-2.5 py-2 text-[11.5px] font-semibold text-questly-orange-dark">
          <Swords size={13} strokeWidth={2.4} className="shrink-0" />
          <span className="min-w-0 truncate">
            {proximaProva.nome} · {rotuloDataCurta(proximaProva.data)}
          </span>
          <span className="tnum ml-auto shrink-0">{faltam === 0 ? "hoje" : `${faltam}d`}</span>
        </p>
      )}

      <Link
        href="/calendario"
        className="mt-3 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-[12.5px] font-bold text-foreground transition-colors hover:border-questly-green/45"
      >
        <Target size={13} strokeWidth={2.4} />
        Planejar meu mês
      </Link>
    </section>
  );
}

/** Um dia do mini-mês: link direto pro mesmo dia na tela dedicada. */
function QuadradoDia({ day, itens }: { day: CalDay; itens: TarefaRow[] }) {
  const hoje = day.estado === "hoje";
  const prova = day.estado === "prova";
  const estudou = day.estado === "estudou";
  const cor = itens[0]?.subjectNome ? corDaDisciplina(itens[0].subjectNome).de : "var(--questly-purple)";

  return (
    <Link
      href={`/calendario?dia=${day.data}`}
      title={day.title || `${day.dia}`}
      aria-label={`Dia ${day.dia}${itens.length ? `, ${itens.length} marcação(ões)` : ""}`}
      className={`tnum relative flex aspect-square items-center justify-center rounded-[7px] text-[10.5px] font-bold transition-colors ${
        hoje
          ? "bg-questly-green text-white shadow-sm dark:text-[#0c1512]"
          : prova
            ? "bg-questly-orange-light text-questly-orange-dark ring-1 ring-questly-orange/45"
            : estudou
              ? "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
              : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {day.dia}
      {itens.length > 0 && (
        <i
          aria-hidden
          className="absolute bottom-[3px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full"
          style={{ background: hoje ? "currentColor" : cor }}
        />
      )}
    </Link>
  );
}

function Mini({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0 text-center">
      <dt className="truncate text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="tnum mt-0.5 text-[14px] font-bold leading-none">{valor}</dd>
    </div>
  );
}
