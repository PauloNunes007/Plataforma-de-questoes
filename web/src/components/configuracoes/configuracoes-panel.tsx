"use client";

// Configurações — redesign fintech (2026-07-14): um card "Conta" estilo
// app de banco (capa em gradiente do curso, avatar sobreposto, linhas de
// conta com edição inline pra Nome e Username) seguido de seções
// agrupadas por kicker. O username (@handle, único, carência de 15 dias)
// é a identidade pública do ranking; o nome é só exibição no dashboard —
// ver supabase_username.sql.
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  Lock,
  Plus,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
} from "@/lib/questly/shared";
import { redimensionarAvatar } from "@/lib/configuracoes/avatar-resize";
import { resolverCurso, cursoReconhecido } from "@/lib/cursos/registro";
import { CursoIcone } from "@/components/cursos/curso-icone";
import {
  criarDisciplinaAction,
  removerDisciplinaAction,
  removerFotoAction,
  salvarNomeAction,
  salvarNotaAction,
  salvarRotinaAction,
  salvarUsernameAction,
  uploadFotoAction,
  type SubjectComBosses,
} from "@/lib/configuracoes/actions";

const USERNAME_CARENCIA_DIAS = 15;

const DIAS_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
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

const INPUT_BASE =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20";

type ProfileMin = {
  nome: string | null;
  username: string | null;
  username_alterado_em: string | null;
  curso: string | null;
  foto_url: string | null;
  dias_disponiveis: string[] | null;
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-questly-green/18 to-questly-green/5 text-questly-green-dark ring-1 ring-inset ring-questly-green/15">
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

function SecaoKicker({ children }: { children: React.ReactNode }) {
  return <div className="kicker mt-3 px-1">{children}</div>;
}

// **Repasse de 2026-09-16 — fim do motor de missões.** Saíram daqui três
// cartões, todos entradas de um motor que não existe mais: o modo de estudo
// (não há mais dois modos), a grade semanal por disciplina (quem estuda o quê
// em cada dia) e as provas por disciplina — a data da prova agora é marcada em
// /calendario, como qualquer outro compromisso, e não alimenta recomendação
// nenhuma. Sobraram conta, ritmo e disciplinas.
export function ConfiguracoesPanel({
  profile,
  subjectsIniciais,
}: {
  profile: ProfileMin | null;
  subjectsIniciais: SubjectComBosses[];
}) {
  const [subjects, setSubjects] = useState(subjectsIniciais);
  const [dias, setDias] = useState<string[]>(profile?.dias_disponiveis || []);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-5 py-8 sm:px-6">
      <div className="mb-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua conta, seu ritmo e suas disciplinas — tudo num lugar só.
        </p>
      </div>

      <ContaCard profile={profile} />

      <SecaoKicker>Ritmo</SecaoKicker>
      <RotinaCard dias={dias} onSalvar={setDias} />

      <SecaoKicker>Disciplinas</SecaoKicker>
      <DisciplinasCard subjects={subjects} onSubjectsChange={setSubjects} />
    </div>
  );
}

function diasRestantesCarencia(alteradoEm: string | null): number {
  if (!alteradoEm) return 0;
  const decorridoMs = Date.now() - new Date(alteradoEm).getTime();
  const restanteMs = USERNAME_CARENCIA_DIAS * 24 * 60 * 60 * 1000 - decorridoMs;
  return restanteMs <= 0 ? 0 : Math.ceil(restanteMs / (24 * 60 * 60 * 1000));
}

// ————— Card "Conta": capa + avatar + nome + username, estilo fintech —————

function ContaCard({ profile }: { profile: ProfileMin | null }) {
  const identidade = resolverCurso(profile?.curso ?? null);
  const reconhecido = cursoReconhecido(identidade);

  const [nome, setNome] = useState(profile?.nome ?? "");
  const [username, setUsername] = useState(profile?.username ?? null);

  return (
    <div className="surface overflow-hidden">
      {/* capa com o acento do curso — o app "reage" a quem você é */}
      <div
        className="relative h-24"
        style={{ background: `linear-gradient(120deg, ${identidade.corA}, ${identidade.corB})` }}
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-sm" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-black/10 blur-md" />
        {reconhecido && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/20 py-1 pl-1.5 pr-3 text-white ring-1 ring-white/25 backdrop-blur-sm">
            <span className="flex h-5 w-5 items-center justify-center">
              <CursoIcone icone={identidade.icone} size={14} strokeWidth={2} />
            </span>
            <span className="truncate text-[10.5px] font-semibold uppercase tracking-wide">
              {identidade.nome}
            </span>
          </span>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-10 mb-4 flex items-end justify-between gap-3">
          <FotoAvatar nome={nome || "Aluno(a)"} fotoUrlInicial={profile?.foto_url ?? null} />
          <div className="min-w-0 pb-1 text-right">
            <p className="truncate font-heading text-[17px] font-semibold leading-tight">{nome || "Sem nome"}</p>
            <p className="truncate text-[12.5px] text-muted-foreground">
              {username ? `@${username}` : "sem username ainda"}
            </p>
          </div>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border">
          <NomeRow nome={nome} onSalvo={setNome} />
          <UsernameRow
            usernameInicial={username}
            usernameAlteradoEmInicial={profile?.username_alterado_em ?? null}
            onSalvo={setUsername}
          />
        </div>
      </div>
    </div>
  );
}

// Avatar com upload embutido: câmera abre o seletor, e a confirmação
// aparece como uma barra inline logo abaixo (mesmo fluxo de antes, só
// que sem um card inteiro dedicado à foto).
function FotoAvatar({ nome, fotoUrlInicial }: { nome: string; fotoUrlInicial: string | null }) {
  const [fotoUrl, setFotoUrl] = useState(fotoUrlInicial);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendente, setPendente] = useState<Blob | null>(null);
  const [enviando, setEnviando] = useState(false);
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
    }
  }

  function descartar() {
    setPendente(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removerFoto() {
    if (!confirm("Remover sua foto de perfil?")) return;
    const resultado = await removerFotoAction();
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    setFotoUrl(null);
    descartar();
  }

  const mostrarUrl = previewUrl || fotoUrl;

  return (
    <div className="flex items-end gap-2.5">
      <div className="relative shrink-0">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-questly-green to-questly-green-deep text-2xl font-semibold text-white ring-4 ring-card">
          {mostrarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mostrarUrl} alt="Sua foto de perfil" className="h-full w-full object-cover" />
          ) : (
            nome.charAt(0).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Trocar foto de perfil"
          className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <Camera size={14} strokeWidth={2} />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={aoEscolherArquivo} />
      </div>

      {pendente ? (
        <div className="flex items-center gap-1.5 pb-0.5">
          <button
            type="button"
            disabled={enviando}
            onClick={salvarFoto}
            className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:brightness-105 disabled:opacity-50 dark:text-[#0c1512]"
          >
            <Check size={13} strokeWidth={2.5} /> {enviando ? "Enviando..." : "Salvar foto"}
          </button>
          <button
            type="button"
            onClick={descartar}
            aria-label="Descartar foto escolhida"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ) : (
        fotoUrl && (
          <button
            type="button"
            onClick={removerFoto}
            aria-label="Remover foto de perfil"
            className="mb-0.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-questly-red-light hover:text-questly-red-dark"
          >
            <Trash2 size={13.5} strokeWidth={1.75} />
          </button>
        )
      )}
    </div>
  );
}

// Linha de conta genérica (rótulo + valor + Editar → input inline).
function LinhaConta({
  rotulo,
  hint,
  valor,
  placeholderVazio,
  bloqueadoInfo,
  editando,
  onEditar,
  saved,
  children,
}: {
  rotulo: string;
  hint: string;
  valor: string | null;
  placeholderVazio: string;
  bloqueadoInfo?: string | null;
  editando: boolean;
  onEditar: () => void;
  saved: boolean;
  children: React.ReactNode; // o formulário inline quando editando
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="kicker">{rotulo}</div>
          {!editando && (
            <p className={`mt-1 truncate text-[14.5px] font-semibold ${valor ? "" : "text-muted-foreground/70"}`}>
              {valor || placeholderVazio}
            </p>
          )}
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{hint}</p>
          {bloqueadoInfo && (
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Lock size={11} strokeWidth={1.75} /> {bloqueadoInfo}
            </p>
          )}
        </div>
        {!editando && (
          <div className="flex shrink-0 items-center gap-2">
            <SavedTag show={saved} />
            <button type="button" disabled={!!bloqueadoInfo} onClick={onEditar} className={BTN_SECUNDARIO}>
              Editar
            </button>
          </div>
        )}
      </div>
      {editando && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

function NomeRow({ nome, onSalvo }: { nome: string; onSalvo: (nome: string) => void }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(nome);
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setRascunho(nome);
    setErro(null);
    setEditando(false);
  }

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
    onSalvo(resultado.nome);
    setRascunho(resultado.nome);
    setEditando(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <LinhaConta
      rotulo="Nome de exibição"
      hint="Aparece na saudação do seu dashboard — só você vê."
      valor={nome || null}
      placeholderVazio="Sem nome definido"
      editando={editando}
      onEditar={() => {
        setRascunho(nome);
        setEditando(true);
      }}
      saved={saved}
    >
      <div className="flex flex-col gap-2.5">
        <input
          autoFocus
          value={rascunho}
          maxLength={40}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") salvar();
            if (e.key === "Escape") fechar();
          }}
          placeholder="Seu nome"
          className={INPUT_BASE}
        />
        {erro && <p className="text-xs font-medium text-questly-red-dark">{erro}</p>}
        <div className="flex items-center gap-2">
          <button type="button" disabled={salvando} onClick={salvar} className={BTN_PRIMARIO}>
            {salvando ? "Salvando..." : "Salvar nome"}
          </button>
          <button type="button" onClick={fechar} className={BTN_SECUNDARIO}>
            Cancelar
          </button>
        </div>
      </div>
    </LinhaConta>
  );
}

function UsernameRow({
  usernameInicial,
  usernameAlteradoEmInicial,
  onSalvo,
}: {
  usernameInicial: string | null;
  usernameAlteradoEmInicial: string | null;
  onSalvo: (username: string) => void;
}) {
  const [username, setUsername] = useState(usernameInicial);
  const [alteradoEm, setAlteradoEm] = useState(usernameAlteradoEmInicial);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(usernameInicial ?? "");
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // A carência só vale pra quem JÁ tem username — escolher o primeiro é livre.
  const diasRestantes = username ? diasRestantesCarencia(alteradoEm) : 0;

  function fechar() {
    setRascunho(username ?? "");
    setErro(null);
    setEditando(false);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const resultado = await salvarUsernameAction(rascunho);
    setSalvando(false);
    if (!("username" in resultado)) {
      setErro(resultado.error);
      return;
    }
    setUsername(resultado.username);
    setAlteradoEm(resultado.usernameAlteradoEm || null);
    onSalvo(resultado.username);
    setEditando(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <LinhaConta
      rotulo="Username"
      hint="Sua identidade pública no ranking. Único entre todos os alunos e trocável a cada 15 dias."
      valor={username ? `@${username}` : null}
      placeholderVazio="Escolha seu @"
      bloqueadoInfo={diasRestantes > 0 ? `Você poderá trocar de novo em ${diasRestantes} dia(s).` : null}
      editando={editando}
      onEditar={() => {
        setRascunho(username ?? "");
        setEditando(true);
      }}
      saved={saved}
    >
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <AtSign
            size={15}
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoFocus
            value={rascunho}
            maxLength={20}
            onChange={(e) => setRascunho(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvar();
              if (e.key === "Escape") fechar();
            }}
            placeholder="seu.username"
            className={`${INPUT_BASE} pl-9 lowercase`}
          />
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          3–20 caracteres: letras minúsculas, números, ponto e underline.
        </p>
        {erro && <p className="text-xs font-medium text-questly-red-dark">{erro}</p>}
        <div className="flex items-center gap-2">
          <button type="button" disabled={salvando} onClick={salvar} className={BTN_PRIMARIO}>
            {salvando ? "Salvando..." : "Salvar username"}
          </button>
          <button type="button" onClick={fechar} className={BTN_SECUNDARIO}>
            Cancelar
          </button>
        </div>
      </div>
    </LinhaConta>
  );
}

// ————— Ritmo —————
//
// Os dias marcados aqui não geram nada nem cobram nada: eles só dizem em
// quantos dias por semana o aluno pretende estudar, e é isso que a home usa
// pra dimensionar a meta semanal de XP. O "tempo por dia" saiu junto com o
// motor — era o orçamento que ele dividia entre as disciplinas do dia, e sem
// motor nenhuma tela lia aquele número.
function RotinaCard({ dias, onSalvar }: { dias: string[]; onSalvar: (dias: string[]) => void }) {
  const [diasSel, setDiasSel] = useState<string[]>(dias);
  const [salvando, setSalvando] = useState(false);
  const [saved, setSaved] = useState(false);

  async function salvar() {
    setSalvando(true);
    const resultado = await salvarRotinaAction(diasSel);
    setSalvando(false);
    if (resultado.error) {
      alert(resultado.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    onSalvar(diasSel);
  }

  return (
    <Card
      icon={CalendarDays}
      title="Dias de estudo"
      sub="Em quantos dias por semana você pretende estudar. Serve pra calibrar sua meta de XP da semana — não gera tarefa nem cobrança."
    >
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
      <div className="flex items-center gap-3">
        <button type="button" disabled={salvando} onClick={salvar} className={BTN_PRIMARIO}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <SavedTag show={saved} />
      </div>
    </Card>
  );
}

// ————— Disciplinas —————

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
                    className={`tnum flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
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

