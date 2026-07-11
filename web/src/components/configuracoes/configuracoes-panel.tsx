"use client";

import { useRef, useState } from "react";
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
  salvarNotaAction,
  salvarRotinaAction,
  uploadFotoAction,
  type SubjectComBosses,
} from "@/lib/configuracoes/actions";

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

type ProfileMin = {
  nome: string | null;
  foto_url: string | null;
  dias_disponiveis: string[] | null;
  tempo_diario_min: number | null;
};

function Card({
  icon,
  title,
  sub,
  action,
  children,
}: {
  icon: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-6">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">
          {icon} {title}
        </h2>
        {action}
      </div>
      <p className="mb-5 text-sm font-semibold text-muted-foreground">{sub}</p>
      {children}
    </div>
  );
}

function SavedTag({ show }: { show: boolean }) {
  return (
    <span
      className={`text-xs font-extrabold text-questly-green-dark transition-opacity ${show ? "opacity-100" : "opacity-0"}`}
    >
      ✓ Salvo
    </span>
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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
        active
          ? "border-questly-green bg-questly-green-light text-questly-green-dark"
          : "border-border bg-card text-muted-foreground hover:border-questly-green"
      }`}
    >
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
    <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-6 py-8">
      <h1 className="font-heading text-2xl font-semibold">Configurações</h1>

      <FotoCard nome={profile?.nome || "Aluno(a)"} fotoUrlInicial={profile?.foto_url ?? null} />

      <RotinaCard dias={dias} tempoMin={tempoMin} onSalvar={(d, t) => { setDias(d); setTempoMin(t); }} />

      <GradeSemanalCard subjects={subjects} dias={dias} tempoMin={tempoMin} rotinaInicial={rotinaInicial} />

      <DisciplinasCard subjects={subjects} onSubjectsChange={setSubjects} />

      <ProvasCard subjects={subjects} onSubjectsChange={setSubjects} />
    </div>
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
      icon="🖼️"
      title="Foto de perfil"
      sub="Aparece pros outros alunos no ranking. A imagem é recortada e reduzida automaticamente antes de subir."
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-questly-green to-[#57D96F] font-heading text-xl font-bold text-white">
          {mostrarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mostrarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border-2 border-border bg-card px-4 py-2 text-xs font-extrabold text-muted-foreground"
            >
              Escolher imagem
            </button>
            {fotoUrl && (
              <button
                type="button"
                onClick={removerFoto}
                className="rounded-xl border-2 border-border bg-card px-4 py-2 text-xs font-extrabold text-questly-red-dark"
              >
                Remover
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={aoEscolherArquivo} />
          {pendente && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={enviando}
                onClick={salvarFoto}
                className="rounded-xl bg-questly-green px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
              >
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
    <Card icon="🗓️" title="Rotina de estudos" sub="As missões diárias só são geradas nos dias marcados abaixo.">
      <div className="mb-5 flex flex-wrap gap-2.5">
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
      <div className="mb-5 flex flex-wrap gap-2.5">
        {TEMPO_OPCOES.map((t) => (
          <Chip key={t.label} active={tempoLabel === t.label} onClick={() => setTempoLabel(t.label)}>
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={salvando}
          onClick={salvar}
          className="rounded-xl bg-questly-green px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
        >
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
      icon="📅"
      title="Grade semanal por disciplina"
      sub="Marque em quais dias você estuda cada disciplina. A recomendação usa a proximidade das provas, seu desempenho e sua meta de nota — mas quem decide é você."
      action={
        subjects.length > 0 && diasOrdenados.length > 0 ? (
          <button
            type="button"
            onClick={recomendar}
            className="shrink-0 rounded-xl border-2 border-border bg-card px-3.5 py-2 text-xs font-extrabold text-muted-foreground"
          >
            🎯 Recomendar
          </button>
        ) : undefined
      }
    >
      {subjects.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground">
          Adicione uma disciplina abaixo pra montar sua grade semanal.
        </p>
      ) : diasOrdenados.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground">
          Escolha seus dias disponíveis em &quot;Rotina de estudos&quot; acima primeiro.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div
              className="grid items-center gap-y-2"
              style={{ gridTemplateColumns: `160px repeat(${diasOrdenados.length}, 44px)` }}
            >
              <div />
              {diasOrdenados.map((d) => (
                <div key={d.abrev} className="text-center text-[11px] font-extrabold text-muted-foreground">
                  {d.label}
                </div>
              ))}
              {subjects.map((s) => (
                <div key={s.id} className="contents">
                  <div className="truncate pr-2 text-sm font-bold">{s.nome}</div>
                  {diasOrdenados.map((d) => (
                    <div key={d.abrev} className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={!!marcado[`${s.id}|${d.abrev}`]}
                        onChange={() => toggle(s.id, d.abrev)}
                        className="h-5 w-5 accent-questly-green"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled={salvando}
              onClick={salvar}
              className="rounded-xl bg-questly-green px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
            >
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
    <Card icon="📚" title="Disciplinas & metas" sub="Clique numa nota pra atualizar a meta na hora.">
      {subjects.length === 0 ? (
        <p className="mb-5 text-sm font-semibold text-muted-foreground">Nenhuma disciplina ainda. Adicione uma abaixo.</p>
      ) : (
        <div className="mb-5 flex flex-col gap-3">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-2xl bg-muted p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-heading text-[15px] font-semibold">{s.nome}</h4>
                <button
                  type="button"
                  onClick={() => remover(s)}
                  className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold text-questly-red-dark"
                >
                  Remover
                </button>
              </div>
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                Nota desejada
              </div>
              <div className="flex gap-2">
                {[6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => salvarNota(s, n)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 font-heading text-sm font-semibold ${
                      s.nota_desejada === n
                        ? "border-questly-green bg-questly-green-light text-questly-green-dark"
                        : "border-border bg-card"
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

      <div className="mb-4 flex flex-wrap gap-2">
        {sugestoes.map((nome) => (
          <button
            key={nome}
            type="button"
            disabled={adicionando}
            onClick={() => adicionar(nome)}
            className="rounded-full border-2 border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:border-questly-green disabled:opacity-50"
          >
            {nome}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={novaDisc}
          onChange={(e) => setNovaDisc(e.target.value)}
          placeholder="Não achou? Digite o nome da disciplina"
          className="flex-1 rounded-xl border-2 border-dashed border-border px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-questly-blue"
        />
        <button
          type="button"
          disabled={adicionando}
          onClick={() => adicionar(novaDisc)}
          className="rounded-xl bg-muted px-4 text-xs font-extrabold text-muted-foreground disabled:opacity-50"
        >
          + Adicionar
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
      icon="🗡️"
      title="Provas por disciplina"
      sub="Mudou a data de uma prova? Atualize aqui — a campanha recalcula sozinha."
    >
      {subjects.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground">
          Adicione uma disciplina pra poder cadastrar provas.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-2xl bg-muted p-4">
              <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {s.nome}
              </div>
              {s.bosses.length === 0 && (
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Nenhuma prova cadastrada ainda.</p>
              )}
              <div className="flex flex-col gap-2">
                {s.bosses.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <input
                      defaultValue={b.nome}
                      onBlur={(e) => atualizarProva(b.id, { nome: e.target.value })}
                      className="w-[70px] rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-bold outline-none"
                    />
                    <input
                      type="date"
                      defaultValue={b.data_prova ? String(b.data_prova).slice(0, 10) : ""}
                      onBlur={(e) => atualizarProva(b.id, { data_prova: e.target.value })}
                      className="flex-1 rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-semibold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removerProva(s, b.id)}
                      className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card font-bold text-questly-red"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => adicionarProva(s)}
                className="mt-2.5 text-xs font-extrabold text-questly-green-dark"
              >
                + Adicionar prova
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
