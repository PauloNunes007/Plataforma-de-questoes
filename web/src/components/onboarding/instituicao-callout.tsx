"use client";

// Passo 2 do onboarding (universidade): valida o texto contra o banco de
// questões e, se temos provas daquela instituição, mostra um selo de
// verificação (padrão fintech "Trust & Authority") com a contagem real de
// questões por disciplina/tópico — e deixa o aluno já adicionar essas
// disciplinas à campanha. Debounce + aria-live; estado honesto quando não temos.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, ChevronDown, Loader2, Plus } from "lucide-react";
import { validarInstituicaoAction, type ResultadoInstituicao } from "@/lib/cursos/actions";

type Props = {
  universidade: string;
  disciplinasSelecionadas: string[];
  onAdicionar: (nomes: string[]) => void;
};

export function InstituicaoCallout({ universidade, disciplinasSelecionadas, onAdicionar }: Props) {
  const [resultado, setResultado] = useState<ResultadoInstituicao | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [expandida, setExpandida] = useState<string | null>(null);
  const reduzir = useReducedMotion();
  const pedidoRef = useRef(0);

  const termo = universidade.trim();

  useEffect(() => {
    // Todo setState fica dentro do callback assíncrono (nunca síncrono no corpo
    // do efeito) — exigência do compilador React 19 (react-hooks/set-state-in-effect).
    const pedido = ++pedidoRef.current;
    const curto = termo.length < 2;
    const t = setTimeout(async () => {
      if (pedido !== pedidoRef.current) return;
      if (curto) {
        setResultado(null);
        setCarregando(false);
        return;
      }
      setCarregando(true);
      const r = await validarInstituicaoAction(termo);
      if (pedido !== pedidoRef.current) return; // resposta obsoleta
      setResultado(r);
      setCarregando(false);
    }, curto ? 0 : 500);
    return () => clearTimeout(t);
  }, [termo]);

  if (termo.length < 2) return null;

  return (
    <div className="mt-5" aria-live="polite">
      <AnimatePresence mode="wait">
        {carregando ? (
          <motion.div
            key="carregando"
            initial={reduzir ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/50 px-4 py-3.5 text-sm font-medium text-muted-foreground"
          >
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Procurando provas de <b className="font-semibold text-foreground">{termo}</b>…
          </motion.div>
        ) : resultado?.reconhecida ? (
          <motion.div
            key="ok"
            initial={reduzir ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-questly-green/40 bg-questly-green-light/60"
          >
            <div className="flex items-center gap-3 px-4 pt-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-green text-white shadow-sm">
                <BadgeCheck size={22} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight text-questly-green-dark">
                  Temos provas da sua universidade
                </p>
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {resultado.nomeExibicao}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="tnum font-heading text-xl font-bold leading-none text-questly-green-dark">
                  {resultado.totalQuestoes.toLocaleString("pt-BR")}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-questly-green-dark/70">
                  questões
                </div>
              </div>
            </div>

            <p className="px-4 pt-2.5 text-[11.5px] font-medium text-muted-foreground">
              Toque numa disciplina pra adicioná-la à sua campanha:
            </p>

            <div className="flex flex-col gap-1.5 p-3">
              {resultado.disciplinas.map((d, i) => {
                const jaTem = disciplinasSelecionadas.includes(d.materia);
                const aberta = expandida === d.materia;
                return (
                  <motion.div
                    key={d.materia}
                    initial={reduzir ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-2 p-2 pl-3">
                      <button
                        type="button"
                        onClick={() => setExpandida(aberta ? null : d.materia)}
                        aria-expanded={aberta}
                        aria-label={`Ver tópicos de ${d.materia}`}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{d.materia}</span>
                        <span className="tnum shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-bold text-muted-foreground">
                          {d.questoes} {d.questoes === 1 ? "questão" : "questões"}
                        </span>
                        {d.topicos.length > 0 && (
                          <ChevronDown
                            size={15}
                            className={`shrink-0 text-muted-foreground transition-transform ${aberta ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => !jaTem && onAdicionar([d.materia])}
                        disabled={jaTem}
                        className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition-colors ${
                          jaTem
                            ? "cursor-default bg-questly-green-light text-questly-green-dark"
                            : "bg-questly-green text-white hover:brightness-105"
                        }`}
                      >
                        {jaTem ? "Adicionada" : <><Plus size={13} strokeWidth={2.5} /> Adicionar</>}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {aberta && d.topicos.length > 0 && (
                        <motion.div
                          initial={reduzir ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                            {d.topicos.slice(0, 12).map((t) => (
                              <span
                                key={t.nome}
                                className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
                              >
                                {t.nome}
                                <span className="tnum ml-1 font-bold text-foreground/60">{t.questoes}</span>
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : resultado ? (
          <motion.p
            key="nao"
            initial={reduzir ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-muted/50 px-4 py-3.5 text-xs font-medium text-muted-foreground"
          >
            Ainda não temos provas catalogadas de <b className="font-semibold text-foreground">{termo}</b>{" "}
            — sem problema, seu plano de estudos funciona igual com o banco geral.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
