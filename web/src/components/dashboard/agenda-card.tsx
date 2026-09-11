"use client";

// AGENDA — o calendário da home, agora em largura inteira.
//
// **Repasse de 2026-09-11 (2).** O calendário antigo era um quadradinho no
// rail: sete colunas de 11px, um ponto roxo pra dizer "tem alguma coisa aqui",
// e um formulário de duas linhas escondido embaixo. Dava pra anotar um
// afazer; não dava pra PLANEJAR a semana. O que mudou:
//
//  • **Ocupa a largura toda** e a célula do dia é alta o bastante pra mostrar
//    conteúdo de verdade — as duas primeiras marcações escritas, com a hora e
//    a cor da disciplina, em vez de um ponto genérico.
//  • **Navega entre meses** (setas + "Hoje"), lendo o mês novo sob demanda
//    (carregarMesAgendaAction). O mês corrente continua vindo pronto do
//    servidor, então abrir a home não custa um round-trip a mais.
//  • **Agenda SESSÃO DE ESTUDO, não só tarefa.** Uma sessão tem hora,
//    duração e disciplina; o painel do dia soma quanto tempo já está
//    reservado e desenha os blocos na ordem do relógio.
//  • **Cor com significado**: cada disciplina tem a sua (a mesma paleta por
//    posição do rail de disciplinas, pra Cálculo ser da mesma cor nos dois
//    lugares), e o estado do dia (hoje / prova / estudou) pinta a célula.
//  • **Arrastar pra outro dia** move a marcação (moverTarefaAction) — é o
//    gesto que as pessoas já tentam fazer num calendário.
//
// O que a agenda deliberadamente NÃO faz: gerar missão, dar XP ou acender a
// ofensiva. Agendar é um plano, não uma conquista — misturar os dois abriria
// caminho pra inflar o ranking marcando blocos que nunca aconteceram.

import { useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  Plus,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import type { CalDay } from "@/lib/questly/dashboard-data";
import {
  minutosReservados,
  ordenarDia,
  type TarefaRow,
  type TipoItemAgenda,
} from "@/lib/tarefas/tarefas-data";
import {
  alternarTarefaAction,
  criarTarefaAction,
  excluirTarefaAction,
  moverTarefaAction,
} from "@/lib/tarefas/actions";
import { carregarMesAgendaAction } from "@/lib/agenda/actions";

const DOW_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DOW_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Mesma paleta por POSIÇÃO usada no rail de disciplinas: a disciplina precisa
// ter a mesma cor nos dois lugares, senão a cor deixa de ser identidade e
// vira decoração.
const CORES_DISCIPLINA = [
  "var(--questly-green)",
  "var(--questly-purple)",
  "var(--questly-blue)",
  "var(--questly-orange)",
  "var(--questly-red)",
  "var(--questly-gold)",
];
const COR_SEM_DISCIPLINA = "var(--questly-purple)";

/** Durações que o aluno escolhe num toque — o resto vai no campo livre. */
const DURACOES = [25, 50, 90, 120];

function corDoSubject(subjectId: string | null, subjects: { id: string }[]): string {
  if (!subjectId) return COR_SEM_DISCIPLINA;
  const i = subjects.findIndex((s) => s.id === subjectId);
  return i < 0 ? COR_SEM_DISCIPLINA : CORES_DISCIPLINA[i % CORES_DISCIPLINA.length];
}

function fmtDuracao(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** "2026-09-11" → "Quinta, 11 de setembro" (sem depender de fuso do Date). */
function rotuloData(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  const MES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${DOW_LONGO[dt.getDay()]}, ${d} de ${MES[m - 1]}`;
}

function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(a, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function AgendaCard({
  monthLabel: monthLabelInicial,
  dowOffset: dowOffsetInicial,
  days: daysIniciais,
  tarefas: tarefasIniciais,
  subjects,
  hoje,
}: {
  monthLabel: string;
  dowOffset: number;
  days: CalDay[];
  tarefas: Record<string, TarefaRow[]>;
  subjects: { id: string; nome: string }[];
  hoje: string;
}) {
  const semMovimento = useReducedMotion();
  const [mes, setMes] = useState({
    monthLabel: monthLabelInicial,
    dowOffset: dowOffsetInicial,
    days: daysIniciais,
    // Ano/mês de referência: vem do primeiro dia da grade, que é sempre o
    // dia 1 do mês exibido.
    ano: Number(daysIniciais[0]?.data.slice(0, 4)) || new Date().getFullYear(),
    mesIdx: (Number(daysIniciais[0]?.data.slice(5, 7)) || new Date().getMonth() + 1) - 1,
  });
  const [itens, setItens] = useState(tarefasIniciais);
  const [selecionado, setSelecionado] = useState<string | null>(hoje || null);
  const [formAberto, setFormAberto] = useState(false);
  const [navegando, iniciarNavegacao] = useTransition();
  const arrastando = useRef<string | null>(null);
  const [alvoArraste, setAlvoArraste] = useState<string | null>(null);

  // Formulário
  const [tipo, setTipo] = useState<TipoItemAgenda>("sessao");
  const [nome, setNome] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [hora, setHora] = useState("19:00");
  const [duracao, setDuracao] = useState(50);
  const [salvando, setSalvando] = useState(false);

  const noMesAtual = mes.days.some((d) => d.data === hoje);

  const diaSelecionado = useMemo(
    () => mes.days.find((d) => d.data === selecionado) || null,
    [mes.days, selecionado],
  );
  const itensDoDia = selecionado ? itens[selecionado] || [] : [];
  const reservado = minutosReservados(itensDoDia);

  // Resumo do mês exibido — aritmética pura sobre o que já está em memória,
  // sem consulta nova. Ocupa o pé do painel (que sobrava vazio) com a única
  // leitura que o mês inteiro oferece e o dia não: quanto eu planejei.
  const resumoMes = useMemo(() => {
    let sessoes = 0;
    let minutos = 0;
    let feitos = 0;
    let total = 0;
    mes.days.forEach((d) => {
      (itens[d.data] || []).forEach((t) => {
        total += 1;
        if (t.concluida) feitos += 1;
        if (t.tipo === "sessao") {
          sessoes += 1;
          minutos += t.duracaoMin || 0;
        }
      });
    });
    return { sessoes, minutos, feitos, total };
  }, [mes.days, itens]);

  function irParaMes(delta: number) {
    const alvo = new Date(mes.ano, mes.mesIdx + delta, 1);
    iniciarNavegacao(async () => {
      const novo = await carregarMesAgendaAction(alvo.getFullYear(), alvo.getMonth());
      if (!novo) return;
      setMes({
        monthLabel: novo.monthLabel,
        dowOffset: novo.dowOffset,
        days: novo.days,
        ano: novo.ano,
        mesIdx: novo.mes,
      });
      // Mescla em vez de substituir: o aluno pode ter acabado de criar algo
      // em outro mês e voltar — substituir apagaria o que ele vê.
      setItens((prev) => ({ ...prev, ...novo.tarefas }));
      setSelecionado(novo.days.find((d) => d.data === hoje)?.data || novo.days[0]?.data || null);
      setFormAberto(false);
    });
  }

  function voltarPraHoje() {
    if (noMesAtual) {
      setSelecionado(hoje);
      return;
    }
    const agoraAno = Number(hoje.slice(0, 4));
    const agoraMes = Number(hoje.slice(5, 7)) - 1;
    iniciarNavegacao(async () => {
      const novo = await carregarMesAgendaAction(agoraAno, agoraMes);
      if (!novo) return;
      setMes({
        monthLabel: novo.monthLabel,
        dowOffset: novo.dowOffset,
        days: novo.days,
        ano: novo.ano,
        mesIdx: novo.mes,
      });
      setItens((prev) => ({ ...prev, ...novo.tarefas }));
      setSelecionado(hoje);
    });
  }

  function abrirForm(t: TipoItemAgenda) {
    setTipo(t);
    setFormAberto(true);
  }

  async function adicionar() {
    if (!selecionado || !nome.trim() || salvando) return;
    setSalvando(true);
    const { ok, id } = await criarTarefaAction({
      nome,
      descricao: null,
      subjectId: subjectId || null,
      data: selecionado,
      tipo,
      hora: tipo === "sessao" ? hora : null,
      duracaoMin: tipo === "sessao" ? duracao : null,
    });
    if (ok && id) {
      const novo: TarefaRow = {
        id,
        nome: nome.trim(),
        descricao: null,
        data: selecionado,
        concluida: false,
        subjectId: subjectId || null,
        subjectNome: subjects.find((s) => s.id === subjectId)?.nome || null,
        tipo,
        hora: tipo === "sessao" ? hora : null,
        duracaoMin: tipo === "sessao" ? duracao : null,
      };
      setItens((prev) => ({ ...prev, [selecionado]: ordenarDia([...(prev[selecionado] || []), novo]) }));
      setNome("");
      setFormAberto(false);
    }
    setSalvando(false);
  }

  async function alternar(data: string, id: string, concluidaAtual: boolean) {
    setItens((prev) => ({
      ...prev,
      [data]: (prev[data] || []).map((t) => (t.id === id ? { ...t, concluida: !concluidaAtual } : t)),
    }));
    await alternarTarefaAction(id, !concluidaAtual);
  }

  async function remover(data: string, id: string) {
    setItens((prev) => ({ ...prev, [data]: (prev[data] || []).filter((t) => t.id !== id) }));
    await excluirTarefaAction(id);
  }

  async function mover(id: string, de: string, para: string) {
    if (de === para) return;
    const item = (itens[de] || []).find((t) => t.id === id);
    if (!item) return;
    setItens((prev) => ({
      ...prev,
      [de]: (prev[de] || []).filter((t) => t.id !== id),
      [para]: ordenarDia([...(prev[para] || []), { ...item, data: para }]),
    }));
    await moverTarefaAction(id, para);
  }

  return (
    <section className="surface flex flex-col p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={16}
            strokeWidth={2.1}
            className="text-questly-green-dark dark:text-questly-green"
          />
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">Agenda</h2>
          <span className="hidden text-[12px] text-muted-foreground sm:inline">
            · marque suas sessões de estudo
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={voltarPraHoje}
            className="mr-1 h-8 cursor-pointer rounded-lg border border-border px-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => irParaMes(-1)}
            disabled={navegando}
            aria-label="Mês anterior"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground disabled:opacity-50"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>
          <span
            className={`min-w-[130px] text-center text-[13.5px] font-semibold tracking-tight transition-opacity ${
              navegando ? "opacity-50" : ""
            }`}
          >
            {mes.monthLabel}
          </span>
          <button
            type="button"
            onClick={() => irParaMes(1)}
            disabled={navegando}
            aria-label="Próximo mês"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground disabled:opacity-50"
          >
            <ChevronRight size={16} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* ---------------- grade do mês ---------------- */}
        <div className="min-w-0">
          <div className="mb-1 grid grid-cols-7 gap-1.5">
            {DOW_CURTO.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground/70"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: mes.dowOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[52px] sm:min-h-[74px]" />
            ))}

            {mes.days.map((day) => (
              <CelulaDia
                key={day.data}
                day={day}
                itens={itens[day.data] || []}
                subjects={subjects}
                ativo={selecionado === day.data}
                alvoArraste={alvoArraste === day.data}
                onSelecionar={() => {
                  setSelecionado(day.data);
                  setFormAberto(false);
                }}
                onDragOver={(e) => {
                  if (!arrastando.current) return;
                  e.preventDefault();
                  setAlvoArraste(day.data);
                }}
                onDragLeave={() => setAlvoArraste((a) => (a === day.data ? null : a))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = arrastando.current;
                  setAlvoArraste(null);
                  arrastando.current = null;
                  if (!id) return;
                  const de = Object.keys(itens).find((d) => itens[d].some((t) => t.id === id));
                  if (de) void mover(id, de, day.data);
                }}
                onDragStartItem={(id) => {
                  arrastando.current = id;
                }}
              />
            ))}
          </div>

          {/* Duas legendas, porque são dois sistemas de cor diferentes: a
              CÉLULA é pintada pelo estado do dia, o CHIP pela disciplina.
              Sem essa separação a cor vira adivinhação. */}
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <Legenda cor="var(--questly-green)" rotulo="Hoje" solido />
              <Legenda cor="var(--questly-green)" rotulo="Estudou" />
              <Legenda cor="var(--questly-orange)" rotulo="Prova" />
            </div>
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {subjects.slice(0, 6).map((s, i) => (
                  <Legenda
                    key={s.id}
                    cor={CORES_DISCIPLINA[i % CORES_DISCIPLINA.length]}
                    rotulo={s.nome}
                    redondo
                    solido
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- painel do dia ---------------- */}
        <aside className="min-w-0 rounded-2xl border border-border bg-background/50 p-3.5">
          {!diaSelecionado ? (
            <p className="py-8 text-center text-[12.5px] text-muted-foreground">
              Escolha um dia no calendário.
            </p>
          ) : (
            <>
              <div className="mb-3">
                <p className="text-[13.5px] font-semibold leading-tight tracking-tight">
                  {rotuloData(diaSelecionado.data)}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {diaSelecionado.estado === "prova"
                    ? diaSelecionado.title || "Dia de prova"
                    : reservado > 0
                      ? `${fmtDuracao(reservado)} de estudo reservados`
                      : diaSelecionado.estado === "estudou"
                        ? "Missão cumprida nesse dia"
                        : "Nada marcado ainda"}
                </p>
              </div>

              {itensDoDia.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1.5">
                  {itensDoDia.map((t) => (
                    <ItemAgenda
                      key={t.id}
                      item={t}
                      cor={corDoSubject(t.subjectId, subjects)}
                      onAlternar={() => alternar(diaSelecionado.data, t.id, t.concluida)}
                      onRemover={() => remover(diaSelecionado.data, t.id)}
                      onAdiar={() => mover(t.id, diaSelecionado.data, somarDias(diaSelecionado.data, 1))}
                      onDragStart={() => {
                        arrastando.current = t.id;
                      }}
                    />
                  ))}
                </ul>
              )}

              <AnimatePresence initial={false} mode="wait">
                {formAberto ? (
                  <motion.div
                    key="form"
                    initial={semMovimento ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
                      <div className="flex rounded-lg bg-background p-0.5">
                        {(["sessao", "tarefa"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTipo(t)}
                            className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-[11.5px] font-bold transition-colors ${
                              tipo === t
                                ? "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t === "sessao" ? "Sessão de estudo" : "Tarefa"}
                          </button>
                        ))}
                      </div>

                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void adicionar();
                        }}
                        placeholder={tipo === "sessao" ? "Ex.: Revisar derivadas" : "Ex.: Entregar lista 3"}
                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-[12.5px] outline-none focus:border-questly-green"
                      />

                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full cursor-pointer rounded-lg border border-input bg-background px-2.5 py-1.5 text-[12.5px] outline-none focus:border-questly-green"
                      >
                        <option value="">Sem disciplina</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </select>

                      {tipo === "sessao" && (
                        <>
                          <label className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                            Começa às
                            <input
                              type="time"
                              value={hora}
                              onChange={(e) => setHora(e.target.value)}
                              className="tnum flex-1 cursor-pointer rounded-lg border border-input bg-background px-2.5 py-1.5 text-[12.5px] text-foreground outline-none focus:border-questly-green"
                            />
                          </label>

                          <div className="flex gap-1">
                            {DURACOES.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDuracao(d)}
                                className={`tnum flex-1 cursor-pointer rounded-lg px-1 py-1.5 text-[11.5px] font-bold transition-colors ${
                                  duracao === d
                                    ? "bg-questly-green text-white dark:text-[#0c1512]"
                                    : "bg-background text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {fmtDuracao(d)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="mt-0.5 flex gap-2">
                        <button
                          type="button"
                          onClick={adicionar}
                          disabled={!nome.trim() || salvando}
                          className="flex-1 cursor-pointer rounded-lg bg-questly-green px-3 py-2 text-[12.5px] font-bold text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 dark:text-[#0c1512]"
                        >
                          {salvando ? "Salvando..." : tipo === "sessao" ? "Agendar" : "Adicionar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormAberto(false)}
                          aria-label="Fechar"
                          className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X size={14} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="botoes"
                    initial={semMovimento ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => abrirForm("sessao")}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-questly-green px-3 py-2 text-[12.5px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
                    >
                      <Clock size={13} strokeWidth={2.4} /> Agendar sessão
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirForm("tarefa")}
                      aria-label="Adicionar tarefa"
                      className="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
                    >
                      <Plus size={15} strokeWidth={2.3} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {resumoMes.total > 0 && (
                <dl className="mt-4 grid grid-cols-3 gap-1.5 border-t border-border pt-3">
                  <MiniResumo rotulo="sessões" valor={String(resumoMes.sessoes)} />
                  <MiniResumo
                    rotulo="reservado"
                    valor={resumoMes.minutos > 0 ? fmtDuracao(resumoMes.minutos) : "—"}
                  />
                  <MiniResumo rotulo="feitos" valor={`${resumoMes.feitos}/${resumoMes.total}`} />
                </dl>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ célula

function CelulaDia({
  day,
  itens,
  subjects,
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
  subjects: { id: string }[];
  ativo: boolean;
  alvoArraste: boolean;
  onSelecionar: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStartItem: (id: string) => void;
}) {
  const hoje = day.estado === "hoje";
  const prova = day.estado === "prova";
  const estudou = day.estado === "estudou";
  const visiveis = itens.slice(0, 2);
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
      aria-label={`Dia ${day.dia}${itens.length ? `, ${itens.length} marcação(ões)` : ""}`}
      className={`flex min-h-[52px] cursor-pointer flex-col gap-1 rounded-xl border p-1.5 text-left transition-colors sm:min-h-[74px] ${
        hoje
          ? "border-questly-green/55 bg-questly-green-light"
          : prova
            ? "border-questly-orange/45 bg-questly-orange-light"
            : estudou
              ? "border-questly-green/25 bg-questly-green-light/55"
              : "border-border/70 bg-background/40 hover:border-questly-green/35 hover:bg-muted/50"
      } ${ativo ? "ring-2 ring-questly-green/55 ring-offset-1 ring-offset-card" : ""} ${
        alvoArraste ? "border-dashed border-questly-green bg-questly-green-light" : ""
      }`}
    >
      <span className="flex items-center justify-between">
        <span
          className={`tnum text-[12px] font-bold leading-none ${
            hoje
              ? "text-questly-green-dark dark:text-questly-green"
              : prova
                ? "text-questly-orange-dark"
                : "text-muted-foreground"
          }`}
        >
          {day.dia}
        </span>
        {prova && <Swords size={10} strokeWidth={2.5} className="text-questly-orange-dark" />}
        {estudou && !prova && (
          <Check size={10} strokeWidth={3} className="text-questly-green-dark dark:text-questly-green" />
        )}
      </span>

      {/* As marcações escritas — é isso que transforma o quadrinho em agenda.
          No mobile a célula não cabe texto: só as bolinhas coloridas. */}
      <span className="hidden min-w-0 flex-col gap-[3px] sm:flex">
        {visiveis.map((t) => (
          <span
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.effectAllowed = "move";
              onDragStartItem(t.id);
            }}
            // Fundo da SUPERFÍCIE, não um tingimento da cor da disciplina: a
            // célula por baixo já pode estar verde (hoje/estudou) ou laranja
            // (prova), e chip tingido sobre célula tingida vira lama. A cor da
            // disciplina entra por um ponto — a barra lateral de 2px, nesse
            // corpo de 9.5px, lia como um parêntese perdido.
            className={`flex min-w-0 cursor-grab items-center gap-1 rounded-[5px] bg-card px-1 py-[2px] text-[9.5px] font-semibold leading-tight shadow-xs ring-1 ring-border/60 active:cursor-grabbing ${
              t.concluida ? "opacity-55 line-through" : ""
            }`}
            style={{ color: corDoSubject(t.subjectId, subjects) }}
          >
            <i
              aria-hidden
              className="h-[5px] w-[5px] shrink-0 rounded-full"
              style={{ background: corDoSubject(t.subjectId, subjects) }}
            />
            {t.hora && <span className="tnum shrink-0 opacity-80">{t.hora}</span>}
            <span className="truncate">{t.nome}</span>
          </span>
        ))}
        {sobra > 0 && (
          <span className="px-1 text-[9.5px] font-semibold text-muted-foreground">+{sobra}</span>
        )}
      </span>

      {/* Mobile: as mesmas marcações viradas em pontos da cor da disciplina. */}
      <span className="mt-auto flex gap-[3px] sm:hidden">
        {itens.slice(0, 3).map((t) => (
          <i
            key={t.id}
            className="h-[5px] w-[5px] rounded-full"
            style={{ background: corDoSubject(t.subjectId, subjects) }}
          />
        ))}
      </span>
    </div>
  );
}

// -------------------------------------------------------------- item do dia

function ItemAgenda({
  item,
  cor,
  onAlternar,
  onRemover,
  onAdiar,
  onDragStart,
}: {
  item: TarefaRow;
  cor: string;
  onAlternar: () => void;
  onRemover: () => void;
  onAdiar: () => void;
  onDragStart: () => void;
}) {
  const sessao = item.tipo === "sessao";
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className="group flex cursor-grab items-start gap-2 rounded-xl border border-border bg-card px-2.5 py-2 active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${cor}` }}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-label={item.concluida ? "Desmarcar" : "Marcar como feito"}
        className={`mt-0.5 flex h-[16px] w-[16px] shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors ${
          item.concluida ? "border-questly-green bg-questly-green text-white" : "border-border"
        }`}
      >
        {item.concluida && <Check size={10} strokeWidth={3} />}
      </button>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[12.5px] font-semibold leading-tight ${
            item.concluida ? "text-muted-foreground line-through" : ""
          }`}
        >
          {item.nome}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">
          {sessao ? (
            <Clock size={9} strokeWidth={2.4} />
          ) : (
            <ListTodo size={9} strokeWidth={2.4} />
          )}
          <span className="tnum truncate">
            {[
              sessao && item.hora ? item.hora : null,
              sessao && item.duracaoMin ? fmtDuracao(item.duracaoMin) : null,
              item.subjectNome,
            ]
              .filter(Boolean)
              .join(" · ") || (sessao ? "Sessão de estudo" : "Tarefa")}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={onAdiar}
          aria-label="Adiar para amanhã"
          title="Adiar para amanhã"
          className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight size={13} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={onRemover}
          aria-label="Excluir"
          className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-questly-red-dark"
        >
          <Trash2 size={12} strokeWidth={2.2} />
        </button>
      </span>
    </li>
  );
}

function MiniResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0 text-center">
      <dt className="truncate text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="tnum mt-0.5 text-[14px] font-bold leading-none">{valor}</dd>
    </div>
  );
}

function Legenda({
  cor,
  rotulo,
  solido,
  redondo,
}: {
  cor: string;
  rotulo: string;
  solido?: boolean;
  redondo?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
      <i
        className={`inline-block shrink-0 ${redondo ? "h-2 w-2 rounded-full" : "h-2.5 w-2.5 rounded-[4px]"}`}
        style={{
          background: solido ? cor : `color-mix(in oklab, ${cor} 22%, transparent)`,
          border: solido ? undefined : `1px solid color-mix(in oklab, ${cor} 45%, transparent)`,
        }}
      />
      {rotulo}
    </span>
  );
}
