"use client";

// Painel de UM dia do calendário. É o mesmo componente no rail lateral do
// desktop e dentro do bottom sheet do celular — a diferença é só quem o
// envolve (ver `calendario-view.tsx`).
//
// Quatro coisas podem ser marcadas num dia, e elas não são variações do mesmo
// campo:
//   • SESSÃO  — bloco de estudo com hora e duração;
//   • TAREFA  — afazer solto, sem horário;
//   • META    — "N questões de tal disciplina". O progresso é RECONTADO das
//               missões daquele dia, nunca digitado;
//   • PROVA   — escreve em `bosses`, a mesma prova que a trilha, a contagem
//               regressiva e a projeção de nota leem. Não é um post-it.
//
// Marcar qualquer uma delas NÃO dá XP, não gera missão e não acende a
// ofensiva: planejar não é conquistar, e pagar por plano marcado abriria o
// caminho de forjar ranking.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Clock, ListTodo, Swords, Target, Trash2, X } from "lucide-react";
import type { ProvaDia } from "@/lib/agenda/agenda-data";
import type { TarefaRow, TipoItemAgenda } from "@/lib/tarefas/tarefas-data";
import type { NovoItemAgenda } from "@/lib/tarefas/actions";
import { minutosReservados } from "@/lib/tarefas/tarefas-data";
import { fmtDuracao, rotuloData } from "@/lib/agenda/formato";
import { corDoItem } from "./celula-dia";

/** Durações que o aluno escolhe num toque — o resto vai no campo livre. */
const DURACOES = [25, 50, 90, 120] as const;
/** Metas de questões que cobrem quase todo dia de estudo real. */
const QUANTIDADES = [10, 20, 30, 50] as const;
/** Nomes de prova que a faculdade usa; o campo continua livre. */
const NOMES_PROVA = ["P1", "P2", "P3", "Final"];

type Modo = "sessao" | "tarefa" | "meta" | "prova";

export function PainelDia({
  data,
  estudou,
  itens,
  prova,
  progresso,
  subjects,
  onAdicionar,
  onAlternar,
  onRemover,
  onAdiar,
  onMarcarProva,
  onDesmarcarProva,
  onDragStartItem,
}: {
  data: string;
  estudou: boolean;
  itens: TarefaRow[];
  prova: ProvaDia | null;
  progresso: Record<string, number>;
  subjects: { id: string; nome: string }[];
  onAdicionar: (novo: NovoItemAgenda) => Promise<boolean>;
  onAlternar: (id: string, concluida: boolean) => void;
  onRemover: (id: string) => void;
  onAdiar: (id: string) => void;
  onMarcarProva: (subjectId: string, nome: string) => Promise<string | null>;
  onDesmarcarProva: (bossId: string) => void;
  onDragStartItem: (id: string) => void;
}) {
  const semMovimento = useReducedMotion();
  const [modo, setModo] = useState<Modo | null>(null);
  const [nome, setNome] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [hora, setHora] = useState("19:00");
  const [duracao, setDuracao] = useState<number>(50);
  const [quantidade, setQuantidade] = useState<number>(20);
  const [nomeProva, setNomeProva] = useState("P1");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const reservado = minutosReservados(itens);
  const semDisciplinas = subjects.length === 0;

  function abrir(m: Modo) {
    setErro(null);
    setModo(m);
    // Meta e prova exigem disciplina: já deixa a primeira escolhida pra que o
    // caminho feliz seja "escolher número → salvar".
    if ((m === "meta" || m === "prova") && !subjectId && subjects[0]) setSubjectId(subjects[0].id);
  }

  function fechar() {
    setModo(null);
    setNome("");
    setErro(null);
  }

  async function salvar() {
    if (salvando || !modo) return;
    setSalvando(true);
    setErro(null);

    if (modo === "prova") {
      const msg = await onMarcarProva(subjectId, nomeProva.trim() || "Prova");
      if (msg) setErro(msg);
      else fechar();
      setSalvando(false);
      return;
    }

    const disciplina = subjects.find((s) => s.id === subjectId);
    // A meta não pede título: o título DELA é o número mais a disciplina, e
    // obrigar o aluno a escrever "30 questões de Cálculo II" seria pedir que
    // ele repita o que já escolheu nos dois campos acima.
    const titulo =
      modo === "meta" ? `${quantidade} questões de ${disciplina?.nome || "estudo"}` : nome.trim();
    if (!titulo) {
      setSalvando(false);
      return;
    }

    const ok = await onAdicionar({
      nome: titulo,
      descricao: null,
      subjectId: subjectId || null,
      data,
      tipo: modo as TipoItemAgenda,
      hora: modo === "sessao" ? hora : null,
      duracaoMin: modo === "sessao" ? duracao : null,
      metaQuestoes: modo === "meta" ? quantidade : null,
    });
    if (ok) fechar();
    else setErro("Não foi possível salvar. Tente de novo.");
    setSalvando(false);
  }

  const tituloForm: Record<Modo, string> = {
    sessao: "Nova sessão",
    tarefa: "Nova tarefa",
    meta: "Meta de questões",
    prova: "Marcar prova",
  };
  const rotuloSalvar: Record<Modo, string> = {
    sessao: "Agendar sessão",
    tarefa: "Adicionar tarefa",
    meta: "Definir meta",
    prova: "Marcar prova",
  };

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-3">
        <p className="font-heading text-[15px] font-semibold leading-tight tracking-tight">
          {rotuloData(data)}
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {reservado > 0
            ? `${fmtDuracao(reservado)} de estudo reservados`
            : estudou
              ? "Você estudou nesse dia"
              : "Nada marcado ainda"}
        </p>
      </div>

      {prova && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-questly-orange/45 bg-questly-orange-light px-3 py-2.5">
          <Swords size={15} strokeWidth={2.3} className="mt-px shrink-0 text-questly-orange-dark" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-bold text-questly-orange-dark">
              {prova.subjectNome}
            </span>
            <span className="block text-[11px] font-medium text-questly-orange-dark/85">
              Dia de prova · {prova.nome}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onDesmarcarProva(prova.bossId)}
            aria-label="Desmarcar prova"
            title="Desmarcar prova"
            className="shrink-0 cursor-pointer p-0.5 text-questly-orange-dark/70 transition-colors hover:text-questly-red-dark"
          >
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {itens.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1.5">
          {itens.map((t) => (
            <ItemDia
              key={t.id}
              item={t}
              feitas={t.subjectId ? progresso[t.subjectId] || 0 : 0}
              onAlternar={() => onAlternar(t.id, t.concluida)}
              onRemover={() => onRemover(t.id)}
              onAdiar={() => onAdiar(t.id)}
              onDragStart={() => onDragStartItem(t.id)}
            />
          ))}
        </ul>
      )}

      <AnimatePresence initial={false} mode="wait">
        {modo ? (
          <motion.div
            key={`form-${modo}`}
            initial={semMovimento ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                  {tituloForm[modo]}
                </span>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>

              {(modo === "sessao" || modo === "tarefa") && (
                <input
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void salvar();
                  }}
                  placeholder={modo === "sessao" ? "Ex.: Revisar derivadas" : "Ex.: Entregar lista 3"}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-[13px] outline-none focus:border-questly-green"
                />
              )}

              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                aria-label="Disciplina"
                className="w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-[13px] outline-none focus:border-questly-green"
              >
                {/* Meta e prova são sempre DE uma disciplina; sessão e tarefa
                    podem ser soltas. */}
                {(modo === "sessao" || modo === "tarefa") && <option value="">Sem disciplina</option>}
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>

              {modo === "sessao" && (
                <>
                  <label className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                    Começa às
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="tnum flex-1 cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-questly-green"
                    />
                  </label>
                  <Chips valores={DURACOES} ativo={duracao} onEscolher={setDuracao} rotulo={fmtDuracao} />
                </>
              )}

              {modo === "meta" && (
                <>
                  <Chips
                    valores={QUANTIDADES}
                    ativo={quantidade}
                    onEscolher={setQuantidade}
                    rotulo={(q) => String(q)}
                  />
                  <label className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                    Ou
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={quantidade}
                      onChange={(e) =>
                        setQuantidade(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                      }
                      className="tnum w-20 rounded-xl border border-input bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-questly-green"
                    />
                    questões
                  </label>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    O progresso conta sozinho: toda questão que você responder nessa disciplina nesse dia
                    entra na meta.
                  </p>
                </>
              )}

              {modo === "prova" && (
                <>
                  <div className="flex gap-1">
                    {NOMES_PROVA.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNomeProva(n)}
                        className={`flex-1 cursor-pointer rounded-lg px-1 py-1.5 text-[11.5px] font-bold transition-colors ${
                          nomeProva === n
                            ? "bg-questly-orange-dark text-white dark:text-[#1a1206]"
                            : "bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input
                    value={nomeProva}
                    onChange={(e) => setNomeProva(e.target.value)}
                    placeholder="Nome da prova"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-[13px] outline-none focus:border-questly-orange"
                  />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    A prova entra na trilha e na contagem regressiva da disciplina — não é só uma marca no
                    calendário.
                  </p>
                </>
              )}

              {erro && <p className="text-[11.5px] font-medium text-questly-red-dark">{erro}</p>}

              <button
                type="button"
                onClick={salvar}
                disabled={salvando || ((modo === "sessao" || modo === "tarefa") && !nome.trim())}
                className={`mt-0.5 min-h-[42px] cursor-pointer rounded-xl px-3 text-[13px] font-bold text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 ${
                  modo === "prova"
                    ? "bg-questly-orange-dark dark:text-[#1a1206]"
                    : "bg-questly-green dark:text-[#0c1512]"
                }`}
              >
                {salvando ? "Salvando..." : rotuloSalvar[modo]}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="botoes"
            initial={semMovimento ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="grid grid-cols-2 gap-2"
          >
            <BotaoAdicionar
              icone={<Clock size={14} strokeWidth={2.4} />}
              rotulo="Sessão"
              primario
              onClick={() => abrir("sessao")}
            />
            <BotaoAdicionar
              icone={<Target size={14} strokeWidth={2.4} />}
              rotulo="Meta"
              desabilitado={semDisciplinas}
              onClick={() => abrir("meta")}
            />
            <BotaoAdicionar
              icone={<ListTodo size={14} strokeWidth={2.4} />}
              rotulo="Tarefa"
              onClick={() => abrir("tarefa")}
            />
            <BotaoAdicionar
              icone={<Swords size={14} strokeWidth={2.4} />}
              rotulo="Prova"
              desabilitado={semDisciplinas}
              onClick={() => abrir("prova")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {semDisciplinas && !modo && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Meta e prova precisam de uma disciplina — adicione as suas em Ajustes.
        </p>
      )}
    </div>
  );
}

function BotaoAdicionar({
  icone,
  rotulo,
  primario,
  desabilitado,
  onClick,
}: {
  icone: React.ReactNode;
  rotulo: string;
  primario?: boolean;
  desabilitado?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
        primario
          ? "bg-questly-green text-white shadow-sm hover:brightness-105 dark:text-[#0c1512]"
          : "border border-border bg-card text-foreground hover:border-questly-green/45"
      }`}
    >
      {icone}
      {rotulo}
    </button>
  );
}

function Chips({
  valores,
  ativo,
  onEscolher,
  rotulo,
}: {
  valores: readonly number[];
  ativo: number;
  onEscolher: (v: number) => void;
  rotulo: (v: number) => string;
}) {
  return (
    <div className="flex gap-1">
      {valores.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onEscolher(v)}
          className={`tnum flex-1 cursor-pointer rounded-lg px-1 py-1.5 text-[11.5px] font-bold transition-colors ${
            ativo === v
              ? "bg-questly-green text-white dark:text-[#0c1512]"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          {rotulo(v)}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------- item do dia

function ItemDia({
  item,
  feitas,
  onAlternar,
  onRemover,
  onAdiar,
  onDragStart,
}: {
  item: TarefaRow;
  feitas: number;
  onAlternar: () => void;
  onRemover: () => void;
  onAdiar: () => void;
  onDragStart: () => void;
}) {
  const cor = corDoItem(item);
  const meta = item.tipo === "meta" && item.metaQuestoes != null;
  const alvo = item.metaQuestoes || 0;
  const pct = meta && alvo > 0 ? Math.min(100, Math.round((feitas / alvo) * 100)) : 0;
  const batida = meta && feitas >= alvo;

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
        className={`mt-0.5 flex h-[17px] w-[17px] shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors ${
          item.concluida || batida
            ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
            : "border-border"
        }`}
      >
        {(item.concluida || batida) && <Check size={10} strokeWidth={3} />}
      </button>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[12.5px] font-semibold leading-tight ${
            item.concluida ? "text-muted-foreground line-through" : ""
          }`}
        >
          {item.nome}
        </span>

        {meta ? (
          // A meta mostra o que JÁ FOI FEITO, não o que foi prometido: o
          // número vem das questões respondidas naquele dia nessa disciplina.
          <>
            <span className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: cor }}
                />
              </span>
              <span className="tnum shrink-0 text-[10.5px] font-bold text-muted-foreground">
                {feitas}/{alvo}
              </span>
            </span>
            <span className="mt-0.5 block text-[10.5px] font-medium text-muted-foreground">
              {batida ? "Meta batida" : `Faltam ${alvo - feitas} questões`}
            </span>
          </>
        ) : (
          <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">
            {item.tipo === "sessao" ? (
              <Clock size={9} strokeWidth={2.4} />
            ) : (
              <ListTodo size={9} strokeWidth={2.4} />
            )}
            <span className="tnum truncate">
              {[
                item.tipo === "sessao" && item.hora ? item.hora : null,
                item.tipo === "sessao" && item.duracaoMin ? fmtDuracao(item.duracaoMin) : null,
                item.subjectNome,
              ]
                .filter(Boolean)
                .join(" · ") || (item.tipo === "sessao" ? "Sessão de estudo" : "Tarefa")}
            </span>
          </span>
        )}
      </span>

      <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
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
