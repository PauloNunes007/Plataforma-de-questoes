"use client";

// O "encontro com o Boss" no fim da trilha: card com a barra de preparo
// (estilo HP) e um formulário inline pra cadastrar/editar a prova sem
// sair pra /configuracoes. Extraído do antigo caminho-disciplina.tsx
// (quest-log substituído pela jornada 2.5D); reaproveitado pelo rail da
// CaminhoJornada.
//
// Além de nome+data, o formulário pergunta O QUE CAI NA PROVA (escopo de
// tópicos, bosses.topico_ids) — o dado obrigatório do preditivo: sem ele
// a nota projetada e a rota do GPS assumem a ementa inteira, e uma P1
// parcial sai com a nota esmagada por tópicos que nem caem.
import { useState } from "react";
import { Castle, ListChecks, Pencil, Swords, TriangleAlert } from "lucide-react";
import { salvarProvaTrilhaAction } from "@/lib/trilha/actions";

export type TopicoEscopo = { id: string; nome: string };

export function BossEncontro({
  subjectId,
  bossId,
  bossNome,
  bossData,
  diasAteProva,
  preparoPercentual,
  chanceAprovacao,
  topicosEmenta,
  bossTopicoIds,
  onSalvo,
}: {
  subjectId: string;
  bossId: string | null;
  bossNome: string | null;
  bossData: string | null;
  diasAteProva: number | null;
  preparoPercentual: number;
  chanceAprovacao: number | null;
  topicosEmenta: TopicoEscopo[];
  bossTopicoIds: string[] | null;
  onSalvo: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(bossNome || "Prova");
  const [data, setData] = useState(bossData ? bossData.slice(0, 10) : "");
  const [escopo, setEscopo] = useState<Set<string>>(new Set(bossTopicoIds || []));
  const [salvando, setSalvando] = useState(false);

  const escopoDefinido = (bossTopicoIds?.length ?? 0) > 0;

  function alternarTopico(id: string) {
    setEscopo((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function salvar() {
    if (!data) return;
    setSalvando(true);
    await salvarProvaTrilhaAction({
      subjectId,
      bossId,
      nome: nome || "Prova",
      dataProva: data,
      topicoIds: Array.from(escopo),
    });
    setSalvando(false);
    setEditando(false);
    onSalvo();
  }

  if (editando || !bossNome) {
    return (
      <div className="surface p-5">
        <h3 className="mb-1 flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <Castle size={16} strokeWidth={1.75} className="text-questly-orange" />
          {bossNome ? "Editar a prova" : "Cadastrar o Boss dessa trilha"}
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          {bossNome
            ? "Mudou a data ou o conteúdo? Atualize direto por aqui."
            : "Sua trilha ainda não tem um Boss no fim dela — cadastre a data da prova."}
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Nome da prova
            </span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: P2, Prova final..."
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-questly-orange focus:ring-2 focus:ring-questly-orange/20"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Data da prova
            </span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-questly-orange focus:ring-2 focus:ring-questly-orange/20"
            />
          </label>

          {topicosEmenta.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  O que cai nessa prova?
                </span>
                <span className="flex gap-2 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setEscopo(new Set(topicosEmenta.map((t) => t.id)))}
                    className="cursor-pointer text-questly-orange transition-colors hover:brightness-110"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscopo(new Set())}
                    className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Limpar
                  </button>
                </span>
              </div>
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-input p-2">
                {topicosEmenta.map((t) => {
                  const marcado = escopo.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="checkbox"
                      aria-checked={marcado}
                      onClick={() => alternarTopico(t.id)}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                        marcado
                          ? "bg-questly-orange-light font-medium text-questly-orange-dark"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          marcado
                            ? "border-questly-orange bg-questly-orange text-white"
                            : "border-border bg-background"
                        }`}
                      >
                        {marcado && "✓"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.nome}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {escopo.size > 0 ? (
                  <>
                    A nota projetada e a rota do GPS vão considerar só esses{" "}
                    <span className="tnum font-medium">{escopo.size}</span>{" "}
                    {escopo.size === 1 ? "tópico" : "tópicos"}.
                  </>
                ) : (
                  "Nenhum marcado = a projeção considera a ementa inteira (menos preciso)."
                )}
              </p>
            </div>
          )}

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || !data}
              className="flex-1 cursor-pointer rounded-xl bg-questly-orange px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#241703]"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            {bossNome && (
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-[0.08] blur-2xl dark:opacity-[0.12]"
        style={{ background: "var(--questly-orange)" }}
      />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-questly-orange">
            <Castle size={13} strokeWidth={2} />
            Fim da trilha
          </span>
          {diasAteProva != null && (
            <span className="tnum rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              em {diasAteProva} {diasAteProva === 1 ? "dia" : "dias"}
            </span>
          )}
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-orange-light">
            <Swords size={19} strokeWidth={1.75} className="text-questly-orange" />
          </span>
          <h3 className="font-heading text-lg font-semibold tracking-tight">{bossNome}</h3>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-questly-orange transition-[width] duration-700"
            style={{ width: `${Math.min(100, preparoPercentual)}%` }}
          />
        </div>
        <div className="mb-3 mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tnum">{Math.round(preparoPercentual)}% preparado</span>
          {chanceAprovacao != null && <span className="tnum">chance {chanceAprovacao}%</span>}
        </div>

        {/* escopo da prova: o dado que torna a projeção honesta */}
        {topicosEmenta.length > 0 &&
          (escopoDefinido ? (
            <p className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ListChecks size={13} strokeWidth={2} className="shrink-0 text-questly-orange" />
              <span className="tnum">
                cai na prova: {bossTopicoIds!.length} de {topicosEmenta.length} tópicos
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="mb-3 flex w-full cursor-pointer items-start gap-2 rounded-lg bg-questly-orange-light px-3 py-2 text-left text-xs leading-relaxed text-questly-orange-dark transition-all hover:brightness-95"
            >
              <TriangleAlert size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Marque o que cai nessa prova.</span> Sem isso, a
                nota projetada e o GPS consideram a ementa inteira.
              </span>
            </button>
          ))}

        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil size={12} strokeWidth={1.75} />
          Editar prova e conteúdo
        </button>
      </div>
    </div>
  );
}
