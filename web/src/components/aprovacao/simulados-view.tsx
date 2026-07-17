"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Plus, Timer, Trash2, TrendingUp } from "lucide-react";
import { ModalAprovacao } from "./modal";
import { excluirSimuladoAction, salvarSimuladoAction } from "@/lib/aprovacao/actions";
import {
  DISCIPLINAS_SIMULADO,
  MAX_QUESTOES_BANCA,
  TIPOS_ERRO,
} from "@/lib/aprovacao/constantes";
import type { EscadaItem, Simulado } from "@/lib/aprovacao/tipos";

// Rastreador de simulados: escada de domingos (próxima prova designada),
// cadastro com acertos por disciplina e gráfico de evolução em SVG puro
// (uma linha por disciplina — sem dependência de chart lib).

const CAMPO =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-questly-green/60";

const CORES_DISCIPLINA: Record<string, string> = {
  Matemática: "#2fc44c",
  Física: "#1cb0f6",
  Química: "#a560f0",
  Biologia: "#0fa968",
  História: "#ff9600",
  Geografia: "#e8563e",
  Português: "#5b21b6",
  Inglês: "#0e7490",
};

function formatarData(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

export function SimuladosView({
  simuladosIniciais,
  escada,
  hoje,
}: {
  simuladosIniciais: Simulado[];
  escada: EscadaItem[];
  hoje: string;
}) {
  const [simulados, setSimulados] = useState<Simulado[]>(simuladosIniciais);
  const [modal, setModal] = useState(false);

  const proximo = useMemo(() => escada.find((e) => e.data >= hoje) || null, [escada, hoje]);

  async function excluir(s: Simulado) {
    if (!window.confirm(`Excluir o simulado ${s.provaRef || s.banca} de ${formatarData(s.data)}?`)) return;
    const antes = simulados;
    setSimulados((lista) => lista.filter((x) => x.id !== s.id));
    const res = await excluirSimuladoAction(s.id);
    if (!res.ok) setSimulados(antes);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        {/* Próximo simulado da escada */}
        <div className="surface flex items-center gap-4 border-questly-orange/25 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-questly-orange/12 text-questly-orange">
            <CalendarClock size={20} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Próximo simulado
            </span>
            {proximo ? (
              <>
                <span className="block font-heading text-[16px] font-semibold">
                  {proximo.prova} · {formatarData(proximo.data)}
                </span>
                {proximo.funcao && <span className="block text-[13px] text-muted-foreground">{proximo.funcao}</span>}
              </>
            ) : (
              <span className="block text-[14px] font-medium text-muted-foreground">
                A escada acabou — reta final! Revise pelos erros.
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModal(true)}
          className="flex cursor-pointer items-center justify-center gap-1.5 self-center rounded-lg bg-questly-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          <Plus size={16} strokeWidth={2.25} /> Novo simulado
        </button>
      </div>

      {simulados.length >= 2 && <GraficoEvolucao simulados={simulados} />}

      {simulados.length === 0 ? (
        <div className="surface flex flex-col items-center gap-1.5 p-10 text-center">
          <Timer size={22} strokeWidth={1.75} className="text-questly-orange" />
          <p className="text-sm font-semibold">Nenhum simulado registrado ainda.</p>
          <p className="text-[12.5px] text-muted-foreground">
            Depois de cada domingo de simulado, registre os acertos por disciplina pra acompanhar a evolução.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {simulados.map((s) => (
            <SimuladoCard key={s.id} simulado={s} onExcluir={() => void excluir(s)} />
          ))}
        </div>
      )}

      <ModalAprovacao aberto={modal} titulo="Novo simulado" onFechar={() => setModal(false)}>
        <SimuladoForm
          hoje={hoje}
          escada={escada}
          onSalvo={(novo) => {
            setSimulados((lista) =>
              [novo, ...lista].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)),
            );
            setModal(false);
          }}
          onCancelar={() => setModal(false)}
        />
      </ModalAprovacao>
    </div>
  );
}

function SimuladoCard({ simulado, onExcluir }: { simulado: Simulado; onExcluir: () => void }) {
  const max = MAX_QUESTOES_BANCA[simulado.banca] || null;
  const pct = max ? Math.round((simulado.totalQuestoes / max) * 100) : null;
  const disciplinas = Object.entries(simulado.acertos);
  const maiorAcerto = Math.max(...disciplinas.map(([, n]) => n), 1);

  return (
    <article className="surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${
            simulado.banca === "Unicamp" ? "bg-questly-orange" : "bg-questly-blue"
          }`}
        >
          {simulado.banca}
        </span>
        <span className="text-[14px] font-semibold">{simulado.provaRef || "Simulado"}</span>
        <span className="text-[12.5px] text-muted-foreground">· {formatarData(simulado.data)}</span>
        {simulado.tempoMin ? (
          <span className="text-[12.5px] text-muted-foreground">· {simulado.tempoMin} min</span>
        ) : null}
        <span className="tnum ml-auto text-[15px] font-bold">
          {simulado.totalQuestoes}
          {max && <span className="font-medium text-muted-foreground">/{max}</span>}
          {pct !== null && <span className="ml-1.5 text-questly-green">{pct}%</span>}
        </span>
        <button
          type="button"
          onClick={onExcluir}
          aria-label="Excluir simulado"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-questly-red/10 hover:text-questly-red"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>

      {disciplinas.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {disciplinas.map(([disc, qtd]) => (
            <div key={disc} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-[12px] font-medium text-muted-foreground">{disc}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((qtd / maiorAcerto) * 100)}%`,
                    background: CORES_DISCIPLINA[disc] || "#94a3b8",
                  }}
                />
              </div>
              <span className="tnum w-6 shrink-0 text-right text-[12px] font-bold">{qtd}</span>
            </div>
          ))}
        </div>
      )}

      {simulado.errosPorTipo && Object.values(simulado.errosPorTipo).some((n) => n > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TIPOS_ERRO.map((t) => {
            const n = simulado.errosPorTipo?.[t.id] || 0;
            if (!n) return null;
            return (
              <span key={t.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {t.rotulo}: <strong>{n}</strong>
              </span>
            );
          })}
        </div>
      )}

      {simulado.observacoes && (
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">{simulado.observacoes}</p>
      )}
    </article>
  );
}

// Gráfico de evolução: SVG puro, X = simulados em ordem cronológica,
// Y = acertos por disciplina (contagem — as provas não expõem o total
// por disciplina, então % por disciplina seria inventado).
function GraficoEvolucao({ simulados }: { simulados: Simulado[] }) {
  const [fBanca, setFBanca] = useState<string>("");

  const cronologicos = useMemo(
    () =>
      [...simulados]
        .filter((s) => !fBanca || s.banca === fBanca)
        .sort((a, b) => (a.data < b.data ? -1 : 1)),
    [simulados, fBanca],
  );

  const disciplinas = useMemo(() => {
    const set = new Set<string>();
    cronologicos.forEach((s) => Object.keys(s.acertos).forEach((d) => set.add(d)));
    return Array.from(set);
  }, [cronologicos]);

  if (cronologicos.length < 2 || disciplinas.length === 0) return null;

  const W = 640;
  const H = 240;
  const PAD = { top: 12, right: 16, bottom: 26, left: 30 };
  const maxY = Math.max(...cronologicos.flatMap((s) => Object.values(s.acertos)), 4);
  const passoX = (W - PAD.left - PAD.right) / (cronologicos.length - 1);
  const escalaY = (v: number) => H - PAD.bottom - (v / maxY) * (H - PAD.top - PAD.bottom);

  return (
    <section className="surface p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-heading text-[15px] font-semibold">
          <TrendingUp size={16} strokeWidth={2} className="text-questly-blue" />
          Evolução por disciplina
        </h3>
        <div className="flex gap-1.5">
          {["", "Unicamp", "Fuvest"].map((b) => (
            <button
              key={b || "todas"}
              type="button"
              onClick={() => setFBanca(b)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
                fBanca === b
                  ? "border-questly-blue/40 bg-questly-blue/10 text-questly-blue"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {b || "Todas"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[480px]" role="img" aria-label="Evolução de acertos por disciplina">
          {/* linhas de grade horizontais */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = Math.round(maxY * f);
            const yy = escalaY(v);
            return (
              <g key={f}>
                <line x1={PAD.left} x2={W - PAD.right} y1={yy} y2={yy} stroke="currentColor" strokeOpacity={0.08} />
                <text x={PAD.left - 6} y={yy + 3.5} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.45}>
                  {v}
                </text>
              </g>
            );
          })}
          {/* rótulos do eixo X */}
          {cronologicos.map((s, i) => (
            <text
              key={s.id}
              x={PAD.left + i * passoX}
              y={H - 8}
              textAnchor="middle"
              fontSize={9.5}
              fill="currentColor"
              fillOpacity={0.5}
            >
              {formatarData(s.data).slice(0, 5)}
            </text>
          ))}
          {/* uma polyline por disciplina */}
          {disciplinas.map((disc) => {
            const cor = CORES_DISCIPLINA[disc] || "#94a3b8";
            const pontos = cronologicos
              .map((s, i) =>
                disc in s.acertos ? { x: PAD.left + i * passoX, y: escalaY(s.acertos[disc]) } : null,
              )
              .filter((p): p is { x: number; y: number } => p !== null);
            if (pontos.length === 0) return null;
            return (
              <g key={disc}>
                {pontos.length > 1 && (
                  <polyline
                    points={pontos.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={cor}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {pontos.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill={cor} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {disciplinas.map((disc) => (
          <span key={disc} className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: CORES_DISCIPLINA[disc] || "#94a3b8" }} />
            {disc}
          </span>
        ))}
      </div>
    </section>
  );
}

function SimuladoForm({
  hoje,
  escada,
  onSalvo,
  onCancelar,
}: {
  hoje: string;
  escada: EscadaItem[];
  onSalvo: (s: Simulado) => void;
  onCancelar: () => void;
}) {
  const sugestao = useMemo(() => escada.find((e) => e.data >= hoje) || null, [escada, hoje]);
  const [data, setData] = useState(hoje);
  const [banca, setBanca] = useState<string>(
    sugestao?.prova.toLowerCase().includes("fuvest") ? "Fuvest" : "Unicamp",
  );
  const [provaRef, setProvaRef] = useState(sugestao?.prova || "");
  const [acertos, setAcertos] = useState<Record<string, string>>({});
  const [tempoMin, setTempoMin] = useState("");
  const [errosTipo, setErrosTipo] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const max = MAX_QUESTOES_BANCA[banca] || null;
  const total = Object.values(acertos).reduce((s, v) => s + (Number(v) || 0), 0);

  async function salvar() {
    if (max && total > max) {
      setMensagem(`O total (${total}) passa do máximo da ${banca} (${max} questões).`);
      return;
    }
    setSalvando(true);
    setMensagem(null);
    const acertosNum: Record<string, number> = {};
    Object.entries(acertos).forEach(([d, v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) acertosNum[d] = n;
    });
    const errosNum: Record<string, number> = {};
    Object.entries(errosTipo).forEach(([t, v]) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) errosNum[t] = n;
    });
    const res = await salvarSimuladoAction({
      data,
      banca,
      provaRef: provaRef || null,
      acertos: acertosNum,
      tempoMin: tempoMin ? Number(tempoMin) : null,
      errosPorTipo: Object.keys(errosNum).length ? errosNum : null,
      observacoes: observacoes || null,
    });
    setSalvando(false);
    if (res.ok && res.simulado) onSalvo(res.simulado);
    else setMensagem("Não consegui salvar. Confira a migração supabase_modo_aprovacao.sql.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Data</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Banca</span>
          <select value={banca} onChange={(e) => setBanca(e.target.value)} className={CAMPO}>
            <option value="Unicamp">Unicamp (máx. 72)</option>
            <option value="Fuvest">Fuvest (máx. 80)</option>
          </select>
        </label>
        <label className="col-span-2 block sm:col-span-1">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Prova de referência</span>
          <input
            value={provaRef}
            onChange={(e) => setProvaRef(e.target.value)}
            list="escada-provas"
            placeholder="Unicamp 2022"
            className={CAMPO}
          />
          <datalist id="escada-provas">
            {escada.map((e) => (
              <option key={e.data} value={e.prova} />
            ))}
          </datalist>
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-[12px] font-semibold text-muted-foreground">
          Acertos por disciplina{" "}
          <span className="tnum font-bold text-foreground">
            · total {total}
            {max ? `/${max}` : ""}
          </span>
        </span>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DISCIPLINAS_SIMULADO.map((d) => (
            <label key={d} className="block">
              <span className="mb-0.5 block truncate text-[11px] font-medium text-muted-foreground">{d}</span>
              <input
                type="number"
                min={0}
                max={max || undefined}
                value={acertos[d] || ""}
                onChange={(e) => setAcertos((v) => ({ ...v, [d]: e.target.value }))}
                placeholder="0"
                className={CAMPO}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Tempo (min)</span>
          <input type="number" min={0} value={tempoMin} onChange={(e) => setTempoMin(e.target.value)} placeholder="300" className={CAMPO} />
        </label>
        {TIPOS_ERRO.map((t) => (
          <label key={t.id} className="block">
            <span className="mb-1 block truncate text-[12px] font-semibold text-muted-foreground">
              Erros: {t.rotulo}
            </span>
            <input
              type="number"
              min={0}
              value={errosTipo[t.id] || ""}
              onChange={(e) => setErrosTipo((v) => ({ ...v, [t.id]: e.target.value }))}
              placeholder="0"
              className={CAMPO}
            />
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">Observações</span>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          placeholder="Como foi o ritmo, o que travou…"
          className={`${CAMPO} resize-y`}
        />
      </label>

      {mensagem && (
        <p className="rounded-lg bg-questly-red/10 px-3 py-2 text-[13px] font-medium text-questly-red">{mensagem}</p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancelar}
          className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void salvar()}
          disabled={salvando}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-questly-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:text-[#0c1512]"
        >
          {salvando && <Loader2 size={15} className="animate-spin" />}
          Salvar simulado
        </button>
      </div>
    </div>
  );
}
