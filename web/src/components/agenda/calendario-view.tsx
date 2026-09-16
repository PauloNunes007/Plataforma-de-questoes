"use client";

// CALENDÁRIO — a tela dedicada (`/calendario`).
//
// **Repasse de 2026-09-15.** A agenda era um cartão no PÉ da home: quem não
// rolava até o fim nunca soube que existia, e quem rolava encontrava um
// calendário espremido dividindo a largura com o resto do dia. Agora são duas
// coisas separadas e cada uma faz bem o seu papel:
//
//   • na home, um "Mapa de progresso" COMPACTO no alto da coluna da direita —
//     só leitura (o mês pintado, três números e um caminho pra cá);
//   • aqui, o mês inteiro em tela cheia, que é onde se PLANEJA.
//
// O que esta tela deliberadamente NÃO tem: ciclos de estudo, flashcards e
// redação. Ela é um calendário mensal comum — abre no mês, você clica no dia,
// e marca o que vai fazer. Tudo que entra num dia é uma linha de `tarefas`
// (sessão / tarefa / meta) ou um `boss` (prova); nada aqui gera missão, XP ou
// ofensiva — planejar não é conquistar.

import { useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Flame, Target, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import type { MesAgenda, ProvaDia } from "@/lib/agenda/agenda-data";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import { ehEstudo, minutosReservados, ordenarDia } from "@/lib/tarefas/tarefas-data";
import {
  alternarTarefaAction,
  criarTarefaAction,
  excluirTarefaAction,
  iniciarEstudoPlanejadoAction,
  moverTarefaAction,
  type NovoItemAgenda,
} from "@/lib/tarefas/actions";
import { carregarMesAgendaAction, desmarcarProvaAction, marcarProvaAction } from "@/lib/agenda/actions";
import { hrefQuestao } from "@/lib/questao/navegacao";
import { DOW_CURTO, DOW_LETRA, fmtDuracao, somarDias } from "@/lib/agenda/formato";
import { CelulaDia } from "./celula-dia";
import { PainelDia } from "./painel-dia";

export function CalendarioView({
  mesInicial,
  subjects,
  hoje,
  diaInicial,
}: {
  mesInicial: MesAgenda;
  subjects: { id: string; nome: string }[];
  hoje: string;
  /** Dia pré-selecionado (`/calendario?dia=YYYY-MM-DD`, vindo do card da home). */
  diaInicial: string | null;
  /** false = modo livre: o dia não oferece "marcar prova". */
}) {
  const semMovimento = useReducedMotion();
  const [mes, setMes] = useState(mesInicial);
  const [itens, setItens] = useState<Record<string, TarefaRow[]>>(mesInicial.tarefas);
  const [provas, setProvas] = useState<Record<string, ProvaDia>>(mesInicial.provas);
  const [selecionado, setSelecionado] = useState<string | null>(
    diaInicial && mesInicial.days.some((d) => d.data === diaInicial) ? diaInicial : hoje || null,
  );
  const [sheetAberto, setSheetAberto] = useState(false);
  const [navegando, iniciarNavegacao] = useTransition();
  const [erroRede, setErroRede] = useState<string | null>(null);
  const arrastando = useRef<string | null>(null);
  const [alvoArraste, setAlvoArraste] = useState<string | null>(null);

  const noMesAtual = mes.days.some((d) => d.data === hoje);
  const diaSelecionado = useMemo(
    () => mes.days.find((d) => d.data === selecionado) || null,
    [mes.days, selecionado],
  );
  const itensDoDia = selecionado ? itens[selecionado] || [] : [];

  // Resumo do mês exibido — aritmética pura sobre o que já está em memória,
  // sem consulta nova.
  const resumo = useMemo(() => {
    let blocos = 0;
    let minutos = 0;
    let metas = 0;
    let metasBatidas = 0;
    mes.days.forEach((d) => {
      const doDia = itens[d.data] || [];
      minutos += minutosReservados(doDia);
      doDia.forEach((t) => {
        if (ehEstudo(t)) blocos += 1;
        // O alvo é contado pelo CAMPO, não pelo tipo: um bloco com horário
        // também pode ter alvo desde que sessão e meta viraram a mesma coisa.
        if (t.metaQuestoes != null) {
          metas += 1;
          const feitas = t.subjectId ? mes.questoesPorDia[d.data]?.[t.subjectId] || 0 : 0;
          if (feitas >= t.metaQuestoes) metasBatidas += 1;
        }
      });
    });
    return { blocos, minutos, metas, metasBatidas };
  }, [mes.days, mes.questoesPorDia, itens]);

  function aplicarMes(novo: MesAgenda, diaAlvo?: string) {
    setMes(novo);
    // Mescla em vez de substituir: o aluno pode ter criado algo em outro mês
    // e voltado — substituir apagaria o que ele acabou de ver.
    setItens((prev) => ({ ...prev, ...novo.tarefas }));
    setProvas((prev) => ({ ...prev, ...novo.provas }));
    setSelecionado(diaAlvo || novo.days.find((d) => d.data === hoje)?.data || novo.days[0]?.data || null);
  }

  /**
   * Toda leitura de outro mês passa por aqui, e o try/catch NÃO é opcional:
   * uma Server Action que rejeita dentro de `startTransition` sobe pro error
   * boundary mais próximo — ou seja, a página INTEIRA vira "algo quebrou do
   * nosso lado" porque o aluno clicou numa seta. Falhar em buscar um mês é um
   * contratempo de rede; o mês que já está na tela continua perfeitamente
   * válido. Aqui isso vira um aviso na régua do calendário e nada mais.
   */
  function carregarMes(ano: number, mesIdx: number, diaAlvo?: string) {
    iniciarNavegacao(async () => {
      try {
        const novo = await carregarMesAgendaAction(ano, mesIdx);
        if (novo) {
          aplicarMes(novo, diaAlvo);
          setErroRede(null);
        } else {
          setErroRede("Não foi possível carregar esse mês.");
        }
      } catch (e) {
        console.error("Falha ao carregar o mês da agenda:", e);
        setErroRede("Sem resposta do servidor. Confira a conexão e tente de novo.");
      }
    });
  }

  function irParaMes(delta: number) {
    const alvo = new Date(mes.ano, mes.mes + delta, 1);
    carregarMes(alvo.getFullYear(), alvo.getMonth());
  }

  function voltarPraHoje() {
    if (noMesAtual) {
      setSelecionado(hoje);
      return;
    }
    carregarMes(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)) - 1, hoje);
  }

  function selecionar(data: string) {
    setSelecionado(data);
    // No celular o painel não cabe ao lado da grade: vira bottom sheet, o
    // mesmo padrão do tópico na trilha.
    setSheetAberto(true);
  }

  async function adicionar(novo: NovoItemAgenda): Promise<boolean> {
    const { ok, id } = await criarTarefaAction(novo);
    if (!ok || !id) return false;
    const linha: TarefaRow = {
      id,
      nome: novo.nome.trim(),
      descricao: null,
      data: novo.data,
      concluida: false,
      subjectId: novo.subjectId,
      subjectNome: subjects.find((s) => s.id === novo.subjectId)?.nome || null,
      tipo: novo.tipo || "tarefa",
      hora: novo.hora || null,
      duracaoMin: novo.duracaoMin ?? null,
      metaQuestoes: novo.metaQuestoes ?? null,
      missionId: null,
    };
    setItens((prev) => ({ ...prev, [novo.data]: ordenarDia([...(prev[novo.data] || []), linha]) }));
    // Uma meta recém-criada já nasce com o progresso certo: `questoesPorDia` é
    // lido pro mês inteiro, independente de existir meta — não há o que
    // recarregar aqui.
    return true;
  }

  // As três escritas abaixo são otimistas: a tela muda antes da confirmação.
  // O desfazer no `catch`/`!ok` é o que impede a mentira silenciosa — marcar
  // como feito, excluir ou arrastar uma linha que o servidor nunca aceitou, e
  // o aluno só descobrir no próximo F5.
  async function alternar(data: string, id: string, concluidaAtual: boolean) {
    const inverter = () =>
      setItens((prev) => ({
        ...prev,
        [data]: (prev[data] || []).map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)),
      }));
    inverter();
    try {
      const { ok } = await alternarTarefaAction(id, !concluidaAtual);
      if (!ok) {
        inverter();
        setErroRede("Não foi possível atualizar esse item.");
      }
    } catch (e) {
      console.error("Falha ao alternar item da agenda:", e);
      inverter();
      setErroRede("Sem resposta do servidor. Confira a conexão e tente de novo.");
    }
  }

  async function remover(data: string, id: string) {
    const antes = itens[data] || [];
    setItens((prev) => ({ ...prev, [data]: (prev[data] || []).filter((t) => t.id !== id) }));
    try {
      const { ok } = await excluirTarefaAction(id);
      if (!ok) {
        setItens((prev) => ({ ...prev, [data]: antes }));
        setErroRede("Não foi possível excluir esse item.");
      }
    } catch (e) {
      console.error("Falha ao excluir item da agenda:", e);
      setItens((prev) => ({ ...prev, [data]: antes }));
      setErroRede("Sem resposta do servidor. Confira a conexão e tente de novo.");
    }
  }

  async function mover(id: string, de: string, para: string) {
    if (de === para) return;
    const item = (itens[de] || []).find((t) => t.id === id);
    if (!item) return;
    const antesDe = itens[de] || [];
    const antesPara = itens[para] || [];
    setItens((prev) => ({
      ...prev,
      [de]: (prev[de] || []).filter((t) => t.id !== id),
      [para]: ordenarDia([...(prev[para] || []), { ...item, data: para }]),
    }));
    const desfazer = () => setItens((prev) => ({ ...prev, [de]: antesDe, [para]: antesPara }));
    try {
      const { ok } = await moverTarefaAction(id, para);
      if (!ok) {
        desfazer();
        setErroRede("Não foi possível mover esse item.");
      }
    } catch (e) {
      console.error("Falha ao mover item da agenda:", e);
      desfazer();
      setErroRede("Sem resposta do servidor. Confira a conexão e tente de novo.");
    }
  }

  /**
   * "Começar" num bloco de hoje: monta a lista de questões da disciplina e
   * devolve o link dela (quem navega é o item, que sabe mostrar o "Montando
   * lista..."). Guarda o `missionId` no estado local pra que, se o aluno
   * voltar pro calendário, o mesmo bloco ofereça "Continuar" em vez de
   * sortear uma segunda lista.
   */
  async function iniciarEstudo(data: string, id: string): Promise<string | null> {
    try {
      const { missaoId, erro } = await iniciarEstudoPlanejadoAction(id);
      if (!missaoId) {
        setErroRede(erro || "Não foi possível montar a lista desse bloco.");
        return null;
      }
      setItens((prev) => ({
        ...prev,
        [data]: (prev[data] || []).map((t) => (t.id === id ? { ...t, missionId: missaoId } : t)),
      }));
      return hrefQuestao(missaoId, "/calendario");
    } catch (e) {
      console.error("Falha ao começar o bloco de estudo:", e);
      setErroRede("Sem resposta do servidor. Confira a conexão e tente de novo.");
      return null;
    }
  }

  /** Devolve a mensagem de erro (ou null) — quem mostra é o painel do dia. */
  async function marcarProva(subjectId: string, nome: string): Promise<string | null> {
    if (!selecionado) return "Escolha um dia.";
    try {
      const { prova, error } = await marcarProvaAction({ subjectId, nome, data: selecionado });
      if (error || !prova) return error || "Não foi possível marcar essa prova.";
      setProvas((prev) => ({ ...prev, [selecionado]: prova }));
      return null;
    } catch (e) {
      // Devolve string em vez de deixar estourar: quem chama é o `salvar()` do
      // painel, e uma rejeição ali deixava o botão em "Salvando..." pra sempre.
      console.error("Falha ao marcar prova:", e);
      return "Sem resposta do servidor. Confira a conexão e tente de novo.";
    }
  }

  async function desmarcarProva(bossId: string) {
    const data = Object.keys(provas).find((d) => provas[d].bossId === bossId);
    if (!data) return;
    const anterior = provas[data];
    setProvas((prev) => {
      const copia = { ...prev };
      delete copia[data];
      return copia;
    });
    // Devolve a prova pro lugar se o servidor recusou — sumir da tela uma
    // prova que continua no banco é pior do que não remover.
    try {
      const { error } = await desmarcarProvaAction(bossId);
      if (error) {
        setProvas((prev) => ({ ...prev, [data]: anterior }));
        setErroRede(error);
      }
    } catch (e) {
      console.error("Falha ao desmarcar prova:", e);
      setProvas((prev) => ({ ...prev, [data]: anterior }));
      setErroRede("Sem resposta do servidor. Confira a conexão e tente de novo.");
    }
  }

  const painel = diaSelecionado ? (
    <PainelDia
      data={diaSelecionado.data}
      hoje={hoje}
      estudou={diaSelecionado.estado === "estudou"}
      itens={itensDoDia}
      prova={provas[diaSelecionado.data] || null}
      progresso={mes.questoesPorDia[diaSelecionado.data] || {}}
      historico={mes.historico[diaSelecionado.data] || null}
      subjects={subjects}
      onAdicionar={adicionar}
      onAlternar={(id, concluida) => void alternar(diaSelecionado.data, id, concluida)}
      onRemover={(id) => void remover(diaSelecionado.data, id)}
      onAdiar={(id) => void mover(id, diaSelecionado.data, somarDias(diaSelecionado.data, 1))}
      onMarcarProva={marcarProva}
      onDesmarcarProva={(bossId) => void desmarcarProva(bossId)}
      onIniciarEstudo={(id) => iniciarEstudo(diaSelecionado.data, id)}
      onDragStartItem={(id) => {
        arrastando.current = id;
      }}
    />
  ) : (
    <p className="py-8 text-center text-[12.5px] text-muted-foreground">Escolha um dia no calendário.</p>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        titulo="Calendário"
        descricao="Toque num dia pra marcar um bloco de estudo, anotar uma tarefa ou registrar o dia da prova."
        voltarHref="/dashboard"
        voltarLabel="Início"
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Indicador
          icone={<Flame size={15} strokeWidth={2.2} />}
          tom="green"
          valor={String(mes.diasEstudados)}
          rotulo="dias com estudo"
        />
        <Indicador
          icone={<Clock size={15} strokeWidth={2.2} />}
          tom="blue"
          valor={resumo.minutos > 0 ? fmtDuracao(resumo.minutos) : "—"}
          rotulo="reservado no mês"
        />
        <Indicador
          icone={<CalendarDays size={15} strokeWidth={2.2} />}
          tom="purple"
          valor={String(resumo.blocos)}
          rotulo="blocos de estudo"
        />
        <Indicador
          icone={<Target size={15} strokeWidth={2.2} />}
          tom="orange"
          valor={resumo.metas > 0 ? `${resumo.metasBatidas}/${resumo.metas}` : "—"}
          rotulo="alvos batidos"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="surface min-w-0 p-3 sm:p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-[19px] font-semibold tracking-tight sm:text-[21px]">
              {mes.monthLabel}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={voltarPraHoje}
                className="mr-1 h-9 cursor-pointer rounded-xl border border-border px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => irParaMes(-1)}
                disabled={navegando}
                aria-label="Mês anterior"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground disabled:opacity-50"
              >
                <ChevronLeft size={17} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => irParaMes(1)}
                disabled={navegando}
                aria-label="Próximo mês"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground disabled:opacity-50"
              >
                <ChevronRight size={17} strokeWidth={2.2} />
              </button>
            </div>
          </header>

          {erroRede && (
            <div
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-xl border border-questly-red/35 bg-questly-red-light px-3 py-2"
            >
              <span className="min-w-0 flex-1 text-[11.5px] font-medium leading-relaxed text-questly-red-dark">
                {erroRede}
              </span>
              <button
                type="button"
                onClick={() => setErroRede(null)}
                aria-label="Fechar aviso"
                className="-mr-0.5 shrink-0 cursor-pointer p-0.5 text-questly-red-dark/70 transition-colors hover:text-questly-red-dark"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            </div>
          )}

          <div className={`transition-opacity ${navegando ? "opacity-50" : ""}`}>
            <div className="mb-1 grid grid-cols-7 gap-1.5 sm:gap-2">
              {DOW_CURTO.map((d, i) => (
                <div
                  key={d}
                  className="pb-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground/70"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{DOW_LETRA[i]}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: mes.dowOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="min-h-[58px] sm:min-h-[104px]" />
              ))}

              {mes.days.map((day) => (
                <CelulaDia
                  key={day.data}
                  day={day}
                  itens={itens[day.data] || []}
                  prova={provas[day.data] || null}
                  progresso={mes.questoesPorDia[day.data] || {}}
                  ativo={selecionado === day.data}
                  alvoArraste={alvoArraste === day.data}
                  onSelecionar={() => selecionar(day.data)}
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
          </div>

          {/* Duas legendas, porque são dois sistemas de cor: a CÉLULA é pintada
              pelo estado do dia; o PONTO do chip, pela disciplina. */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
            <Legenda cor="var(--questly-green)" rotulo="Hoje" solido />
            <Legenda cor="var(--questly-green)" rotulo="Estudou" />
            <Legenda cor="var(--questly-orange)" rotulo="Prova" />
            {subjects.length > 0 && (
              <span className="text-[10.5px] font-medium text-muted-foreground">
                · o ponto colorido é a disciplina
              </span>
            )}
          </div>
        </section>

        {/* Painel do dia — rail lateral no desktop… */}
        <aside className="surface hidden min-w-0 p-4 xl:sticky xl:top-[70px] xl:block">{painel}</aside>
      </div>

      {/* …e bottom sheet no celular (mesmo padrão do PainelTopico da trilha). */}
      <AnimatePresence>
        {sheetAberto && diaSelecionado && (
          <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Detalhes do dia">
            <motion.button
              type="button"
              aria-label="Fechar detalhes do dia"
              className="absolute inset-0 h-full w-full cursor-pointer bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSheetAberto(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background px-4 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              initial={semMovimento ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-end bg-background pb-2 pt-1.5">
                <span className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/25" />
                <button
                  type="button"
                  onClick={() => setSheetAberto(false)}
                  aria-label="Fechar"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={17} strokeWidth={2} />
                </button>
              </div>
              {painel}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TOM_INDICADOR = {
  green: "bg-questly-green-light text-questly-green-dark dark:text-questly-green",
  blue: "bg-questly-blue-light text-questly-blue-dark",
  purple: "bg-questly-purple/12 text-questly-purple",
  orange: "bg-questly-orange-light text-questly-orange-dark",
} as const;

function Indicador({
  icone,
  tom,
  valor,
  rotulo,
}: {
  icone: React.ReactNode;
  tom: keyof typeof TOM_INDICADOR;
  valor: string;
  rotulo: string;
}) {
  return (
    <div className="surface flex min-w-0 items-center gap-2.5 px-3 py-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${TOM_INDICADOR[tom]}`}>
        {icone}
      </span>
      <span className="min-w-0">
        <span className="tnum block text-[17px] font-bold leading-none tracking-tight">{valor}</span>
        <span className="mt-0.5 block truncate text-[10.5px] font-medium text-muted-foreground">
          {rotulo}
        </span>
      </span>
    </div>
  );
}

function Legenda({ cor, rotulo, solido }: { cor: string; rotulo: string; solido?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
      <i
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-[4px]"
        style={{
          background: solido ? cor : `color-mix(in oklab, ${cor} 22%, transparent)`,
          border: solido ? undefined : `1px solid color-mix(in oklab, ${cor} 45%, transparent)`,
        }}
      />
      {rotulo}
    </span>
  );
}
