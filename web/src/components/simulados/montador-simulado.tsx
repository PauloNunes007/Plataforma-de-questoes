"use client";

// Montador de simulado. A tela responde a uma pergunta só — "que prova eu vou
// fazer agora?" — e por isso é dividida em DECISÃO (esquerda) e CONSEQUÊNCIA
// (direita, o painel "Sua prova", grudado na tela).
//
// Três regras que valem pra tudo aqui:
//  1. nenhum número é chutado: a contagem de questões disponíveis sai do índice
//     `grade` (dificuldade → ano → nº) que veio do banco, então mexer num
//     filtro responde AO VIVO sem ida ao servidor e sem estimativa;
//  2. o aproveitamento do aluno aparece ao lado do conteúdo, porque escolher o
//     que cai sem saber onde se erra é escolher no escuro — e onde não há
//     amostra o campo fica vazio em vez de mostrar 0%;
//  3. o servidor revalida tudo (montarSimuladoAction): os controles daqui são
//     conveniência, nunca autoridade.

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarRange,
  Check,
  ChevronDown,
  Clock,
  Gauge,
  Layers,
  Loader2,
  PlayCircle,
  Shuffle,
  SignalHigh,
  Target,
  Timer,
  TrendingDown,
  Zap,
} from "lucide-react";
import type { MateriaSimulado, OpcoesSimulado } from "@/lib/simulados/simulados-data";
import {
  CHAVES_DIFICULDADE,
  ROTULO_DIFICULDADE_SIMULADO,
  SIMULADO_DURACOES_MIN,
  SIMULADO_DURACAO_PADRAO_MIN,
  SIMULADO_QTD_MAX,
  SIMULADO_QTD_MIN,
  SIMULADO_QTD_PADRAO,
  contarNaGrade,
  rotuloDuracao,
  type ChaveDificuldade,
  type EstrategiaSimulado,
  type OrdemSimulado,
} from "@/lib/simulados/constantes";
import { montarSimuladoAction } from "@/lib/simulados/actions";

const ERROS: Record<string, string> = {
  limite: "Você já usou seu simulado grátis desta semana. Assine o Pro pra montar quantos quiser.",
  sem_instituicao: "Não encontramos provas da sua universidade pra montar o simulado.",
  sem_questoes: "Não há questões suficientes no recorte escolhido. Solte um filtro ou marque mais tópicos.",
  invalido: "Não foi possível montar o simulado. Revise as opções e tente de novo.",
};

/** Rampa de um tom só pra dificuldade: escala ordenada, não semáforo. */
const COR_DIFICULDADE: Record<ChaveDificuldade, string> = {
  facil: "color-mix(in oklab, var(--color-questly-green) 40%, var(--card))",
  medio: "var(--color-questly-green)",
  dificil: "var(--color-questly-green-deep)",
  outra: "color-mix(in oklab, var(--color-muted-foreground) 45%, var(--card))",
};

/** Faixa de conforto de ritmo, em minutos por questão. */
const RITMO_APERTADO = 1.5;
const RITMO_FOLGADO = 8;

type Preset = {
  id: string;
  nome: string;
  descricao: string;
  icone: React.ReactNode;
  duracao: number;
  quantidade: number;
  estrategia: EstrategiaSimulado;
  ordem: OrdemSimulado;
  /** quantos anos recentes o preset marca (0 = todos) */
  anosRecentes?: number;
  /** marca automaticamente os tópicos fracos do aluno */
  focarFracos?: boolean;
};

const PRESETS: Preset[] = [
  {
    id: "prova",
    nome: "Prova completa",
    descricao: "20 questões em 2h — o formato da prova de verdade.",
    icone: <Target size={16} strokeWidth={2.2} />,
    duracao: 120,
    quantidade: 20,
    estrategia: "aleatoria",
    ordem: "aleatoria",
  },
  {
    id: "rapida",
    nome: "Revisão rápida",
    descricao: "10 questões em 30min, pra medir a temperatura.",
    icone: <Zap size={16} strokeWidth={2.2} />,
    duracao: 30,
    quantidade: 10,
    estrategia: "aleatoria",
    ordem: "crescente",
  },
  {
    id: "fracos",
    nome: "Meus pontos fracos",
    descricao: "Concentra a prova onde seu aproveitamento é menor.",
    icone: <TrendingDown size={16} strokeWidth={2.2} />,
    duracao: 60,
    quantidade: 15,
    estrategia: "fracos",
    ordem: "aleatoria",
    focarFracos: true,
  },
  {
    id: "recentes",
    nome: "Anos recentes",
    descricao: "Só as provas mais novas — o estilo atual da banca.",
    icone: <CalendarRange size={16} strokeWidth={2.2} />,
    duracao: 90,
    quantidade: 20,
    estrategia: "recentes",
    ordem: "aleatoria",
    anosRecentes: 3,
  },
];

const ESTRATEGIA_INFO: Record<EstrategiaSimulado, { nome: string; ajuda: string; icone: React.ReactNode }> = {
  aleatoria: {
    nome: "Sorteio livre",
    ajuda: "Anos e tópicos misturados por igual, como cair na prova.",
    icone: <Shuffle size={14} strokeWidth={2.2} />,
  },
  fracos: {
    nome: "Onde eu erro mais",
    ajuda: "Reparte as questões entre os tópicos proporcionalmente ao quanto você erra neles.",
    icone: <TrendingDown size={14} strokeWidth={2.2} />,
  },
  recentes: {
    nome: "Mais recentes",
    ajuda: "Puxa dos anos mais novos primeiro, descendo conforme precisar completar.",
    icone: <CalendarRange size={14} strokeWidth={2.2} />,
  },
};

const LIMIAR_FRACO = 70;

export function MontadorSimulado({ opcoes }: { opcoes: OpcoesSimulado }) {
  const router = useRouter();

  const [topicosSel, setTopicosSel] = useState<Set<string>>(new Set());
  const [difsSel, setDifsSel] = useState<Set<ChaveDificuldade>>(new Set());
  const [anosSel, setAnosSel] = useState<Set<number>>(new Set());
  const [duracao, setDuracao] = useState<number>(SIMULADO_DURACAO_PADRAO_MIN);
  const [quantidade, setQuantidade] = useState<number>(SIMULADO_QTD_PADRAO);
  const [estrategia, setEstrategia] = useState<EstrategiaSimulado>("aleatoria");
  const [ordem, setOrdem] = useState<OrdemSimulado>("aleatoria");
  const [presetAtivo, setPresetAtivo] = useState<string | null>(null);
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const difsArr = useMemo(() => [...difsSel], [difsSel]);
  const anosArr = useMemo(() => [...anosSel], [anosSel]);

  /** Só existe "focar nos fracos" se houver aproveitamento medido em algum tópico. */
  const temMedicao = useMemo(
    () => opcoes.materias.some((m) => m.topicos.some((t) => t.aproveitamento != null)),
    [opcoes.materias],
  );

  // Disponibilidade por tópico no recorte atual de dificuldade/ano.
  const disponivelPorTopico = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const m of opcoes.materias) {
      for (const t of m.topicos) mapa.set(t.id, contarNaGrade(t.grade, difsArr, anosArr));
    }
    return mapa;
  }, [opcoes.materias, difsArr, anosArr]);

  const selecao = useMemo(() => {
    let disponiveis = 0;
    const materiaIds: string[] = [];
    const materiaNomes: string[] = [];
    const composicao: Record<ChaveDificuldade, number> = { facil: 0, medio: 0, dificil: 0, outra: 0 };
    const anosCobertos = new Set<number>();

    for (const m of opcoes.materias) {
      let algum = false;
      for (const t of m.topicos) {
        if (!topicosSel.has(t.id)) continue;
        algum = true;
        disponiveis += disponivelPorTopico.get(t.id) || 0;
        for (const d of CHAVES_DIFICULDADE) {
          composicao[d] += contarNaGrade(t.grade, [d], anosArr);
          for (const [ano, n] of Object.entries(t.grade[d])) {
            if (n > 0 && ano !== "0" && (anosSel.size === 0 || anosSel.has(Number(ano)))) {
              anosCobertos.add(Number(ano));
            }
          }
        }
      }
      if (algum) {
        materiaIds.push(m.id);
        materiaNomes.push(m.nome);
      }
    }
    return { disponiveis, materiaIds, materiaNomes, composicao, anosCobertos: [...anosCobertos].sort((a, b) => b - a) };
  }, [opcoes.materias, topicosSel, disponivelPorTopico, anosArr, anosSel]);

  // Composição do banco pra alimentar os contadores dos chips de dificuldade:
  // usa a seleção quando existe, e o escopo inteiro antes da primeira escolha
  // (assim os números nunca aparecem zerados na entrada da tela).
  const contagemPorDificuldade = useMemo(() => {
    const alvo = topicosSel.size > 0 ? topicosSel : null;
    const saida: Record<ChaveDificuldade, number> = { facil: 0, medio: 0, dificil: 0, outra: 0 };
    for (const m of opcoes.materias) {
      for (const t of m.topicos) {
        if (alvo && !alvo.has(t.id)) continue;
        for (const d of CHAVES_DIFICULDADE) saida[d] += contarNaGrade(t.grade, [d], anosArr);
      }
    }
    return saida;
  }, [opcoes.materias, topicosSel, anosArr]);

  const contagemPorAno = useMemo(() => {
    const alvo = topicosSel.size > 0 ? topicosSel : null;
    const saida = new Map<number, number>();
    for (const m of opcoes.materias) {
      for (const t of m.topicos) {
        if (alvo && !alvo.has(t.id)) continue;
        for (const d of difsArr.length > 0 ? difsArr : CHAVES_DIFICULDADE) {
          for (const [ano, n] of Object.entries(t.grade[d])) {
            if (ano === "0") continue;
            saida.set(Number(ano), (saida.get(Number(ano)) || 0) + n);
          }
        }
      }
    }
    return saida;
  }, [opcoes.materias, topicosSel, difsArr]);

  const tetoQtd = Math.min(SIMULADO_QTD_MAX, selecao.disponiveis);
  const qtdEfetiva = Math.max(SIMULADO_QTD_MIN, Math.min(quantidade, Math.max(SIMULADO_QTD_MIN, tetoQtd)));
  const minPorQuestao = qtdEfetiva > 0 ? duracao / qtdEfetiva : 0;
  const podeIniciar = topicosSel.size > 0 && selecao.disponiveis >= SIMULADO_QTD_MIN && !enviando;

  const desmarcarPreset = useCallback(() => setPresetAtivo(null), []);

  function alternarTopico(id: string) {
    setErro(null);
    desmarcarPreset();
    setTopicosSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function alternarMateria(materia: MateriaSimulado) {
    setErro(null);
    desmarcarPreset();
    const disponiveis = materia.topicos.filter((t) => (disponivelPorTopico.get(t.id) || 0) > 0);
    const alvo = disponiveis.length > 0 ? disponiveis : materia.topicos;
    const todosMarcados = alvo.every((t) => topicosSel.has(t.id));
    setTopicosSel((prev) => {
      const n = new Set(prev);
      for (const t of alvo) {
        if (todosMarcados) n.delete(t.id);
        else n.add(t.id);
      }
      return n;
    });
  }

  function alternarDificuldade(d: ChaveDificuldade) {
    setErro(null);
    desmarcarPreset();
    setDifsSel((prev) => {
      const n = new Set(prev);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });
  }

  function alternarAno(ano: number) {
    setErro(null);
    desmarcarPreset();
    setAnosSel((prev) => {
      const n = new Set(prev);
      if (n.has(ano)) n.delete(ano);
      else n.add(ano);
      return n;
    });
  }

  function aplicarPreset(p: Preset) {
    setErro(null);
    setPresetAtivo(p.id);
    setDuracao(p.duracao);
    setQuantidade(p.quantidade);
    setEstrategia(p.estrategia);
    setOrdem(p.ordem);
    setDifsSel(new Set());
    setAnosSel(p.anosRecentes ? new Set(opcoes.anos.slice(0, p.anosRecentes)) : new Set());

    if (p.focarFracos) {
      const fracos = opcoes.materias.flatMap((m) =>
        m.topicos.filter((t) => t.aproveitamento != null && t.aproveitamento < LIMIAR_FRACO).map((t) => t.id),
      );
      // Sem medição não há "fraco" — mantém o que o aluno já escolheu em vez
      // de esvaziar a seleção dele e deixar a tela sem prova nenhuma.
      if (fracos.length > 0) setTopicosSel(new Set(fracos));
      return;
    }
    // Os demais presets são sobre RITMO, não sobre conteúdo: se o aluno já
    // escolheu o que quer estudar, isso é preservado; só a primeira vez marca
    // tudo, pra tela nunca ficar sem escopo depois de um clique.
    if (topicosSel.size === 0) {
      setTopicosSel(new Set(opcoes.materias.flatMap((m) => m.topicos.map((t) => t.id))));
    }
  }

  async function iniciar() {
    if (!podeIniciar) return;
    setEnviando(true);
    setErro(null);
    const r = await montarSimuladoAction({
      topicIds: [...topicosSel],
      materiaIds: selecao.materiaIds,
      materiaNomes: selecao.materiaNomes,
      duracaoMin: duracao,
      quantidade: qtdEfetiva,
      dificuldades: difsArr,
      anos: anosArr,
      estrategia,
      ordem,
    });
    if (r.ok) router.push(`/simulados/${r.id}`);
    else {
      setErro(ERROS[r.erro] ?? ERROS.invalido);
      setEnviando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 pb-32 lg:grid-cols-[minmax(0,1fr)_336px] lg:pb-0">
      <div className="flex min-w-0 flex-col gap-5">
        {/* ---------------------------------------------------------------- */}
        <Secao
          numero={1}
          titulo="Comece por um formato"
          descricao="Um clique ajusta tempo, quantidade e como as questões são sorteadas. Dá pra mexer em tudo depois."
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PRESETS.map((p) => {
              const bloqueado = Boolean(p.focarFracos) && !temMedicao;
              const ativo = presetAtivo === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => aplicarPreset(p)}
                  className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 ${
                    ativo
                      ? "border-questly-green bg-questly-green-light/60 shadow-sm"
                      : "border-border bg-card hover:border-questly-green/45 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      ativo
                        ? "bg-questly-green text-white dark:text-[#0c1512]"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {p.icone}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13.5px] font-bold">{p.nome}</span>
                      {ativo && <Check size={13} strokeWidth={3} className="text-questly-green-dark" />}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                      {bloqueado
                        ? "Precisa de questões respondidas nessas disciplinas pra saber onde você erra."
                        : p.descricao}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Secao>

        {/* ---------------------------------------------------------------- */}
        <Secao
          numero={2}
          titulo="O que cai na prova"
          descricao={`As questões saem de ${opcoes.nomeInstituicao}. Toque na disciplina pra marcá-la inteira, ou abra pra escolher tópico a tópico.`}
          acao={
            <div className="flex gap-1.5">
              <BotaoTexto
                onClick={() => {
                  desmarcarPreset();
                  setTopicosSel(new Set(opcoes.materias.flatMap((m) => m.topicos.map((t) => t.id))));
                }}
              >
                Marcar tudo
              </BotaoTexto>
              <BotaoTexto
                onClick={() => {
                  desmarcarPreset();
                  setTopicosSel(new Set());
                }}
              >
                Limpar
              </BotaoTexto>
            </div>
          }
        >
          <div className="flex flex-col gap-2.5">
            {opcoes.materias.map((m) => (
              <CartaoDisciplina
                key={m.id}
                materia={m}
                topicosSel={topicosSel}
                disponivelPorTopico={disponivelPorTopico}
                aberta={abertas.has(m.id)}
                onAbrir={() =>
                  setAbertas((prev) => {
                    const n = new Set(prev);
                    if (n.has(m.id)) n.delete(m.id);
                    else n.add(m.id);
                    return n;
                  })
                }
                onAlternarMateria={() => alternarMateria(m)}
                onAlternarTopico={alternarTopico}
              />
            ))}
          </div>
        </Secao>

        {/* ---------------------------------------------------------------- */}
        <Secao
          numero={3}
          titulo="As regras da sua prova"
          descricao="Tempo de relógio, tamanho e de onde as questões vêm."
        >
          <div className="flex flex-col gap-5">
            <Campo icone={<Clock size={14} />} rotulo="Duração" valor={rotuloDuracao(duracao)}>
              <div className="flex flex-wrap gap-1.5">
                {SIMULADO_DURACOES_MIN.map((min) => (
                  <Chip
                    key={min}
                    ativo={duracao === min}
                    onClick={() => {
                      desmarcarPreset();
                      setDuracao(min);
                    }}
                  >
                    {rotuloDuracao(min)}
                  </Chip>
                ))}
              </div>
            </Campo>

            <Campo
              icone={<Layers size={14} />}
              rotulo="Questões"
              valor={`${qtdEfetiva}${tetoQtd > 0 && quantidade > tetoQtd ? ` de ${quantidade} pedidas` : ""}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={SIMULADO_QTD_MIN}
                  max={Math.max(SIMULADO_QTD_MIN + 1, tetoQtd || SIMULADO_QTD_MAX)}
                  step={1}
                  value={Math.min(quantidade, tetoQtd || SIMULADO_QTD_MAX)}
                  onChange={(e) => {
                    desmarcarPreset();
                    setQuantidade(Number(e.target.value));
                  }}
                  aria-label="Quantidade de questões"
                  className="h-1.5 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-questly-green"
                />
                <input
                  type="number"
                  min={SIMULADO_QTD_MIN}
                  max={tetoQtd || SIMULADO_QTD_MAX}
                  value={quantidade}
                  onChange={(e) => {
                    desmarcarPreset();
                    setQuantidade(Number(e.target.value) || SIMULADO_QTD_MIN);
                  }}
                  aria-label="Quantidade de questões (número)"
                  className="tnum w-16 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-questly-green"
                />
              </div>
              {topicosSel.size > 0 && tetoQtd < SIMULADO_QTD_MAX && (
                <p className="mt-2 text-[11.5px] font-medium text-muted-foreground">
                  Seu recorte tem <b className="tnum text-foreground">{selecao.disponiveis}</b> questões — o teto
                  aqui é esse.
                </p>
              )}
            </Campo>

            <Campo
              icone={<SignalHigh size={14} />}
              rotulo="Dificuldade"
              valor={difsSel.size === 0 ? "Todas" : difsArr.map((d) => ROTULO_DIFICULDADE_SIMULADO[d]).join(", ")}
            >
              <div className="flex flex-wrap gap-1.5">
                <Chip ativo={difsSel.size === 0} onClick={() => { desmarcarPreset(); setDifsSel(new Set()); }}>
                  Todas
                </Chip>
                {CHAVES_DIFICULDADE.map((d) => {
                  const n = contagemPorDificuldade[d];
                  if (n === 0) return null;
                  return (
                    <Chip key={d} ativo={difsSel.has(d)} onClick={() => alternarDificuldade(d)}>
                      {ROTULO_DIFICULDADE_SIMULADO[d]}
                      <span className="tnum ml-1 opacity-60">{n}</span>
                    </Chip>
                  );
                })}
              </div>
            </Campo>

            {opcoes.anos.length > 0 && (
              <Campo
                icone={<CalendarRange size={14} />}
                rotulo="Anos"
                valor={anosSel.size === 0 ? "Todos" : `${anosSel.size} selecionado${anosSel.size > 1 ? "s" : ""}`}
              >
                <div className="flex flex-wrap gap-1.5">
                  <Chip ativo={anosSel.size === 0} onClick={() => { desmarcarPreset(); setAnosSel(new Set()); }}>
                    Todos
                  </Chip>
                  {opcoes.anos.map((ano) => {
                    const n = contagemPorAno.get(ano) || 0;
                    return (
                      <Chip key={ano} ativo={anosSel.has(ano)} onClick={() => alternarAno(ano)} desabilitado={n === 0}>
                        {ano}
                        <span className="tnum ml-1 opacity-60">{n}</span>
                      </Chip>
                    );
                  })}
                </div>
              </Campo>
            )}

            <Campo
              icone={<Gauge size={14} />}
              rotulo="Como sortear"
              valor={ESTRATEGIA_INFO[estrategia].nome}
            >
              <div className="flex flex-col gap-1.5">
                {(Object.keys(ESTRATEGIA_INFO) as EstrategiaSimulado[]).map((e) => {
                  const info = ESTRATEGIA_INFO[e];
                  const bloqueada = e === "fracos" && !temMedicao;
                  const ativa = estrategia === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      disabled={bloqueada}
                      onClick={() => {
                        desmarcarPreset();
                        setEstrategia(e);
                      }}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                        ativa ? "border-questly-green bg-questly-green-light/50" : "border-border hover:border-questly-green/40"
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 ${ativa ? "text-questly-green-dark" : "text-muted-foreground"}`}>
                        {info.icone}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold">{info.nome}</span>
                        <span className="block text-[11px] leading-snug text-muted-foreground">
                          {bloqueada ? "Disponível depois que você responder questões dessas disciplinas." : info.ajuda}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Campo>

            <Campo
              icone={<Shuffle size={14} />}
              rotulo="Ordem na prova"
              valor={ordem === "crescente" ? "Da mais fácil pra mais difícil" : "Embaralhada"}
            >
              <div className="flex flex-wrap gap-1.5">
                <Chip ativo={ordem === "aleatoria"} onClick={() => { desmarcarPreset(); setOrdem("aleatoria"); }}>
                  Embaralhada
                </Chip>
                <Chip ativo={ordem === "crescente"} onClick={() => { desmarcarPreset(); setOrdem("crescente"); }}>
                  Fácil → difícil
                </Chip>
              </div>
            </Campo>
          </div>
        </Secao>

        {erro && (
          <p className="flex items-start gap-2 rounded-xl border border-questly-red/40 bg-questly-red-light/60 px-4 py-3 text-sm font-medium text-questly-red-dark">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {erro}
          </p>
        )}
      </div>

      {/* Painel de consequência — grudado na tela no desktop, no fim do fluxo
          no mobile (onde a barra fixa embaixo carrega o essencial). */}
      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <ResumoProva
          instituicao={opcoes.nomeInstituicao}
          quantidade={qtdEfetiva}
          duracao={duracao}
          minPorQuestao={minPorQuestao}
          disponiveis={selecao.disponiveis}
          materiaNomes={selecao.materiaNomes}
          topicosCount={topicosSel.size}
          composicao={selecao.composicao}
          anosCobertos={selecao.anosCobertos}
          estrategia={estrategia}
          insuficiente={topicosSel.size > 0 && selecao.disponiveis < SIMULADO_QTD_MIN}
          podeIniciar={podeIniciar}
          enviando={enviando}
          onIniciar={iniciar}
        />
      </aside>

      {/* Barra fixa do mobile: o resumo mínimo + a ação. */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1000px] items-center gap-3 px-1">
          <div className="tnum min-w-0 flex-1 text-xs font-medium text-muted-foreground">
            <span className="font-bold text-foreground">{topicosSel.size > 0 ? qtdEfetiva : 0}</span> questões ·{" "}
            <span className="font-bold text-foreground">{rotuloDuracao(duracao)}</span>
            {topicosSel.size === 0 && <span className="block text-[11px]">Escolha ao menos um tópico</span>}
          </div>
          <button
            type="button"
            onClick={iniciar}
            disabled={!podeIniciar}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#0c1512]"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={17} />}
            {enviando ? "Montando…" : "Iniciar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel "Sua prova"
// ---------------------------------------------------------------------------

function ResumoProva({
  instituicao,
  quantidade,
  duracao,
  minPorQuestao,
  disponiveis,
  materiaNomes,
  topicosCount,
  composicao,
  anosCobertos,
  estrategia,
  insuficiente,
  podeIniciar,
  enviando,
  onIniciar,
}: {
  instituicao: string | null;
  quantidade: number;
  duracao: number;
  minPorQuestao: number;
  disponiveis: number;
  materiaNomes: string[];
  topicosCount: number;
  composicao: Record<ChaveDificuldade, number>;
  anosCobertos: number[];
  estrategia: EstrategiaSimulado;
  insuficiente: boolean;
  podeIniciar: boolean;
  enviando: boolean;
  onIniciar: () => void;
}) {
  const vazio = topicosCount === 0;
  const totalComposicao = CHAVES_DIFICULDADE.reduce((s, d) => s + composicao[d], 0);

  const ritmo =
    minPorQuestao === 0
      ? null
      : minPorQuestao < RITMO_APERTADO
        ? { tom: "atencao" as const, texto: "Ritmo apertado — menos de 1min30 por questão." }
        : minPorQuestao > RITMO_FOLGADO
          ? { tom: "neutro" as const, texto: "Sobra bastante tempo; dá pra encurtar o relógio." }
          : { tom: "bom" as const, texto: "Ritmo parecido com o de uma prova real." };

  return (
    <div className="surface-brand flex flex-col gap-4 rounded-2xl p-5">
      <div>
        <span className="kicker">Sua prova</span>
        <p className="mt-0.5 text-[13px] font-semibold leading-tight">
          {vazio ? "Nada escolhido ainda" : instituicao ? `Questões de ${instituicao}` : "Questões do seu banco"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <NumeroGrande valor={vazio ? "—" : String(quantidade)} rotulo="questões" icone={<Layers size={13} />} />
        <NumeroGrande valor={rotuloDuracao(duracao)} rotulo="de relógio" icone={<Timer size={13} />} />
      </div>

      {ritmo && !vazio && (
        <div
          className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[11.5px] font-medium leading-snug ${
            ritmo.tom === "atencao"
              ? "bg-questly-gold-light text-questly-gold-dark"
              : ritmo.tom === "bom"
                ? "bg-questly-green-light text-questly-green-dark"
                : "bg-muted text-muted-foreground"
          }`}
        >
          <Gauge size={13} className="mt-0.5 shrink-0" />
          <span>
            <b className="tnum">{minPorQuestao.toFixed(1)}min</b> por questão. {ritmo.texto}
          </span>
        </div>
      )}

      {vazio ? (
        <p className="rounded-xl bg-muted/60 px-3 py-4 text-center text-[12px] leading-relaxed text-muted-foreground">
          Marque pelo menos uma disciplina acima e o resumo da prova aparece aqui.
        </p>
      ) : (
        <>
          <LinhaResumo rotulo="Conteúdo">
            <div className="flex flex-wrap gap-1">
              {materiaNomes.slice(0, 3).map((n) => (
                <span
                  key={n}
                  className="max-w-full truncate rounded-md bg-questly-green-light px-1.5 py-0.5 text-[11px] font-semibold text-questly-green-dark"
                >
                  {n}
                </span>
              ))}
              {materiaNomes.length > 3 && (
                <span className="tnum rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  +{materiaNomes.length - 3}
                </span>
              )}
            </div>
            <p className="tnum mt-1 text-[11px] text-muted-foreground">
              {topicosCount} {topicosCount === 1 ? "tópico marcado" : "tópicos marcados"} ·{" "}
              {disponiveis.toLocaleString("pt-BR")} questões disponíveis
            </p>
          </LinhaResumo>

          {totalComposicao > 0 && (
            <LinhaResumo rotulo="Composição do recorte">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {CHAVES_DIFICULDADE.map((d) =>
                  composicao[d] > 0 ? (
                    <span
                      key={d}
                      title={`${ROTULO_DIFICULDADE_SIMULADO[d]}: ${composicao[d]}`}
                      style={{ width: `${(composicao[d] / totalComposicao) * 100}%`, background: COR_DIFICULDADE[d] }}
                    />
                  ) : null,
                )}
              </div>
              <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                {CHAVES_DIFICULDADE.map((d) =>
                  composicao[d] > 0 ? (
                    <li key={d} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ background: COR_DIFICULDADE[d] }}
                      />
                      {ROTULO_DIFICULDADE_SIMULADO[d]}
                      <span className="tnum opacity-70">{Math.round((composicao[d] / totalComposicao) * 100)}%</span>
                    </li>
                  ) : null,
                )}
              </ul>
            </LinhaResumo>
          )}

          {anosCobertos.length > 0 && (
            <LinhaResumo rotulo="Anos no sorteio">
              <p className="tnum text-[12px] font-semibold">
                {anosCobertos.length === 1
                  ? anosCobertos[0]
                  : `${anosCobertos[anosCobertos.length - 1]}–${anosCobertos[0]}`}
                <span className="ml-1.5 font-medium text-muted-foreground">
                  ({anosCobertos.length} {anosCobertos.length === 1 ? "ano" : "anos"})
                </span>
              </p>
            </LinhaResumo>
          )}

          <LinhaResumo rotulo="Sorteio">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold">
              <span className="text-questly-green-dark dark:text-questly-green">
                {ESTRATEGIA_INFO[estrategia].icone}
              </span>
              {ESTRATEGIA_INFO[estrategia].nome}
            </p>
          </LinhaResumo>
        </>
      )}

      {/* Botão desabilitado sem motivo é um beco sem saída: quando o recorte
          é pequeno demais, a tela diz o que fazer em vez de só apagar o CTA. */}
      {insuficiente && (
        <p className="flex items-start gap-2 rounded-xl bg-questly-gold-light px-3 py-2 text-[11.5px] font-medium leading-snug text-questly-gold-dark">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Um simulado precisa de pelo menos {SIMULADO_QTD_MIN} questões. Marque mais tópicos ou solte o filtro
          de dificuldade/ano.
        </p>
      )}

      <button
        type="button"
        onClick={onIniciar}
        disabled={!podeIniciar}
        className="hidden w-full items-center justify-center gap-2 rounded-xl bg-questly-green px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex dark:text-[#0c1512]"
      >
        {enviando ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={17} />}
        {enviando ? "Montando…" : "Iniciar simulado"}
      </button>

      <p className="hidden text-center text-[10.5px] leading-relaxed text-muted-foreground lg:block">
        O relógio começa a correr assim que a prova abre. Você pode sair e voltar — o tempo continua contando.
      </p>
    </div>
  );
}

function NumeroGrande({ valor, rotulo, icone }: { valor: string; rotulo: string; icone: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-2.5">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      <p className="tnum mt-0.5 font-heading text-[24px] font-bold leading-none">{valor}</p>
    </div>
  );
}

function LinhaResumo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3">
      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cartão de disciplina
// ---------------------------------------------------------------------------

function CartaoDisciplina({
  materia,
  topicosSel,
  disponivelPorTopico,
  aberta,
  onAbrir,
  onAlternarMateria,
  onAlternarTopico,
}: {
  materia: MateriaSimulado;
  topicosSel: Set<string>;
  disponivelPorTopico: Map<string, number>;
  aberta: boolean;
  onAbrir: () => void;
  onAlternarMateria: () => void;
  onAlternarTopico: (id: string) => void;
}) {
  const marcados = materia.topicos.filter((t) => topicosSel.has(t.id));
  const disponiveis = materia.topicos.reduce(
    (s, t) => s + (topicosSel.has(t.id) ? disponivelPorTopico.get(t.id) || 0 : 0),
    0,
  );
  const totalNoRecorte = materia.topicos.reduce((s, t) => s + (disponivelPorTopico.get(t.id) || 0), 0);
  const algum = marcados.length > 0;
  const todos = algum && marcados.length === materia.topicos.length;

  return (
    <div
      className={`rounded-xl border transition-colors ${
        algum ? "border-questly-green/60 bg-questly-green-light/25" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onAlternarMateria}
          aria-pressed={todos}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            aria-hidden
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              todos
                ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                : algum
                  ? "border-questly-green bg-questly-green/25"
                  : "border-border"
            }`}
          >
            {todos ? (
              <Check size={12} strokeWidth={3.5} />
            ) : algum ? (
              <span className="h-0.5 w-2.5 rounded-full bg-questly-green-dark" />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold leading-tight">{materia.nome}</span>
            <span className="tnum mt-0.5 block text-[11px] font-medium text-muted-foreground">
              {totalNoRecorte} questões · {materia.topicos.length}{" "}
              {materia.topicos.length === 1 ? "tópico" : "tópicos"}
              {algum && <> · {disponiveis} no seu recorte</>}
            </span>
          </span>
        </button>

        {materia.aproveitamento != null && <SeloAproveitamento pct={materia.aproveitamento} />}

        <button
          type="button"
          onClick={onAbrir}
          aria-expanded={aberta}
          aria-label={aberta ? `Fechar tópicos de ${materia.nome}` : `Abrir tópicos de ${materia.nome}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown size={16} className={`transition-transform ${aberta ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 border-t border-border/60 p-3">
              {materia.topicos.map((t) => {
                const sel = topicosSel.has(t.id);
                const disp = disponivelPorTopico.get(t.id) || 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onAlternarTopico(t.id)}
                    aria-pressed={sel}
                    className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                      disp === 0 ? "opacity-45" : ""
                    } ${
                      sel
                        ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                        : "border-border hover:border-questly-green/45"
                    }`}
                    title={
                      t.aproveitamento != null
                        ? `Seu aproveitamento neste tópico: ${t.aproveitamento}% em ${t.respondidas} questões`
                        : "Você ainda não respondeu questões deste tópico"
                    }
                  >
                    {sel && <Check size={11} strokeWidth={3} />}
                    <span className="truncate">{t.nome}</span>
                    <span className="tnum opacity-65">{disp}</span>
                    {t.aproveitamento != null && (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: corAproveitamento(t.aproveitamento) }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {materia.topicos.some((t) => t.aproveitamento != null) && (
              <p className="px-3 pb-3 text-[10.5px] leading-relaxed text-muted-foreground">
                O ponto colorido é o seu aproveitamento no tópico — verde acima de {LIMIAR_FRACO}%, âmbar entre
                50 e {LIMIAR_FRACO}%, vermelho abaixo. Tópico sem ponto é tópico que você ainda não respondeu.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SeloAproveitamento({ pct }: { pct: number }) {
  const classe =
    pct >= LIMIAR_FRACO
      ? "bg-questly-green-light text-questly-green-dark"
      : pct >= 50
        ? "bg-questly-gold-light text-questly-gold-dark"
        : "bg-questly-red-light text-questly-red-dark";
  return (
    <span
      className={`tnum hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline ${classe}`}
      title="Seu aproveitamento nesta disciplina, somando o que você já respondeu no app"
    >
      {pct}%
    </span>
  );
}

function corAproveitamento(pct: number): string {
  if (pct >= LIMIAR_FRACO) return "var(--color-questly-green)";
  if (pct >= 50) return "var(--color-questly-gold)";
  return "var(--color-questly-red)";
}

// ---------------------------------------------------------------------------
// Primitivas locais
// ---------------------------------------------------------------------------

function Secao({
  numero,
  titulo,
  descricao,
  acao,
  children,
}: {
  numero: number;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-questly-green text-[11px] font-bold text-white dark:text-[#0c1512]">
              {numero}
            </span>
            <h2 className="text-[15px] font-bold tracking-tight">{titulo}</h2>
          </div>
          <p className="mt-1 pl-8 text-[12px] leading-relaxed text-muted-foreground">{descricao}</p>
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      <div className="sm:pl-8">{children}</div>
    </section>
  );
}

function Campo({
  icone,
  rotulo,
  valor,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {icone}
          {rotulo}
        </span>
        <span className="truncate text-[12px] font-semibold">{valor}</span>
      </div>
      {children}
    </div>
  );
}

function Chip({
  ativo,
  desabilitado = false,
  onClick,
  children,
}: {
  ativo: boolean;
  desabilitado?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={desabilitado}
      onClick={onClick}
      aria-pressed={ativo}
      className={`tnum rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        ativo
          ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
          : "border-border text-muted-foreground hover:border-questly-green/45 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function BotaoTexto({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
    >
      {children}
    </button>
  );
}
