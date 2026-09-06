"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Clock, Hash, Loader2, PlayCircle } from "lucide-react";
import type { OpcoesSimulado } from "@/lib/simulados/simulados-data";
import {
  SIMULADO_DURACOES_MIN,
  SIMULADO_DURACAO_PADRAO_MIN,
  SIMULADO_QUANTIDADES,
  SIMULADO_QTD_MAX,
  SIMULADO_QTD_MIN,
  SIMULADO_QTD_PADRAO,
} from "@/lib/simulados/constantes";
import { montarSimuladoAction } from "@/lib/simulados/actions";

const ERROS: Record<string, string> = {
  limite: "Você já usou seu simulado grátis desta semana. Assine o Pro pra montar quantos quiser.",
  sem_instituicao: "Não encontramos provas da sua universidade pra montar o simulado.",
  sem_questoes: "Não há questões suficientes nos tópicos escolhidos. Selecione mais tópicos.",
  invalido: "Não foi possível montar o simulado. Revise as opções e tente de novo.",
};

function rotuloDuracao(min: number): string {
  return min % 60 === 0 ? `${min / 60}h` : `${min}min`;
}

export function MontadorSimulado({ opcoes }: { opcoes: OpcoesSimulado }) {
  const router = useRouter();
  const [expandida, setExpandida] = useState<string | null>(opcoes.materias[0]?.id ?? null);
  const [topicosSel, setTopicosSel] = useState<Set<string>>(new Set());
  const [duracao, setDuracao] = useState<number>(SIMULADO_DURACAO_PADRAO_MIN);
  const [quantidade, setQuantidade] = useState<number>(SIMULADO_QTD_PADRAO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Contagem de questões disponíveis nos tópicos escolhidos + matérias tocadas.
  const { disponiveis, materiaIdsSel, materiaNomesSel } = useMemo(() => {
    let disp = 0;
    const mids = new Set<string>();
    const mnomes: string[] = [];
    for (const m of opcoes.materias) {
      let algum = false;
      for (const t of m.topicos) {
        if (topicosSel.has(t.id)) {
          disp += t.questoes;
          algum = true;
        }
      }
      if (algum) {
        mids.add(m.id);
        mnomes.push(m.nome);
      }
    }
    return { disponiveis: disp, materiaIdsSel: [...mids], materiaNomesSel: mnomes };
  }, [topicosSel, opcoes.materias]);

  const tetoQtd = Math.min(SIMULADO_QTD_MAX, disponiveis);
  const qtdEfetiva = Math.min(quantidade, Math.max(SIMULADO_QTD_MIN, tetoQtd));
  const podeIniciar = topicosSel.size > 0 && disponiveis >= SIMULADO_QTD_MIN && !enviando;

  function alternarTopico(id: string) {
    setErro(null);
    setTopicosSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function alternarMateriaInteira(materiaId: string) {
    const m = opcoes.materias.find((x) => x.id === materiaId);
    if (!m) return;
    const todosMarcados = m.topicos.every((t) => topicosSel.has(t.id));
    setTopicosSel((prev) => {
      const n = new Set(prev);
      m.topicos.forEach((t) => (todosMarcados ? n.delete(t.id) : n.add(t.id)));
      return n;
    });
  }

  async function iniciar() {
    if (!podeIniciar) return;
    setEnviando(true);
    setErro(null);
    const r = await montarSimuladoAction({
      topicIds: [...topicosSel],
      materiaIds: materiaIdsSel,
      materiaNomes: materiaNomesSel,
      duracaoMin: duracao,
      quantidade: qtdEfetiva,
    });
    if (r.ok) {
      router.push(`/simulados/${r.id}`);
    } else {
      setErro(ERROS[r.erro] ?? ERROS.invalido);
      setEnviando(false);
    }
  }

  return (
    <div className="pb-28 xl:pb-0">
      <div className="flex flex-col gap-5">
        {/* 1. Conteúdo */}
        <section className="surface p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-questly-green text-[11px] font-bold text-white dark:text-[#0c1512]">1</span>
            <h2 className="text-sm font-bold">O que vai cair no simulado?</h2>
          </div>
          <p className="mb-3 pl-8 text-xs text-muted-foreground">
            Escolha as disciplinas e tópicos — as questões saem de {opcoes.nomeInstituicao}, de anos variados.
          </p>

          <div className="flex flex-col gap-2">
            {opcoes.materias.map((m) => {
              const aberta = expandida === m.id;
              const marcadosNaMateria = m.topicos.filter((t) => topicosSel.has(t.id)).length;
              const todos = marcadosNaMateria === m.topicos.length;
              return (
                <div key={m.id} className="rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 p-2.5 pl-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandida(aberta ? null : m.id)}
                      aria-expanded={aberta}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{m.nome}</span>
                      {marcadosNaMateria > 0 && (
                        <span className="tnum shrink-0 rounded-full bg-questly-green-light px-2 py-0.5 text-[10.5px] font-bold text-questly-green-dark">
                          {marcadosNaMateria} selec.
                        </span>
                      )}
                      <span className="tnum shrink-0 text-[10.5px] font-bold text-muted-foreground">{m.questoes}q</span>
                      <ChevronDown size={15} className={`shrink-0 text-muted-foreground transition-transform ${aberta ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {aberta && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-1.5 border-t border-border/60 p-3">
                          <button
                            type="button"
                            onClick={() => alternarMateriaInteira(m.id)}
                            className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                              todos
                                ? "border-questly-green bg-questly-green text-white dark:text-[#0c1512]"
                                : "border-border text-muted-foreground hover:border-questly-green/40"
                            }`}
                          >
                            {todos ? "Desmarcar todos" : "Todos os tópicos"}
                          </button>
                          {m.topicos.map((t) => {
                            const sel = topicosSel.has(t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => alternarTopico(t.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                                  sel
                                    ? "border-questly-green bg-questly-green-light text-questly-green-dark"
                                    : "border-border hover:border-questly-green/40"
                                }`}
                              >
                                {sel && <CheckCircle2 size={12} />}
                                {t.nome}
                                <span className="tnum font-bold opacity-60">{t.questoes}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Duração */}
        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-questly-green text-[11px] font-bold text-white dark:text-[#0c1512]">2</span>
            <h2 className="text-sm font-bold">Quanto tempo você tem?</h2>
            <Clock size={15} className="text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-2 pl-8">
            {SIMULADO_DURACOES_MIN.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setDuracao(min)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                  duracao === min
                    ? "border-questly-green bg-questly-green-light text-questly-green-dark"
                    : "border-border text-muted-foreground hover:border-questly-green/40"
                }`}
              >
                {rotuloDuracao(min)}
              </button>
            ))}
          </div>
        </section>

        {/* 3. Quantidade */}
        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-questly-green text-[11px] font-bold text-white dark:text-[#0c1512]">3</span>
            <h2 className="text-sm font-bold">Quantas questões?</h2>
            <Hash size={15} className="text-muted-foreground" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-8">
            {SIMULADO_QUANTIDADES.map((q) => {
              const desabilitada = q > tetoQtd;
              return (
                <button
                  key={q}
                  type="button"
                  disabled={desabilitada}
                  onClick={() => setQuantidade(q)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    quantidade === q && !desabilitada
                      ? "border-questly-green bg-questly-green-light text-questly-green-dark"
                      : "border-border text-muted-foreground hover:border-questly-green/40"
                  }`}
                >
                  {q}
                </button>
              );
            })}
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              ou
              <input
                type="number"
                min={SIMULADO_QTD_MIN}
                max={tetoQtd || SIMULADO_QTD_MAX}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value) || SIMULADO_QTD_MIN)}
                className="tnum w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-questly-green"
              />
            </label>
          </div>
          {topicosSel.size > 0 && (
            <p className="mt-2.5 pl-8 text-xs text-muted-foreground">
              {disponiveis} questões disponíveis no seu recorte
              {qtdEfetiva < quantidade && <span className="font-semibold text-questly-gold-dark"> — o simulado usará {qtdEfetiva}</span>}.
            </p>
          )}
        </section>

        {erro && (
          <p className="rounded-xl border border-questly-red/40 bg-questly-red-light/60 px-4 py-3 text-sm font-medium text-questly-red-dark">
            {erro}
          </p>
        )}
      </div>

      {/* Barra de ação (sticky no mobile, inline no desktop) */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:bottom-0 xl:static xl:mt-5 xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1000px] items-center gap-3 px-1">
          <div className="tnum min-w-0 flex-1 text-xs font-medium text-muted-foreground">
            <span className="font-bold text-foreground">{qtdEfetiva}</span> questões ·{" "}
            <span className="font-bold text-foreground">{rotuloDuracao(duracao)}</span>
          </div>
          <button
            type="button"
            onClick={iniciar}
            disabled={!podeIniciar}
            className="inline-flex items-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#0c1512]"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={17} />}
            {enviando ? "Montando…" : "Iniciar simulado"}
          </button>
        </div>
      </div>
    </div>
  );
}
