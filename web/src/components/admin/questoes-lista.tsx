"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageIcon, Pencil, Search, ShieldCheck, Trash2 } from "lucide-react";
import { buscarQuestoesAdminAction, excluirQuestaoAdminAction, type QuestaoAdminResumo } from "@/lib/admin/actions";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { MathText } from "@/components/questao/math-text";
import type { Materia, Topico } from "@/lib/importar/types";

const PAGE_SIZE = 20;

const INPUT =
  "rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none transition-colors focus:border-questly-purple focus:ring-4 focus:ring-questly-purple/10";

const CHIP_DIFICULDADE: Record<string, string> = {
  facil: "bg-questly-green-light text-questly-green-dark",
  medio: "bg-questly-orange-light text-questly-orange-dark",
  dificil: "bg-questly-red-light text-questly-red-dark",
};

export function QuestoesLista({
  materias,
  topicos,
  questoesIniciais,
  totalInicial,
  pendentesRelatos,
}: {
  materias: Materia[];
  topicos: Topico[];
  questoesIniciais: QuestaoAdminResumo[];
  totalInicial: number;
  pendentesRelatos: number;
}) {
  const [busca, setBusca] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [topicoId, setTopicoId] = useState("");
  const [dificuldade, setDificuldade] = useState("");
  const [pagina, setPagina] = useState(0);

  const [questoes, setQuestoes] = useState(questoesIniciais);
  const [total, setTotal] = useState(totalInicial);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const timeout = setTimeout(async () => {
      setCarregando(true);
      setErro(null);
      const resultado = await buscarQuestoesAdminAction({
        busca,
        materiaId: materiaId || null,
        topicoId: topicoId || null,
        dificuldade: dificuldade || null,
        pagina,
      });
      setCarregando(false);
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setQuestoes(resultado.questoes);
      setTotal(resultado.total);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca, materiaId, topicoId, dificuldade, pagina]);

  // Toda troca de filtro passa por aqui pra também zerar a paginação (senão
  // uma busca nova podia renderizar uma "página 3" vazia até recarregar).
  function atualizarFiltros(patch: { busca?: string; materiaId?: string; topicoId?: string; dificuldade?: string }) {
    if (patch.busca !== undefined) setBusca(patch.busca);
    if (patch.materiaId !== undefined) setMateriaId(patch.materiaId);
    if (patch.topicoId !== undefined) setTopicoId(patch.topicoId);
    if (patch.dificuldade !== undefined) setDificuldade(patch.dificuldade);
    setPagina(0);
  }

  async function excluir(id: string, enunciado: string) {
    const trecho = enunciado.length > 80 ? `${enunciado.slice(0, 80)}...` : enunciado;
    if (!confirm(`Excluir permanentemente essa questão?\n\n"${trecho}"`)) return;
    setExcluindoId(id);
    const resultado = await excluirQuestaoAdminAction(id);
    setExcluindoId(null);
    if ("error" in resultado) {
      alert(resultado.error);
      return;
    }
    setQuestoes((prev) => prev.filter((q) => q.id !== id));
    setTotal((prev) => prev - 1);
  }

  const topicosMateria = materiaId ? topicos.filter((t) => t.materia_id === materiaId) : topicos;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inicio = total === 0 ? 0 : pagina * PAGE_SIZE + 1;
  const fim = Math.min(total, (pagina + 1) * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-7 sm:px-6 lg:py-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-purple/12 text-questly-purple">
            <ShieldCheck size={22} strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Banco de questões</h1>
            <p className="text-[13px] text-muted-foreground">Editar ou excluir qualquer questão da plataforma.</p>
          </div>
        </div>
        <AdminTabs pendentes={pendentesRelatos} />
      </div>

      <div className="surface mb-4 p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => atualizarFiltros({ busca: e.target.value })}
              placeholder="Buscar pelo enunciado..."
              className={`${INPUT} w-full pl-9`}
            />
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex">
            <select
              value={materiaId}
              onChange={(e) => atualizarFiltros({ materiaId: e.target.value, topicoId: "" })}
              className={`${INPUT} font-medium`}
            >
              <option value="">Todas as matérias</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            <select
              value={topicoId}
              onChange={(e) => atualizarFiltros({ topicoId: e.target.value })}
              className={`${INPUT} font-medium`}
            >
              <option value="">Todos os tópicos</option>
              {topicosMateria.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            <select
              value={dificuldade}
              onChange={(e) => atualizarFiltros({ dificuldade: e.target.value })}
              className={`${INPUT} font-medium`}
            >
              <option value="">Dificuldade</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="tnum text-xs font-medium text-muted-foreground">
          {total === 0 ? "Nenhuma questão" : `${inicio}–${fim} de ${total} questões`}
        </span>
        {carregando && <span className="text-xs font-medium text-questly-purple">Buscando...</span>}
      </div>

      {erro && (
        <div className="mb-4 rounded-lg bg-questly-red-light px-3 py-2 text-xs font-medium text-questly-red-dark">{erro}</div>
      )}

      <div className={`surface divide-y divide-border overflow-hidden transition-opacity ${carregando ? "opacity-50" : ""}`}>
        {questoes.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Nenhuma questão encontrada com esses filtros.</p>
        ) : (
          questoes.map((q) => (
            <div key={q.id} className="group flex items-center gap-2 pr-2 transition-colors hover:bg-muted/40">
              <Link href={`/admin/questoes/${q.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13.5px] font-medium">
                    <MathText text={q.enunciado || "(sem enunciado)"} />
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {q.dificuldade && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          CHIP_DIFICULDADE[q.dificuldade] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {q.dificuldade}
                      </span>
                    )}
                    {q.materiaNome && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {q.materiaNome}
                      </span>
                    )}
                    {q.topicoNome && (
                      <span className="truncate text-[11px] text-muted-foreground">{q.topicoNome}</span>
                    )}
                    {q.temImagem && <ImageIcon size={12} strokeWidth={2} className="text-muted-foreground" />}
                  </div>
                </div>
                <span className="hidden shrink-0 items-center gap-1 text-[11.5px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex">
                  <Pencil size={12} strokeWidth={2} /> editar
                </span>
              </Link>
              <button
                type="button"
                disabled={excluindoId === q.id}
                onClick={() => excluir(q.id, q.enunciado)}
                title="Excluir questão"
                aria-label="Excluir questão"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-questly-red-light hover:text-questly-red-dark disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2 size={15} strokeWidth={1.85} />
              </button>
            </div>
          ))
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={pagina === 0}
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span className="tnum text-[13px] font-medium text-muted-foreground">
            {pagina + 1} / {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
