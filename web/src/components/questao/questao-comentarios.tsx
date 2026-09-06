"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, Pencil, Reply, Send, Trash2, X } from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import {
  alternarCurtidaAction,
  carregarComentariosAction,
  criarComentarioAction,
  editarComentarioAction,
  excluirComentarioAction,
  type Comentario,
} from "@/lib/comentarios/actions";

// ---------- helpers ----------

function iniciais(nome: string | null, username: string | null): string {
  return (nome || username || "?").trim().slice(0, 1).toUpperCase();
}

function nomeExibido(c: Comentario): string {
  if (c.autorUsername) return `@${c.autorUsername}`;
  if (c.autorNome) return c.autorNome;
  return "Estudante";
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function contarTudo(lista: Comentario[]): number {
  return lista.reduce((acc, c) => acc + 1 + contarTudo(c.respostas), 0);
}

function mapComentarios(lista: Comentario[], id: string, fn: (c: Comentario) => Comentario): Comentario[] {
  return lista.map((c) => {
    const atual = c.id === id ? fn(c) : c;
    if (atual.respostas.length) return { ...atual, respostas: mapComentarios(atual.respostas, id, fn) };
    return atual;
  });
}

function removerComentario(lista: Comentario[], id: string): Comentario[] {
  return lista
    .filter((c) => c.id !== id)
    .map((c) => (c.respostas.length ? { ...c, respostas: removerComentario(c.respostas, id) } : c));
}

function adicionarResposta(lista: Comentario[], parentId: string, resposta: Comentario): Comentario[] {
  return mapComentarios(lista, parentId, (c) => ({ ...c, respostas: [...c.respostas, resposta] }));
}

function useEhDesktop(): boolean {
  const [ehDesktop, setEhDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const atualizar = () => setEhDesktop(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);
  return ehDesktop;
}

// ---------- avatar ----------

function Avatar({ c, size = 36 }: { c: Comentario; size?: number }) {
  if (c.autorFoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={c.autorFoto}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover ring-1 ring-border"
        loading="lazy"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-[13px] font-bold text-questly-green-dark"
    >
      {iniciais(c.autorNome, c.autorUsername)}
    </span>
  );
}

// ---------- composer ----------

function Composer({
  onEnviar,
  placeholder,
  autoFocus,
  compacto,
  onCancelar,
}: {
  onEnviar: (texto: string) => Promise<void>;
  placeholder: string;
  autoFocus?: boolean;
  compacto?: boolean;
  onCancelar?: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  async function enviar() {
    const limpo = texto.trim();
    if (!limpo || enviando) return;
    setEnviando(true);
    await onEnviar(limpo);
    setEnviando(false);
    setTexto("");
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={ref}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            enviar();
          }
        }}
        rows={compacto ? 1 : 2}
        maxLength={2000}
        placeholder={placeholder}
        className="min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-questly-green/50 focus:ring-4 focus:ring-questly-green/10"
      />
      {onCancelar && (
        <button
          type="button"
          onClick={onCancelar}
          className="flex h-[44px] shrink-0 items-center rounded-xl px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
      )}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !texto.trim()}
        aria-label="Enviar"
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-questly-green text-white shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:text-[#0c1512]"
      >
        <Send size={17} strokeWidth={2} />
      </button>
    </div>
  );
}

// ---------- item ----------

function ComentarioItem({
  c,
  ehAdmin,
  profundidade,
  onCurtir,
  onResponder,
  onEditar,
  onExcluir,
}: {
  c: Comentario;
  ehAdmin: boolean;
  profundidade: number;
  onCurtir: (id: string) => void;
  onResponder: (parentId: string, texto: string) => Promise<void>;
  onEditar: (id: string, texto: string) => Promise<void>;
  onExcluir: (id: string) => void;
}) {
  const [respondendo, setRespondendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState(c.texto);

  return (
    <div className="flex gap-2.5">
      <Avatar c={c} size={profundidade > 0 ? 30 : 36} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-muted/50 px-3.5 py-2.5">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-foreground">{nomeExibido(c)}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {tempoRelativo(c.criadoEm)}
              {c.editadoEm && " · editado"}
            </span>
          </div>

          {editando ? (
            <div className="mt-1">
              <textarea
                value={textoEdicao}
                onChange={(e) => setTextoEdicao(e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-questly-green/50 focus:ring-4 focus:ring-questly-green/10"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onEditar(c.id, textoEdicao);
                    setEditando(false);
                  }}
                  className="rounded-lg bg-questly-green px-3 py-1.5 text-[12px] font-semibold text-white transition-all hover:brightness-105 active:scale-95 dark:text-[#0c1512]"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditando(false);
                    setTextoEdicao(c.texto);
                  }}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[14px] leading-relaxed text-foreground/90">
              <MathText text={c.texto} />
            </div>
          )}
        </div>

        {!editando && (
          <div className="mt-1 flex flex-wrap items-center gap-3 pl-1">
            <button
              type="button"
              onClick={() => onCurtir(c.id)}
              className={`inline-flex items-center gap-1 text-[12px] font-semibold transition-colors ${
                c.euCurti ? "text-questly-red" : "text-muted-foreground hover:text-questly-red"
              }`}
            >
              <Heart size={13} strokeWidth={2} fill={c.euCurti ? "currentColor" : "none"} />
              {c.curtidas > 0 ? c.curtidas : "Curtir"}
            </button>
            {profundidade === 0 && (
              <button
                type="button"
                onClick={() => setRespondendo((r) => !r)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Reply size={13} strokeWidth={2} /> Responder
              </button>
            )}
            {c.meu && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil size={12} strokeWidth={2} /> Editar
              </button>
            )}
            {(c.meu || ehAdmin) && (
              <button
                type="button"
                onClick={() => onExcluir(c.id)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-questly-red"
              >
                <Trash2 size={12} strokeWidth={2} /> Apagar
              </button>
            )}
          </div>
        )}

        {respondendo && (
          <div className="mt-2">
            <Composer
              autoFocus
              compacto
              placeholder={`Responder ${nomeExibido(c)}...`}
              onCancelar={() => setRespondendo(false)}
              onEnviar={async (texto) => {
                await onResponder(c.id, texto);
                setRespondendo(false);
              }}
            />
          </div>
        )}

        {c.respostas.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l-2 border-border/70 pl-3">
            {c.respostas.map((r) => (
              <ComentarioItem
                key={r.id}
                c={r}
                ehAdmin={ehAdmin}
                profundidade={profundidade + 1}
                onCurtir={onCurtir}
                onResponder={onResponder}
                onEditar={onEditar}
                onExcluir={onExcluir}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- trigger + drawer ----------
// Montado dentro da área de feedback (só depois de responder). Como o pai
// dá key={pergunta.id} na FeedbackArea, este componente remonta a cada
// questão — nada de effect de reset. A carga acontece no clique de abrir
// (event handler), não num effect.

export function QuestaoComentarios({ questionId, ehAdmin }: { questionId: string; ehAdmin: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const ehDesktop = useEhDesktop();

  // Trava o scroll do body enquanto o drawer está aberto (efeito externo).
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  async function abrir() {
    setAberto(true);
    if (carregado) return;
    setCarregando(true);
    const res = await carregarComentariosAction(questionId);
    setCarregando(false);
    setCarregado(true);
    if ("comentarios" in res) {
      setComentarios(res.comentarios);
      setTotal(contarTudo(res.comentarios));
    }
  }

  async function enviarRaiz(texto: string) {
    const res = await criarComentarioAction(questionId, texto, null);
    if ("error" in res) return void alert(res.error);
    setComentarios((prev) => [res.comentario, ...prev]);
    setTotal((t) => (t ?? 0) + 1);
  }

  async function responder(parentId: string, texto: string) {
    const res = await criarComentarioAction(questionId, texto, parentId);
    if ("error" in res) return void alert(res.error);
    setComentarios((prev) => adicionarResposta(prev, parentId, res.comentario));
    setTotal((t) => (t ?? 0) + 1);
  }

  async function editar(id: string, texto: string) {
    const limpo = texto.trim();
    if (!limpo) return;
    const res = await editarComentarioAction(id, limpo);
    if ("error" in res) return void alert(res.error);
    setComentarios((prev) =>
      mapComentarios(prev, id, (c) => ({ ...c, texto: limpo, editadoEm: new Date().toISOString() })),
    );
  }

  async function excluir(id: string) {
    if (!confirm("Apagar este comentário? As respostas também serão removidas.")) return;
    const anterior = comentarios;
    const depois = removerComentario(anterior, id);
    setComentarios(depois);
    setTotal(contarTudo(depois));
    const res = await excluirComentarioAction(id);
    if ("error" in res) {
      alert(res.error);
      setComentarios(anterior);
      setTotal(contarTudo(anterior));
    }
  }

  function curtir(id: string) {
    const alterna = (prev: Comentario[]) =>
      mapComentarios(prev, id, (c) => ({
        ...c,
        euCurti: !c.euCurti,
        curtidas: c.curtidas + (c.euCurti ? -1 : 1),
      }));
    setComentarios(alterna); // otimista
    alternarCurtidaAction(id).then((res) => {
      if ("error" in res) setComentarios(alterna); // reverte
    });
  }

  const drawer = (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAberto(false)}
          />
          <motion.aside
            className={
              ehDesktop
                ? "fixed right-0 top-0 z-[61] flex h-full w-full max-w-[440px] flex-col border-l border-border bg-background shadow-2xl"
                : "fixed inset-x-0 bottom-0 z-[61] flex max-h-[88dvh] flex-col rounded-t-3xl border-t border-border bg-background shadow-2xl"
            }
            initial={ehDesktop ? { x: "100%" } : { y: "100%" }}
            animate={ehDesktop ? { x: 0 } : { y: 0 }}
            exit={ehDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            style={{ paddingBottom: ehDesktop ? undefined : "env(safe-area-inset-bottom)" }}
          >
            {!ehDesktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border" />}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <span className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <MessageCircle size={18} strokeWidth={2} className="text-questly-green" />
                Discussão
                {total != null && total > 0 && (
                  <span className="tnum rounded-full bg-questly-green/12 px-2 py-0.5 text-[11px] font-bold text-questly-green-dark">
                    {total}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar discussão"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {carregando && comentarios.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">Carregando discussão...</p>
              )}
              {!carregando && comentarios.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-questly-green/10">
                    <MessageCircle size={22} strokeWidth={1.75} className="text-questly-green" />
                  </span>
                  <p className="text-sm font-medium text-foreground">Ninguém comentou ainda</p>
                  <p className="max-w-[240px] text-xs text-muted-foreground">
                    Puxe a discussão: tire uma dúvida, mostre um atalho ou explique o passo que trava a galera.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-5">
                {comentarios.map((c) => (
                  <ComentarioItem
                    key={c.id}
                    c={c}
                    ehAdmin={ehAdmin}
                    profundidade={0}
                    onCurtir={curtir}
                    onResponder={responder}
                    onEditar={editar}
                    onExcluir={excluir}
                  />
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-background px-5 py-3.5">
              <Composer placeholder="Escreva um comentário... Use $...$ pra fórmulas." onEnviar={enviarRaiz} />
              <p className="mt-1.5 hidden text-[11px] text-muted-foreground sm:block">
                Ctrl+Enter envia. Seja gentil — todo mundo aqui está aprendendo.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-questly-green/30 bg-questly-green-light/50 px-4 py-3 text-sm font-semibold text-questly-green-dark transition-colors hover:bg-questly-green-light"
      >
        <MessageCircle size={15} strokeWidth={2} />
        Discussão
        {total != null && total > 0 && <span className="tnum">· {total}</span>}
      </button>
      {typeof document !== "undefined" && createPortal(drawer, document.body)}
    </>
  );
}
