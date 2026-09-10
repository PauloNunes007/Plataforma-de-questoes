"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Layers, MousePointerClick, Sparkles, Zap } from "lucide-react";
import type { PreviaPratica } from "@/lib/disciplinas/actions";
import { plural } from "@/lib/questly/shared";

// Resumo da prática — o painel que fecha o wizard do Banco de Questões.
// Redesign 2026-09: o número que importa (quantas questões você vai fazer)
// virou o herói do card, XP e tempo viraram duas métricas lado a lado em vez
// de linhas soltas de texto, e a lista de filtros virou chips discretos.
export function ResumoPratica({
  disciplinaNome,
  topicosLabel,
  dificuldadeLabel,
  quantidadeLabel,
  previa,
  carregandoPrevia,
  podeComecar,
  iniciando,
  onComecar,
}: {
  disciplinaNome: string | null;
  topicosLabel: string;
  dificuldadeLabel: string;
  quantidadeLabel: string;
  previa: PreviaPratica | null;
  carregandoPrevia: boolean;
  podeComecar: boolean;
  iniciando: boolean;
  onComecar: () => void;
}) {
  if (!disciplinaNome) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center xl:sticky xl:top-24">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <MousePointerClick size={19} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="text-[13.5px] font-medium">Escolha uma disciplina</p>
        <p className="mt-1 max-w-[220px] text-[12px] leading-relaxed text-muted-foreground">
          O resumo da sua prática aparece aqui, com XP e tempo estimados.
        </p>
      </div>
    );
  }

  const temQuestoes = Boolean(previa && previa.selecionadas > 0);

  return (
    <div className="surface overflow-hidden rounded-2xl xl:sticky xl:top-24">
      {/* Cabeçalho em degradê de marca — separa o resumo do resto da página */}
      <div className="relative overflow-hidden bg-gradient-to-br from-questly-green to-questly-blue px-5 py-4 text-white">
        <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <span className="relative flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.09em] text-white/80">
          <Sparkles size={12} strokeWidth={2.5} />
          Missão avulsa
        </span>
        <h3 className="relative mt-1 truncate font-heading text-[17px] font-bold leading-tight">
          {disciplinaNome}
        </h3>
      </div>

      <div className="p-5">
        {/* Herói: quantas questões você vai encarar agora */}
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-4 text-center">
          {carregandoPrevia ? (
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-muted-foreground/15" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted-foreground/15" />
            </div>
          ) : previa && temQuestoes ? (
            <motion.div
              key={`${previa.selecionadas}-${previa.xpEstimado}`}
              initial={{ opacity: 0.5, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="tnum font-heading text-[38px] font-bold leading-none tracking-tight">
                  {previa.selecionadas}
                </span>
                <span className="text-[13px] font-semibold text-muted-foreground">
                  {plural(previa.selecionadas, "questão", "questões")}
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {previa.selecionadas < previa.total
                  ? `sorteadas de ${previa.total.toLocaleString("pt-BR")} disponíveis`
                  : `é tudo que o banco tem com esses filtros`}
              </p>
            </motion.div>
          ) : (
            <p className="py-2 text-[12.5px] text-muted-foreground">
              Nenhuma questão com esse filtro. Marque mais tópicos ou solte a dificuldade.
            </p>
          )}
        </div>

        {/* XP e tempo, lado a lado */}
        {temQuestoes && previa && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Metrica
              icone={<Zap size={13} strokeWidth={2.5} />}
              rotulo="XP em jogo"
              valor={`+${previa.xpEstimado.toLocaleString("pt-BR")}`}
              corIcone="bg-questly-gold-light text-questly-gold-dark"
              carregando={carregandoPrevia}
            />
            <Metrica
              icone={<Clock size={13} strokeWidth={2.5} />}
              rotulo="Tempo estimado"
              valor={`~${previa.tempoEstimadoMin} min`}
              corIcone="bg-questly-blue-light text-questly-blue-dark"
              carregando={carregandoPrevia}
            />
          </div>
        )}

        {/* Mistura de dificuldade do pool — barra fina, sem legenda pesada */}
        {temQuestoes && previa && <MixDificuldade previa={previa} />}

        {/* Filtros escolhidos, em chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip icone={<Layers size={11} strokeWidth={2.25} />}>{topicosLabel}</Chip>
          <Chip>{dificuldadeLabel}</Chip>
          <Chip>{quantidadeLabel}</Chip>
        </div>

        <button
          type="button"
          onClick={onComecar}
          disabled={!podeComecar || iniciando}
          className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-green px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:text-[#0c1512]"
        >
          {iniciando ? "Preparando..." : "Começar prática"}
          {!iniciando && <ArrowRight size={15} strokeWidth={2.25} />}
        </button>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
          Treino extra: não ocupa a missão do dia, mas conta XP e cobertura do Boss do mesmo jeito.
        </p>
      </div>
    </div>
  );
}

function Metrica({
  icone,
  rotulo,
  valor,
  corIcone,
  carregando,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  corIcone: string;
  carregando: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <span className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-lg ${corIcone}`}>
        {icone}
      </span>
      <span className="block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {rotulo}
      </span>
      {carregando ? (
        <span className="mt-1 block h-4 w-14 animate-pulse rounded bg-muted" />
      ) : (
        <span className="tnum block text-[15px] font-semibold tracking-tight">{valor}</span>
      )}
    </div>
  );
}

const MIX = [
  { chave: "facil" as const, rotulo: "Fácil", cor: "bg-questly-green" },
  { chave: "medio" as const, rotulo: "Médio", cor: "bg-questly-orange" },
  { chave: "dificil" as const, rotulo: "Difícil", cor: "bg-questly-red" },
];

function MixDificuldade({ previa }: { previa: PreviaPratica }) {
  const total = previa.total || 1;
  const presentes = MIX.filter((m) => previa.porDificuldade[m.chave] > 0);
  if (presentes.length <= 1) return null;

  return (
    <div className="mt-3">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {presentes.map((m) => (
          <span
            key={m.chave}
            className={m.cor}
            style={{ width: `${(previa.porDificuldade[m.chave] / total) * 100}%` }}
            title={`${previa.porDificuldade[m.chave]} ${plural(previa.porDificuldade[m.chave], "questão", "questões")} ${m.rotulo.toLowerCase()}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {presentes.map((m) => (
          <span key={m.chave} className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${m.cor}`} />
            <span className="tnum">{previa.porDificuldade[m.chave]}</span> {m.rotulo.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function Chip({ icone, children }: { icone?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
      {icone}
      <span className="truncate">{children}</span>
    </span>
  );
}
