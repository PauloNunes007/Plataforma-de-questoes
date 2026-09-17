"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { ROTULO_SITUACAO, tomSituacao, type ResumoNotas } from "@/lib/academico/academico";
import type { AvaliacaoRow, MateriaAcademica } from "@/lib/academico/academico-data";
import { apagarAvaliacaoAction, salvarAvaliacaoAction } from "@/lib/academico/actions";

// A calculadora de notas.
//
// A pergunta principal aqui NÃO é "qual é minha média" — é **"quanto eu
// preciso tirar na próxima pra passar"**. A média o aluno até consegue fazer
// de cabeça; a inversão ponderada com peso diferente por avaliação é onde ele
// erra, e é onde ele decide se vai estudar ou se já era.
//
// Por isso o número grande do cartão é o `precisaTirar`, e a média atual fica
// ao lado, menor. Quando não há o que projetar (já passou, ou não fecha mais),
// o mesmo espaço vira a frase direta — nunca um "0.0" que soaria como boa
// notícia num caso e como tragédia no outro.

const TOM = {
  verde: { texto: "text-questly-green-dark", suave: "bg-questly-green/12" },
  amarelo: { texto: "text-questly-orange-dark", suave: "bg-questly-orange/12" },
  vermelho: { texto: "text-questly-red-dark", suave: "bg-questly-red/12" },
  neutro: { texto: "text-muted-foreground", suave: "bg-muted" },
} as const;

function fmt(n: number | null, casas = 1): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function NotasCard({
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

  const r = materia.notas;
  const tom = TOM[tomSituacao(r.situacao)];

  function apagar(id: string) {
    startTransition(async () => {
      const res = await apagarAvaliacaoAction(id);
      if ("error" in res) setErro(res.error);
      else onMudou();
    });
  }

  function salvarNota(av: AvaliacaoRow, nota: number | null) {
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

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tom.suave} ${tom.texto}`}>
          <Target size={14} strokeWidth={2} />
        </span>
        <h3 className="text-[13.5px] font-semibold tracking-tight">Notas</h3>
        <span className="ml-auto text-[11.5px] text-muted-foreground">
          passa com {fmt(materia.mediaAprovacao, 1)}
        </span>
      </div>

      <Veredito resumo={r} tom={tom} />

      {erro && <p className="mt-2 text-[11.5px] text-questly-red-dark">{erro}</p>}

      {materia.avaliacoes.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
          {materia.avaliacoes.map((av) => (
            <LinhaAvaliacao
              key={av.id}
              av={av}
              editavel={editavel}
              onNota={(n) => salvarNota(av, n)}
              onApagar={() => apagar(av.id)}
            />
          ))}
        </ul>
      )}

      {editavel && (
        <div className="mt-3">
          {adicionando ? (
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
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 text-[12.5px] font-semibold transition-colors hover:bg-foreground/[0.07]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Adicionar avaliação
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Veredito({ resumo, tom }: { resumo: ResumoNotas; tom: (typeof TOM)[keyof typeof TOM] }) {
  if (resumo.situacao === "sem_dados") {
    return (
      <div className="rounded-xl border border-dashed border-border px-3.5 py-3">
        <p className="text-[12.5px] font-medium">Cadastre P1, P2, trabalho…</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Com os pesos certos, a gente calcula quanto você precisa tirar no que ainda falta.
        </p>
      </div>
    );
  }

  // Já passou ou já era: o número que importa não é uma projeção, é o fato.
  if (resumo.situacao === "aprovado" || resumo.situacao === "impossivel" || resumo.situacao === "reprovado") {
    return (
      <div>
        <div className="flex items-end gap-2">
          <span className={`tnum font-heading text-[40px] font-semibold leading-none ${tom.texto}`}>
            {fmt(resumo.mediaAtual)}
          </span>
          <span className="pb-1.5 text-[12.5px] text-muted-foreground">de média</span>
        </div>
        <p className={`mt-2 text-[12.5px] font-semibold ${tom.texto}`}>{ROTULO_SITUACAO[resumo.situacao]}</p>
        {resumo.situacao === "impossivel" && (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Nem tirando o máximo no que falta a média fecha — daqui, o caminho é a prova final.
          </p>
        )}
        {resumo.situacao === "reprovado" && (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Todas as avaliações já saíram e a média ficou abaixo da nota de aprovação.
          </p>
        )}
        {resumo.situacao === "aprovado" && resumo.pesoPendente > 0 && (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            A média já está garantida mesmo zerando o que falta.
          </p>
        )}
      </div>
    );
  }

  // O caso normal: existe uma nota-alvo, e ela é o número grande.
  return (
    <div>
      <div className="flex items-end gap-2">
        <span className={`tnum font-heading text-[40px] font-semibold leading-none ${tom.texto}`}>
          {fmt(resumo.precisaTirar)}
        </span>
        <span className="pb-1.5 text-[12.5px] leading-snug text-muted-foreground">
          é o que falta tirar
          <br />
          no que ainda vem
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
        <span>
          Média atual <b className="tnum font-semibold text-foreground">{fmt(resumo.mediaAtual)}</b>
        </span>
        <span>
          Já valeu <b className="tnum font-semibold text-foreground">{Math.round(resumo.fracaoConcluida * 100)}%</b>{" "}
          da nota
        </span>
      </div>
      <p className={`mt-1.5 text-[12px] font-medium ${tom.texto}`}>{ROTULO_SITUACAO[resumo.situacao]}</p>
    </div>
  );
}

function LinhaAvaliacao({
  av,
  editavel,
  onNota,
  onApagar,
}: {
  av: AvaliacaoRow;
  editavel: boolean;
  onNota: (n: number | null) => void;
  onApagar: () => void;
}) {
  const [valor, setValor] = useState(av.nota != null ? String(av.nota) : "");
  const [salvando, setSalvando] = useState(false);

  function commit() {
    const bruto = valor.trim().replace(",", ".");
    const n = bruto === "" ? null : Number(bruto);
    const atual = av.nota;
    if (n === atual || (n != null && Number.isNaN(n))) return;
    setSalvando(true);
    onNota(n);
    // O estado de "salvando" é otimista e some na próxima renderização do pai
    // (que vem do refresh do server component). Deixar o spinner preso a uma
    // promise aqui daria dois donos pro mesmo dado.
    setTimeout(() => setSalvando(false), 600);
  }

  return (
    <li className="flex items-center gap-2 text-[12.5px]">
      <span className="min-w-0 flex-1 truncate font-medium">{av.nome}</span>
      <span className="tnum shrink-0 text-[11px] text-muted-foreground">peso {av.peso}</span>
      {editavel ? (
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="—"
          inputMode="decimal"
          className={`tnum h-8 w-14 shrink-0 rounded-lg border bg-card px-2 text-center text-[12.5px] outline-none focus:border-questly-green ${
            av.nota != null ? "border-border font-semibold" : "border-dashed border-border text-muted-foreground"
          }`}
        />
      ) : (
        <span className="tnum w-14 shrink-0 text-center font-semibold">
          {av.nota != null ? av.nota : "—"}
        </span>
      )}
      <span className="tnum w-7 shrink-0 text-[11px] text-muted-foreground">/{av.notaMaxima}</span>
      {editavel && (
        <button
          type="button"
          onClick={onApagar}
          title="Apagar avaliação"
          className="shrink-0 text-muted-foreground/70 transition-colors hover:text-questly-red"
        >
          {salvando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} strokeWidth={2} />}
        </button>
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
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-[110px] flex-1 flex-col gap-1">
          <span className="kicker">Avaliação</span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="P1"
            maxLength={60}
            className="h-9 w-full rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker">Peso</span>
          <input
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            inputMode="decimal"
            className="tnum h-9 w-16 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker">Nota</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="—"
            inputMode="decimal"
            className="tnum h-9 w-16 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker">Vale até</span>
          <input
            value={notaMaxima}
            onChange={(e) => setNotaMaxima(e.target.value)}
            inputMode="decimal"
            className="tnum h-9 w-16 rounded-lg border border-border bg-card px-2 text-[12.5px] outline-none focus:border-questly-green"
          />
        </label>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Deixe a nota em branco pra avaliações que ainda não aconteceram — são elas que dizem quanto você
        precisa tirar.
      </p>

      {erro && <p className="mt-2 text-[11.5px] text-questly-red-dark">{erro}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={enviando || pendente || !nome.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60 dark:text-[#0c1512]"
        >
          {enviando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.4} />}
          Adicionar
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
