"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarX2, Check, Loader2, Plus, Settings2, Trash2, X } from "lucide-react";
import { ROTULO_FREQUENCIA, sugerirFaltasMax, tomFrequencia } from "@/lib/academico/academico";
import type { FaltaRow, MateriaAcademica } from "@/lib/academico/academico-data";
import {
  alternarJustificadaAction,
  apagarFaltaAction,
  registrarFaltaAction,
  salvarParametrosMateriaAction,
} from "@/lib/academico/actions";
import { questlyHojeISO } from "@/lib/questly/shared";

// O contador de faltas.
//
// A pergunta que ele responde é UMA, e por isso ela é o maior elemento do
// cartão: "quantas ainda cabem?". Tudo o mais (histórico, justificadas,
// configuração do teto) é secundário e fica visualmente abaixo — o aluno que
// abre isso no corredor, decidindo se entra na aula, precisa do número em meio
// segundo.
//
// A escala é de PIPS quando o teto é pequeno (o caso normal: 7, 10, 15 faltas)
// porque a comparação "4 apagados, 3 acesos" é lida instantaneamente, sem
// aritmética. Acima de 24 os pips viram confete e a barra volta a ser melhor.
const MAX_PIPS = 24;

const TOM_CLASSES = {
  verde: {
    texto: "text-questly-green-dark",
    fundo: "bg-questly-green",
    suave: "bg-questly-green/15",
    borda: "border-questly-green/25",
  },
  amarelo: {
    texto: "text-questly-orange-dark",
    fundo: "bg-questly-orange",
    suave: "bg-questly-orange/15",
    borda: "border-questly-orange/30",
  },
  vermelho: {
    texto: "text-questly-red-dark",
    fundo: "bg-questly-red",
    suave: "bg-questly-red/15",
    borda: "border-questly-red/30",
  },
  neutro: {
    texto: "text-muted-foreground",
    fundo: "bg-muted-foreground/40",
    suave: "bg-muted",
    borda: "border-border",
  },
} as const;

export function FaltasCard({
  materia,
  editavel,
  onMudou,
}: {
  materia: MateriaAcademica;
  /** false = plano grátis (ou Pro vencido): mostra, não deixa mexer. */
  editavel: boolean;
  onMudou: () => void;
}) {
  const [abrindoRegistro, setAbrindoRegistro] = useState(false);
  const [configurando, setConfigurando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const freq = materia.frequencia;
  const tom = TOM_CLASSES[tomFrequencia(freq.nivel)];

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
    startTransition(async () => {
      const res = await apagarFaltaAction(id);
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  function alternar(id: string, justificada: boolean) {
    startTransition(async () => {
      const res = await alternarJustificadaAction(id, justificada);
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tom.suave} ${tom.texto}`}>
            <CalendarX2 size={14} strokeWidth={2} />
          </span>
          <h3 className="text-[13.5px] font-semibold tracking-tight">Faltas</h3>
        </div>
        {editavel && (
          <button
            type="button"
            onClick={() => setConfigurando((v) => !v)}
            title="Configurar limite de faltas"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 size={12} strokeWidth={2} />
            Limite
          </button>
        )}
      </div>

      {/* O número grande. Sem teto configurado não existe número nenhum
          honesto pra mostrar — a tela pede o dado em vez de exibir "0". */}
      {freq.max === null ? (
        <SemLimite editavel={editavel} onConfigurar={() => setConfigurando(true)} />
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-2">
              <span className={`tnum font-heading text-[40px] font-semibold leading-none ${tom.texto}`}>
                {freq.restantes != null && freq.restantes > 0 ? freq.restantes : 0}
              </span>
              <span className="pb-1.5 text-[12.5px] leading-snug text-muted-foreground">
                {freq.restantes === 1 ? "falta restante" : "faltas restantes"}
              </span>
            </div>
            <span className="tnum pb-1 text-[12px] text-muted-foreground">
              {freq.usadas} / {freq.max} usadas
            </span>
          </div>

          <Escala usadas={freq.usadas} max={freq.max} tom={tomFrequencia(freq.nivel)} />

          <p className={`mt-2 text-[12px] font-medium ${tom.texto}`}>{ROTULO_FREQUENCIA[freq.nivel]}</p>
          {freq.justificadas > 0 && (
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              + {freq.justificadas} {freq.justificadas === 1 ? "justificada" : "justificadas"} (não conta no
              limite)
            </p>
          )}
        </>
      )}

      {erro && <p className="mt-2 text-[11.5px] text-questly-red-dark">{erro}</p>}

      {editavel && (
        <div className="mt-3">
          {abrindoRegistro ? (
            <FormFalta
              pendente={pendente}
              onCancelar={() => setAbrindoRegistro(false)}
              onSalvar={registrar}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAbrindoRegistro(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-foreground/[0.07]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Registrar falta
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {configurando && editavel && (
          <FormParametros
            materia={materia}
            onFechar={() => setConfigurando(false)}
            onSalvo={() => {
              setConfigurando(false);
              onMudou();
            }}
          />
        )}
      </AnimatePresence>

      {materia.faltas.length > 0 && (
        <ListaFaltas
          faltas={materia.faltas}
          editavel={editavel}
          onApagar={apagar}
          onAlternar={alternar}
        />
      )}
    </div>
  );
}

function SemLimite({ editavel, onConfigurar }: { editavel: boolean; onConfigurar: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-3.5 py-3">
      <p className="text-[12.5px] font-medium">Quantas faltas você pode ter?</p>
      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
        Está no plano de ensino — em geral 25% das aulas. Sem esse número o contador não tem o que contar.
      </p>
      {editavel && (
        <button
          type="button"
          onClick={onConfigurar}
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-questly-green/12 px-3 text-[12px] font-semibold text-questly-green-dark transition-colors hover:bg-questly-green/20"
        >
          <Settings2 size={12} strokeWidth={2.2} />
          Definir limite
        </button>
      )}
    </div>
  );
}

/** Pips quando o teto é pequeno; barra quando é grande. */
function Escala({
  usadas,
  max,
  tom,
}: {
  usadas: number;
  max: number;
  tom: keyof typeof TOM_CLASSES;
}) {
  const classes = TOM_CLASSES[tom];

  if (max > 0 && max <= MAX_PIPS) {
    return (
      <div className="mt-3 flex flex-wrap gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-full max-w-[18px] flex-1 rounded-full ${i < usadas ? classes.fundo : "bg-muted"}`}
          />
        ))}
        {/* Faltas ALÉM do teto ganham pip próprio, sempre vermelho: some-las
            faria a barra "encher e parar", escondendo o tamanho do estrago. */}
        {usadas > max &&
          Array.from({ length: Math.min(usadas - max, 8) }).map((_, i) => (
            <span key={`x${i}`} className="h-2.5 w-full max-w-[18px] flex-1 rounded-full bg-questly-red" />
          ))}
      </div>
    );
  }

  const pct = max > 0 ? Math.min(100, (usadas / max) * 100) : 0;
  return (
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${classes.fundo}`} style={{ width: `${pct}%` }} />
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
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-col gap-1">
          <span className="kicker">Dia</span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker">Aulas</span>
          <input
            type="number"
            min={1}
            max={12}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="tnum h-9 w-16 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
      </div>

      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo (opcional)"
        maxLength={200}
        className="mt-2 h-9 w-full rounded-lg border border-border bg-card px-2.5 text-[12.5px] outline-none focus:border-questly-green"
      />

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px]">
        <input
          type="checkbox"
          checked={justificada}
          onChange={(e) => setJustificada(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--questly-green)]"
        />
        Falta justificada (atestado, luto, júri) — não conta no limite
      </label>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={pendente}
          onClick={() => onSalvar({ data, quantidade, justificada, motivo: motivo || null })}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60 dark:text-[#0c1512]"
        >
          {pendente ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.4} />}
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex h-9 items-center rounded-lg px-3 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function FormParametros({
  materia,
  onFechar,
  onSalvo,
}: {
  materia: MateriaAcademica;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [faltasMax, setFaltasMax] = useState<string>(materia.faltasMax?.toString() ?? "");
  const [carga, setCarga] = useState<string>(materia.cargaHoraria?.toString() ?? "");
  const [aulas, setAulas] = useState<string>(materia.aulasPorSemana?.toString() ?? "");
  const [media, setMedia] = useState<string>(materia.mediaAprovacao.toString());
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const sugestao = sugerirFaltasMax(carga ? Number(carga) : null, aulas ? Number(aulas) : null);

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const res = await salvarParametrosMateriaAction({
        subjectId: materia.subjectId,
        faltasMax: faltasMax === "" ? null : Number(faltasMax),
        cargaHoraria: carga === "" ? null : Number(carga),
        aulasPorSemana: aulas === "" ? null : Number(aulas),
        mediaAprovacao: media === "" ? 6 : Number(media),
      });
      if ("error" in res) setErro(res.error);
      else onSalvo();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] font-semibold">Parâmetros do semestre</p>
          <button
            type="button"
            onClick={onFechar}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Campo rotulo="Carga horária" valor={carga} onChange={setCarga} placeholder="60" sufixo="h" />
          <Campo rotulo="Aulas/semana" valor={aulas} onChange={setAulas} placeholder="2" />
          <Campo rotulo="Máx. faltas" valor={faltasMax} onChange={setFaltasMax} placeholder="—" />
          <Campo rotulo="Média p/ passar" valor={media} onChange={setMedia} placeholder="6" />
        </div>

        {/* A sugestão é oferecida, nunca imposta: o número real está no plano
            de ensino do professor, e várias universidades contam diferente. */}
        {sugestao != null && sugestao.toString() !== faltasMax && (
          <button
            type="button"
            onClick={() => setFaltasMax(String(sugestao))}
            className="mt-2 text-left text-[11.5px] font-medium text-questly-green-dark underline-offset-2 hover:underline"
          >
            Pela regra dos 25%, dá {sugestao} {sugestao === 1 ? "falta" : "faltas"} — usar esse número
          </button>
        )}

        {erro && <p className="mt-2 text-[11.5px] text-questly-red-dark">{erro}</p>}

        <button
          type="button"
          onClick={salvar}
          disabled={pendente}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60 dark:text-[#0c1512]"
        >
          {pendente ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.4} />}
          Salvar
        </button>
      </div>
    </motion.div>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  sufixo,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  sufixo?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="kicker">{rotulo}</span>
      <div className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => onChange(e.target.value.replace(",", "."))}
          placeholder={placeholder}
          className="tnum h-9 w-full min-w-0 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
        />
        {sufixo && <span className="text-[11px] text-muted-foreground">{sufixo}</span>}
      </div>
    </label>
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
  const visiveis = tudo ? faltas : faltas.slice(0, 4);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="kicker mb-1.5">Registro</p>
      <ul className="flex flex-col gap-1">
        {visiveis.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-[12px]">
            <span className="tnum w-[52px] shrink-0 text-muted-foreground">
              {f.data.slice(8, 10)}/{f.data.slice(5, 7)}
            </span>
            <span className="tnum w-6 shrink-0 font-semibold">
              {f.quantidade > 1 ? `${f.quantidade}×` : ""}
            </span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.motivo || "—"}</span>
            {f.justificada && (
              <span className="shrink-0 rounded bg-questly-blue/12 px-1.5 py-[1px] text-[10px] font-semibold text-questly-blue-dark">
                justificada
              </span>
            )}
            {editavel && (
              <>
                <button
                  type="button"
                  onClick={() => onAlternar(f.id, !f.justificada)}
                  title={f.justificada ? "Marcar como falta normal" : "Marcar como justificada"}
                  className="shrink-0 text-muted-foreground/70 transition-colors hover:text-questly-blue"
                >
                  <Check size={13} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => onApagar(f.id)}
                  title="Apagar"
                  className="shrink-0 text-muted-foreground/70 transition-colors hover:text-questly-red"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {faltas.length > 4 && (
        <button
          type="button"
          onClick={() => setTudo((v) => !v)}
          className="mt-1.5 text-[11.5px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {tudo ? "Mostrar menos" : `Ver todas (${faltas.length})`}
        </button>
      )}
    </div>
  );
}
