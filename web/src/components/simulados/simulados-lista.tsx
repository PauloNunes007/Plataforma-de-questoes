"use client";

// Hub dos Simulados — enxugado em 2026-09-10 ("tá com muita informação até no
// hub dos simulados"). A página responde três perguntas, nessa ordem:
//   1. tem prova com o relógio correndo? (retomar)
//   2. quero montar outra (uma ação primária, sempre visível)
//   3. como eu venho indo? — três números e um link
//
// Os gráficos (evolução, por disciplina, mapa de calor, ritmo, tendência) NÃO
// moram mais aqui: eles são a página /simulados/desempenho inteira. O hub só
// mostra o suficiente pra decidir se vale abrir a análise.

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Crown,
  FileText,
  Lock,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import type { SimuladoResumo, StatusPlanoSimulado } from "@/lib/simulados/simulados-data";
import type { InstituicaoAgregada } from "@/lib/cursos/instituicao";
import { fmtDataCurta, fmtSegundos, tomDoPct } from "@/lib/simulados/analise";
import { CLASSE_BG_STATUS, CLASSE_TEXTO_STATUS } from "./graficos/base";

type Props = {
  historico: SimuladoResumo[];
  status: StatusPlanoSimulado;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  universidade: string | null;
  instituicoesDisponiveis: InstituicaoAgregada[];
};

export function SimuladosLista({
  historico,
  status,
  reconhecida,
  nomeInstituicao,
  universidade,
  instituicoesDisponiveis,
}: Props) {
  const semMovimento = useReducedMotion();
  const concluidos = useMemo(() => historico.filter((s) => s.status === "concluido"), [historico]);
  const emAndamento = useMemo(() => historico.filter((s) => s.status === "em_andamento"), [historico]);
  // 2026-09-16: a universidade do aluno NÃO decide mais se ele pode montar.
  // Quem não estuda numa faculdade com provas catalogadas monta com as
  // questões autorais (ou com as provas de outra universidade, de propósito) —
  // `reconhecida` sobrou só pra escolher o texto.
  const podeMontar = status.podeMontar;

  // Os três números do hub saem do próprio histórico — nenhuma análise pesada
  // é carregada aqui só pra pintar um resumo.
  const resumo = useMemo(() => {
    if (concluidos.length === 0) return null;
    const notas = concluidos.map((s) => Number(s.nota ?? 0));
    return {
      provas: concluidos.length,
      media: notas.reduce((a, b) => a + b, 0) / notas.length,
      melhor: Math.max(...notas),
      ultima: notas[0], // histórico vem do mais recente pro mais antigo
    };
  }, [concluidos]);

  const anim = semMovimento ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      {/* -------------------------------------------------------------- topo */}
      <motion.header {...anim} className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Simulados</h1>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            {reconhecida ? (
              <>
                Uma prova cronometrada com as provas de{" "}
                <b className="font-semibold text-foreground">{nomeInstituicao}</b>, questões autorais — ou as
                duas misturadas.
              </>
            ) : (
              <>Uma prova cronometrada. Você escolhe de onde saem as questões.</>
            )}
          </p>
        </div>
        {podeMontar && (
          <Link
            href="/simulados/montar"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-questly-green px-4 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
          >
            <Plus size={16} strokeWidth={2.5} /> Novo simulado
          </Link>
        )}
      </motion.header>

      {/* Em andamento vem PRIMEIRO: é a única coisa aqui com relógio correndo. */}
      {emAndamento.map((s) => (
        <Link
          key={s.id}
          href={`/simulados/${s.id}`}
          className="group surface flex items-center gap-3.5 border-questly-blue/35 p-4 transition-all hover:shadow-md"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-blue-light text-questly-blue-dark">
            <Play size={18} fill="currentColor" />
            {!semMovimento && (
              <motion.span
                className="absolute inset-0 rounded-xl border-2 border-questly-blue"
                animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.18, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{s.titulo}</p>
            <p className="tnum text-xs font-medium text-muted-foreground">
              {s.qtd_questoes} questões · {s.duracao_min}min · relógio correndo
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-questly-blue-dark">Continuar →</span>
        </Link>
      ))}

      {/* Sem provas da universidade do aluno: NOTA, não parede. Antes isto era o
          estado vazio que ocupava a tela e escondia a ação principal — e o
          aluno de fora da UFF concluía que simulado não era pra ele. Hoje ele
          monta do mesmo jeito; a nota só explica o que tem no banco e oferece
          a correção da universidade, que continua sendo a causa mais comum
          (grafia diferente ou campo em branco, não ausência de conteúdo). */}
      {!reconhecida && (
        <motion.div {...anim} className="surface flex flex-col gap-2.5 p-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {universidade ? (
              <>
                Ainda não temos provas de{" "}
                <b className="font-semibold text-foreground">{universidade}</b> catalogadas. Monte com as{" "}
                <b className="font-semibold text-foreground">questões autorais</b> — ou treine com as provas de
                outra universidade, se quiser.
              </>
            ) : (
              <>
                Você ainda não disse onde estuda. Dá pra montar com as{" "}
                <b className="font-semibold text-foreground">questões autorais</b> mesmo assim; com a
                universidade preenchida, as provas dela vêm marcadas por padrão.
              </>
            )}
          </p>

          {instituicoesDisponiveis.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">No banco hoje:</span>
              {instituicoesDisponiveis.slice(0, 6).map((i) => (
                <span
                  key={i.nome}
                  className="inline-flex items-center gap-1.5 rounded-full border border-questly-green/30 bg-questly-green/10 px-2.5 py-0.5 text-[12px] font-semibold text-questly-green-dark dark:text-questly-green"
                >
                  {i.nome}
                </span>
              ))}
            </div>
          )}

          <Link
            href="/configuracoes"
            className="inline-flex items-center gap-1 self-start text-[12.5px] font-bold text-questly-green-dark hover:underline dark:text-questly-green"
          >
            {universidade ? "Corrigir minha universidade" : "Definir minha universidade"}
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </motion.div>
      )}

      {/* Gate: free que estourou o limite da semana */}
      {!status.ehPro && !status.podeMontar && (
        <div className="surface flex flex-col gap-3 border-questly-gold/40 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-gold-light text-questly-gold-dark">
            <Lock size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Você usou seu simulado grátis da semana</p>
            <p className="text-xs font-medium text-muted-foreground">
              No Pro são ilimitados — simule quantas provas quiser.
            </p>
          </div>
          <Link
            href="/pro"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-questly-gold px-3.5 text-sm font-bold text-[#3a2c05] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <Sparkles size={15} /> Seja Pro
          </Link>
        </div>
      )}

      {/* --------------------------------------------------- como estou indo */}
      {resumo && (
        <motion.section {...anim} className="surface flex items-stretch divide-x divide-border">
          <Numero valor={resumo.ultima.toFixed(1)} rotulo="última nota" />
          <Numero valor={resumo.media.toFixed(1)} rotulo="média" />
          <Numero valor={resumo.melhor.toFixed(1)} rotulo="melhor" />
          <Link
            href="/simulados/desempenho"
            className="flex min-w-[86px] flex-col items-center justify-center gap-1 px-3 py-4 text-center text-questly-green-dark transition-colors hover:bg-muted/50 dark:text-questly-green"
          >
            <BarChart3 size={17} />
            <span className="text-[11.5px] font-bold leading-tight">Análise completa</span>
          </Link>
        </motion.section>
      )}

      {/* ---------------------------------------------------------- histórico */}
      <section className="flex flex-col gap-2">
        {concluidos.length > 0 && <span className="kicker">Suas provas</span>}
        {concluidos.length === 0 ? (
          <div className="surface flex flex-col items-center gap-2.5 p-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <FileText size={19} className="text-muted-foreground" strokeWidth={1.75} />
            </span>
            <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
              Escolha uma disciplina, de onde saem as questões e faça sua primeira prova cronometrada.
            </p>
            {podeMontar && (
              <Link
                href="/simulados/montar"
                className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-questly-green px-4 text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
              >
                <Plus size={16} strokeWidth={2.5} /> Montar meu primeiro simulado
              </Link>
            )}
          </div>
        ) : (
          concluidos.map((s) => {
            const nota = Number(s.nota ?? 0);
            const pct = s.total && s.total > 0 ? Math.round(((s.acertos ?? 0) / s.total) * 100) : 0;
            const tom = tomDoPct(pct);
            return (
              <Link
                key={s.id}
                href={`/simulados/${s.id}`}
                className="group surface-interativa flex items-center gap-3.5 p-3.5"
              >
                <span
                  className={`tnum flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-heading text-[15px] font-bold ${CLASSE_BG_STATUS[tom]} ${CLASSE_TEXTO_STATUS[tom]}`}
                >
                  {nota.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{s.titulo}</p>
                  <p className="tnum flex flex-wrap items-center gap-x-2.5 text-xs font-medium text-muted-foreground">
                    <span>{fmtDataCurta(s.criado_em)}</span>
                    <span>
                      {s.acertos}/{s.total} acertos
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {fmtSegundos(s.tempo_gasto_seg)}
                    </span>
                  </p>
                </div>
                <ArrowRight
                  size={17}
                  strokeWidth={2}
                  className="shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            );
          })
        )}
      </section>

      {/* Limite do plano vira uma linha discreta no rodapé — informação de
          contexto, não um cartão competindo com a ação principal. */}
      <p className="tnum flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
        {status.ehPro ? (
          <>
            <Crown size={12} className="text-questly-gold-dark" /> Pro · simulados ilimitados
          </>
        ) : (
          <>
            {status.restantes} de {status.limite} simulados grátis nesta semana ·{" "}
            <Link href="/pro" className="font-bold text-questly-green-dark hover:underline dark:text-questly-green">
              ver o Pro
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-4">
      <span className="tnum font-heading text-[22px] font-bold leading-none">{valor}</span>
      <span className="text-[11px] font-medium text-muted-foreground">{rotulo}</span>
    </div>
  );
}
