"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Wand2 } from "lucide-react";
import { sugerirFaltasMax } from "@/lib/academico/academico";
import type { MateriaAcademica } from "@/lib/academico/academico-data";
import { salvarParametrosMateriaAction } from "@/lib/academico/actions";

// A aba "Ajustes": os PARÂMETROS do semestre — o que o plano de ensino diz,
// não o que aconteceu.
//
// Ficava escondido atrás de um botãozinho "Limite" dentro do cartão de faltas,
// e abria empurrando tudo pra baixo. Como é a primeira coisa que toda
// disciplina precisa (sem teto de faltas não existe contador, sem média de
// aprovação não existe projeção), virou aba própria.

export function AjustesPainel({
  materia,
  editavel,
  onSalvo,
}: {
  materia: MateriaAcademica;
  editavel: boolean;
  onSalvo: () => void;
}) {
  const [faltasMax, setFaltasMax] = useState(materia.faltasMax?.toString() ?? "");
  const [carga, setCarga] = useState(materia.cargaHoraria?.toString() ?? "");
  const [aulas, setAulas] = useState(materia.aulasPorSemana?.toString() ?? "");
  const [media, setMedia] = useState(materia.mediaAprovacao.toString());
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, startTransition] = useTransition();

  const sugestao = sugerirFaltasMax(carga ? Number(carga) : null, aulas ? Number(aulas) : null);

  function salvar() {
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      const res = await salvarParametrosMateriaAction({
        subjectId: materia.subjectId,
        faltasMax: faltasMax === "" ? null : Number(faltasMax),
        cargaHoraria: carga === "" ? null : Number(carga),
        aulasPorSemana: aulas === "" ? null : Number(aulas),
        mediaAprovacao: media === "" ? 6 : Number(media),
      });
      if ("error" in res) setErro(res.error);
      else {
        setSalvo(true);
        onSalvo();
      }
    });
  }

  if (!editavel) {
    return (
      <dl className="grid grid-cols-2 gap-3">
        <Leitura rotulo="Carga horária" valor={materia.cargaHoraria ? `${materia.cargaHoraria}h` : "—"} />
        <Leitura rotulo="Aulas por semana" valor={materia.aulasPorSemana?.toString() ?? "—"} />
        <Leitura rotulo="Máximo de faltas" valor={materia.faltasMax?.toString() ?? "—"} />
        <Leitura rotulo="Média pra passar" valor={materia.mediaAprovacao.toString()} />
      </dl>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section>
        <p className="kicker mb-2">Frequência</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Campo
            rotulo="Carga horária"
            dica="total em horas-aula"
            valor={carga}
            onChange={setCarga}
            placeholder="60"
            sufixo="h"
          />
          <Campo
            rotulo="Aulas/semana"
            dica="encontros por semana"
            valor={aulas}
            onChange={setAulas}
            placeholder="2"
          />
          <Campo
            rotulo="Máx. faltas"
            dica="o teto que reprova"
            valor={faltasMax}
            onChange={setFaltasMax}
            placeholder="—"
            destaque
          />
        </div>

        {/* A sugestão é oferecida, nunca imposta: o número real está no plano
            de ensino do professor, e várias universidades contam diferente. */}
        {sugestao != null && sugestao.toString() !== faltasMax && (
          <button
            type="button"
            onClick={() => setFaltasMax(String(sugestao))}
            className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-questly-green/10 px-2.5 py-1.5 text-left text-[11.5px] font-medium text-questly-green-dark transition-colors hover:bg-questly-green/18"
          >
            <Wand2 size={12} strokeWidth={2.2} />
            Pela regra dos 25%, dá {sugestao} {sugestao === 1 ? "falta" : "faltas"} — usar esse número
          </button>
        )}
      </section>

      <section className="border-t border-border pt-3.5">
        <p className="kicker mb-2">Aprovação</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Campo
            rotulo="Média pra passar"
            dica="na escala de 0 a 10"
            valor={media}
            onChange={setMedia}
            placeholder="6"
            destaque
          />
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
          As notas são convertidas pra escala 0–10 automaticamente, então uma prova que vale 100 pontos não
          muda esse campo.
        </p>
      </section>

      {erro && <p className="text-[12px] text-questly-red-dark">{erro}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={pendente}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-questly-green px-4 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:cursor-default disabled:opacity-60 dark:text-[#0c1512]"
        >
          {pendente ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.4} />}
          Salvar
        </button>
        {salvo && !pendente && (
          <span className="text-[12px] font-medium text-questly-green-dark">Salvo.</span>
        )}
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  dica,
  valor,
  onChange,
  placeholder,
  sufixo,
  destaque,
}: {
  rotulo: string;
  dica: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  sufixo?: string;
  destaque?: boolean;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11.5px] font-semibold leading-tight">{rotulo}</span>
      <span className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => onChange(e.target.value.replace(",", "."))}
          placeholder={placeholder}
          className={`tnum h-9 w-full min-w-0 rounded-lg border bg-card px-2 text-[13px] outline-none focus:border-questly-green ${
            destaque ? "border-questly-green/35 font-semibold" : "border-border"
          }`}
        />
        {sufixo && <span className="shrink-0 text-[11px] text-muted-foreground">{sufixo}</span>}
      </span>
      <span className="text-[10.5px] leading-tight text-muted-foreground">{dica}</span>
    </label>
  );
}

function Leitura({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="tnum text-[14px] font-semibold">{valor}</dd>
    </div>
  );
}
