"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  Circle,
  Flag,
  NotebookPen,
  PenLine,
  Pencil,
  Target,
  Timer,
} from "lucide-react";
import { ajustarMetaAtualAction, alternarBlocoAction, salvarMetasAction } from "@/lib/aprovacao/actions";
import { PROVAS_ALVO } from "@/lib/aprovacao/constantes";
import type { BlocoDoDia, DadosHoje, MetaMensal } from "@/lib/aprovacao/tipos";

// Dashboard "Hoje" do Modo Aprovação: grade horária do dia (com
// checkbox persistido em sessoes_estudo), tópico da semana por
// disciplina (cronograma S1–S14), countdown pras provas e os cards de
// revisões pendentes / obras / metas do mês.

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diasAte(alvo: string, hoje: string): number {
  return Math.round((parseISO(alvo).getTime() - parseISO(hoje).getTime()) / 86400000);
}

function formatarDataLonga(iso: string): string {
  return parseISO(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function formatarDataCurta(iso: string): string {
  return parseISO(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function HojeView({ dados }: { dados: DadosHoje }) {
  const dataLonga = formatarDataLonga(dados.hoje);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: data + semana do plano + countdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="surface flex flex-col justify-center gap-1 p-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Modo Aprovação
          </span>
          <h2 className="font-heading text-[24px] font-semibold capitalize tracking-tight">{dataLonga}</h2>
          {dados.semanaPlano ? (
            <span className="text-[13px] text-muted-foreground">
              Semana <strong className="text-foreground">S{dados.semanaPlano}</strong> do plano (S1–S14)
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">O plano semanal começa em 14/jul/2026.</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PROVAS_ALVO.map((prova) => {
            const dias = diasAte(prova.data, dados.hoje);
            return (
              <div
                key={prova.id}
                className="surface flex min-w-[150px] flex-col items-center justify-center gap-0.5 border-questly-orange/25 p-5 text-center"
              >
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-questly-orange">
                  <Flag size={13} strokeWidth={2.25} /> {prova.nome}
                </span>
                <span className="tnum font-heading text-[34px] font-bold leading-none tracking-tight">
                  {Math.max(dias, 0)}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  dias · {prova.detalhe} em {formatarDataCurta(prova.data)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <GradeDoDia dados={dados} />
          <TopicosDaSemana dados={dados} />
        </div>

        <div className="flex flex-col gap-4">
          <CardRevisoes pendentes={dados.revisoesPendentes} />
          <CardObras concluidas={dados.obrasConcluidas} total={dados.obrasTotal} />
          <CardMetas hoje={dados.hoje} metasIniciais={dados.metas} />
        </div>
      </div>
    </div>
  );
}

function GradeDoDia({ dados }: { dados: DadosHoje }) {
  const [blocos, setBlocos] = useState<BlocoDoDia[]>(dados.blocos);
  const ehDomingo = dados.diaSemana === 0;

  async function alternar(bloco: BlocoDoDia) {
    const novoValor = !bloco.concluido;
    setBlocos((lista) => lista.map((b) => (b.bloco === bloco.bloco ? { ...b, concluido: novoValor } : b)));
    const res = await alternarBlocoAction({
      data: dados.hoje,
      bloco: bloco.bloco,
      disciplina: bloco.titulo,
      tipo: bloco.tipo,
      concluido: novoValor,
    });
    if (!res.ok) {
      setBlocos((lista) => lista.map((b) => (b.bloco === bloco.bloco ? { ...b, concluido: !novoValor } : b)));
    }
  }

  return (
    <section className="surface p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-[15px] font-semibold">
          <CalendarClock size={16} strokeWidth={2} className="text-questly-blue" />
          Grade de hoje
        </h3>
        <span className="tnum text-[12px] font-medium text-muted-foreground">
          {blocos.filter((b) => b.concluido).length}/{blocos.length} concluídos
        </span>
      </div>

      {ehDomingo ? (
        <button
          type="button"
          onClick={() => blocos[0] && void alternar(blocos[0])}
          className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 p-5 text-left transition-all active:scale-[0.99] ${
            blocos[0]?.concluido
              ? "border-questly-green/40 bg-questly-green/8"
              : "border-questly-orange/40 bg-questly-orange/8 hover:border-questly-orange/60"
          }`}
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${
              blocos[0]?.concluido ? "bg-questly-green" : "bg-questly-orange"
            }`}
          >
            <Timer size={22} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-[16px] font-semibold">
              SIMULADO · 9h–14h
            </span>
            <span className="block text-[13px] text-muted-foreground">
              {dados.simuladoDoDia
                ? `${dados.simuladoDoDia.prova}${dados.simuladoDoDia.funcao ? ` — ${dados.simuladoDoDia.funcao}` : ""}`
                : "Nenhuma prova designada na escada pra hoje — veja a próxima em Simulados."}
            </span>
          </span>
          {blocos[0]?.concluido ? (
            <CheckCircle2 size={24} strokeWidth={2} className="shrink-0 text-questly-green" />
          ) : (
            <Circle size={24} strokeWidth={1.5} className="shrink-0 text-muted-foreground/50" />
          )}
        </button>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {blocos.map((bloco) => (
            <li key={bloco.bloco}>
              <button
                type="button"
                onClick={() => void alternar(bloco)}
                aria-pressed={bloco.concluido}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                  bloco.concluido
                    ? "border-questly-green/30 bg-questly-green/6"
                    : "border-border hover:border-questly-blue/40 hover:bg-muted/40"
                }`}
              >
                <span className="tnum w-14 shrink-0 rounded-lg bg-muted px-2 py-1 text-center text-[12px] font-bold text-muted-foreground">
                  {bloco.horario}
                </span>
                <span
                  className={`min-w-0 flex-1 text-[14px] font-semibold ${
                    bloco.concluido ? "text-muted-foreground line-through decoration-questly-green/60" : ""
                  }`}
                >
                  {bloco.titulo}
                  {bloco.tipo === "obra" && (
                    <BookOpenText size={13} strokeWidth={2} className="ml-1.5 inline text-questly-purple" />
                  )}
                  {bloco.tipo === "redacao" && (
                    <PenLine size={13} strokeWidth={2} className="ml-1.5 inline text-questly-blue" />
                  )}
                </span>
                {bloco.concluido ? (
                  <CheckCircle2 size={20} strokeWidth={2} className="shrink-0 text-questly-green" />
                ) : (
                  <Circle size={20} strokeWidth={1.5} className="shrink-0 text-muted-foreground/40" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TopicosDaSemana({ dados }: { dados: DadosHoje }) {
  if (!dados.semanaPlano || dados.topicosSemana.length === 0) return null;
  return (
    <section className="surface p-5">
      <h3 className="mb-3.5 flex items-center gap-2 font-heading text-[15px] font-semibold">
        <Target size={16} strokeWidth={2} className="text-questly-green" />
        Tópicos da semana S{dados.semanaPlano}
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dados.topicosSemana.map((t) => (
          <div key={t.disciplina} className="rounded-xl border border-border bg-muted/30 p-3">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {t.disciplina}
            </span>
            <span className="mt-0.5 block text-[13px] font-medium leading-snug">{t.topico}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardRevisoes({ pendentes }: { pendentes: number }) {
  return (
    <Link
      href="/aprovacao/erros"
      className="surface group flex items-center gap-3.5 p-4 transition-all hover:border-questly-orange/40 hover:shadow-md"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          pendentes > 0 ? "bg-questly-orange/12 text-questly-orange" : "bg-questly-green/10 text-questly-green"
        }`}
      >
        <NotebookPen size={18} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">
          {pendentes > 0 ? `${pendentes} revisão(ões) pendente(s)` : "Revisões em dia"}
        </span>
        <span className="block text-[12.5px] text-muted-foreground">
          {pendentes > 0 ? "Erros com refazer vencido no caderno." : "Nenhum erro com refazer vencido."}
        </span>
      </span>
      <ArrowRight
        size={17}
        strokeWidth={2}
        className="shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </Link>
  );
}

function CardObras({ concluidas, total }: { concluidas: number; total: number }) {
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  return (
    <Link
      href="/aprovacao/obras"
      className="surface group flex flex-col gap-2.5 p-4 transition-all hover:border-questly-purple/40 hover:shadow-md"
    >
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          <BookOpenText size={16} strokeWidth={1.9} className="text-questly-purple" />
          Obras literárias
        </span>
        <span className="tnum text-[13px] font-bold">
          {concluidas}<span className="font-medium text-muted-foreground">/{total}</span>
        </span>
      </span>
      <span className="block h-2 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-questly-purple transition-all" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[12px] text-muted-foreground">{pct}% do cronograma de leitura</span>
    </Link>
  );
}

function CardMetas({ hoje, metasIniciais }: { hoje: string; metasIniciais: MetaMensal | null }) {
  const [y, m] = hoje.split("-").map(Number);
  const vazia: MetaMensal = {
    mes: m,
    ano: y,
    metaAcertosSimulado: null,
    metaRedacoes: null,
    metaObras: null,
    acertosAtual: 0,
    redacoesAtual: 0,
    obrasAtual: 0,
  };
  const [metas, setMetas] = useState<MetaMensal>(metasIniciais ?? vazia);
  const [editando, setEditando] = useState(false);
  const [fAcertos, setFAcertos] = useState(metas.metaAcertosSimulado ? String(metas.metaAcertosSimulado) : "");
  const [fRedacoes, setFRedacoes] = useState(metas.metaRedacoes ? String(metas.metaRedacoes) : "");
  const [fObras, setFObras] = useState(metas.metaObras ? String(metas.metaObras) : "");

  const nomeMes = parseISO(hoje).toLocaleDateString("pt-BR", { month: "long" });

  async function salvar() {
    const novas = {
      ...metas,
      metaAcertosSimulado: fAcertos ? Number(fAcertos) : null,
      metaRedacoes: fRedacoes ? Number(fRedacoes) : null,
      metaObras: fObras ? Number(fObras) : null,
    };
    setMetas(novas);
    setEditando(false);
    await salvarMetasAction({
      mes: metas.mes,
      ano: metas.ano,
      metaAcertosSimulado: novas.metaAcertosSimulado,
      metaRedacoes: novas.metaRedacoes,
      metaObras: novas.metaObras,
    });
  }

  async function ajustarRedacoes(delta: number) {
    const valor = Math.max(0, metas.redacoesAtual + delta);
    setMetas((v) => ({ ...v, redacoesAtual: valor }));
    await ajustarMetaAtualAction({ mes: metas.mes, ano: metas.ano, campo: "redacoes_atual", valor });
  }

  const linhas = [
    { rotulo: "Acertos no simulado", atual: metas.acertosAtual, meta: metas.metaAcertosSimulado, ajuste: false },
    { rotulo: "Redações escritas", atual: metas.redacoesAtual, meta: metas.metaRedacoes, ajuste: true },
    { rotulo: "Obras lidas", atual: metas.obrasAtual, meta: metas.metaObras, ajuste: false },
  ];

  return (
    <section className="surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Target size={16} strokeWidth={1.9} className="text-questly-green" />
          Metas de <span className="capitalize">{nomeMes}</span>
        </h3>
        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          aria-label="Editar metas"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil size={13} strokeWidth={2} />
        </button>
      </div>

      {editando ? (
        <div className="flex flex-col gap-2.5">
          {[
            { rotulo: "Meta de acertos no simulado", valor: fAcertos, set: setFAcertos },
            { rotulo: "Meta de redações no mês", valor: fRedacoes, set: setFRedacoes },
            { rotulo: "Meta de obras no mês", valor: fObras, set: setFObras },
          ].map((campo) => (
            <label key={campo.rotulo} className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-muted-foreground">{campo.rotulo}</span>
              <input
                type="number"
                min={0}
                value={campo.valor}
                onChange={(e) => campo.set(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus:border-questly-green/60"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => void salvar()}
            className="mt-1 cursor-pointer rounded-lg bg-questly-green px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            Salvar metas
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {linhas.map((linha) => {
            const pct =
              linha.meta && linha.meta > 0 ? Math.min(100, Math.round((linha.atual / linha.meta) * 100)) : null;
            return (
              <li key={linha.rotulo}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium">{linha.rotulo}</span>
                  <span className="tnum flex items-center gap-1 font-semibold">
                    {linha.ajuste && (
                      <button
                        type="button"
                        onClick={() => void ajustarRedacoes(-1)}
                        aria-label="Diminuir"
                        className="cursor-pointer rounded px-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        −
                      </button>
                    )}
                    {linha.atual}
                    <span className="font-medium text-muted-foreground">/{linha.meta ?? "—"}</span>
                    {linha.ajuste && (
                      <button
                        type="button"
                        onClick={() => void ajustarRedacoes(1)}
                        aria-label="Aumentar"
                        className="cursor-pointer rounded px-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        +
                      </button>
                    )}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${pct !== null ? "bg-questly-green" : "bg-muted"}`}
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
