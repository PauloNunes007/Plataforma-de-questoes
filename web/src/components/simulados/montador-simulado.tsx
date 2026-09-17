"use client";

// Montador de simulado — reescrito em 2026-09-10 a partir do feedback do dono:
// "ficou muito complicado de fazer, o que pode gerar preguiça no aluno".
//
// Três regras de produto, nesta ordem:
//  1. UMA disciplina por prova. Escolher "quais das minhas matérias entram"
//     era a decisão que mais travava o montador antigo — e não corresponde à
//     realidade: prova de graduação é de uma disciplina. A escolha do aluno é
//     QUAIS TÓPICOS daquela disciplina caem.
//  1b. (2026-09-16) A FONTE também é escolha dele: as provas da própria
//     universidade, as de outra, as questões autorais, ou uma mistura. Antes
//     a instituição vinha do perfil e quem não era de uma faculdade catalogada
//     não tinha simulado nenhum. Ao misturar, a prova é dividida em partes
//     IGUAIS entre as fontes (ver repartirEntreFontes) e o montador mostra a
//     divisão prevista antes de começar — misturar não pode virar "19 autorais
//     e 1 da UFF".
//  2. O caminho curto cabe em dois toques: tocar na disciplina já marca todos
//     os tópicos dela e propõe um formato pronto; "Começar" fica sempre à mão.
//  3. Ajuste fino (dificuldade, anos, focar no que eu erro mais) nasce FECHADO
//     atrás de "Mais opções" — quem não abrir nunca vê.
//
// O servidor (montarSimuladoAction) revalida tudo, inclusive a regra de uma
// disciplina só: os controles daqui são conveniência, nunca autoridade.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Layers,
  Library,
  Loader2,
  MonitorSmartphone,
  PlayCircle,
  Printer,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import type { FonteSimulado, MateriaSimulado, OpcoesSimulado } from "@/lib/simulados/simulados-data";
import {
  CHAVES_DIFICULDADE,
  ROTULO_DIFICULDADE_SIMULADO,
  SIMULADO_DURACOES_SUGERIDAS,
  SIMULADO_QTD_MAX,
  SIMULADO_QTD_MIN,
  SIMULADO_QTD_PADRAO,
  SIMULADO_QUANTIDADES,
  duracaoSugerida,
  rotuloDuracao,
  type ChaveDificuldade,
} from "@/lib/simulados/constantes";
import { contarNoTopico, repartirEntreFontes, rotuloDaDivisao } from "@/lib/simulados/fontes";
import { montarSimuladoAction } from "@/lib/simulados/actions";

const ERROS: Record<string, string> = {
  limite: "Você já usou seu simulado grátis desta semana. Assine o Pro pra montar quantos quiser.",
  sem_questoes:
    "Não há questões no recorte que você escolheu. Marque mais tópicos, ou inclua outra fonte de questões.",
  misturado: "Um simulado é de uma disciplina só. Escolha os tópicos de uma matéria.",
  invalido: "Não foi possível montar o simulado. Tente de novo.",
};

/** Abaixo disso o tópico aparece como ponto fraco do aluno. */
const LIMIAR_FRACO = 70;

export function MontadorSimulado({ opcoes }: { opcoes: OpcoesSimulado }) {
  const router = useRouter();
  const semMovimento = useReducedMotion();

  const [materiaId, setMateriaId] = useState<string | null>(null);
  const [fontesSel, setFontesSel] = useState<Set<string>>(new Set());
  const [topicosSel, setTopicosSel] = useState<Set<string>>(new Set());
  const [quantidade, setQuantidade] = useState<number>(SIMULADO_QTD_PADRAO);
  // Texto do campo livre, separado do número: enquanto o aluno digita "15" ele
  // passa por "1", e reagir a cada tecla faria a prova encolher pra 1 questão
  // no meio da digitação. O número vale quando é válido; o texto é o que ele vê.
  const [qtdTexto, setQtdTexto] = useState<string>(String(SIMULADO_QTD_PADRAO));
  const [duracao, setDuracao] = useState<number | null>(null); // null = seguir a sugestão
  const [difsSel, setDifsSel] = useState<Set<ChaveDificuldade>>(new Set());
  const [anosSel, setAnosSel] = useState<Set<number>>(new Set());
  const [focarFracos, setFocarFracos] = useState(false);
  // Onde a prova vai ser resolvida. É só o modo INICIAL da tela do simulado
  // (`?modo=cartao`) — nada disso vira coluna no banco, e o aluno troca depois
  // se mudar de ideia. Ver SimuladoRunner.
  const [noPapel, setNoPapel] = useState(false);
  const [avancadoAberto, setAvancadoAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const materia = useMemo(
    () => opcoes.materias.find((m) => m.id === materiaId) ?? null,
    [opcoes.materias, materiaId],
  );

  const difsArr = useMemo(() => [...difsSel], [difsSel]);
  const anosArr = useMemo(() => [...anosSel], [anosSel]);
  const fontesArr = useMemo(() => [...fontesSel], [fontesSel]);

  // As fontes que existem NESTA disciplina, na ordem em que o servidor as
  // devolveu (a do aluno primeiro, depois autorais, depois por tamanho).
  const fontesDaMateria = useMemo<FonteSimulado[]>(() => {
    if (!materia) return [];
    const daMateria = new Set(materia.fontes);
    return opcoes.fontes.filter((f) => daMateria.has(f.id));
  }, [opcoes.fontes, materia]);

  // Quantas questões cada tópico oferece no recorte atual (fonte/dificuldade/
  // ano). Sai do índice que veio do banco: nenhum número aqui é estimado.
  const disponivelPorTopico = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const t of materia?.topicos ?? []) mapa.set(t.id, contarNoTopico(t.porFonte, fontesArr, difsArr, anosArr));
    return mapa;
  }, [materia, fontesArr, difsArr, anosArr]);

  // Quanto cada fonte tem dentro do recorte de tópicos já marcado — é o número
  // do chip e a base da divisão prevista.
  const disponivelPorFonte = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const f of fontesDaMateria) {
      let n = 0;
      for (const t of materia?.topicos ?? []) {
        if (topicosSel.size > 0 && !topicosSel.has(t.id)) continue;
        n += contarNoTopico(t.porFonte, [f.id], difsArr, anosArr);
      }
      mapa.set(f.id, n);
    }
    return mapa;
  }, [fontesDaMateria, materia, topicosSel, difsArr, anosArr]);

  const disponiveis = useMemo(() => {
    let n = 0;
    for (const id of topicosSel) n += disponivelPorTopico.get(id) || 0;
    return n;
  }, [topicosSel, disponivelPorTopico]);

  const temMedicao = useMemo(() => (materia?.topicos ?? []).some((t) => t.aproveitamento != null), [materia]);

  const tetoQuantidade = Math.max(SIMULADO_QTD_MIN, Math.min(SIMULADO_QTD_MAX, disponiveis));
  const qtdEfetiva = Math.max(SIMULADO_QTD_MIN, Math.min(quantidade, tetoQuantidade));
  const duracaoEfetiva = duracao ?? duracaoSugerida(qtdEfetiva);
  const podeIniciar = topicosSel.size > 0 && fontesSel.size > 0 && disponiveis >= SIMULADO_QTD_MIN && !enviando;

  // A MESMA função que o servidor usa pra repartir — a prévia não pode ser uma
  // estimativa paralela que depois não bate com a prova entregue.
  const divisao = useMemo(() => {
    if (fontesSel.size < 2) return null;
    const cotas = repartirEntreFontes(
      new Map(fontesArr.map((id) => [id, disponivelPorFonte.get(id) || 0])),
      qtdEfetiva,
    );
    const partes = fontesDaMateria
      .filter((f) => fontesSel.has(f.id))
      .map((f) => ({ nome: f.autoral ? "autorais" : f.nome, questoes: cotas.get(f.id) || 0 }))
      .sort((a, b) => b.questoes - a.questoes);
    const rotulo = rotuloDaDivisao(partes);
    return rotulo ? rotulo : null;
  }, [fontesSel, fontesArr, fontesDaMateria, disponivelPorFonte, qtdEfetiva]);

  function escolherMateria(m: MateriaSimulado) {
    setErro(null);
    setMateriaId(m.id);
    // Marcar tudo na entrada é o que faz o caminho curto existir: quem só quer
    // uma prova da matéria não precisa tocar em mais nada.
    const comQuestao = m.topicos.filter((t) => t.questoes > 0);
    setTopicosSel(new Set((comQuestao.length > 0 ? comQuestao : m.topicos).map((t) => t.id)));
    setFontesSel(new Set(fontePadrao(m, opcoes.fontePropriaId)));
    setDifsSel(new Set());
    setAnosSel(new Set());
    setFocarFracos(false);
    setNoPapel(false);
    setAvancadoAberto(false);
    escolherQuantidade(SIMULADO_QTD_PADRAO);
    setDuracao(null);
  }

  // Desmarcar a última fonte deixaria a prova sem origem nenhuma: o toque na
  // única marcada não faz nada (em vez de virar um estado inválido silencioso).
  function alternarFonte(id: string) {
    setErro(null);
    setFontesSel((prev) => {
      if (prev.has(id) && prev.size === 1) return prev;
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function escolherQuantidade(q: number) {
    setQuantidade(q);
    setQtdTexto(String(q));
  }

  // O clamp fica no BLUR (e no qtdEfetiva), não a cada tecla: digitar 45 num
  // recorte de 30 questões deve mostrar 45 e virar 30 ao sair do campo, não
  // recusar o "4" antes do "5".
  function digitarQuantidade(texto: string) {
    const limpo = texto.replace(/[^0-9]/g, "").slice(0, 3);
    setQtdTexto(limpo);
    const n = Number(limpo);
    if (Number.isFinite(n) && n > 0) setQuantidade(n);
  }

  function alternarTopico(id: string) {
    setErro(null);
    setTopicosSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function iniciar() {
    if (!podeIniciar) return;
    setEnviando(true);
    setErro(null);
    const r = await montarSimuladoAction({
      topicIds: [...topicosSel],
      fontes: fontesArr,
      duracaoMin: duracaoEfetiva,
      quantidade: qtdEfetiva,
      dificuldades: difsArr,
      anos: anosArr,
      estrategia: focarFracos ? "fracos" : "aleatoria",
      ordem: "aleatoria",
    });
    if (r.ok) router.push(`/simulados/${r.id}${noPapel ? "?modo=cartao" : ""}`);
    else {
      setErro(ERROS[r.erro] ?? ERROS.invalido);
      setEnviando(false);
    }
  }

  const anim = semMovimento ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  // ------------------------------------------------------------------ passo 1
  if (!materia) {
    // Desde que a fonte deixou de ser a universidade do aluno, o passo 1 lista
    // o banco INTEIRO — dezenas de disciplinas onde antes havia meia dúzia.
    // Sem separar as dele, o caminho curto (tocar na disciplina e apertar
    // Começar) viraria uma caçada; com a separação, continua sendo o topo da
    // tela, e o resto fica disponível pra quem quiser treinar fora da grade.
    const minhas = opcoes.materias.filter((m) => m.minha);
    const outras = opcoes.materias.filter((m) => !m.minha);

    const cartao = (m: MateriaSimulado, i: number) => (
      <motion.button
        key={m.id}
        type="button"
        onClick={() => escolherMateria(m)}
        {...(semMovimento
          ? {}
          : {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: Math.min(i * 0.04, 0.24) },
            })}
        className="group surface-interativa flex min-h-[76px] items-center gap-3.5 p-4 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-green-light font-heading text-[15px] font-bold text-questly-green-dark">
          {iniciais(m.nome)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-bold">{m.nome}</span>
          <span className="tnum mt-0.5 block truncate text-[12px] font-medium text-muted-foreground">
            {m.questoes.toLocaleString("pt-BR")} questões · {resumoFontes(m, opcoes.fontes)}
          </span>
        </span>
        {m.aproveitamento != null && (
          <span className="tnum shrink-0 text-[12px] font-bold text-muted-foreground">{m.aproveitamento}%</span>
        )}
        <ArrowRight
          size={17}
          className="shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
        />
      </motion.button>
    );

    return (
      <div className="flex flex-col gap-4">
        <Passos atual={1} />
        <div>
          <h2 className="text-[15px] font-bold">Qual disciplina você vai simular?</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            Cada simulado é de uma disciplina só — como a prova de verdade.
          </p>
        </div>

        {minhas.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{minhas.map(cartao)}</div>
        )}

        {outras.length > 0 && (
          <>
            <span className="kicker">
              {minhas.length > 0 ? "Outras disciplinas do banco" : "Disciplinas do banco"}
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{outras.map(cartao)}</div>
          </>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ passo 2
  const topicos = materia.topicos;
  const marcados = topicos.filter((t) => topicosSel.has(t.id)).length;

  return (
    <div className="flex flex-col gap-4 pb-28 lg:pb-0">
      <Passos atual={2} />

      {/* disciplina escolhida + saída pra trocar */}
      <div className="surface flex items-center gap-3 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-questly-green-light font-heading text-[13px] font-bold text-questly-green-dark">
          {iniciais(materia.nome)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold">{materia.nome}</span>
          <span className="tnum block text-[11.5px] font-medium text-muted-foreground">
            {marcados} de {topicos.length} tópicos · {disponiveis.toLocaleString("pt-BR")} questões
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            setMateriaId(null);
            setTopicosSel(new Set());
            setErro(null);
          }}
          className="min-h-9 shrink-0 rounded-lg px-3 text-[12.5px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Trocar
        </button>
      </div>

      {/* --------------------------------------------------------- fontes */}
      <motion.section {...anim} className="surface p-4 sm:p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-bold">De onde saem as questões</h2>
          {fontesDaMateria.length > 1 && (
            <button
              type="button"
              onClick={() => setFontesSel(new Set(fontesDaMateria.map((f) => f.id)))}
              className="min-h-8 rounded-lg px-2 text-[12px] font-bold text-questly-green-dark transition-opacity hover:opacity-75 dark:text-questly-green"
            >
              Usar todas
            </button>
          )}
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">
          {fontesDaMateria.length > 1
            ? "Provas de universidade, questões autorais, ou as duas — marque quantas quiser."
            : "É daqui que as questões desta disciplina saem hoje."}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {fontesDaMateria.map((f) => {
            const n = disponivelPorFonte.get(f.id) || 0;
            return (
              <Chip key={f.id} ativo={fontesSel.has(f.id)} onClick={() => alternarFonte(f.id)}>
                <Library size={12} className="mr-1.5 opacity-70" />
                {f.nome}
                <span className="tnum ml-1.5 opacity-60">{n}</span>
                {f.propria && (
                  <span className="ml-1.5 rounded bg-questly-green/20 px-1 text-[10px] uppercase tracking-wide">
                    sua
                  </span>
                )}
              </Chip>
            );
          })}
        </div>

        {divisao && (
          <p className="tnum mt-2.5 text-[11.5px] font-medium text-muted-foreground">
            Divisão prevista: {divisao} — partes iguais entre as fontes, até onde cada uma tem questão.
          </p>
        )}
      </motion.section>

      {/* -------------------------------------------------------- tópicos */}
      <motion.section {...anim} className="surface p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-bold">O que cai na prova</h2>
          <button
            type="button"
            onClick={() =>
              setTopicosSel(topicosSel.size === topicos.length ? new Set() : new Set(topicos.map((t) => t.id)))
            }
            className="min-h-8 rounded-lg px-2 text-[12px] font-bold text-questly-green-dark transition-opacity hover:opacity-75 dark:text-questly-green"
          >
            {topicosSel.size === topicos.length ? "Limpar" : "Marcar tudo"}
          </button>
        </div>

        <ul className="flex flex-col">
          {topicos.map((t) => {
            const marcado = topicosSel.has(t.id);
            const n = disponivelPorTopico.get(t.id) || 0;
            const fraco = t.aproveitamento != null && t.aproveitamento < LIMIAR_FRACO;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={marcado}
                  onClick={() => alternarTopico(t.id)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted/60"
                >
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      marcado
                        ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                        : "border-input bg-background"
                    }`}
                  >
                    {marcado && <Check size={13} strokeWidth={3.2} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{t.nome}</span>
                  {t.aproveitamento != null && (
                    <span
                      className={`tnum shrink-0 text-[11.5px] font-bold ${
                        fraco ? "text-questly-red-dark" : "text-questly-green-dark dark:text-questly-green"
                      }`}
                      title={`Seu aproveitamento em ${t.nome}`}
                    >
                      {t.aproveitamento}%
                    </span>
                  )}
                  <span className="tnum w-9 shrink-0 text-right text-[11.5px] font-medium text-muted-foreground">
                    {n}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.section>

      {/* -------------------------------------------------------- formato */}
      <motion.section {...anim} className="surface p-4 sm:p-5">
        <h2 className="mb-3 text-[14px] font-bold">Formato da prova</h2>

        <Campo icone={<Layers size={13} />} rotulo="Questões">
          <div className="flex flex-wrap items-center gap-1.5">
            {SIMULADO_QUANTIDADES.filter((q) => q <= Math.max(SIMULADO_QTD_MIN, disponiveis)).map((q) => (
              <Chip key={q} ativo={qtdEfetiva === q} onClick={() => escolherQuantidade(q)}>
                {q}
              </Chip>
            ))}
            {disponiveis > SIMULADO_QTD_MIN && !(SIMULADO_QUANTIDADES as readonly number[]).includes(disponiveis) && (
              <Chip ativo={qtdEfetiva === disponiveis} onClick={() => escolherQuantidade(disponiveis)}>
                Todas ({disponiveis})
              </Chip>
            )}

            {/* Campo livre: os números acima são atalhos, não a lista de
                opções. Prova de faculdade com 4 ou 5 questões é comum, e antes
                disto o menor simulado possível era de 10. */}
            <label className="ml-0.5 inline-flex items-center gap-1.5 rounded-full border border-input px-2.5 py-1 focus-within:border-questly-green">
              <span className="text-[12px] font-medium text-muted-foreground">ou</span>
              <input
                type="number"
                inputMode="numeric"
                min={SIMULADO_QTD_MIN}
                max={tetoQuantidade}
                value={qtdTexto}
                onChange={(e) => digitarQuantidade(e.target.value)}
                onBlur={() => setQtdTexto(String(qtdEfetiva))}
                aria-label="Quantidade exata de questões"
                className="tnum w-11 bg-transparent text-center text-[13px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
          </div>
          <p className="tnum mt-2 text-[11.5px] font-medium text-muted-foreground">
            De {SIMULADO_QTD_MIN} a {tetoQuantidade} questões neste recorte.
          </p>
        </Campo>

        <Campo icone={<Clock size={13} />} rotulo="Tempo de relógio">
          <div className="flex flex-wrap gap-1.5">
            {SIMULADO_DURACOES_SUGERIDAS.map((min) => (
              <Chip key={min} ativo={duracaoEfetiva === min} onClick={() => setDuracao(min)}>
                {rotuloDuracao(min)}
              </Chip>
            ))}
          </div>
          <p className="tnum mt-2 text-[11.5px] font-medium text-muted-foreground">
            {(duracaoEfetiva / Math.max(1, qtdEfetiva)).toFixed(1).replace(".", ",")} min por questão
            {duracao == null && " · sugerido pelo tamanho da prova"}
          </p>
        </Campo>

        {/* O sorteio prefere questão inédita (ver `sortear` em actions.ts). Dizer
            isso aqui evita a leitura errada de que o app repete questão à toa —
            e explica por que a mesma configuração dá provas diferentes. */}
        <p className="mt-1 flex items-start gap-1.5 text-[11.5px] font-medium text-muted-foreground">
          <Sparkles size={12} className="mt-0.5 shrink-0 text-questly-green" />
          Questões que você ainda não respondeu vêm primeiro; as já vistas só entram se faltar.
        </p>
      </motion.section>

      {/* --------------------------------------------------- mais opções */}
      <div className="surface overflow-hidden">
        <button
          type="button"
          onClick={() => setAvancadoAberto((v) => !v)}
          aria-expanded={avancadoAberto}
          className="flex min-h-12 w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:px-5"
        >
          <SlidersHorizontal size={15} className="shrink-0 text-muted-foreground" />
          <span className="flex-1 text-[13.5px] font-bold">Mais opções</span>
          <span className="text-[11.5px] font-medium text-muted-foreground">
            {resumoAvancado(difsSel.size, anosSel.size, focarFracos)}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-muted-foreground transition-transform ${avancadoAberto ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {avancadoAberto && (
            <motion.div
              initial={semMovimento ? false : { height: 0, opacity: 0 }}
              animate={semMovimento ? {} : { height: "auto", opacity: 1 }}
              exit={semMovimento ? {} : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 py-4 sm:px-5">
                <Campo icone={<Layers size={13} />} rotulo="Dificuldade">
                  <div className="flex flex-wrap gap-1.5">
                    <Chip ativo={difsSel.size === 0} onClick={() => setDifsSel(new Set())}>
                      Todas
                    </Chip>
                    {CHAVES_DIFICULDADE.map((d) => {
                      const n = contarSelecao(materia, topicosSel, fontesArr, [d], anosArr);
                      if (n === 0) return null;
                      return (
                        <Chip
                          key={d}
                          ativo={difsSel.has(d)}
                          onClick={() =>
                            setDifsSel((prev) => {
                              const s = new Set(prev);
                              if (s.has(d)) s.delete(d);
                              else s.add(d);
                              return s;
                            })
                          }
                        >
                          {ROTULO_DIFICULDADE_SIMULADO[d]}
                          <span className="tnum ml-1 opacity-60">{n}</span>
                        </Chip>
                      );
                    })}
                  </div>
                </Campo>

                {opcoes.anos.length > 0 && (
                  <Campo icone={<Clock size={13} />} rotulo="Anos das provas">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip ativo={anosSel.size === 0} onClick={() => setAnosSel(new Set())}>
                        Todos
                      </Chip>
                      {opcoes.anos.map((ano) => {
                        const n = contarSelecao(materia, topicosSel, fontesArr, difsArr, [ano]);
                        if (n === 0) return null;
                        return (
                          <Chip
                            key={ano}
                            ativo={anosSel.has(ano)}
                            onClick={() =>
                              setAnosSel((prev) => {
                                const s = new Set(prev);
                                if (s.has(ano)) s.delete(ano);
                                else s.add(ano);
                                return s;
                              })
                            }
                          >
                            {ano}
                            <span className="tnum ml-1 opacity-60">{n}</span>
                          </Chip>
                        );
                      })}
                    </div>
                  </Campo>
                )}

                <button
                  type="button"
                  role="switch"
                  aria-checked={focarFracos}
                  disabled={!temMedicao}
                  onClick={() => setFocarFracos((v) => !v)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:border-questly-green/45 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <TrendingDown size={15} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold">Focar no que eu erro mais</span>
                    <span className="block text-[11.5px] leading-snug text-muted-foreground">
                      {temMedicao
                        ? "Distribui as questões entre os tópicos onde seu aproveitamento é menor."
                        : "Disponível depois que você responder questões desta disciplina."}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                      focarFracos ? "bg-questly-green" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                        focarFracos ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Onde resolver — a escolha do simulado híbrido, feita ANTES de começar
          (depois de iniciar, o relógio já está correndo e ir atrás da
          impressora custa prova). Impressão é do Pro; o gate real está no
          servidor, em /imprimir/simulado/[id], e quem não é Pro vê a oferta
          lá em vez de um botão que não faz nada aqui. */}
      <div>
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <Printer size={13} />
          Onde você vai resolver
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            {
              v: false,
              icone: <MonitorSmartphone size={15} />,
              titulo: "Na tela",
              ajuda: "Uma questão por vez, com o relógio correndo.",
            },
            {
              v: true,
              icone: <Printer size={15} />,
              titulo: "Imprimir e resolver no papel",
              ajuda: "PDF no layout da prova; o app vira o cartão-resposta.",
            },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setNoPapel(o.v)}
              aria-pressed={noPapel === o.v}
              className={`flex min-h-[64px] items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                noPapel === o.v
                  ? "border-questly-green bg-questly-green-light/60"
                  : "border-border hover:border-questly-green/45"
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 ${
                  noPapel === o.v ? "text-questly-green-dark" : "text-muted-foreground"
                }`}
              >
                {o.icone}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold">{o.titulo}</span>
                <span className="block text-[11.5px] leading-snug text-muted-foreground">{o.ajuda}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-questly-red/40 bg-questly-red-light/60 px-4 py-3 text-[13px] font-medium text-questly-red-dark"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {erro}
        </p>
      )}

      {topicosSel.size > 0 && disponiveis < SIMULADO_QTD_MIN && (
        <p className="rounded-xl bg-muted/70 px-4 py-3 text-[12.5px] font-medium text-muted-foreground">
          Esse recorte tem só {disponiveis}{" "}
          {disponiveis === 1 ? "questão disponível" : "questões disponíveis"} — marque mais tópicos, inclua
          outra fonte ou tire um filtro pra montar a prova.
        </p>
      )}

      {/* Ação primária: inline no desktop, barra fixa no celular. */}
      <div className="hidden lg:block">
        <BotaoIniciar
          qtd={qtdEfetiva}
          duracao={duracaoEfetiva}
          podeIniciar={podeIniciar}
          enviando={enviando}
          onIniciar={iniciar}
        />
      </div>
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-[760px]">
          <BotaoIniciar
            qtd={qtdEfetiva}
            duracao={duracaoEfetiva}
            podeIniciar={podeIniciar}
            enviando={enviando}
            onIniciar={iniciar}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function BotaoIniciar({
  qtd,
  duracao,
  podeIniciar,
  enviando,
  onIniciar,
}: {
  qtd: number;
  duracao: number;
  podeIniciar: boolean;
  enviando: boolean;
  onIniciar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onIniciar}
      disabled={!podeIniciar}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-questly-green px-5 text-[15px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#0c1512]"
    >
      {enviando ? <Loader2 size={17} className="animate-spin" /> : <PlayCircle size={18} />}
      {enviando ? "Montando…" : `Começar · ${qtd} questões em ${rotuloDuracao(duracao)}`}
    </button>
  );
}

function Passos({ atual }: { atual: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 text-[12px] font-bold" aria-label={`Etapa ${atual} de 2`}>
      {[
        { n: 1, rotulo: "Disciplina" },
        { n: 2, rotulo: "Prova" },
      ].map((p, i) => (
        <li key={p.n} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="h-px w-5 bg-border" />}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              atual === p.n
                ? "bg-questly-green-light text-questly-green-dark"
                : "text-muted-foreground"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                atual === p.n ? "bg-questly-green text-white dark:text-[#0c1512]" : "bg-border text-foreground/70"
              }`}
            >
              {atual > p.n ? <Check size={10} strokeWidth={3.5} /> : p.n}
            </span>
            {p.rotulo}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Campo({
  icone,
  rotulo,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      {children}
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-[12.5px] font-bold transition-colors ${
        ativo
          ? "border-questly-green bg-questly-green-light text-questly-green-dark"
          : "border-border bg-card text-muted-foreground hover:border-questly-green/45 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

/** Duas iniciais do nome da disciplina ("Física II" → "FI"). */
function iniciais(nome: string): string {
  const limpo = nome.trim();
  const palavras = limpo.split(/\s+/).filter((p) => /[a-zà-ú]/i.test(p));
  if (palavras.length >= 2) return (palavras[0][0] + palavras[1][0]).toUpperCase();
  return limpo.slice(0, 2).toUpperCase();
}

function contarSelecao(
  materia: MateriaSimulado,
  topicosSel: Set<string>,
  fontes: readonly string[],
  difs: readonly ChaveDificuldade[],
  anos: readonly number[],
): number {
  let n = 0;
  for (const t of materia.topicos) {
    if (topicosSel.size > 0 && !topicosSel.has(t.id)) continue;
    n += contarNoTopico(t.porFonte, fontes, difs, anos);
  }
  return n;
}

/**
 * Fontes marcadas quando o aluno entra numa disciplina.
 *
 * A da universidade dele quando ela sozinha dá uma prova de pé (>= o mínimo de
 * questões) — prova real da própria faculdade é o conteúdo mais valioso e era
 * o comportamento de antes desta tela ter fontes. Caso contrário, tudo: pra
 * quem não tem provas catalogadas (a maioria) o simulado precisa funcionar no
 * primeiro toque, sem ele ter que descobrir que existe um seletor.
 */
function fontePadrao(m: MateriaSimulado, fontePropriaId: string | null): string[] {
  if (fontePropriaId && m.fontes.includes(fontePropriaId)) {
    const propria = m.topicos.reduce((s, t) => s + contarNoTopico(t.porFonte, [fontePropriaId], [], []), 0);
    if (propria >= SIMULADO_QTD_MIN) return [fontePropriaId];
  }
  return m.fontes;
}

/** Linha de fontes do cartão da disciplina no passo 1 ("UFF · autorais"). */
function resumoFontes(m: MateriaSimulado, fontes: readonly FonteSimulado[]): string {
  const porId = new Map(fontes.map((f) => [f.id, f]));
  const nomes = m.fontes.map((id) => porId.get(id)?.nome).filter(Boolean) as string[];
  if (nomes.length === 0) return `${m.topicos.length} ${m.topicos.length === 1 ? "tópico" : "tópicos"}`;
  if (nomes.length <= 2) return nomes.join(" · ");
  return `${nomes.slice(0, 2).join(" · ")} +${nomes.length - 2}`;
}

function resumoAvancado(difs: number, anos: number, fracos: boolean): string {
  const partes: string[] = [];
  if (difs > 0) partes.push(difs === 1 ? "1 dificuldade" : `${difs} dificuldades`);
  if (anos > 0) partes.push(anos === 1 ? "1 ano" : `${anos} anos`);
  if (fracos) partes.push("pontos fracos");
  return partes.length > 0 ? partes.join(" · ") : "padrão";
}
