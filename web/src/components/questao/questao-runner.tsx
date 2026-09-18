"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  Crown,
  Dices,
  Dna,
  Dumbbell,
  Flame,
  FlaskConical,
  Globe,
  Landmark,
  Lightbulb,
  Lock,
  PartyPopper,
  Printer,
  Search,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import {
  FiguraQuestao,
  figurasDaPergunta,
  usePrefetchFiguras,
} from "@/components/questao/figura-questao";
import { QuestaoAcoes } from "@/components/questao/questao-acoes";
import { QuestaoComentarios } from "@/components/questao/questao-comentarios";
import { corDaDisciplina } from "@/lib/questao/disciplina-cor";
import {
  questlyDegrauCombo,
  questlyMultiplicadorCombo,
  questlyXpDaResposta,
} from "@/lib/questly/shared";
import { questlyMarcoAtingido, type MarcoDiario } from "@/lib/questly/marcos";
import { AVISO_RESTANTE, QUESTOES_DIA_FREE } from "@/lib/plano/limites";
import { ProMark } from "@/components/plano/pro-ui";
import { AvisoProLancamento } from "@/components/plano/aviso-pro-lancamento";
import { Insignia } from "@/components/insignias/insignia";
import {
  aceitarDesafioAction,
  classificarMotivoErroAction,
  finalizarMissaoAction,
  registrarRespostaAction,
  type FinalizarMissaoResultado,
} from "@/lib/questao/actions";
import {
  alternarFavoritoAction,
  salvarNotaAction,
} from "@/lib/anotacoes/actions";
import type { MissaoResumo, Pergunta } from "@/lib/questao/types";
import { hrefQuestao, rotuloOrigem } from "@/lib/questao/navegacao";

type EstadoPergunta = {
  selecionada: string | null;
  respondida: boolean;
  correta: boolean | null;
  riscadas: Set<string>;
  attemptId: string | null;
  motivoErro: string | null;
  xpConcedido: number;
  /** acertos seguidos NO MOMENTO desta resposta (0 se errou) */
  combo: number;
};

const MOTIVOS_ERRO = [
  { valor: "conceito", rotulo: "Não sabia o conceito", icone: BookOpen },
  { valor: "calculo", rotulo: "Errei a conta", icone: Calculator },
  { valor: "interpretacao", rotulo: "Interpretei errado", icone: Search },
  { valor: "chute", rotulo: "Chutei", icone: Dices },
];

// Componente estático (não uma variável de componente dinâmica) por causa da
// regra react-hooks/static-components do compilador do React 19 — ver
// web/CLAUDE.md: nada de `const Icone = mapa(nome)` + `<Icone/>` no render.
function IconeDisciplina({
  nome,
  className,
}: {
  nome: string | null;
  className?: string;
}) {
  const props = { size: 20, strokeWidth: 2, className };
  if (!nome) return <BookOpen {...props} />;
  if (/matemátic|cálculo|calculo|algebr|geometri/i.test(nome))
    return <Calculator {...props} />;
  if (/física|fisica|eletromag|mecânic|mecanic/i.test(nome))
    return <Atom {...props} />;
  if (/bio/i.test(nome)) return <Dna {...props} />;
  if (/quí?mic|quimic/i.test(nome)) return <FlaskConical {...props} />;
  if (/geografi/i.test(nome)) return <Globe {...props} />;
  if (/históri|historia|human|filosofi|sociologi/i.test(nome))
    return <Landmark {...props} />;
  return <BookOpen {...props} />;
}

function estadoInicial(): EstadoPergunta {
  return {
    selecionada: null,
    respondida: false,
    correta: null,
    riscadas: new Set(),
    attemptId: null,
    motivoErro: null,
    xpConcedido: 0,
    combo: 0,
  };
}

export function QuestaoRunner({
  missao,
  perguntas,
  jaAcertadasAntesIds,
  jaTentadasAntesIds,
  topicosMestreInicioIds,
  favoritosIniciaisIds,
  notasIniciais,
  ehPro,
  restanteHoje,
  voltarHref,
  disciplinaNome,
  ehAdmin,
}: {
  missao: MissaoResumo;
  perguntas: Pergunta[];
  jaAcertadasAntesIds: string[];
  jaTentadasAntesIds: string[];
  topicosMestreInicioIds: string[];
  favoritosIniciaisIds: string[];
  notasIniciais: Record<string, string>;
  ehPro: boolean;
  /** Questões que ainda cabem hoje no plano grátis. null = Pro (sem teto). */
  restanteHoje: number | null;
  /** Pra onde o "X" devolve o aluno (ver lib/questao/navegacao.ts). */
  voltarHref: string;
  disciplinaNome: string | null;
  ehAdmin: boolean;
}) {
  const router = useRouter();
  const [perguntasState, setPerguntasState] = useState(perguntas);
  const [estados, setEstados] = useState<EstadoPergunta[]>(() =>
    perguntas.map(estadoInicial),
  );
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [xpGanho, setXpGanho] = useState(0);
  const [view, setView] = useState<"questao" | "resultado">("questao");
  const [finalizando, setFinalizando] = useState(false);
  const [resultadoExtra, setResultadoExtra] =
    useState<FinalizarMissaoResultado | null>(null);
  const [tempoGastoMinMissao, setTempoGastoMinMissao] = useState(0);
  const [flash, setFlash] = useState<{
    tipo: "ok" | "bad";
    key: number;
  } | null>(null);
  const [xpFloat, setXpFloat] = useState<{
    xp: number;
    key: number;
    tipo: "ok" | "bad";
  } | null>(null);
  // Combo = acertos seguidos na sessão. Fica em state (e não só em ref)
  // porque a barra do topo mostra ele ao vivo.
  const [combo, setCombo] = useState(0);
  const [melhorCombo, setMelhorCombo] = useState(0);
  const [marco, setMarco] = useState<{
    marco: MarcoDiario;
    key: number;
  } | null>(null);
  const [desafioAceitando, setDesafioAceitando] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(
    new Set(favoritosIniciaisIds),
  );
  // Quanto sobrou do teto diário do plano grátis. Desce a cada resposta e é
  // RECONCILIADO com o número do servidor depois de cada registro — outra aba
  // aberta na mesma conta gasta do mesmo teto, e o cliente não teria como
  // saber disso sozinho.
  const [restante, setRestante] = useState<number | null>(restanteHoje);
  // Aviso curto de "não deu" pras ações da biblioteca (favorito/anotação).
  // Ganhou razão de existir com os tetos do plano grátis: bater no limite de
  // favoritos deixou de ser um erro raro de banco e virou caminho COMUM — e
  // até aqui a estrela só voltava sozinha, sem explicar nada, que é
  // exatamente a sensação de "o app quebrou".
  const [avisoBiblioteca, setAvisoBiblioteca] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>(notasIniciais);

  const jaAcertadasAntes = useRef(new Set(jaAcertadasAntesIds));
  const jaTentadasAntes = useRef(new Set(jaTentadasAntesIds));
  const comboRef = useRef(0);
  const topicosMestreInicio = useRef(new Set(topicosMestreInicioIds));
  const tempoInicioMissaoMs = useRef(0);
  const tempoInicioPergunta = useRef(new Map<number, number>());
  const correctBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    tempoInicioMissaoMs.current = Date.now();
  }, []);

  useEffect(() => {
    if (!tempoInicioPergunta.current.has(indiceAtual)) {
      tempoInicioPergunta.current.set(indiceAtual, Date.now());
    }
  }, [indiceAtual]);

  // Puxa as figuras das duas próximas questões enquanto o aluno responde esta —
  // é o que faz a imagem já estar pronta quando ele avança (ver figura-questao).
  usePrefetchFiguras(
    perguntasState
      .slice(indiceAtual, indiceAtual + 3)
      .flatMap((p) => figurasDaPergunta(p)),
  );

  const pergunta = perguntasState[indiceAtual];
  const estado = estados[indiceAtual];

  function atualizarEstado(indice: number, patch: Partial<EstadoPergunta>) {
    setEstados((prev) =>
      prev.map((e, i) => (i === indice ? { ...e, ...patch } : e)),
    );
  }

  function selecionarAlternativa(letra: string) {
    if (estado.respondida) return;
    atualizarEstado(indiceAtual, { selecionada: letra });
  }

  function toggleRiscar(letra: string) {
    if (estado.respondida) return;
    const riscadas = new Set(estado.riscadas);
    if (riscadas.has(letra)) riscadas.delete(letra);
    else riscadas.add(letra);
    atualizarEstado(indiceAtual, { riscadas });
  }

  async function confirmarResposta() {
    if (estado.respondida || !estado.selecionada) return;
    // Teto do dia estourado: nem tenta. A parede já está na tela (ver
    // `bateuOTeto` no render), isto só impede o atalho de teclado.
    if (restante !== null && restante <= 0) return;

    const correta = estado.selecionada === pergunta.gabarito;
    const inicio = tempoInicioPergunta.current.get(indiceAtual) ?? Date.now();
    const tempoSeg = Math.round((Date.now() - inicio) / 1000);

    // Combo: acerto avança a sequência, erro zera na hora.
    const acertosSeguidos = correta ? comboRef.current + 1 : 0;
    comboRef.current = acertosSeguidos;
    setCombo(acertosSeguidos);
    setMelhorCombo((m) => Math.max(m, acertosSeguidos));

    // Mesma função que o servidor usa pra recomputar o placar autoritativo
    // (lib/questao/actions.ts) — o número que sobe na tela é o que entra no
    // XP total. Errar também paga (consolação), desde que seja a primeira
    // vez que o aluno encara essa questão.
    const xpPergunta = questlyXpDaResposta({
      dificuldade: pergunta.dificuldade,
      correta,
      jaAcertouAntes: jaAcertadasAntes.current.has(pergunta.id),
      jaTentouAntes: jaTentadasAntes.current.has(pergunta.id),
      topicoMestre:
        !!pergunta.topic_id &&
        topicosMestreInicio.current.has(pergunta.topic_id),
      acertosSeguidos,
    });

    if (correta) setAcertos((a) => a + 1);
    else setErros((e) => e + 1);
    setXpGanho((x) => x + xpPergunta);
    jaTentadasAntes.current.add(pergunta.id);

    atualizarEstado(indiceAtual, {
      respondida: true,
      correta,
      xpConcedido: xpPergunta,
      combo: acertosSeguidos,
    });

    setFlash({ tipo: correta ? "ok" : "bad", key: Date.now() });
    if (xpPergunta > 0) {
      setXpFloat({
        xp: xpPergunta,
        key: Date.now(),
        tipo: correta ? "ok" : "bad",
      });
    }

    const resultado = await registrarRespostaAction({
      questionId: pergunta.id,
      topicId: pergunta.topic_id,
      missaoId: missao.id,
      correta,
      tempoSeg,
      respostaMarcada: estado.selecionada,
      tempoMedioAnterior: pergunta.tempo_medio_seg,
    });

    // O servidor recusou: o teto estourou entre o carregamento da lista e
    // agora (outra aba, ou a página ficou aberta desde ontem). Desfaz o que
    // foi pintado otimisticamente e levanta a parede — gravar nada e mostrar
    // "acertou!" seria a pior combinação possível.
    if (resultado.bloqueado) {
      atualizarEstado(indiceAtual, {
        respondida: false,
        correta: false,
        xpConcedido: 0,
        selecionada: estado.selecionada,
      });
      if (correta) setAcertos((a) => Math.max(0, a - 1));
      else setErros((e) => Math.max(0, e - 1));
      setXpGanho((x) => Math.max(0, x - xpPergunta));
      setRestante(0);
      return;
    }

    if (restanteHoje !== null) {
      setRestante(
        Math.max(0, QUESTOES_DIA_FREE - (resultado.questoesHoje ?? 0)),
      );
    }

    atualizarEstado(indiceAtual, { attemptId: resultado.attemptId });

    // Marco do dia (10/15/25/...): a contagem vem do servidor, então conta
    // questão respondida em QUALQUER missão de hoje, não só nesta sessão.
    const marcoAgora = questlyMarcoAtingido(resultado.questoesHoje ?? 0);
    if (marcoAgora) setMarco({ marco: marcoAgora, key: Date.now() });

    if (resultado.novoTempoMedio != null) {
      setPerguntasState((prev) =>
        prev.map((p, i) =>
          i === indiceAtual
            ? { ...p, tempo_medio_seg: resultado.novoTempoMedio! }
            : p,
        ),
      );
    }
  }

  async function classificarMotivo(motivo: string) {
    atualizarEstado(indiceAtual, { motivoErro: motivo });
    if (estado.attemptId) {
      await classificarMotivoErroAction(estado.attemptId, motivo);
    }
  }

  async function toggleFavorito() {
    const id = pergunta.id;
    const eraFavorito = favoritos.has(id);
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (eraFavorito) next.delete(id);
      else next.add(id);
      return next;
    });
    const resultado = await alternarFavoritoAction(id);
    if ("error" in resultado) {
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (eraFavorito) next.add(id);
        else next.delete(id);
        return next;
      });
      setAvisoBiblioteca(resultado.error);
    }
  }

  async function salvarNota(texto: string) {
    const id = pergunta.id;
    const anterior = notas[id] ?? "";
    setNotas((prev) => ({ ...prev, [id]: texto }));
    const resultado = await salvarNotaAction(id, texto);
    // Sem isto, uma anotação recusada pelo teto do plano continuava na tela
    // como se tivesse sido salva — e sumia no próximo carregamento. Mentir
    // sobre ter guardado é pior que recusar.
    if ("error" in resultado) {
      setNotas((prev) => ({ ...prev, [id]: anterior }));
      setAvisoBiblioteca(resultado.error);
    }
  }

  function navegarPara(indice: number) {
    if (indice < 0 || indice >= perguntasState.length) return;
    setIndiceAtual(indice);
  }

  async function handleProximo() {
    if (indiceAtual >= perguntasState.length - 1) {
      await finalizarMissao();
    } else {
      navegarPara(indiceAtual + 1);
    }
  }

  async function finalizarMissao() {
    setFinalizando(true);
    const tempoMin = Math.max(
      1,
      Math.round((Date.now() - tempoInicioMissaoMs.current) / 60000),
    );
    setTempoGastoMinMissao(tempoMin);

    const resultado = await finalizarMissaoAction({
      missaoId: missao.id,
      tempoGastoMinMissao: tempoMin,
      topicosMestreInicioIds: Array.from(topicosMestreInicio.current),
    });

    // O servidor é a autoridade: XP/acertos/erros são recomputados lá a partir
    // das tentativas reais. A tela de resultado mostra o que foi de fato
    // concedido (o placar local era só otimista/imediato).
    setAcertos(resultado.placar.acertos);
    setErros(resultado.placar.erros);
    setXpGanho(resultado.placar.xpGanho);
    setResultadoExtra(resultado);
    setFinalizando(false);
    setView("resultado");
  }

  async function aceitarDesafio() {
    if (!resultadoExtra?.desafio) return;
    setDesafioAceitando(true);
    const { missaoId } = await aceitarDesafioAction({
      subjectId: resultadoExtra.desafio.subjectId,
      topicoId: resultadoExtra.desafio.topicoId,
      questaoId: resultadoExtra.desafio.questaoId,
      tempoMedioSeg: resultadoExtra.desafio.tempoMedioSeg,
      dificuldade: resultadoExtra.desafio.dificuldade,
    });
    if (missaoId) {
      // O desafio herda a origem: encadear missões não pode ir apagando o
      // caminho de volta que o aluno trouxe.
      router.push(hrefQuestao(missaoId, voltarHref));
    } else {
      setDesafioAceitando(false);
    }
  }

  if (view === "resultado") {
    return (
      <ResultView
        acertos={acertos}
        erros={erros}
        xpGanho={xpGanho}
        melhorCombo={melhorCombo}
        tempoGastoMinMissao={tempoGastoMinMissao}
        tempoPrevistoMin={missao.tempo_previsto_min}
        resultadoExtra={resultadoExtra}
        desafioAceitando={desafioAceitando}
        onAceitarDesafio={aceitarDesafio}
        voltarHref={voltarHref}
      />
    );
  }

  // A parede do teto diário. Vem ANTES do render da questão porque a questão
  // seguinte não pode nem aparecer: mostrar o enunciado e recusar a resposta
  // seria gastar o conteúdo sem entregar o estudo.
  //
  // O aluno nunca fica preso: ele sempre pode ENCERRAR a lista e ficar com o
  // XP do que já respondeu. Um limite que sequestra o progresso do dia não
  // converte — irrita.
  const bateuOTeto = restante !== null && restante <= 0 && !estado.respondida;
  if (bateuOTeto) {
    return (
      <LimiteDiarioView
        respondidasNestaLista={estados.filter((e) => e.respondida).length}
        finalizando={finalizando}
        onEncerrar={finalizarMissao}
        voltarHref={voltarHref}
      />
    );
  }

  const letras = Object.keys(pergunta.alternativas || {}).sort();
  const imagensAlternativas = pergunta.alternativas_imagens || {};
  const progressoPct = ((indiceAtual + 1) / perguntasState.length) * 100;

  const nomeDisc = disciplinaNome ?? missao.subjectNome;
  const cor = corDaDisciplina(nomeDisc);

  return (
    <div className="casca-leitura relative flex min-h-screen flex-col py-4 sm:py-6">
      <FlashOverlay flash={flash} />
      <XpFloatOverlay xpFloat={xpFloat} anchorRef={correctBtnRef} />
      <MarcoOverlay marco={marco} onFechar={() => setMarco(null)} />
      <AvisoToast
        texto={avisoBiblioteca}
        onFechar={() => setAvisoBiblioteca(null)}
      />

      <div className="mb-6 flex items-center gap-3 sm:gap-4">
        <Link
          href={voltarHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={rotuloOrigem(voltarHref)}
          aria-label={rotuloOrigem(voltarHref)}
        >
          <X size={18} strokeWidth={2} />
        </Link>
        {/* Exportar esta lista em PDF (Pro). Fica AQUI porque é o único lugar
            em que o aluno está olhando exatamente a lista que ele quer no
            papel — e abre em outra aba pra não perder o que já respondeu. Quem
            não é Pro também vê o botão: a página de destino explica o recurso
            e vende (o gate real está no servidor, em /imprimir).
            Desde 2026-09-17 ele tem RÓTULO e aparece também no celular: como
            ícone mudo escondido em `sm:` era invisível justamente pra quem
            estava com a lista aberta querendo imprimi-la. */}
        <a
          href={`/imprimir/${missao.id}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Imprimir ou salvar esta lista em PDF"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
        >
          <Printer size={15} strokeWidth={2} />
          <span className="hidden sm:inline">Imprimir</span>
          <span className="sm:hidden">PDF</span>
        </a>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: cor.gradiente }}
            animate={{ width: `${progressoPct}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AnimatePresence>
            {combo >= 3 && (
              <motion.span
                key={combo}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 420, damping: 20 }}
                title={`${combo} acertos seguidos — XP em ${questlyMultiplicadorCombo(combo).toFixed(2).replace(".", ",")}x`}
                className="tnum inline-flex items-center gap-1 rounded-full bg-questly-orange-light px-2 py-0.5 text-[11px] font-bold text-questly-orange-dark sm:text-xs"
              >
                <Flame size={12} strokeWidth={2.4} />
                {combo} seguidos ·{" "}
                {questlyMultiplicadorCombo(combo).toString().replace(".", ",")}x
              </motion.span>
            )}
          </AnimatePresence>
          {/* Aviso do teto do plano grátis. Só aparece na reta final
              (AVISO_RESTANTE) — um contador presente o tempo todo
              transformaria cada questão numa cobrança. */}
          {restante !== null && restante <= AVISO_RESTANTE && (
            <Link
              href="/pro"
              title={`Plano grátis: ${QUESTOES_DIA_FREE} questões por dia`}
              className="tnum inline-flex items-center gap-1 rounded-full border border-questly-gold/35 bg-questly-gold/10 px-2 py-0.5 text-[11px] font-semibold text-questly-gold sm:text-xs"
            >
              {restante} {restante === 1 ? "restante hoje" : "restantes hoje"}
            </Link>
          )}
          <div className="tnum flex items-center gap-1 text-xs font-semibold text-questly-gold-dark sm:text-[13px]">
            <Zap size={13} strokeWidth={2} />+{xpGanho} XP
          </div>
        </div>
      </div>

      <div className="surface relative overflow-hidden rounded-2xl p-5 pt-0 sm:p-10 sm:pt-0">
        <div
          className="relative -mx-5 mb-6 flex items-center gap-3 overflow-hidden px-5 py-4 sm:-mx-10 sm:px-10 sm:py-5"
          style={{ background: cor.gradiente }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)",
            }}
          />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/25">
            <IconeDisciplina nome={nomeDisc} className="text-white" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
              Disciplina
            </div>
            <div className="truncate text-[15px] font-bold leading-tight text-white sm:text-base">
              {nomeDisc || "Prática livre"}
            </div>
          </div>
        </div>

        <div className="tnum kicker mb-2">
          Pergunta {indiceAtual + 1} de {perguntasState.length}
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {/* Selo de APROFUNDAMENTO (questions.desafio, ver
              supabase_questao_desafio.sql) — vem primeiro porque muda a
              leitura de todo o resto: é conteúdo além do nível da prova, e o
              aluno precisa saber disso ANTES de tentar. Não confundir com o
              "desafio de recuperação" oferecido no fim da missão. */}
          {pergunta.desafio && (
            <span className="rounded-full bg-questly-purple/12 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-questly-purple">
              Desafio · aprofundamento
            </span>
          )}
          {pergunta.dificuldade && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              {pergunta.dificuldade}
            </span>
          )}
          {pergunta.instituicao && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              {pergunta.instituicao}
              {pergunta.ano ? ` ${pergunta.ano}` : ""}
            </span>
          )}
          {pergunta.subtopico && (
            <span className="rounded-full bg-questly-blue-light px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-questly-blue-dark">
              {pergunta.subtopico}
            </span>
          )}
        </div>

        {pergunta.desafio && (
          <p className="mb-4 rounded-xl border border-questly-purple/20 bg-questly-purple/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Essa é uma questão de aprofundamento: ela vai além do que a prova
            costuma cobrar. Serve pra esticar o conteúdo — errar aqui não quer
            dizer que você não está pronto.
          </p>
        )}

        <QuestaoAcoes
          questionId={pergunta.id}
          resolucao={pergunta.resolucao}
          favoritado={favoritos.has(pergunta.id)}
          notaInicial={notas[pergunta.id] ?? null}
          onToggleFavorito={toggleFavorito}
          onSalvarNota={salvarNota}
        />

        {/* Com figura, ela vai AO LADO do enunciado a partir de xl: é o uso
            natural da largura que a casca abriu, e enunciado e figura passam
            a caber na mesma olhada (antes era rolar pra ver a imagem e rolar
            de volta pra reler o texto). Sem figura, uma coluna só, como
            sempre — e no celular também. */}
        <div
          className={
            pergunta.imagem_url
              ? "mb-7 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]"
              : "mb-7"
          }
        >
          <div className="text-[18px] font-medium leading-relaxed tracking-tight sm:text-[19px]">
            <MathText text={pergunta.enunciado} />
          </div>

          {pergunta.imagem_url && (
            <FiguraQuestao
              src={pergunta.imagem_url}
              alt="Imagem da questão"
              className="h-[280px] rounded-xl border border-border p-3 sm:h-[380px]"
            />
          )}
        </div>

        <div className="mb-7 flex flex-col gap-3">
          {letras.map((letra, i) => {
            const texto = pergunta.alternativas?.[letra] ?? "";
            const imgAlt = imagensAlternativas[letra];
            const riscada = estado.riscadas.has(letra);
            const selecionada =
              estado.selecionada === letra && !estado.respondida;
            const isCorreta = estado.respondida && letra === pergunta.gabarito;
            const isErrada =
              estado.respondida &&
              letra === estado.selecionada &&
              letra !== pergunta.gabarito;

            return (
              <motion.div
                key={letra}
                ref={isCorreta ? correctBtnRef : undefined}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: isErrada ? [0, -8, 7, -5, 3, 0] : 0,
                }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() =>
                  !estado.respondida && selecionarAlternativa(letra)
                }
                className={`relative flex min-h-[68px] cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-4 pr-13 transition-colors ${
                  estado.respondida
                    ? "cursor-default"
                    : "hover:border-questly-green/50"
                } ${
                  isCorreta
                    ? "border-questly-green/60 bg-questly-green-light"
                    : isErrada
                      ? "border-questly-red/60 bg-questly-red-light"
                      : selecionada
                        ? "border-questly-green/60 bg-questly-green-light/50"
                        : "border-border bg-card"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[14px] font-semibold transition-colors ${
                    isCorreta
                      ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                      : isErrada
                        ? "border-transparent bg-questly-red text-white dark:text-[#2b0a0a]"
                        : selecionada
                          ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                          : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {letra.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-[15.5px] font-normal leading-relaxed sm:text-[16px]">
                  {imgAlt && (
                    <FiguraQuestao
                      src={imgAlt}
                      alt={`Imagem da alternativa ${letra.toUpperCase()}`}
                      className="mb-2 h-[150px] w-full rounded-lg border border-border p-2"
                    />
                  )}
                  <MathText text={texto} />
                </span>
                {riscada && (
                  <motion.span
                    className="pointer-events-none absolute left-4 right-13 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-questly-red"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: "left center" }}
                    transition={{
                      duration: 0.28,
                      ease: [0.16, 0.9, 0.3, 1.05],
                    }}
                  />
                )}
                {!estado.respondida && (
                  <button
                    type="button"
                    title="Riscar alternativa"
                    aria-label={`Riscar alternativa ${letra.toUpperCase()}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleRiscar(letra);
                    }}
                    className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                      riscada
                        ? "bg-questly-red-light text-questly-red-dark"
                        : "text-muted-foreground/50 hover:bg-questly-red-light hover:text-questly-red-dark"
                    }`}
                  >
                    <X size={15} strokeWidth={2.25} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {!estado.respondida ? (
          <button
            type="button"
            disabled={!estado.selecionada}
            onClick={confirmarResposta}
            className="w-full cursor-pointer rounded-xl bg-questly-green px-6 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 dark:text-[#0c1512]"
          >
            Confirmar resposta
          </button>
        ) : (
          <FeedbackArea
            key={pergunta.id}
            pergunta={pergunta}
            estado={estado}
            onClassificarMotivo={classificarMotivo}
            ehPro={ehPro}
            ehAdmin={ehAdmin}
          />
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={indiceAtual === 0}
          onClick={() => navegarPara(indiceAtual - 1)}
          className="inline-flex w-[110px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 sm:w-[150px]"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Anterior
        </button>
        <button
          type="button"
          disabled={finalizando}
          onClick={handleProximo}
          /* O gradiente esmeralda cru (#10b981 → #047857) era o único verde do
             app fora dos tokens da marca: mais claro, mais saturado e — no
             botão que o aluno mais aperta — o brilho que mais cansava. Agora
             ele é a própria marca, do tom padrão ao "deep". */
          className="group relative inline-flex flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-all hover:shadow-xl hover:shadow-black/20 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:text-[#04120c]"
          style={{
            background:
              "linear-gradient(135deg, var(--questly-green), var(--questly-green-dark) 60%, var(--questly-green-deep))",
          }}
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {finalizando
            ? "Finalizando..."
            : indiceAtual < perguntasState.length - 1
              ? "Próxima"
              : "Finalizar missão"}
          {!finalizando && <ArrowRight size={15} strokeWidth={2.25} />}
        </button>
      </div>
    </div>
  );
}

function FeedbackArea({
  pergunta,
  estado,
  onClassificarMotivo,
  ehPro,
  ehAdmin,
}: {
  pergunta: Pergunta;
  estado: EstadoPergunta;
  onClassificarMotivo: (motivo: string) => void;
  ehPro: boolean;
  ehAdmin: boolean;
}) {
  const [mostrarResolucao, setMostrarResolucao] = useState(false);
  const degrauAtingido = estado.correta
    ? questlyDegrauCombo(estado.combo)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3.5 text-[14.5px] font-medium ${
          estado.correta
            ? "bg-questly-green-light text-questly-green-dark"
            : "bg-questly-red-light text-questly-red-dark"
        }`}
      >
        {estado.correta ? (
          <CheckCircle2 size={20} strokeWidth={2} className="shrink-0" />
        ) : (
          <XCircle size={20} strokeWidth={2} className="shrink-0" />
        )}
        <span className="min-w-0 flex-1">
          {estado.correta
            ? "Isso aí! Resposta certa."
            : `Não foi dessa vez — a certa era a ${pergunta.gabarito.toUpperCase()}.`}
        </span>
        {estado.xpConcedido > 0 && (
          <span
            className={`tnum inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-bold ${
              estado.correta
                ? "bg-questly-gold-light text-questly-gold-dark"
                : "bg-background/70 text-muted-foreground"
            }`}
          >
            <Zap size={12} strokeWidth={2.4} />+{estado.xpConcedido} XP
          </span>
        )}
      </div>

      {/* A linha abaixo do banner é o feedback do ESFORÇO: no acerto, o
          estado do combo; no erro, o porquê de ainda ter vindo XP. */}
      {estado.correta && estado.combo >= 2 && (
        <p className="mb-4 -mt-1 flex items-center gap-1.5 px-1 text-[12.5px] text-muted-foreground">
          <Flame
            size={13}
            strokeWidth={2.2}
            className="shrink-0 text-questly-orange"
          />
          {degrauAtingido ? (
            <span>
              <b className="font-semibold text-foreground">
                {degrauAtingido.rotulo}
              </b>{" "}
              — {estado.combo} acertos seguidos. XP em{" "}
              {questlyMultiplicadorCombo(estado.combo)
                .toString()
                .replace(".", ",")}
              x enquanto a sequência durar.
            </span>
          ) : (
            <span>
              {estado.combo} acertos seguidos
              {questlyMultiplicadorCombo(estado.combo) > 1
                ? ` · XP em ${questlyMultiplicadorCombo(estado.combo).toString().replace(".", ",")}x`
                : " — mais um e o combo começa a pagar."}
            </span>
          )}
        </p>
      )}

      {!estado.correta && estado.xpConcedido > 0 && (
        <p className="mb-4 -mt-1 px-1 text-[12.5px] text-muted-foreground">
          Você levou{" "}
          <b className="font-semibold text-foreground">
            {estado.xpConcedido} XP
          </b>{" "}
          por ter encarado a questão — errar tentando também constrói
          repertório. Acertar paga bem mais.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {pergunta.resolucao && (
          <button
            type="button"
            onClick={() => setMostrarResolucao((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-questly-gold/30 bg-questly-gold-light/50 px-4 py-3 text-sm font-semibold text-questly-gold-dark transition-colors hover:bg-questly-gold-light"
          >
            <Lightbulb size={15} strokeWidth={2} />
            {mostrarResolucao ? "Ocultar resolução" : "Ver resolução"}
          </button>
        )}
        <QuestaoComentarios questionId={pergunta.id} ehAdmin={ehAdmin} />
      </div>

      <AnimatePresence initial={false}>
        {pergunta.resolucao && mostrarResolucao && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mb-4 rounded-xl bg-muted/60 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
              <b className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                <Lightbulb
                  size={14}
                  strokeWidth={2}
                  className="text-questly-gold"
                />
                Resolução
              </b>
              <MathText text={pergunta.resolucao} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!estado.correta && !ehPro && (
        <Link
          href="/pro"
          className="flex items-center gap-2 rounded-xl border border-questly-gold/30 bg-questly-gold/10 px-3.5 py-2.5 text-xs font-medium text-questly-gold transition-colors hover:bg-questly-gold/20"
        >
          <Lock size={13} strokeWidth={2} />
          <span>
            <b className="font-semibold">Autópsia do erro</b> é do Pro: descubra
            por que errou (conceito, cálculo, interpretação ou chute) e corrija
            o padrão.
          </span>
        </Link>
      )}

      {!estado.correta && ehPro && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Brain size={13} strokeWidth={1.75} />
            Por que você errou? Classificar ajuda a calibrar sua chance de
            aprovação.
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_ERRO.map((m) => {
              const Icone = m.icone;
              const ativo = estado.motivoErro === m.valor;
              return (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => onClassificarMotivo(m.valor)}
                  aria-pressed={ativo}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    ativo
                      ? "border-questly-green/50 bg-questly-green-light text-questly-green-dark"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icone size={12} strokeWidth={1.75} />
                  {m.rotulo}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FlashOverlay({
  flash,
}: {
  flash: { tipo: "ok" | "bad"; key: number } | null;
}) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.key}
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            background:
              flash.tipo === "ok"
                ? "radial-gradient(circle at 50% 30%, rgba(45,212,160,0.15), transparent 60%)"
                : "radial-gradient(circle at 50% 30%, rgba(220,71,71,0.15), transparent 60%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </AnimatePresence>
  );
}

// Marco do dia: cartão que desce do topo quando o aluno cruza 10/15/25...
// questões respondidas HOJE. Some sozinho em 5s (ou no clique) e nunca
// bloqueia a tela — a sessão continua rolando atrás dele.
function MarcoOverlay({
  marco,
  onFechar,
}: {
  marco: { marco: MarcoDiario; key: number } | null;
  onFechar: () => void;
}) {
  useEffect(() => {
    if (!marco) return;
    const t = setTimeout(onFechar, 5200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marco?.key]);

  return (
    <AnimatePresence>
      {marco && (
        <motion.div
          key={marco.key}
          className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4"
          initial={{ opacity: 0, y: -28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <button
            type="button"
            onClick={onFechar}
            className="pointer-events-auto flex w-full max-w-[440px] cursor-pointer items-center gap-3.5 rounded-2xl border border-border bg-card/95 px-4 py-3.5 text-left shadow-2xl shadow-black/15 backdrop-blur-md"
          >
            <motion.span
              className="shrink-0"
              initial={{ rotate: -14, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 14,
                delay: 0.08,
              }}
            >
              <Insignia
                nome={marco.marco.insignia}
                tom={marco.marco.tom}
                size={44}
              />
            </motion.span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Marco do dia
              </span>
              <span className="block font-heading text-[15.5px] font-semibold leading-tight tracking-tight">
                {marco.marco.titulo}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                {marco.marco.mensagem}
              </span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function XpFloatOverlay({
  xpFloat,
  anchorRef,
}: {
  xpFloat: { xp: number; key: number; tipo: "ok" | "bad" } | null;
  anchorRef: RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!xpFloat) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    setPos(
      rect ? { left: rect.right - 60, top: rect.top } : { left: 0, top: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpFloat]);

  if (!xpFloat) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={xpFloat.key}
        className={`tnum pointer-events-none fixed z-50 font-heading font-semibold ${
          xpFloat.tipo === "ok"
            ? "text-lg text-questly-gold"
            : "text-[15px] text-muted-foreground"
        }`}
        style={{
          left: pos.left,
          top: pos.top,
          textShadow:
            xpFloat.tipo === "ok" ? "0 2px 10px rgba(201,147,10,0.35)" : "none",
        }}
        initial={{ opacity: 0, y: 0, scale: 0.6 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: xpFloat.tipo === "ok" ? -70 : -46,
          scale: 1,
        }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        +{xpFloat.xp} XP
      </motion.div>
    </AnimatePresence>
  );
}

function ResultView({
  acertos,
  erros,
  xpGanho,
  melhorCombo,
  tempoGastoMinMissao,
  tempoPrevistoMin,
  resultadoExtra,
  desafioAceitando,
  onAceitarDesafio,
  voltarHref,
}: {
  acertos: number;
  erros: number;
  xpGanho: number;
  melhorCombo: number;
  tempoGastoMinMissao: number;
  tempoPrevistoMin: number | null;
  resultadoExtra: FinalizarMissaoResultado | null;
  desafioAceitando: boolean;
  onAceitarDesafio: () => void;
  voltarHref: string;
}) {
  const total = acertos + erros;
  const taxa = total > 0 ? acertos / total : 0;
  const recap = resultadoExtra?.recapResultado;

  let Icone = PartyPopper;
  let corIcone = "text-questly-green";
  let bgIcone = "bg-questly-green-light";
  let titulo = "Missão cumprida!";
  let subtitulo = "Bom progresso. Alguns pontos pra revisar.";

  if (recap) {
    Icone = recap.dominou ? CheckCircle2 : BookOpen;
    corIcone = recap.dominou ? "text-questly-green" : "text-questly-orange";
    bgIcone = recap.dominou
      ? "bg-questly-green-light"
      : "bg-questly-orange-light";
    titulo = recap.dominou ? "Recap aprovado!" : "Ainda vale revisar";
    subtitulo = recap.dominou
      ? "Você provou que domina esse tópico — ele saiu das suas missões. Pode focar no que falta."
      : "Faltou pouco pra fechar o recap — esse tópico continua na sua trilha pra você reforçar.";
  } else if (taxa >= 0.8) {
    Icone = Trophy;
    corIcone = "text-questly-gold";
    bgIcone = "bg-questly-gold-light";
    titulo = "Missão dominada!";
    subtitulo = "Mandou muito bem — continue assim.";
  } else if (taxa < 0.5) {
    Icone = Dumbbell;
    corIcone = "text-questly-orange";
    bgIcone = "bg-questly-orange-light";
    titulo = "Missão concluída";
    subtitulo = "Foi difícil dessa vez — esses tópicos vão voltar em revisão.";
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-4 py-10 sm:px-6">
      {/* A semana Pro de lançamento. Fica na tela de RESULTADO e não na home
          por escolha: aqui o aluno acabou de responder questões, então o aviso
          chega como recompensa do que ele fez, e não como anúncio antes de
          ele fazer qualquer coisa. Aparece uma vez (ver o componente). */}
      <AvisoProLancamento lancamento={resultadoExtra?.lancamento ?? null} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface w-full p-5 text-center sm:p-9"
      >
        <span
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${bgIcone}`}
        >
          <Icone size={26} strokeWidth={1.75} className={corIcone} />
        </span>
        <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight">
          {titulo}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {subtitulo}
        </p>

        <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox
            valor={acertos}
            label="acertos"
            cor="text-questly-green-dark"
          />
          <StatBox valor={erros} label="erros" cor="text-questly-red-dark" />
          <StatBox
            valor={xpGanho}
            label="XP ganho"
            cor="text-questly-gold-dark"
          />
          <StatBox
            valor={`${tempoGastoMinMissao} min`}
            label="tempo gasto"
            cor="text-questly-blue-dark"
          />
        </div>
        {tempoPrevistoMin != null && (
          <p className="tnum mb-1 mt-1 text-xs text-muted-foreground">
            previsto: ~{tempoPrevistoMin} min
          </p>
        )}

        {melhorCombo >= 3 && (
          <p className="tnum mb-5 mt-2 inline-flex items-center gap-1.5 rounded-full bg-questly-orange-light px-3 py-1 text-[12.5px] font-semibold text-questly-orange-dark">
            <Flame size={13} strokeWidth={2.4} />
            Melhor sequência: {melhorCombo} acertos seguidos
          </p>
        )}
        {melhorCombo < 3 && <div className="mb-5" />}

        {resultadoExtra && resultadoExtra.novosMestresNomes.length > 0 && (
          <div className="surface-gold mb-4 rounded-xl p-4 text-left">
            <div className="mb-1.5 flex items-center gap-2 text-[14.5px] font-semibold text-questly-gold-dark">
              <Crown size={16} strokeWidth={2} />
              Novo distintivo de Mestre!
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Você atingiu 90%+ de acerto em{" "}
              <b className="font-medium text-foreground">
                {resultadoExtra.novosMestresNomes.join(", ")}
              </b>
              . A partir de agora, questões desse tópico pagam{" "}
              <b className="font-medium text-foreground">XP em 1.5×</b> pra
              manter a coroa.
            </p>
          </div>
        )}

        {resultadoExtra?.desafio && (
          <div className="mb-4 rounded-xl border border-questly-purple/30 bg-questly-purple/5 p-4 text-left">
            <div className="mb-1.5 flex items-center gap-2 text-[14.5px] font-semibold text-questly-purple">
              <Brain size={16} strokeWidth={2} />
              Desafio de Recuperação
            </div>
            <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">
              Você não toca em{" "}
              <b className="font-medium text-foreground">
                {resultadoExtra.desafio.topicoNome}
              </b>{" "}
              há {resultadoExtra.desafio.diasSemTocar} dias. Resgatar da memória
              agora é o que fixa de verdade. Topa 1 questão?
            </p>
            <button
              type="button"
              disabled={desafioAceitando}
              onClick={onAceitarDesafio}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-purple px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              <Zap size={14} strokeWidth={2} />
              {desafioAceitando ? "Preparando..." : "Aceitar desafio"}
            </button>
          </div>
        )}

        <Link
          href={voltarHref}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-questly-green px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          {rotuloOrigem(voltarHref)}
        </Link>
      </motion.div>
    </div>
  );
}

function StatBox({
  valor,
  label,
  cor,
}: {
  valor: string | number;
  label: string;
  cor: string;
}) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-3.5">
      <div
        className={`tnum font-heading text-lg font-semibold tracking-tight ${cor}`}
      >
        {valor}
      </div>
      <div className="mt-0.5 text-[10.5px] font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/**
 * A parede do teto diário do plano grátis.
 *
 * Três decisões que esta tela toma de propósito:
 *
 *  1. o aluno pode ENCERRAR a lista e levar o XP do que já respondeu. Um
 *     limite que engole o progresso do dia não vende assinatura — cria
 *     ressentimento, e a lista fica pendurada em "em andamento" pra sempre;
 *  2. o número de questões que ele fez hoje aparece em destaque. O teto tem
 *     que soar como "você estudou bastante", não como "você foi cortado";
 *  3. não há botão de "continuar mesmo assim". O servidor recusaria (ver
 *     registrarRespostaAction), e um botão que não funciona é pior que a
 *     ausência dele.
 */
function LimiteDiarioView({
  respondidasNestaLista,
  finalizando,
  onEncerrar,
  voltarHref,
}: {
  respondidasNestaLista: number;
  finalizando: boolean;
  onEncerrar: () => void;
  voltarHref: string;
}) {
  return (
    <div className="casca-leitura flex min-h-screen flex-col items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-gold w-full max-w-md rounded-2xl p-7 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-gold/15 text-questly-gold ring-1 ring-questly-gold/25">
          <ProMark size={26} strokeWidth={2.2} />
        </span>

        <h2 className="mt-4 font-heading text-[20px] font-semibold tracking-tight">
          Você fechou as {QUESTOES_DIA_FREE} questões de hoje
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Esse é o limite diário do plano grátis. Amanhã ele zera — ou você
          libera o banco inteiro agora, sem teto, com o Expectrum Pro.
        </p>

        {respondidasNestaLista > 0 && (
          <p className="tnum mt-3 text-[12.5px] font-medium text-questly-green-dark">
            {respondidasNestaLista}{" "}
            {respondidasNestaLista === 1
              ? "questão respondida"
              : "questões respondidas"}{" "}
            nesta lista — o XP é seu.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/pro"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#e8c257] to-[#b98712] text-[14px] font-semibold text-[#2a1d02] shadow-[var(--elev-sm)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
          >
            Estudar sem limite
            <ArrowRight size={15} strokeWidth={2.2} />
          </Link>

          <button
            type="button"
            onClick={onEncerrar}
            disabled={finalizando}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card text-[13.5px] font-semibold transition-colors hover:bg-foreground/[0.05] disabled:opacity-60"
          >
            {finalizando ? "Encerrando..." : "Encerrar e ver meu resultado"}
          </button>

          <Link
            href={voltarHref}
            className="mt-1 text-[12.5px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {rotuloOrigem(voltarHref)}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Aviso curto e passageiro — hoje usado só pelos tetos do plano grátis
 * (favoritos/anotações). Fica no topo da tela e some sozinho em 5s, com um X
 * pra quem quiser fechar antes.
 *
 * Não é um `alert()` (trava a página e parece erro de sistema) nem um texto
 * inline embaixo do botão (o aluno está olhando pro enunciado, não pra barra
 * de ações). O link pro Pro faz parte da mensagem: a recusa é justamente um
 * lugar onde o upgrade é a resposta, e não um castigo sem saída.
 */
function AvisoToast({
  texto,
  onFechar,
}: {
  texto: string | null;
  onFechar: () => void;
}) {
  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(onFechar, 5000);
    return () => clearTimeout(t);
  }, [texto, onFechar]);

  return (
    <AnimatePresence>
      {texto && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed inset-x-0 top-4 z-50 mx-auto w-[min(92vw,420px)]"
        >
          <div className="surface-gold flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-[var(--elev-md)]">
            <span className="mt-[1px] shrink-0 text-questly-gold">
              <Lock size={14} strokeWidth={2.1} />
            </span>
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed">
              {texto}{" "}
              <Link
                href="/pro"
                className="font-semibold text-questly-gold underline-offset-2 hover:underline"
              >
                Ver o Pro
              </Link>
            </p>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar aviso"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
