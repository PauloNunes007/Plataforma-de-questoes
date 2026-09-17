"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { ROTULO_SITUACAO, tomSituacao } from "@/lib/academico/academico";
import type { AvaliacaoRow, MateriaAcademica } from "@/lib/academico/academico-data";
import {
  apagarAvaliacaoAction,
  criarEstruturaAvaliacoesAction,
  salvarAvaliacaoAction,
} from "@/lib/academico/actions";
import { TONS, fmt } from "./tons";

// A aba "Notas" — a calculadora do semestre.
//
// A pergunta principal NÃO é "qual é minha média": essa o aluno faz de cabeça.
// É **"quanto preciso tirar na P2"** — a inversão ponderada com peso diferente
// por avaliação é onde ele erra, e é onde ele decide se vai estudar hoje ou se
// já era.
//
// Por isso o número grande é a nota da PRÓXIMA avaliação, na escala dela (uma
// P2 que vale 100 pede "84", não "8,4"), com o nome ao lado. A média atual e a
// média necessária no conjunto do que falta ficam menores, logo abaixo.
//
// Quando não há o que projetar (já passou, ou não fecha mais), o mesmo espaço
// vira a frase direta — nunca um "0,0" que soaria como boa notícia num caso e
// como tragédia no outro.

export function NotasPainel({
  materia,
  editavel,
  onMudou,
}: {
  materia: MateriaAcademica;
  editavel: boolean;
  onMudou: () => void;
}) {
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const pesoTotal = materia.avaliacoes.reduce((s, a) => s + (a.peso > 0 ? a.peso : 0), 0);
  // A "próxima" é a primeira SEM NOTA, identificada pelo id: comparar pelo nome
  // marcaria as duas quando o aluno tem duas avaliações chamadas "Trabalho".
  const idProxima = materia.avaliacoes.find((a) => a.nota == null && a.peso > 0)?.id ?? null;

  function apagar(id: string) {
    setErro(null);
    startTransition(async () => {
      const res = await apagarAvaliacaoAction(id);
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  function salvarNota(av: AvaliacaoRow, nota: number | null) {
    setErro(null);
    startTransition(async () => {
      const res = await salvarAvaliacaoAction({
        id: av.id,
        subjectId: materia.subjectId,
        nome: av.nome,
        peso: av.peso,
        nota,
        notaMaxima: av.notaMaxima,
        data: av.data,
        ordem: av.ordem,
      });
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  // Nenhuma avaliação cadastrada: a aba inteira vira a pergunta que monta o
  // semestre de uma vez, em vez de um formulário vazio com "peso" e "vale até".
  if (materia.avaliacoes.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {editavel ? (
          <AssistenteEstrutura subjectId={materia.subjectId} onPronto={onMudou} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-center">
            <p className="text-[13px] font-semibold">Nenhuma avaliação cadastrada</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Com as provas e os trabalhos no lugar, a gente calcula quanto falta tirar em cada um.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Veredito materia={materia} />

      {erro && <p className="text-[12px] text-questly-red-dark">{erro}</p>}

      <div className="border-t border-border pt-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="kicker">Avaliações</p>
          <p className="text-[11px] text-muted-foreground">
            passa com <b className="tnum font-semibold text-foreground">{fmt(materia.mediaAprovacao)}</b>
          </p>
        </div>
        <ul className="flex flex-col">
          {materia.avaliacoes.map((av) => (
            <LinhaAvaliacao
              key={av.id}
              av={av}
              pesoTotal={pesoTotal}
              editavel={editavel}
              proxima={av.id === idProxima}
              onNota={(n) => salvarNota(av, n)}
              onApagar={() => apagar(av.id)}
            />
          ))}
        </ul>
      </div>

      {editavel &&
        (adicionando ? (
          <FormAvaliacao
            subjectId={materia.subjectId}
            proximaOrdem={materia.avaliacoes.length}
            pendente={pendente}
            onCancelar={() => setAdicionando(false)}
            onSalvo={() => {
              setAdicionando(false);
              onMudou();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdicionando(true)}
            className="inline-flex h-9 w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-foreground/[0.07]"
          >
            <Plus size={14} strokeWidth={2.2} />
            Adicionar avaliação
          </button>
        ))}
    </div>
  );
}

/* ------------------------------------------------------------- veredito */

function Veredito({ materia }: { materia: MateriaAcademica }) {
  const r = materia.notas;
  const p = materia.proxima;
  const tom = TONS[tomSituacao(r.situacao)];

  // O caso normal: existe uma próxima avaliação, e ela é o número grande.
  if (p && p.precisa != null) {
    const alvo = Math.max(0, p.precisa);
    const forado = p.precisa > p.notaMaxima;
    const tomAlvo = forado ? TONS.vermelho : tom;

    return (
      <div className={`rounded-2xl border ${tomAlvo.borda} ${tomAlvo.suave} px-4 py-3.5`}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`tnum font-heading text-[40px] font-semibold leading-none ${tomAlvo.texto}`}>
            {fmt(alvo)}
          </span>
          <span className="text-[13px] leading-snug text-muted-foreground">
            é o que você precisa na <b className="font-semibold text-foreground">{p.nome}</b>
          </span>
        </div>

        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          {forado ? (
            <>
              A {p.nome} vale até {fmt(p.notaMaxima, 0)} —{" "}
              <b className="font-semibold text-questly-red-dark">só ela não fecha mais a média</b>
              {p.pendentesDepois > 0 ? ", mesmo gabaritando." : "."}
            </>
          ) : p.pendentesDepois > 0 ? (
            <>
              Supondo a mesma nota nas outras {p.pendentesDepois}{" "}
              {p.pendentesDepois === 1 ? "avaliação" : "avaliações"} que faltam. Essa vale{" "}
              {Math.round(p.fracaoDoTotal * 100)}% da nota final.
            </>
          ) : (
            <>É a última avaliação — ela sozinha decide {Math.round(p.fracaoDoTotal * 100)}% da nota final.</>
          )}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-foreground/[0.07] pt-2.5 sm:grid-cols-3">
          <Mini rotulo="Média atual" valor={fmt(r.mediaAtual)} />
          <Mini rotulo="Já valeu" valor={`${Math.round(r.fracaoConcluida * 100)}%`} />
          {p.seTirarMaximo != null && (
            <Mini
              rotulo={`Com ${fmt(p.notaMaxima, 0)} na ${p.nome}`}
              valor={p.seTirarMaximo <= 0 ? "já passa" : `${fmt(p.seTirarMaximo)} no resto`}
            />
          )}
        </div>
      </div>
    );
  }

  // Sem corrida: o número que importa não é projeção, é fato.
  return (
    <div className={`rounded-2xl border ${tom.borda} ${tom.suave} px-4 py-3.5`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className={`tnum font-heading text-[40px] font-semibold leading-none ${tom.texto}`}>
          {fmt(r.mediaAtual)}
        </span>
        <span className="text-[13px] text-muted-foreground">de média</span>
      </div>
      <p className={`mt-2 text-[12.5px] font-semibold ${tom.texto}`}>{ROTULO_SITUACAO[r.situacao]}</p>
      {r.situacao === "impossivel" && (
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Nem tirando o máximo no que falta a média fecha — daqui, o caminho é a prova final.
        </p>
      )}
      {r.situacao === "reprovado" && (
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Todas as avaliações já saíram e a média ficou abaixo da nota de aprovação.
        </p>
      )}
      {r.situacao === "aprovado" && r.pesoPendente > 0 && (
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
          A média já está garantida mesmo zerando o que falta.
        </p>
      )}
      {r.situacao === "sem_notas" && (
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Lance a primeira nota abaixo e a projeção aparece aqui.
        </p>
      )}
    </div>
  );
}

function Mini({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {rotulo}
      </p>
      <p className="tnum truncate text-[13px] font-semibold">{valor}</p>
    </div>
  );
}

/* --------------------------------------------- assistente de estrutura */

/**
 * "Quantas provas? Quantos trabalhos? Quanto vale cada um?" — as três
 * perguntas que o aluno já sabe responder de cabeça, porque é assim que o
 * professor apresenta o critério no primeiro dia de aula.
 *
 * A prévia embaixo mostra o que vai ser criado E quanto cada coisa vale em
 * porcentagem: é ali que ele percebe que digitou o peso errado, antes de a
 * média ficar torta por um semestre inteiro.
 */
export function AssistenteEstrutura({
  subjectId,
  onPronto,
}: {
  subjectId: string;
  onPronto: () => void;
}) {
  const [provas, setProvas] = useState(2);
  const [trabalhos, setTrabalhos] = useState(0);
  const [pesoProva, setPesoProva] = useState("1");
  const [pesoTrabalho, setPesoTrabalho] = useState("1");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const pp = Number(pesoProva.replace(",", ".")) || 0;
  const pt = Number(pesoTrabalho.replace(",", ".")) || 0;
  const total = provas * pp + trabalhos * pt;
  const nomes = [
    ...Array.from({ length: provas }, (_, i) => (provas === 1 ? "Prova" : `P${i + 1}`)),
    ...Array.from({ length: trabalhos }, (_, i) => (trabalhos === 1 ? "Trabalho" : `Trabalho ${i + 1}`)),
  ];

  function criar() {
    setErro(null);
    startTransition(async () => {
      const res = await criarEstruturaAvaliacoesAction({
        subjectId,
        provas,
        pesoProva: pp || 1,
        trabalhos,
        pesoTrabalho: pt || 1,
        notaMaxima: Number(notaMaxima.replace(",", ".")) || 10,
      });
      if ("error" in res) setErro(res.error);
      else onPronto();
    });
  }

  return (
    <div className="surface-brand rounded-2xl p-4">
      <p className="flex items-center gap-1.5 font-heading text-[14px] font-semibold tracking-tight">
        <Sparkles size={14} strokeWidth={2.2} className="text-questly-green" />
        Como essa matéria é avaliada?
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        Monte a grade do semestre de uma vez. Dá pra editar, apagar e acrescentar depois.
      </p>

      <div className="mt-3.5 flex flex-col gap-2.5">
        <LinhaContador
          rotulo="Provas"
          qtd={provas}
          onQtd={setProvas}
          peso={pesoProva}
          onPeso={setPesoProva}
        />
        <LinhaContador
          rotulo="Trabalhos"
          qtd={trabalhos}
          onQtd={setTrabalhos}
          peso={pesoTrabalho}
          onPeso={setPesoTrabalho}
        />
      </div>

      <label className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <span className="text-[12.5px] font-medium">Cada uma vale até</span>
        <input
          value={notaMaxima}
          onChange={(e) => setNotaMaxima(e.target.value.replace(",", "."))}
          inputMode="decimal"
          aria-label="Nota máxima de cada avaliação"
          className="tnum h-8 w-16 rounded-lg border border-border bg-card px-2 text-center text-[12.5px] outline-none focus:border-questly-green"
        />
      </label>

      {/* A prévia: o que vai ser criado e quanto cada coisa pesa. */}
      {nomes.length > 0 && total > 0 && (
        <div className="mt-3 rounded-xl bg-foreground/[0.04] px-3 py-2.5">
          <div className="flex flex-wrap gap-1">
            {nomes.map((n) => (
              <span
                key={n}
                className="rounded-md bg-card px-1.5 py-[3px] text-[10.5px] font-semibold shadow-sm"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {provas > 0 && (
              <>
                Cada prova vale{" "}
                <b className="tnum font-semibold text-foreground">{Math.round((pp / total) * 100)}%</b>
                {trabalhos > 0 ? " · " : " "}
              </>
            )}
            {trabalhos > 0 && (
              <>
                cada trabalho vale{" "}
                <b className="tnum font-semibold text-foreground">{Math.round((pt / total) * 100)}%</b>
              </>
            )}
            {" da nota final."}
          </p>
        </div>
      )}

      {erro && <p className="mt-2 text-[12px] text-questly-red-dark">{erro}</p>}

      <button
        type="button"
        onClick={criar}
        disabled={enviando || provas + trabalhos === 0}
        className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-questly-green px-4 text-[13px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:cursor-default disabled:opacity-60 dark:text-[#0c1512]"
      >
        {enviando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.4} />}
        Criar {nomes.length} {nomes.length === 1 ? "avaliação" : "avaliações"}
      </button>
    </div>
  );
}

function LinhaContador({
  rotulo,
  qtd,
  onQtd,
  peso,
  onPeso,
}: {
  rotulo: string;
  qtd: number;
  onQtd: (n: number) => void;
  peso: string;
  onPeso: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{rotulo}</span>

      <span className="flex items-center gap-1">
        <BotaoPasso
          rotulo={`Menos ${rotulo.toLowerCase()}`}
          onClick={() => onQtd(Math.max(0, qtd - 1))}
          desabilitado={qtd <= 0}
        >
          −
        </BotaoPasso>
        <span className="tnum w-6 text-center text-[14px] font-semibold">{qtd}</span>
        <BotaoPasso
          rotulo={`Mais ${rotulo.toLowerCase()}`}
          onClick={() => onQtd(Math.min(12, qtd + 1))}
          desabilitado={qtd >= 12}
        >
          +
        </BotaoPasso>
      </span>

      <label className="flex items-center gap-1.5 border-l border-border pl-2.5">
        <span className="text-[11px] text-muted-foreground">peso</span>
        <input
          value={peso}
          onChange={(e) => onPeso(e.target.value.replace(",", "."))}
          inputMode="decimal"
          aria-label={`Peso de cada ${rotulo.toLowerCase().replace(/s$/, "")}`}
          disabled={qtd === 0}
          className="tnum h-8 w-14 rounded-lg border border-border bg-card px-2 text-center text-[12.5px] outline-none focus:border-questly-green disabled:opacity-40"
        />
      </label>
    </div>
  );
}

function BotaoPasso({
  children,
  rotulo,
  onClick,
  desabilitado,
}: {
  children: React.ReactNode;
  rotulo: string;
  onClick: () => void;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border text-[15px] font-semibold leading-none text-muted-foreground transition-colors hover:border-questly-green/40 hover:bg-questly-green/10 hover:text-questly-green-dark disabled:cursor-default disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- linhas */

function LinhaAvaliacao({
  av,
  pesoTotal,
  editavel,
  proxima,
  onNota,
  onApagar,
}: {
  av: AvaliacaoRow;
  pesoTotal: number;
  editavel: boolean;
  proxima: boolean;
  onNota: (n: number | null) => void;
  onApagar: () => void;
}) {
  const [valor, setValor] = useState(av.nota != null ? String(av.nota) : "");
  const [salvando, setSalvando] = useState(false);

  function commit() {
    const bruto = valor.trim().replace(",", ".");
    const n = bruto === "" ? null : Number(bruto);
    if (n === av.nota || (n != null && Number.isNaN(n))) return;
    setSalvando(true);
    onNota(n);
    // O "salvando" é otimista e some na próxima renderização do pai (que vem
    // do refresh do server component). Prender o spinner a uma promise aqui
    // daria dois donos pro mesmo dado.
    setTimeout(() => setSalvando(false), 700);
  }

  const pct = pesoTotal > 0 ? Math.round((av.peso / pesoTotal) * 100) : 0;

  return (
    <li className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[12.5px] transition-colors hover:bg-muted/60">
      <span className="min-w-0 flex-1 truncate">
        <b className="font-semibold">{av.nome}</b>
        {proxima && (
          <span className="ml-1.5 rounded bg-questly-green/12 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-questly-green-dark">
            próxima
          </span>
        )}
      </span>
      <span className="tnum shrink-0 text-[11px] text-muted-foreground">{pct}%</span>

      {editavel ? (
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="—"
          inputMode="decimal"
          aria-label={`Nota de ${av.nome}`}
          className={`tnum h-8 w-[52px] shrink-0 rounded-lg border bg-card px-1.5 text-center text-[12.5px] outline-none focus:border-questly-green ${
            av.nota != null
              ? "border-border font-semibold"
              : "border-dashed border-border text-muted-foreground"
          }`}
        />
      ) : (
        <span className="tnum w-[52px] shrink-0 text-center font-semibold">
          {av.nota != null ? av.nota : "—"}
        </span>
      )}
      <span className="tnum w-8 shrink-0 text-[11px] text-muted-foreground">/{av.notaMaxima}</span>

      {editavel && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center">
          {salvando ? (
            <Loader2 size={13} className="animate-spin text-questly-green" />
          ) : (
            <button
              type="button"
              onClick={onApagar}
              title={`Apagar ${av.nome}`}
              aria-label={`Apagar ${av.nome}`}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-questly-red/10 hover:text-questly-red-dark"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
        </span>
      )}
    </li>
  );
}

function FormAvaliacao({
  subjectId,
  proximaOrdem,
  pendente,
  onCancelar,
  onSalvo,
}: {
  subjectId: string;
  proximaOrdem: number;
  pendente: boolean;
  onCancelar: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState("");
  const [peso, setPeso] = useState("1");
  const [nota, setNota] = useState("");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const res = await salvarAvaliacaoAction({
        subjectId,
        nome,
        peso: Number(peso.replace(",", ".")) || 1,
        nota: nota.trim() === "" ? null : Number(nota.replace(",", ".")),
        notaMaxima: Number(notaMaxima.replace(",", ".")) || 10,
        data: null,
        ordem: proximaOrdem,
      });
      if ("error" in res) setErro(res.error);
      else onSalvo();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="kicker">Nova avaliação</p>
        <button
          type="button"
          onClick={onCancelar}
          aria-label="Fechar"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-[130px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Nome</span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="P3, Seminário…"
            maxLength={60}
            className="h-9 w-full min-w-0 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
        <CampoNumero rotulo="Peso" valor={peso} onChange={setPeso} />
        <CampoNumero rotulo="Nota" valor={nota} onChange={setNota} placeholder="—" />
        <CampoNumero rotulo="Vale até" valor={notaMaxima} onChange={setNotaMaxima} />
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Deixe a nota em branco se ela ainda não aconteceu — são as pendentes que dizem quanto você precisa
        tirar.
      </p>

      {erro && <p className="mt-2 text-[12px] text-questly-red-dark">{erro}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={enviando || pendente || !nome.trim()}
        className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:cursor-default disabled:opacity-60 dark:text-[#0c1512]"
      >
        {enviando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.4} />}
        Adicionar
      </button>
    </div>
  );
}

function CampoNumero({
  rotulo,
  valor,
  onChange,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{rotulo}</span>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value.replace(",", "."))}
        placeholder={placeholder}
        inputMode="decimal"
        className="tnum h-9 w-[58px] rounded-lg border border-border bg-card px-1.5 text-center text-[12.5px] outline-none focus:border-questly-green"
      />
    </label>
  );
}
