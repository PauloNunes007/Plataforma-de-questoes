"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  Check,
  ImageIcon,
  Lock,
  Plus,
  Sparkles,
  Swords,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  QUESTLY_DIAS_SEMANA,
  questlyNormalizarDia,
} from "@/lib/questly/shared";
import { questlyRecomendarRotina, type RotinaLinha } from "@/lib/questly/rotina-engine";
import { redimensionarAvatar } from "@/lib/configuracoes/avatar-resize";
import {
  adicionarProvaAction,
  atualizarProvaAction,
  criarDisciplinaAction,
  removerDisciplinaAction,
  removerFotoAction,
  removerProvaAction,
  salvarGradeAction,
  salvarNomeAction,
  salvarNotaAction,
  salvarRotinaAction,
  uploadFotoAction,
  type SubjectComBosses,
} from "@/lib/configuracoes/actions";

const NOME_CARENCIA_DIAS = 15;

const DIAS_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
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
const DISCIPLINAS_PADRAO = [
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

const CHIP_BASE =
  "cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors";
const CHIP_INATIVO = "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground";
const CHIP_ATIVO = "border-questly-green/50 bg-questly-green-light text-questly-green-dark";

const BTN_PRIMARIO =
  "inline-flex items-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 dark:text-[#0c1512]";
const BTN_SECUNDARIO =
  "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50";

type ProfileMin = {
  nome: string | null;
  foto_url: string | null;
  dias_disponiveis: string[] | null;
  tempo_diario_min: number | null;
  nome_alterado_em: string | null;
};

function Card({
  icon: Icon,
  title,
  sub,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-questly-green-light text-questly-green-dark">
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function SavedTag({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-questly-green-dark"
        >
          <Check size={14} strokeWidth={2.5} /> Salvo
        </motion.span>
      )}
    </AnimatePresence>
  );
}

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
    <button type="button" onClick={onClick} className={`${CHIP_BASE} ${active ? CHIP_ATIVO : CHIP_INATIVO}`}>
      {children}
    </button>
  );
}

export function ConfiguracoesPanel({
  profile,
  subjectsIniciais,
  rotinaInicial,
}: {
  profile: ProfileMin | null;
  subjectsIniciais: SubjectComBosses[];
  rotinaInicial: RotinaLinha[];
}) {
  const [subjects, setSubjects] = useState(subjectsIniciais);
  const [dias, setDias] = useState<string[]>(profile?.dias_disponiveis || []);
  const [tempoMin, setTempoMin] = useState<number | null>(profile?.tempo_diario_min ?? null);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-5 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ajuste sua rotina, disciplinas e provas quando quiser.</p>
      </div>

      <NomeCard nomeInicial={profile?.nome ?? null} nomeAlteradoEmInicial={profile?.nome_alterado_em ?? null} />

      <FotoCard nome={profile?.nome || "Aluno(a)"} fotoUrlInicial={profile?.foto_url ?? null} />

      <RotinaCard dias={dias} tempoMin={tempoMin} onSalvar={(d, t) => { setDias(d); setTempoMin(t); }} />

      <GradeSemanalCard subjects={subjects} dias={dias} tempoMin={tempoMin} rotinaInicial={rotinaInicial} />

      <DisciplinasCard subjects={subjects} onSubjectsChange={setSubjects} />

      <ProvasCard subjects={subjects} onSubjectsChange={setSubjects} />
    </div>
  );
}

function diasRestantesCarencia(nomeAlteradoEm: string | null): number {
  if (!nomeAlteradoEm) return 0;
  const decorridoMs = Date.now() - new Date(nomeAlteradoEm).getTime();
  const restanteMs = NOME_CARENCIA_DIAS * 24 * 60 * 60 * 1000 - decorridoMs;
  return restanteMs <= 0 ? 0 : Math.ceil(restanteMs / (24 * 60 * 60 * 1000));
}

function NomeCard({
  nomeInicial,
  nomeAlteradoEmInicial,
}: {
  nomeInicial: string | null;
  nomeAlteradoEmInicial: string | null;
}) {
  const [nome, setNome] = useState(nomeInicial ?? "");
  const [nomeAlteradoEm, setNomeAlteradoEm] = useState(nomeAlteradoEmInicial);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(nomeInicial ?? "");
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const diasRestantes = diasRestantesCarencia(nomeAlteradoEm);
  const bloqueado = diasRestantes > 0;

  async function salvar() {
    setErro(null);
    if (rascunho.trim() === nome) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    const resultado = await salvarNomeAction(rascunho);
    setSalvando(false);
    if (!("nome" in resultado)) {
      setErro(resultado.error);
      return;
    }
    setNome(resultado.nome);
    setNomeAlteradoEm(resultado.nomeAlteradoEm || null);
    setEditando(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <Card
      icon={User}
      title="Nome"
      sub="É como você aparece pros outros alunos no ranking. Precisa ser único e só pode ser trocado a cada 15 dias."
    >
      {editando ? (
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={rascunho}
            maxLength={40}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvar();
              if (e.key === "Escape") {
                setRascunho(nome);
                setErro(null);
                setEditando(false);
              }
            }}
            placeholder="Seu nome"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20"
          />
          {erro && <p className="text-xs font-medium text-questly-red-dark">{erro}</p>}
          <div className="flex items-center gap-2">
            <button type="button" disabled={salvando} onClick={salvar} className={BTN_PRIMARIO}>
              {salvando ? "Salvando..." : "Salvar nome"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRascunho(nome);
                setErro(null);
                setEditando(false);
              }}
              className={BTN_SECUNDARIO}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{nome || "Sem nome definido"}</p>
            {bloqueado && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock size={12} strokeWidth={1.75} />
                Você poderá trocar de novo em {diasRestantes} dia(s).
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SavedTag show={saved} />
            <button
              type="button"
              disabled={bloqueado}
              onClick={() => {
                setRascunho(nome);
                setEditando(true);
              }}
              className={BTN_SECUNDARIO}
              title={bloqueado ? `Disponível em ${diasRestantes} dia(s)` : undefined}
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function FotoCard({ nome, fotoUrlInicial }: { nome: string; fotoUrlInicial: string | null }) {
  const [fotoUrl, setFotoUrl] = useState(fotoUrlInicial);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendente, setPendente] = useState<Blob | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const blob = await redimensionarAvatar(file);
      setPendente(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      alert("Não foi possível ler essa imagem. Tente outro arquivo (JPG ou PNG).");
    }
  }

  async function salvarFoto() {
    if (!pendente) return;
    setEnviando(true);
    const formData = new FormData();
    formData.append("file", pendente, "avatar.jpg");
    const resultado = await uploadFotoAction(formData);
    setEnviando(false);
    if ("error" in resultado && resultado.error) {
      alert(resultado.error);
      return;
    }
    if ("url" in resultado && resultado.url) {
      setFotoUrl(resultado.url);
      setPendente(null);
      setPreviewUrl(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  }

  async function removerFoto() {
    if (!confirm("Remover sua foto de perfil?")) return;
    const resultado = await removerFotoAction();
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    setFotoUrl(null);
    setPendente(null);
    setPreviewUrl(null);
  }

  const mostrarUrl = previewUrl || fotoUrl;

  return (
    <Card
      icon={ImageIcon}
      title="Foto de perfil"
      sub="Aparece pros outros alunos no ranking. A imagem é recortada e reduzida automaticamente antes de subir."
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-questly-green to-questly-green-deep text-xl font-semibold text-white">
          {mostrarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mostrarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className={BTN_SECUNDARIO}>
              Escolher imagem
            </button>
            {fotoUrl && (
              <button
                type="button"
                onClick={removerFoto}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-questly-red-dark transition-colors hover:bg-questly-red-light"
              >
                <Trash2 size={14} strokeWidth={1.75} /> Remover
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={aoEscolherArquivo} />
          {pendente && (
            <div className="flex items-center gap-3">
              <button type="button" disabled={enviando} onClick={salvarFoto} className={BTN_PRIMARIO}>
                {enviando ? "Enviando..." : "Salvar foto"}
              </button>
              <SavedTag show={saved} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function RotinaCard({
  dias,
  tempoMin,
  onSalvar,
}: {
  dias: string[];
  tempoMin: number | null;
  onSalvar: (dias: string[], tempoMin: number | null) => void;
}) {
  const [diasSel, setDiasSel] = useState<string[]>(dias);
  const [tempoLabel, setTempoLabel] = useState<string | null>(
    TEMPO_OPCOES.find((t) => t.minutos === tempoMin)?.label ?? null,
  );
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);

  async function salvar() {
    setSalvando(true);
    const minutos = TEMPO_OPCOES.find((t) => t.label === tempoLabel)?.minutos ?? null;
    const resultado = await salvarRotinaAction(diasSel, minutos);
    setSalvando(false);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    onSalvar(diasSel, minutos);
  }

  return (
    <Card icon={CalendarDays} title="Rotina de estudos" sub="As missões diárias só são geradas nos dias marcados abaixo.">
      <div className="mb-5">
        <div className="kicker mb-2.5">Dias disponíveis</div>
        <div className="flex flex-wrap gap-2">
          {DIAS_LABELS.map((dia) => (
            <Chip
              key={dia}
              active={diasSel.includes(dia)}
              onClick={() => setDiasSel((s) => (s.includes(dia) ? s.filter((d) => d !== dia) : [...s, dia]))}
            >
              {dia}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <div className="kicker mb-2.5">Tempo por dia</div>
        <div className="flex flex-wrap gap-2">
          {TEMPO_OPCOES.map((t) => (
            <Chip key={t.label} active={tempoLabel === t.label} onClick={() => setTempoLabel(t.label)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={salvando} onClick={salvar} className={BTN_PRIMARIO}>
          {salvando ? "Salvando..." : "Salvar rotina"}
        </button>
        <SavedTag show={saved} />
      </div>
    </Card>
  );
}

function GradeSemanalCard({
  subjects,
  dias,
  tempoMin,
  rotinaInicial,
}: {
  subjects: SubjectComBosses[];
  dias: string[];
  tempoMin: number | null;
  rotinaInicial: RotinaLinha[];
}) {
  const marcadoInicial: Record<string, boolean> = {};
  rotinaInicial.forEach((r) => (marcadoInicial[`${r.subject_id}|${r.dia_semana}`] = true));
  const [marcado, setMarcado] = useState<Record<string, boolean>>(marcadoInicial);
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);

  const diasOrdenados = QUESTLY_DIAS_SEMANA.map((abrev) => {
    const label = dias.find((d) => questlyNormalizarDia(d) === abrev);
    return label ? { abrev, label } : null;
  }).filter((d): d is { abrev: (typeof QUESTLY_DIAS_SEMANA)[number]; label: string } => d !== null);

  function toggle(subjectId: string, dia: string) {
    const chave = `${subjectId}|${dia}`;
    setMarcado((m) => ({ ...m, [chave]: !m[chave] }));
  }

  function recomendar() {
    const recomendacao = questlyRecomendarRotina(
      subjects.map((s) => ({ id: s.id, bosses: s.bosses, chance_aprovacao: null, nota_desejada: s.nota_desejada })),
      diasOrdenados.map((d) => d.abrev),
      tempoMin || 30,
    );
    const novoMarcado: Record<string, boolean> = {};
    Object.keys(recomendacao).forEach((dia) => {
      recomendacao[dia].forEach((subjectId) => {
        novoMarcado[`${subjectId}|${dia}`] = true;
      });
    });
    setMarcado(novoMarcado);
  }

  async function salvar() {
    setSalvando(true);
    const rotinaPorDia: Record<string, string[]> = {};
    diasOrdenados.forEach((d) => (rotinaPorDia[d.abrev] = []));
    Object.entries(marcado).forEach(([chave, ativo]) => {
      if (!ativo) return;
      const [subjectId, dia] = chave.split("|");
      if (rotinaPorDia[dia]) rotinaPorDia[dia].push(subjectId);
    });
    const resultado = await salvarGradeAction(rotinaPorDia);
    setSalvando(false);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <Card
      icon={CalendarRange}
      title="Grade semanal por disciplina"
      sub="Marque em quais dias você estuda cada disciplina. A recomendação usa a proximidade das provas, seu desempenho e sua meta de nota — mas quem decide é você."
      action={
        subjects.length > 0 && diasOrdenados.length > 0 ? (
          <button type="button" onClick={recomendar} className={BTN_SECUNDARIO}>
            <Sparkles size={14} strokeWidth={1.75} /> Recomendar
          </button>
        ) : undefined
      }
    >
      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Adicione uma disciplina abaixo pra montar sua grade semanal.</p>
      ) : diasOrdenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Escolha seus dias disponíveis em &quot;Rotina de estudos&quot; acima primeiro.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div
              className="grid items-center gap-y-1"
              style={{ gridTemplateColumns: `160px repeat(${diasOrdenados.length}, 44px)` }}
            >
              <div />
              {diasOrdenados.map((d) => (
                <div key={d.abrev} className="kicker text-center">
                  {d.label}
                </div>
              ))}
              {subjects.map((s) => (
                <div key={s.id} className="contents">
                  <div className="truncate pr-2 text-sm font-medium">{s.nome}</div>
                  {diasOrdenados.map((d) => (
                    // label cobre a célula inteira (44px), não só a
                    // caixinha — alvo de toque real bem maior que os 20px
                    // visuais do checkbox.
                    <label key={d.abrev} className="flex h-10 w-11 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={!!marcado[`${s.id}|${d.abrev}`]}
                        onChange={() => toggle(s.id, d.abrev)}
                        className="h-5 w-5 accent-questly-green"
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button type="button" disabled={salvando} onClick={salvar} className={BTN_PRIMARIO}>
              {salvando ? "Salvando..." : "Salvar grade"}
            </button>
            <SavedTag show={saved} />
          </div>
        </>
      )}
    </Card>
  );
}

function DisciplinasCard({
  subjects,
  onSubjectsChange,
}: {
  subjects: SubjectComBosses[];
  onSubjectsChange: (subjects: SubjectComBosses[]) => void;
}) {
  const [novaDisc, setNovaDisc] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  async function adicionar(nome: string) {
    if (!nome.trim()) return;
    setAdicionando(true);
    const resultado = await criarDisciplinaAction(nome.trim());
    setAdicionando(false);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    if (resultado.subjects) onSubjectsChange(resultado.subjects);
    setNovaDisc("");
  }

  async function remover(subject: SubjectComBosses) {
    const provasCount = subject.bosses.length;
    const aviso =
      provasCount > 0
        ? `Remover "${subject.nome}" também vai remover ${provasCount} prova(s) cadastrada(s). Continuar?`
        : `Remover "${subject.nome}"?`;
    if (!confirm(aviso)) return;
    const resultado = await removerDisciplinaAction(subject.id);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    if (resultado.subjects) onSubjectsChange(resultado.subjects);
  }

  async function salvarNota(subject: SubjectComBosses, nota: number) {
    onSubjectsChange(subjects.map((s) => (s.id === subject.id ? { ...s, nota_desejada: nota } : s)));
    const resultado = await salvarNotaAction(subject.id, nota);
    if (resultado.error) alert(resultado.error);
  }

  const jaTem = new Set(subjects.map((s) => s.nome.trim().toLowerCase()));
  const sugestoes = DISCIPLINAS_PADRAO.filter((n) => !jaTem.has(n.toLowerCase()));

  return (
    <Card icon={BookOpen} title="Disciplinas & metas" sub="Clique numa nota pra atualizar a meta na hora.">
      {subjects.length === 0 ? (
        <p className="mb-5 text-sm text-muted-foreground">Nenhuma disciplina ainda. Adicione uma abaixo.</p>
      ) : (
        <div className="mb-5 flex flex-col gap-2.5">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-[15px] font-semibold tracking-tight">{s.nome}</h4>
                <button
                  type="button"
                  onClick={() => remover(s)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-questly-red-dark transition-colors hover:bg-questly-red-light"
                >
                  <Trash2 size={13} strokeWidth={1.75} /> Remover
                </button>
              </div>
              <div className="kicker mb-2">Nota desejada</div>
              <div className="flex gap-2">
                {[6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => salvarNota(s, n)}
                    className={`tnum flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                      s.nota_desejada === n
                        ? "border-questly-green/50 bg-questly-green-light text-questly-green-dark"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {sugestoes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {sugestoes.map((nome) => (
            <button
              key={nome}
              type="button"
              disabled={adicionando}
              onClick={() => adicionar(nome)}
              className={`${CHIP_BASE} ${CHIP_INATIVO} disabled:opacity-50`}
            >
              <Plus size={13} strokeWidth={2} className="mr-1 inline-block align-[-2px]" />
              {nome}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={novaDisc}
          onChange={(e) => setNovaDisc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar(novaDisc)}
          placeholder="Não achou? Digite o nome da disciplina"
          className="flex-1 rounded-xl border border-dashed border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20"
        />
        <button
          type="button"
          disabled={adicionando}
          onClick={() => adicionar(novaDisc)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-muted px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <Plus size={14} strokeWidth={2} /> Adicionar
        </button>
      </div>
    </Card>
  );
}

function ProvasCard({
  subjects,
  onSubjectsChange,
}: {
  subjects: SubjectComBosses[];
  onSubjectsChange: (subjects: SubjectComBosses[]) => void;
}) {
  async function adicionarProva(subject: SubjectComBosses) {
    const resultado = await adicionarProvaAction(subject.id, subject.bosses.length + 1);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    if (resultado.subjects) onSubjectsChange(resultado.subjects);
  }

  async function atualizarProva(bossId: string, campos: { nome?: string; data_prova?: string }) {
    const resultado = await atualizarProvaAction(bossId, campos);
    if (resultado.error) alert(resultado.error);
  }

  async function removerProva(subject: SubjectComBosses, bossId: string) {
    if (!confirm("Remover essa prova?")) return;
    const resultado = await removerProvaAction(bossId);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    if (resultado.subjects) onSubjectsChange(resultado.subjects);
  }

  return (
    <Card
      icon={Swords}
      title="Provas por disciplina"
      sub="Mudou a data de uma prova? Atualize aqui — a campanha recalcula sozinha."
    >
      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Adicione uma disciplina pra poder cadastrar provas.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="kicker mb-2.5">{s.nome}</div>
              {s.bosses.length === 0 && (
                <p className="mb-2 text-xs text-muted-foreground">Nenhuma prova cadastrada ainda.</p>
              )}
              <div className="flex flex-col gap-2">
                {s.bosses.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <input
                      defaultValue={b.nome}
                      onBlur={(e) => atualizarProva(b.id, { nome: e.target.value })}
                      className="w-[70px] rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20"
                    />
                    <input
                      type="date"
                      defaultValue={b.data_prova ? String(b.data_prova).slice(0, 10) : ""}
                      onBlur={(e) => atualizarProva(b.id, { data_prova: e.target.value })}
                      className="tnum flex-1 rounded-lg border border-border bg-card px-2.5 py-2 text-xs outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20"
                    />
                    <button
                      type="button"
                      onClick={() => removerProva(s, b.id)}
                      aria-label="Remover prova"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-questly-red transition-colors hover:bg-questly-red-light"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => adicionarProva(s)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-questly-green-dark transition-opacity hover:opacity-80"
              >
                <Plus size={14} strokeWidth={2} /> Adicionar prova
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
