"use client";

import { AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { ROTULO_FREQUENCIA, tomFrequencia, tomSituacao } from "@/lib/academico/academico";
import type { MateriaAcademica } from "@/lib/academico/academico-data";
import { TONS, fmt, type Tom } from "./tons";

// O cartão-resumo de UMA disciplina na grade.
//
// Ele responde as duas perguntas do semestre lado a lado — "quantas faltas
// ainda cabem?" e "quanto preciso na próxima?" — e nada além disso. Todo o
// resto (registrar falta, lançar nota, configurar teto) mora no painel que
// este cartão abre.
//
// Essa divisão é o conserto do problema real da tela antiga: com tudo aberto
// ao mesmo tempo, seis disciplinas viravam seis telas de altura, e cada
// formulário que abria empurrava o resto pra baixo. Aqui a grade inteira cabe
// numa olhada e o detalhe é uma camada por cima, não mais scroll.

const ALTURA_PIP = "h-1.5";

export function MateriaCartao({
  materia,
  onAbrir,
}: {
  materia: MateriaAcademica;
  onAbrir: () => void;
}) {
  const estado = estadoGeral(materia);
  const tom = TONS[estado.tom];

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Abrir ${materia.nome}`}
      className="surface-interativa group flex cursor-pointer flex-col overflow-hidden p-0 text-left"
    >
      {/* Fio de cor no topo: dá o veredito antes de o olho chegar no texto. */}
      <span aria-hidden className={`h-[3px] w-full bg-gradient-to-r ${tom.fio}`} />

      <div className="flex items-start justify-between gap-2 px-4 pb-3 pt-3.5">
        <h3 className="line-clamp-2 min-w-0 flex-1 font-heading text-[14.5px] font-semibold leading-snug tracking-tight">
          {materia.nome}
        </h3>
        <span className="flex shrink-0 items-center gap-1">
          <Selo estado={estado} />
          <ChevronRight
            size={15}
            strokeWidth={2.2}
            className="text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
          />
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 divide-x divide-border border-t border-border">
        <MetadeFaltas materia={materia} />
        <MetadeNotas materia={materia} />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------ veredito */

type Estado = { tom: Tom; rotulo: string; icone: "risco" | "atencao" | "ok" | "vazio" };

function estadoGeral(m: MateriaAcademica): Estado {
  const f = m.frequencia.nivel;
  const n = m.notas.situacao;

  if (f === "reprovado" || n === "reprovado") return { tom: "vermelho", rotulo: "Reprovado", icone: "risco" };
  if (n === "impossivel") return { tom: "vermelho", rotulo: "Não fecha", icone: "risco" };
  if (f === "limite") return { tom: "vermelho", rotulo: "Última falta", icone: "risco" };
  if (f === "atencao" || n === "dificil") return { tom: "amarelo", rotulo: "Atenção", icone: "atencao" };
  if (n === "aprovado") return { tom: "verde", rotulo: "Aprovado", icone: "ok" };
  if (f === "sem_dados" && (n === "sem_dados" || n === "sem_notas")) {
    return { tom: "neutro", rotulo: "Sem dados", icone: "vazio" };
  }
  return { tom: "verde", rotulo: "Tranquilo", icone: "ok" };
}

function Selo({ estado }: { estado: Estado }) {
  const tom = TONS[estado.tom];
  if (estado.icone === "vazio") {
    return (
      <span className="rounded-md bg-muted px-1.5 py-[3px] text-[10px] font-medium text-muted-foreground">
        {estado.rotulo}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md ${tom.suave} px-1.5 py-[3px] text-[10px] font-semibold ${tom.texto}`}
    >
      {estado.icone === "ok" ? (
        <CheckCircle2 size={10} strokeWidth={2.4} />
      ) : (
        <AlertTriangle size={10} strokeWidth={2.4} />
      )}
      {estado.rotulo}
    </span>
  );
}

/* -------------------------------------------------------------- metades */

function Metade({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-4 py-3">
      <span className="kicker text-[10px]">{rotulo}</span>
      {children}
    </div>
  );
}

function MetadeFaltas({ materia }: { materia: MateriaAcademica }) {
  const f = materia.frequencia;
  const tomKey = tomFrequencia(f.nivel);
  const tom = TONS[tomKey];

  if (f.max === null) {
    return (
      <Metade rotulo="Faltas">
        <p className="text-[12.5px] font-medium leading-snug text-muted-foreground">
          {f.usadas > 0 ? `${f.usadas} registrada${f.usadas === 1 ? "" : "s"}` : "Nenhuma registrada"}
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground/80">Defina o limite</p>
      </Metade>
    );
  }

  // Estourado é o único caso em que o número grande NÃO é "quantas cabem" —
  // mostrar 0 ali esconderia o tamanho do estrago, que é o que decide se ele
  // ainda corre atrás de abono ou não.
  const estourou = f.restantes != null && f.restantes < 0;
  const numero = estourou ? Math.abs(f.restantes as number) : Math.max(0, f.restantes ?? 0);

  return (
    <Metade rotulo="Faltas">
      <p className="flex items-baseline gap-1.5">
        <span className={`tnum font-heading text-[30px] font-semibold leading-none ${tom.texto}`}>
          {numero}
        </span>
        <span className="min-w-0 truncate text-[11px] leading-snug text-muted-foreground">
          {estourou ? "além do limite" : `de ${f.max} restantes`}
        </span>
      </p>
      <Pips usadas={f.usadas} max={f.max} tom={tomKey} maxPips={12} />
      <p className={`truncate text-[11px] font-medium ${tom.texto}`}>{ROTULO_FREQUENCIA[f.nivel]}</p>
    </Metade>
  );
}

function MetadeNotas({ materia }: { materia: MateriaAcademica }) {
  const r = materia.notas;
  const tom = TONS[tomSituacao(r.situacao)];
  const p = materia.proxima;

  if (r.situacao === "sem_dados") {
    return (
      <Metade rotulo="Notas">
        <p className="flex items-center gap-1 text-[12.5px] font-medium leading-snug">
          <Sparkles size={12} strokeWidth={2.2} className="shrink-0 text-questly-green" />
          Montar avaliações
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground/80">Quantas provas e trabalhos?</p>
      </Metade>
    );
  }

  // Corrida em andamento: o número é a nota da PRÓXIMA, na escala dela.
  if (p && p.precisa != null) {
    const forado = p.precisa > p.notaMaxima;
    return (
      <Metade rotulo="Próxima">
        <p className="flex items-baseline gap-1.5">
          <span
            className={`tnum font-heading text-[30px] font-semibold leading-none ${forado ? TONS.vermelho.texto : tom.texto}`}
          >
            {fmt(Math.max(0, p.precisa))}
          </span>
          <span className="min-w-0 truncate text-[11px] leading-snug text-muted-foreground">
            na <b className="font-semibold text-foreground">{p.nome}</b>
          </span>
        </p>
        <Barra valor={r.fracaoConcluida} tom={tomSituacao(r.situacao)} />
        <p className="truncate text-[11px] text-muted-foreground">
          Média <b className={`tnum font-semibold ${tom.texto}`}>{fmt(r.mediaAtual)}</b> · já valeu{" "}
          {Math.round(r.fracaoConcluida * 100)}%
        </p>
      </Metade>
    );
  }

  // Sem corrida: aprovado, reprovado ou não fecha mais. O fato é a média.
  return (
    <Metade rotulo="Notas">
      <p className="flex items-baseline gap-1.5">
        <span className={`tnum font-heading text-[30px] font-semibold leading-none ${tom.texto}`}>
          {fmt(r.mediaAtual)}
        </span>
        <span className="truncate text-[11px] leading-snug text-muted-foreground">de média</span>
      </p>
      <Barra valor={r.fracaoConcluida} tom={tomSituacao(r.situacao)} />
      <p className={`truncate text-[11px] font-medium ${tom.texto}`}>
        {r.situacao === "aprovado"
          ? "Aprovado"
          : r.situacao === "impossivel"
            ? "Só na final"
            : r.situacao === "reprovado"
              ? "Abaixo da média"
              : "Sem nota lançada"}
      </p>
    </Metade>
  );
}

/* --------------------------------------------------------------- escalas */

/**
 * Pips quando o teto é pequeno (o caso normal: 7, 10, 15), barra quando é
 * grande. A comparação "4 apagados, 3 acesos" é lida sem aritmética.
 *
 * O grid de colunas iguais substituiu o `flex-wrap` + `flex-1` antigo, que com
 * quebra de linha esticava os pips da última fileira e fazia 7 faltas parecer
 * uma escala diferente de 10.
 */
export function Pips({
  usadas,
  max,
  tom,
  /** Acima disso os pips viram confete e a barra volta a ser melhor. O cartão
   *  da grade tem metade da largura do painel, então aceita menos. */
  maxPips = 20,
}: {
  usadas: number;
  max: number;
  tom: Tom;
  maxPips?: number;
}) {
  const classes = TONS[tom];

  if (max <= 0 || max > maxPips) {
    const pct = max > 0 ? Math.min(100, (usadas / max) * 100) : usadas > 0 ? 100 : 0;
    return (
      <span className={`block ${ALTURA_PIP} w-full overflow-hidden rounded-full bg-muted`}>
        <span className={`block h-full rounded-full ${classes.solido}`} style={{ width: `${pct}%` }} />
      </span>
    );
  }

  // Faltas ALÉM do teto ganham pip próprio, sempre vermelho.
  const excedentes = Math.min(Math.max(0, usadas - max), 6);

  return (
    <span
      className="grid w-full gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${max + excedentes}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`${ALTURA_PIP} rounded-full ${i < usadas ? classes.solido : "bg-foreground/[0.08]"}`}
        />
      ))}
      {Array.from({ length: excedentes }).map((_, i) => (
        <span key={`x${i}`} className={`${ALTURA_PIP} rounded-full bg-questly-red`} />
      ))}
    </span>
  );
}

/** Quanto da nota do semestre já foi decidido. */
export function Barra({ valor, tom }: { valor: number; tom: Tom }) {
  const pct = Math.max(0, Math.min(100, valor * 100));
  return (
    <span className={`block ${ALTURA_PIP} w-full overflow-hidden rounded-full bg-foreground/[0.08]`} aria-hidden>
      <span className={`block h-full rounded-full ${TONS[tom].solido}`} style={{ width: `${pct}%` }} />
    </span>
  );
}
