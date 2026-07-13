"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { DisciplinaPratica, TopicoPratica } from "@/lib/disciplinas/disciplinas-data";
import {
  buscarTopicosPraticaAction,
  calcularPreviaPraticaAction,
  iniciarPraticaLivreAction,
  type PreviaPratica,
} from "@/lib/disciplinas/actions";
import { DisciplinaPicker } from "./disciplina-picker";
import { TopicoPicker } from "./topico-picker";
import { FiltrosPratica } from "./filtros-pratica";
import { ResumoPratica } from "./resumo-pratica";

const LABEL_DIFICULDADE: Record<string, string> = { facil: "Fácil", medio: "Médio", dificil: "Difícil" };

export function PraticaWizard({ disciplinas }: { disciplinas: DisciplinaPratica[] }) {
  const router = useRouter();

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [topicos, setTopicos] = useState<TopicoPratica[]>([]);
  const [carregandoTopicos, setCarregandoTopicos] = useState(false);
  const [topicosSelecionados, setTopicosSelecionados] = useState<Set<string>>(new Set());
  const [dificuldades, setDificuldades] = useState<Set<string>>(new Set());
  const [quantidade, setQuantidade] = useState<number | "todas">(10);
  const [previa, setPrevia] = useState<PreviaPratica | null>(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const disciplina = disciplinas.find((d) => d.subjectId === subjectId) || null;

  useEffect(() => {
    async function carregarTopicos() {
      if (!subjectId || !disciplina || !disciplina.materiaId) {
        setTopicos([]);
        return;
      }
      setCarregandoTopicos(true);
      setTopicosSelecionados(new Set());
      setDificuldades(new Set());
      const dados = await buscarTopicosPraticaAction(disciplina.materiaId);
      setTopicos(dados);
      setCarregandoTopicos(false);
    }
    carregarTopicos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const topicIdsAtivos =
    topicosSelecionados.size > 0 ? Array.from(topicosSelecionados) : topicos.map((t) => t.id);
  const topicIdsKey = topicIdsAtivos.slice().sort().join(",");
  const dificuldadesArr = Array.from(dificuldades).sort();
  const dificuldadesKey = dificuldadesArr.join(",");

  useEffect(() => {
    async function atualizarPrevia() {
      if (topicIdsAtivos.length === 0) {
        setPrevia(null);
        return;
      }
      setCarregandoPrevia(true);
      const res = await calcularPreviaPraticaAction(topicIdsAtivos, dificuldadesArr, quantidade);
      setPrevia(res);
      setCarregandoPrevia(false);
    }
    atualizarPrevia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicIdsKey, dificuldadesKey, quantidade]);

  async function comecarPratica() {
    if (!subjectId) return;
    setIniciando(true);
    setErro(null);
    const { missaoId } = await iniciarPraticaLivreAction({
      subjectId,
      topicIds: topicIdsAtivos,
      dificuldades: dificuldadesArr,
      quantidade,
    });
    if (missaoId) {
      router.push(`/questao?missao=${missaoId}`);
      return;
    }
    setErro("Não foi possível preparar sua prática. Tente outro filtro.");
    setIniciando(false);
  }

  if (disciplinas.length === 0) {
    return (
      <div className="surface flex flex-col items-center px-6 py-10 text-center">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <BookOpen size={18} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="mb-1 text-[15px] font-medium">Você ainda não tem disciplinas</p>
        <p className="mb-5 max-w-[360px] text-sm text-muted-foreground">
          Configure suas disciplinas pra começar a praticar.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          Configurar agora
        </Link>
      </div>
    );
  }

  const topicosLabel = topicosSelecionados.size === 0 ? "Todos os tópicos" : `${topicosSelecionados.size} selecionado(s)`;
  const dificuldadeLabel = dificuldadesArr.length === 0 ? "Todas" : dificuldadesArr.map((d) => LABEL_DIFICULDADE[d] || d).join(", ");
  const quantidadeLabel = quantidade === "todas" ? "Todas disponíveis" : `${quantidade} questões`;
  const podeComecar = Boolean(subjectId) && topicos.length > 0 && (previa?.total ?? 0) > 0 && !carregandoPrevia;

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        <div className="surface p-5 sm:p-6">
          <PassoTitulo numero={1} titulo="Escolha a disciplina" descricao="Todas as suas disciplinas cadastradas." />
          <DisciplinaPicker disciplinas={disciplinas} selecionada={subjectId} onSelecionar={setSubjectId} />
        </div>

        <AnimatePresence mode="wait">
          {subjectId && (
            <motion.div
              key={subjectId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <div className="surface p-5 sm:p-6">
                <PassoTitulo
                  numero={2}
                  titulo="Tópicos"
                  descricao="Escolha os tópicos que quer treinar — ou deixe sem marcar nenhum pra praticar a disciplina toda."
                />
                {carregandoTopicos ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                    ))}
                  </div>
                ) : topicos.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {disciplina?.materiaId
                      ? "Essa disciplina ainda não tem questões cadastradas."
                      : "Essa disciplina ainda não está ligada a um banco de questões. Cadastre-a em Configurações."}
                  </p>
                ) : (
                  <TopicoPicker
                    topicos={topicos}
                    selecionados={topicosSelecionados}
                    onToggle={(id) =>
                      setTopicosSelecionados((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                    onSelecionarTodos={() => setTopicosSelecionados(new Set(topicos.map((t) => t.id)))}
                    onLimpar={() => setTopicosSelecionados(new Set())}
                    onFocarFracos={() =>
                      setTopicosSelecionados(
                        new Set(topicos.filter((t) => t.taxaAcerto != null && t.taxaAcerto < 0.6).map((t) => t.id)),
                      )
                    }
                  />
                )}
              </div>

              {topicos.length > 0 && (
                <div className="surface p-5 sm:p-6">
                  <PassoTitulo numero={3} titulo="Dificuldade e quantidade" />
                  <FiltrosPratica
                    dificuldades={dificuldades}
                    onToggleDificuldade={(valor) =>
                      setDificuldades((prev) => {
                        const next = new Set(prev);
                        if (next.has(valor)) next.delete(valor);
                        else next.add(valor);
                        return next;
                      })
                    }
                    onLimparDificuldades={() => setDificuldades(new Set())}
                    quantidade={quantidade}
                    onQuantidade={setQuantidade}
                  />
                </div>
              )}

              {erro && <p className="text-center text-sm font-medium text-questly-red-dark">{erro}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ResumoPratica
        disciplinaNome={disciplina?.nome || null}
        topicosLabel={topicosLabel}
        dificuldadeLabel={dificuldadeLabel}
        quantidadeLabel={quantidadeLabel}
        previa={previa}
        carregandoPrevia={carregandoPrevia}
        podeComecar={podeComecar}
        iniciando={iniciando}
        onComecar={comecarPratica}
      />
    </div>
  );
}

// Título de etapa do wizard: número em selo pequeno + título/descrição —
// hierarquia discreta no lugar do "1. 2. 3." dentro do próprio h2.
function PassoTitulo({ numero, titulo, descricao }: { numero: number; titulo: string; descricao?: string }) {
  return (
    <div className={descricao ? "mb-4" : "mb-4 flex items-center gap-2.5"}>
      <div className="flex items-center gap-2.5">
        <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-questly-green-light text-xs font-semibold text-questly-green-dark">
          {numero}
        </span>
        <h2 className="text-[15px] font-semibold tracking-tight">{titulo}</h2>
      </div>
      {descricao && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{descricao}</p>}
    </div>
  );
}
