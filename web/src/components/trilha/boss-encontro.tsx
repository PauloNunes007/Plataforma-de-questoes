"use client";

// O "encontro com o Boss" no fim da trilha: card com a barra de preparo
// (estilo HP) e um formulário inline pra cadastrar/editar a data da prova
// sem sair pra /configuracoes. Extraído do antigo caminho-disciplina.tsx
// (quest-log substituído pela jornada 2.5D); reaproveitado pelo rail da
// CaminhoJornada.
import { useState } from "react";
import { Castle, Pencil, Swords } from "lucide-react";
import { salvarProvaTrilhaAction } from "@/lib/trilha/actions";

export function BossEncontro({
  subjectId,
  bossId,
  bossNome,
  bossData,
  diasAteProva,
  preparoPercentual,
  chanceAprovacao,
  onSalvo,
}: {
  subjectId: string;
  bossId: string | null;
  bossNome: string | null;
  bossData: string | null;
  diasAteProva: number | null;
  preparoPercentual: number;
  chanceAprovacao: number | null;
  onSalvo: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(bossNome || "Prova");
  const [data, setData] = useState(bossData ? bossData.slice(0, 10) : "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!data) return;
    setSalvando(true);
    await salvarProvaTrilhaAction({ subjectId, bossId, nome: nome || "Prova", dataProva: data });
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
            ? "Mudou a data? Atualize direto por aqui."
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
        <div className="mb-4 mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tnum">{Math.round(preparoPercentual)}% preparado</span>
          {chanceAprovacao != null && <span className="tnum">chance {chanceAprovacao}%</span>}
        </div>

        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil size={12} strokeWidth={1.75} />
          Editar data da prova
        </button>
      </div>
    </div>
  );
}
