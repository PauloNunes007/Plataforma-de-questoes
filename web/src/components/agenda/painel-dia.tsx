"use client";

// Painel de UM dia do calendário. É o mesmo componente no rail lateral do
// desktop e dentro do bottom sheet do celular — a diferença é só quem o
// envolve (ver `calendario-view.tsx`).
//
// TRÊS coisas podem ser marcadas num dia — eram quatro:
//   • ESTUDO  — um bloco de estudo de UMA disciplina. Pode ter horário,
//               duração e/ou um alvo de questões; nenhum dos três é
//               obrigatório e os três podem conviver. É o único item que vira
//               lista de questões com um clique ("Começar");
//   • TAREFA  — afazer solto, sem disciplina obrigatória e sem horário:
//               entregar a lista 3, falar com o professor;
//   • PROVA   — a data da prova, pintada no mês. Desde o fim do motor de
//               missões ela é SÓ AGENDA: nada no app lê essa data pra
//               recomendar assunto, projetar nota ou montar plano.
//
// **Por que caiu de quatro pra três.** "Sessão" e "Meta" eram dois botões
// respondendo à mesma pergunta — "vou estudar tal matéria hoje" — e só
// divergiam na unidade: minutos num, questões no outro. O aluno tinha que
// escolher entre dois formulários quase idênticos ANTES de escrever a mesma
// coisa, e o dia acabava com duas marcações ("Cálculo 19h" + "30 questões de
// Cálculo") que eram um compromisso só. Agora tempo e alvo são dois campos
// opcionais do mesmo bloco. As linhas antigas gravadas como `tipo='meta'`
// continuam válidas e são desenhadas aqui do mesmo jeito (ver `ehEstudo`).
//
// Marcar qualquer uma delas NÃO dá XP e não acende a ofensiva: planejar não é
// conquistar, e pagar por plano marcado abriria o caminho de forjar ranking.
// O caminho existe na direção contrária — fechar a lista risca o bloco.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  ListTodo,
  Loader2,
  Play,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import type { HistoricoDia, MissaoDia, ProvaDia, SimuladoDia } from "@/lib/agenda/agenda-data";
import { hrefQuestao } from "@/lib/questao/navegacao";
import type { TarefaRow } from "@/lib/tarefas/tarefas-data";
import type { NovoItemAgenda } from "@/lib/tarefas/actions";
import { ehEstudo, minutosReservados } from "@/lib/tarefas/tarefas-data";
import { fmtDuracao, rotuloData } from "@/lib/agenda/formato";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import { Select } from "@/components/ui/select";
import { buscarTopicosPraticaAction } from "@/lib/disciplinas/actions";
import type { TopicoPratica } from "@/lib/disciplinas/disciplinas-data";
import { corDoItem } from "./celula-dia";

/** "Sem tempo marcado" / "sem alvo": o zero é a ausência do campo, não um
 *  valor. Fica como chip pra que "não quero definir isso" seja uma escolha
 *  visível, e não um campo que o aluno precise adivinhar que pode deixar em
 *  branco. */
const SEM_VALOR = 0;

/** Durações que o aluno escolhe num toque. `SEM_VALOR` é "não vou cronometrar". */
const DURACOES = [SEM_VALOR, 25, 50, 90] as const;
/** Alvos de questões que cobrem quase todo dia de estudo real. */
const QUANTIDADES = [SEM_VALOR, 10, 20, 30] as const;
/** Nomes de prova que a faculdade usa; o campo continua livre. */
const NOMES_PROVA = ["P1", "P2", "P3", "Final"];

type Modo = "estudo" | "tarefa" | "prova";

/** O mesmo ícone do botão que abriu o formulário, repetido no cabeçalho dele:
 *  é o que diz "você está no que clicou" sem precisar ler o título. */
const ICONE_FORM: Record<Modo, React.ReactNode> = {
  estudo: <BookOpen size={13} strokeWidth={2.5} />,
  tarefa: <ListTodo size={13} strokeWidth={2.5} />,
  prova: <Swords size={13} strokeWidth={2.5} />,
};


export function PainelDia({
  data,
  hoje,
  estudou,
  itens,
  prova,
  progresso,
  historico,
  subjects,
  onAdicionar,
  onAlternar,
  onRemover,
  onAdiar,
  onMarcarProva,
  onDesmarcarProva,
  onDragStartItem,
  onIniciarEstudo,
}: {
  data: string;
  hoje: string;
  estudou: boolean;
  itens: TarefaRow[];
  prova: ProvaDia | null;
  progresso: Record<string, number>;
  historico: HistoricoDia | null;
  subjects: { id: string; nome: string; materiaId: string | null }[];
  onAdicionar: (novo: NovoItemAgenda) => Promise<boolean>;
  onAlternar: (id: string, concluida: boolean) => void;
  onRemover: (id: string) => void;
  onAdiar: (id: string) => void;
  onMarcarProva: (subjectId: string, nome: string) => Promise<string | null>;
  onDesmarcarProva: (bossId: string) => void;
  onDragStartItem: (id: string) => void;
  /** Transforma o bloco em lista de questões e devolve o link pra ela. */
  onIniciarEstudo: (id: string) => Promise<string | null>;
}) {
  const semMovimento = useReducedMotion();
  const [modo, setModo] = useState<Modo | null>(null);
  const [nome, setNome] = useState("");
  const [subjectId, setSubjectId] = useState("");
  // Os três campos de TAMANHO do bloco nascem vazios de propósito: o mínimo
  // que o aluno precisa dizer é a disciplina. Tempo, alvo e horário entram só
  // se ele quiser — e o formulário não pergunta antes qual deles ele "vai
  // usar", que era exatamente a escolha vazia dos dois botões antigos.
  const [hora, setHora] = useState("");
  const [duracao, setDuracao] = useState<number>(SEM_VALOR);
  const [quantidade, setQuantidade] = useState<number>(SEM_VALOR);
  // Os assuntos do bloco. Ficam num cache por matéria porque trocar de
  // disciplina e voltar é comum enquanto se planeja, e recarregar a mesma
  // lista a cada ida e volta seria um round-trip por clique.
  const [topicosPorMateria, setTopicosPorMateria] = useState<Record<string, TopicoPratica[]>>({});
  const [carregandoTopicos, setCarregandoTopicos] = useState(false);
  const [topicosSel, setTopicosSel] = useState<string[]>([]);
  const [nomeProva, setNomeProva] = useState("P1");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const reservado = minutosReservados(itens);
  const semDisciplinas = subjects.length === 0;

  // Estudo e prova são sempre DE uma disciplina — no estudo porque é ela que
  // diz de onde saem as questões quando o aluno clica em "Começar". Só a
  // tarefa pode ser solta, e por isso é o único modo com a opção vazia. O
  // ponto colorido é o mesmo `corDaDisciplina` do resto do app: a disciplina
  // tem UMA cor em qualquer tela.
  const opcoesDisciplina = useMemo(
    () => [
      ...(modo === "tarefa" ? [{ value: "", label: "Sem disciplina" }] : []),
      ...subjects.map((s) => ({ value: s.id, label: s.nome, cor: corDaDisciplina(s.nome).de })),
    ],
    [modo, subjects],
  );

  const materiaAtual = subjects.find((s) => s.id === subjectId)?.materiaId ?? null;
  const listaTopicos = materiaAtual ? topicosPorMateria[materiaAtual] : undefined;

  /** Busca os assuntos da disciplina — por evento, nunca num efeito: o efeito
   *  precisaria escrever estado no render seguinte (o compilador do React 19
   *  recusa) e dispararia também quando o formulário nem está aberto. */
  async function carregarTopicos(idSubject: string) {
    const materiaId = subjects.find((s) => s.id === idSubject)?.materiaId;
    if (!materiaId || topicosPorMateria[materiaId]) return;
    setCarregandoTopicos(true);
    try {
      const lista = await buscarTopicosPraticaAction(materiaId);
      setTopicosPorMateria((prev) => ({ ...prev, [materiaId]: lista }));
    } catch (e) {
      console.error("Falha ao carregar os assuntos da disciplina:", e);
    }
    setCarregandoTopicos(false);
  }

  // Trocar de disciplina zera a escolha: assunto de Cálculo não existe em
  // Física, e manter a seleção antiga só produziria um bloco que não sorteia
  // nada.
  function escolherDisciplina(v: string) {
    setSubjectId(v);
    setTopicosSel([]);
    if (v) void carregarTopicos(v);
  }

  function abrir(m: Modo) {
    setErro(null);
    setModo(m);
    // Estudo e prova exigem disciplina: já deixa a primeira escolhida pra que
    // o caminho feliz seja "escolher a matéria → salvar".
    const alvo = subjectId || subjects[0]?.id || "";
    if (m !== "tarefa" && !subjectId && alvo) setSubjectId(alvo);
    if (m === "estudo" && alvo) void carregarTopicos(alvo);
  }

  function fechar() {
    setModo(null);
    setNome("");
    setTopicosSel([]);
    setErro(null);
  }

  // O `finally` não é zelo decorativo: quando a Server Action falhava, a
  // promise REJEITAVA e o `setSalvando(false)` que existia no fim de cada
  // caminho nunca rodava — o botão ficava "Salvando..." pra sempre, sem erro
  // na tela, e não havia como o aluno saber que o pedido tinha morrido. Um
  // reset num caminho só é um reset que um dia não acontece.
  async function salvar() {
    if (salvando || !modo) return;
    setSalvando(true);
    setErro(null);

    try {
      if (modo === "prova") {
        const msg = await onMarcarProva(subjectId, nomeProva.trim() || "Prova");
        if (msg) setErro(msg);
        else fechar();
        return;
      }

      const estudo = modo === "estudo";
      const disciplina = subjects.find((s) => s.id === subjectId);
      // O bloco não exige título: se o aluno não escrever nada, ele se chama
      // pelo que já foi escolhido ("Estudar Cálculo II"). Obrigá-lo a digitar
      // isso seria pedir que repita o campo de cima. O que ele escreve, por
      // outro lado, é guardado e segue com ele até o cartão de progresso da
      // home — é o nome DELE pro estudo, não o da disciplina.
      const titulo = nome.trim() || (estudo ? `Estudar ${disciplina?.nome || "hoje"}` : "");
      if (!titulo || (estudo && (!subjectId || topicosSel.length === 0))) return;

      const ok = await onAdicionar({
        nome: titulo,
        descricao: null,
        subjectId: subjectId || null,
        data,
        tipo: estudo ? "sessao" : "tarefa",
        hora: estudo && hora ? hora : null,
        duracaoMin: estudo && duracao ? duracao : null,
        metaQuestoes: estudo && quantidade ? quantidade : null,
        topicoIds: estudo ? topicosSel : undefined,
      });
      if (ok) fechar();
      else setErro("Não foi possível salvar. Tente de novo.");
    } catch (e) {
      console.error("Falha ao salvar item da agenda:", e);
      setErro("Não deu pra falar com o servidor. Confira a conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  const tituloForm: Record<Modo, string> = {
    estudo: "Novo bloco de estudo",
    tarefa: "Nova tarefa",
    prova: "Marcar prova",
  };
  const rotuloSalvar: Record<Modo, string> = {
    estudo: "Marcar estudo",
    tarefa: "Adicionar tarefa",
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
              // Só o bloco de HOJE oferece "Começar": a lista nasce com a data
              // de hoje (`missions.data`), então começar terça o bloco de
              // sexta gravaria o estudo no dia errado e furaria a contagem do
              // próprio calendário.
              podeIniciar={data === hoje && ehEstudo(t) && !t.concluida}
              onIniciar={() => onIniciarEstudo(t.id)}
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
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-2.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    modo === "prova"
                      ? "bg-questly-orange-light text-questly-orange-dark"
                      : "bg-questly-green-light text-questly-green-dark dark:text-questly-green"
                  }`}
                >
                  {ICONE_FORM[modo]}
                </span>
                <span className="min-w-0 flex-1 truncate font-heading text-[13.5px] font-semibold tracking-tight">
                  {tituloForm[modo]}
                </span>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar"
                  className="-mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>

              {modo !== "prova" && (
                <Campo
                  rotulo={modo === "estudo" ? "O que você vai estudar (opcional)" : "O que precisa fazer"}
                >
                  <input
                    autoFocus
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void salvar();
                    }}
                    placeholder={modo === "estudo" ? "Ex.: Revisar derivadas" : "Ex.: Entregar lista 3"}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-[13px] font-medium outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground hover:border-questly-green/45 focus:border-questly-green focus:ring-[3px] focus:ring-questly-green/25"
                  />
                </Campo>
              )}

              <Campo rotulo="Disciplina">
                <Select
                  value={subjectId}
                  onValueChange={escolherDisciplina}
                  opcoes={opcoesDisciplina}
                  aria-label="Disciplina"
                  placeholder="Escolha uma disciplina"
                />
              </Campo>

              {modo === "estudo" && (
                <>
                  {/* O QUE estudar vem antes de quanto: o bloco existe porque
                      a aula de ontem foi sobre alguma coisa. Sem esta escolha,
                      "Começar" sorteava a disciplina inteira e devolvia
                      integral pra quem marcou o bloco por regra da cadeia. */}
                  <Campo rotulo="Assuntos">
                    <SeletorAssuntos
                      topicos={listaTopicos}
                      carregando={carregandoTopicos}
                      selecionados={topicosSel}
                      onAlternar={(id) =>
                        setTopicosSel((prev) =>
                          prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
                        )
                      }
                      onTodos={() => setTopicosSel((listaTopicos || []).map((t) => t.id))}
                      onLimpar={() => setTopicosSel([])}
                    />
                  </Campo>

                  <Campo rotulo="Quanto tempo">
                    <Chips
                      valores={DURACOES}
                      ativo={duracao}
                      onEscolher={setDuracao}
                      rotulo={(v) => (v === SEM_VALOR ? "—" : fmtDuracao(v))}
                    />
                  </Campo>

                  <Campo rotulo="Alvo de questões">
                    <Chips
                      valores={QUANTIDADES}
                      ativo={quantidade}
                      onEscolher={setQuantidade}
                      rotulo={(q) => (q === SEM_VALOR ? "—" : String(q))}
                    />
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11.5px] font-medium text-muted-foreground">Ou</span>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={quantidade || ""}
                        placeholder="—"
                        onChange={(e) =>
                          setQuantidade(Math.max(0, Math.min(500, Number(e.target.value) || 0)))
                        }
                        aria-label="Alvo de questões"
                        className="tnum w-[72px] rounded-xl border border-input bg-background px-2.5 py-1.5 text-[13px] font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-questly-green/45 focus:border-questly-green focus:ring-[3px] focus:ring-questly-green/25"
                      />
                      <span className="text-[11.5px] font-medium text-muted-foreground">questões</span>
                    </div>
                  </Campo>

                  <Campo rotulo="Começa às (opcional)">
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="tnum w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-[13px] font-medium text-foreground outline-none transition-colors hover:border-questly-green/45 focus:border-questly-green focus:ring-[3px] focus:ring-questly-green/25"
                    />
                  </Campo>

                  {/* Os três campos acima são o TAMANHO do estudo, e nenhum é
                      obrigatório: o alvo é o que vira lista com um clique, o
                      tempo é o que o mês soma como reservado, e o horário é o
                      que põe o bloco na ordem do dia. */}
                  <Nota>
                    {quantidade > 0
                      ? "O alvo conta sozinho: toda questão que você responder nessa disciplina nesse dia entra nele."
                      : "No dia, o botão “Começar” monta a lista com os assuntos escolhidos — aqui ou na tela inicial."}
                  </Nota>
                </>
              )}

              {modo === "prova" && (
                <Campo rotulo="Qual prova">
                  <SegmentedControl>
                    {NOMES_PROVA.map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={nomeProva === n}
                        onClick={() => setNomeProva(n)}
                        className={`flex-1 cursor-pointer rounded-[9px] px-1 py-1.5 text-[11.5px] font-bold transition-all ${
                          nomeProva === n
                            ? "bg-questly-orange-dark text-white shadow-xs dark:text-[#1a1206]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </SegmentedControl>
                  <input
                    value={nomeProva}
                    onChange={(e) => setNomeProva(e.target.value)}
                    placeholder="Nome da prova"
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-[13px] font-medium outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground hover:border-questly-orange/45 focus:border-questly-orange focus:ring-[3px] focus:ring-questly-orange/25"
                  />
                  <Nota>
                    A prova entra na trilha e na contagem regressiva da disciplina — não é só uma marca no
                    calendário.
                  </Nota>
                </Campo>
              )}

              {erro && (
                <p
                  role="alert"
                  className="rounded-xl border border-questly-red/35 bg-questly-red-light px-2.5 py-2 text-[11.5px] font-medium leading-relaxed text-questly-red-dark"
                >
                  {erro}
                </p>
              )}

              <button
                type="button"
                onClick={salvar}
                disabled={
                  salvando ||
                  (modo === "tarefa" && !nome.trim()) ||
                  (modo === "estudo" && (!subjectId || topicosSel.length === 0))
                }
                className={`mt-0.5 min-h-[42px] cursor-pointer rounded-xl px-3 text-[13px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
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
            className="flex flex-col gap-2"
          >
            {/* O bloco de estudo ocupa a linha inteira porque é o que o aluno
                vem fazer aqui nove vezes em dez; tarefa e prova dividem a de
                baixo. Antes eram quatro botões do mesmo tamanho, e dois deles
                ("Sessão" e "Meta") queriam dizer a mesma coisa. */}
            <BotaoAdicionar
              icone={<BookOpen size={14} strokeWidth={2.4} />}
              rotulo="Estudo"
              primario
              desabilitado={semDisciplinas}
              onClick={() => abrir("estudo")}
            />
            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {semDisciplinas && !modo && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Estudo e prova precisam de uma disciplina — adicione as suas em Ajustes.
        </p>
      )}

      {/* Dia futuro não tem histórico pra mostrar — só plano. */}
      {data <= hoje && <HistoricoDoDia historico={historico} />}
    </div>
  );
}

// ------------------------------------------------------- histórico do dia

/**
 * O que o aluno REALMENTE fez nesse dia, embaixo do que ele planejou fazer.
 *
 * As duas metades do painel não são a mesma coisa e por isso não se misturam:
 * acima, o que está marcado (e dá pra editar); aqui, o registro do que
 * aconteceu — leitura pura, sem checkbox nem excluir. Nada disto é digitado:
 * vem das missões, das tentativas e dos simulados daquele dia.
 */
function HistoricoDoDia({ historico }: { historico: HistoricoDia | null }) {
  const missoes = historico?.missoes ?? [];
  const simulados = historico?.simulados ?? [];
  const questoes = historico?.questoes ?? 0;
  const acertos = historico?.acertos ?? 0;
  const xp = historico?.xp ?? 0;
  const vazio = missoes.length === 0 && simulados.length === 0;

  return (
    <section className="mt-4 border-t border-border pt-3.5">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-heading text-[12.5px] font-semibold tracking-tight">O que você fez</h3>
        {questoes > 0 && (
          <p className="tnum text-[11px] font-medium text-muted-foreground">
            {questoes} {questoes === 1 ? "questão" : "questões"} ·{" "}
            <span className="font-bold text-foreground">{Math.round((acertos / questoes) * 100)}%</span>
            {xp > 0 && ` · +${xp} XP`}
          </p>
        )}
      </div>

      {vazio ? (
        <p className="rounded-xl bg-muted/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Nada registrado nesse dia. Listas e simulados aparecem aqui assim que você responde a
          primeira questão.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {simulados.map((s) => (
            <LinhaSimulado key={s.id} simulado={s} />
          ))}
          {missoes.map((m) => (
            <LinhaMissao key={m.id} missao={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Verde ≥ 7, laranja ≥ 5, vermelho abaixo — a mesma régua de aprovação que o
 *  aluno usa na faculdade, não um gradiente inventado. */
function tomDaNota(nota: number): { texto: string; fundo: string } {
  if (nota >= 7)
    return {
      texto: "text-questly-green-dark dark:text-questly-green",
      fundo: "bg-questly-green-light",
    };
  if (nota >= 5) return { texto: "text-questly-orange-dark", fundo: "bg-questly-orange-light" };
  return { texto: "text-questly-red-dark", fundo: "bg-questly-red-light" };
}

function LinhaSimulado({ simulado }: { simulado: SimuladoDia }) {
  const concluido = simulado.status === "concluido" && simulado.nota != null;
  const tom = concluido ? tomDaNota(simulado.nota as number) : null;
  const minutos = simulado.tempoGastoSeg ? Math.max(1, Math.round(simulado.tempoGastoSeg / 60)) : null;

  const detalhe = concluido
    ? [
        simulado.total ? `${simulado.acertos ?? 0}/${simulado.total} acertos` : null,
        minutos ? fmtDuracao(minutos) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : simulado.status === "em_andamento"
      ? "Em andamento"
      : "Abandonado";

  return (
    <li>
      <Link
        href={`/simulados/${simulado.id}`}
        className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2 transition-colors hover:border-questly-green/45"
      >
        <span
          className={`tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${
            tom ? `${tom.fundo} ${tom.texto}` : "bg-muted text-muted-foreground"
          }`}
        >
          {concluido ? (simulado.nota as number).toFixed(1) : <FileText size={14} strokeWidth={2.3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold leading-tight">
            {simulado.titulo}
          </span>
          <span className="tnum mt-0.5 block truncate text-[10.5px] font-medium text-muted-foreground">
            Simulado{detalhe && ` · ${detalhe}`}
          </span>
        </span>
        {/* O gabarito é a razão de o simulado aparecer aqui: o aluno volta pra
            ver o que errou, não pra reler a nota. */}
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-questly-green-dark transition-transform group-hover:translate-x-0.5 dark:text-questly-green">
          {concluido ? "Revisar" : "Abrir"}
          <ChevronRight size={13} strokeWidth={2.6} />
        </span>
      </Link>
    </li>
  );
}

function LinhaMissao({ missao }: { missao: MissaoDia }) {
  const nome = missao.subjectNome || "Prática livre";
  const cor = corDaDisciplina(nome).de;
  const pendente = !missao.concluida && missao.respondidas < missao.alvo;

  // A lista em andamento fala de PROGRESSO; o acerto só entra quando ela
  // fechou. Sem isso a linha ainda disputa espaço com o "Continuar" e é o
  // número útil que acaba cortado.
  const detalhe = [
    "Lista de questões",
    missao.alvo > 0 ? `${missao.respondidas}/${missao.alvo} questões` : null,
    missao.concluida && missao.respondidas > 0
      ? `${missao.acertos} ${missao.acertos === 1 ? "acerto" : "acertos"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const conteudo = (
    <>
      <span
        className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border-2 ${
          missao.concluida ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]" : "border-border"
        }`}
      >
        {missao.concluida && <Check size={10} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold leading-tight">{nome}</span>
        <span className="tnum mt-0.5 block truncate text-[10.5px] font-medium text-muted-foreground">
          {detalhe}
        </span>
      </span>
      {pendente && (
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-questly-green-dark transition-transform group-hover:translate-x-0.5 dark:text-questly-green">
          Continuar
          <ChevronRight size={13} strokeWidth={2.6} />
        </span>
      )}
    </>
  );

  const classe = "flex items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2";
  const faixa = { borderLeft: `3px solid ${cor}` };

  return (
    <li>
      {/* Missão fechada não vira link: não há tela de revisão de missão, e um
          link que reabre as questões respondidas confundiria com "refazer". */}
      {pendente ? (
        <Link
          href={hrefQuestao(missao.id, "/calendario")}
          style={faixa}
          className={`group ${classe} transition-colors hover:border-questly-green/45`}
        >
          {conteudo}
        </Link>
      ) : (
        <div style={faixa} className={classe}>
          {conteudo}
        </div>
      )}
    </li>
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

/** Rótulo + campo. Antes cada linha do formulário se explicava sozinha (ou
 *  não se explicava): um `<select>` cru sem rótulo, um `<label>` com o texto
 *  colado no input, chips sem título nenhum. Um rótulo só, sempre no mesmo
 *  lugar e no mesmo tamanho, é o que faz as quatro linhas lerem como um
 *  formulário em vez de uma pilha de controles. */
function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {rotulo}
      </span>
      {children}
    </label>
  );
}

/** Observação de rodapé do formulário — nunca um erro, sempre contexto. */
function Nota({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-muted/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

/** Trilho de escolha única. Os botões soltos de antes flutuavam sobre o fundo
 *  do cartão sem nada que os amarrasse — dava pra ler como quatro botões
 *  independentes, e não como "escolha um destes". O trilho afundado resolve
 *  isso e é o padrão que o resto do app já usa pra alternar visão. */
function SegmentedControl({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-0.5 rounded-xl border border-border bg-muted/70 p-1">{children}</div>
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
    <SegmentedControl>
      {valores.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={ativo === v}
          onClick={() => onEscolher(v)}
          className={`tnum flex-1 cursor-pointer rounded-[9px] px-1 py-1.5 text-[11.5px] font-bold transition-all ${
            ativo === v
              ? "bg-questly-green text-white shadow-xs dark:text-[#0c1512]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {rotulo(v)}
        </button>
      ))}
    </SegmentedControl>
  );
}

/**
 * A escolha do que entra no bloco. É um multi-seleção simples de propósito:
 * a mesma tela já tem disciplina, tempo, alvo e horário, e um combobox com
 * busca aqui viraria o quinto controle diferente do mesmo formulário.
 *
 * Mostra a contagem de questões por assunto porque é a informação que muda a
 * escolha: marcar um tópico com 4 questões e pedir 30 é o jeito silencioso de
 * receber uma lista que não fecha.
 *
 * "Todos" existe e não é o padrão: estudar a disciplina inteira é uma decisão
 * legítima, só não pode ser a que acontece quando ninguém decidiu nada.
 */
function SeletorAssuntos({
  topicos,
  carregando,
  selecionados,
  onAlternar,
  onTodos,
  onLimpar,
}: {
  topicos: TopicoPratica[] | undefined;
  carregando: boolean;
  selecionados: string[];
  onAlternar: (id: string) => void;
  onTodos: () => void;
  onLimpar: () => void;
}) {
  if (carregando && !topicos) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-muted/70 px-2.5 py-2.5 text-[11.5px] font-medium text-muted-foreground">
        <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
        Carregando os assuntos...
      </p>
    );
  }

  if (!topicos || topicos.length === 0) {
    return (
      <p className="rounded-xl bg-muted/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Nenhum assunto dessa disciplina tem questão no banco ainda.
      </p>
    );
  }

  const escolhidos = topicos.filter((t) => selecionados.includes(t.id));
  const questoes = escolhidos.reduce((acc, t) => acc + t.totalQuestoes, 0);

  return (
    <div className="rounded-xl border border-input bg-background">
      <div className="flex items-center gap-2 border-b border-border px-2.5 py-1.5">
        <span className="tnum min-w-0 flex-1 truncate text-[11px] font-semibold text-muted-foreground">
          {escolhidos.length === 0
            ? "Escolha pelo menos um"
            : `${escolhidos.length} de ${topicos.length} · ${questoes} questões`}
        </span>
        <button
          type="button"
          onClick={escolhidos.length === topicos.length ? onLimpar : onTodos}
          className="shrink-0 cursor-pointer text-[11px] font-bold text-questly-green-dark transition-opacity hover:opacity-75 dark:text-questly-green"
        >
          {escolhidos.length === topicos.length ? "Limpar" : "Todos"}
        </button>
      </div>

      <ul className="rolagem-limpa max-h-[186px] overflow-y-auto p-1">
        {topicos.map((t) => {
          const marcado = selecionados.includes(t.id);
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onAlternar(t.id)}
                aria-pressed={marcado}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors ${
                  marcado ? "bg-questly-green-light" : "hover:bg-muted/70"
                }`}
              >
                <span
                  className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    marcado
                      ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                      : "border-border"
                  }`}
                >
                  {marcado && <Check size={9} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{t.nome}</span>
                <span className="tnum shrink-0 text-[10.5px] font-semibold text-muted-foreground">
                  {t.totalQuestoes}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------- item do dia

function ItemDia({
  item,
  feitas,
  podeIniciar,
  onAlternar,
  onRemover,
  onAdiar,
  onIniciar,
  onDragStart,
}: {
  item: TarefaRow;
  feitas: number;
  podeIniciar: boolean;
  onAlternar: () => void;
  onRemover: () => void;
  onAdiar: () => void;
  onIniciar: () => Promise<string | null>;
  onDragStart: () => void;
}) {
  const router = useRouter();
  const [iniciando, setIniciando] = useState(false);
  const cor = corDoItem(item);
  const alvo = item.metaQuestoes || 0;
  // O alvo é lido pelo CAMPO, não pelo `tipo`: desde que sessão e meta viraram
  // o mesmo bloco, um item com horário também pode ter alvo de questões.
  const temAlvo = alvo > 0;
  const pct = temAlvo ? Math.min(100, Math.round((feitas / alvo) * 100)) : 0;
  const batida = temAlvo && feitas >= alvo;

  async function comecar() {
    if (iniciando) return;
    setIniciando(true);
    try {
      const href = await onIniciar();
      if (href) router.push(href);
      else setIniciando(false);
    } catch (e) {
      console.error("Falha ao começar o bloco de estudo:", e);
      setIniciando(false);
    }
  }

  const detalhe =
    [
      item.hora || null,
      item.duracaoMin ? fmtDuracao(item.duracaoMin) : null,
      item.subjectNome,
      // Quantos assuntos o bloco vai sortear. É o que separa "Estudar Cálculo"
      // (a lista ruim de antes) de um bloco que sabe o que cobra.
      item.topicoIds.length > 0
        ? `${item.topicoIds.length} ${item.topicoIds.length === 1 ? "assunto" : "assuntos"}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || (ehEstudo(item) ? "Bloco de estudo" : "Tarefa");

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

        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground">
          {ehEstudo(item) ? (
            <BookOpen size={9} strokeWidth={2.4} />
          ) : (
            <ListTodo size={9} strokeWidth={2.4} />
          )}
          <span className="tnum truncate">{detalhe}</span>
        </span>

        {/* O alvo mostra o que JÁ FOI FEITO, não o que foi prometido: o número
            vem das questões respondidas naquele dia nessa disciplina. */}
        {temAlvo && (
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
              {batida ? "Alvo batido" : `Faltam ${alvo - feitas} questões`}
            </span>
          </>
        )}

        {/* O caminho do plano pra execução. Já existe lista? o botão continua
            ela. Ainda não? ele monta uma da disciplina do bloco. Fora do dia
            de hoje não aparece nenhum dos dois. */}
        {podeIniciar &&
          (item.missionId ? (
            <Link
              href={hrefQuestao(item.missionId, "/calendario")}
              className="mt-1.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-questly-green-light px-2.5 text-[11.5px] font-bold text-questly-green-dark transition-colors hover:brightness-95 dark:text-questly-green"
            >
              <Play size={11} strokeWidth={2.6} fill="currentColor" />
              Continuar lista
            </Link>
          ) : (
            <button
              type="button"
              onClick={comecar}
              disabled={iniciando}
              className="mt-1.5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-questly-green px-2.5 text-[11.5px] font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#0c1512]"
            >
              <Play size={11} strokeWidth={2.6} fill="currentColor" />
              {iniciando ? "Montando lista..." : "Começar"}
            </button>
          ))}
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
