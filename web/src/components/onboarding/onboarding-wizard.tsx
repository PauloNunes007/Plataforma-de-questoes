"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { salvarCampanhaAction, type DisciplinaInput, type ProvaInput } from "@/lib/onboarding/actions";

const TOTAL_STEPS = 9;

const DISCIPLINAS_SUGERIDAS = [
  "Fundamentos de Cálculo e Geometria",
  "Cálculo I",
  "Cálculo II",
  "Cálculo III",
  "Álgebra Linear",
  "Física I",
  "Física II",
  "Química Geral",
  "Programação I",
];

const DIAS_SEMANA_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const TEMPO_OPCOES: { label: string; minutos: number }[] = [
  { label: "30 min", minutos: 30 },
  { label: "1 hora", minutos: 60 },
  { label: "1h30", minutos: 90 },
  { label: "2h", minutos: 120 },
  { label: "3h", minutos: 180 },
  { label: "4h", minutos: 240 },
  { label: "6h", minutos: 360 },
  { label: "8h ou mais", minutos: 480 },
];

const NIVEL_OPCOES = [
  { valor: "iniciante", icone: "🌱", titulo: "Iniciante", desc: "Ainda travando nos conceitos básicos" },
  { valor: "intermediario", icone: "⚡", titulo: "Intermediário", desc: "Entendo a matéria, erro nas aplicações" },
  { valor: "avancado", icone: "🏆", titulo: "Avançado", desc: "Domino o conteúdo, quero manter o ritmo" },
];

type DiscCfg = { nota: number; provas: ProvaInput[] };

type WizardState = {
  curso: string;
  universidade: string;
  semestre: number | null;
  disciplinas: string[];
  discCfg: Record<string, DiscCfg>;
  dias: string[];
  tempoLabel: string | null;
  nivel: string | null;
};

const ESTADO_INICIAL: WizardState = {
  curso: "",
  universidade: "",
  semestre: null,
  disciplinas: [],
  discCfg: {},
  dias: [],
  tempoLabel: null,
  nivel: null,
};

function ehValido(step: number, s: WizardState): boolean {
  switch (step) {
    case 1:
      return s.curso.trim().length > 0;
    case 3:
      return s.semestre !== null;
    case 4:
      return s.disciplinas.length > 0;
    case 6:
      return s.dias.length > 0;
    case 7:
      return s.tempoLabel !== null;
    case 8:
      return s.nivel !== null;
    default:
      return true;
  }
}

const EYEBROWS: Record<number, string> = {
  1: "Sobre você",
  2: "Sobre você",
  3: "Sobre você",
  4: "Sua campanha",
  5: "Sua campanha",
  6: "Sua rotina",
  7: "Sua rotina",
  8: "Sua rotina",
  9: "Tudo pronto",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`rounded-full border-2 px-4.5 py-2.5 text-sm font-bold transition-colors ${
        active
          ? "border-questly-green bg-questly-green-light text-questly-green-dark"
          : "border-border bg-card text-muted-foreground hover:border-questly-green"
      }`}
    >
      {children}
    </motion.button>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [state, setState] = useState<WizardState>(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function irPara(novoStep: number) {
    if (novoStep < 1 || novoStep > TOTAL_STEPS) return;
    setDirection(novoStep > step ? 1 : -1);
    setStep(novoStep);
  }

  function toggleEm(lista: string[], valor: string): string[] {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
  }

  function garantirDiscCfg(nome: string): DiscCfg {
    return state.discCfg[nome] || { nota: 8, provas: [{ nome: "P1", data: "" }] };
  }

  async function handleContinuar() {
    if (step < TOTAL_STEPS) {
      irPara(step + 1);
      return;
    }

    setSalvando(true);
    setErro(null);

    const disciplinas: DisciplinaInput[] = state.disciplinas.map((nome) => {
      const cfg = garantirDiscCfg(nome);
      return { nome, nota: cfg.nota, provas: cfg.provas };
    });

    const tempoOpcao = TEMPO_OPCOES.find((t) => t.label === state.tempoLabel);

    const resultado = await salvarCampanhaAction({
      curso: state.curso,
      universidade: state.universidade || null,
      semestre: state.semestre,
      nivel: state.nivel,
      dias: state.dias,
      tempoDiarioMin: tempoOpcao?.minutos ?? null,
      disciplinas,
    });

    if (resultado.error) {
      setSalvando(false);
      setErro(resultado.error);
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/dashboard"), 1800);
  }

  const podeContinuar = ehValido(step, state);
  const mostrarPular = step === 2 || step === 5;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-5 py-10">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        {!sucesso && (
          <div className="flex items-center gap-3.5 px-7 pt-6">
            <button
              type="button"
              onClick={() => irPara(step - 1)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-base text-muted-foreground transition-opacity ${
                step === 1 ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              ←
            </button>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-questly-green"
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="shrink-0 font-mono text-xs font-bold text-muted-foreground">
              {step}/{TOTAL_STEPS}
            </div>
          </div>
        )}

        <div className="relative min-h-[420px] overflow-hidden px-7 py-8 sm:px-9">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {sucesso ? (
              <motion.div
                key="sucesso"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <div className="mb-3 text-5xl">🎉</div>
                <h2 className="mb-1.5 font-heading text-2xl font-semibold">Campanha criada!</h2>
                <p className="text-sm font-semibold text-muted-foreground">
                  Sua missão de hoje já está esperando por você no dashboard.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -32 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-questly-green-dark">
                    {EYEBROWS[step]}
                  </span>
                  {mostrarPular && (
                    <button
                      type="button"
                      onClick={() => irPara(step + 1)}
                      className="text-xs font-bold text-muted-foreground"
                    >
                      Pular
                    </button>
                  )}
                </div>

                <StepContent step={step} state={state} setState={setState} toggleEm={toggleEm} garantirDiscCfg={garantirDiscCfg} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!sucesso && (
          <div className="px-7 pb-8 sm:px-9">
            {erro && <p className="mb-3 text-sm font-semibold text-questly-red-dark">{erro}</p>}
            <button
              type="button"
              disabled={!podeContinuar || salvando}
              onClick={handleContinuar}
              className="w-full rounded-2xl bg-questly-green px-6 py-4 font-heading text-[15px] font-semibold text-white shadow-[0_4px_0_var(--questly-green-dark)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:pointer-events-none"
            >
              {salvando ? "Salvando..." : step === TOTAL_STEPS ? "Começar minha campanha" : "Continuar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepContent({
  step,
  state,
  setState,
  toggleEm,
  garantirDiscCfg,
}: {
  step: number;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  toggleEm: (lista: string[], valor: string) => string[];
  garantirDiscCfg: (nome: string) => DiscCfg;
}) {
  switch (step) {
    case 1:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Qual curso você está fazendo?
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Assim conseguimos entender o contexto da sua campanha.
          </p>
          <input
            autoFocus
            value={state.curso}
            onChange={(e) => setState((s) => ({ ...s, curso: e.target.value }))}
            placeholder="Ex: Engenharia de Produção"
            className="w-full rounded-2xl border-2 border-border px-4 py-4 text-[15px] font-semibold outline-none focus:border-questly-blue"
          />
        </div>
      );

    case 2:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">Em qual universidade?</h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Opcional — ajuda a comparar seu ranking com colegas da mesma instituição.
          </p>
          <input
            autoFocus
            value={state.universidade}
            onChange={(e) => setState((s) => ({ ...s, universidade: e.target.value }))}
            placeholder="Ex: UFRJ"
            className="w-full rounded-2xl border-2 border-border px-4 py-4 text-[15px] font-semibold outline-none focus:border-questly-blue"
          />
        </div>
      );

    case 3:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Em qual semestre você está?
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Isso ajuda a calibrar a dificuldade inicial das questões.
          </p>
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <motion.button
                key={n}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setState((s) => ({ ...s, semestre: n }))}
                className={`rounded-2xl border-2 py-4 text-center font-heading text-[15px] font-semibold ${
                  state.semestre === n
                    ? "border-questly-green bg-questly-green-light text-questly-green-dark"
                    : "border-border text-muted-foreground"
                }`}
              >
                {n}º
              </motion.button>
            ))}
          </div>
        </div>
      );

    case 4:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Quais disciplinas você está cursando?
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Cada uma vira uma campanha paralela. Escolha quantas quiser.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {Array.from(new Set([...DISCIPLINAS_SUGERIDAS, ...state.disciplinas])).map((nome) => (
              <Chip
                key={nome}
                active={state.disciplinas.includes(nome)}
                onClick={() => setState((s) => ({ ...s, disciplinas: toggleEm(s.disciplinas, nome) }))}
              >
                {nome}
              </Chip>
            ))}
          </div>
          <CustomDisciplinaInput
            onAdd={(nome) =>
              setState((s) => (s.disciplinas.includes(nome) ? s : { ...s, disciplinas: [...s.disciplinas, nome] }))
            }
          />
        </div>
      );

    case 5:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Meta e provas de cada disciplina
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Defina a nota que você quer tirar e as datas das provas.
          </p>
          {state.disciplinas.length === 0 ? (
            <p className="text-sm font-semibold text-muted-foreground">
              Nenhuma disciplina selecionada ainda — volte no passo anterior.
            </p>
          ) : (
            <div className="flex max-h-[340px] flex-col gap-4 overflow-y-auto pr-1">
              {state.disciplinas.map((nome) => (
                <DisciplinaCard
                  key={nome}
                  nome={nome}
                  cfg={garantirDiscCfg(nome)}
                  onChange={(cfg) => setState((s) => ({ ...s, discCfg: { ...s.discCfg, [nome]: cfg } }))}
                />
              ))}
            </div>
          )}
        </div>
      );

    case 6:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Quais dias você tem disponíveis pra estudar?
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            As missões diárias só aparecem nesses dias.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {DIAS_SEMANA_LABELS.map((dia) => (
              <Chip
                key={dia}
                active={state.dias.includes(dia)}
                onClick={() => setState((s) => ({ ...s, dias: toggleEm(s.dias, dia) }))}
              >
                {dia}
              </Chip>
            ))}
          </div>
        </div>
      );

    case 7:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Quanto tempo por dia você consegue estudar?
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Suas missões diárias são dimensionadas pra caber nesse tempo — dividido entre as disciplinas que você
            estuda no dia.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {TEMPO_OPCOES.map((t) => (
              <Chip
                key={t.label}
                active={state.tempoLabel === t.label}
                onClick={() => setState((s) => ({ ...s, tempoLabel: t.label }))}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </div>
      );

    case 8:
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Como você avalia seu nível hoje?
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Só pra calibrar o ponto de partida — a dificuldade se ajusta sozinha depois.
          </p>
          <div className="flex flex-col gap-3">
            {NIVEL_OPCOES.map((n) => (
              <motion.button
                key={n.valor}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setState((s) => ({ ...s, nivel: n.valor }))}
                className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left ${
                  state.nivel === n.valor ? "border-questly-green bg-questly-green-light" : "border-border"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-lg">
                  {n.icone}
                </div>
                <div>
                  <b className="block font-heading text-sm font-semibold">{n.titulo}</b>
                  <span className="text-xs font-semibold text-muted-foreground">{n.desc}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      );

    case 9: {
      const tempoOpcao = TEMPO_OPCOES.find((t) => t.label === state.tempoLabel);
      const rows: [string, string][] = [
        ["Curso", state.curso || "—"],
        ["Universidade", state.universidade || "não informado"],
        ["Semestre", state.semestre ? `${state.semestre}º` : "—"],
        ["Disciplinas", state.disciplinas.length ? state.disciplinas.join(", ") : "—"],
        ["Dias de estudo", state.dias.length ? state.dias.join(", ") : "—"],
        ["Tempo diário", tempoOpcao?.label || "—"],
        ["Nível", NIVEL_OPCOES.find((n) => n.valor === state.nivel)?.titulo || "—"],
      ];
      return (
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold leading-snug">
            Sua campanha está pronta
          </h2>
          <p className="mb-6 text-sm font-semibold text-muted-foreground">
            Confira antes de começar — dá pra mudar tudo isso depois nas configurações.
          </p>
          <div className="overflow-hidden rounded-2xl border border-border">
            {rows.map(([k, v], i) => (
              <div
                key={k}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
                  i !== rows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-sm font-bold text-muted-foreground">{k}</span>
                <span className="max-w-[60%] text-right text-sm font-extrabold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

function CustomDisciplinaInput({ onAdd }: { onAdd: (nome: string) => void }) {
  const [valor, setValor] = useState("");
  return (
    <div className="mt-4 flex gap-2">
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Não achou? Digite o nome da disciplina"
        className="flex-1 rounded-xl border-2 border-dashed border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-questly-blue"
      />
      <button
        type="button"
        onClick={() => {
          const nome = valor.trim();
          if (!nome) return;
          onAdd(nome);
          setValor("");
        }}
        className="rounded-xl bg-muted px-4 text-xs font-extrabold text-muted-foreground"
      >
        + Adicionar
      </button>
    </div>
  );
}

function DisciplinaCard({
  nome,
  cfg,
  onChange,
}: {
  nome: string;
  cfg: DiscCfg;
  onChange: (cfg: DiscCfg) => void;
}) {
  return (
    <div className="rounded-2xl bg-muted p-4">
      <h4 className="mb-3.5 font-heading text-[15px] font-semibold">{nome}</h4>

      <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wide text-muted-foreground">
        Nota desejada
      </div>
      <div className="mb-4 flex gap-2">
        {[6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ ...cfg, nota: n })}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 font-heading text-sm font-semibold ${
              cfg.nota === n ? "border-questly-green bg-questly-green-light text-questly-green-dark" : "border-border bg-card"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wide text-muted-foreground">Provas</div>
      <div className="flex flex-col gap-2">
        {cfg.provas.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              value={p.nome}
              onChange={(e) => {
                const provas = cfg.provas.map((pr, i) => (i === idx ? { ...pr, nome: e.target.value } : pr));
                onChange({ ...cfg, provas });
              }}
              className="w-[70px] rounded-lg border-2 border-border px-2.5 py-2 text-xs font-bold outline-none"
            />
            <input
              type="date"
              value={p.data}
              onChange={(e) => {
                const provas = cfg.provas.map((pr, i) => (i === idx ? { ...pr, data: e.target.value } : pr));
                onChange({ ...cfg, provas });
              }}
              className="flex-1 rounded-lg border-2 border-border px-2.5 py-2 text-xs font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => onChange({ ...cfg, provas: cfg.provas.filter((_, i) => i !== idx) })}
              className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card font-bold text-questly-red"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange({ ...cfg, provas: [...cfg.provas, { nome: `P${cfg.provas.length + 1}`, data: "" }] })
        }
        className="mt-2 text-xs font-extrabold text-questly-green-dark"
      >
        + Adicionar prova
      </button>
    </div>
  );
}
