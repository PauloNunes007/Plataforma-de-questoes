"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  Loader2,
  MonitorSmartphone,
  RotateCcw,
  Printer,
  ScrollText,
  X,
} from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import { FiguraQuestao, figurasDaPergunta, usePrefetchFiguras } from "@/components/questao/figura-questao";
import type { SimuladoCompleto } from "@/lib/simulados/simulados-data";
import {
  finalizarSimuladoAction,
  reiniciarRelogioSimuladoAction,
  salvarRespostasAction,
} from "@/lib/simulados/actions";

function fmtRelogio(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, "0");
  const sss = String(ss).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}

/**
 * Os dois jeitos de fazer o mesmo simulado.
 *
 *  · `tela`   — uma questão por vez, como sempre foi;
 *  · `cartao` — SIMULADO HÍBRIDO: o aluno imprimiu a prova (layout de prova da
 *               universidade, ver /imprimir/simulado/[id]), resolve no papel e
 *               usa o app só como cartão-resposta.
 *
 * O modo é de EXIBIÇÃO, não de dados: é o mesmo `simulados_aluno`, o mesmo
 * autosave, a mesma correção no servidor e o mesmo relatório com autópsia de
 * erros no fim — por isso não custou coluna nova no banco. Trocar de modo no
 * meio da prova é legítimo (começou no papel, terminou na tela) e não perde
 * nada do que já foi marcado.
 */
export type ModoSimulado = "tela" | "cartao";

export function SimuladoRunner({
  simulado,
  modoInicial = "tela",
}: {
  simulado: SimuladoCompleto;
  modoInicial?: ModoSimulado;
}) {
  const router = useRouter();
  const perguntas = simulado.perguntas;
  const [modo, setModo] = useState<ModoSimulado>(modoInicial);

  const deadlineMs = useMemo(
    () => new Date(simulado.iniciado_em).getTime() + simulado.duracao_min * 60_000,
    [simulado.iniciado_em, simulado.duracao_min],
  );

  const [respostas, setRespostas] = useState<Record<string, string>>(simulado.respostas || {});
  const [indice, setIndice] = useState(0);
  const [restanteSeg, setRestanteSeg] = useState(() => Math.max(0, Math.round((deadlineMs - Date.now()) / 1000)));
  const [finalizando, setFinalizando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizouRef = useRef(false);
  // Cronômetro por questão: `temposRef` acumula os segundos já gastos em cada
  // questão e `relogioRef` guarda em qual questão o aluno está desde quando.
  // É best-effort (alimenta só o gráfico de ritmo e o diagnóstico de pressa no
  // resultado — nada aqui vale nota), então pausar com a aba escondida basta:
  // sem isso, deixar a prova aberta noutra aba inflaria a questão visível.
  const temposRef = useRef<Record<string, number>>({ ...(simulado.tempos || {}) });
  const relogioRef = useRef<{ id: string; desde: number } | null>(null);
  // Espelho sempre-atual das respostas: o auto-finalizar do relógio roda a
  // partir de um closure criado no 1º render; sem o ref, entregaria respostas
  // velhas (o aluno perderia o que marcou depois). Atualizado num efeito
  // (fora do render — permitido, ao contrário de escrever ref no corpo).
  const respostasRef = useRef(respostas);
  useEffect(() => {
    respostasRef.current = respostas;
  }, [respostas]);

  // Fecha a contagem da questão corrente e devolve o mapa acumulado.
  function fecharCronometro(): Record<string, number> {
    const atual = relogioRef.current;
    if (atual) {
      const gasto = (Date.now() - atual.desde) / 1000;
      if (gasto > 0) temposRef.current[atual.id] = (temposRef.current[atual.id] || 0) + gasto;
      relogioRef.current = null;
    }
    return temposRef.current;
  }

  function abrirCronometro(questionId: string) {
    relogioRef.current = { id: questionId, desde: Date.now() };
  }

  // Corrige e encerra no servidor (autoritativo), depois recarrega a página —
  // o Server Component vê status=concluido e renderiza o resultado.
  async function finalizar() {
    if (finalizouRef.current) return;
    finalizouRef.current = true;
    setFinalizando(true);
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    const tempoGastoSeg = Math.min(
      simulado.duracao_min * 60,
      Math.round((Date.now() - new Date(simulado.iniciado_em).getTime()) / 1000),
    );
    await finalizarSimuladoAction(simulado.id, respostasRef.current, tempoGastoSeg, fecharCronometro());
    router.refresh();
  }

  // Cronometragem da questão visível: (re)abre a contagem a cada troca de
  // questão e fecha ao sair. `visibilitychange` pausa quando a aba some.
  useEffect(() => {
    // No cartão-resposta não há "questão visível": o aluno está no papel, e
    // atribuir o tempo todo à linha que estiver no topo da tela inventaria um
    // dado que ninguém mediu. O mapa fica vazio e os gráficos de ritmo já
    // sabem lidar com isso (`tempos` é best-effort por contrato).
    const atual = modo === "tela" ? perguntas[indice] : null;
    if (!atual || finalizouRef.current) return;
    abrirCronometro(atual.id);

    function aoTrocarVisibilidade() {
      if (document.hidden) fecharCronometro();
      else if (!finalizouRef.current && atual) abrirCronometro(atual.id);
    }
    document.addEventListener("visibilitychange", aoTrocarVisibilidade);
    return () => {
      document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
      fecharCronometro();
    };
    // abrirCronometro/fecharCronometro só mexem em refs — nada mais a declarar
  }, [indice, perguntas, modo]);

  // Relógio: 1 tick/s. Ao zerar, auto-finaliza com o que estiver marcado.
  useEffect(() => {
    const t = setInterval(() => {
      const rest = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setRestanteSeg(rest);
      if (rest <= 0 && !finalizouRef.current) finalizar();
    }, 1000);
    return () => clearInterval(t);
    // finalizar/respostas capturados por ref/closure; deadline é estável
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineMs]);

  function marcar(questionId: string, letra: string) {
    const proximo = { ...respostas };
    if (proximo[questionId] === letra) delete proximo[questionId]; // toca de novo = desmarca
    else proximo[questionId] = letra;
    setRespostas(proximo);
    // autosave debounced (sem useEffect — evita set-state-in-effect); usa o
    // objeto recém-calculado, não o estado (que só atualiza no próximo render)
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      // snapshot sem fechar a contagem: o aluno segue na mesma questão
      const parcial = { ...temposRef.current };
      const atual = relogioRef.current;
      if (atual) parcial[atual.id] = (parcial[atual.id] || 0) + (Date.now() - atual.desde) / 1000;
      salvarRespostasAction(simulado.id, proximo, parcial);
    }, 1000);
  }

  // Prefetch das figuras da questão atual + das duas seguintes (numa prova
  // cronometrada, esperar imagem custa tempo de prova — ver figura-questao).
  usePrefetchFiguras(
    modo === "tela" ? perguntas.slice(indice, indice + 3).flatMap((p) => figurasDaPergunta(p)) : [],
  );

  const pergunta = perguntas[indice];
  const letras = pergunta ? Object.keys(pergunta.alternativas || {}).sort() : [];
  const imagensAlternativas = pergunta?.alternativas_imagens || {};
  const respondidas = Object.keys(respostas).length;
  const critico = restanteSeg <= 300; // < 5min

  if (!pergunta) return null;

  return (
    <div className="casca-leitura pb-28 pt-4">
      {/* Barra superior: título + relógio + progresso */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold">{simulado.titulo}</p>
            <p className="tnum text-[11px] font-medium text-muted-foreground">
              {respondidas}/{perguntas.length} respondidas
            </p>
          </div>
          <div
            className={`tnum inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[15px] font-heading font-bold ${
              critico ? "bg-questly-red-light text-questly-red-dark" : "bg-muted text-foreground"
            }`}
            aria-live="off"
          >
            <AlarmClock size={16} className={critico ? "animate-pulse" : ""} />
            {fmtRelogio(restanteSeg)}
          </div>
        </div>
        {/* barra de progresso */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-questly-green transition-all"
            style={{ width: `${(respondidas / perguntas.length) * 100}%` }}
          />
        </div>

        {/* Onde a prova está sendo resolvida. Fica no topo, sempre visível:
            imprimir era o recurso que ninguém achava porque morava atrás de um
            ícone pequeno. Aqui é uma escolha de duas, com nome. */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label="Como você vai resolver">
            {([
              { v: "tela" as const, rotulo: "Na tela", icone: <MonitorSmartphone size={13} /> },
              { v: "cartao" as const, rotulo: "No papel", icone: <ScrollText size={13} /> },
            ]).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setModo(o.v)}
                aria-pressed={modo === o.v}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-bold transition-colors ${
                  modo === o.v
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.icone}
                {o.rotulo}
              </button>
            ))}
          </div>
          <Link
            href={`/imprimir/simulado/${simulado.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[12px] font-bold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
          >
            <Printer size={13} strokeWidth={2.1} />
            Imprimir prova
          </Link>
        </div>
      </div>

      {modo === "cartao" ? (
        <CartaoResposta
          simuladoId={simulado.id}
          perguntas={perguntas}
          respostas={respostas}
          onMarcar={marcar}
        />
      ) : (
        <>
        {/* Navegador de questões */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {perguntas.map((p, i) => {
            const feita = Boolean(respostas[p.id]);
            const atual = i === indice;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ir pra questão ${i + 1}`}
                aria-current={atual}
                className={`tnum flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] font-bold transition-colors ${
                  atual
                    ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                    : feita
                      ? "border-questly-green/40 bg-questly-green-light text-questly-green-dark"
                      : "border-border bg-card text-muted-foreground hover:border-questly-green/40"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Card da questão */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pergunta.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="surface p-5 sm:p-7"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="tnum text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Questão {indice + 1} de {perguntas.length}
              </span>
              {pergunta.instituicao && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                  {pergunta.instituicao}
                  {pergunta.ano ? ` ${pergunta.ano}` : ""}
                </span>
              )}
            </div>

            <div className="mb-6 text-[17px] font-medium leading-relaxed tracking-tight sm:text-[18px]">
              <MathText text={pergunta.enunciado} />
            </div>

            {pergunta.imagem_url && (
              <FiguraQuestao
                src={pergunta.imagem_url}
                alt="Imagem da questão"
                className="mb-6 h-[260px] rounded-xl border border-border p-3 sm:h-[360px]"
              />
            )}

            <div className="flex flex-col gap-3">
              {letras.map((letra) => {
                const texto = pergunta.alternativas?.[letra] ?? "";
                const imgAlt = imagensAlternativas[letra];
                const selecionada = respostas[pergunta.id] === letra;
                return (
                  <div
                    key={letra}
                    onClick={() => marcar(pergunta.id, letra)}
                    className={`relative flex min-h-[64px] cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-4 transition-colors ${
                      selecionada
                        ? "border-questly-green/60 bg-questly-green-light/60"
                        : "border-border bg-card hover:border-questly-green/50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[14px] font-semibold transition-colors ${
                        selecionada
                          ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {letra.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-normal leading-relaxed sm:text-[16px]">
                      {imgAlt && (
                        <FiguraQuestao
                          src={imgAlt}
                          alt={`Imagem da alternativa ${letra.toUpperCase()}`}
                          className="mb-2 h-[140px] w-full rounded-lg border border-border p-2"
                        />
                      )}
                      <MathText text={texto} />
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Navegação prev/next */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={indice === 0}
                onClick={() => setIndice((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft size={15} /> Anterior
              </button>
              {indice < perguntas.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndice((i) => Math.min(perguntas.length - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
                >
                  Próxima <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmar(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
                >
                  <Flag size={15} /> Finalizar
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        </>
      )}

      {/* Botão finalizar sempre acessível (rodapé) */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="text-sm font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Finalizar e entregar simulado
        </button>
      </div>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {confirmar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => !finalizando && setConfirmar(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="surface w-full max-w-sm p-6"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold">Entregar simulado?</h3>
                {!finalizando && (
                  <button type="button" onClick={() => setConfirmar(false)} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                )}
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Você respondeu <b className="tnum text-foreground">{respondidas}</b> de{" "}
                <b className="tnum text-foreground">{perguntas.length}</b> questões.
                {respondidas < perguntas.length && " As em branco contam como erro."} Depois de entregar,
                não dá pra mudar as respostas.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={finalizando}
                  onClick={() => setConfirmar(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-questly-green/40 disabled:opacity-40"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  disabled={finalizando}
                  onClick={finalizar}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:text-[#0c1512]"
                >
                  {finalizando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {finalizando ? "Corrigindo…" : "Entregar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cartão-resposta digital (simulado híbrido)
// ---------------------------------------------------------------------------

/**
 * A prova está no papel; aqui só se marca.
 *
 * Deliberadamente NÃO mostra enunciado nem alternativa: se o texto estivesse
 * na tela, o aluno leria daqui e a impressão teria sido teatro. O que a tela
 * oferece é o que o papel não tem — relógio, autosave, correção na hora e a
 * mesma autópsia de erros do simulado feito na tela.
 *
 * As bolhas são as letras de CADA questão (não um A–E fixo): uma prova com
 * questão de 4 alternativas não pode oferecer uma (e) que não existe.
 */
function CartaoResposta({
  simuladoId,
  perguntas,
  respostas,
  onMarcar,
}: {
  simuladoId: string;
  perguntas: SimuladoCompleto["perguntas"];
  respostas: Record<string, string>;
  onMarcar: (questionId: string, letra: string) => void;
}) {
  const router = useRouter();
  const [zerando, iniciarZerar] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-green-light text-questly-green-dark">
          <ScrollText size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold">Você está resolvendo no papel</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Imprima a prova, resolva com o relógio correndo e marque aqui. A correção, o ranking e a
            análise de erros saem iguais aos do simulado feito na tela.
          </p>
        </div>
        <Link
          href={`/imprimir/simulado/${simuladoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-questly-green px-4 text-[13.5px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          <Printer size={16} strokeWidth={2.1} />
          Abrir PDF da prova
        </Link>
      </div>

      {/* Ir até a impressora não é tempo de prova. Enquanto nada foi marcado,
          o relógio pode ser zerado (o servidor só aceita nessa condição —
          ver reiniciarRelogioSimuladoAction); depois da primeira marcação o
          botão some, porque aí a prova começou. */}
      {Object.keys(respostas).length === 0 && (
        <button
          type="button"
          disabled={zerando}
          onClick={() =>
            iniciarZerar(async () => {
              const r = await reiniciarRelogioSimuladoAction(simuladoId);
              if (r.ok) router.refresh();
            })
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-border px-3.5 text-[12.5px] font-bold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground disabled:opacity-50"
        >
          {zerando ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} strokeWidth={2.1} />}
          Já imprimi — começar a contar o tempo agora
        </button>
      )}

      <div className="surface grid grid-cols-1 gap-x-6 gap-y-1 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {perguntas.map((p, i) => {
          const letras = Object.keys(p.alternativas || {}).sort();
          const marcada = respostas[p.id];
          return (
            <div
              key={p.id}
              className="flex items-center gap-2.5 border-b border-border/60 py-2 last:border-b-0 sm:border-b-0"
            >
              <span
                className={`tnum w-[22px] shrink-0 text-right text-[12.5px] font-bold ${
                  marcada ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex gap-1.5">
                {letras.map((l) => {
                  const ativa = marcada === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => onMarcar(p.id, l)}
                      aria-pressed={ativa}
                      aria-label={`Questão ${i + 1}, alternativa ${l.toUpperCase()}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-bold transition-colors ${
                        ativa
                          ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                          : "border-border bg-card text-muted-foreground hover:border-questly-green/50"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11.5px] text-muted-foreground">
        Tocar de novo na letra marcada desmarca a questão. Tudo é salvo sozinho — dá pra fechar e voltar.
      </p>
    </div>
  );
}
