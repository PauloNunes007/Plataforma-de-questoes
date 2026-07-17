"use client";

import { useRef, useState } from "react";
import { BookOpenText, Check, CheckCircle2, Loader2, NotebookPen } from "lucide-react";
import { ModalAprovacao } from "./modal";
import { salvarFichamentoAction, salvarProgressoObraAction } from "@/lib/aprovacao/actions";
import type { Fichamento, ObraComProgresso } from "@/lib/aprovacao/tipos";

// Rastreador de obras literárias: 9 da Unicamp + 5 da Fuvest, cada uma
// com progresso de leitura (página atual/total → %) e um fichamento de
// 5 campos que salva sozinho enquanto digita (debounce de 1s).

const FICHAMENTO_VAZIO: Fichamento = { enredo: "", narrador: "", temas: "", contexto: "", trechos: "" };

const CAMPOS_FICHAMENTO: { chave: keyof Fichamento; rotulo: string; dica: string }[] = [
  { chave: "enredo", rotulo: "Enredo / estrutura", dica: "O que acontece, como o livro é organizado…" },
  { chave: "narrador", rotulo: "Narrador e foco narrativo", dica: "Quem narra, em que pessoa, com que efeito…" },
  { chave: "temas", rotulo: "3–5 temas centrais", dica: "Os grandes temas que a banca costuma cobrar…" },
  { chave: "contexto", rotulo: "Contexto do autor / movimento", dica: "Época, escola literária, biografia relevante…" },
  { chave: "trechos", rotulo: "2–3 trechos-chave", dica: "Citações que resumem a obra e caem em prova…" },
];

function formatarData(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ObrasView({ obrasIniciais, hoje }: { obrasIniciais: ObraComProgresso[]; hoje: string }) {
  const [obras, setObras] = useState<ObraComProgresso[]>(obrasIniciais);
  const [fichando, setFichando] = useState<ObraComProgresso | null>(null);

  const concluidas = obras.filter((o) => o.progresso?.concluida).length;
  const pctGlobal = obras.length > 0 ? Math.round((concluidas / obras.length) * 100) : 0;

  function trocarObra(id: number, patch: Partial<NonNullable<ObraComProgresso["progresso"]>>) {
    setObras((lista) =>
      lista.map((o) =>
        o.id === id
          ? {
              ...o,
              progresso: {
                obraId: o.id,
                paginaAtual: 0,
                totalPaginas: null,
                percentual: 0,
                fichamento: FICHAMENTO_VAZIO,
                concluida: false,
                ...(o.progresso || {}),
                ...patch,
              },
            }
          : o,
      ),
    );
  }

  const secoes = [
    { banca: "Unicamp", cor: "text-questly-orange", corBarra: "bg-questly-orange" },
    { banca: "Fuvest", cor: "text-questly-blue", corBarra: "bg-questly-blue" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Barra global */}
      <div className="surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 font-heading text-[15px] font-semibold">
            <BookOpenText size={16} strokeWidth={2} className="text-questly-purple" />
            Progresso geral
          </span>
          <span className="tnum text-[14px] font-bold">
            {concluidas}
            <span className="font-medium text-muted-foreground">/{obras.length} obras concluídas</span>
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-questly-purple transition-all" style={{ width: `${pctGlobal}%` }} />
        </div>
      </div>

      {secoes.map((secao) => {
        const daBanca = obras.filter((o) => o.banca === secao.banca);
        if (daBanca.length === 0) return null;
        return (
          <section key={secao.banca}>
            <h2 className={`mb-2.5 flex items-center gap-2 font-heading text-[16px] font-semibold ${secao.cor}`}>
              {secao.banca}
              <span className="text-[12px] font-medium text-muted-foreground">
                {daBanca.filter((o) => o.progresso?.concluida).length}/{daBanca.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {daBanca.map((obra) => (
                <ObraCard
                  key={obra.id}
                  obra={obra}
                  hoje={hoje}
                  corBarra={secao.corBarra}
                  onProgresso={(patch) => trocarObra(obra.id, patch)}
                  onFichar={() => setFichando(obra)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <ModalAprovacao
        aberto={!!fichando}
        titulo={fichando ? `Fichamento — ${fichando.titulo}` : "Fichamento"}
        onFechar={() => setFichando(null)}
        largura="max-w-3xl"
      >
        {fichando && (
          <FichamentoEditor
            obraId={fichando.id}
            inicial={fichando.progresso?.fichamento || FICHAMENTO_VAZIO}
            onMudou={(fich) => trocarObra(fichando.id, { fichamento: fich })}
          />
        )}
      </ModalAprovacao>
    </div>
  );
}

function ObraCard({
  obra,
  hoje,
  corBarra,
  onProgresso,
  onFichar,
}: {
  obra: ObraComProgresso;
  hoje: string;
  corBarra: string;
  onProgresso: (patch: Partial<NonNullable<ObraComProgresso["progresso"]>>) => void;
  onFichar: () => void;
}) {
  const progresso = obra.progresso;
  const [editando, setEditando] = useState(false);
  const [pagina, setPagina] = useState(progresso?.paginaAtual ? String(progresso.paginaAtual) : "");
  const [total, setTotal] = useState(progresso?.totalPaginas ? String(progresso.totalPaginas) : "");
  const [salvando, setSalvando] = useState(false);

  const pct = progresso?.percentual ?? 0;
  const concluida = !!progresso?.concluida;
  const atrasada = !concluida && !!obra.dataAlvoConclusao && obra.dataAlvoConclusao < hoje;

  async function salvarProgresso() {
    setSalvando(true);
    const res = await salvarProgressoObraAction({
      obraId: obra.id,
      paginaAtual: Number(pagina) || 0,
      totalPaginas: total ? Number(total) : null,
    });
    setSalvando(false);
    if (res.ok) {
      onProgresso({
        paginaAtual: Number(pagina) || 0,
        totalPaginas: total ? Number(total) : null,
        percentual: res.percentual,
        concluida: res.concluida,
      });
      setEditando(false);
    }
  }

  return (
    <article className={`surface flex flex-col gap-2.5 p-4 ${concluida ? "border-questly-green/35" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold leading-snug">{obra.titulo}</h3>
          <p className="text-[12px] text-muted-foreground">{obra.autor}</p>
        </div>
        {concluida && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-questly-green/10 px-2 py-0.5 text-[10.5px] font-bold text-questly-green">
            <CheckCircle2 size={11} strokeWidth={2.5} /> Lida
          </span>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11.5px]">
          <span className="tnum font-semibold">{pct}%</span>
          {obra.dataAlvoConclusao && (
            <span className={atrasada ? "font-semibold text-questly-orange" : "text-muted-foreground"}>
              alvo {formatarData(obra.dataAlvoConclusao)}
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${concluida ? "bg-questly-green" : corBarra}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {progresso?.totalPaginas ? (
          <p className="tnum mt-1 text-[11px] text-muted-foreground">
            pág. {progresso.paginaAtual} de {progresso.totalPaginas}
          </p>
        ) : null}
      </div>

      {editando ? (
        <div className="flex items-end gap-2">
          <label className="block flex-1">
            <span className="mb-0.5 block text-[10.5px] font-semibold text-muted-foreground">Pág. atual</span>
            <input
              type="number"
              min={0}
              value={pagina}
              onChange={(e) => setPagina(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-questly-green/60"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-0.5 block text-[10.5px] font-semibold text-muted-foreground">Total</span>
            <input
              type="number"
              min={1}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-questly-green/60"
            />
          </label>
          <button
            type="button"
            onClick={() => void salvarProgresso()}
            disabled={salvando}
            aria-label="Salvar progresso"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-questly-green text-white shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 dark:text-[#0c1512]"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />}
          </button>
        </div>
      ) : (
        <div className="mt-auto flex gap-2">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex-1 cursor-pointer rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Atualizar progresso
          </button>
          <button
            type="button"
            onClick={onFichar}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-questly-purple/30 px-2.5 py-1.5 text-[12px] font-semibold text-questly-purple transition-colors hover:bg-questly-purple/10"
          >
            <NotebookPen size={12.5} strokeWidth={2} /> Fichamento
          </button>
        </div>
      )}
    </article>
  );
}

// Autosave com debounce de 1s: o timer vive num ref e é rearmado a cada
// tecla (sem useEffect — evita as regras react-hooks/set-state-in-effect).
function FichamentoEditor({
  obraId,
  inicial,
  onMudou,
}: {
  obraId: number;
  inicial: Fichamento;
  onMudou: (fich: Fichamento) => void;
}) {
  const [fich, setFich] = useState<Fichamento>(inicial);
  const [status, setStatus] = useState<"parado" | "salvando" | "salvo">("parado");
  const timer = useRef<number | null>(null);
  const atual = useRef<Fichamento>(inicial);

  function mudar(chave: keyof Fichamento, valor: string) {
    const novo = { ...atual.current, [chave]: valor };
    atual.current = novo;
    setFich(novo);
    onMudou(novo);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setStatus("salvando");
      void salvarFichamentoAction({ obraId, fichamento: atual.current }).then((res) => {
        setStatus(res.ok ? "salvo" : "parado");
      });
    }, 1000);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-end gap-1.5 text-[11.5px] font-medium text-muted-foreground">
        {status === "salvando" && (
          <>
            <Loader2 size={12} className="animate-spin" /> Salvando…
          </>
        )}
        {status === "salvo" && (
          <>
            <Check size={12} strokeWidth={2.5} className="text-questly-green" /> Salvo
          </>
        )}
        {status === "parado" && <span>Salva sozinho enquanto você digita</span>}
      </div>
      {CAMPOS_FICHAMENTO.map((campo) => (
        <label key={campo.chave} className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">{campo.rotulo}</span>
          <textarea
            value={fich[campo.chave]}
            onChange={(e) => mudar(campo.chave, e.target.value)}
            rows={3}
            placeholder={campo.dica}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px] leading-relaxed outline-none transition-colors focus:border-questly-purple/50 focus:ring-2 focus:ring-questly-purple/10"
          />
        </label>
      ))}
    </div>
  );
}
