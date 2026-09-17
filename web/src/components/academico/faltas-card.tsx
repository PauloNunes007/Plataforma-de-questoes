"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Settings2, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { ROTULO_FREQUENCIA, tomFrequencia } from "@/lib/academico/academico";
import type { FaltaRow, MateriaAcademica } from "@/lib/academico/academico-data";
import {
  alternarJustificadaAction,
  apagarFaltaAction,
  registrarFaltaAction,
} from "@/lib/academico/actions";
import { questlyHojeISO } from "@/lib/questly/shared";
import { Pips } from "./materia-cartao";
import { TONS } from "./tons";

// A aba "Faltas" do painel da disciplina.
//
// A pergunta é UMA, e por isso ela é o maior elemento da aba: "quantas ainda
// cabem?". Histórico, justificadas e o teto configurado são secundários e
// ficam abaixo — quem abre isso no corredor, decidindo se entra na aula,
// precisa do número em meio segundo.

export function FaltasPainel({
  materia,
  editavel,
  onMudou,
  onConfigurar,
}: {
  materia: MateriaAcademica;
  /** false = plano grátis (ou Pro vencido): mostra, não deixa mexer. */
  editavel: boolean;
  onMudou: () => void;
  onConfigurar: () => void;
}) {
  const [abrindoRegistro, setAbrindoRegistro] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const freq = materia.frequencia;
  const tomKey = tomFrequencia(freq.nivel);
  const tom = TONS[tomKey];
  const estourou = freq.restantes != null && freq.restantes < 0;

  function registrar(input: { data: string; quantidade: number; justificada: boolean; motivo: string | null }) {
    setErro(null);
    startTransition(async () => {
      const res = await registrarFaltaAction({ subjectId: materia.subjectId, ...input });
      if ("error" in res) setErro(res.error);
      else {
        setAbrindoRegistro(false);
        onMudou();
      }
    });
  }

  function apagar(id: string) {
    setErro(null);
    startTransition(async () => {
      const res = await apagarFaltaAction(id);
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  function alternar(id: string, justificada: boolean) {
    setErro(null);
    startTransition(async () => {
      const res = await alternarJustificadaAction(id, justificada);
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* O número grande. Sem teto configurado não existe número honesto pra
          mostrar — a aba pede o dado em vez de exibir "0". */}
      {freq.max === null ? (
        <SemLimite editavel={editavel} onConfigurar={onConfigurar} usadas={freq.usadas} />
      ) : (
        <div className={`rounded-2xl border ${tom.borda} ${tom.suave} px-4 py-3.5`}>
          <div className="flex items-end justify-between gap-3">
            <p className="flex items-baseline gap-2">
              <span className={`tnum font-heading text-[40px] font-semibold leading-none ${tom.texto}`}>
                {estourou ? Math.abs(freq.restantes as number) : Math.max(0, freq.restantes ?? 0)}
              </span>
              <span className="text-[12.5px] leading-snug text-muted-foreground">
                {estourou
                  ? "faltas além do limite"
                  : freq.restantes === 1
                    ? "falta restante"
                    : "faltas restantes"}
              </span>
            </p>
            <span className="tnum shrink-0 text-[12px] text-muted-foreground">
              {freq.usadas} / {freq.max} usadas
            </span>
          </div>

          <div className="mt-3">
            <Pips usadas={freq.usadas} max={freq.max} tom={tomKey} />
          </div>

          <p className={`mt-2.5 text-[12.5px] font-semibold ${tom.texto}`}>{ROTULO_FREQUENCIA[freq.nivel]}</p>
          {freq.justificadas > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted-foreground">
              <ShieldCheck size={12} strokeWidth={2} />
              {freq.justificadas} {freq.justificadas === 1 ? "justificada" : "justificadas"} — fora do limite
            </p>
          )}
        </div>
      )}

      {erro && <p className="text-[12px] text-questly-red-dark">{erro}</p>}

      {editavel &&
        (abrindoRegistro ? (
          <FormFalta pendente={pendente} onCancelar={() => setAbrindoRegistro(false)} onSalvar={registrar} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAbrindoRegistro(true)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-foreground/[0.07]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Registrar falta
            </button>
            {freq.max !== null && (
              <button
                type="button"
                onClick={onConfigurar}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings2 size={13} strokeWidth={2} />
                Mudar limite
              </button>
            )}
          </div>
        ))}

      {materia.faltas.length > 0 && (
        <ListaFaltas faltas={materia.faltas} editavel={editavel} onApagar={apagar} onAlternar={alternar} />
      )}
    </div>
  );
}

function SemLimite({
  editavel,
  onConfigurar,
  usadas,
}: {
  editavel: boolean;
  onConfigurar: () => void;
  usadas: number;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-3.5">
      <p className="text-[13px] font-semibold">Quantas faltas você pode ter?</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        Está no plano de ensino — em geral 25% das aulas. Sem esse número o contador não tem o que contar
        {usadas > 0 ? ` (você já registrou ${usadas}).` : "."}
      </p>
      {editavel && (
        <button
          type="button"
          onClick={onConfigurar}
          className="mt-2.5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-questly-green/12 px-3 text-[12px] font-semibold text-questly-green-dark transition-colors hover:bg-questly-green/20"
        >
          <Settings2 size={12} strokeWidth={2.2} />
          Definir limite
        </button>
      )}
    </div>
  );
}

function FormFalta({
  pendente,
  onCancelar,
  onSalvar,
}: {
  pendente: boolean;
  onCancelar: () => void;
  onSalvar: (i: { data: string; quantidade: number; justificada: boolean; motivo: string | null }) => void;
}) {
  const [data, setData] = useState(questlyHojeISO());
  const [quantidade, setQuantidade] = useState(1);
  const [justificada, setJustificada] = useState(false);
  const [motivo, setMotivo] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
      <p className="kicker mb-2.5">Nova falta</p>

      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Dia</span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-9 w-full min-w-0 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Aulas perdidas</span>
          <input
            type="number"
            min={1}
            max={12}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="tnum h-9 w-[76px] rounded-lg border border-border bg-card px-2 text-center text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
      </div>

      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo (opcional)"
        maxLength={200}
        className="mt-2.5 h-9 w-full rounded-lg border border-border bg-card px-2.5 text-[12.5px] outline-none focus:border-questly-green"
      />

      <label className="mt-2.5 flex cursor-pointer items-start gap-2 text-[12px] leading-snug">
        <input
          type="checkbox"
          checked={justificada}
          onChange={(e) => setJustificada(e.target.checked)}
          className="mt-[2px] h-3.5 w-3.5 shrink-0 accent-[var(--questly-green)]"
        />
        <span>
          Falta justificada (atestado, luto, júri) — fica registrada, mas{" "}
          <b className="font-semibold">não conta no limite</b>
        </span>
      </label>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={pendente}
          onClick={() => onSalvar({ data, quantidade, justificada, motivo: motivo || null })}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:cursor-default disabled:opacity-60 dark:text-[#0c1512]"
        >
          {pendente ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.4} />}
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex h-9 cursor-pointer items-center rounded-lg px-3 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ListaFaltas({
  faltas,
  editavel,
  onApagar,
  onAlternar,
}: {
  faltas: FaltaRow[];
  editavel: boolean;
  onApagar: (id: string) => void;
  onAlternar: (id: string, justificada: boolean) => void;
}) {
  const [tudo, setTudo] = useState(false);
  const visiveis = tudo ? faltas : faltas.slice(0, 5);

  return (
    <div className="border-t border-border pt-3.5">
      <p className="kicker mb-2">Registro ({faltas.length})</p>
      <ul className="flex flex-col">
        {visiveis.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[12.5px] transition-colors hover:bg-muted/60"
          >
            <span className="tnum w-[46px] shrink-0 font-medium text-muted-foreground">
              {f.data.slice(8, 10)}/{f.data.slice(5, 7)}
            </span>
            <span className="tnum w-7 shrink-0 text-center font-semibold">
              {f.quantidade > 1 ? `${f.quantidade}×` : "1×"}
            </span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.motivo || "—"}</span>
            {f.justificada && (
              <span className="shrink-0 rounded bg-questly-blue/12 px-1.5 py-[2px] text-[10px] font-semibold text-questly-blue-dark">
                justificada
              </span>
            )}
            {editavel && (
              <span className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onAlternar(f.id, !f.justificada)}
                  title={f.justificada ? "Voltar a contar no limite" : "Marcar como justificada"}
                  aria-label={f.justificada ? "Voltar a contar no limite" : "Marcar como justificada"}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-questly-blue/10 hover:text-questly-blue-dark"
                >
                  {f.justificada ? (
                    <Undo2 size={13} strokeWidth={2.1} />
                  ) : (
                    <ShieldCheck size={13} strokeWidth={2.1} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onApagar(f.id)}
                  title="Apagar falta"
                  aria-label="Apagar falta"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-questly-red/10 hover:text-questly-red-dark"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {faltas.length > 5 && (
        <button
          type="button"
          onClick={() => setTudo((v) => !v)}
          className="mt-1.5 cursor-pointer px-1.5 text-[11.5px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {tudo ? "Mostrar menos" : `Ver todas (${faltas.length})`}
        </button>
      )}
    </div>
  );
}
