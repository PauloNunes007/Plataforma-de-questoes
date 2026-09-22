"use client";

// A tela do Caderno de Erros. O cartão colapsado responde a pergunta que o
// aluno traz ("o que eu errei mesmo?") e o expandido responde a seguinte
// ("por quê?"), sem trocar de página — ele passa o polegar por 12 cartões e
// abre só os que interessam.
//
// Os itens chegam TODOS do servidor e os filtros são locais: o caderno de um
// aluno é curto por natureza (o grátis para em 40 em aberto) e trocar de aba
// não pode parecer lento — regra do web/CLAUDE.md, "Trocar de aba não pode
// parecer lento".

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ImageIcon,
  Lock,
  NotebookPen,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import { PreviewCard } from "@/components/importar/preview-card";
import { QuestaoAcoes } from "@/components/questao/questao-acoes";
import { MathText } from "@/components/questao/math-text";
import { questaoParaItemImportado } from "@/lib/anotacoes/mapear";
import { salvarNotaAction, alternarFavoritoAction } from "@/lib/anotacoes/actions";
import {
  alternarResolvidoAction,
  refazerDoCadernoAction,
  removerDoCadernoAction,
} from "@/lib/caderno/actions";
import type { FiltroCaderno, ItemCaderno } from "@/lib/caderno/types";
import { hrefQuestao } from "@/lib/questao/navegacao";

const CHIP_DIFICULDADE: Record<string, string> = {
  facil: "bg-questly-green-light text-questly-green-dark",
  medio: "bg-questly-orange-light text-questly-orange-dark",
  dificil: "bg-questly-red-light text-questly-red-dark",
};

const ROTULO_MOTIVO: Record<string, string> = {
  conceito: "Não sabia o conceito",
  calculo: "Errei a conta",
  interpretacao: "Interpretei errado",
  chute: "Chutei",
};

/** Teto de questões por revisão — o mesmo REFAZER_MAX da Server Action, que
 *  é quem manda de verdade. Aqui só serve pra tela não prometer mais. */
const REFAZER_MAX = 20;

function diasAtras(iso: string | null): string | null {
  if (!iso) return null;
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

export function CadernoView({ itens }: { itens: ItemCaderno[] }) {
  const router = useRouter();
  const semMovimento = useReducedMotion();

  const [lista, setLista] = useState(itens);
  const [filtro, setFiltro] = useState<FiltroCaderno>("abertos");
  const [disciplina, setDisciplina] = useState<string>("todas");
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [montando, setMontando] = useState(false);
  // Último "Resolvi" — a janela de desfazer. Item sumindo debaixo do dedo é a
  // forma mais fácil de o aluno achar que apagou algo por engano.
  const [desfazer, setDesfazer] = useState<{ id: string; nome: string } | null>(null);

  const disciplinas = useMemo(() => {
    const nomes = new Set<string>();
    lista.forEach((i) => {
      if (i.questao.materiaNome) nomes.add(i.questao.materiaNome);
    });
    return Array.from(nomes).sort();
  }, [lista]);

  const contagem = useMemo(
    () => ({
      abertos: lista.filter((i) => !i.resolvidoEm).length,
      resolvidos: lista.filter((i) => i.resolvidoEm).length,
    }),
    [lista],
  );

  const visiveis = useMemo(
    () =>
      lista.filter((i) => {
        if (filtro === "abertos" && i.resolvidoEm) return false;
        if (filtro === "resolvidos" && !i.resolvidoEm) return false;
        if (disciplina !== "todas" && i.questao.materiaNome !== disciplina) return false;
        return true;
      }),
    [lista, filtro, disciplina],
  );

  function toggleAberto(id: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < REFAZER_MAX) next.add(id);
      return next;
    });
  }

  async function marcarResolvido(item: ItemCaderno, resolvido: boolean) {
    const id = item.questao.id;
    const anterior = item.resolvidoEm;
    setLista((prev) =>
      prev.map((i) =>
        i.questao.id === id
          ? { ...i, resolvidoEm: resolvido ? new Date().toISOString() : null }
          : i,
      ),
    );
    if (resolvido) {
      setDesfazer({ id, nome: item.questao.topicoNome || "questão" });
      setTimeout(() => setDesfazer((d) => (d?.id === id ? null : d)), 6000);
    }

    const r = await alternarResolvidoAction(id, resolvido);
    if ("error" in r) {
      setAviso(r.error);
      setLista((prev) =>
        prev.map((i) => (i.questao.id === id ? { ...i, resolvidoEm: anterior } : i)),
      );
    }
  }

  async function remover(id: string) {
    const guardado = lista.find((i) => i.questao.id === id);
    setLista((prev) => prev.filter((i) => i.questao.id !== id));
    const r = await removerDoCadernoAction(id);
    if ("error" in r && guardado) {
      setAviso(r.error);
      setLista((prev) => [guardado, ...prev]);
    }
  }

  async function refazer(ids: string[]) {
    if (ids.length === 0) return;
    setMontando(true);
    setAviso(null);
    const r = await refazerDoCadernoAction(ids);
    if (!r.missaoId) {
      setMontando(false);
      setAviso(r.error ?? "Não deu pra montar a lista agora.");
      return;
    }
    // O voltarHref traz o aluno de volta AQUI quando a lista fechar — é o que
    // fecha o ciclo "errei → guardei → refiz" sem ele se perder no caminho.
    router.push(hrefQuestao(r.missaoId, "/questoes/caderno"));
  }

  async function onToggleFavorito(id: string) {
    const r = await alternarFavoritoAction(id);
    if ("error" in r) {
      setAviso(r.error);
      return;
    }
    setLista((prev) =>
      prev.map((i) => (i.questao.id === id ? { ...i, favoritado: r.favoritado } : i)),
    );
  }

  async function onSalvarNota(id: string, texto: string) {
    const r = await salvarNotaAction(id, texto);
    if ("error" in r) {
      setAviso(r.error);
      return;
    }
    setLista((prev) =>
      prev.map((i) => (i.questao.id === id ? { ...i, notaTexto: texto.trim() || null } : i)),
    );
  }

  if (lista.length === 0) return <CadernoVazio />;

  return (
    <>
      {aviso && (
        <div className="flex items-start gap-2.5 rounded-xl border border-questly-gold/35 bg-questly-gold/[0.08] px-4 py-3">
          <Lock size={14} strokeWidth={2.1} className="mt-[1px] shrink-0 text-questly-gold" />
          <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed">
            {aviso}{" "}
            <Link
              href="/pro"
              className="font-semibold text-questly-gold underline-offset-2 hover:underline"
            >
              Ver o Pro
            </Link>
          </p>
        </div>
      )}

      {/* filtros: estado da pendência (segmentado) + disciplina */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="surface flex gap-1 rounded-xl p-1">
          {(
            [
              { id: "abertos" as const, rotulo: "Em aberto", n: contagem.abertos },
              { id: "resolvidos" as const, rotulo: "Resolvidas", n: contagem.resolvidos },
              { id: "todos" as const, rotulo: "Todas", n: lista.length },
            ]
          ).map((aba) => {
            const ativo = filtro === aba.id;
            return (
              <button
                key={aba.id}
                type="button"
                role="tab"
                aria-selected={ativo}
                onClick={() => setFiltro(aba.id)}
                className={`relative flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                  ativo ? "text-questly-purple" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ativo && (
                  <motion.span
                    layoutId={semMovimento ? undefined : "caderno-aba"}
                    aria-hidden
                    className="absolute inset-0 rounded-lg bg-questly-purple/10 ring-1 ring-questly-purple/25"
                    transition={{ type: "spring", stiffness: 460, damping: 38 }}
                  />
                )}
                <span className="relative">{aba.rotulo}</span>
                <span className="tnum relative text-[11px] opacity-70">{aba.n}</span>
              </button>
            );
          })}
        </div>

        {disciplinas.length > 1 && (
          <select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            aria-label="Filtrar por disciplina"
            className="h-9 rounded-xl border border-input bg-card px-3 text-[12.5px] font-medium outline-none transition-colors focus:border-questly-purple/50"
          >
            <option value="todas">Todas as disciplinas</option>
            {disciplinas.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {visiveis.length > 0 && filtro !== "resolvidos" && (
          <button
            type="button"
            disabled={montando}
            onClick={() =>
              refazer(
                (selecionados.size > 0
                  ? visiveis.filter((i) => selecionados.has(i.questao.id))
                  : visiveis
                )
                  .slice(0, REFAZER_MAX)
                  .map((i) => i.questao.id),
              )
            }
            className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-questly-purple px-4 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            <RotateCcw size={14} strokeWidth={2.2} />
            {montando
              ? "Montando..."
              : selecionados.size > 0
                ? `Refazer ${selecionados.size}`
                : `Refazer ${Math.min(visiveis.length, REFAZER_MAX)}`}
          </button>
        )}
      </div>

      {visiveis.length === 0 ? (
        <p className="surface px-6 py-12 text-center text-sm text-muted-foreground">
          {filtro === "resolvidos"
            ? "Nenhuma questão marcada como resolvida ainda."
            : "Nada em aberto nesse recorte. Bom sinal."}
        </p>
      ) : (
        <div className="surface divide-y divide-border overflow-hidden">
          {visiveis.map((item) => {
            const q = item.questao;
            const aberto = abertos.has(q.id);
            const chipDif = CHIP_DIFICULDADE[q.dificuldade || ""] || "bg-muted text-muted-foreground";
            const resolvido = !!item.resolvidoEm;
            return (
              <div
                key={q.id}
                className={`relative transition-opacity ${resolvido ? "opacity-60" : ""}`}
              >
                {/* barra da disciplina: identifica a matéria antes de ler */}
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-[3px] ${resolvido ? "bg-questly-green" : "bg-questly-purple/60"}`}
                />
                <div className="flex items-start gap-2 pl-[3px]">
                  <label className="flex cursor-pointer items-center pl-3 pt-4">
                    <input
                      type="checkbox"
                      checked={selecionados.has(q.id)}
                      onChange={() => toggleSelecionado(q.id)}
                      aria-label="Selecionar pra refazer"
                      className="h-4 w-4 cursor-pointer accent-questly-purple"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleAberto(q.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 py-3.5 pr-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                          {q.materiaNome || "Sem matéria"}
                          {q.topicoNome ? ` · ${q.topicoNome}` : ""}
                        </span>
                        {item.vezesErrada > 1 && (
                          <span className="tnum rounded-full bg-questly-red-light px-2 py-0.5 text-[10px] font-bold text-questly-red-dark">
                            errei {item.vezesErrada}×
                          </span>
                        )}
                        {item.erradoEm && (
                          <span className="text-[10.5px] text-muted-foreground/80">
                            {diasAtras(item.erradoEm)}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-[13.5px] font-medium leading-snug">
                        <MathText text={q.enunciado || "(sem enunciado)"} />
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.respostaMarcada && (
                          <span className="rounded-full bg-questly-red-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-questly-red-dark">
                            você marcou {item.respostaMarcada}
                          </span>
                        )}
                        <span className="rounded-full bg-questly-green-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-questly-green-dark">
                          gabarito {q.gabarito?.toUpperCase()}
                        </span>
                        {item.motivoErro && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {ROTULO_MOTIVO[item.motivoErro] || item.motivoErro}
                          </span>
                        )}
                        {q.dificuldade && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chipDif}`}
                          >
                            {q.dificuldade}
                          </span>
                        )}
                        {q.imagem_url && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                            <ImageIcon size={11} strokeWidth={2} /> figura
                          </span>
                        )}
                      </div>

                      {item.notaTexto && !aberto && (
                        <p className="mt-1.5 truncate border-l-2 border-questly-blue/40 pl-2 text-[11.5px] italic text-muted-foreground">
                          {item.notaTexto.replace(/\$/g, "")}
                        </p>
                      )}

                      {/* Acertar no refazer NÃO marca resolvido sozinho: um
                          acerto pode ser sorte, e considerar aprendido é
                          decisão do aluno. A tela só avisa e deixa o botão
                          "Resolvi" ali do lado. */}
                      {item.acertouDepois && !resolvido && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-questly-green-dark">
                          <Check size={11} strokeWidth={2.6} />
                          você acertou essa questão depois de guardar
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      size={17}
                      strokeWidth={2}
                      className={`mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {aberto && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 340, damping: 34 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-3">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={montando}
                            onClick={() => refazer([q.id])}
                            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-questly-purple px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                          >
                            <RotateCcw size={13} strokeWidth={2.2} />
                            Refazer esta
                          </button>
                          <button
                            type="button"
                            onClick={() => marcarResolvido(item, !resolvido)}
                            aria-pressed={resolvido}
                            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-semibold transition-colors ${
                              resolvido
                                ? "bg-questly-green-light text-questly-green-dark ring-1 ring-questly-green/30"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <Check size={13} strokeWidth={2.4} />
                            {resolvido ? "Resolvida" : "Resolvi"}
                          </button>
                          <button
                            type="button"
                            onClick={() => remover(q.id)}
                            className="ml-auto inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-questly-red-light hover:text-questly-red-dark"
                          >
                            <Trash2 size={13} strokeWidth={2} />
                            Tirar do caderno
                          </button>
                        </div>

                        <QuestaoAcoes
                          questionId={q.id}
                          resolucao={q.resolucao}
                          favoritado={item.favoritado}
                          notaInicial={item.notaTexto}
                          onToggleFavorito={() => onToggleFavorito(q.id)}
                          onSalvarNota={(texto) => onSalvarNota(q.id, texto)}
                        />
                        <PreviewCard item={questaoParaItemImportado(q)} motivos={[]} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* janela de desfazer do "Resolvi" */}
      <AnimatePresence>
        {desfazer && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[380px] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
          >
            <Check size={15} strokeWidth={2.4} className="shrink-0 text-questly-green" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
              Marcada como resolvida
            </span>
            <button
              type="button"
              onClick={() => {
                const alvo = lista.find((i) => i.questao.id === desfazer.id);
                if (alvo) marcarResolvido(alvo, false);
                setDesfazer(null);
              }}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-questly-purple"
            >
              <Undo2 size={13} strokeWidth={2.2} />
              Desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** O estado vazio é a primeira tela que TODO aluno vê aqui — e o tom dela é o
 *  da mudança inteira: erro é matéria-prima, não vexame. Nada de ilustração
 *  triste, nada de "você ainda não errou nada". */
function CadernoVazio() {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-questly-purple/12 text-questly-purple">
        <NotebookPen size={22} strokeWidth={1.75} />
      </span>
      <h2 className="font-heading text-[17px] font-semibold tracking-tight">
        Seu caderno está vazio — e isso é bom.
      </h2>
      <p className="max-w-[340px] text-sm leading-relaxed text-muted-foreground">
        Quando errar uma questão, toque em <b className="font-semibold text-foreground">Guardar
        no Caderno de Erros</b>. Ela vem pra cá com a resolução do lado, e você refaz quando
        quiser.
      </p>
      <Link
        href="/questoes/banco"
        className="mt-1 inline-flex items-center justify-center rounded-xl bg-questly-purple px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
      >
        Praticar agora
      </Link>
    </div>
  );
}
