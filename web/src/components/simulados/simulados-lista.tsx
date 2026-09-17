"use client";

// Hub dos Simulados — reorganizado em 2026-09-17 ("tá uma verdadeira
// bagunça"): antes era UMA pilha vertical em que a prova em andamento, as duas
// portas de entrada, a nota sobre a universidade, o aviso de plano, o resumo e
// TODAS as provas antigas tinham o mesmo peso visual e se sucediam sem
// separação. Com 15 simulados no histórico, a tela virava um paredão.
//
// Agora a página responde quatro perguntas, nessa ordem, cada uma num bloco
// com título próprio:
//   1. tem prova com o relógio correndo?      → Retomar (só se existir)
//   2. como eu começo uma?                    → Começar (DUAS portas, mesmo peso)
//   3. como eu venho indo?                    → três números + link
//   4. o que eu já fiz?                       → histórico DOBRADO (ver abaixo)
//
// O histórico mostra as 6 mais recentes e esconde o resto atrás de "ver
// todas": o valor de uma prova de dois meses atrás é de consulta, não de
// navegação, e ela não pode empurrar as ações pra fora da tela.
//
// Os gráficos (evolução, por disciplina, mapa de calor, ritmo, tendência) NÃO
// moram aqui: são a página /simulados/desempenho inteira.

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Clock,
  Crown,
  FileCheck2,
  FileText,
  Lock,
  Play,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { SimuladoResumo, StatusPlanoSimulado } from "@/lib/simulados/simulados-data";
import type { InstituicaoAgregada } from "@/lib/cursos/instituicao";
import { fmtDataCurta, fmtSegundos, tomDoPct } from "@/lib/simulados/analise";
import { CLASSE_BG_STATUS, CLASSE_TEXTO_STATUS } from "./graficos/base";

/** Quantas provas concluídas aparecem antes do "ver todas". */
const HISTORICO_VISIVEL = 6;

type Props = {
  historico: SimuladoResumo[];
  status: StatusPlanoSimulado;
  reconhecida: boolean;
  nomeInstituicao: string | null;
  universidade: string | null;
  instituicoesDisponiveis: InstituicaoAgregada[];
  /** quantas provas antigas oficiais existem no acervo (0 esconde a porta) */
  provasOficiais: number;
};

export function SimuladosLista({
  historico,
  status,
  reconhecida,
  nomeInstituicao,
  universidade,
  instituicoesDisponiveis,
  provasOficiais,
}: Props) {
  const semMovimento = useReducedMotion();
  const [verTodas, setVerTodas] = useState(false);

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

  const visiveis = verTodas ? concluidos : concluidos.slice(0, HISTORICO_VISIVEL);
  const escondidas = concluidos.length - visiveis.length;
  const anim = semMovimento ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="casca-media flex flex-col gap-7 py-6 lg:py-8">
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

      {/* ----------------------------------------------------------- retomar */}
      {/* Vem PRIMEIRO: é a única coisa da página com relógio correndo. Várias
          provas abertas viram linhas de uma lista só, não N cartões cheios —
          empilhar cartões grandes era metade da bagunça. */}
      {emAndamento.length > 0 && (
        <motion.section {...anim} className="flex flex-col gap-2">
          <span className="kicker">Retomar</span>
          <div className="surface divide-y divide-border border-questly-blue/35 p-0">
            {emAndamento.map((s) => (
              <Link
                key={s.id}
                href={`/simulados/${s.id}`}
                className="group flex items-center gap-3.5 p-4 transition-colors hover:bg-muted/40"
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
          </div>
        </motion.section>
      )}

      {/* ---------------------------------------------------------- começar */}
      {/* As DUAS portas, lado a lado e com o mesmo peso: "quero uma prova com
          estas características" e "quero a prova que caiu". Antes a segunda
          era um cartão solto no meio da pilha e o aluno não entendia que eram
          caminhos alternativos pra mesma coisa. */}
      <motion.section {...anim} className="flex flex-col gap-2">
        <span className="kicker">Começar uma prova</span>
        <div className={`grid gap-2.5 ${provasOficiais > 0 ? "sm:grid-cols-2" : ""}`}>
          <PortaSimulado
            href="/simulados/montar"
            desabilitada={!podeMontar}
            icone={<SlidersHorizontal size={19} />}
            titulo="Montar do meu jeito"
            descricao="Você escolhe a disciplina, os tópicos, de onde saem as questões e a duração."
            tom="verde"
          />
          {provasOficiais > 0 && (
            <PortaSimulado
              href="/simulados/provas"
              icone={<FileCheck2 size={19} />}
              titulo="Provas antigas"
              descricao={`${provasOficiais} provas reais, inteiras e na ordem original — com ranking entre quem fez.`}
              tom="azul"
            />
          )}
        </div>

        {/* Sem provas da universidade do aluno: NOTA, não parede. Virou uma
            linha embaixo das portas — antes era um cartão do tamanho delas,
            competindo por atenção com a ação que a página existe pra oferecer. */}
        {!reconhecida && (
          <details className="surface group p-0 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[12.5px] font-medium text-muted-foreground">
              <ChevronDown
                size={14}
                className="shrink-0 transition-transform group-open:rotate-180"
              />
              {universidade
                ? `Ainda não temos provas de ${universidade} catalogadas`
                : "Você ainda não disse onde estuda"}
            </summary>
            <div className="flex flex-col gap-2.5 border-t border-border px-4 py-3">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {universidade ? (
                  <>
                    Monte com as <b className="font-semibold text-foreground">questões autorais</b> — ou treine
                    com as provas de outra universidade, se quiser. A causa mais comum é grafia diferente no
                    cadastro, não falta de conteúdo.
                  </>
                ) : (
                  <>
                    Dá pra montar com as <b className="font-semibold text-foreground">questões autorais</b>{" "}
                    mesmo assim; com a universidade preenchida, as provas dela vêm marcadas por padrão.
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
            </div>
          </details>
        )}

        {/* Gate: free que estourou o limite da semana. Fica aqui, colado nas
            portas, porque é sobre PODER começar — não sobre o histórico. */}
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
      </motion.section>

      {/* --------------------------------------------------- como estou indo */}
      {resumo && (
        <motion.section {...anim} className="flex flex-col gap-2">
          <span className="kicker">Como você vem indo</span>
          <div className="surface flex items-stretch divide-x divide-border">
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
          </div>
        </motion.section>
      )}

      {/* ---------------------------------------------------------- histórico */}
      <section className="flex flex-col gap-2">
        {concluidos.length > 0 && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="kicker">Suas provas</span>
            <span className="tnum text-[12px] font-medium text-muted-foreground">
              {concluidos.length} {concluidos.length === 1 ? "concluída" : "concluídas"}
            </span>
          </div>
        )}

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
          <>
            {/* Duas colunas a partir de lg: cada prova é uma linha curta (nota,
                título, data), e uma só coluna numa casca larga deixava metros
                de vazio à direita de cada uma. */}
            <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-2.5">
              {visiveis.map((s) => (
                <LinhaProva key={s.id} s={s} />
              ))}
            </div>

            {escondidas > 0 && (
              <button
                type="button"
                onClick={() => setVerTodas(true)}
                className="mt-1 inline-flex min-h-10 items-center justify-center gap-1.5 self-center rounded-xl border border-border px-4 text-[12.5px] font-bold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
              >
                <ChevronDown size={14} strokeWidth={2.2} />
                Ver as outras {escondidas} {escondidas === 1 ? "prova" : "provas"}
              </button>
            )}
          </>
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

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

/** Uma das portas de entrada. Desabilitada vira caixa morta com o mesmo texto:
 *  sumir com ela mudaria o layout e deixaria o aluno sem entender o que perdeu. */
function PortaSimulado({
  href,
  icone,
  titulo,
  descricao,
  tom,
  desabilitada = false,
}: {
  href: string;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  tom: "verde" | "azul";
  desabilitada?: boolean;
}) {
  const cor =
    tom === "verde"
      ? "bg-questly-green-light text-questly-green-dark"
      : "bg-questly-blue-light text-questly-blue-dark";

  const conteudo = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cor}`}>
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold">{titulo}</span>
        <span className="mt-0.5 block text-[12px] font-medium leading-snug text-muted-foreground">
          {descricao}
        </span>
      </span>
      {!desabilitada && (
        <ArrowRight
          size={17}
          className="mt-0.5 shrink-0 self-start text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </>
  );

  if (desabilitada) {
    return <div className="surface flex items-start gap-3.5 p-4 opacity-55">{conteudo}</div>;
  }
  return (
    <Link href={href} className="group surface-interativa flex items-start gap-3.5 p-4">
      {conteudo}
    </Link>
  );
}

function LinhaProva({ s }: { s: SimuladoResumo }) {
  const nota = Number(s.nota ?? 0);
  const pct = s.total && s.total > 0 ? Math.round(((s.acertos ?? 0) / s.total) * 100) : 0;
  const tom = tomDoPct(pct);
  return (
    <Link href={`/simulados/${s.id}`} className="group surface-interativa flex items-center gap-3.5 p-3.5">
      <span
        className={`tnum flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-heading text-[15px] font-bold ${CLASSE_BG_STATUS[tom]} ${CLASSE_TEXTO_STATUS[tom]}`}
      >
        {nota.toFixed(1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold">
          <span className="truncate">{s.titulo}</span>
          {s.prova_codigo && (
            <span className="shrink-0 rounded bg-questly-green/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-questly-green-dark dark:text-questly-green">
              prova real
            </span>
          )}
        </p>
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
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-4">
      <span className="tnum font-heading text-[22px] font-bold leading-none">{valor}</span>
      <span className="text-[11px] font-medium text-muted-foreground">{rotulo}</span>
    </div>
  );
}
